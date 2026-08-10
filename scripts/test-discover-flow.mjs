import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('GigScout AI — Opportunity Discovery Flow Investigation for Priya');
console.log('================================================================');

async function testDiscover() {
  const baseUrl = 'http://localhost:3000';
  const profileId = 'prof-priya-sharma';

  console.log(`\n1. Fetching profile details for active ID: ${profileId}`);
  const profRes = await fetch(`${baseUrl}/api/profile?profileId=${encodeURIComponent(profileId)}`);
  const profJson = await profRes.json();
  
  if (!profJson.success || !profJson.profile) {
    console.error('Failed to load profile:', profJson);
    return;
  }

  const profile = profJson.profile;
  const skillNames = (profile.skills || []).map(s => (typeof s === 'string' ? s : s.name));

  console.log(`ACTIVE PROFILE ID: ${profile.id}`);
  console.log(`→ PROFILE NAME: ${profile.name}`);
  console.log(`→ TARGET ROLE: ${profile.targetRole}`);
  console.log(`→ SKILLS: ${skillNames.join(', ')}`);

  console.log(`\n2. Triggering /api/opportunities/discover with { profileId: "${profileId}" }`);
  const discoverRes = await fetch(`${baseUrl}/api/opportunities/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId }),
  });

  const discoverJson = await discoverRes.json();
  console.log('Discovery API Response Status:', discoverRes.status);

  if (!discoverJson.success) {
    console.error('Discovery failed:', discoverJson.error || discoverJson);
    return;
  }

  console.log(`→ GENERATED SEARCH QUERY:`);
  (discoverJson.generatedQueries || []).forEach((q, idx) => {
    console.log(`   [${idx + 1}] "${q}"`);
  });

  console.log(`→ DISCOVERY API REQUEST: POST /api/opportunities/discover { profileId: "${profileId}" }`);
  const opps = discoverJson.opportunities || [];
  console.log(`→ NUMBER OF RESULTS: ${discoverJson.totalDiscovered || opps.length}`);

  console.log(`→ FIRST 3 OPPORTUNITY TITLES:`);
  opps.slice(0, 3).forEach((opp, idx) => {
    const skills = Array.isArray(opp.requiredSkills) 
      ? opp.requiredSkills.join(', ') 
      : (Array.isArray(opp.skillsRequired) ? opp.skillsRequired.join(', ') : 'Not specified');
    console.log(`   [${idx + 1}] "${opp.title}" (${opp.source || opp.platform || 'Web'}) - Skills: [${skills}]`);
  });

  console.log('\n================================================================');
}

testDiscover().catch(err => {
  console.error('Error:', err);
});
