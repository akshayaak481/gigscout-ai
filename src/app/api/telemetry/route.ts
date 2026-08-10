import { NextResponse } from 'next/server';
import { getTraceRuns, getObservabilitySummary, LANGSMITH_CONFIG } from '@/lib/services/telemetryService';

export async function GET() {
  try {
    const traceRuns = getTraceRuns();
    const summary = getObservabilitySummary(traceRuns);

    return NextResponse.json({
      success: true,
      langsmithConfig: {
        tracingEnabled: process.env.LANGCHAIN_TRACING_V2 === 'true' || LANGSMITH_CONFIG.tracingEnabled,
        endpoint: process.env.LANGCHAIN_ENDPOINT || LANGSMITH_CONFIG.endpoint,
        project: process.env.LANGCHAIN_PROJECT || LANGSMITH_CONFIG.project,
        hasApiKey: Boolean(process.env.LANGCHAIN_API_KEY),
      },
      summary,
      traceRuns,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch telemetry data' },
      { status: 500 }
    );
  }
}
