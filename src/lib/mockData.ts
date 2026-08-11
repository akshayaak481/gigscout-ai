import { Opportunity } from '@/types/opportunity';
import { FreelancerProfile } from '@/types/profile';
import { AgentNodeMetadata, AgentLogEntry } from '@/types/agent';
import { RAGChunk, MatchScoreBreakdown, StepLogItem, WorkflowNode } from '@/types/dashboard';
import { evaluateOpportunityRisk } from '@/lib/services/riskService';

export const DEMO_PROFILES: FreelancerProfile[] = [
  {
    id: 'prof-ai-cloud-lead',
    name: 'Saved Freelancer',
    title: 'Generative AI & Cloud Data Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Specialized in production Agentic AI workflows, LangGraph pipelines, RAG retrieval architectures, and modern cloud data platforms (Databricks, Snowflake, Azure, Python, SQL).',
    targetRole: 'GenAI & Cloud Data Specialist',
    hourlyRateMin: 60,
    hourlyRateMax: 95,
    currency: 'USD',
    availabilityHoursPerWeek: 25,
    experienceYears: 4,
    preferredPlatforms: ['upwork', 'weworkremotely', 'reddit'],
    locationPreference: 'Remote',
    projectDuration: '2 - 4 weeks',
    skills: [
      { name: 'Generative AI', category: 'ai_ml', yearsExperience: 3, level: 'expert' },
      { name: 'LangGraph / Agentic AI', category: 'ai_ml', yearsExperience: 2, level: 'expert' },
      { name: 'RAG / Vector DBs', category: 'ai_ml', yearsExperience: 3, level: 'expert' },
      { name: 'Python', category: 'backend', yearsExperience: 4, level: 'expert' },
      { name: 'Databricks', category: 'other', yearsExperience: 3, level: 'advanced' },
      { name: 'Snowflake / SQL', category: 'backend', yearsExperience: 3, level: 'advanced' },
      { name: 'Azure', category: 'devops', yearsExperience: 3, level: 'advanced' },
    ],
    portfolioItems: [
      {
        id: 'port-1',
        title: 'Enterprise Multi-Agent RAG Assistant',
        description: 'Architected an Agentic RAG system using LangGraph, pgvector, and Python over 100,000+ technical documents.',
        technologies: ['Generative AI', 'LangGraph', 'RAG', 'Python'],
        liveUrl: 'https://github.com/example/agentic-rag',
        metricsOrOutcome: 'Achieved 96% answer accuracy and cut retrieval latency by 45%.',
      },
      {
        id: 'port-2',
        title: 'Cloud Lakehouse ETL Pipeline',
        description: 'Built scalable ETL pipeline connecting Databricks, Snowflake, and Azure Data Lake for automated ingestion.',
        technologies: ['Databricks', 'Snowflake', 'Azure', 'SQL'],
        metricsOrOutcome: 'Processed 50M+ daily rows with real-time query optimization.',
      },
    ],
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-08-10T12:00:00Z',
  },
];

export const MOCK_RAG_CHUNKS: RAGChunk[] = [
  {
    id: 'chunk-1',
    title: 'Work Experience: Senior GenAI & Cloud Engineer',
    description: 'Designed and deployed autonomous multi-agent systems and RAG pipelines using LangGraph, Python, Databricks, Snowflake, and Azure.',
    similarityScore: 0.96,
    isUsedEvidence: true,
    usedReason: 'Direct match with Generative AI, RAG, and Cloud platform requirements.',
    technologies: ['Generative AI', 'LangGraph', 'RAG', 'Python', 'Databricks', 'Azure'],
  },
  {
    id: 'chunk-2',
    title: 'Technical Skills & Cloud Competencies',
    description: 'Expertise in Python, SQL, Databricks, Snowflake, Azure, OpenAI API, vector embeddings (pgvector), and modern cloud pipelines.',
    similarityScore: 0.91,
    isUsedEvidence: false,
    technologies: ['Python', 'Snowflake', 'Databricks', 'Azure', 'SQL'],
  },
];

export const MOCK_MATCH_BREAKDOWN: MatchScoreBreakdown = {
  overallPercentage: 94,
  totalScore: 94,
  maxTotalScore: 100,
  categories: [
    { category: 'Skills Match', score: 40, maxScore: 40, color: 'bg-blue-500' },
    { category: 'Portfolio Evidence', score: 20, maxScore: 20, color: 'bg-cyan-400' },
    { category: 'Budget Fit', score: 15, maxScore: 15, color: 'bg-emerald-400' },
    { category: 'Project Type', score: 9, maxScore: 10, color: 'bg-amber-400' },
    { category: 'Availability Fit', score: 6, maxScore: 10, color: 'bg-purple-400' },
    { category: 'Location Fit', score: 4, maxScore: 5, color: 'bg-violet-400' },
  ],
};

export const MOCK_STEP_LOGS: StepLogItem[] = [
  {
    id: 'step-1',
    agentName: 'Profile Agent',
    action: 'Extracting user requirements & skills',
    timestamp: '16:42:01',
    status: 'completed',
  },
  {
    id: 'step-2',
    agentName: 'Search Agent',
    action: 'Searching across platforms...',
    timestamp: '16:42:02',
    status: 'completed',
  },
  {
    id: 'step-3',
    agentName: 'Search Agent',
    action: '32 opportunities retrieved',
    timestamp: '16:42:04',
    status: 'completed',
  },
  {
    id: 'step-4',
    agentName: 'RAG Agent',
    action: 'Retrieving portfolio evidence...',
    timestamp: '16:42:05',
    status: 'completed',
  },
  {
    id: 'step-5',
    agentName: 'Match Agent',
    action: 'Calculating compatibility scores...',
    timestamp: '16:42:06',
    status: 'completed',
  },
  {
    id: 'step-6',
    agentName: 'Risk Agent',
    action: 'Analyzing risk & scam indicators...',
    timestamp: '16:42:07',
    status: 'completed',
  },
  {
    id: 'step-7',
    agentName: 'Ranking Agent',
    action: 'Ranking top opportunities...',
    timestamp: '16:42:08',
    status: 'completed',
  },
  {
    id: 'step-8',
    agentName: 'Pitch Agent',
    action: 'Generating personalized pitch...',
    timestamp: '16:42:09',
    status: 'completed',
  },
  {
    id: 'step-9',
    agentName: 'Mission Completed',
    action: '7 opportunities found • Top 5 recommended',
    timestamp: '16:42:09',
    status: 'completed',
    isSummary: true,
  },
];

export const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-featured',
    title: 'Generative AI & Agentic RAG Pipeline Engineer',
    clientName: 'Nexus Cloud Intelligence',
    clientCountry: 'United States / Remote',
    clientRating: 4.98,
    clientSpent: '$85k+ total spend',
    platform: 'upwork',
    platformUrl: 'https://upwork.com/jobs/genai-rag-pipeline-engineer',
    description: 'We are seeking an experienced Generative AI Engineer to build an enterprise Agentic RAG retrieval pipeline. You will design LangGraph multi-agent workflows, connect with Databricks / Snowflake / Azure cloud backends, and utilize Python & vector embeddings for high-accuracy document intelligence.',
    budgetType: 'hourly',
    budgetMin: 65,
    budgetMax: 95,
    budgetCurrency: 'USD',
    skillsRequired: ['Generative AI', 'LangGraph', 'RAG', 'Python', 'Databricks', 'Snowflake', 'Azure'],
    experienceLevel: 'Intermediate',
    postedAt: '2026-08-10T16:20:00Z',
    estimatedDuration: '2 - 4 weeks',
    status: 'active',
    riskAssessment: {
      score: 6,
      level: 'VERIFIED_SAFE',
      summary: 'Verified enterprise client with 4.98 rating, $85k+ verified payments, and clear technical scope.',
      redFlags: [],
      safetySignals: [
        'Clear hourly compensation ($65 - $95/hr)',
        'Client has verified hiring history on platform',
        'Detailed engineering requirements with modern stack',
        'No suspicious keywords detected',
      ],
      safeToApply: true,
      analyzedAt: '2026-08-10T16:22:00Z',
    },
    matchReasoning: {
      overallScore: 94,
      skillsMatchScore: 95,
      rateAlignmentScore: 94,
      experienceMatchScore: 92,
      whyGoodMatch: [
        'Direct match: Your GenAI, Agentic AI, and RAG competencies align with project scope.',
        'Target budget ($65 - $95/hr) meets and exceeds your minimum rate requirement.',
        'Project duration and remote setup match your availability perfectly.',
      ],
      potentialGaps: [],
      recommendedPitchAngle: 'Highlight your hands-on experience building multi-agent RAG architectures with LangGraph, Python, and cloud data platforms.',
      relevantPortfolioIds: [],
    },
  },
  {
    id: 'opp-1',
    title: 'Build Multi-Agent AI Workflow Dashboard for B2B Logistics',
    clientName: 'LogiVanguard Systems Inc.',
    clientCountry: 'United States',
    clientRating: 4.95,
    clientSpent: '$140k+ total spend',
    platform: 'upwork',
    platformUrl: 'https://upwork.com/jobs/build-multi-agent-ai-logistics',
    description: 'We are seeking an experienced Full-Stack AI Engineer to architect and build a multi-agent orchestration dashboard. You will connect OpenAI models with LangGraph or similar agent framework, integrate Supabase pgvector for internal dispatch memory, and build an interactive Next.js 14 frontend with real-time SSE streaming. Strong TypeScript and modern Tailwind experience required.',
    budgetType: 'hourly',
    budgetMin: 55,
    budgetMax: 80,
    budgetCurrency: 'USD',
    skillsRequired: ['Next.js', 'TypeScript', 'LangGraph', 'Supabase', 'OpenAI', 'Tailwind CSS'],
    experienceLevel: 'Intermediate',
    postedAt: '2026-08-10T14:30:00Z',
    estimatedDuration: '4 to 6 weeks',
    status: 'active',
    riskAssessment: {
      score: 8,
      level: 'VERIFIED_SAFE',
      summary: 'Verified client with 4.95 rating, $140k+ verified platform payments, escrow-backed hourly milestone, and clear technical roadmap.',
      redFlags: [],
      safetySignals: [
        'Client payment method verified with $140,000+ past contract payments.',
        'Clear, realistic scope matching industry rates ($55 - $80/hr).',
        'Official Upwork escrow protection enabled.',
        'Technical requirements are specific and mention modern established libraries.',
      ],
      safeToApply: true,
      analyzedAt: '2026-08-10T14:35:00Z',
    },
    matchReasoning: {
      overallScore: 96,
      skillsMatchScore: 98,
      rateAlignmentScore: 95,
      experienceMatchScore: 94,
      whyGoodMatch: [
        'Direct 100% overlap with your core stack: Next.js, LangGraph, Supabase, and TypeScript.',
        'Client hourly range ($55-$80/hr) perfectly encapsulates your target rate ($50-$85/hr).',
        'Your featured project "Agentic Financial Analyst Bot" demonstrates identical multi-agent streaming architecture.',
      ],
      potentialGaps: [
        'Logistics domain specifics may require a quick kickoff discovery call on their dispatch API.',
      ],
      recommendedPitchAngle: 'Highlight your LangGraph streaming architecture from your Financial Bot and your sub-120ms Supabase vector index experience.',
      relevantPortfolioIds: ['port-ai-1', 'port-ai-2'],
    },
  },
  {
    id: 'opp-2',
    title: 'URGENT: Rush AI Model Fine-Tuning & Pipeline Script — Free Sample Benchmark Required',
    clientName: 'RapidAI Ventures LLC',
    clientCountry: 'Remote / Unverified',
    clientRating: 3.7,
    clientSpent: '$0.00 spent',
    platform: 'freelancer',
    platformUrl: 'https://freelancer.com/projects/rush-ai-fine-tuning-free-benchmark',
    description: 'URGENT: We need an AI Engineer to fine-tune a model and optimize our inference script within 24 hours. NOTE: All applicants must complete an unpaid trial test task demonstrating accuracy on our proprietary benchmark dataset before the milestone contract is created. Payment released only upon final review.',
    budgetType: 'fixed',
    budgetMin: 800,
    budgetMax: 1200,
    budgetCurrency: 'USD',
    skillsRequired: ['Python', 'Generative AI', 'Fine-Tuning', 'PyTorch'],
    experienceLevel: 'Intermediate',
    postedAt: '2026-08-10T11:15:00Z',
    estimatedDuration: '24 hours',
    status: 'active',
    riskAssessment: {
      score: 58,
      level: 'MODERATE_RISK',
      summary: 'CAUTION ADVISED: Risk Sentinel flagged speculative unpaid test task demands, sub-par client rating (3.7), zero platform expenditure, and rush pressure tactics.',
      redFlags: [
        {
          id: 'rf-ai-trial',
          category: 'scope',
          severity: 'medium',
          title: 'Unpaid Speculative Work Demand',
          description: 'Client requires free proprietary benchmark trial work before funding contract escrow.',
          evidence: 'All applicants must complete an unpaid trial test task demonstrating accuracy.',
        },
        {
          id: 'rf-ai-rep',
          category: 'reputation',
          severity: 'medium',
          title: 'Substandard Client Rating History',
          description: 'Client rating is 3.7 stars with $0 platform spend history.',
          evidence: 'Platform rating: 3.7 stars.',
        },
      ],
      safetySignals: ['Standard platform listing'],
      safeToApply: false,
      analyzedAt: '2026-08-10T11:20:00Z',
    },
    matchReasoning: {
      overallScore: 62,
      skillsMatchScore: 90,
      rateAlignmentScore: 75,
      experienceMatchScore: 88,
      whyGoodMatch: [
        'Technical stack overlap with Python and GenAI.',
      ],
      potentialGaps: [
        'CAUTION: Risk Sentinel flagged moderate risks (unpaid trial and unverified payment).',
      ],
      recommendedPitchAngle: 'Insist on platform escrow funding before delivering benchmark work.',
      relevantPortfolioIds: [],
    },
  },
  {
    id: 'opp-3',
    title: 'URGENT: Re-type 50 scanned PDF books into MS Word — $6,000 Weekly ($75/hr)',
    clientName: 'Global Publishing International LLC',
    clientCountry: 'Unknown / Hidden',
    clientRating: 0,
    clientSpent: '$0.00 spent',
    platform: 'freelancer',
    platformUrl: 'https://freelancer.com/projects/retype-scanned-pdf-urgent-6000',
    description: 'URGENT HIRING: We have 50 scanned PDF books that need to be manually re-typed into MS Word documents. Very easy work for students and beginners. We pay $6,000 upon completion. DO NOT APPLY ON FREELANCER PLATFORM — Contact our hiring manager directly on Telegram @Hiring_HR_Global or WhatsApp +1-202-555-0199 with your ID card and bank info to receive the equipment check.',
    budgetType: 'fixed',
    budgetMin: 6000,
    budgetMax: 6000,
    budgetCurrency: 'USD',
    skillsRequired: ['Data Entry', 'Copy Typing', 'MS Word'],
    experienceLevel: 'Entry',
    postedAt: '2026-08-10T15:00:00Z',
    status: 'active',
    riskAssessment: {
      score: 98,
      level: 'CRITICAL_SCAM',
      summary: 'CRITICAL THREAT: Classic fake check / Telegram fee advance scam. Avoid immediately.',
      redFlags: [
        {
          id: 'rf-1',
          category: 'communication',
          severity: 'critical',
          title: 'Off-Platform Redirection (Telegram/WhatsApp)',
          description: 'Client explicitly commands freelancers to bypass platform messaging and contact a Telegram handle.',
          evidence: 'Contact our hiring manager directly on Telegram @Hiring_HR_Global',
        },
        {
          id: 'rf-2',
          category: 'payment',
          severity: 'critical',
          title: 'Unrealistic Pay for Low-Skill Task',
          description: '$6,000 for simple PDF re-typing is 20x-50x above market rates, a hallmark lure of phishing syndicates.',
          evidence: '$6,000 upon completion for re-typing 50 scanned PDF books',
        },
      ],
      safetySignals: [],
      safeToApply: false,
      analyzedAt: '2026-08-10T15:02:00Z',
    },
    matchReasoning: {
      overallScore: 12,
      skillsMatchScore: 10,
      rateAlignmentScore: 5,
      experienceMatchScore: 20,
      whyGoodMatch: [],
      potentialGaps: [
        'CRITICAL SECURITY HAZARD: Risk Sentinel flagged severe scam indicators for this listing.',
      ],
      recommendedPitchAngle: 'DO NOT APPLY. Risk Sentinel flagged this post as hazardous.',
      relevantPortfolioIds: [],
    },
  },
];

export function getInitialOpportunitiesForProfile(profile: FreelancerProfile): Opportunity[] {
  const role = (profile.targetRole || profile.title || 'Freelance Consultant').trim();
  const roleLower = role.toLowerCase();
  const rawSkills = (profile.skills || []).map(s => (typeof s === 'string' ? s : s.name)).filter(Boolean);
  const skillsList = rawSkills.length > 0 ? rawSkills : [role];
  const rateMin = profile.hourlyRateMin || 50;
  const rateMax = profile.hourlyRateMax || 90;
  const currency = profile.currency || 'USD';
  const locationPref = profile.locationPreference || 'Remote';
  const duration = profile.projectDuration || '1 - 2 weeks';

  // If profile is explicitly Akshaya (AI & Data Engineering), return Akshaya's curated benchmark set
  const isAiEngineer = roleLower.includes('ai & data') || (roleLower.includes('ai') && roleLower.includes('engineering'));
  if (isAiEngineer && (profile.id.includes('akshaya') || (profile.name && profile.name.toLowerCase().includes('akshaya')))) {
    // Screen each opportunity with Risk Sentinel and log
    return INITIAL_OPPORTUNITIES.map((opp) => {
      const dynamicRisk = evaluateOpportunityRisk(opp);
      return {
        ...opp,
        riskAssessment: dynamicRisk,
      };
    });
  }

  // Dynamic candidate-aligned opportunities with a REALISTIC MIX of Safe, Warning, and Critical Scam
  const primarySkill = skillsList[0] || role;
  const secondarySkill = skillsList[1] || 'Analytics & Architecture';
  const tertiarySkill = skillsList[2] || 'Milestone Delivery';

  const rawList: Opportunity[] = [
    // 1. Safe Opportunity: Verified Client, Escrow, Competitive Hourly
    {
      id: `opp-${profile.id}-1`,
      title: `${role} - High-Impact Client Engagement`,
      clientName: 'Vanguard Enterprise Group',
      clientCountry: `United States / ${locationPref}`,
      clientRating: 4.98,
      clientSpent: currency === 'INR' ? '₹850k+ total spend' : '$85k+ total spend',
      platform: 'upwork',
      platformUrl: `https://upwork.com/jobs/freelance-${role.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      description: `Seeking an experienced ${role} for a high-priority assignment. You will lead key deliverables requiring ${skillsList.slice(0, 3).join(', ')}, ensure fast turnaround, and collaborate closely with our senior team.`,
      budgetType: 'hourly',
      budgetMin: rateMin,
      budgetMax: rateMax,
      budgetCurrency: currency,
      skillsRequired: skillsList.slice(0, 5),
      experienceLevel: 'Intermediate',
      postedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      estimatedDuration: duration,
      status: 'active',
      riskAssessment: {
        score: 5,
        level: 'VERIFIED_SAFE',
        summary: `Verified client with 4.98 rating and verified escrow payment record for ${role} engagements.`,
        redFlags: [],
        safetySignals: [
          `Clear hourly compensation terms (${currency === 'INR' ? '₹' : '$'}${rateMin} - ${currency === 'INR' ? '₹' : '$'}${rateMax}/hr)`,
          'Client has established payment verification on platform',
          'Well-defined scope matching candidate skillset',
          'Zero suspicious flags detected by Risk Sentinel',
        ],
        safeToApply: true,
        analyzedAt: new Date().toISOString(),
      },
      matchReasoning: {
        overallScore: 96,
        skillsMatchScore: 98,
        rateAlignmentScore: 95,
        experienceMatchScore: 94,
        whyGoodMatch: [
          `Direct match: Your core skills (${skillsList.slice(0, 3).join(', ')}) precisely match project requirements.`,
          `Client hourly budget (${currency === 'INR' ? '₹' : '$'}${rateMin} - ${currency === 'INR' ? '₹' : '$'}${rateMax}/hr) aligns with your target rate.`,
          `Project duration (${duration}) and ${locationPref} setup match your current availability.`,
        ],
        potentialGaps: [],
        recommendedPitchAngle: `Highlight your hands-on expertise in ${skillsList.slice(0, 2).join(' and ')} and rapid milestone turnaround.`,
        relevantPortfolioIds: [],
      },
    },

    // 2. Safe Opportunity: Reputable Brand, Milestone Fixed Price
    {
      id: `opp-${profile.id}-2`,
      title: `${primarySkill} Specialist - Strategic Campaign & Implementation`,
      clientName: 'Horizon Media & Digital Partners',
      clientCountry: `Canada / ${locationPref}`,
      clientRating: 4.93,
      clientSpent: currency === 'INR' ? '₹450k+ total spend' : '$48k+ total spend',
      platform: 'weworkremotely',
      platformUrl: `https://weworkremotely.com/jobs/${primarySkill.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-specialist`,
      description: `Looking for a talented freelance ${role} to handle key deliverables for our upcoming launch. Must have solid experience with ${primarySkill}, ${secondarySkill}, and ${tertiarySkill}. Verified corporate escrow enabled.`,
      budgetType: 'fixed',
      budgetMin: rateMin * 30,
      budgetMax: rateMax * 45,
      budgetCurrency: currency,
      skillsRequired: skillsList.slice(0, 4),
      experienceLevel: 'Intermediate',
      postedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      estimatedDuration: duration,
      status: 'active',
      riskAssessment: {
        score: 7,
        level: 'VERIFIED_SAFE',
        summary: 'Established employer on WeWorkRemotely with milestone-based escrow.',
        redFlags: [],
        safetySignals: ['Verified corporate platform presence', 'Transparent milestone deliverables', 'Prompt communication channel'],
        safeToApply: true,
        analyzedAt: new Date().toISOString(),
      },
      matchReasoning: {
        overallScore: 92,
        skillsMatchScore: 94,
        rateAlignmentScore: 91,
        experienceMatchScore: 90,
        whyGoodMatch: [
          `Strong overlap with ${primarySkill} and ${secondarySkill}.`,
          'Milestone compensation structured around proven deliverables.',
        ],
        potentialGaps: [],
        recommendedPitchAngle: `Showcase relevant case studies and past client work involving ${primarySkill}.`,
        relevantPortfolioIds: [],
      },
    },

    // 3. Warning Opportunity (MODERATE_RISK): Sub-par client rating, rush pressure, unbilled test task requirement
    {
      id: `opp-${profile.id}-3`,
      title: `URGENT: Rush ${role} Deliverable — Free Unbilled Test Task Required`,
      clientName: 'QuickTurn Digital Labs',
      clientCountry: `Remote / Unverified`,
      clientRating: 4.1,
      clientSpent: '$2,500 total spend',
      platform: 'freelancer',
      platformUrl: `https://freelancer.com/projects/rush-${role.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-free-test`,
      description: `URGENT HIRING: Need a freelance ${role} for a 24-hour rush turnaround in ${primarySkill}. NOTE: All applicants must submit a free custom test sample deliverable before contract is created. Payment released upon final client review.`,
      budgetType: 'hourly',
      budgetMin: Math.max(20, rateMin - 10),
      budgetMax: rateMax,
      budgetCurrency: currency,
      skillsRequired: skillsList.slice(0, 3),
      experienceLevel: 'Intermediate',
      postedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
      estimatedDuration: '24 hours',
      status: 'active',
      riskAssessment: {
        score: 55,
        level: 'MODERATE_RISK',
        summary: 'CAUTION ADVISED: Risk Sentinel flagged speculative unpaid test task demands, sub-par client rating (3.8), zero platform expenditure, and rush pressure tactics.',
        redFlags: [
          {
            id: 'rf-warn-trial',
            category: 'scope',
            severity: 'medium',
            title: 'Unpaid Speculative Work Demand',
            description: 'Client requires free test deliverable before funding contract escrow.',
            evidence: 'All applicants must submit a free custom test sample deliverable.',
          },
          {
            id: 'rf-warn-rep',
            category: 'reputation',
            severity: 'medium',
            title: 'Substandard Client Rating History',
            description: 'Client rating is 3.8 stars with zero platform spend history.',
            evidence: 'Platform rating: 3.8 stars.',
          },
        ],
        safetySignals: ['Standard platform listing'],
        safeToApply: false,
        analyzedAt: new Date().toISOString(),
      },
      matchReasoning: {
        overallScore: 64,
        skillsMatchScore: 92,
        rateAlignmentScore: 85,
        experienceMatchScore: 88,
        whyGoodMatch: [
          `Skill alignment with ${primarySkill}.`,
        ],
        potentialGaps: [
          'CAUTION: Risk Sentinel flagged moderate risks (unpaid test and unverified client payment).',
        ],
        recommendedPitchAngle: 'Insist on platform milestone escrow funding before submitting custom work.',
        relevantPortfolioIds: [],
      },
    },

    // 4. Critical Scam Opportunity (CRITICAL_SCAM): Telegram off-platform lure, fake check advance fee, ID card/bank demand
    {
      id: `opp-${profile.id}-4`,
      title: `URGENT: Re-type & Process 50 ${primarySkill} Files into Documents — $5,500 ($85/hr)`,
      clientName: 'Apex Data & Publishing Services LLC',
      clientCountry: 'Unknown / Hidden',
      clientRating: 0,
      clientSpent: '$0.00 spent',
      platform: 'freelancer',
      platformUrl: `https://freelancer.com/projects/retype-${primarySkill.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-files-urgent`,
      description: `URGENT HIRING: We need a ${role} to re-type, clean, and format 50 ${primarySkill} scanned records into MS Word/Excel documents. Very easy work for students and beginners. We pay $5,500 upon completion. DO NOT APPLY ON FREELANCER PLATFORM — Contact our hiring manager directly on Telegram @Hiring_HR_Global or WhatsApp +1-202-555-0199 with your ID card and bank info to receive the equipment check.`,
      budgetType: 'fixed',
      budgetMin: 5500,
      budgetMax: 5500,
      budgetCurrency: 'USD',
      skillsRequired: [primarySkill, 'Data Entry', 'Copy Typing'],
      experienceLevel: 'Entry',
      postedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
      status: 'active',
      riskAssessment: {
        score: 98,
        level: 'CRITICAL_SCAM',
        summary: 'CRITICAL THREAT: Risk Sentinel detected severe scam vectors (Off-Platform Redirection, Advance-Fee/Fake Check, Sensitive Data Collection). Do not engage.',
        redFlags: [
          {
            id: 'rf-scam-comm',
            category: 'communication',
            severity: 'critical',
            title: 'Off-Platform Redirection (Telegram/WhatsApp)',
            description: 'Client explicitly commands freelancers to bypass platform messaging and contact a Telegram handle.',
            evidence: 'Contact our hiring manager directly on Telegram @Hiring_HR_Global',
          },
          {
            id: 'rf-scam-pay',
            category: 'payment',
            severity: 'critical',
            title: 'Advance-Fee / Fake Check Payment Trap',
            description: 'Job references sending upfront equipment checks or paying external fees.',
            evidence: 'Contact on Telegram to receive the equipment check.',
          },
        ],
        safetySignals: [],
        safeToApply: false,
        analyzedAt: new Date().toISOString(),
      },
      matchReasoning: {
        overallScore: 12,
        skillsMatchScore: 10,
        rateAlignmentScore: 5,
        experienceMatchScore: 20,
        whyGoodMatch: [],
        potentialGaps: [
          'CRITICAL SECURITY HAZARD: Risk Sentinel flagged severe scam indicators for this listing.',
        ],
        recommendedPitchAngle: 'DO NOT APPLY. Risk Sentinel flagged this post as hazardous.',
        relevantPortfolioIds: [],
      },
    },
  ];

  // Screen each opportunity with universal Risk Sentinel engine and log
  return rawList.map((opp) => {
    const dynamicRisk = evaluateOpportunityRisk(opp);
    return {
      ...opp,
      riskAssessment: dynamicRisk,
    };
  });
}

export const INITIAL_AGENT_NODES: AgentNodeMetadata[] = [
  {
    id: 'supervisor',
    name: 'Profile Agent',
    role: 'Extracts skills, budget, location, availability',
    icon: 'Brain',
    description: 'Decomposes freelancer prompt and extracts structured parameters.',
    status: 'completed',
    executionTimeMs: 140,
    tokensUsed: 420,
    activeMessage: 'Profile parameters extracted.',
  },
  {
    id: 'discovery_agent',
    name: 'Search Agent',
    role: 'Searches gig platforms, job boards, communities',
    icon: 'Radar',
    description: 'Crawls live feeds (Upwork, WWR, Reddit, Freelancer) and parses raw unstructured gig listings.',
    status: 'completed',
    executionTimeMs: 890,
    tokensUsed: 1250,
    itemsProcessed: 32,
    activeMessage: '32 opportunities retrieved.',
  },
  {
    id: 'rag_agent',
    name: 'RAG Agent',
    role: 'Retrieves portfolio evidence from vector DB',
    icon: 'FileCode2',
    description: 'Queries vector database for top matching portfolio items and computes cosine similarity.',
    status: 'completed',
    executionTimeMs: 310,
    tokensUsed: 680,
    itemsProcessed: 3,
    activeMessage: 'Retrieved 3 chunks (Top: 0.94).',
  },
  {
    id: 'risk_agent',
    name: 'Risk Agent',
    role: 'Detects scam & low-ball opportunities',
    icon: 'ShieldAlert',
    description: 'Evaluates 15+ scam signals: Telegram redirection, fake check fraud, unpaid spec work.',
    status: 'completed',
    executionTimeMs: 640,
    tokensUsed: 1890,
    itemsProcessed: 32,
    activeMessage: 'Flagged 1 critical scam.',
  },
  {
    id: 'ranking_agent',
    name: 'Ranking Agent',
    role: 'Ranks gigs based on match + risk + user priority',
    icon: 'Sparkles',
    description: 'Synthesizes skill overlap, budget alignment, schedule match, and generates explainable metrics.',
    status: 'completed',
    executionTimeMs: 420,
    tokensUsed: 980,
    itemsProcessed: 7,
    activeMessage: 'Top 5 recommended.',
  },
  {
    id: 'pitch_agent',
    name: 'Pitch Agent',
    role: 'Generates personalized outreach pitch',
    icon: 'PenTool',
    description: 'Drafts tailored proposals embedding proven portfolio chunks.',
    status: 'completed',
    executionTimeMs: 510,
    tokensUsed: 890,
    itemsProcessed: 1,
    activeMessage: 'Generated pitch preview.',
  },
];

export const SAMPLE_TELEMETRY_LOGS: AgentLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '16:42:01',
    agentId: 'supervisor',
    level: 'info',
    message: 'Profile Agent: Extracting user requirements & skills from prompt',
  },
  {
    id: 'log-2',
    timestamp: '16:42:02',
    agentId: 'discovery_agent',
    level: 'agent_action',
    message: 'Search Agent: Searching across gig platforms, job boards, communities...',
  },
  {
    id: 'log-3',
    timestamp: '16:42:04',
    agentId: 'discovery_agent',
    level: 'success',
    message: 'Search Agent: 32 opportunities retrieved across Upwork, Reddit, WWR.',
  },
  {
    id: 'log-4',
    timestamp: '16:42:05',
    agentId: 'rag_agent',
    level: 'info',
    message: 'RAG Agent: Retrieved top portfolio chunks from vector DB (Top similarity: 0.94).',
  },
  {
    id: 'log-5',
    timestamp: '16:42:06',
    agentId: 'ranking_agent',
    level: 'info',
    message: 'Match Agent: Calculated compatibility scores (Overall Match: 94%).',
  },
  {
    id: 'log-6',
    timestamp: '16:42:07',
    agentId: 'risk_agent',
    level: 'warn',
    message: 'Risk Agent: Screened 32 listings. Clean payment terms verified on top match.',
  },
  {
    id: 'log-7',
    timestamp: '16:42:08',
    agentId: 'ranking_agent',
    level: 'success',
    message: 'Ranking Agent: Ranked top 7 opportunities (Top 5 recommended).',
  },
  {
    id: 'log-8',
    timestamp: '16:42:09',
    agentId: 'pitch_agent',
    level: 'success',
    message: 'Pitch Agent: Generated personalized outreach proposal using candidate portfolio evidence.',
  },
];
