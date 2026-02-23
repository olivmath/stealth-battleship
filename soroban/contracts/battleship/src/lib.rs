#![no_std]

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, log, symbol_short,
    Address, Bytes, Env, Symbol,
};

// ─── Game Hub interface (cross-contract calls) ───

#[contractclient(name = "GameHubClient")]
pub trait GameHub {
    fn start_game(env: Env, session_id: u32, player1: Address, player2: Address);
    fn end_game(env: Env, session_id: u32, winner: Address);
}

// ─── Storage keys ───

const VK_BOARD: Symbol = symbol_short!("vk_board");
const VK_TURNS: Symbol = symbol_short!("vk_turns");
const ADMIN: Symbol = symbol_short!("admin");
const GAME_HUB: Symbol = symbol_short!("game_hub");
const SESSION_CTR: Symbol = symbol_short!("sess_ctr");

// ─── Types ───

#[contracttype]
#[derive(Clone, Debug)]
pub struct MatchState {
    pub player1: Address,
    pub player2: Address,
    pub open_tx_ledger: u32,
    pub closed: bool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotAdmin = 1,
    VerificationFailed = 2,
    MatchNotFound = 3,
    MatchAlreadyClosed = 4,
    VkNotSet = 5,
}

// ─── Contract ───

#[contract]
pub struct BattleshipVerifier;

#[contractimpl]
impl BattleshipVerifier {
    /// Deploy-time constructor: stores admin, game hub address, and both VKs.
    pub fn __constructor(
        env: Env,
        admin: Address,
        game_hub: Address,
        vk_board_validity: Bytes,
        vk_turns_proof: Bytes,
    ) {
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&GAME_HUB, &game_hub);
        env.storage().instance().set(&VK_BOARD, &vk_board_validity);
        env.storage().instance().set(&VK_TURNS, &vk_turns_proof);
        env.storage().instance().set(&SESSION_CTR, &0u32);
        log!(&env, "BattleshipVerifier deployed");
    }

    /// Verify both players' board_validity proofs and open a match on Game Hub.
    /// Only callable by admin (backend server).
    /// Returns the session_id.
    pub fn open_match(
        env: Env,
        p1: Address,
        p2: Address,
        proof1: Bytes,
        pub_inputs1: Bytes,
        proof2: Bytes,
        pub_inputs2: Bytes,
    ) -> Result<u32, Error> {
        // Admin auth
        let admin: Address = env.storage().instance().get(&ADMIN).ok_or(Error::NotAdmin)?;
        admin.require_auth();

        // Get board_validity VK
        let vk: Bytes = env
            .storage()
            .instance()
            .get(&VK_BOARD)
            .ok_or(Error::VkNotSet)?;

        // Verify player 1 board proof
        let ok1 =
            ultrahonk_soroban_verifier::verify(&env, vk.clone(), proof1, pub_inputs1);
        if !ok1 {
            log!(&env, "Player 1 board proof verification failed");
            return Err(Error::VerificationFailed);
        }

        // Verify player 2 board proof
        let ok2 =
            ultrahonk_soroban_verifier::verify(&env, vk, proof2, pub_inputs2);
        if !ok2 {
            log!(&env, "Player 2 board proof verification failed");
            return Err(Error::VerificationFailed);
        }

        // Increment session counter
        let session_id: u32 = env
            .storage()
            .instance()
            .get(&SESSION_CTR)
            .unwrap_or(0u32)
            + 1;
        env.storage().instance().set(&SESSION_CTR, &session_id);

        // Store match state (temporary, 30-day TTL ≈ 518400 ledgers at 5s)
        let match_state = MatchState {
            player1: p1.clone(),
            player2: p2.clone(),
            open_tx_ledger: env.ledger().sequence(),
            closed: false,
        };
        env.storage().temporary().set(&session_id, &match_state);
        env.storage()
            .temporary()
            .extend_ttl(&session_id, 518_400, 518_400);

        // Cross-contract call: game_hub.start_game(session_id, p1, p2)
        let game_hub_addr: Address = env.storage().instance().get(&GAME_HUB).unwrap();
        let client = GameHubClient::new(&env, &game_hub_addr);
        client.start_game(&session_id, &p1, &p2);

        log!(&env, "Match opened: session_id={}", session_id);
        Ok(session_id)
    }

    /// Verify turns_proof and close a match on Game Hub.
    /// Only callable by admin (backend server).
    pub fn close_match(
        env: Env,
        session_id: u32,
        proof: Bytes,
        pub_inputs: Bytes,
        player1_won: bool,
    ) -> Result<(), Error> {
        // Admin auth
        let admin: Address = env.storage().instance().get(&ADMIN).ok_or(Error::NotAdmin)?;
        admin.require_auth();

        // Load match state
        let mut match_state: MatchState = env
            .storage()
            .temporary()
            .get(&session_id)
            .ok_or(Error::MatchNotFound)?;

        if match_state.closed {
            return Err(Error::MatchAlreadyClosed);
        }

        // Get turns_proof VK
        let vk: Bytes = env
            .storage()
            .instance()
            .get(&VK_TURNS)
            .ok_or(Error::VkNotSet)?;

        // Verify turns proof
        let ok = ultrahonk_soroban_verifier::verify(&env, vk, proof, pub_inputs);
        if !ok {
            log!(&env, "Turns proof verification failed");
            return Err(Error::VerificationFailed);
        }

        // Mark closed
        match_state.closed = true;
        env.storage().temporary().set(&session_id, &match_state);

        // Cross-contract call: game_hub.end_game(session_id, winner)
        let winner = if player1_won {
            match_state.player1.clone()
        } else {
            match_state.player2.clone()
        };
        let game_hub_addr: Address = env.storage().instance().get(&GAME_HUB).unwrap();
        let client = GameHubClient::new(&env, &game_hub_addr);
        client.end_game(&session_id, &winner);

        log!(
            &env,
            "Match closed: session_id={}, winner={}",
            session_id,
            winner
        );
        Ok(())
    }

    // ─── Read-only helpers ───

    pub fn get_match(env: Env, session_id: u32) -> Result<MatchState, Error> {
        env.storage()
            .temporary()
            .get(&session_id)
            .ok_or(Error::MatchNotFound)
    }

    pub fn get_session_counter(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&SESSION_CTR)
            .unwrap_or(0u32)
    }
}
