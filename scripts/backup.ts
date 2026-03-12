/**
 * Zalohovaci script — exportuje vsechna data z Neon PostgreSQL do JSON souboru.
 * Spusteni: npm run backup
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const BACKUP_DIR = path.join(process.env.HOME || '~', 'Desktop', 'claude', 'tesgrup-backups');
const MAX_BACKUPS = 30;

async function main() {
  console.log('🔄 Spoustim zalohu databaze...');

  // Vytvor slozku pokud neexistuje
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Export vsech tabulek
  const [
    projects,
    revenueUnits,
    revenueExtras,
    forecastCosts,
    financing,
    taxConfig,
    actualCosts,
    sales,
    loanDrawdowns,
    milestones,
    overheadCosts,
    overheadAllocations,
  ] = await Promise.all([
    db.select().from(schema.projects),
    db.select().from(schema.revenueUnits),
    db.select().from(schema.revenueExtras),
    db.select().from(schema.forecastCosts),
    db.select().from(schema.financing),
    db.select().from(schema.taxConfig),
    db.select().from(schema.actualCosts),
    db.select().from(schema.sales),
    db.select().from(schema.loanDrawdowns),
    db.select().from(schema.milestones),
    db.select().from(schema.overheadCosts),
    db.select().from(schema.overheadAllocations),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    app: 'tesgrup-ekonomika',
    tables: {
      projects: projects.length,
      revenueUnits: revenueUnits.length,
      revenueExtras: revenueExtras.length,
      forecastCosts: forecastCosts.length,
      financing: financing.length,
      taxConfig: taxConfig.length,
      actualCosts: actualCosts.length,
      sales: sales.length,
      loanDrawdowns: loanDrawdowns.length,
      milestones: milestones.length,
      overheadCosts: overheadCosts.length,
      overheadAllocations: overheadAllocations.length,
    },
    data: {
      projects,
      revenueUnits,
      revenueExtras,
      forecastCosts,
      financing,
      taxConfig,
      actualCosts,
      sales,
      loanDrawdowns,
      milestones,
      overheadCosts,
      overheadAllocations,
    },
  };

  // Nazev souboru s datem a casem
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
  const filename = `backup-${dateStr}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');

  const sizeMB = (fs.statSync(filepath).size / 1024 / 1024).toFixed(2);
  const totalRecords = Object.values(backup.tables).reduce((s, n) => s + n, 0);
  console.log(`✅ Zaloha ulozena: ${filepath}`);
  console.log(`   Velikost: ${sizeMB} MB`);
  console.log(`   Zaznamy: ${projects.length} projektu, ${forecastCosts.length} plan. nakladu, ${actualCosts.length} skut. nakladu, ${sales.length} prodeju`);
  console.log(`   Celkem: ${totalRecords} zaznamu v ${Object.keys(backup.tables).length} tabulkach`);

  // Smaz stare zalohy (uchovej poslednich MAX_BACKUPS)
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('backup-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS);
    for (const f of toDelete) {
      fs.unlinkSync(path.join(BACKUP_DIR, f));
      console.log(`🗑️  Smazana stara zaloha: ${f}`);
    }
  }

  console.log(`📦 Celkem zaloh: ${Math.min(files.length, MAX_BACKUPS)} (max ${MAX_BACKUPS})`);
}

main().catch((e) => {
  console.error('❌ Chyba pri zalohovani:', e);
  process.exit(1);
});
