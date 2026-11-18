export function coinAdjustmentResult(balance: number, amount: number): number | null {
  if (!Number.isFinite(balance) || !Number.isFinite(amount) || amount === 0 || !Number.isFinite(balance + amount)) return null;
  const nextBalance = balance + amount;
  return nextBalance >= 0 ? nextBalance : null;
}