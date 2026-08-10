import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import OpenAI from 'openai';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface SemanticChunk {
  chunkIndex: number;
  chunkTitle: string;
  content: string;
  metadata: {
    sectionHeader?: string;
    category?: string;
    documentName: string;
    length: number;
    timestamp: string;
    [key: string]: any;
  };
}

/**
 * Section-aware semantic chunker for resumes, portfolios, and technical CVs.
 * Intelligently recognizes major sections (Summary, Technical Skills, Projects,
 * Experience, Education, Certifications) and splits them into cohesive,
 * high-relevance semantic units preserving full context.
 */
function chunkText(fullText: string, documentName: string): SemanticChunk[] {
  const clean = fullText.replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  const chunks: SemanticChunk[] = [];
  let chunkIdx = 1;

  const pushChunk = (
    title: string,
    content: string,
    sectionHeader: string,
    category: string
  ) => {
    const trimmed = content.trim();
    if (!trimmed || trimmed.length < 20) return;
    chunks.push({
      chunkIndex: chunkIdx++,
      chunkTitle: title.slice(0, 80).trim(),
      content: trimmed,
      metadata: {
        documentName,
        sectionHeader,
        category,
        length: trimmed.length,
        timestamp: new Date().toISOString(),
      },
    });
  };

  // Common section header patterns in resumes & technical portfolios
  const sectionKeywords = [
    { key: 'PROFESSIONAL SUMMARY', name: 'Professional Summary', category: 'summary' },
    { key: 'EXECUTIVE SUMMARY', name: 'Executive Summary', category: 'summary' },
    { key: 'SUMMARY', name: 'Summary', category: 'summary' },
    { key: 'ABOUT ME', name: 'About Me', category: 'summary' },
    { key: 'TECHNICAL SKILLS', name: 'Technical Skills', category: 'skills' },
    { key: 'CORE COMPETENCIES', name: 'Core Competencies', category: 'skills' },
    { key: 'SKILLS & EXPERTISE', name: 'Technical Skills', category: 'skills' },
    { key: 'SKILLS', name: 'Technical Skills', category: 'skills' },
    { key: 'FEATURED PROJECTS', name: 'Projects', category: 'projects' },
    { key: 'KEY PROJECTS', name: 'Projects', category: 'projects' },
    { key: 'PROJECTS', name: 'Projects', category: 'projects' },
    { key: 'WORK EXPERIENCE', name: 'Work Experience', category: 'experience' },
    { key: 'PROFESSIONAL EXPERIENCE', name: 'Professional Experience', category: 'experience' },
    { key: 'EXPERIENCE', name: 'Experience', category: 'experience' },
    { key: 'EDUCATION', name: 'Education', category: 'education' },
    { key: 'ACADEMIC BACKGROUND', name: 'Education', category: 'education' },
    { key: 'CERTIFICATIONS & ACHIEVEMENTS', name: 'Certifications & Achievements', category: 'certifications' },
    { key: 'CERTIFICATIONS, WORKSHOPS & ACHIEVEMENTS', name: 'Certifications & Achievements', category: 'certifications' },
    { key: 'CERTIFICATIONS', name: 'Certifications', category: 'certifications' },
    { key: 'AWARDS & ACHIEVEMENTS', name: 'Awards & Achievements', category: 'certifications' },
    { key: 'PUBLICATIONS', name: 'Publications', category: 'publications' },
    { key: 'CORE STRENGTHS', name: 'Core Strengths', category: 'skills' },
  ];

  // Look for section boundaries by line
  const lines = clean.split('\n');
  const sections: Array<{
    name: string;
    category: string;
    startLine: number;
    lines: string[];
  }> = [];

  let currentSection = {
    name: 'Header & Contact Information',
    category: 'contact',
    startLine: 0,
    lines: [] as string[],
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmedLine = rawLine.trim();
    const upperLine = trimmedLine.toUpperCase().replace(/^[#*•-]+\s*/, '').replace(/[:\-_]+$/, '').trim();

    const matchedKeyword = sectionKeywords.find(
      (sk) => upperLine === sk.key || upperLine === `${sk.key}:`
    );

    if (matchedKeyword && trimmedLine.length < 60) {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        name: matchedKeyword.name,
        category: matchedKeyword.category,
        startLine: i,
        lines: [],
      };
    } else {
      currentSection.lines.push(rawLine);
    }
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  // If no sections were identified, fallback to paragraph-based chunking
  if (sections.length <= 1 && sections[0]?.lines.length > 25) {
    const paragraphs = clean.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
    paragraphs.forEach((p, idx) => {
      const firstLine = p.trim().split('\n')[0].replace(/^[#*•-]+\s*/, '').slice(0, 50).trim();
      pushChunk(
        firstLine || `${documentName} - Section ${idx + 1}`,
        p,
        'General Document Content',
        'general'
      );
    });
    return chunks;
  }

  // Process each recognized section with specialized domain chunking
  for (const sec of sections) {
    const sectionText = sec.lines.join('\n').trim();
    if (!sectionText) continue;

    if (sec.category === 'contact') {
      pushChunk(
        'Candidate Profile & Contact Information',
        sectionText,
        'Profile Header',
        'contact'
      );
    } else if (sec.category === 'summary') {
      pushChunk(
        'Professional Summary & Career Overview',
        `[Professional Summary]\n${sectionText}`,
        'Professional Summary',
        'summary'
      );
    } else if (sec.category === 'skills') {
      // Intelligently parse individual technical skill categories
      const skillLines = sec.lines.filter((l) => l.trim().length > 0);
      const subCategories: Array<{ title: string; content: string }> = [];

      let currentSubTitle = '';
      let currentSubContent: string[] = [];

      for (const line of skillLines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 2 && colonIdx < 45) {
          if (currentSubTitle && currentSubContent.length > 0) {
            subCategories.push({
              title: currentSubTitle,
              content: currentSubContent.join('\n'),
            });
          }
          currentSubTitle = line.slice(0, colonIdx).replace(/^[•*-]\s*/, '').trim();
          currentSubContent = [line.slice(colonIdx + 1).trim()];
        } else if (currentSubTitle) {
          currentSubContent.push(line.trim());
        } else {
          currentSubContent.push(line.trim());
        }
      }

      if (currentSubTitle && currentSubContent.length > 0) {
        subCategories.push({
          title: currentSubTitle,
          content: currentSubContent.join('\n'),
        });
      }

      if (subCategories.length > 1) {
        for (const sub of subCategories) {
          pushChunk(
            `Technical Skills — ${sub.title}`,
            `[Technical Skills — ${sub.title}]\n${sub.title}: ${sub.content}`,
            'Technical Skills',
            'skills'
          );
        }
      } else {
        pushChunk(
          'Technical Skills & Core Competencies',
          `[Technical Skills & Core Competencies]\n${sectionText}`,
          'Technical Skills',
          'skills'
        );
      }
    } else if (sec.category === 'projects' || sec.category === 'experience') {
      // Split into distinct projects or work experiences
      const projectBlocks = sectionText
        .split(/\n(?=[A-Z0-9][A-Za-z0-9\s—–|-]{3,50}(?:\n|\s*[-–—]))/)
        .filter((b) => b.trim().length > 30);

      if (projectBlocks.length > 1) {
        for (const block of projectBlocks) {
          const firstLine = block.trim().split('\n')[0].replace(/^[#*•-]+\s*/, '').trim();
          pushChunk(
            `${sec.name === 'Projects' ? 'Project: ' : ''}${firstLine}`,
            `[${sec.name} — ${firstLine}]\n${block.trim()}`,
            sec.name,
            sec.category
          );
        }
      } else {
        pushChunk(
          sec.name,
          `[${sec.name}]\n${sectionText}`,
          sec.name,
          sec.category
        );
      }
    } else {
      // Education, Certifications, Awards, Strengths
      pushChunk(
        sec.name,
        `[${sec.name}]\n${sectionText}`,
        sec.name,
        sec.category
      );
    }
  }

  // Fallback guard
  if (chunks.length === 0 && clean.length > 0) {
    pushChunk(
      `${documentName} - Overview`,
      clean.slice(0, 1000),
      'Document Overview',
      'general'
    );
  }

  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let rawText = '';
    let documentName = 'Portfolio_Resume.pdf';
    let profileId = '';
    let documentUrl = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const pId = formData.get('profileId') as string | null;
      const textOverride = formData.get('text') as string | null;

      if (pId) profileId = pId;

      if (file) {
        documentName = file.name;
        const arrayBuffer = await file.arrayBuffer();

        // 1. Extract text from PDF using unpdf
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          try {
            const pdfData = new Uint8Array(arrayBuffer);
            const { text } = await extractText(pdfData);
            rawText = Array.isArray(text) ? text.join('\n\n') : (text || '');
          } catch (pdfErr: any) {
            console.warn('PDF extraction notice:', pdfErr.message);
          }

          if (!rawText || !rawText.trim()) {
            const decoder = new TextDecoder('utf-8', { fatal: false });
            rawText = decoder.decode(arrayBuffer).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
          }
        } else {
          const decoder = new TextDecoder('utf-8');
          rawText = decoder.decode(arrayBuffer);
        }

        // 2. Upload to Supabase Storage if configured
        if (isServerSupabaseConfigured) {
          try {
            const storagePath = `${profileId || 'default'}/${Date.now()}_${documentName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const { data: uploadData, error: uploadErr } = await supabaseServer.storage
              .from('portfolio-documents')
              .upload(storagePath, arrayBuffer, {
                contentType: file.type || 'application/pdf',
                upsert: true,
              });

            if (!uploadErr && uploadData) {
              const { data: publicUrlData } = supabaseServer.storage
                .from('portfolio-documents')
                .getPublicUrl(storagePath);
              documentUrl = publicUrlData?.publicUrl || '';
            }
          } catch (stErr) {
            console.warn('Supabase storage upload notice:', stErr);
          }
        }
      } else if (textOverride) {
        rawText = textOverride;
      }
    } else {
      const json = await req.json().catch(() => ({}));
      rawText = json.text || '';
      if (json.documentName) documentName = json.documentName;
      if (json.profileId) profileId = json.profileId;
    }

    // Resolve profileId from Supabase if not provided in payload
    if (!profileId && isServerSupabaseConfigured) {
      const { data: profRows } = await supabaseServer
        .from('profiles')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (profRows && profRows.length > 0) {
        profileId = profRows[0].id;
      }
    }

    if (!profileId) {
      profileId = 'prof-default-user';
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: 'No readable text could be extracted from the document.' },
        { status: 400 }
      );
    }

    // 3. Section-Aware Semantic Chunking
    const chunks = chunkText(rawText, documentName);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'Document was empty or contained no text sections.' },
        { status: 400 }
      );
    }

    // 4. Verify OpenAI configuration
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder')) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in .env.local.' },
        { status: 500 }
      );
    }

    // 5. Generate Real OpenAI Embeddings (text-embedding-3-small, 1536 dimensions)
    const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    const textsToEmbed = chunks.map((c) => c.content);

    let embeddingRes;
    try {
      embeddingRes = await openai.embeddings.create({
        model: embeddingModel,
        input: textsToEmbed,
      });
    } catch (embErr: any) {
      console.error('OpenAI embeddings API error:', embErr);
      return NextResponse.json(
        { error: `Failed to generate embeddings: ${embErr.message}` },
        { status: 500 }
      );
    }

    const chunkEmbeddings = chunks.map((chunk, idx) => ({
      chunk,
      embedding: embeddingRes.data[idx].embedding,
    }));

    // 6. Verify Supabase configuration
    if (!isServerSupabaseConfigured) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local.' },
        { status: 503 }
      );
    }

    // 7. Store in Supabase pgvector table (portfolio_embeddings)
    const rowsToInsert = chunkEmbeddings.map(({ chunk, embedding }) => ({
      profile_id: profileId,
      document_name: documentName,
      document_url: documentUrl,
      chunk_index: chunk.chunkIndex,
      chunk_title: chunk.chunkTitle,
      content: chunk.content,
      token_count: Math.ceil(chunk.content.length / 4),
      metadata: chunk.metadata,
      embedding: embedding,
    }));

    // Delete previous chunks from same document name to prevent duplicate indexing
    const { error: delErr } = await supabaseServer
      .from('portfolio_embeddings')
      .delete()
      .eq('profile_id', profileId)
      .eq('document_name', documentName);

    if (delErr) {
      console.warn('Supabase previous chunk cleanup notice:', delErr.message);
    }

    const { data: insertedRows, error: insertErr } = await supabaseServer
      .from('portfolio_embeddings')
      .insert(rowsToInsert)
      .select('id, profile_id, document_name, chunk_index, chunk_title, content, metadata, created_at');

    if (insertErr) {
      console.error('Failed to insert embeddings into Supabase:', insertErr);
      return NextResponse.json(
        { 
          error: `Failed to store embeddings in Supabase: ${insertErr.message}. Ensure supabase/schema.sql has been executed in your Supabase SQL editor.` 
        },
        { status: 500 }
      );
    }

    // Return structured ingestion summary
    const insertedChunks = (insertedRows && insertedRows.length > 0)
      ? insertedRows.map((row: any) => ({
          id: row.id,
          profileId: row.profile_id,
          documentName: row.document_name,
          chunkIndex: row.chunk_index,
          chunkTitle: row.chunk_title,
          title: row.chunk_title,
          description: row.content.slice(0, 200) + '...',
          content: row.content,
          similarityScore: 1.0,
          metadata: row.metadata,
          createdAt: row.created_at,
        }))
      : chunkEmbeddings.map(({ chunk }) => ({
          id: `chunk-${chunk.chunkIndex}`,
          documentName,
          chunkIndex: chunk.chunkIndex,
          chunkTitle: chunk.chunkTitle,
          title: chunk.chunkTitle,
          description: chunk.content.slice(0, 200) + '...',
          content: chunk.content,
          similarityScore: 1.0,
          metadata: chunk.metadata,
        }));

    return NextResponse.json({
      success: true,
      documentName,
      documentUrl,
      totalCharacters: rawText.length,
      chunksCount: chunks.length,
      chunks: insertedChunks,
      source: 'supabase_pgvector',
    });
  } catch (error: any) {
    console.error('RAG Ingestion Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during ingestion.' },
      { status: 500 }
    );
  }
}
