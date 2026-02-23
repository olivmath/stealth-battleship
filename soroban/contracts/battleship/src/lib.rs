#![no_std]

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, log, symbol_short,
    Address, Bytes, Env, Symbol,
};

// ─── Cross-contract: Verifier ───

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VerifierError {
    NotAdmin = 1,
    VerificationFailed = 2,
    VkNotSet = 3,
}

#[contractclient(name = "VerifierClient")]
pub trait Verifier {
    fn verify_board(env: Env, proof: Bytes, public_inputs: Bytes) -> Result<bool, VerifierError>;
    fn verify_turns(env: Env, proof: Bytes, public_inputs: Bytes) -> Result<bool, VerifierError>;
}

// ─── Cross-contract: Game Hub ───

#[contractclient(name = "GameHubClient")]
pub trait GameHub {
    fn start_game(
        env: Env,
        game_id: Address,
        session_id: u32,
        player1: Address,
        player2: Address,
        player1_points: i128,
        player2_points: i128,
    );
    fn end_game(env: Env, session_id: u32, player1_won: bool);
}

// ─── Storage keys ───

const ADMIN: Symbol = symbol_short!("admin");
const VERIFIER: Symbol = symbol_short!("verifier");
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
}

// ─── Contract ───

#[contract]
pub struct BattleshipContract;

#[contractimpl]
impl BattleshipContract {
    /// Deploy-time constructor: stores admin, verifier address, and game hub address.
    pub fn __constructor(
        env: Env,
        admin: Address,
        verifier: Address,
        game_hub: Address,
    ) {
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&VERIFIER, &verifier);
        env.storage().instance().set(&GAME_HUB, &game_hub);
        env.storage().instance().set(&SESSION_CTR, &0u32);
        log!(&env, "BattleshipContract deployed");
    }

    /// Verify a single player's board_validity proof via the Verifier contract.
    /// Called once per player (2 separate transactions).
    /// Admin-only.
    pub fn verify_board(
        env: Env,
        proof: Bytes,
        pub_inputs: Bytes,
    ) -> Result<bool, Error> {
        let admin: Address = env.storage().instance().get(&ADMIN).ok_or(Error::NotAdmin)?;
        admin.require_auth();

        let verifier_addr: Address = env.storage().instance().get(&VERIFIER).unwrap();
        let verifier = VerifierClient::new(&env, &verifier_addr);
        verifier.verify_board(&proof, &pub_inputs);

        Ok(true)
    }

    /// Open a match (after both board proofs verified in separate txs).
    /// Registers match state + notifies Game Hub.
    /// Admin-only. Returns session_id.
    pub fn open_match(
        env: Env,
        p1: Address,
        p2: Address,
    ) -> Result<u32, Error> {
        let admin: Address = env.storage().instance().get(&ADMIN).ok_or(Error::NotAdmin)?;
        admin.require_auth();

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

        // Cross-contract: game_hub.start_game(...)
        let game_hub_addr: Address = env.storage().instance().get(&GAME_HUB).unwrap();
        let self_addr = env.current_contract_address();
        let client = GameHubClient::new(&env, &game_hub_addr);
        client.start_game(&self_addr, &session_id, &p1, &p2, &0i128, &0i128);

        log!(&env, "Match opened: session_id={}", session_id);
        Ok(session_id)
    }

    /// Verify turns_proof via the Verifier contract and close a match on Game Hub.
    /// Admin-only.
    pub fn close_match(
        env: Env,
        session_id: u32,
        proof: Bytes,
        pub_inputs: Bytes,
        player1_won: bool,
    ) -> Result<(), Error> {
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

        // Cross-contract: verify turns proof (panics on failure)
        let verifier_addr: Address = env.storage().instance().get(&VERIFIER).unwrap();
        let verifier = VerifierClient::new(&env, &verifier_addr);
        verifier.verify_turns(&proof, &pub_inputs);

        // Mark closed
        match_state.closed = true;
        env.storage().temporary().set(&session_id, &match_state);

        // Cross-contract: game_hub.end_game(...)
        let game_hub_addr: Address = env.storage().instance().get(&GAME_HUB).unwrap();
        let client = GameHubClient::new(&env, &game_hub_addr);
        client.end_game(&session_id, &player1_won);

        log!(
            &env,
            "Match closed: session_id={}, player1_won={}",
            session_id,
            player1_won
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
