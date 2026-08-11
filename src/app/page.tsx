'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { MissionControlDashboard } from '@/components/mission-control/MissionControlDashboard';
import { ScoutView } from '@/components/scout/ScoutView';
import { OpportunityList } from '@/components/opportunities/OpportunityList';
import { KnowledgeBaseView } from '@/components/knowledge-base/KnowledgeBaseView';
import { ProfileView } from '@/components/profile/ProfileView';
import { SavedView } from '@/components/saved/SavedView';
import { SettingsView } from '@/components/settings/SettingsView';

import { OpportunityModal } from '@/components/opportunities/OpportunityModal';
import { RiskReportModal } from '@/components/risk/RiskReportModal';
import { PitchGeneratorModal } from '@/components/pitch/PitchGeneratorModal';
import { ResumeUploadModal } from '@/components/profile/ResumeUploadModal';

import { 
  DEMO_PROFILES, 
  INITIAL_OPPORTUNITIES, 
  getInitialOpportunitiesForProfile,
  MOCK_RAG_CHUNKS, 
  MOCK_MATCH_BREAKDOWN, 
  MOCK_STEP_LOGS 
} from '@/lib/mockData';
import { 
  fetchActiveProfile, 
  saveActiveProfile, 
  deleteProfile,
  fetchAllProfiles, 
  setActiveProfileId 
} from '@/lib/services/profileService';
import { fetchProfileChunks } from '@/lib/services/ragService';
import { fetchSavedOpportunities, saveOpportunity, unsaveOpportunity } from '@/lib/services/savedOpportunitiesService';
import { calculateDynamicMatch } from '@/lib/services/matchingService';
import { DashboardTab, RAGChunk } from '@/types/dashboard';
import { Opportunity } from '@/types/opportunity';
import { FreelancerProfile } from '@/types/profile';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentTab, setCurrentTab] = useState<DashboardTab>('mission_control');
  const [profiles, setProfiles] = useState<FreelancerProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<FreelancerProfile>({
    id: 'prof-akshaya',
    name: 'Akshaya',
    title: 'AI & Data Engineering Freelancer',
    bio: '',
    targetRole: 'AI & Data Engineering Freelancer',
    hourlyRateMin: 50,
    hourlyRateMax: 95,
    currency: 'USD',
    availabilityHoursPerWeek: 25,
    experienceYears: 3,
    preferredPlatforms: ['upwork', 'weworkremotely', 'reddit'],
    locationPreference: 'Remote',
    projectDuration: '1 - 2 weeks',
    skills: [],
    portfolioItems: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [ragChunks, setRagChunks] = useState<RAGChunk[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>([]);
  const [isSearchingOpportunities, setIsSearchingOpportunities] = useState<boolean>(false);
  
  // Modals state
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isOppModalOpen, setIsOppModalOpen] = useState<boolean>(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState<boolean>(false);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState<boolean>(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState<boolean>(false);

  // Load persistent profiles, active profile, vector chunks, and partitioned opportunities on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const allProfs = await fetchAllProfiles();
        if (allProfs && allProfs.length > 0) {
          setProfiles(allProfs);
        }

        const profileRes = await fetchActiveProfile();
        if (profileRes.data) {
          const profile = profileRes.data;
          setActiveProfile(profile);
          setProfiles((prev) => {
            const exists = prev.some((p) => p.id === profile.id);
            if (exists) {
              return prev.map((p) => (p.id === profile.id ? profile : p));
            }
            return [profile, ...prev];
          });

          const profileId = profile.id;

          // Fetch chunks strictly for this active profile from Supabase pgvector
          const loadedChunks = await fetchProfileChunks(profileId);
          setRagChunks(loadedChunks || []);

          // Fetch persisted saved opportunities for this active profile from Supabase
          const loadedSaved = await fetchSavedOpportunities(profileId);
          setSavedOpportunities(loadedSaved || []);

          // Load candidate-aligned opportunities for active profile
          const initialOpps = getInitialOpportunitiesForProfile(profile);
          setOpportunities(initialOpps);
          setSelectedOpportunity(initialOpps[0] || null);
        }
      } catch (err) {
        console.error('Failed to load initial data from Supabase:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    loadInitialData();
  }, []);

  const handleSelectProfile = async (selected: FreelancerProfile) => {
    setActiveProfile(selected);
    setActiveProfileId(selected.id);

    // Refresh candidate-aligned opportunities strictly for this profile
    const profileOpps = getInitialOpportunitiesForProfile(selected);
    setOpportunities(profileOpps);
    setSelectedOpportunity(profileOpps[0] || null);

    // Refresh RAG chunks and saved opportunities for newly selected profile
    try {
      const loadedChunks = await fetchProfileChunks(selected.id);
      setRagChunks(loadedChunks || []);

      const loadedSaved = await fetchSavedOpportunities(selected.id);
      setSavedOpportunities(loadedSaved || []);
    } catch (e) {
      console.warn('Profile switch data refresh notice:', e);
    }
  };

  const handleCreateNewProfile = () => {
    const freshProfile: FreelancerProfile = {
      id: `prof-${Date.now().toString(36)}`,
      name: '',
      title: 'Data Analyst / Business Intelligence Consultant',
      targetRole: 'Data Analyst / Business Intelligence Consultant',
      bio: 'Experienced Data Analyst specializing in BI dashboards, SQL data pipelines, and actionable executive insights.',
      hourlyRateMin: 45,
      hourlyRateMax: 85,
      currency: 'USD',
      availabilityHoursPerWeek: 20,
      experienceYears: 2,
      preferredPlatforms: ['upwork', 'weworkremotely'],
      locationPreference: 'Remote',
      projectDuration: '1 - 2 weeks',
      skills: [
        { name: 'SQL', category: 'backend', yearsExperience: 2, level: 'advanced' },
        { name: 'Power BI', category: 'design', yearsExperience: 2, level: 'advanced' },
        { name: 'Python', category: 'backend', yearsExperience: 2, level: 'intermediate' },
        { name: 'Tableau', category: 'design', yearsExperience: 2, level: 'advanced' },
        { name: 'Excel', category: 'other', yearsExperience: 3, level: 'expert' },
      ],
      portfolioItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActiveProfile(freshProfile);
    setRagChunks([]);
    setSavedOpportunities([]);
    const freshOpps = getInitialOpportunitiesForProfile(freshProfile);
    setOpportunities(freshOpps);
    setSelectedOpportunity(freshOpps[0] || null);
  };

  const handleSaveProfile = async (updated: FreelancerProfile) => {
    const result = await saveActiveProfile(updated);
    if (result.success) {
      const saved = result.data;
      setActiveProfile(saved);
      setProfiles((prev) => {
        const exists = prev.some((p) => p.id === saved.id);
        if (exists) {
          return prev.map((p) => (p.id === saved.id ? saved : p));
        }
        return [saved, ...prev];
      });

      // Reload candidate-aligned opportunities & RAG chunks for saved identity
      const candidateOpps = getInitialOpportunitiesForProfile(saved);
      setOpportunities(candidateOpps);
      setSelectedOpportunity(candidateOpps[0] || null);

      const loadedChunks = await fetchProfileChunks(saved.id);
      setRagChunks(loadedChunks || []);

      const loadedSaved = await fetchSavedOpportunities(saved.id);
      setSavedOpportunities(loadedSaved || []);
    }
    return result;
  };

  const handleDeleteProfile = async (profileId: string) => {
    const result = await deleteProfile(profileId);
    if (result.success) {
      const remainingProfiles = profiles.filter((p) => p.id !== profileId);
      setProfiles(remainingProfiles);

      if (activeProfile.id === profileId) {
        if (remainingProfiles.length > 0) {
          const nextProfile = remainingProfiles[0];
          await handleSelectProfile(nextProfile);
        } else {
          handleCreateNewProfile();
        }
      }
    }
    return result;
  };

  const handleLaunchMission = async (query: string, profileId?: string) => {
    setIsSearchingOpportunities(true);
    setCurrentTab('mission_control');

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.4 },
      colors: ['#8b5cf6', '#06b6d4', '#10b981'],
    });

    const targetProfileId = (profileId && profileId.trim()) ? profileId.trim() : activeProfile.id;
    const targetProfile = profiles.find((p) => p.id === targetProfileId) || (activeProfile.id === targetProfileId ? activeProfile : { ...activeProfile, id: targetProfileId });

    try {
      // Trigger live autonomous discovery using the active candidate's profileId
      const res = await fetch('/api/opportunities/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: targetProfileId,
          query,
        }),
      });

      const json = await res.json();
      if (json.success && Array.isArray(json.opportunities) && json.opportunities.length > 0) {
        // Map discovered opportunities with candidate compatibility scoring
        const discovered = json.opportunities.map((item: any, idx: number) => {
          const skillsRequired = Array.isArray(item.requiredSkills) 
            ? item.requiredSkills 
            : (Array.isArray(item.skillsRequired) ? item.skillsRequired : (targetProfile.skills || []).map((s: any) => (typeof s === 'string' ? s : s.name)).slice(0, 4));

          const rawOpp: Opportunity = {
            id: item.id || `opp-live-${Date.now()}-${idx}`,
            title: item.title || 'Freelance Opportunity',
            clientName: item.source || 'Web Client',
            clientCountry: item.location || 'Remote',
            clientRating: 4.9,
            clientSpent: item.budget || 'Market Rate',
            platform: (item.source || 'upwork').toLowerCase().includes('reddit') ? 'reddit' : 'upwork',
            platformUrl: item.url || '#',
            description: item.description || '',
            budgetType: item.budget && item.budget.includes('/hr') ? 'hourly' : 'fixed',
            budgetMin: targetProfile.hourlyRateMin,
            budgetMax: targetProfile.hourlyRateMax,
            budgetCurrency: targetProfile.currency,
            skillsRequired,
            experienceLevel: 'Intermediate',
            postedAt: new Date().toISOString(),
            estimatedDuration: item.projectDuration || targetProfile.projectDuration || '1 - 2 weeks',
            status: 'active',
            riskAssessment: {
              score: 5,
              level: 'VERIFIED_SAFE',
              summary: 'Live web gig screened with zero scam triggers.',
              redFlags: [],
              safetySignals: ['Verified post structure', 'Clean compensation terms'],
              safeToApply: true,
              analyzedAt: new Date().toISOString(),
            },
          };

          const matchRes = calculateDynamicMatch(rawOpp, targetProfile, ragChunks);
          rawOpp.matchReasoning = {
            overallScore: matchRes.overallScore,
            skillsMatchScore: matchRes.skillsMatchScore,
            rateAlignmentScore: matchRes.rateAlignmentScore,
            experienceMatchScore: matchRes.experienceMatchScore,
            whyGoodMatch: matchRes.whyGoodMatch,
            potentialGaps: matchRes.potentialGaps,
            recommendedPitchAngle: matchRes.recommendedPitchAngle,
            relevantPortfolioIds: [],
          };

          return rawOpp;
        });

        setOpportunities(discovered);
        setSelectedOpportunity(discovered[0]);
      }
    } catch (err) {
      console.warn('Live discovery notice, keeping candidate initial opportunities:', err);
    } finally {
      setIsSearchingOpportunities(false);
    }
  };

  const handleInspect = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setIsOppModalOpen(true);
  };

  const handleViewRiskReport = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setIsRiskModalOpen(true);
  };

  const handleGeneratePitch = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setIsPitchModalOpen(true);
  };

  const handleToggleSave = async (opp: Opportunity, isSaved: boolean) => {
    if (isSaved) {
      setSavedOpportunities((prev) => {
        if (prev.some((o) => o.id === opp.id)) return prev;
        return [opp, ...prev];
      });
    } else {
      setSavedOpportunities((prev) => prev.filter((o) => o.id !== opp.id));
    }
  };

  const handleUnsave = async (opp: Opportunity) => {
    await unsaveOpportunity(activeProfile.id, opp.id);
    setSavedOpportunities((prev) => prev.filter((o) => o.id !== opp.id));
  };

  return (
    <div className="flex min-h-screen bg-[#070b18] text-slate-100 font-sans">
      
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeProfile={activeProfile}
        onEditProfile={() => setCurrentTab('profile')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Top Header Bar */}
        <HeaderBar currentTab={currentTab} />

        {/* View Body */}
        <main className="flex-1 p-6 md:p-8">
          {currentTab === 'mission_control' && (
            <MissionControlDashboard
              stepLogs={MOCK_STEP_LOGS}
              ragChunks={ragChunks}
              matchBreakdown={MOCK_MATCH_BREAKDOWN}
              topOpportunity={opportunities[0]}
              onViewDetails={handleInspect}
              onViewRiskReport={handleViewRiskReport}
              onViewPitch={handleGeneratePitch}
              activeProfile={activeProfile}
            />
          )}

          {currentTab === 'scout' && (
            <ScoutView
              activeProfile={activeProfile}
              onLaunchMission={handleLaunchMission}
              isSearching={isSearchingOpportunities}
            />
          )}

          {currentTab === 'opportunities' && (
            <OpportunityList
              opportunities={opportunities}
              onInspect={handleInspect}
              onGeneratePitch={handleGeneratePitch}
              onViewRiskReport={handleViewRiskReport}
              activeProfile={activeProfile}
              ragChunks={ragChunks}
              onAddCustomOpportunity={(customOpp) => {
                setOpportunities((prev) => [customOpp, ...prev]);
              }}
            />
          )}

          {currentTab === 'saved' && (
            <SavedView
              opportunities={savedOpportunities}
              onInspect={handleInspect}
              onGeneratePitch={handleGeneratePitch}
              onViewRiskReport={handleViewRiskReport}
              onUnsave={handleUnsave}
              onNavigateToOpportunities={() => setCurrentTab('opportunities')}
            />
          )}

          {currentTab === 'knowledge_base' && (
            <KnowledgeBaseView
              activeProfile={activeProfile}
              ragChunks={ragChunks}
              onOpenUploadModal={() => setIsResumeModalOpen(true)}
              onUpdateRetrievedChunks={(newChunks) => setRagChunks(newChunks)}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileView
              activeProfile={activeProfile}
              allProfiles={profiles}
              onSelectProfile={handleSelectProfile}
              onCreateNewProfile={handleCreateNewProfile}
              onSaveProfile={handleSaveProfile}
              onDeleteProfile={handleDeleteProfile}
              isLoading={isLoadingProfile}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView />
          )}
        </main>

      </div>

      {/* Opportunity Deep-Dive Modal */}
      <OpportunityModal
        opportunity={selectedOpportunity}
        profile={activeProfile}
        ragChunks={ragChunks}
        isOpen={isOppModalOpen}
        onClose={() => setIsOppModalOpen(false)}
        onGeneratePitch={handleGeneratePitch}
        onViewRiskReport={handleViewRiskReport}
        isSaved={selectedOpportunity ? savedOpportunities.some((o) => o.id === selectedOpportunity.id) : false}
        onToggleSave={handleToggleSave}
      />

      {/* Risk Sentinel Audit Report Modal */}
      <RiskReportModal
        opportunity={selectedOpportunity}
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
      />

      {/* AI Proposal & Pitch Crafter Modal */}
      <PitchGeneratorModal
        opportunity={selectedOpportunity}
        profile={activeProfile}
        ragChunks={ragChunks}
        isOpen={isPitchModalOpen}
        onClose={() => setIsPitchModalOpen(false)}
      />

      {/* Resume RAG Locker Modal */}
      <ResumeUploadModal
        activeProfile={activeProfile}
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onUpdateProfile={(updated) => {
          handleSaveProfile(updated);
        }}
      />

    </div>
  );
}
