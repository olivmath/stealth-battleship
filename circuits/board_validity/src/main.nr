use poseidon::poseidon2::Poseidon2;

fn ship_in_bounds(row: u8, col: u8, size: u8, horizontal: bool) -> bool {
    if horizontal {
        (row < 6) & (col + size <= 6)
    } else {
        (col < 6) & (row + size <= 6)
    }
}

fn ships_overlap(
    r1: u8, c1: u8, s1: u8, h1: bool,
    r2: u8, c2: u8, s2: u8, h2: bool,
) -> bool {
    let mut overlap = false;
    for i in 0..5_u8 {
        if i < s1 {
            let (ship1_r, ship1_c) = if h1 { (r1, c1 + i) } else { (r1 + i, c1) };
            for j in 0..5_u8 {
                if j < s2 {
                    let (ship2_r, ship2_c) = if h2 { (r2, c2 + j) } else { (r2 + j, c2) };
                    if (ship1_r == ship2_r) & (ship1_c == ship2_c) {
                        overlap = true;
                    }
                }
            }
        }
    }
    overlap
}

fn compute_board_hash(ships: [(u8, u8, u8, bool); 3], nonce: Field) -> Field {
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

fn main(
    ships: [(u8, u8, u8, bool); 3],
    nonce: Field,
    board_hash: pub Field,
    ship_sizes: pub [u8; 3],
) {
    let computed_hash = compute_board_hash(ships, nonce);
    assert(computed_hash == board_hash, "board hash invalido");

    for i in 0..3 {
        let (_, _, size, _) = ships[i];
        assert(size == ship_sizes[i], "tamanho de navio invalido");
    }

    for i in 0..3 {
        let (row, col, size, horizontal) = ships[i];
        assert(ship_in_bounds(row, col, size, horizontal), "navio fora dos limites");
    }

    let (r0, c0, s0, h0) = ships[0];
    let (r1, c1, s1, h1) = ships[1];
    let (r2, c2, s2, h2) = ships[2];

    assert(!ships_overlap(r0, c0, s0, h0, r1, c1, s1, h1), "navios 0 e 1 se sobrepoem");
    assert(!ships_overlap(r0, c0, s0, h0, r2, c2, s2, h2), "navios 0 e 2 se sobrepoem");
    assert(!ships_overlap(r1, c1, s1, h1, r2, c2, s2, h2), "navios 1 e 2 se sobrepoem");
}

#[test]
fn test_valid_board() {
    let ships: [(u8, u8, u8, bool); 3] = [
        (0, 0, 2, true),
        (2, 0, 2, true),
        (4, 0, 3, true),
    ];
    let nonce: Field = 12345;
    let board_hash = compute_board_hash(ships, nonce);
    let ship_sizes: [u8; 3] = [2, 2, 3];
    main(ships, nonce, board_hash, ship_sizes);
}

#[test(should_fail)]
fn test_wrong_hash() {
    let ships: [(u8, u8, u8, bool); 3] = [
        (0, 0, 2, true),
        (2, 0, 2, true),
        (4, 0, 3, true),
    ];
    let nonce: Field = 12345;
    let wrong_hash: Field = 99999;
    let ship_sizes: [u8; 3] = [2, 2, 3];
    main(ships, nonce, wrong_hash, ship_sizes);
}

#[test(should_fail)]
fn test_ship_out_of_bounds() {
    let ships: [(u8, u8, u8, bool); 3] = [
        (0, 5, 2, true),
        (2, 0, 2, true),
        (4, 0, 3, true),
    ];
    let nonce: Field = 12345;
    let board_hash = compute_board_hash(ships, nonce);
    let ship_sizes: [u8; 3] = [2, 2, 3];
    main(ships, nonce, board_hash, ship_sizes);
}

#[test(should_fail)]
fn test_ships_overlap() {
    let ships: [(u8, u8, u8, bool); 3] = [
        (0, 0, 2, true),
        (0, 1, 2, true),
        (4, 0, 3, true),
    ];
    let nonce: Field = 12345;
    let board_hash = compute_board_hash(ships, nonce);
    let ship_sizes: [u8; 3] = [2, 2, 3];
    main(ships, nonce, board_hash, ship_sizes);
}

#[test(should_fail)]
fn test_wrong_ship_size() {
    let ships: [(u8, u8, u8, bool); 3] = [
        (0, 0, 2, true),
        (2, 0, 2, true),
        (4, 0, 3, true),
    ];
    let nonce: Field = 12345;
    let board_hash = compute_board_hash(ships, nonce);
    let ship_sizes: [u8; 3] = [2, 2, 4];
    main(ships, nonce, board_hash, ship_sizes);
}
