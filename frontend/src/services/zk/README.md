# ZK Proofs Service Testing Strategy

This directory contains the Zero-Knowledge Proofs service, which interacts with Noir circuits to generate proofs for game logic.

## `zkService.test.ts` (Unit Tests)

-   **Purpose**: To unit test the `zkService.ts` module in isolation.
-   **Approach**: We mock the `ZKProvider` interface, which `zkService` depends on. This allows us to verify that `zkService` correctly calls the underlying provider's methods and handles both successful and failed proof generation scenarios without relying on actual proof computation.
-   **Coverage**: Ensures `initZK`, `boardValidity`, `shotProof`, and `turnsProof` functions within `zkService` behave as expected when interacting with a `ZKProvider` implementation.

## Future Integration Tests

While `zkService.test.ts` covers the `zkService`'s logic, comprehensive testing of the ZK proof flows will require integration tests for the concrete `ZKProvider` implementations:

-   **`ServerZKProvider.ts`**: Integration tests should focus on:
    -   Successful communication with the backend server for proof generation.
    -   Correct handling of server responses (success, error).
    -   Serialization/deserialization of input/output data.
    -   Edge cases and error conditions in the server communication.

-   **`WebViewZKProvider.tsx`**: Integration tests for this provider would be more complex, requiring:
    -   A simulated WebView environment.
    -   Verification of message passing between the React Native app and the WebView.
    -   Testing actual on-device proof generation (if feasible in a test environment).

-   **Circuit Logic (Board Validity, Shot Proof, Turns Proof)**:
    -   Dedicated tests for the Noir circuits themselves, ideally using a Noir/Rust test harness.
    -   These tests would involve providing known valid and invalid inputs directly to the circuits to ensure their logic holds under various conditions (e.g., overlapping ships, incorrect shot results, invalid turn sequences). These tests would typically be part of the circuit's development lifecycle and not directly within this frontend codebase.

By separating these testing concerns, we can ensure both the `zkService`'s internal logic and the functionality of its underlying providers are thoroughly validated.
