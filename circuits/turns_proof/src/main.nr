use poseidon::poseidon2::Poseidon2;

fn compute_board_hash(
    ships: [(u8, u8, u8, bool); 5],
    nonce: Field,
) -> Field {
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

fn cell_is_hit(ships: [(u8, u8, u8, bool); 5], row: u8, col: u8) -> bool {
    let mut hit = false;
    for i in 0..5 {
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

fn total_ship_cells(ship_sizes: [u8; 5]) -> u8 {
    ship_sizes[0] + ship_sizes[1] + ship_sizes[2] + ship_sizes[3] + ship_sizes[4]
}

fn main(
    // Private inputs
    ships_player: [(u8, u8, u8, bool); 5],
    ships_ai: [(u8, u8, u8, bool); 5],
    nonce_player: Field,
    nonce_ai: Field,
    // Public inputs
    board_hash_player: pub Field,
    board_hash_ai: pub Field,
    attacks_player: pub [(u8, u8); 100],
    attacks_ai: pub [(u8, u8); 100],
    n_attacks_player: pub u8,
    n_attacks_ai: pub u8,
    ship_sizes: pub [u8; 5],
    winner: pub u8,
) {
    assert(
        compute_board_hash(ships_player, nonce_player) == board_hash_player,
        "hash do player invalido",
    );
    assert(
        compute_board_hash(ships_ai, nonce_ai) == board_hash_ai,
        "hash da AI invalido",
    );

    let mut hits_on_ai: u8 = 0;
    for i in 0..100 {
        if (i as u8) < n_attacks_player {
            let (row, col) = attacks_player[i];
            if cell_is_hit(ships_ai, row, col) {
                hits_on_ai += 1;
            }
        }
    }

    let mut hits_on_player: u8 = 0;
    for i in 0..100 {
        if (i as u8) < n_attacks_ai {
            let (row, col) = attacks_ai[i];
            if cell_is_hit(ships_player, row, col) {
                hits_on_player += 1;
            }
        }
    }

    let cells_to_win = total_ship_cells(ship_sizes);
    let player_won = hits_on_ai == cells_to_win;
    let ai_won = hits_on_player == cells_to_win;

    if winner == 0 {
        assert(player_won, "player declarado vencedor mas nao afundou todos os navios da AI");
    } else {
        assert(ai_won, "AI declarada vencedora mas nao afundou todos os navios do player");
    }
}

// ---- TESTES ----

fn player_ships() -> [(u8, u8, u8, bool); 5] {
    [
        (0, 0, 5, true),
        (2, 0, 4, true),
        (4, 0, 3, true),
        (6, 0, 3, true),
        (8, 0, 2, true),
    ]
}

fn ai_ships() -> [(u8, u8, u8, bool); 5] {
    [
        (0, 5, 5, true),
        (2, 5, 4, true),
        (4, 5, 3, true),
        (6, 5, 3, true),
        (8, 5, 2, true),
    ]
}

fn empty_attacks() -> [(u8, u8); 100] {
    [(0, 0); 100]
}

#[test]
fn test_player_wins() {
    let ships_player = player_ships();
    let ships_ai = ai_ships();
    let nonce_p: Field = 11;
    let nonce_ai: Field = 22;
    let hash_p = compute_board_hash(ships_player, nonce_p);
    let hash_ai = compute_board_hash(ships_ai, nonce_ai);
    let ship_sizes: [u8; 5] = [5, 4, 3, 3, 2];

    // 17 hits needed (5+4+3+3+2)
    let mut attacks_p = empty_attacks();
    // Carrier at (0,5) size 5 horizontal
    attacks_p[0] = (0, 5);
    attacks_p[1] = (0, 6);
    attacks_p[2] = (0, 7);
    attacks_p[3] = (0, 8);
    attacks_p[4] = (0, 9);
    // Battleship at (2,5) size 4 horizontal
    attacks_p[5] = (2, 5);
    attacks_p[6] = (2, 6);
    attacks_p[7] = (2, 7);
    attacks_p[8] = (2, 8);
    // Cruiser at (4,5) size 3 horizontal
    attacks_p[9] = (4, 5);
    attacks_p[10] = (4, 6);
    attacks_p[11] = (4, 7);
    // Submarine at (6,5) size 3 horizontal
    attacks_p[12] = (6, 5);
    attacks_p[13] = (6, 6);
    attacks_p[14] = (6, 7);
    // Destroyer at (8,5) size 2 horizontal
    attacks_p[15] = (8, 5);
    attacks_p[16] = (8, 6);

    let mut attacks_ai = empty_attacks();
    attacks_ai[0] = (0, 0);

    main(
        ships_player, ships_ai,
        nonce_p, nonce_ai,
        hash_p, hash_ai,
        attacks_p, attacks_ai,
        17, 1,
        ship_sizes,
        0,
    );
}

#[test]
fn test_ai_wins() {
    let ships_player = player_ships();
    let ships_ai = ai_ships();
    let nonce_p: Field = 11;
    let nonce_ai: Field = 22;
    let hash_p = compute_board_hash(ships_player, nonce_p);
    let hash_ai = compute_board_hash(ships_ai, nonce_ai);
    let ship_sizes: [u8; 5] = [5, 4, 3, 3, 2];

    // AI sinks all player ships (17 hits)
    let mut attacks_ai = empty_attacks();
    // Carrier at (0,0) size 5
    attacks_ai[0] = (0, 0);
    attacks_ai[1] = (0, 1);
    attacks_ai[2] = (0, 2);
    attacks_ai[3] = (0, 3);
    attacks_ai[4] = (0, 4);
    // Battleship at (2,0) size 4
    attacks_ai[5] = (2, 0);
    attacks_ai[6] = (2, 1);
    attacks_ai[7] = (2, 2);
    attacks_ai[8] = (2, 3);
    // Cruiser at (4,0) size 3
    attacks_ai[9] = (4, 0);
    attacks_ai[10] = (4, 1);
    attacks_ai[11] = (4, 2);
    // Submarine at (6,0) size 3
    attacks_ai[12] = (6, 0);
    attacks_ai[13] = (6, 1);
    attacks_ai[14] = (6, 2);
    // Destroyer at (8,0) size 2
    attacks_ai[15] = (8, 0);
    attacks_ai[16] = (8, 1);

    let mut attacks_p = empty_attacks();
    attacks_p[0] = (0, 5);

    main(
        ships_player, ships_ai,
        nonce_p, nonce_ai,
        hash_p, hash_ai,
        attacks_p, attacks_ai,
        1, 17,
        ship_sizes,
        1,
    );
}

#[test(should_fail)]
fn test_wrong_winner() {
    let ships_player = player_ships();
    let ships_ai = ai_ships();
    let nonce_p: Field = 11;
    let nonce_ai: Field = 22;
    let hash_p = compute_board_hash(ships_player, nonce_p);
    let hash_ai = compute_board_hash(ships_ai, nonce_ai);
    let ship_sizes: [u8; 5] = [5, 4, 3, 3, 2];

    let mut attacks_p = empty_attacks();
    attacks_p[0] = (0, 5);
    let attacks_ai = empty_attacks();

    main(
        ships_player, ships_ai,
        nonce_p, nonce_ai,
        hash_p, hash_ai,
        attacks_p, attacks_ai,
        1, 0,
        ship_sizes,
        0,
    );
}

#[test(should_fail)]
fn test_wrong_hash() {
    let ships_player = player_ships();
    let ships_ai = ai_ships();
    let nonce_p: Field = 11;
    let nonce_ai: Field = 22;
    let hash_p: Field = 999;
    let hash_ai = compute_board_hash(ships_ai, nonce_ai);
    let ship_sizes: [u8; 5] = [5, 4, 3, 3, 2];
    let attacks = empty_attacks();

    main(
        ships_player, ships_ai,
        nonce_p, nonce_ai,
        hash_p, hash_ai,
        attacks, attacks,
        0, 0,
        ship_sizes,
        0,
    );
}
