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
  bankLoanAmount: number;
  bankLoanRate: number;
  bankLoanDurationMonths: number;
  bankLoanFee: number;
  investorLoanAmount: number;
  investorLoanRate: number;
  investorLoanDurationMonths: number;
}) {
  const bankCarry = calculateCarryCost(
    data.bankLoanAmount,
    data.bankLoanRate,
    data.bankLoanDurationMonths
  );

  const investorCarry = calculateCarryCost(
    data.investorLoanAmount,
    data.investorLoanRate,
    data.investorLoanDurationMonths
  );

  const totalFinancingCost =
    bankCarry.totalInterest +
    investorCarry.totalInterest +
    (data.bankLoanFee || 0);

  const totalCapital =
    data.equityAmount +
    data.bankLoanAmount +
    data.investorLoanAmount;

  return {
    bankCarry,
    investorCarry,
    totalFinancingCost,
    totalCapital,
    totalDebt: data.bankLoanAmount + data.investorLoanAmount,
    ltv: totalCapital > 0 ? ((data.bankLoanAmount + data.investorLoanAmount) / totalCapital) * 100 : 0,
  };
}
