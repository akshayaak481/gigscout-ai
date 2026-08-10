import fs from 'fs';
import path from 'path';
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

const rawUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'] || '';
const url = rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
const key = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '';

console.log('--- SUPABASE INSPECTION REPORT ---');
console.log('Target URL:', url);

const supabase = createClient(url, key);

async function run() {
  console.log('\n1. Checking table: public.portfolio_embeddings');
  const { data: rows, error: chunkErr, count } = await supabase
    .from('portfolio_embeddings')
    .select('id, profile_id, document_name, chunk_index, chunk_title, content, created_at', { count: 'exact' });

  if (chunkErr) {
    console.log('Error reading portfolio_embeddings:', chunkErr.message, chunkErr.code);
  } else {
    console.log(`Total rows in portfolio_embeddings: ${rows.length} (count: ${count})`);
    if (rows.length === 0) {
      console.log('-> portfolio_embeddings is currently EMPTY (0 rows).');
    } else {
      const docGroups = {};
      rows.forEach(r => {
        if (!docGroups[r.document_name]) docGroups[r.document_name] = [];
        docGroups[r.document_name].push(r);
      });
      console.log('\nDocuments found in portfolio_embeddings:');
      for (const [docName, docRows] of Object.entries(docGroups)) {
        console.log(`- Document "${docName}": ${docRows.length} chunks`);
        docRows.forEach(dr => {
          console.log(`    Chunk #${dr.chunk_index}: "${dr.chunk_title}" (ID: ${dr.id})`);
        });
      }
    }
  }

  console.log('\n2. Checking table: public.profiles');
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, name, title, updated_at');

  if (profErr) {
    console.log('Error reading profiles:', profErr.message);
  } else {
    console.log(`Total profiles in database: ${profiles ? profiles.length : 0}`);
    if (profiles && profiles.length > 0) {
      profiles.forEach(p => {
        console.log(`- Profile [${p.id}]: ${p.name} - ${p.title}`);
      });
    }
  }
}

run();
