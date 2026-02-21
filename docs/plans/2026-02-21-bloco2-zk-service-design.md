# Bloco 2 — ZK Service Design

**Data:** 2026-02-21
**Escopo:** Integrar NoirJS no React Native via WebView, com arquitetura pronta para migrar para native bindings.

---

## Decisão: WebView primeiro, Native depois

- **Fase 1 (Bloco 2):** NoirJS + bb.js rodando dentro de WebView invisível (~30-40s por prova)
- **Fase 2 (futuro):** Migrar para native bindings (Swoir iOS + noir_android) (~2-5s por prova)
- **Contrato:** Interface abstrata `ZKProvider` isola a implementação — troca sem mexer no app

## Arquitetura

```
zkService.ts  →  ZKProvider (interface)
                    ├── WebViewZKProvider  ← Bloco 2
                    └── NativeZKProvider   ← futuro
```

## Estrutura de arquivos

```
frontend/src/services/zk/
  types.ts                ← ZKProvider interface + tipos ZK
  zkService.ts            ← fachada pública
  webview/
    WebViewZKProvider.ts  ← implementação WebView
    zkWorker.html         ← página HTML com NoirJS + bb.js
  circuits/
    board_validity.json   ← ACIR compilado (nargo compile)
    shot_proof.json
    turns_proof.json
```

## ZKProvider Interface

```typescript
interface ZKProvider {
  boardValidity(input: BoardValidityInput): Promise<BoardValidityResult>;
  shotProof(input: ShotProofInput): Promise<ShotProofResult>;
  turnsProof(input: TurnsProofInput): Promise<TurnsProofResult>;
}
```

## Etapas de implementação

| Etapa | Tarefa | Validação | Toca no app? |
|-------|--------|-----------|--------------|
| E4a | `nargo compile` → gerar 3 JSONs de circuito | JSONs com `bytecode` + `abi` | Não |
| E4b | `types.ts` + `zkService.ts` (interface only) | `tsc` compila | Não |
| E4c | `WebViewZKProvider` + `zkWorker.html` com `boardValidity()` | Prova gerada, log no console | Mínimo |
| E5 | Adicionar `shotProof()` ao provider | Prova no console | Não |
| E6 | Adicionar `turnsProof()` ao provider | Prova no console | Não |

## Princípio

Cada etapa é pequena, isolada e validável antes de avançar.
Nunca integrar duas camadas ao mesmo tempo sem validar cada uma.

## Dependências novas

- `@noir-lang/noir_js` — compilação e execução de circuitos Noir em JS
- `@aztec/bb.js` — backend UltraHonk para geração/verificação de provas

## Referências

- [NoirJS Tutorial](https://noir-lang.org/docs/tutorials/noirjs_app/)
- [noir-react-native-starter](https://github.com/madztheo/noir-react-native-starter)
- [Roadmap master](./2026-02-21-zk-arcade-pvp-roadmap.md)
