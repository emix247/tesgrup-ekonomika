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
  investorLoanAmount?: number | null;
  investorLoanRate?: number | null;
  investorLoanDurationMonths?: number | null;
}) {
  const bankLoanAmount = data.bankLoanAmount || 0;
  const bankLoanRate = data.bankLoanRate || 0;
  const bankLoanDurationMonths = data.bankLoanDurationMonths || 0;
  const bankLoanFee = data.bankLoanFee || 0;
  const investorLoanAmount = data.investorLoanAmount || 0;
  const investorLoanRate = data.investorLoanRate || 0;
  const investorLoanDurationMonths = data.investorLoanDurationMonths || 0;

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

  const totalFinancingCost =
    bankCarry.totalInterest +
    investorCarry.totalInterest +
    bankLoanFee;

  const totalCapital =
    data.equityAmount +
    bankLoanAmount +
    investorLoanAmount;

  return {
    bankCarry,
    investorCarry,
    totalFinancingCost,
    totalCapital,
    totalDebt: bankLoanAmount + investorLoanAmount,
    ltv: totalCapital > 0 ? ((bankLoanAmount + investorLoanAmount) / totalCapital) * 100 : 0,
  };
}
