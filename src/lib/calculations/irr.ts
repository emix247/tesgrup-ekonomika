function calculateNPV(cashFlows: number[], rate: number): number {
  return cashFlows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + rate, i), 0);
}

function calculateNPVDerivative(cashFlows: number[], rate: number): number {
  let dnpv = 0;
  for (let j = 1; j < cashFlows.length; j++) {
    dnpv -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
  }
  return dnpv;
}

function irrBisection(
  cashFlows: number[],
  low: number,
  high: number,
  maxIter: number,
  tolerance: number
): number | null {
  for (let i = 0; i < maxIter; i++) {
    const mid = (low + high) / 2;
    const npvMid = calculateNPV(cashFlows, mid);
    if (Math.abs(npvMid) < tolerance) return mid;
    if (npvMid > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

export function calculateIRR(
  cashFlows: number[],
  guess = 0.1,
  maxIter = 100,
  tolerance = 1e-7
): number | null {
  if (cashFlows.length < 2) return null;

  // Newton-Raphson
  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    const npv = calculateNPV(cashFlows, rate);
    if (Math.abs(npv) < tolerance) return rate;

    const dnpv = calculateNPVDerivative(cashFlows, rate);
    if (Math.abs(dnpv) < 1e-12) break;

    rate = rate - npv / dnpv;
    if (rate < -0.999) rate = -0.5;
    if (rate > 10) rate = 5;
  }

  // Fallback: bisection
  return irrBisection(cashFlows, -0.5, 5.0, maxIter, tolerance);
}
