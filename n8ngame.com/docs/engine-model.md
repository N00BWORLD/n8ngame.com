# Engine Model & Terminology

This document serves as the **Source of Truth** for the execution model of the N8N Game Engine.

## Core Concepts

### 1. Tick
A **Tick** is the atomic unit of execution in the game logic.
- **Scope**: One Tick represents the processing of a single Node Execution step or a single cycle of the event loop.
- **In Game**: When the user presses "Step", exactly one Tick implies extracting one node from the queue and running it.

### 2. Token
A **Token** represents the abstract "data payload" or "signal" flowing between nodes.
- **Flow**: Tokens travel along Edges from a Source Node to a Target Node.
- **Content**: A Token carries a JSON-serializable payload (the `inputs` for the next node).
- **Rule**: A Token must be consumed by the Target Node to trigger its execution.

### 3. Execution Budget (Gas)
**Gas** is the computational resource limit used to prevent infinite loops and manage game difficulty.
- **Code Term**: `gas`, `maxGas`, `gasUsed`.
- **UI Term**: "Execution Budget" or "Gas".
- **Mechanism**: Every Node execution consumes a fixed amount of Gas (e.g., Action=10, Variable=1).
- **Failure**: If Gas drops below 0, execution halts immediately with an `out_of_gas` error.

## Invariants

1.  **Conservation of Signals**: A signal (Token) emitted by a node remains pending until processed or until the execution terminates.
2.  **Finite Execution**: Every execution session MUST have a `maxGas` limit. Infinite runs are impossible by design.
3.  **Deterministic Replay**: Given the same `Blueprint` (Graph + Config) and same `Initial Inputs`, the execution logs MUST be identical (excluding timestamps).

## Type Mapping

| Concept | Code Type | Description |
| :--- | :--- | :--- |
| **Tick** | `ExecutionLog` | One log entry corresponds to one completed Tick/Node-Run. |
| **Token** | `outputs` -> `inputs` | Data passed from `outputs` of Log N to `inputs` of Log N+1. |
| **Gas** | `ExecutionConfig.maxGas` | The total budget allowed for the run. |
