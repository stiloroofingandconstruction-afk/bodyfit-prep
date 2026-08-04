/**
 * Valida el SQL de las migraciones sin levantar una base de datos.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE EXISTE
 *
 * Lo correcto seria `supabase db reset` contra un Postgres local. Eso necesita
 * Docker, y no siempre hay Docker: en la maquina donde se escribio esto no lo
 * habia, asi que las migraciones se escribieron completas sin que nadie las
 * hubiera ejecutado nunca.
 *
 * Esta auditoria usa el parser DE VERDAD de Postgres —libpg_query compilado a
 * WebAssembly, el mismo codigo que usa el servidor— y comprueba que cada
 * archivo parsea. No sustituye a ejecutarlas: no valida que una tabla
 * referenciada exista, ni que una politica tenga sentido. Valida sintaxis, que
 * es la clase de error que mas duele descubrir a mitad de un `db push`.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   node scripts/audit-sql.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const DIR = resolve(process.cwd(), 'supabase/migrations');

if (!existsSync(DIR)) {
  console.log('No hay migraciones que validar.');
  process.exit(0);
}

let PgQuery;
try {
  PgQuery = (await import('pg-query-emscripten')).default;
} catch {
  console.error(
    '\nFalta pg-query-emscripten. Instalalo con:  npm i -D pg-query-emscripten\n',
  );
  process.exit(2);
}

const pg = await PgQuery();

let failures = 0;
let statements = 0;

console.log('\nSintaxis de las migraciones');
console.log('-'.repeat(48));

const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();

for (const file of files) {
  const sql = readFileSync(join(DIR, file), 'utf8');
  const result = pg.parse(sql);

  if (result.error) {
    failures++;
    console.log(`  FALLA ${file}`);
    console.log(`        ${result.error.message} (posicion ${result.error.cursorpos})`);
    const from = Math.max(0, result.error.cursorpos - 120);
    const context = sql.slice(from, result.error.cursorpos + 60).replace(/\n/g, ' | ');
    console.log(`        ...${context}`);
    continue;
  }

  const n = result.parse_tree?.stmts?.length ?? 0;
  statements += n;
  console.log(`  ok    ${file.padEnd(34)} ${n} sentencias`);
}

/*
 * Cada migracion tiene que tener su reversion. Una migracion sin `down` es una
 * que solo se puede deshacer restaurando una copia entera.
 */
console.log('\nReversiones');
console.log('-'.repeat(48));

const up = files.filter((f) => !f.endsWith('.down.sql'));
for (const file of up) {
  const down = file.replace(/\.sql$/, '.down.sql');
  const tiene = files.includes(down);
  console.log(`  ${tiene ? 'ok   ' : 'FALLA'} ${file} tiene reversion`);
  if (!tiene) failures++;
}

console.log(
  `\n${failures === 0 ? `SQL CORRECTO — ${statements} sentencias en ${files.length} archivos` : `${failures} PROBLEMAS`}\n`,
);
process.exit(failures === 0 ? 0 : 1);
