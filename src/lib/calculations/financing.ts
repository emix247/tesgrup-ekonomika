/**
 * Calculate months elapsed from a start date to today.
 * Returns fractional months for precision.
 */
export function monthsElapsed(startDate: string): number {
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return 0;
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return diffMs / (1000 * 60 * 60 * 24 * 30.44); // average month
}

export function calculateCarryCost(
  loanAmount: number,
  annualRate: number,
  durationMonths: number
): { totalInterest: number; monthlyPayment: number } {
  if (loanAmount <= 0 || annualRate <= 0 || durationMonths <= 0) {
    return { totalInterest: 0, monthlyPayment: 0 };
  }
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = loanAmount * monthlyRate;
  const totalInterest = monthlyPayment * durationMonths;
  return { totalInterest, monthlyPayment };
}

export function calculateFinancingSummary(data: {
  equityAmount: number;
  bankLoanAmount?: number | null;
  bankLoanRate?: number | null;
  bankLoanDurationMonths?: number | null;
  bankLoanFee?: number | null;
  bankLoanStartDate?: string | null;
  investorLoanAmount?: number | null;
  investorLoanRate?: number | null;
  investorLoanDurationMonths?: number | null;
  investorLoanStartDate?: string | null;
}) {
  const bankLoanAmount = data.bankLoanAmount || 0;
  const bankLoanRate = data.bankLoanRate || 0;
  const bankLoanDurationMonths = data.bankLoanDurationMonths || 0;
  const bankLoanFee = data.bankLoanFee || 0;
  const investorLoanAmount = data.investorLoanAmount || 0;
  const investorLoanRate = data.investorLoanRate || 0;
  const investorLoanDurationMonths = data.investorLoanDurationMonths || 0;

  // Calculate elapsed months from start date (if set)
  const bankElapsedMonths = data.bankLoanStartDate
    ? monthsElapsed(data.bankLoanStartDate)
    : 0;
  const investorElapsedMonths = data.investorLoanStartDate
    ? monthsElapsed(data.investorLoanStartDate)
    : 0;

  // Total planned carry cost (based on full duration)
  const bankCarry = calculateCarryCost(
    bankLoanAmount,
    bankLoanRate,
    bankLoanDurationMonths
  );

  const investorCarry = calculateCarryCost(
    investorLoanAmount,
    investorLoanRate,
    investorLoanDurationMonths
  );

  // Accrued interest so far (based on elapsed months since start date)
  const bankAccrued = calculateCarryCost(
    bankLoanAmount,
    bankLoanRate,
    Math.min(bankElapsedMonths, bankLoanDurationMonths || Infinity)
  );

  const investorAccrued = calculateCarryCost(
    investorLoanAmount,
    investorLoanRate,
    Math.min(investorElapsedMonths, investorLoanDurationMonths || Infinity)
  );

  const totalFinancingCost =
    bankCarry.totalInterest +
    investorCarry.totalInterest +
    bankLoanFee;

  const totalAccruedInterest =
    bankAccrued.totalInterest +
    investorAccrued.totalInterest;

  const totalCapital =
    data.equityAmount +
    bankLoanAmount +
    investorLoanAmount;

  return {
    bankCarry,
    investorCarry,
    bankAccrued,
    investorAccrued,
    bankElapsedMonths,
    investorElapsedMonths,
    totalFinancingCost,
    totalAccruedInterest,
    totalCapital,
    totalDebt: bankLoanAmount + investorLoanAmount,
    ltv: totalCapital > 0 ? ((bankLoanAmount + investorLoanAmount) / totalCapital) * 100 : 0,
  };
}
