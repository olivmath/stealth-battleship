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

fn total_ship_cells(ship_sizes: [u8; 3]) -> u8 {
    ship_sizes[0] + ship_sizes[1] + ship_sizes[2]
}

fn main(
    // Private inputs
    ships_player: [(u8, u8, u8, bool); 3],
    ships_ai: [(u8, u8, u8, bool); 3],
    nonce_player: Field,
    nonce_ai: Field,
    // Public inputs
    board_hash_player: pub Field,
    board_hash_ai: pub Field,
    attacks_player: pub [(u8, u8); 36],
    attacks_ai: pub [(u8, u8); 36],
    n_attacks_player: pub u8,
    n_attacks_ai: pub u8,
    ship_sizes: pub [u8; 3],
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
    for i in 0..36 {
        if (i as u8) < n_attacks_player {
            let (row, col) = attacks_player[i];
            if cell_is_hit(ships_ai, row, col) {
                hits_on_ai += 1;
            }
        }
    }

    let mut hits_on_player: u8 = 0;
    for i in 0..36 {
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

fn player_ships() -> [(u8, u8, u8, bool); 3] {
    [(0, 0, 2, true), (2, 0, 2, true), (4, 0, 3, true)]
}

fn ai_ships() -> [(u8, u8, u8, bool); 3] {
    [(0, 3, 2, true), (2, 3, 2, true), (4, 3, 3, true)]
}

fn empty_attacks() -> [(u8, u8); 36] {
    [(0, 0); 36]
}

#[test]
fn test_player_wins() {
    let ships_player = player_ships();
    let ships_ai = ai_ships();
    let nonce_p: Field = 11;
    let nonce_ai: Field = 22;
    let hash_p = compute_board_hash(ships_player, nonce_p);
    let hash_ai = compute_board_hash(ships_ai, nonce_ai);
    let ship_sizes: [u8; 3] = [2, 2, 3];

    let mut attacks_p = empty_attacks();
    attacks_p[0] = (0, 3);
    attacks_p[1] = (0, 4);
    attacks_p[2] = (2, 3);
    attacks_p[3] = (2, 4);
    attacks_p[4] = (4, 3);
    attacks_p[5] = (4, 4);
    attacks_p[6] = (4, 5);

    let mut attacks_ai = empty_attacks();
    attacks_ai[0] = (0, 0);

    main(
        ships_player, ships_ai,
        nonce_p, nonce_ai,
        hash_p, hash_ai,
        attacks_p, attacks_ai,
        7, 1,
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
    let ship_sizes: [u8; 3] = [2, 2, 3];

    let mut attacks_ai = empty_attacks();
    attacks_ai[0] = (0, 0);
    attacks_ai[1] = (0, 1);
    attacks_ai[2] = (2, 0);
    attacks_ai[3] = (2, 1);
    attacks_ai[4] = (4, 0);
    attacks_ai[5] = (4, 1);
    attacks_ai[6] = (4, 2);

    let mut attacks_p = empty_attacks();
    attacks_p[0] = (0, 3);

    main(
        ships_player, ships_ai,
        nonce_p, nonce_ai,
        hash_p, hash_ai,
        attacks_p, attacks_ai,
        1, 7,
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
    let ship_sizes: [u8; 3] = [2, 2, 3];

    let mut attacks_p = empty_attacks();
    attacks_p[0] = (0, 3);
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
    let ship_sizes: [u8; 3] = [2, 2, 3];
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
