export function coinAdjustmentResult(balance: number, amount: number): number | null {
  if (!Number.isFinite(balance) || !Number.isFinite(amount) || amount === 0) return null;
  const nextBalance = balance + amount;
  return nextBalance >= 0 ? nextBalance : null;
}