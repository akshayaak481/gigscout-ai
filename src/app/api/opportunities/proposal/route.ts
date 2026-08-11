import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { profileId, opportunity, tone = 'consultative' } = body;

    // 1. Validate profileId
    if (!profileId || typeof profileId !== 'string' || !profileId.trim()) {
      return NextResponse.json(
        { success: false, error: 'profileId is required for proposal generation.' },
        { status: 400 }
      );
    }

    if (!opportunity || typeof opportunity !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Valid opportunity object is required for proposal generation.' },
        { status: 400 }
      );
    }

    const cleanProfileId = profileId.trim();

    if (!isServerSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: 'Supabase server configuration is missing.' },
        { status: 503 }
      );
    }

    // 2. Query Supabase strictly by profileId
    const { data: profileRows, error: profileErr } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('id', cleanProfileId)
      .limit(1);

    if (profileErr) {
      return NextResponse.json(
        { success: false, error: `Database error loading profile: ${profileErr.message}` },
        { status: 500 }
      );
    }

    if (!profileRows || profileRows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Profile with ID "${cleanProfileId}" not found in Supabase.` },
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
      targetRole: row.target_role || row.title || 'Freelance Professional',
      skills: Array.isArray(row.skills) ? row.skills : [],
      hourlyRateMin: Number(row.hourly_rate_min) || 0,
      hourlyRateMax: Number(row.hourly_rate_max) || 0,
      currency: row.currency || 'USD',
      availabilityHoursPerWeek: Number(row.availability_hours_per_week) || 20,
      experienceYears: Number(row.experience_years) || 1,
      preferredPlatforms: Array.isArray(row.preferred_platforms) ? row.preferred_platforms : ['upwork', 'weworkremotely', 'reddit'],
      locationPreference: row.location_preference || 'Remote',
      projectDuration: row.project_duration || '1 - 2 weeks',
      portfolioItems: Array.isArray(row.portfolio_items) ? row.portfolio_items : [],
      rawResumeText: row.raw_resume_text || '',
    };

    const skillNames = activeProfile.skills
      .map((s: any) => (typeof s === 'string' ? s : s.name))
      .filter(Boolean);

    // 3. Defensive server logging as required
    console.log(`[Proposal API] profileId=${activeProfile.id}`);
    console.log(`[Proposal API] profileName=${activeProfile.name}`);
    console.log(`[Proposal API] targetRole=${activeProfile.targetRole}`);

    // 4. Fetch real RAG portfolio embeddings for this profile
    let ragEvidenceList: string[] = [];
    try {
      const { data: ragData } = await supabaseServer
        .from('portfolio_embeddings')
        .select('chunk_title, content, document_name')
        .eq('profile_id', cleanProfileId)
        .limit(5);

      if (ragData && ragData.length > 0) {
        ragEvidenceList = ragData
          .map((r: any) => (r.content || '').trim())
          .filter(Boolean);
      }
    } catch (ragErr: any) {
      console.warn(`[Proposal API] Notice reading RAG chunks for ${cleanProfileId}:`, ragErr.message);
    }

    // 5. Determine commercial terms text
    const rateText = activeProfile.hourlyRateMin > 0
      ? (activeProfile.hourlyRateMax > activeProfile.hourlyRateMin
          ? `${activeProfile.currency} ${activeProfile.hourlyRateMin} - ${activeProfile.hourlyRateMax}/hr`
          : `${activeProfile.currency} ${activeProfile.hourlyRateMin}/hr`)
      : (opportunity.budgetMin
          ? (opportunity.budgetType === 'hourly' ? `$${opportunity.budgetMin}-${opportunity.budgetMax || opportunity.budgetMin}/hr` : `$${opportunity.budgetMin.toLocaleString()} (fixed)`)
          : 'Competitive Market Rate');

    const locationText = activeProfile.locationPreference || 'Remote';
    const availabilityText = activeProfile.availabilityHoursPerWeek > 0
      ? `${activeProfile.availabilityHoursPerWeek} hrs/week`
      : 'Flexible';

    let generatedProposal = '';

    // 6. Generate proposal via OpenAI if key is available
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')) {
      try {
        const systemPrompt = `You are an elite freelance proposal writer for "${activeProfile.name}", a top-tier "${activeProfile.targetRole}".
Write a highly compelling, professional, client-converting project proposal for the job posting provided.

FREELANCER PROFILE DATA:
- Name: ${activeProfile.name}
- Target Role: ${activeProfile.targetRole}
- Verified Skills: ${skillNames.join(', ') || activeProfile.targetRole}
- Rate: ${rateText}
- Availability: ${availabilityText} (${locationText})
- Target Duration: ${activeProfile.projectDuration}
${activeProfile.bio ? `- Bio Context: ${activeProfile.bio}` : ''}
${ragEvidenceList.length > 0 ? `- Grounded Portfolio / Resume Evidence:\n${ragEvidenceList.slice(0, 3).map(e => `• ${e.slice(0, 200)}`).join('\n')}` : ''}

TARGET OPPORTUNITY:
- Title: ${opportunity.title}
- Client: ${opportunity.clientName || 'Hiring Team'} (${opportunity.clientCountry || 'Remote'})
- Platform: ${opportunity.platform}
- Required Skills: ${(opportunity.skillsRequired || []).join(', ')}
- Description: ${opportunity.description}
- Estimated Duration: ${opportunity.estimatedDuration || 'Not specified'}

PROPOSAL TONE: ${tone.toUpperCase()}

STRICT RULES:
1. Address the client or hiring team naturally.
2. Highlight how ${activeProfile.name}'s specific skills (${skillNames.slice(0, 4).join(', ')}) directly address the client's needs.
3. Keep it punchy, concrete, and grounded without buzzword fluff.
4. Include clear engagement details (rate: ${rateText}, availability: ${availabilityText}, ${locationText}).
5. You MUST sign off the proposal EXACTLY as:
${tone === 'bold_creator' ? 'Cheers,' : tone === 'professional' ? 'Sincerely,' : tone === 'concise' ? 'Best regards,' : 'Warm regards,'}
${activeProfile.name}
${activeProfile.targetRole}

Return ONLY the raw proposal text.`;

        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [{ role: 'system', content: systemPrompt }],
          temperature: 0.3,
        });

        generatedProposal = completion.choices[0]?.message?.content?.trim() || '';
      } catch (aiErr: any) {
        console.warn('[Proposal API] OpenAI generation exception, falling back to deterministic template:', aiErr.message);
      }
    }

    // 7. Deterministic template fallback if OpenAI is unconfigured or failed
    if (!generatedProposal) {
      const clientGreeting = opportunity.clientName?.trim() || 'Hiring Team';
      const skillPhrase = skillNames.length > 0 ? skillNames.slice(0, 4).join(', ') : activeProfile.targetRole;
      
      const evidenceBullets = ragEvidenceList.length > 0
        ? ragEvidenceList.slice(0, 2).map(e => `• ${e.slice(0, 180)}.`).join('\n')
        : `• Proven experience delivering high-impact solutions with ${skillPhrase}.\n• Track record of clean execution and clear stakeholder communication.`;

      if (tone === 'concise') {
        generatedProposal = `Hi ${clientGreeting},

I saw your posting for "${opportunity.title}" and wanted to connect as my background in ${skillPhrase} directly aligns with your project deliverables.

Key Qualifications:
${evidenceBullets}

Engagement Terms:
• Rate: ${rateText}
• Availability: ${availabilityText} (${locationText})
• Timeline: Aligned with your project roadmap

Are you available for a brief kickoff call this week to discuss next steps?

Best regards,
${activeProfile.name}
${activeProfile.targetRole}`;
      } else if (tone === 'professional') {
        generatedProposal = `Dear ${clientGreeting},

I am writing to submit my proposal for "${opportunity.title}". Having reviewed your project description, my expertise in ${skillPhrase} aligns directly with your scope of work.

Qualifications & Proven Experience:
${evidenceBullets}

Proposed Commercial Terms:
• Rate: ${rateText}
• Availability: ${availabilityText} (${locationText})
• Delivery Timeline: ${activeProfile.projectDuration || '1 - 2 weeks'}

I focus on clean execution, reliable timelines, and transparent milestone reporting. Thank you for your consideration, and I look forward to connecting with your team.

Sincerely,
${activeProfile.name}
${activeProfile.targetRole}`;
      } else if (tone === 'bold_creator') {
        generatedProposal = `Hey ${clientGreeting},

Your project "${opportunity.title}" is right in my sweet spot. I bring deep hands-on expertise in ${skillPhrase} to deliver immediate results without ramp-up friction.

What I Bring:
${evidenceBullets}

Commercials:
• Rate: ${rateText}
• Availability: ${availabilityText} (${locationText})

Let's jump on a quick call to align on scope and get this executed.

Cheers,
${activeProfile.name}
${activeProfile.targetRole}`;
      } else {
        // Consultative
        generatedProposal = `Hello ${clientGreeting},

I am writing regarding your listing for "${opportunity.title}". Having reviewed your requirements, my technical capabilities in ${skillPhrase} align directly with your objectives.

Why I Can Deliver Immediate Value:
${evidenceBullets}

Engagement Overview:
• Rate: ${rateText}
• Availability: ${availabilityText} (${locationText})
• Timeline: Structured into transparent milestones for prompt delivery

I would welcome the opportunity to discuss your project in more detail. Looking forward to collaborating!

Warm regards,
${activeProfile.name}
${activeProfile.targetRole}`;
      }
    }

    return NextResponse.json({
      success: true,
      proposal: generatedProposal,
      profileUsed: {
        id: activeProfile.id,
        name: activeProfile.name,
        targetRole: activeProfile.targetRole,
        skills: skillNames,
        hourlyRateMin: activeProfile.hourlyRateMin,
        hourlyRateMax: activeProfile.hourlyRateMax,
        currency: activeProfile.currency,
        availabilityHoursPerWeek: activeProfile.availabilityHoursPerWeek,
        locationPreference: activeProfile.locationPreference,
        projectDuration: activeProfile.projectDuration,
      },
    });
  } catch (err: any) {
    console.error('[Proposal API] Error generating proposal:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'An unexpected error occurred generating the proposal.' },
      { status: 500 }
    );
  }
}
