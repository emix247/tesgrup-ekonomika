export const PROJECT_TYPES = {
  bytovy_dum: 'Bytový dům',
  rodinne_domy: 'Rodinné domy',
  komercni: 'Komerční',
  smiseny: 'Smíšený',
  garaze: 'Garáže',
} as const;

export const PROJECT_STATUSES = {
  priprava: 'Příprava',
  realizace: 'Realizace',
  prodej: 'Prodej',
  dokonceno: 'Dokončeno',
  archivovano: 'Archivováno',
} as const;

export const COST_CATEGORIES = {
  pozemek: 'Pozemek',
  projektova_dokumentace: 'Projektová dokumentace (DUR/DSP/DPS)',
  inzenyrska_cinnost: 'Inženýring a povolení',
  site_infrastruktura: 'Přípojky a infrastruktura',
  priprava_stavby: 'Příprava staveniště',
  stavba_hlavni: 'Stavba — hlavní objekt',
  marketing: 'Marketing a prodej',
  management: 'Správa projektu (TDI)',
  pravni_sluzby: 'Právní a notářské náklady',
  kolaudace: 'Kolaudace',
  rezerva: 'Rezerva (contingency)',
} as const;

export const UNIT_TYPES = {
  byt: 'Byt',
  dum: 'Rodinný dům',
  garaz: 'Garáž',
  komercni_prostor: 'Komerční prostor',
} as const;

export const EXTRA_CATEGORIES = {
  garaz: 'Garážové stání',
  sklep: 'Sklep',
  terasa: 'Terasa',
  parkovani: 'Parkovací stání',
  jine: 'Jiné',
} as const;

export const LEGAL_FORMS = {
  sro: 'Tesgrup s.r.o.',
  sro_spv: 'SPV s.r.o.',
  fo: 'Fyzická osoba',
  druzstvo: 'Družstvo',
} as const;

export const SALE_STATUSES = {
  rezervace: 'Rezervace',
  smlouva: 'Smlouva',
  zaloha: 'Záloha',
  zaplaceno: 'Zaplaceno',
  predano: 'Předáno',
  stornovano: 'Stornováno',
} as const;

export const PAYMENT_STATUSES = {
  neuhrazeno: 'Neuhrazeno',
  castecne_uhrazeno: 'Částečně uhrazeno',
  uhrazeno: 'Uhrazeno',
} as const;

export const MILESTONE_STATUSES = {
  ceka: 'Čeká',
  probiha: 'Probíhá',
  splneno: 'Splněno',
  zpozdeno: 'Zpožděno',
} as const;

export const TAX_RATES = {
  CIT_RATE: 0.21,              // DPPO sazba (s.r.o., družstvo)
  PIT_RATE_LOW: 0.15,          // DPFO 1. pásmo
  PIT_RATE_HIGH: 0.23,         // DPFO 2. pásmo
  PIT_THRESHOLD: 1_582_812,    // Hranice DPFO pásem (36× průměrná mzda, 2025)
  VAT_RESIDENTIAL: 12,         // DPH bytová výstavba (snížená sazba)
  VAT_STANDARD: 21,            // DPH základní sazba
} as const;
