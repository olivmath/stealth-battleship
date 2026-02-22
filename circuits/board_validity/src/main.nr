use poseidon::poseidon2::Poseidon2;

fn ship_in_bounds(row: u8, col: u8, size: u8, horizontal: bool) -> bool {
    if horizontal {
        (row < 10) & (col + size <= 10)
    } else {
        (col < 10) & (row + size <= 10)
    }
}

fn ships_overlap(
    r1: u8, c1: u8, s1: u8, h1: bool,
    r2: u8, c2: u8, s2: u8, h2: bool,
) -> bool {
    let mut overlap = false;
    for i in 0..5 {
        if i < s1 {
            let (ship1_r, ship1_c) = if h1 { (r1, c1 + i) } else { (r1 + i, c1) };
            for j in 0..5 {
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

fn compute_board_hash(ships: [(u8, u8, u8, bool); 5], nonce: Field) -> Field {
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

fn main(
    ships: [(u8, u8, u8, bool); 5],
    nonce: Field,
    board_hash: pub Field,
    ship_sizes: pub [u8; 5],
) {
    let computed_hash = compute_board_hash(ships, nonce);
    assert(computed_hash == board_hash, "board hash invalido");

    for i in 0..5 {
        let (_, _, size, _) = ships[i];
        assert(size == ship_sizes[i], "tamanho de navio invalido");
    }

    for i in 0..5 {
        let (row, col, size, horizontal) = ships[i];
        assert(ship_in_bounds(row, col, size, horizontal), "navio fora dos limites");
    }

    // Check all pairs for overlap (5 ships = 10 pairs)
    for i in 0..5 {
        let (ri, ci, si, hi) = ships[i];
        for j in (i + 1)..5 {
            let (rj, cj, sj, hj) = ships[j];
            assert(!ships_overlap(ri, ci, si, hi, rj, cj, sj, hj), "navios se sobrepoem");
        }
    }
}

#[test]
fn test_valid_board() {
    let ships: [(u8, u8, u8, bool); 5] = [
        (0, 0, 5, true),
        (2, 0, 4, true),
        (4, 0, 3, true),
        (6, 0, 3, true),
        (8, 0, 2, true),
    ];
    let nonce: Field = 12345;
    let board_hash = compute_board_hash(ships, nonce);
    let ship_sizes: [u8; 5] = [5, 4, 3, 3, 2];
    main(ships, nonce, board_hash, ship_sizes);
}

#[test(should_fail)]
fn test_wrong_hash() {
    let ships: [(u8, u8, u8, bool); 5] = [
        (0, 0, 5, true),
        (2, 0, 4, true),
        (4, 0, 3, true),
        (6, 0, 3, true),
        (8, 0, 2, true),
    ];
    let nonce: Field = 12345;
    let wrong_hash: Field = 99999;
    let ship_sizes: [u8; 5] = [5, 4, 3, 3, 2];
    main(ships, nonce, wrong_hash, ship_sizes);
}

#[test(should_fail)]
fn test_ship_out_of_bounds() {
    let ships: [(u8, u8, u8, bool); 5] = [
        (0, 8, 5, true),  // col 8 + size 5 = 13 > 10
        (2, 0, 4, true),
        (4, 0, 3, true),
        (6, 0, 3, true),
        (8, 0, 2, true),
    ];
    let nonce: Field = 12345;
    let board_hash = compute_board_hash(ships, nonce);
    let ship_sizes: [u8; 5] = [5, 4, 3, 3, 2];
    main(ships, nonce, board_hash, ship_sizes);
}

#[test(should_fail)]
fn test_ships_overlap() {
    let ships: [(u8, u8, u8, bool); 5] = [
        (0, 0, 5, true),
        (0, 1, 4, true),  // overlaps with ship 0
        (4, 0, 3, true),
        (6, 0, 3, true),
        (8, 0, 2, true),
    ];
    let nonce: Field = 12345;
    let board_hash = compute_board_hash(ships, nonce);
    let ship_sizes: [u8; 5] = [5, 4, 3, 3, 2];
    main(ships, nonce, board_hash, ship_sizes);
}

#[test(should_fail)]
fn test_wrong_ship_size() {
    let ships: [(u8, u8, u8, bool); 5] = [
        (0, 0, 5, true),
        (2, 0, 4, true),
        (4, 0, 3, true),
        (6, 0, 3, true),
        (8, 0, 2, true),
    ];
    let nonce: Field = 12345;
    let board_hash = compute_board_hash(ships, nonce);
    let ship_sizes: [u8; 5] = [5, 4, 3, 3, 4];  // last should be 2
    main(ships, nonce, board_hash, ship_sizes);
}
