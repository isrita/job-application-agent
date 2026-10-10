export function normalCdf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const coefficients = [1.061405429, -1.453152027, 1.421413741, -0.284496736, 0.254829592];
  const polynomial = coefficients.reduce((acc, coefficient) => (acc * t) + coefficient, 0);
  const erf = sign * (1 - polynomial * t * Math.exp(-x * x));
  return 0.5 * (1 + erf);
}

export function estimateUpProbability(input: {
  nowPrice: number;
  target: number;
  referenceAverage: number | null;
  moves: { delta: number; elapsedSeconds: number }[];
  secondsLeft: number;
}) {
  const elapsed = input.moves.reduce((sum, move) => sum + Math.max(0, move.elapsedSeconds), 0);
  const squared = input.moves.reduce((sum, move) => sum + move.delta * move.delta, 0);
  const sigma = Math.max(2, elapsed > 0 ? Math.sqrt(squared / elapsed) : 0);
  const reference = input.referenceAverage ?? input.target;
  const x = input.nowPrice - reference;
  const variance = sigma ** 2 * Math.max(0, input.secondsLeft - 60) + sigma ** 2 * 60 / 3;
  const probabilityUp = normalCdf(x / Math.sqrt(Math.max(variance, Number.EPSILON)));
  return {
    x,
    sigma,
    variance,
    probabilityUp: Math.min(1, Math.max(0, probabilityUp)),
    reference,
    referenceSource: input.referenceAverage === null ? "target_fallback" as const : "binance_history" as const,
  };
}
