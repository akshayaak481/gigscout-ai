import { Opportunity, MatchReasoning } from '@/types/opportunity';
import { FreelancerProfile } from '@/types/profile';
import { RAGChunk } from '@/types/dashboard';
import { evaluateOpportunityRisk } from './riskService';

// Canonical synonyms map for intelligent, robust skill matching
const SKILL_SYNONYMS: Record<string, string[]> = {
  'genai': [
    'generative ai', 'genai', 'gen-ai', 'llm', 'llms', 'large language models', 
    'gpt', 'gpt-4', 'openai', 'claude', 'anthropic', 'gemini', 'prompt engineering'
  ],
  'rag': [
    'rag', 'retrieval-augmented generation', 'retrieval augmented generation', 
    'vector search', 'vector database', 'embeddings', 'pgvector', 'pinecone', 
    'chromadb', 'milvus', 'qdrant', 'faiss', 'semantic search'
  ],
  'agentic ai': [
    'agentic ai', 'agentic', 'ai agents', 'ai agent', 'autonomous agents', 
    'langgraph', 'crewai', 'autogen', 'langchain', 'multi-agent', 'agent workflow'
  ],
  'databricks': [
    'databricks', 'spark', 'pyspark', 'apache spark', 'delta lake', 'unity catalog', 'lakehouse'
  ],
  'snowflake': [
    'snowflake', 'snowpark', 'cortex', 'data warehouse', 'data warehousing'
  ],
  'bigquery': [
    'bigquery', 'google bigquery', 'bq', 'google cloud bigquery'
  ],
  'azure': [
    'azure', 'microsoft azure', 'azure openai', 'azure devops', 'azure cloud', 'azure data factory'
  ],
  'aws': [
    'aws', 'amazon web services', 'amazon bedrock', 's3', 'lambda', 'ec2', 'cloudformation'
  ],
  'gcp': [
    'gcp', 'google cloud', 'google cloud platform', 'vertex ai', 'cloud run'
  ],
  'python': [
    'python', 'python3', 'pyspark', 'fastapi', 'flask', 'django', 'numpy', 'pandas'
  ],
  'sql': [
    'sql', 'postgresql', 'postgres', 'mysql', 'tsql', 'plsql', 'sqlite', 'nosql', 'mongodb'
  ],
  'typescript': [
    'typescript', 'ts'
  ],
  'javascript': [
    'javascript', 'js', 'node', 'node.js', 'nodejs', 'express'
  ],
  'react': [
    'react', 'react.js', 'reactjs', 'next.js', 'nextjs'
  ],
  'nextjs': [
    'next.js', 'nextjs', 'react', 'react.js'
  ],
  'data engineering': [
    'data engineering', 'data engineer', 'etl', 'elt', 'dbt', 'airflow', 'data pipelines', 'kafka'
  ],
  'machine learning': [
    'machine learning', 'ml', 'deep learning', 'scikit-learn', 'pytorch', 'tensorflow', 'nlp'
  ],
};

/**
 * Normalizes and checks if a required skill matches a candidate skill or synonym group.
 */
export function isSkillMatch(candidateSkill: string, requiredSkill: string): boolean {
  if (!candidateSkill || !requiredSkill) return false;

  const cNorm = candidateSkill.toLowerCase().trim();
  const rNorm = requiredSkill.toLowerCase().trim();

  // 1. Direct or strict substring match
  if (cNorm === rNorm || cNorm.includes(rNorm) || rNorm.includes(cNorm)) {
    return true;
  }

  // 2. Tokenized word overlap (e.g. "Senior Python Developer" matches "Python")
  const cTokens = cNorm.split(/[\s,/\-_|()]+/).filter((t) => t.length > 1);
  const rTokens = rNorm.split(/[\s,/\-_|()]+/).filter((t) => t.length > 1);
  
  if (cTokens.some((ct) => rTokens.includes(ct))) {
    return true;
  }

  // 3. Synonym dictionary matching
  for (const group of Object.values(SKILL_SYNONYMS)) {
    const cInGroup = group.some((alias) => cNorm === alias || cNorm.includes(alias) || alias.includes(cNorm));
    const rInGroup = group.some((alias) => rNorm === alias || rNorm.includes(alias) || alias.includes(rNorm));
    if (cInGroup && rInGroup) {
      return true;
    }
  }

  return false;
}

/**
 * Extract candidate skill strings from a Supabase freelancer profile.
 */
export function extractProfileSkills(profile?: FreelancerProfile): string[] {
  if (!profile) return [];
  const skillsList: string[] = [];

  if (Array.isArray(profile.skills)) {
    profile.skills.forEach((s: any) => {
      if (typeof s === 'string' && s.trim()) {
        skillsList.push(s.trim());
      } else if (s && typeof s.name === 'string' && s.name.trim()) {
        skillsList.push(s.name.trim());
      }
    });
  }

  return Array.from(new Set(skillsList));
}

/**
 * Calculate dynamic match reasoning against Supabase profile and real RAG chunks.
 */
export function calculateDynamicMatch(
  opportunity: Partial<Opportunity>,
  profile: FreelancerProfile,
  ragChunks: RAGChunk[] = []
): {
  overallScore: number;
  skillsMatchScore: number;
  rateAlignmentScore: number;
  experienceMatchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  whyGoodMatch: string[];
  potentialGaps: string[];
  recommendedPitchAngle: string;
  supportingEvidence: RAGChunk[];
} {
  const candidateSkills = extractProfileSkills(profile);
  const requiredSkills = opportunity.skillsRequired || [];

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  requiredSkills.forEach((reqSkill) => {
    const matched = candidateSkills.some((candSkill) => isSkillMatch(candSkill, reqSkill));
    if (matched) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  });

  // Calculate granular scores
  let skillsMatchScore = 85;
  if (requiredSkills.length > 0) {
    skillsMatchScore = Math.min(100, Math.round((matchedSkills.length / requiredSkills.length) * 100));
  } else if (candidateSkills.length > 0) {
    skillsMatchScore = 90;
  }

  // Budget alignment score
  let rateAlignmentScore = 88;
  const userRateMin = profile.hourlyRateMin || 0;
  const budgetMin = opportunity.budgetMin || 0;
  const budgetMax = opportunity.budgetMax || budgetMin;

  if (opportunity.budgetType === 'hourly') {
    if (budgetMax >= userRateMin) {
      rateAlignmentScore = 95;
    } else if (budgetMax > 0 && budgetMax >= userRateMin * 0.8) {
      rateAlignmentScore = 78;
    } else if (budgetMax > 0) {
      rateAlignmentScore = 60;
    }
  } else if (budgetMin > 0) {
    rateAlignmentScore = 90;
  }

  // Experience fit score
  const experienceYears = profile.experienceYears || 2;
  const experienceMatchScore = experienceYears >= 4 ? 95 : experienceYears >= 2 ? 88 : 80;

  // Weighted overall percentage before risk adjustment
  const baseScore = Math.round(
    skillsMatchScore * 0.5 + rateAlignmentScore * 0.3 + experienceMatchScore * 0.2
  );

  // Apply Risk Agent penalty (Requirement 8)
  const riskScore = opportunity.riskAssessment?.score ?? 0;
  let overallScore = baseScore;
  if (riskScore >= 70) {
    // Severe scam/risk: heavily penalize down to <= 20%
    overallScore = Math.min(20, Math.round(baseScore * 0.15));
  } else if (riskScore >= 40) {
    // Moderate risk/caution: penalize by ~30%
    overallScore = Math.max(30, Math.round(baseScore * 0.7));
  }

  // Filter actual RAG resume chunks from Supabase
  const searchCorpus = `${opportunity.title || ''} ${opportunity.description || ''} ${requiredSkills.join(' ')}`.toLowerCase();
  
  const supportingEvidence = ragChunks
    .filter((chunk) => {
      const chunkText = `${chunk.title || ''} ${chunk.content || ''} ${chunk.description || ''} ${(chunk.technologies || []).join(' ')}`.toLowerCase();
      return (
        requiredSkills.some((req) => chunkText.includes(req.toLowerCase())) ||
        candidateSkills.some((cand) => chunkText.includes(cand.toLowerCase()) && searchCorpus.includes(cand.toLowerCase())) ||
        searchCorpus.split(/\s+/).some((word) => word.length > 4 && chunkText.includes(word))
      );
    })
    .slice(0, 3);

  // Dynamic whyGoodMatch bullet points
  const whyGoodMatch: string[] = [];
  if (riskScore >= 70) {
    // For critical scams, omit positive match praise
  } else {
    if (matchedSkills.length > 0) {
      whyGoodMatch.push(
        `Directly matches ${matchedSkills.length} key required skill${matchedSkills.length > 1 ? 's' : ''}: ${matchedSkills.slice(0, 4).join(', ')}.`
      );
    } else {
      whyGoodMatch.push(
        `Aligns with your primary target role (${profile.targetRole || profile.title || 'selected focus area'}).`
      );
    }

    if (opportunity.budgetType === 'hourly' && budgetMax >= userRateMin) {
      whyGoodMatch.push(
        `Client hourly rate ($${budgetMin}-$${budgetMax}/hr) meets your target rate expectation (${profile.currency} ${userRateMin}+/hr).`
      );
    } else if (opportunity.budgetMin) {
      whyGoodMatch.push(
        `Project compensation of $${opportunity.budgetMin.toLocaleString()} fits your target engagement scope.`
      );
    }

    whyGoodMatch.push(
      `Your availability of ${profile.availabilityHoursPerWeek || 20} hrs/week perfectly suits this ${profile.locationPreference || 'Remote'} assignment.`
    );
  }

  const potentialGaps: string[] = [];
  if (riskScore >= 70) {
    potentialGaps.push(
      'CRITICAL SECURITY HAZARD: Risk Sentinel flagged severe scam indicators for this listing.'
    );
  } else if (riskScore >= 40) {
    potentialGaps.push(
      'CAUTION: Risk Sentinel flagged moderate risks (e.g. unverified payment, speculative trial scope).'
    );
  }

  if (missingSkills.length > 0) {
    potentialGaps.push(
      `Opportunity mentions ${missingSkills.slice(0, 3).join(', ')} which are not explicitly highlighted in your primary profile tags.`
    );
  }

  const pitchSkillHighlights = matchedSkills.length > 0 ? matchedSkills.slice(0, 2).join(' and ') : profile.targetRole;
  const recommendedPitchAngle = riskScore >= 70
    ? 'DO NOT APPLY. Risk Sentinel flagged this post as hazardous.'
    : `Highlight your proven hands-on track record in ${pitchSkillHighlights}, emphasize rapid delivery, and cite relevant portfolio achievements to win client confidence.`;

  return {
    overallScore,
    skillsMatchScore,
    rateAlignmentScore,
    experienceMatchScore,
    matchedSkills,
    missingSkills,
    whyGoodMatch,
    potentialGaps,
    recommendedPitchAngle,
    supportingEvidence: supportingEvidence.length > 0 ? supportingEvidence : ragChunks.slice(0, 2),
  };
}

/**
 * Parses raw pasted job text into an Opportunity data object.
 */
export function parseRawJobToOpportunity(rawText: string, profile: FreelancerProfile): Opportunity {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] || 'Custom Job Requirement';
  
  // Extract title
  let title = firstLine.length > 100 ? firstLine.slice(0, 97) + '...' : firstLine;
  if (title.toLowerCase().startsWith('job title:') || title.toLowerCase().startsWith('title:')) {
    title = title.replace(/^(job title|title):\s*/i, '');
  }

  // Infer technical skills from candidate profile + common tech keywords
  const commonKeywords = [
    'Generative AI', 'GenAI', 'RAG', 'Agentic AI', 'LangGraph', 'LangChain', 'OpenAI', 'Anthropic',
    'Databricks', 'Snowflake', 'BigQuery', 'Spark', 'PySpark', 'SQL', 'PostgreSQL', 'Python',
    'TypeScript', 'JavaScript', 'React', 'Next.js', 'Tailwind CSS', 'FastAPI', 'Node.js',
    'Azure', 'AWS', 'GCP', 'Docker', 'Kubernetes', 'dbt', 'Airflow', 'Machine Learning', 'NLP',
    'Power BI', 'Tableau', 'Excel', 'Data Analysis', 'Video Editing', 'Motion Graphics', 'DaVinci Resolve',
    'Premiere Pro', 'After Effects', 'CapCut', 'Color Grading', 'YouTube Video Editing'
  ];

  const candidateSkillNames = extractProfileSkills(profile);
  const allScanSkills = Array.from(new Set([...commonKeywords, ...candidateSkillNames]));

  const skillsRequired = allScanSkills.filter((keyword) => {
    const regex = new RegExp(`\\b${keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    return regex.test(rawText);
  });

  // Fallback skills if none found in text
  if (skillsRequired.length === 0) {
    skillsRequired.push(...candidateSkillNames.slice(0, 3));
  }

  // Detect hourly vs fixed budget
  let budgetType: 'hourly' | 'fixed' = 'hourly';
  let budgetMin = profile.hourlyRateMin || 50;
  let budgetMax = profile.hourlyRateMax || 85;

  const hourlyMatch = rawText.match(/\$(\d+)\s*-\s*\$(\d+)\s*(?:\/hr|per hour|hr)/i);
  const fixedMatch = rawText.match(/\$(\d+(?:,\d+)?)\s*(?:fixed|total|project|budget)/i);

  if (hourlyMatch) {
    budgetType = 'hourly';
    budgetMin = parseInt(hourlyMatch[1], 10);
    budgetMax = parseInt(hourlyMatch[2], 10);
  } else if (fixedMatch) {
    budgetType = 'fixed';
    budgetMin = parseInt(fixedMatch[1].replace(/,/g, ''), 10);
    budgetMax = budgetMin;
  }

  const customId = `opp-custom-${Date.now()}`;
  const initialOpp: Partial<Opportunity> = {
    id: customId,
    title,
    clientName: 'Direct Client Requirement',
    clientCountry: 'Remote',
    clientRating: 5.0,
    clientSpent: 'Verified Hiring Requirement',
    platform: 'direct',
    platformUrl: '#',
    description: rawText,
    budgetType,
    budgetMin,
    budgetMax,
    budgetCurrency: 'USD',
    skillsRequired: skillsRequired.length > 0 ? skillsRequired : [profile.targetRole || 'Freelance Project'],
    experienceLevel: 'Intermediate',
    postedAt: new Date().toISOString(),
    estimatedDuration: profile.projectDuration || '1 - 2 weeks',
  };

  // Run dynamic Risk Agent screening on pasted job requirement
  const riskAssessment = evaluateOpportunityRisk(initialOpp);

  return {
    ...initialOpp as Required<Omit<Opportunity, 'riskAssessment' | 'matchReasoning' | 'status'>>,
    riskAssessment,
    status: 'active',
  };
}
