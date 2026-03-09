# Stealth Battleship — Project Instructions

## Language
- Respond in PT-BR unless asked otherwise
- Brand name "Stealth Battleship" stays English everywhere

## Monorepo Structure
- `mobile/` — React Native / Expo (SDK 54, expo-router 6)
- `backend/` — Express + Socket.io (ESM, tsx)
- `circuits/` — Noir ZK circuits (board_validity, shot_proof, turns_proof)
- `soroban/` — Stellar smart contracts (Rust)
- `web/` — Web client
- `supabase/` — Supabase config
- `pitch/` — Slides + video (Remotion)
- `docs/` — Design docs and plans

## Commands

### Mobile
```bash
cd mobile && npm start        # Expo dev server
cd mobile && npm test          # Jest tests
cd mobile && npm test -- --coverage
```
- `npm install --legacy-peer-deps` (react-dom peer conflict)
- `package.json` main MUST be `expo-router/entry`

### Backend
```bash
cd backend && pnpm dev         # tsx --watch
cd backend && pnpm build       # tsc
cd backend && pnpm test:e2e    # tsx test/e2e-full-match.ts
```

### Circuits
```bash
cd circuits && ./compile.sh    # Compile all Noir circuits
```
- Noir v1.0.0-beta.18, Nargo pinned

### Soroban
```bash
cd soroban && ./deploy.sh
```

## Architecture — IATE Pattern (mobile/src/)
- **I**nteractor: use cases (pure business logic)
- **A**dapter: persistence (AsyncStorage, InMemory)
- **T**ranslator: React hooks + Context (DI boundary)
- **E**ntities: types and domain objects
- Organized by domain: `game/`, `stats/`, `settings/`, `zk/`, `shared/`

## Code Conventions
- TypeScript strict mode
- Functional components with React.memo for performance-critical cells
- All navigation uses `router.replace()` (no back-nav)
- Translation at render time only — engine/data files stay untranslated
- Ship names, ranks: use `t('ships.' + name)` pattern
- Font names: `Orbitron_700Bold`, `Orbitron_400Regular`, `Rajdhani_600SemiBold`, `Rajdhani_400Regular`

## RN Touch Pitfalls
- TouchableOpacity intercepts touches when disabled → use `pointerEvents="none"` + absolute overlay
- Use `onResponderGrant` (not `onResponderStart`) for first touch
- `measureInWindow` must match the View's coordinate space
- Tap vs drag: distance threshold ~10px

## ZK / Crypto
- Hashing: Poseidon2 (via Noir circuits), NOT SHA-256
- Proofs: client-side NoirJS (WASM in WebView), verified server-side
- Blockchain: Stellar Protocol 25 (BN254 + Poseidon native)
- Attacks signed Ed25519 — backend identifies player via signature
- ZK proofs submitted to Soroban via backend (not direct from client)

## Do NOT
- Commit `.env`, credentials, or compiled circuit JSONs
- Use SHA-256 for new crypto work (use Poseidon2)
- Use `git rebase --onto` (use `git branchless` per global CLAUDE.md)

<!-- token-policy: v1.0 -->
