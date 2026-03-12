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
  fo: 'Fyzická osoba',
  sro: 's.r.o.',
  sro_spv: 's.r.o. jako SPV',
  druzstvo: 'Družstvo',
} as const;

export const SALE_STATUSES = {
  rezervace: 'Rezervace',
  smlouva: 'Smlouva',
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
  CIT_RATE: 0.21,
  DIVIDEND_WITHHOLDING: 0.15,
  PIT_RATE_LOW: 0.15,
  PIT_RATE_HIGH: 0.23,
  PIT_THRESHOLD: 1_582_812,
  VAT_STANDARD: 21,
  VAT_REDUCED: 12,
  SOCIAL_INSURANCE: 0.292,
  HEALTH_INSURANCE: 0.135,
} as const;
