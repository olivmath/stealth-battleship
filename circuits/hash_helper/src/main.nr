use poseidon::poseidon2::Poseidon2;

/// Helper circuit: computes board hash from ships + nonce.
/// Used by the ZK service to get the hash value needed as public input
/// for board_validity and shot_proof circuits.
fn main(ships: [(u8, u8, u8, bool); 5], nonce: Field) -> pub Field {
    let mut inputs: [Field; 21] = [0; 21];
    for i in 0..5 {
        let (r, c, s, h) = ships[i];
        inputs[i * 4 + 0] = r as Field;
        inputs[i * 4 + 1] = c as Field;
        inputs[i * 4 + 2] = s as Field;
        inputs[i * 4 + 3] = if h { 1 } else { 0 };
    }
    inputs[20] = nonce;
    Poseidon2::hash(inputs, 21)
}

#[test]
fn test_hash_deterministic() {
    let ships: [(u8, u8, u8, bool); 5] = [
        (0, 0, 5, true),
        (2, 0, 4, true),
        (4, 0, 3, true),
        (6, 0, 3, true),
        (8, 0, 2, true),
    ];
    let nonce: Field = 12345;
    let h1 = main(ships, nonce);
    let h2 = main(ships, nonce);
    assert(h1 == h2);
    assert(h1 != 0);
}
