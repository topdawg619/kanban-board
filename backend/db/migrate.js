#!/usr/bin/env node
/**
 * migrate.js — SQLite migration runner for Kanban Board
 *
 * Usage:
 *   node migrate.js           # Run all pending migrations
 *   node migrate.js --seed    # Run migrations + seed data
 *   node migrate.js --reset   # Drop DB and re-run everything (dev only!)
 */

const Database = require('better-sqlite3');
const fs       = require('fs');
const path     = require('path');

const DB_PATH  = path.join(__dirname, '..', 'kanban.db');
const DB_DIR   = __dirname;

const args = process.argv.slice(2);
const withSeed = args.includes('--seed');
const reset    = args.includes('--reset');

if (reset) {
    if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
        console.log('🗑️  Existing database removed.');
    }
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create migrations tracking table
db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        filename   TEXT    NOT NULL UNIQUE,
        applied_at DATETIME NOT NULL DEFAULT (datetime('now'))
    );
`);

// Collect SQL migration files
const allFiles = fs.readdirSync(DB_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

const migrationFiles = allFiles.filter(f => !f.startsWith('002_seed'));
const seedFiles      = allFiles.filter(f => f.startsWith('002_seed'));

const filesToRun = withSeed || reset
    ? [...migrationFiles, ...seedFiles]
    : migrationFiles;

const applied = db.prepare('SELECT filename FROM _migrations').all().map(r => r.filename);

let count = 0;
for (const file of filesToRun) {
    if (applied.includes(file)) {
        console.log(`⏭️  Already applied: ${file}`);
        continue;
    }
    const sql = fs.readFileSync(path.join(DB_DIR, file), 'utf8');
    db.exec(sql);
    db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file);
    console.log(`✅ Applied: ${file}`);
    count++;
}

if (count === 0) {
    console.log('✨ Database is up to date — no migrations to run.');
} else {
    console.log(`\n🚀 Done — ${count} migration(s) applied.`);
}

db.close();
