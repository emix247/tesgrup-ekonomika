# Tesgrup Development — Ekonomika projektů

Webová aplikace pro správu ekonomiky developerských projektů firmy Tesgrup s.r.o.

## Spuštění

```bash
npm install
npx drizzle-kit generate
npx drizzle-kit migrate
npm run dev
```

Aplikace poběží na `http://localhost:3000`.

## Struktura aplikace

### 3 úrovně pohledu

1. **Portfolio** (`/portfolio`) — konsolidovaný přehled všech projektů s kartami a semafory
2. **Projekt** (`/projekty/[id]`) — detail projektu s dvěma fázemi:
   - **Předpoklad** — příjmy, náklady, financování, daně, výstupy (zisk, ROE, IRR, sensitivity)
   - **Skutečnost** — evidence nákladů, prodejů, čerpání úvěru, odchylky
3. **Režijní náklady** (`/rezijni-naklady`) — fixní měsíční náklady + alokace do projektů

### Tech stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS v4**
- **SQLite** (better-sqlite3 + Drizzle ORM)
- **Recharts** (grafy)

### Adresářová struktura

```
src/
  app/           — stránky a API routes
  components/    — React komponenty (ui, layout, predpoklad, skutecnost, charts, rezijni)
  lib/
    db/          — databázové schéma a připojení
    calculations/— výpočetní logika (IRR, daně, sensitivity, variance)
    queries/     — databázové dotazy
    utils/       — formátování, konstanty, validace
  types/         — TypeScript typy
```

### Rozšiřování

- Nové nákladové kategorie: `src/lib/utils/constants.ts` → `COST_CATEGORIES`
- Nové daňové sazby: `src/lib/utils/constants.ts` → `TAX_RATES`
- Nový výpočet: přidejte soubor do `src/lib/calculations/`
- Nová DB tabulka: přidejte do `src/lib/db/schema.ts`, pak `npx drizzle-kit generate && npx drizzle-kit migrate`
