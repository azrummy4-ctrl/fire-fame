export const DEPOSIT_BONUSES = [
  { deposit: 50, bonus: 5 },
  { deposit: 100, bonus: 11 },
  { deposit: 200, bonus: 22 },
  { deposit: 300, bonus: 33 },
] as const;

export function depositBonus(amount: number) {
  return DEPOSIT_BONUSES.find((row) => row.deposit === amount)?.bonus ?? 0;
}