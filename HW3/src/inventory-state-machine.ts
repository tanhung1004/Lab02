
/* =====================================================
   HW3 - TASK 3.7
   OPTIMISTIC INVENTORY LOCK + FINITE STATE MACHINE
   ===================================================== */

// Reservation lifecycle
export type ReservationStatus =
  | "RESERVED"
  | "CHECKED_OUT"
  | "EXPIRED"
  | "CANCELLED";

// Inventory snapshot
export interface InventorySnapshot {
  productId: number;
  available: number;
  reserved: number;
  sold: number;
  version: number;
}

// One customer's reservation
export interface Reservation {
  id: string;
  productId: number;
  quantity: number;
  status: ReservationStatus;
  createdAt: number;
  expiresAt: number;
}

// Reservation operation response
export interface ReservationResult {
  success: boolean;
  reason: string;
  reservation?: Reservation;
  inventory: InventorySnapshot;
}

// Internal inventory information
interface InventoryRecord {
  productId: number;
  available: number;
  reserved: number;
  sold: number;
  version: number;
}

// =====================================================
// INVENTORY STATE MACHINE
// =====================================================

export class InventoryStateMachine {
  private inventories = new Map<number, InventoryRecord>();

  private reservations = new Map<string, Reservation>();

  private expiryTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  private disposed = false;

  // Called whenever inventory or reservation changes
  public onChange?: () => void;

  // ===================================================
  // 1. REGISTER PRODUCT
  // ===================================================

  registerProduct(
    productId: number,
    initialStock: number
  ): void {
    this.assertActive();

    if (
      !Number.isInteger(productId) ||
      !Number.isSafeInteger(initialStock) ||
      initialStock < 0
    ) {
      throw new Error("Invalid inventory data");
    }

    if (this.inventories.has(productId)) {
      throw new Error("Product already registered");
    }

    this.inventories.set(productId, {
      productId,
      available: initialStock,
      reserved: 0,
      sold: 0,
      version: 0,
    });

    this.notifyChange();
  }

  // ===================================================
  // 2. GET INVENTORY SNAPSHOT
  // ===================================================

  getInventory(productId: number): InventorySnapshot {
    const inventory = this.requireInventory(productId);

    // Return a copy to protect internal state
    return { ...inventory };
  }

  // ===================================================
  // 3. CREATE RESERVATION
  // ===================================================

  reserve(
    productId: number,
    quantity: number,
    expectedVersion: number,
    lockDurationMs = 15000
  ): ReservationResult {
    this.assertActive();

    const inventory = this.requireInventory(productId);

    // Reject stale optimistic-lock versions
    if (inventory.version !== expectedVersion) {
      return this.failure(
        inventory,
        "VERSION_CONFLICT"
      );
    }

    if (
      !Number.isSafeInteger(quantity) ||
      quantity <= 0
    ) {
      return this.failure(
        inventory,
        "INVALID_QUANTITY"
      );
    }

    if (
      !Number.isFinite(lockDurationMs) ||
      lockDurationMs <= 0
    ) {
      return this.failure(
        inventory,
        "INVALID_LOCK_DURATION"
      );
    }

    if (inventory.available < quantity) {
      return this.failure(
        inventory,
        "INSUFFICIENT_STOCK"
      );
    }

    const now = Date.now();

    const reservation: Reservation = {
      id: crypto.randomUUID(),
      productId,
      quantity,
      status: "RESERVED",
      createdAt: now,
      expiresAt: now + lockDurationMs,
    };

    // Validate and update synchronously
    inventory.available -= quantity;
    inventory.reserved += quantity;
    inventory.version += 1;

    this.reservations.set(
      reservation.id,
      reservation
    );

    // Schedule automatic lock expiration
    const timer = setTimeout(() => {
      this.expireReservation(reservation.id);
    }, lockDurationMs);

    this.expiryTimers.set(
      reservation.id,
      timer
    );

    this.notifyChange();

    return {
      success: true,
      reason: "RESERVATION_CREATED",
      reservation: { ...reservation },
      inventory: { ...inventory },
    };
  }

  // ===================================================
  // 4. CHECKOUT RESERVED PRODUCT
  // ===================================================

  checkout(reservationId: string): boolean {
    this.assertActive();

    const reservation =
      this.reservations.get(reservationId);

    if (!reservation) return false;

    if (reservation.status !== "RESERVED") {
      return false;
    }

    // Recheck deadline even if timeout is delayed
    if (Date.now() >= reservation.expiresAt) {
      this.expireReservation(reservationId);
      return false;
    }

    const inventory =
      this.requireInventory(reservation.productId);

    // Reserved stock becomes sold stock
    inventory.reserved -= reservation.quantity;
    inventory.sold += reservation.quantity;
    inventory.version += 1;

    reservation.status = "CHECKED_OUT";

    this.clearExpiryTimer(reservationId);
    this.notifyChange();

    return true;
  }

  // ===================================================
  // 5. EXPIRE RESERVATION
  // ===================================================

  expireReservation(reservationId: string): boolean {
    if (this.disposed) return false;

    const reservation =
      this.reservations.get(reservationId);

    if (!reservation) return false;

    if (reservation.status !== "RESERVED") {
      return false;
    }

    // Do not expire a reservation prematurely
    if (Date.now() < reservation.expiresAt) {
      return false;
    }

    const inventory =
      this.requireInventory(reservation.productId);

    // Return locked stock to available inventory
    inventory.reserved -= reservation.quantity;
    inventory.available += reservation.quantity;
    inventory.version += 1;

    reservation.status = "EXPIRED";

    this.clearExpiryTimer(reservationId);
    this.notifyChange();

    return true;
  }

  // ===================================================
  // 6. CANCEL RESERVATION
  // ===================================================

  cancelReservation(reservationId: string): boolean {
    this.assertActive();

    const reservation =
      this.reservations.get(reservationId);

    if (!reservation) return false;

    if (reservation.status !== "RESERVED") {
      return false;
    }

    if (Date.now() >= reservation.expiresAt) {
      this.expireReservation(reservationId);
      return false;
    }

    const inventory =
      this.requireInventory(reservation.productId);

    inventory.reserved -= reservation.quantity;
    inventory.available += reservation.quantity;
    inventory.version += 1;

    reservation.status = "CANCELLED";

    this.clearExpiryTimer(reservationId);
    this.notifyChange();

    return true;
  }

  // ===================================================
  // 7. GET RESERVATION INFORMATION
  // ===================================================

  getReservation(
    reservationId: string
  ): Reservation | undefined {
    const reservation =
      this.reservations.get(reservationId);

    if (!reservation) return undefined;

    // Handle expiry even if background timers are late
    if (
      !this.disposed &&
      reservation.status === "RESERVED" &&
      Date.now() >= reservation.expiresAt
    ) {
      this.expireReservation(reservationId);
    }

    return { ...reservation };
  }

  getReservations(): Reservation[] {
    for (const reservation of this.reservations.values()) {
      if (
        reservation.status === "RESERVED" &&
        Date.now() >= reservation.expiresAt
      ) {
        this.expireReservation(reservation.id);
      }
    }

    return Array.from(
      this.reservations.values(),
      reservation => ({ ...reservation })
    );
  }

  // ===================================================
  // 8. INTERNAL HELPERS
  // ===================================================

  private requireInventory(
    productId: number
  ): InventoryRecord {
    const inventory = this.inventories.get(productId);

    if (!inventory) {
      throw new Error(
        `Inventory not found for product ${productId}`
      );
    }

    return inventory;
  }

  private failure(
    inventory: InventoryRecord,
    reason: string
  ): ReservationResult {
    return {
      success: false,
      reason,
      inventory: { ...inventory },
    };
  }

  private clearExpiryTimer(reservationId: string): void {
    const timer = this.expiryTimers.get(reservationId);

    if (timer !== undefined) {
      clearTimeout(timer);
      this.expiryTimers.delete(reservationId);
    }
  }

  private notifyChange(): void {
    this.onChange?.();
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error(
        "Inventory state machine has been disposed"
      );
    }
  }

  // ===================================================
  // 9. CLEAN UP
  // ===================================================

  dispose(): void {
    if (this.disposed) return;

    this.disposed = true;

    for (const timer of this.expiryTimers.values()) {
      clearTimeout(timer);
    }

    this.expiryTimers.clear();
    this.reservations.clear();
    this.inventories.clear();
    this.onChange = undefined;
  }
}
