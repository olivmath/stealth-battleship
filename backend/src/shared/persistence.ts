import { getSupabase } from './supabase.js';

export async function persistMatch(match: { id: string; gridSize: number; player1Pk: string; player2Pk?: string }) {
  const sb = getSupabase();
  await sb.from('matches').upsert({
    id: match.id,
    grid_size: match.gridSize,
    player1_pk: match.player1Pk,
    player2_pk: match.player2Pk,
    status: 'placing',
  });
}

export async function persistAttack(matchId: string, attackerPk: string, row: number, col: number, result: string, turnNumber: number) {
  const sb = getSupabase();
  await sb.from('attacks').insert({
    match_id: matchId,
    attacker_pk: attackerPk,
    row, col, result, turn_number: turnNumber,
  });
}

export async function persistMatchEnd(matchId: string, winnerPk: string, reason: string, turnCount: number) {
  const sb = getSupabase();
  await sb.from('matches').update({
    winner_pk: winnerPk,
    reason,
    turn_count: turnCount,
    status: 'finished',
    finished_at: new Date().toISOString(),
  }).eq('id', matchId);
}

export async function persistProofLog(log: {
  matchId?: string; playerPk: string; circuit: string;
  proofSizeBytes: number; verificationTimeMs: number; valid: boolean;
}) {
  const sb = getSupabase();
  await sb.from('proof_logs').insert({
    match_id: log.matchId,
    player_pk: log.playerPk,
    circuit: log.circuit,
    proof_size_bytes: log.proofSizeBytes,
    verification_time_ms: log.verificationTimeMs,
    valid: log.valid,
  });
}

export async function upsertPlayerStats(playerPk: string, won: boolean) {
  const sb = getSupabase();
  const { data } = await sb.from('player_stats').select().eq('player_pk', playerPk).single();

  if (data) {
    await sb.from('player_stats').update({
      wins: won ? data.wins + 1 : data.wins,
      losses: won ? data.losses : data.losses + 1,
      total_matches: data.total_matches + 1,
      updated_at: new Date().toISOString(),
    }).eq('player_pk', playerPk);
  } else {
    await sb.from('player_stats').insert({
      player_pk: playerPk,
      wins: won ? 1 : 0,
      losses: won ? 0 : 1,
      total_matches: 1,
    });
  }
}
