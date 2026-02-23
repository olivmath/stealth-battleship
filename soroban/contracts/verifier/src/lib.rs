#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, log, symbol_short, Address, Bytes,
    BytesN, Env, Symbol,
};
use ultrahonk_soroban_verifier::UltraHonkVerifier;

// ─── Types ───

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum CircuitType {
    BoardValidity = 0,
    TurnsProof = 1,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VerifierError {
    NotAdmin = 1,
    VerificationFailed = 2,
    VkNotSet = 3,
}

// ─── Storage keys ───

const ADMIN: Symbol = symbol_short!("admin");

#[contracttype]
#[derive(Clone)]
enum StorageKey {
    Vk(CircuitType),
    ProofVerified(BytesN<32>),
}

// ─── Contract ───

#[contract]
pub struct ZkVerifierContract;

#[contractimpl]
impl ZkVerifierContract {
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&ADMIN, &admin);
        log!(&env, "ZkVerifier deployed");
    }

    /// Store a verification key for a circuit type. Admin-only.
    pub fn set_verification_key(
        env: Env,
        admin: Address,
        circuit: CircuitType,
        vk_data: Bytes,
    ) -> Result<(), VerifierError> {
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN)
            .ok_or(VerifierError::NotAdmin)?;
        if admin != stored_admin {
            return Err(VerifierError::NotAdmin);
        }
        admin.require_auth();

        env.storage()
            .instance()
            .set(&StorageKey::Vk(circuit), &vk_data);
        Ok(())
    }

    /// Generic proof verification against a circuit's VK.
    pub fn verify_proof(
        env: Env,
        circuit: CircuitType,
        proof: Bytes,
        public_inputs: Bytes,
    ) -> Result<bool, VerifierError> {
        let vk: Bytes = env
            .storage()
            .instance()
            .get(&StorageKey::Vk(circuit))
            .ok_or(VerifierError::VkNotSet)?;

        let verifier =
            UltraHonkVerifier::new(&env, &vk).map_err(|_| VerifierError::VkNotSet)?;

        verifier
            .verify(&proof, &public_inputs)
            .map_err(|_| VerifierError::VerificationFailed)?;

        // Cache proof hash as verified
        let proof_hash: BytesN<32> = env.crypto().sha256(&proof).into();
        env.storage()
            .temporary()
            .set(&StorageKey::ProofVerified(proof_hash.clone()), &true);
        env.storage()
            .temporary()
            .extend_ttl(&StorageKey::ProofVerified(proof_hash), 518_400, 518_400);

        Ok(true)
    }

    /// Verify a board_validity proof.
    pub fn verify_board(
        env: Env,
        proof: Bytes,
        public_inputs: Bytes,
    ) -> Result<bool, VerifierError> {
        Self::verify_proof(env, CircuitType::BoardValidity, proof, public_inputs)
    }

    /// Verify a turns_proof.
    pub fn verify_turns(
        env: Env,
        proof: Bytes,
        public_inputs: Bytes,
    ) -> Result<bool, VerifierError> {
        Self::verify_proof(env, CircuitType::TurnsProof, proof, public_inputs)
    }

    /// Check if a proof has been previously verified (by hash).
    pub fn is_proof_verified(env: Env, proof_hash: BytesN<32>) -> bool {
        env.storage()
            .temporary()
            .get(&StorageKey::ProofVerified(proof_hash))
            .unwrap_or(false)
    }
}
