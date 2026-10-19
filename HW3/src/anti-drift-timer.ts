
export function createAntiDriftTimer(
  durationMs: number,
  onTick: (remaining: number) => void
): () => void {
  // Fixed deadline prevents accumulated timer drift
  const targetTime = Date.now() + Math.max(0, durationMs);

  let rafId = 0;
  let stopped = false;

  function tick(): void {
    if (stopped) return;

    // Always calculate from the actual clock
    const remaining = Math.max(
      0,
      targetTime - Date.now()
    );

    onTick(remaining);

    if (remaining > 0 && !stopped) {
      rafId = requestAnimationFrame(tick);
    }
  }

  // Render the initial value immediately
  tick();

  // Cleanup function
  return () => {
    stopped = true;
    cancelAnimationFrame(rafId);
  };
}
