use std::hash::poseidon2::Poseidon2;

fn compute_board_hash(
    ships: [(u8, u8, u8, bool); 3],
    nonce: Field,
) -> Field {
    let mut inputs: [Field; 13] = [0; 13];
    for i in 0..3 {
        let (r, c, s, h) = ships[i];
        inputs[i * 4 + 0] = r as Field;
        inputs[i * 4 + 1] = c as Field;
        inputs[i * 4 + 2] = s as Field;
        inputs[i * 4 + 3] = if h { 1 } else { 0 };
    }
    inputs[12] = nonce;
    Poseidon2::hash(inputs, 13)
}

fn cell_is_hit(ships: [(u8, u8, u8, bool); 3], row: u8, col: u8) -> bool {
    let mut hit = false;
    for i in 0..3 {
        let (r, c, s, h) = ships[i];
        for j in 0..5_u8 {
            if j < s {
                let (ship_r, ship_c) = if h { (r, c + j) } else { (r + j, c) };
                if (ship_r == row) & (ship_c == col) {
                    hit = true;
                }
            }
        }
    }
    hit
}

fn main(
    // Private inputs
    ships: [(u8, u8, u8, bool); 3],
    nonce: Field,
    // Public inputs
    board_hash: pub Field,
    row: pub u8,
    col: pub u8,
    is_hit: pub bool,
) {
    let computed_hash = compute_board_hash(ships, nonce);
    assert(computed_hash == board_hash, "board hash invalido");

    let actual_hit = cell_is_hit(ships, row, col);
    assert(actual_hit == is_hit, "resultado desonesto");
}

// ---- TESTES ----

fn test_ships() -> [(u8, u8, u8, bool); 3] {
    [(0, 0, 2, true), (2, 0, 2, true), (4, 0, 3, true)]
}

#[test]
fn test_hit() {
    let ships = test_ships();
    let nonce: Field = 42;
    let board_hash = compute_board_hash(ships, nonce);
    main(ships, nonce, board_hash, 0, 0, true);
}

#[test]
fn test_miss() {
    let ships = test_ships();
    let nonce: Field = 42;
    let board_hash = compute_board_hash(ships, nonce);
    main(ships, nonce, board_hash, 1, 0, false);
}

#[test(should_fail)]
fn test_lying_miss_when_hit() {
    let ships = test_ships();
    let nonce: Field = 42;
    let board_hash = compute_board_hash(ships, nonce);
    main(ships, nonce, board_hash, 0, 0, false);
}

#[test(should_fail)]
fn test_lying_hit_when_miss() {
    let ships = test_ships();
    let nonce: Field = 42;
    let board_hash = compute_board_hash(ships, nonce);
    main(ships, nonce, board_hash, 1, 0, true);
}

#[test(should_fail)]
fn test_wrong_board_hash() {
    let ships = test_ships();
    let nonce: Field = 42;
    let wrong_hash: Field = 0;
    main(ships, nonce, wrong_hash, 0, 0, true);
}
