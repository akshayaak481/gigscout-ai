import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = Object.fromEntries(
  envContent
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const url = envVars['NEXT_PUBLIC_SUPABASE_URL']?.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
const key = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(url, key);

async function main() {
  const { data: chunks } = await supabase
    .from('portfolio_embeddings')
    .select('id, profile_id, document_name, chunk_index, chunk_title, content, metadata')
    .order('chunk_index', { ascending: true });

  console.log('--- ALL CHUNKS IN SUPABASE ---');
  chunks?.forEach(c => {
    console.log(`\n=== Chunk #${c.chunk_index}: ${c.chunk_title} ===`);
    console.log(c.content);
  });

  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log('\n--- PROFILES ---');
  console.log(JSON.stringify(profiles, null, 2));
}

main();
