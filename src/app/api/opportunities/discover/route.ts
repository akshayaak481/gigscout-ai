import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { 
  DiscoveredOpportunity, 
  DiscoveryStageLog, 
  DiscoverOpportunitiesResponse 
} from '@/types/opportunity';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  const logs: DiscoveryStageLog[] = [];
  const addLog = (step: DiscoveryStageLog['step'], title: string, detail: string) => {
    logs.push({
      step,
      title,
      detail,
      timestamp: new Date().toISOString(),
    });
  };

  try {
    const body = await req.json().catch(() => ({}));
    const profileIdFilter = body.profileId || null;

    // ---------------------------------------------------------------------------
    // Step 1: Read the saved freelancer profile from Supabase (Strict - No Mock Fallback)
    // ---------------------------------------------------------------------------
    addLog('profile', 'Reading Saved Profile', 'Querying Supabase database for active freelancer profile...');

    if (!isServerSupabaseConfigured) {
      addLog('profile', 'Supabase Unavailable', 'Supabase server configuration is missing.');
      return NextResponse.json(
        {
          success: false,
          generatedQueries: [],
          totalDiscovered: 0,
          opportunities: [],
          logs,
          error: 'Supabase is not configured. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local.',
        },
        { status: 503 }
      );
    }

    let profileQuery = supabaseServer
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (profileIdFilter) {
      profileQuery = profileQuery.eq('id', profileIdFilter);
    }

    const { data: profileRows, error: profileErr } = await profileQuery.limit(1);

    if (profileErr) {
      addLog('profile', 'Database Error', `Failed to query Supabase: ${profileErr.message}`);
      return NextResponse.json(
        {
          success: false,
          generatedQueries: [],
          totalDiscovered: 0,
          opportunities: [],
          logs,
          error: `Database error while loading profile from Supabase: ${profileErr.message}`,
        },
        { status: 500 }
      );
    }

    if (!profileRows || profileRows.length === 0) {
      addLog('profile', 'Profile Not Found', 'No saved profile exists in the Supabase database.');
      return NextResponse.json(
        {
          success: false,
          generatedQueries: [],
          totalDiscovered: 0,
          opportunities: [],
          logs,
          error: 'No saved freelancer profile found in Supabase. Please save your profile in My Profile first.',
        },
        { status: 404 }
      );
    }

    const row = profileRows[0];
    const activeProfile = {
      id: row.id,
      name: row.name || 'Freelancer',
      title: row.title || row.target_role || 'Freelance Professional',
      avatarUrl: row.avatar_url,
      bio: row.bio || '',
      targetRole: row.target_role || row.title || 'Freelancer',
      skills: Array.isArray(row.skills) ? row.skills : [],
      hourlyRateMin: Number(row.hourly_rate_min) || 0,
      hourlyRateMax: Number(row.hourly_rate_max) || 0,
      currency: row.currency || 'INR',
      availabilityHoursPerWeek: Number(row.availability_hours_per_week) || 10,
      experienceYears: Number(row.experience_years) || 1,
      preferredPlatforms: Array.isArray(row.preferred_platforms) ? row.preferred_platforms : ['upwork', 'weworkremotely', 'reddit'],
      locationPreference: row.location_preference || 'Remote',
      projectDuration: row.project_duration || '1 - 2 weeks',
      portfolioItems: Array.isArray(row.portfolio_items) ? row.portfolio_items : [],
      rawResumeText: row.raw_resume_text || '',
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };

    const skillNames = activeProfile.skills
      .map((s: any) => (typeof s === 'string' ? s : s.name))
      .filter(Boolean);

    const budgetStr = activeProfile.currency === 'INR'
      ? `₹${activeProfile.hourlyRateMin.toLocaleString()}+ / project`
      : `$${activeProfile.hourlyRateMin}+ / hr`;

    addLog(
      'profile',
      'Profile Loaded Successfully',
      `Loaded real profile "${activeProfile.name}" (${activeProfile.targetRole}) from Supabase.`
    );

    // ---------------------------------------------------------------------------
    // Step 2: Dynamically create relevant freelance-search queries using OpenAI
    // ---------------------------------------------------------------------------
    addLog('queries', 'Generating Search Queries', 'Synthesizing targeted multi-platform web search queries via OpenAI...');

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder')) {
      return NextResponse.json(
        {
          success: false,
          generatedQueries: [],
          totalDiscovered: 0,
          opportunities: [],
          logs,
          error: 'OpenAI API key is missing or invalid. Please check OPENAI_API_KEY in .env.local.',
        },
        { status: 500 }
      );
    }

    let generatedQueries: string[] = [];

    try {
      const queryPrompt = `
You are an AI Freelance Search Specialist.
Synthesize 3 distinct, highly targeted web search queries to find active freelance job postings and gig opportunities online for this profile:

Target Role: ${activeProfile.targetRole}
Key Skills: ${skillNames.join(', ') || activeProfile.targetRole}
Budget Expectation: ${budgetStr}
Location Preference: ${activeProfile.locationPreference}
Project Duration: ${activeProfile.projectDuration}

Generate queries tailored for platform listings (Upwork, WeWorkRemotely, Reddit r/forhire, Freelancer, RemoteOK, or general freelance boards).
Respond ONLY with a valid JSON object containing a "queries" array of 3 strings. Example format:
{
  "queries": [
    "hiring freelance video editor premiere pro remote",
    "upwork freelance short form reels video editor",
    "reddit forhire hiring video editor motion designer"
  ]
}
`;

      const queryCompletion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'user', content: queryPrompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const rawContent = queryCompletion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent);

      if (Array.isArray(parsed.queries)) {
        generatedQueries = parsed.queries;
      } else if (Array.isArray(parsed)) {
        generatedQueries = parsed;
      } else {
        generatedQueries = Object.values(parsed).filter((v): v is string => typeof v === 'string');
      }
    } catch (err: any) {
      console.warn('OpenAI query generation notice:', err.message);
    }

    // Fallback search queries if OpenAI response format was irregular
    if (generatedQueries.length < 2) {
      generatedQueries = [
        `hiring freelance ${activeProfile.targetRole} ${skillNames.slice(0, 2).join(' ')} ${activeProfile.locationPreference}`.trim(),
        `upwork reddit weworkremotely freelance ${activeProfile.targetRole} project`,
        `looking for freelance ${skillNames[0] || activeProfile.targetRole} ${activeProfile.locationPreference}`,
      ];
    }

    addLog('queries', 'Queries Generated', `Created ${generatedQueries.length} search queries tailored to ${activeProfile.targetRole}.`);

    // ---------------------------------------------------------------------------
    // Step 3: Use Tavily API to search the web for real opportunities
    // ---------------------------------------------------------------------------
    addLog('tavily', 'Dispatching Tavily Web Search', 'Searching live web feeds across platform boards for generated queries...');

    const tavilyApiKey = process.env.TAVILY_API_KEY;
    const rawSearchResults: Array<{ title: string; url: string; content: string; published_date?: string }> = [];

    if (!tavilyApiKey || tavilyApiKey.includes('your_actual_tavily_key') || tavilyApiKey.trim().length < 5) {
      addLog('tavily', 'Tavily Key Not Configured', 'TAVILY_API_KEY is not configured in .env.local.');
      return NextResponse.json({
        success: true,
        profileUsed: {
          id: activeProfile.id,
          name: activeProfile.name,
          targetRole: activeProfile.targetRole,
          skills: skillNames,
          locationPreference: activeProfile.locationPreference,
          budget: budgetStr,
          projectDuration: activeProfile.projectDuration,
        },
        generatedQueries,
        totalDiscovered: 0,
        opportunities: [],
        logs,
        error: 'Tavily API key is not configured in .env.local. Please provide a valid TAVILY_API_KEY to fetch live web opportunities.',
      });
    }

    try {
      const tavilyPromises = generatedQueries.slice(0, 3).map(async (query) => {
        try {
          const res = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: tavilyApiKey,
              query,
              search_depth: 'advanced',
              max_results: 5,
              include_answer: false,
              include_raw_content: false,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            return (data.results || []).map((r: any) => ({
              title: r.title || 'Freelance Project Listing',
              url: r.url || '',
              content: r.content || r.snippet || '',
              published_date: r.published_date || 'Not specified',
            }));
          } else {
            console.warn(`Tavily search HTTP ${res.status} for query: ${query}`);
          }
        } catch (tErr: any) {
          console.warn(`Tavily search query "${query}" exception:`, tErr.message);
        }
        return [];
      });

      const resultsPerQuery = await Promise.all(tavilyPromises);
      resultsPerQuery.forEach((list: Array<{ title: string; url: string; content: string; published_date?: string }>) => {
        list.forEach((item: { title: string; url: string; content: string; published_date?: string }) => {
          if (item.url && !rawSearchResults.some((existing) => existing.url === item.url)) {
            rawSearchResults.push(item);
          }
        });
      });
    } catch (tavilyErr: any) {
      console.warn('Tavily web search error:', tavilyErr.message);
    }

    addLog('tavily', 'Web Search Completed', `Retrieved ${rawSearchResults.length} real search result pages from Tavily.`);

    // ---------------------------------------------------------------------------
    // Step 4: Extract structured opportunity records via OpenAI (No Hallucinations)
    // ---------------------------------------------------------------------------
    let discoveredOpportunities: DiscoveredOpportunity[] = [];

    if (rawSearchResults.length === 0) {
      addLog('extraction', 'No Search Results', 'Tavily web search returned 0 matching results for the generated queries.');
    } else {
      addLog('extraction', 'Extracting Structured Opportunities', `Parsing ${rawSearchResults.length} results into structured opportunity records via OpenAI...`);

      try {
        const extractionPrompt = `
You are an AI Opportunity Data Parser. Extract clean freelance project postings from these real web search results:

SEARCH RESULTS:
${JSON.stringify(rawSearchResults.slice(0, 10), null, 2)}

TARGET FREELANCER ROLE CONTEXT:
${activeProfile.targetRole} (Skills: ${skillNames.join(', ')})

STRICT ANTI-HALLUCINATION EXTRACTION RULES:
1. Extract real freelance postings found in the search results.
2. DO NOT HALLUCINATE OR INVENT MISSING INFORMATION.
3. If budget, client, location, project duration, or posted date is not explicitly mentioned in the source snippet, strictly mark it as "Not specified".
4. Determine the source platform (e.g. "Upwork", "WeWorkRemotely", "Reddit r/forhire", "Freelancer", "RemoteOK", or "Web Board") based on the URL domain or text.
5. Return a JSON object with a key "opportunities" containing an array of objects.

JSON SCHEMA:
{
  "opportunities": [
    {
      "id": "opp-1",
      "title": "Exact or cleaned project title",
      "description": "Short 2-3 sentence summary of what the client requires",
      "source": "Platform Name",
      "url": "Exact URL from source result",
      "requiredSkills": ["Skill1", "Skill2"],
      "budget": "Stated budget/rate or 'Not specified'",
      "currency": "USD / INR / EUR or 'Not specified'",
      "location": "Remote / Location or 'Not specified'",
      "projectDuration": "Duration or 'Not specified'",
      "postedDate": "Date or 'Not specified'"
    }
  ]
}
`;

        const extractionCompletion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [{ role: 'user', content: extractionPrompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        });

        const rawExtracted = extractionCompletion.choices[0]?.message?.content || '{}';
        const parsedExtraction = JSON.parse(rawExtracted);
        const list = Array.isArray(parsedExtraction)
          ? parsedExtraction
          : Array.isArray(parsedExtraction.opportunities)
          ? parsedExtraction.opportunities
          : [];

        discoveredOpportunities = list.map((item: any, idx: number) => ({
          id: item.id || `opp-disc-${Date.now()}-${idx + 1}`,
          title: item.title || 'Freelance Opportunity',
          description: item.description || 'Freelance requirement extracted from web search feed.',
          source: item.source || 'Web Board',
          url: item.url || '#',
          requiredSkills: Array.isArray(item.requiredSkills) ? item.requiredSkills : [],
          budget: item.budget || 'Not specified',
          currency: item.currency || 'Not specified',
          location: item.location || 'Not specified',
          projectDuration: item.projectDuration || 'Not specified',
          postedDate: item.postedDate || 'Not specified',
          rawSnippet: rawSearchResults[idx]?.content || undefined,
        }));
      } catch (extErr: any) {
        console.error('Error during OpenAI opportunity extraction:', extErr);
      }
    }

    addLog('done', 'Discovery Agent Finished', `Compiled ${discoveredOpportunities.length} structured opportunities from real search feeds.`);

    const responseData: DiscoverOpportunitiesResponse = {
      success: true,
      profileUsed: {
        id: activeProfile.id,
        name: activeProfile.name,
        targetRole: activeProfile.targetRole,
        skills: skillNames,
        locationPreference: activeProfile.locationPreference,
        budget: budgetStr,
        projectDuration: activeProfile.projectDuration,
      },
      generatedQueries,
      totalDiscovered: discoveredOpportunities.length,
      opportunities: discoveredOpportunities,
      logs,
      error: rawSearchResults.length === 0 ? 'No live search results were found for the generated queries.' : null,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Opportunity Discovery Agent Error:', error);
    return NextResponse.json(
      {
        success: false,
        generatedQueries: [],
        totalDiscovered: 0,
        opportunities: [],
        logs,
        error: error.message || 'An unexpected error occurred during opportunity discovery.',
      },
      { status: 500 }
    );
  }
}
