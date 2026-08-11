import { Opportunity, RiskAssessment, RiskLevel, RedFlag } from '@/types/opportunity';

/**
 * Universal, profile-independent Risk Agent evaluation engine.
 * Evaluates any freelance opportunity based purely on text content,
 * client history, payment structure, and detectable scam indicators.
 */
export function evaluateOpportunityRisk(opp: Partial<Opportunity>): RiskAssessment {
  const opportunityId = opp.id || 'unassigned-opp';
  const title = (opp.title || '').trim();
  const description = (opp.description || '').trim();
  const fullText = `${title} ${description}`.toLowerCase();
  const clientSpent = (opp.clientSpent || '').toLowerCase();
  const clientRating = typeof opp.clientRating === 'number' ? opp.clientRating : 5.0;
  const platform = opp.platform || 'direct';

  const redFlags: RedFlag[] = [];
  const safetySignals: string[] = [];
  let score = 0;

  // 1. Off-Platform Communication Trap (Telegram / WhatsApp / Skype / External direct contact)
  const hasTelegram = fullText.includes('telegram') || /@[\w_]{4,}/.test(description) || fullText.includes('t.me/');
  const hasWhatsApp = fullText.includes('whatsapp') || /\+?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/.test(description);
  const hasOffPlatformCommand = 
    fullText.includes('do not apply on') || 
    fullText.includes('apply outside') || 
    fullText.includes('contact directly on') ||
    fullText.includes('contact our hiring manager directly') ||
    fullText.includes('reach out on telegram') ||
    fullText.includes('email your resume directly to') ||
    fullText.includes('message me directly on');

  if (hasTelegram || hasWhatsApp || hasOffPlatformCommand) {
    const evidenceMatch = description.match(/(telegram\s*@?[\w_]+|whatsapp\s*[\d+\-\s]+|contact.*?telegram|do not apply on[^\n.]+)/i);
    redFlags.push({
      id: `rf-comm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      category: 'communication',
      severity: 'critical',
      title: 'Off-Platform Redirection (Telegram/WhatsApp)',
      description: 'Client explicitly directs freelancers to bypass platform messaging and contact external communication channels.',
      evidence: evidenceMatch ? evidenceMatch[0] : 'Off-platform contact instructions detected in description.',
    });
    score += 45;
  }

  // 2. Advance-Fee / Fake Check / Equipment Purchase Scams
  const hasFakeCheck = 
    fullText.includes('equipment check') || 
    fullText.includes('cashiers check') || 
    fullText.includes('deposit check') || 
    fullText.includes('receive the check') ||
    fullText.includes('send back the remaining');

  const hasUpfrontFee = 
    fullText.includes('registration fee') || 
    fullText.includes('refundable deposit') || 
    fullText.includes('security deposit') || 
    fullText.includes('training fee') ||
    fullText.includes('buy software from') ||
    fullText.includes('purchase license from our vendor');

  if (hasFakeCheck || hasUpfrontFee) {
    const evidenceMatch = description.match(/(equipment check|deposit check|registration fee|refundable deposit|purchase.*?vendor|send back.*?remaining)/i);
    redFlags.push({
      id: `rf-pay-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      category: 'payment',
      severity: 'critical',
      title: 'Advance-Fee / Fake Check Payment Trap',
      description: 'Job references sending upfront checks or paying external fees for equipment/registration before starting.',
      evidence: evidenceMatch ? evidenceMatch[0] : 'Fake check or upfront deposit pattern detected.',
    });
    score += 50;
  }

  // 3. Demands for Sensitive Personal / Financial Information
  const hasSensitiveDataDemand = 
    fullText.includes('bank info') || 
    fullText.includes('banking details') || 
    fullText.includes('id card and bank') || 
    fullText.includes('passport scan') || 
    fullText.includes('ssn') || 
    fullText.includes('login credentials');

  if (hasSensitiveDataDemand) {
    redFlags.push({
      id: `rf-sec-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      category: 'terms',
      severity: 'critical',
      title: 'Premature Sensitive Data Collection',
      description: 'Client requests identity documents, banking credentials, or personal identifiers prior to an official contract.',
      evidence: 'Demands personal ID card or banking info in job posting description.',
    });
    score += 40;
  }

  // 4. Unrealistic Compensation for Low-Skill / Generic Tasks
  const isTypingOrEasy = fullText.includes('re-type') || fullText.includes('retype') || fullText.includes('copy typing') || fullText.includes('data entry for students') || fullText.includes('very easy work');
  const hasHugeBudget = (opp.budgetMin && opp.budgetMin >= 3000) || fullText.includes('$5,000') || fullText.includes('$5,500') || fullText.includes('$6,000') || fullText.includes('$100/hr');

  if (isTypingOrEasy && hasHugeBudget) {
    redFlags.push({
      id: `rf-comp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      category: 'payment',
      severity: 'high',
      title: 'Disproportionately Inflated Budget',
      description: 'Offer rate ($3,000 - $6,000+) is 10x-50x above standard market rate for entry-level repetitive tasks, a signature phishing lure.',
      evidence: `Budget of $${opp.budgetMin || '5,500'} for low-complexity assignment.`,
    });
    score += 35;
  }

  // 5. Unpaid Large Trial Work / Speculative Exploitation
  const hasUnpaidTrial = 
    fullText.includes('unpaid test') || 
    fullText.includes('unpaid trial') || 
    fullText.includes('free sample') || 
    fullText.includes('free test') || 
    fullText.includes('test sample') || 
    fullText.includes('test task') || 
    fullText.includes('without watermark') ||
    fullText.includes('free trial work') ||
    fullText.includes('unbilled test');

  if (hasUnpaidTrial) {
    redFlags.push({
      id: `rf-trial-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      category: 'scope',
      severity: 'medium',
      title: 'Unpaid Speculative Work Demand',
      description: 'Client asks for custom deliverables or unwatermarked work samples prior to milestone funding.',
      evidence: 'Mentions free test deliverable or unpaid trial assignment before hire.',
    });
    score += 25;
  }

  // 6. Extreme Urgency & Pressure Tactics
  const hasExtremeUrgency = 
    fullText.includes('urgent') || 
    fullText.includes('rush') || 
    fullText.includes('24 hours') || 
    fullText.includes('start within 1 hour') || 
    fullText.includes('first 5 candidates only') ||
    fullText.includes('immediate start needed');

  if (hasExtremeUrgency && (redFlags.length > 0 || clientRating < 4.5)) {
    redFlags.push({
      id: `rf-urg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      category: 'terms',
      severity: 'low',
      title: 'High-Pressure Urgency Tactics',
      description: 'Listing utilizes urgent hiring triggers to bypass candidate scrutiny.',
      evidence: 'Rush/urgent timeline emphasis combined with other risk factors.',
    });
    score += 10;
  }

  // 7. Suspicious Client Profile Metrics
  const isZeroSpend = clientSpent.includes('$0') || clientSpent.includes('₹0') || clientSpent.includes('0.00') || clientSpent.includes('unverified');
  const isLowRating = clientRating > 0 && clientRating < 4.3;
  const isUnratedWithBigBudget = clientRating === 0 && (opp.budgetMin || 0) >= 2000;

  if (isLowRating) {
    redFlags.push({
      id: `rf-rating-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      category: 'reputation',
      severity: 'medium',
      title: 'Substandard Client Rating History',
      description: `Client rating of ${clientRating}/5.0 indicates past disputes or scope instability.`,
      evidence: `Platform rating: ${clientRating} stars.`,
    });
    score += 15;
  }

  if (isZeroSpend && (redFlags.length > 0 || isUnratedWithBigBudget)) {
    redFlags.push({
      id: `rf-rep-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      category: 'reputation',
      severity: 'medium',
      title: 'Zero Platform Spending History',
      description: 'Client account has zero verified past spend on platform and unverified payment records.',
      evidence: 'Client spent: $0.00 / Unverified payment method.',
    });
    score += 15;
  }

  // 8. Positive Safety Signals
  if (!hasTelegram && !hasWhatsApp && !hasOffPlatformCommand) {
    safetySignals.push('Standard platform-verified communication channels');
  }
  if (!isZeroSpend && !isUnratedWithBigBudget) {
    safetySignals.push('Client has verified hiring history and platform expenditure');
  }
  if (clientRating >= 4.8) {
    safetySignals.push(`Excellent client platform feedback (${clientRating} / 5.0 stars)`);
  }
  if (opp.budgetType === 'hourly' && (opp.budgetMin || 0) >= 35 && (opp.budgetMax || 0) <= 180) {
    safetySignals.push('Compensation strictly aligned with competitive market benchmarks');
  }
  if (fullText.includes('escrow') || platform === 'upwork' || platform === 'weworkremotely') {
    safetySignals.push('Platform escrow & milestone protection enabled');
  }
  if (safetySignals.length === 0) {
    safetySignals.push('Basic job details provided');
  }

  // Baseline calibration
  if (redFlags.length === 0) {
    score = Math.min(15, Math.max(5, Math.round(score)));
  } else {
    score = Math.min(100, Math.max(40, score));
  }

  // Determine Level
  let level: RiskLevel = 'VERIFIED_SAFE';
  if (score >= 70) {
    level = 'CRITICAL_SCAM';
  } else if (score >= 40) {
    level = 'MODERATE_RISK';
  } else if (score >= 20) {
    level = 'LOW_RISK';
  } else {
    level = 'VERIFIED_SAFE';
  }

  const safeToApply = score < 50;

  // Build Summary
  let summary = '';
  if (level === 'CRITICAL_SCAM') {
    summary = `CRITICAL THREAT: Risk Sentinel detected severe scam vectors (${redFlags.map(r => r.title).join(', ')}). Do not engage or share personal/banking information.`;
  } else if (level === 'MODERATE_RISK') {
    summary = `CAUTION ADVISED: Risk Sentinel identified potential risks (${redFlags.map(r => r.title).join(', ')}). Proceed with platform escrow and verify milestones prior to work.`;
  } else if (level === 'LOW_RISK') {
    summary = 'LOW RISK: Standard opportunity with minor notes. Platform escrow recommended.';
  } else {
    summary = `VERIFIED SAFE: Clean security audit by Risk Sentinel. Verified client history, realistic rates, and official escrow protections.`;
  }

  const assessment: RiskAssessment = {
    score,
    level,
    summary,
    redFlags,
    safetySignals,
    safeToApply,
    analyzedAt: new Date().toISOString(),
  };

  // Defensive Server Logging as required
  console.log(`[Risk Agent] opportunityId=${opportunityId}`);
  console.log(`[Risk Agent] riskScore=${assessment.score}`);
  console.log(`[Risk Agent] riskLevel=${assessment.level}`);
  console.log(`[Risk Agent] reasons=${assessment.redFlags.map(r => r.title).join('; ') || 'Clean security audit'}`);

  return assessment;
}
