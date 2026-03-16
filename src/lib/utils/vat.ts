/** Vč. DPH → Bez DPH */
export function grossToNet(gross: number, vatRate: number): number {
  if (!vatRate || vatRate <= 0) return gross;
  return gross / (1 + vatRate / 100);
}

/** Bez DPH → Vč. DPH */
export function netToGross(net: number, vatRate: number): number {
  if (!vatRate || vatRate <= 0) return net;
  return net * (1 + vatRate / 100);
}

/** DPH částka z ceny vč. DPH */
export function vatFromGross(gross: number, vatRate: number): number {
  return gross - grossToNet(gross, vatRate);
}

/** Default sazby dle kontextu */
export function getDefaultVatRate(context: 'revenue' | 'cost', category?: string): number {
  if (category === 'pozemek') return 0;
  return context === 'revenue' ? 12 : 21;
}
