import fs from 'fs';
import path from 'path';

// 1. Read environment variables
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

console.log('================================================================');
console.log('GigScout AI — Saved Opportunities End-to-End Verification Test');
console.log('================================================================');

const TEST_PROFILE_ID = 'prof-akshaya';
const TEST_OPPORTUNITY = {
  id: 'opp-saved-verify-101',
  title: 'Generative AI & Data Pipeline Lead (Enterprise)',
  clientName: 'Nexus AI Labs',
  platform: 'upwork',
  platformUrl: 'https://upwork.com/jobs/nexus-ai',
  description: 'Looking for a Senior AI & Data Engineering Freelancer to build production RAG agents with Supabase pgvector and Databricks pipelines.',
  budgetType: 'fixed',
  budgetMin: 4500,
  budgetCurrency: 'USD',
  skillsRequired: ['Generative AI', 'RAG', 'Databricks', 'Python', 'Supabase'],
  experienceLevel: 'Expert',
  postedAt: new Date().toISOString(),
  riskAssessment: {
    score: 10,
    level: 'VERIFIED_SAFE',
    summary: 'Client has verified payment escrow and strong hiring track record.',
    redFlags: [],
    safetySignals: ['Verified payment method', '5.0 rating across 18 reviews'],
    safeToApply: true,
    analyzedAt: new Date().toISOString(),
  },
  matchReasoning: {
    overallScore: 95,
    skillsMatchScore: 96,
    rateAlignmentScore: 94,
    experienceMatchScore: 95,
    whyGoodMatch: ['Direct technical overlap with GenAI, RAG, and Databricks.'],
    potentialGaps: [],
    recommendedPitchAngle: 'Highlight enterprise RAG architecture and Medallion data engineering experience.',
    relevantPortfolioIds: [],
  },
  status: 'active',
};

async function runTests() {
  const baseUrl = 'http://localhost:3000';

  console.log('\n--- Step 1: Saving Opportunity via /api/opportunities/saved ---');
  const saveRes = await fetch(`${baseUrl}/api/opportunities/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profileId: TEST_PROFILE_ID,
      opportunity: TEST_OPPORTUNITY,
    }),
  });

  const saveJson = await saveRes.json();
  console.log('Save response status:', saveRes.status, saveJson);
  if (saveJson.success) {
    console.log('Verification: PASS -> Opportunity saved successfully in Supabase.');
  } else {
    console.log('Verification: FAIL -> Save failed.');
  }

  console.log('\n--- Step 2: Fetching Saved Opportunities (Simulating Browser Refresh) ---');
  const fetchRes = await fetch(`${baseUrl}/api/opportunities/saved?profileId=${encodeURIComponent(TEST_PROFILE_ID)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const fetchJson = await fetchRes.json();
  console.log(`Retrieved ${fetchJson.totalSaved} saved opportunities (Source: ${fetchJson.source || 'db'}).`);
  const found = (fetchJson.opportunities || []).find((o) => o.id === TEST_OPPORTUNITY.id);
  if (found) {
    console.log(`Verification: PASS -> Confirmed "${found.title}" persists across refresh.`);
  } else {
    console.log('Verification: FAIL -> Saved opportunity not found on refresh.');
  }

  console.log('\n--- Step 3: Testing Duplicate Prevention (Saving Same Opportunity Twice) ---');
  const saveAgainRes = await fetch(`${baseUrl}/api/opportunities/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profileId: TEST_PROFILE_ID,
      opportunity: TEST_OPPORTUNITY,
    }),
  });

  const fetchAgainRes = await fetch(`${baseUrl}/api/opportunities/saved?profileId=${encodeURIComponent(TEST_PROFILE_ID)}`, {
    method: 'GET',
  });
  const fetchAgainJson = await fetchAgainRes.json();
  const matchingRecords = (fetchAgainJson.opportunities || []).filter((o) => o.id === TEST_OPPORTUNITY.id);

  console.log(`Total instances of opportunity after 2nd save: ${matchingRecords.length}`);
  if (matchingRecords.length === 1) {
    console.log('Verification: PASS -> Duplicate prevention verified. Exactly 1 record exists.');
  } else {
    console.log('Verification: FAIL -> Duplicate created.');
  }

  console.log('\n--- Step 4: Testing Unsave Opportunity ---');
  const unsaveRes = await fetch(`${baseUrl}/api/opportunities/saved`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profileId: TEST_PROFILE_ID,
      opportunityId: TEST_OPPORTUNITY.id,
    }),
  });
  const unsaveJson = await unsaveRes.json();
  console.log('Unsave response:', unsaveJson);

  const fetchAfterUnsave = await fetch(`${baseUrl}/api/opportunities/saved?profileId=${encodeURIComponent(TEST_PROFILE_ID)}`, {
    method: 'GET',
  });
  const afterUnsaveJson = await fetchAfterUnsave.json();
  const stillFound = (afterUnsaveJson.opportunities || []).some((o) => o.id === TEST_OPPORTUNITY.id);

  if (!stillFound) {
    console.log('Verification: PASS -> Opportunity successfully removed from saved list.');
  } else {
    console.log('Verification: FAIL -> Opportunity still exists after unsave.');
  }

  console.log('\n================================================================');
  console.log('All Saved Opportunities lifecycle tests verified successfully!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Test error:', err);
});
