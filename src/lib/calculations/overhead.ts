/**
 * Calculate allocated overhead costs for a project.
 *
 * Monthly overhead × allocation% × number of months from construction start to today (or end date).
 */

interface OverheadCost {
  monthlyAmount: number;
  isActive: boolean | null;
}

interface OverheadAllocation {
  projectId: string;
  allocationPercent: number;
}

interface OverheadResult {
  monthlyOverhead: number;      // project's monthly allocated overhead
  months: number;               // number of months from construction start
  totalOverhead: number;        // total allocated overhead for the project
  allocationPercent: number;    // the allocation %
}

/**
 * Calculates the number of months between two dates (inclusive of partial months).
 * Returns at least 0.
 */
function monthsBetween(from: Date, to: Date): number {
  if (to <= from) return 0;
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  const days = to.getDate() - from.getDate();
  // Full months + partial month fraction
  let total = years * 12 + months;
  if (days > 0) {
    const daysInMonth = new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate();
    total += days / daysInMonth;
  }
  return Math.max(0, Math.ceil(total * 10) / 10); // round to 1 decimal
}

export function calculateProjectOverhead(
  projectId: string,
  constructionStartDate: string | null | undefined,
  endDate: string | null | undefined,
  overheadCosts: OverheadCost[],
  allocations: OverheadAllocation[],
): OverheadResult {
  const empty: OverheadResult = { monthlyOverhead: 0, months: 0, totalOverhead: 0, allocationPercent: 0 };

  // No construction start date → no overhead allocation
  if (!constructionStartDate) return empty;

  const allocation = allocations.find(a => a.projectId === projectId);
  if (!allocation || allocation.allocationPercent <= 0) return empty;

  const totalMonthly = overheadCosts
    .filter(c => c.isActive !== false)
    .reduce((s, c) => s + c.monthlyAmount, 0);

  if (totalMonthly <= 0) return empty;

  const from = new Date(constructionStartDate);
  // Use end date if project is finished, otherwise today
  const to = endDate ? new Date(endDate) : new Date();
  const months = monthsBetween(from, to);

  const monthlyOverhead = totalMonthly * (allocation.allocationPercent / 100);
  const totalOverhead = Math.round(monthlyOverhead * months);

  return {
    monthlyOverhead,
    months,
    totalOverhead,
    allocationPercent: allocation.allocationPercent,
  };
}
