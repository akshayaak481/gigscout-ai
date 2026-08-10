export type PlatformType = 'upwork' | 'freelancer' | 'reddit' | 'weworkremotely' | 'twitter' | 'direct';

export type BudgetType = 'fixed' | 'hourly' | 'negotiable';

export type RiskLevel = 'VERIFIED_SAFE' | 'LOW_RISK' | 'MODERATE_RISK' | 'CRITICAL_SCAM';

export interface RedFlag {
  id: string;
  category: 'payment' | 'communication' | 'scope' | 'reputation' | 'terms';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence?: string;
}

export interface RiskAssessment {
  score: number; // 0 (Safest) to 100 (Deadly scam)
  level: RiskLevel;
  summary: string;
  redFlags: RedFlag[];
  safetySignals: string[];
  safeToApply: boolean;
  analyzedAt: string;
}

export interface MatchReasoning {
  overallScore: number; // 0 - 100%
  skillsMatchScore: number;
  rateAlignmentScore: number;
  experienceMatchScore: number;
  whyGoodMatch: string[];
  potentialGaps: string[];
  recommendedPitchAngle: string;
  relevantPortfolioIds: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  clientName: string;
  clientCountry?: string;
  clientRating?: number;
  clientSpent?: string;
  platform: PlatformType;
  platformUrl: string;
  description: string;
  budgetType: BudgetType;
  budgetMin?: number;
  budgetMax?: number;
  budgetCurrency: string;
  skillsRequired: string[];
  experienceLevel: 'Entry' | 'Intermediate' | 'Expert';
  postedAt: string;
  estimatedDuration?: string;
  riskAssessment: RiskAssessment;
  matchReasoning?: MatchReasoning;
  status: 'active' | 'applied' | 'saved' | 'archived';
}

export interface OpportunityFilter {
  query?: string;
  platform?: PlatformType | 'all';
  maxRiskLevel?: RiskLevel | 'all';
  minMatchScore?: number;
  budgetType?: BudgetType | 'all';
  experienceLevel?: string | 'all';
}

export interface DiscoveredOpportunity {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  requiredSkills: string[];
  budget: string;
  currency: string;
  location: string;
  projectDuration: string;
  postedDate: string;
  rawSnippet?: string;
}

export interface DiscoveryStageLog {
  step: 'profile' | 'queries' | 'tavily' | 'extraction' | 'done';
  title: string;
  detail: string;
  timestamp: string;
}

export interface DiscoverOpportunitiesResponse {
  success: boolean;
  profileUsed?: {
    id: string;
    name: string;
    targetRole: string;
    skills: string[];
    locationPreference: string;
    budget: string;
    projectDuration: string;
  };
  generatedQueries: string[];
  totalDiscovered: number;
  opportunities: DiscoveredOpportunity[];
  logs?: DiscoveryStageLog[];
  error?: string | null;
}

