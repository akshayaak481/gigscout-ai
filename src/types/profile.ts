export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  metricsOrOutcome?: string; // e.g. "Increased conversion by 34%"
}

export type SkillCategory = 
  | 'frontend' 
  | 'backend' 
  | 'ai_ml' 
  | 'ai' 
  | 'data' 
  | 'database' 
  | 'cloud' 
  | 'design' 
  | 'devops' 
  | 'writing' 
  | 'video' 
  | 'marketing' 
  | 'other';

export interface SkillProficiency {
  name: string;
  category: SkillCategory;
  yearsExperience: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface FreelancerProfile {
  id: string;
  name: string;
  title: string;
  avatarUrl?: string;
  bio: string;
  targetRole: string;
  skills: SkillProficiency[];
  hourlyRateMin: number;
  hourlyRateMax: number;
  currency: string;
  availabilityHoursPerWeek: number;
  experienceYears: number;
  preferredPlatforms: string[];
  locationPreference: string; // e.g. 'Remote', 'Hybrid', 'On-site'
  projectDuration: string; // e.g. '1 - 2 weeks', '2 - 4 weeks', '1 - 3 months'
  portfolioItems: PortfolioItem[];
  rawResumeText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PitchDraft {
  opportunityId: string;
  subject: string;
  openingHook: string;
  bodyParagraphs: string[];
  highlightedPortfolios: PortfolioItem[];
  suggestedRate: string;
  proposedTimeline: string;
  callToAction: string;
  fullMarkdown: string;
  tone: 'professional' | 'consultative' | 'bold_creator' | 'concise';
}
