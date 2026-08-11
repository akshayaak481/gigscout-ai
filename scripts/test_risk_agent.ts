import { evaluateOpportunityRisk } from '../src/lib/services/riskService';
import { getInitialOpportunitiesForProfile } from '../src/lib/mockData';
import { calculateDynamicMatch } from '../src/lib/services/matchingService';
import { FreelancerProfile } from '../src/types/profile';

async function testRiskAgentMultiProfile() {
  console.log('=== MULTI-PROFILE RISK AGENT & OPPORTUNITY SCREENING VERIFICATION ===\n');

  const testProfiles: FreelancerProfile[] = [
    {
      id: 'prof-akshaya',
      name: 'Akshaya',
      title: 'AI & Data Engineering Freelancer',
      bio: '',
      targetRole: 'AI & Data Engineering Freelancer',
      skills: [
        { name: 'Generative AI', category: 'ai', yearsExperience: 3, level: 'expert' },
        { name: 'RAG', category: 'ai', yearsExperience: 3, level: 'expert' },
        { name: 'LangGraph', category: 'ai', yearsExperience: 2, level: 'advanced' },
        { name: 'Python', category: 'backend', yearsExperience: 4, level: 'expert' },
        { name: 'Databricks', category: 'data', yearsExperience: 3, level: 'advanced' },
        { name: 'Next.js', category: 'frontend', yearsExperience: 3, level: 'expert' },
        { name: 'TypeScript', category: 'frontend', yearsExperience: 3, level: 'expert' },
        { name: 'Supabase', category: 'database', yearsExperience: 2, level: 'advanced' },
        { name: 'Tailwind CSS', category: 'frontend', yearsExperience: 3, level: 'expert' },
      ],
      hourlyRateMin: 55,
      hourlyRateMax: 95,
      currency: 'USD',
      availabilityHoursPerWeek: 25,
      experienceYears: 3,
      preferredPlatforms: ['upwork', 'weworkremotely'],
      locationPreference: 'Remote',
      projectDuration: '1 - 2 weeks',
      portfolioItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prof-priya-sharma',
      name: 'Priya Sharma',
      title: 'Data Analyst / Business Intelligence Consultant',
      bio: '',
      targetRole: 'Data Analyst / Business Intelligence Consultant',
      skills: [
        { name: 'Power BI', category: 'data', yearsExperience: 4, level: 'expert' },
        { name: 'SQL', category: 'database', yearsExperience: 4, level: 'expert' },
        { name: 'Python', category: 'backend', yearsExperience: 3, level: 'advanced' },
        { name: 'Tableau', category: 'data', yearsExperience: 3, level: 'advanced' },
        { name: 'Excel', category: 'data', yearsExperience: 5, level: 'expert' },
        { name: 'Data Analysis', category: 'data', yearsExperience: 4, level: 'expert' },
      ],
      hourlyRateMin: 40,
      hourlyRateMax: 75,
      currency: 'USD',
      availabilityHoursPerWeek: 25,
      experienceYears: 4,
      preferredPlatforms: ['upwork', 'freelancer'],
      locationPreference: 'Remote',
      projectDuration: '1 - 2 weeks',
      portfolioItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prof-riya-berry',
      name: 'Riya Berry',
      title: 'Video Editor & Content Creator',
      bio: '',
      targetRole: 'Video Editor & Content Creator',
      skills: [
        { name: 'Video Editing', category: 'other', yearsExperience: 4, level: 'expert' },
        { name: 'Adobe Premiere Pro', category: 'other', yearsExperience: 4, level: 'expert' },
        { name: 'After Effects', category: 'other', yearsExperience: 3, level: 'advanced' },
        { name: 'DaVinci Resolve', category: 'other', yearsExperience: 3, level: 'advanced' },
        { name: 'Motion Graphics', category: 'other', yearsExperience: 3, level: 'advanced' },
      ],
      hourlyRateMin: 45,
      hourlyRateMax: 80,
      currency: 'USD',
      availabilityHoursPerWeek: 20,
      experienceYears: 4,
      preferredPlatforms: ['upwork', 'weworkremotely'],
      locationPreference: 'Remote',
      projectDuration: '1 - 2 weeks',
      portfolioItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prof-maya-patel',
      name: 'Maya Patel',
      title: 'Cloud Security Architect',
      bio: '',
      targetRole: 'Cloud Security Architect',
      skills: [
        { name: 'AWS Security', category: 'cloud', yearsExperience: 6, level: 'expert' },
        { name: 'Kubernetes', category: 'cloud', yearsExperience: 5, level: 'expert' },
        { name: 'Terraform', category: 'devops', yearsExperience: 4, level: 'advanced' },
      ],
      hourlyRateMin: 85,
      hourlyRateMax: 140,
      currency: 'USD',
      availabilityHoursPerWeek: 30,
      experienceYears: 6,
      preferredPlatforms: ['upwork', 'weworkremotely'],
      locationPreference: 'Remote',
      projectDuration: '1 - 2 weeks',
      portfolioItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  let allPassed = true;

  for (const profile of testProfiles) {
    console.log(`\n======================================================`);
    console.log(`Testing Profile: "${profile.name}" (${profile.targetRole})`);
    console.log(`======================================================`);

    const opportunities = getInitialOpportunitiesForProfile(profile);
    console.log(`Generated ${opportunities.length} opportunities for ${profile.name}:`);

    const levelsCount: Record<string, number> = {
      VERIFIED_SAFE: 0,
      LOW_RISK: 0,
      MODERATE_RISK: 0,
      CRITICAL_SCAM: 0,
    };

    opportunities.forEach((opp, idx) => {
      const risk = opp.riskAssessment;
      const match = calculateDynamicMatch(opp, profile, []);
      levelsCount[risk.level] = (levelsCount[risk.level] || 0) + 1;

      console.log(`\n [Opp #${idx + 1}] "${opp.title}"`);
      console.log(`   - Platform: ${opp.platform} | Budget: $${opp.budgetMin}-${opp.budgetMax || opp.budgetMin}`);
      console.log(`   - Risk Level: ${risk.level} | Score: ${risk.score}/100 | SafeToApply: ${risk.safeToApply}`);
      console.log(`   - Red Flags: ${risk.redFlags.length} (${risk.redFlags.map(r => r.title).join(', ') || 'None'})`);
      console.log(`   - Match Score: ${match.overallScore}% | Pitch Angle: "${match.recommendedPitchAngle.slice(0, 55)}..."`);

      // Verify risk scoring rules
      if (risk.level === 'CRITICAL_SCAM') {
        if (risk.score < 70) {
          console.log(`   ❌ ERROR: Critical scam score should be >= 70, got ${risk.score}`);
          allPassed = false;
        }
        if (match.overallScore > 25) {
          console.log(`   ❌ ERROR: Critical scam match score should be penalized <= 25%, got ${match.overallScore}%`);
          allPassed = false;
        }
        if (!match.recommendedPitchAngle.includes('DO NOT APPLY')) {
          console.log(`   ❌ ERROR: Critical scam pitch angle should recommend 'DO NOT APPLY'`);
          allPassed = false;
        }
      } else if (risk.level === 'MODERATE_RISK') {
        if (risk.score < 40 || risk.score >= 70) {
          console.log(`   ❌ ERROR: Moderate risk score should be between 40-69, got ${risk.score}`);
          allPassed = false;
        }
      } else if (risk.level === 'VERIFIED_SAFE') {
        if (risk.score > 20) {
          console.log(`   ❌ ERROR: Verified safe score should be <= 20, got ${risk.score}`);
          allPassed = false;
        }
        if (match.overallScore < 80) {
          console.log(`   ❌ ERROR: High match safe opportunity should have match score >= 80%, got ${match.overallScore}%`);
          allPassed = false;
        }
      }
    });

    console.log(`\n Distribution for ${profile.name}:`);
    console.log(`   - Safe Opportunities: ${levelsCount.VERIFIED_SAFE + levelsCount.LOW_RISK}`);
    console.log(`   - Moderate Risk (Warning) Opportunities: ${levelsCount.MODERATE_RISK}`);
    console.log(`   - Critical Scam Opportunities: ${levelsCount.CRITICAL_SCAM}`);

    const hasSafe = (levelsCount.VERIFIED_SAFE + levelsCount.LOW_RISK) >= 1;
    const hasWarning = levelsCount.MODERATE_RISK >= 1;
    const hasScam = levelsCount.CRITICAL_SCAM >= 1;

    if (hasSafe && hasWarning && hasScam) {
      console.log(` ✅ PASSED: ${profile.name} receives a realistic mix of Safe, Warning, and Critical Scam opportunities!`);
    } else {
      console.log(` ❌ FAILED: ${profile.name} is missing one of the required risk tiers!`);
      allPassed = false;
    }
  }

  // Standalone content-only scam verification tests
  console.log(`\n======================================================`);
  console.log(`Testing Standalone Content-Only Scam Detections`);
  console.log(`======================================================`);

  const scamCases = [
    {
      name: 'Telegram & WhatsApp Redirection',
      opp: {
        id: 'test-tg-1',
        title: 'Video Editor Needed Fast',
        description: 'Do not apply on Upwork. Contact our Telegram recruiter @HiringGuru or WhatsApp +1-555-0199.',
      },
      expectedFlag: 'Off-Platform Redirection (Telegram/WhatsApp)',
    },
    {
      name: 'Advance Fake Check & Equipment Trap',
      opp: {
        id: 'test-check-2',
        title: 'Data Analyst Entry Level',
        description: 'We will send you an equipment check for $4,500. Deposit check in your bank and purchase software.',
      },
      expectedFlag: 'Advance-Fee / Fake Check Payment Trap',
    },
    {
      name: 'Sensitive ID & Banking Info Collection',
      opp: {
        id: 'test-sec-3',
        title: 'Python Scripting Project',
        description: 'Send your ID card and bank info to hr@external.com before receiving the contract.',
      },
      expectedFlag: 'Premature Sensitive Data Collection',
    },
    {
      name: 'Unpaid Speculative Work Demand',
      opp: {
        id: 'test-trial-4',
        title: 'Motion Graphics Designer',
        description: 'Must complete a free trial work of 3 full video samples without watermark before hiring decision.',
      },
      expectedFlag: 'Unpaid Speculative Work Demand',
    },
  ];

  for (const tc of scamCases) {
    const result = evaluateOpportunityRisk(tc.opp);
    const hasExpectedFlag = result.redFlags.some(rf => rf.title.includes(tc.expectedFlag) || rf.description.includes(tc.expectedFlag));
    console.log(`Test [${tc.name}]: Score ${result.score} (${result.level}) -> Flag Found: ${hasExpectedFlag ? '✅ YES' : '❌ NO'}`);
    if (!hasExpectedFlag || result.score < 40) {
      allPassed = false;
    }
  }

  console.log(`\n======================================================`);
  if (allPassed) {
    console.log(`🎉 ALL MULTI-PROFILE RISK AGENT AUDITS PASSED SUCCESSFULLY!`);
  } else {
    console.log(`❌ Some tests failed.`);
  }
  console.log(`======================================================`);
}

testRiskAgentMultiProfile();
