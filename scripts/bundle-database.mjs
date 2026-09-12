import { readFile, readdir, writeFile } from 'node:fs/promises';
const directory = new URL('../supabase/migrations/', import.meta.url);
const files = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort();
const sections = [];
for (const name of files) {
  const sql = await readFile(new URL(name, directory), 'utf8');
  if (sql.match(/^begin;\s*$/gim)?.length !== 1 || sql.match(/^commit;\s*$/gim)?.length !== 1) throw new Error(`Unexpected transaction structure: ${name}`);
  sections.push(`-- Migration: ${name}\n${sql.replace(/^begin;\s*$/im, '').replace(/^commit;\s*$/im, '').trim()}`);
}
const bundle = `-- MAYORDOMO: instalação inicial. Executar uma vez no SQL Editor do Supabase.
-- Não remove dados. Para atualizações, aplicar somente migrations pendentes.
begin;
do $$ begin
  if to_regclass('public.profiles') is not null then
    raise exception 'Schema existente: aplique somente as migrations pendentes.';
  end if;
end $$;
${sections.join('\n\n')}
commit;
`;
await writeFile(new URL('../supabase/SETUP.sql', import.meta.url), bundle);
console.log(`SETUP.sql gerado com ${files.length} migrations em uma transação.`);
