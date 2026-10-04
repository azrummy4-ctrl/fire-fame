export function validateMinimumWithdrawal(input: string, maximum: number): number | null {
  const minimum = Number(input);
  if (!input.trim() || !Number.isSafeInteger(minimum) || minimum < 1 || minimum > maximum) return null;
  return minimum;
}