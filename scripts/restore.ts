/**
 * Obnovaci script — obnovi data ze zalohy do Neon databaze.
 * Spusteni: npm run restore -- backup-2026-03-12-23-00-00.json
 * POZOR: Smaze aktualni data a nahradi je ze zalohy!
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const BACKUP_DIR = path.join(process.env.HOME || '~', 'Desktop', 'claude', 'tesgrup-backups');

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'ano' || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  let backupFile = process.argv[2];

  if (!backupFile) {
    // Zobraz seznam dostupnych zaloh
    if (!fs.existsSync(BACKUP_DIR)) {
      console.error('❌ Zadne zalohy nenalezeny v:', BACKUP_DIR);
      process.exit(1);
    }

    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('backup-') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.error('❌ Zadne zalohy nenalezeny v:', BACKUP_DIR);
      process.exit(1);
    }

    console.log('📦 Dostupne zalohy (nejnovejsi prvni):');
    files.forEach((f, i) => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`  ${i + 1}. ${f} (${sizeMB} MB)`);
    });

    console.log('\nPouziti: npm run restore -- <nazev-souboru>');
    console.log('Priklad: npm run restore -- ' + files[0]);
    process.exit(0);
  }

  // Pokud neni absolutni cesta, hledej v BACKUP_DIR
  if (!path.isAbsolute(backupFile)) {
    backupFile = path.join(BACKUP_DIR, backupFile);
  }

  if (!fs.existsSync(backupFile)) {
    console.error('❌ Soubor nenalezen:', backupFile);
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  const totalRecords = Object.values(backup.tables as Record<string, number>).reduce((s, n) => s + n, 0);

  console.log(`\n📦 Zaloha z: ${backup.exportedAt}`);
  console.log(`   Zaznamy: ${backup.tables.projects} projektu, ${backup.tables.forecastCosts} plan. nakladu, ${backup.tables.actualCosts} skut. nakladu`);
  console.log(`   Celkem: ${totalRecords} zaznamu`);

  const ok = await confirm(
    '\n⚠️  POZOR: Tato akce SMAZE vsechna aktualni data a nahradi je ze zalohy!\nOpravdu chcete pokracovat? (ano/ne): '
  );

  if (!ok) {
    console.log('❌ Obnova zrusena.');
    process.exit(0);
  }

  console.log('\n🔄 Obnovuji data...');

  const { data } = backup;

  // Smaz v spravnem poradi (kvuli foreign keys) — child tables first
  await db.delete(schema.overheadAllocations);
  await db.delete(schema.overheadCosts);
  await db.delete(schema.milestones);
  await db.delete(schema.loanDrawdowns);
  await db.delete(schema.sales);
  await db.delete(schema.actualCosts);
  await db.delete(schema.taxConfig);
  await db.delete(schema.financing);
  await db.delete(schema.forecastCosts);
  await db.delete(schema.revenueExtras);
  await db.delete(schema.revenueUnits);
  await db.delete(schema.projects);

  console.log('   Stara data smazana.');

  // Obnov v spravnem poradi — parent tables first
  if (data.projects?.length) {
    for (const row of data.projects) {
      await db.insert(schema.projects).values(row);
    }
    console.log(`   ✅ ${data.projects.length} projektu`);
  }

  if (data.revenueUnits?.length) {
    for (const row of data.revenueUnits) {
      await db.insert(schema.revenueUnits).values(row);
    }
    console.log(`   ✅ ${data.revenueUnits.length} prijem. jednotek`);
  }

  if (data.revenueExtras?.length) {
    for (const row of data.revenueExtras) {
      await db.insert(schema.revenueExtras).values(row);
    }
    console.log(`   ✅ ${data.revenueExtras.length} prijem. extras`);
  }

  if (data.forecastCosts?.length) {
    for (const row of data.forecastCosts) {
      await db.insert(schema.forecastCosts).values(row);
    }
    console.log(`   ✅ ${data.forecastCosts.length} plan. nakladu`);
  }

  if (data.financing?.length) {
    for (const row of data.financing) {
      await db.insert(schema.financing).values(row);
    }
    console.log(`   ✅ ${data.financing.length} financovani`);
  }

  if (data.taxConfig?.length) {
    for (const row of data.taxConfig) {
      await db.insert(schema.taxConfig).values(row);
    }
    console.log(`   ✅ ${data.taxConfig.length} dan. konfiguraci`);
  }

  if (data.actualCosts?.length) {
    for (const row of data.actualCosts) {
      await db.insert(schema.actualCosts).values(row);
    }
    console.log(`   ✅ ${data.actualCosts.length} skut. nakladu`);
  }

  if (data.sales?.length) {
    for (const row of data.sales) {
      await db.insert(schema.sales).values(row);
    }
    console.log(`   ✅ ${data.sales.length} prodeju`);
  }

  if (data.loanDrawdowns?.length) {
    for (const row of data.loanDrawdowns) {
      await db.insert(schema.loanDrawdowns).values(row);
    }
    console.log(`   ✅ ${data.loanDrawdowns.length} cerpani`);
  }

  if (data.milestones?.length) {
    for (const row of data.milestones) {
      await db.insert(schema.milestones).values(row);
    }
    console.log(`   ✅ ${data.milestones.length} milniku`);
  }

  if (data.overheadCosts?.length) {
    for (const row of data.overheadCosts) {
      await db.insert(schema.overheadCosts).values(row);
    }
    console.log(`   ✅ ${data.overheadCosts.length} rezijnich nakladu`);
  }

  if (data.overheadAllocations?.length) {
    for (const row of data.overheadAllocations) {
      await db.insert(schema.overheadAllocations).values(row);
    }
    console.log(`   ✅ ${data.overheadAllocations.length} alokaci`);
  }

  console.log('\n✅ Data uspesne obnovena ze zalohy!');
}

main().catch((e) => {
  console.error('❌ Chyba pri obnove:', e);
  process.exit(1);
});
