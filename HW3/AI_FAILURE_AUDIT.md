# AI Failure Audit – HW3

## Project Information

**Project:** High-Concurrency Flash-Sale E-Commerce Engine  
**Application:** FlashMart  
**Technologies:** TypeScript, Vite, JavaScript Web APIs

## 1. Purpose

This document reviews AI-assisted development mistakes and design limitations identified while implementing the FlashMart application.

The goal is to explain the problems, their causes, the corrective actions, and the lessons learned.

## 2. Failure 1 – TypeScript Constructor Parameter Property

**Problem:**

The AI-generated `OrderQueue` class used a parameter property directly in its constructor:

```typescript
constructor(
  private readonly handler:
    (request: OrderRequest) => OrderResult
) {}
```

**Error:** TypeScript `TS1294` occurred because the project enabled `erasableSyntaxOnly`.

**Cause:** The generated code did not account for the project's TypeScript compiler configuration.

**Correction:**

The handler was declared separately and initialized inside the constructor.

```typescript
private readonly handler:
  (request: OrderRequest) => OrderResult;

constructor(
  handler: (request: OrderRequest) => OrderResult
) {
  this.handler = handler;
}
```

**Lesson learned:** AI-generated TypeScript must be validated against the actual project configuration, not only general language syntax.

## 3. Failure 2 – Unused Function and Import

**Problem:**

During Task 3.8, the AI-generated `main.ts` contained an unused helper:

```typescript
function allReservations(): Reservation[] {
  return inventory.getReservations();
}
```

**Error:** The build failed with TypeScript `TS6133`.

**Cause:** The generated helper and its related import were retained even though no application code called them.

**Correction:**

The unused helper and the `Reservation` type import were removed.

**Lesson learned:** Running `npm run build` after code changes helps detect unused declarations and integration mistakes.

## 4. Failure 3 – Countdown Design Did Not Initially Match the Requirement

**Problem:**

The earlier FlashMart implementation used a `setInterval()`-based countdown and displayed only hours, minutes, and seconds.

Although it recalculated the remaining time using `Date.now()`, its update mechanism did not fully match the assignment's requested `requestAnimationFrame()` approach and millisecond display.

**Cause:** The AI initially prioritized a working storefront interface without fully implementing the required precision timer design.

**Correction:**

A separate `anti-drift-timer.ts` module was implemented using a fixed target timestamp:

```typescript
const remaining = Math.max(
  0,
  targetTime - Date.now()
);
```

The display was updated using `requestAnimationFrame()` and formatted with milliseconds.

**Lesson learned:** A feature that appears functional may still fail to satisfy its technical requirements. Implementation details must be checked against the assignment.

## 5. Concurrency Safety Analysis

FlashMart also includes a race-condition demonstration.

The unsafe approach reads shared inventory before asynchronous work and then updates it using stale data. Multiple requests may therefore be accepted against the same original inventory.

The safer frontend demonstration performs inventory validation and decrement synchronously without an asynchronous gap.

The final inventory state machine additionally uses inventory versions, temporary reservations, lock expiration, and checkout transitions.

**Limitation:** These mechanisms are demonstrated within a single browser JavaScript environment. They do not provide transaction isolation between separate users or servers. A real production system would require backend coordination and database-level concurrency control.

## 6. Verification

The following checks should be completed before submission:

- [ ] TypeScript production build succeeds.
- [ ] Zero-drift countdown is verified.
- [ ] Reservation and checkout work correctly.
- [ ] Expired reservations release stock.
- [ ] Cancelled reservations release stock.
- [ ] Inventory cannot become negative during simulation.
- [ ] Race-condition comparison produces the expected results.
- [ ] Git commit history meets the assignment requirements.

## 7. Conclusion

AI-assisted development accelerated the initial implementation of FlashMart, but the generated code required review and correction.

The identified issues demonstrate the importance of compiler validation, accurate requirement interpretation, state consistency, and explicit testing of concurrency-related behavior.