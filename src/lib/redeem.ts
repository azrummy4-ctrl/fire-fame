export const REDEEM_AMOUNTS = [30, 50, 100, 150, 200, 500] as const;

export function redeemProgress(balance: number, amount: number) {
  return Math.max(0, Math.min(100, (balance / amount) * 100));
}
