# HW3 – Task Decomposition

## Project Information
- **Project:** High-Concurrency Flash-Sale E-Commerce Engine
- **Application:** Vietnam Flash-Sale Simulation
- **Tech Stack:** TypeScript, Vite, HTML, CSS
- **Duration:** 1 Week
- **Domain:** Shopee / Lazada 11.11 / Midnight Flash Sale Simulation
- **Git Requirement:** Minimum 8 discrete Conventional Commits
- **AI Audit:** AI_FAILURE_AUDIT.md with at least 3 AI flaws

## Task 3.1 – Project Setup
- [ ] Configure TypeScript and Vite.
- [ ] Set up package.json, tsconfig.json and index.html.
- [ ] Configure main.ts as the application entry point.
- [ ] Verify the application runs on localhost.

**Files:** package.json, tsconfig.json, index.html, src/main.ts

**Commit:** `chore(hw3): initialize flash sale project`

## Task 3.2 – Flash-Sale UI
- [ ] Build the Flash-Sale product interface.
- [ ] Display product prices and inventory quantities.
- [ ] Create countdown timer display.
- [ ] Add product reservation and checkout controls.
- [ ] Implement responsive styling.

**Files:** src/main.ts, src/style.css

**Commit:** `feat(hw3): build flash sale interface`

## Task 3.3 – Anti-Drift Countdown Timer
- [ ] Implement createAntiDriftTimer().
- [ ] Calculate the countdown target using Date.now().
- [ ] Calculate remaining time from the target timestamp.
- [ ] Use requestAnimationFrame for timer updates.
- [ ] Stop the timer at zero.
- [ ] Implement animation frame cleanup.

**Files:** src/anti-drift-timer.ts

**Commit:** `feat(hw3): implement zero drift countdown`

## Task 3.4 – Inventory State Machine
- [ ] Define inventory reservation states.
- [ ] Implement available, reserved, purchased and expired states.
- [ ] Define valid state transitions.
- [ ] Prevent invalid state changes.
- [ ] Implement reservation expiration rules.

**Files:** src/inventory-state-machine.ts

**Commit:** `feat(hw3): implement inventory state machine`

## Task 3.5 – Optimistic Inventory Reservation
- [ ] Implement product reservation requests.
- [ ] Check available inventory before reservation.
- [ ] Apply optimistic inventory updates.
- [ ] Prevent invalid or duplicate reservations.
- [ ] Restore inventory when reservations fail or expire.
- [ ] Handle overlapping reservation attempts in the simulation.

**Files:** src/inventory-state-machine.ts, src/main.ts

**Commit:** `feat(hw3): implement optimistic inventory locking`

## Task 3.6 – Checkout & Lock Expiration
- [ ] Implement checkout from an active reservation.
- [ ] Reject checkout for expired reservations.
- [ ] Release reserved inventory after expiration.
- [ ] Prevent duplicate checkout processing.
- [ ] Display reservation and checkout results.

**Files:** src/inventory-state-machine.ts, src/main.ts

**Commit:** `feat(hw3): implement checkout and reservation expiry`

## Task 3.7 – High-Concurrency Simulation
- [ ] Simulate multiple reservation requests.
- [ ] Test simultaneous attempts to reserve limited inventory.
- [ ] Verify that inventory does not become negative.
- [ ] Test duplicate requests and expiration conflicts.
- [ ] Verify consistent state transitions.

**Files:** src/inventory-state-machine.ts, src/main.ts

**Commit:** `test(hw3): verify concurrent inventory operations`

## Task 3.8 – AI Failure Mode Audit
- [ ] Create AI_FAILURE_AUDIT.md.
- [ ] Document at least 3 actual or reproduced AI-generated flaws.
- [ ] Explain each flaw and its consequences.
- [ ] Document how each issue was identified.
- [ ] Describe the correction and verification results.

**Files:** AI_FAILURE_AUDIT.md

**Commit:** `docs(hw3): document AI failure mode audit`

## Task 3.9 – Final Verification & Documentation
- [ ] Test zero-drift countdown behavior.
- [ ] Test reservation and checkout transitions.
- [ ] Test lock expiration and inventory recovery.
- [ ] Verify concurrency simulation results.
- [ ] Review at least 8 discrete Conventional Commits.
- [ ] Complete documentation.
- [ ] Push completed homework to GitHub.

**Files:** task_decomposition.md, README.md

**Commit:** `docs(hw3): complete verification and documentation`

## Definition of Done
- Countdown is calculated using Date.now() delta instead of decrementing a setInterval counter.
- Reservation, expiration and checkout are controlled by a state machine.
- Optimistic inventory reservation logic works in the simulation.
- Invalid and duplicate operations are handled.
- Concurrent requests are tested.
- AI_FAILURE_AUDIT.md contains at least 3 verified AI flaws.
- Git history includes at least 8 meaningful Conventional Commits.
- Final testing and documentation are complete.
