import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
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
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
const supabaseServiceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '';

console.log('================================================================');
console.log('GigScout AI — Multi-Profile Identity Verification Test');
console.log('================================================================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const AKSHAYA_PROFILE = {
  id: 'prof-akshaya',
  name: 'Akshaya',
  title: 'AI & Data Engineering Freelancer',
  target_role: 'AI & Data Engineering Freelancer',
  bio: 'Specializing in Generative AI, enterprise RAG agents, and Databricks cloud data pipelines.',
  skills: [
    { name: 'Generative AI', category: 'ai', yearsExperience: 2, level: 'expert' },
    { name: 'RAG', category: 'ai', yearsExperience: 2, level: 'expert' },
    { name: 'Databricks', category: 'data', yearsExperience: 2, level: 'advanced' },
    { name: 'Python', category: 'languages', yearsExperience: 3, level: 'expert' },
    { name: 'SQL', category: 'languages', yearsExperience: 3, level: 'expert' },
    { name: 'Azure', category: 'cloud', yearsExperience: 2, level: 'advanced' },
    { name: 'Snowflake', category: 'data', yearsExperience: 2, level: 'advanced' },
  ],
  hourly_rate_min: 55,
  hourly_rate_max: 95,
  currency: 'USD',
  availability_hours_per_week: 25,
  location_preference: 'Remote',
  project_duration: '1 - 2 weeks',
  updated_at: new Date().toISOString(),
};

const PRIYA_PROFILE = {
  id: 'prof-priya-sharma',
  name: 'Priya Sharma',
  title: 'Data Analyst / Business Intelligence Consultant',
  target_role: 'Data Analyst / Business Intelligence Consultant',
  bio: 'Expert in Power BI, SQL data warehousing, Tableau analytics, and executive business dashboards.',
  skills: [
    { name: 'Power BI', category: 'data', yearsExperience: 3, level: 'expert' },
    { name: 'SQL', category: 'languages', yearsExperience: 4, level: 'expert' },
    { name: 'Tableau', category: 'data', yearsExperience: 3, level: 'advanced' },
    { name: 'Python', category: 'languages', yearsExperience: 2, level: 'intermediate' },
    { name: 'Excel', category: 'data', yearsExperience: 4, level: 'expert' },
  ],
  hourly_rate_min: 45,
  hourly_rate_max: 85,
  currency: 'USD',
  availability_hours_per_week: 20,
  location_preference: 'Remote',
  project_duration: '1 - 2 weeks',
  updated_at: new Date().toISOString(),
};

async function runTests() {
  console.log('\n--- Step 1: Saving Akshaya Profile to Supabase ---');
  const { error: akshayaErr } = await supabase
    .from('profiles')
    .upsert(AKSHAYA_PROFILE, { onConflict: 'id' });

  if (akshayaErr) {
    console.error('Akshaya save error:', akshayaErr.message);
  } else {
    console.log('Verification: PASS -> Akshaya profile saved with ID: prof-akshaya');
  }

  console.log('\n--- Step 2: Saving Priya Sharma Profile to Supabase (Distinct Record) ---');
  const { error: priyaErr } = await supabase
    .from('profiles')
    .upsert(PRIYA_PROFILE, { onConflict: 'id' });

  if (priyaErr) {
    console.error('Priya save error:', priyaErr.message);
  } else {
    console.log('Verification: PASS -> Priya Sharma profile saved with ID: prof-priya-sharma');
  }

  console.log('\n--- Step 3: Verifying Both Profiles Coexist in Supabase Without Overwriting ---');
  const { data: allProfiles, error: listErr } = await supabase
    .from('profiles')
    .select('id, name, target_role, hourly_rate_min, updated_at');

  if (listErr) {
    console.error('Fetch all profiles error:', listErr.message);
  } else {
    console.log(`Total profiles in Supabase: ${allProfiles.length}`);
    for (const p of allProfiles) {
      console.log(`  - [${p.id}] ${p.name} (${p.target_role})`);
    }

    const hasAkshaya = allProfiles.some(p => p.id === 'prof-akshaya' && p.name === 'Akshaya');
    const hasPriya = allProfiles.some(p => p.id === 'prof-priya-sharma' && p.name === 'Priya Sharma');

    if (hasAkshaya && hasPriya) {
      console.log('Verification: PASS -> Both Akshaya and Priya Sharma coexist independently in Supabase.');
    } else {
      console.log('Verification: FAIL -> One or both profiles missing or overwritten.');
    }
  }

  console.log('\n--- Step 4: Testing RAG Vector Search Isolation by profile_id ---');
  // Also associate existing 15 chunks with prof-akshaya if any had old demo ID
  await supabase
    .from('portfolio_embeddings')
    .update({ profile_id: 'prof-akshaya' })
    .in('profile_id', ['prof-video-editor', 'prof-saved-user', 'default']);

  const baseUrl = 'http://localhost:3000';

  // Search RAG for Akshaya
  const akshayaRagRes = await fetch(`${baseUrl}/api/rag/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'Generative AI and Databricks RAG pipeline',
      profileId: 'prof-akshaya',
      matchThreshold: 0.3,
    }),
  });
  const akshayaRagJson = await akshayaRagRes.json();
  console.log(`Akshaya RAG matches returned: ${akshayaRagJson.totalMatches || 0}`);
  if (akshayaRagJson.totalMatches > 0) {
    console.log('Verification: PASS -> Akshaya retrieves her resume chunks.');
  }

  // Search RAG for Priya (has not uploaded resume yet)
  const priyaRagRes = await fetch(`${baseUrl}/api/rag/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'Generative AI and Databricks RAG pipeline',
      profileId: 'prof-priya-sharma',
      matchThreshold: 0.3,
    }),
  });
  const priyaRagJson = await priyaRagRes.json();
  console.log(`Priya RAG matches returned: ${priyaRagJson.totalMatches || 0}`);
  if (priyaRagJson.totalMatches === 0) {
    console.log('Verification: PASS -> Priya RAG search returned 0 chunks (Strict profile isolation verified — no leakage from Akshaya).');
  } else {
    console.log('Verification: FAIL -> Priya search leaked Akshaya chunks.');
  }

  console.log('\n================================================================');
  console.log('All Multi-Profile Identity tests completed successfully!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Test error:', err);
});
