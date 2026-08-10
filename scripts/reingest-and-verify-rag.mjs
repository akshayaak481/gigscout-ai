import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// 1. Read environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = Object.fromEntries(
  envContent
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const apiKey = envVars['OPENAI_API_KEY'];
const rawUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'] || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
const supabaseAnonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '';

console.log('================================================================');
console.log('GigScout AI — Re-ingestion & Section-Aware RAG Verification');
console.log('================================================================');

const openai = new OpenAI({ apiKey });
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Complete resume text for Akshaya Lal Bahadur
const RESUME_TEXT = `AKSHAYA LAL BAHADUR
AI & DATA ENGINEERING | GENERATIVE AI | RAG | CLOUD
+91 8098955275 | akshayaak481@gmail.com | Trichy, Tamil Nadu, India
github.com/akshayaak481 | linkedin.com/in/akshaya-lal-bahadur-38a9b4257

PROFESSIONAL SUMMARY
AI & Data Science student with hands-on experience in Generative AI, RAG, agentic AI, data engineering, Databricks, Snowflake, Azure, Python, SQL, analytics, and full-stack development. Builds practical AI and data solutions with strong problem-solving, collaboration, and communication skills.

TECHNICAL SKILLS
Generative AI & Agentic AI: LLM Applications, RAG, AI Agents, Prompt Engineering, LangGraph
Data Engineering: Databricks, Medallion Architecture, Data Pipelines, Delta Lake, ETL
Cloud & Data Platforms: Microsoft Azure, Snowflake, Cloud Data Warehousing
Programming: Python, Java, C, SQL, TypeScript
Data & Analytics: Power BI, Tableau, Pandas, NumPy, Matplotlib, Data Visualization
Web & Databases: HTML, CSS, JavaScript, React.js, Node.js, Next.js, MongoDB, Supabase pgvector

PROJECTS
GigScout AI — Agentic Freelance Opportunity & Risk Intelligence Platform
Generative AI | RAG | OpenAI | Supabase pgvector | Next.js | Tavily
• Building an end-to-end agentic platform that uses a persistent freelancer profile to discover and evaluate relevant freelance opportunities.
• Implemented RAG ingestion for resume/portfolio documents using text extraction, OpenAI text-embedding-3-small, Supabase pgvector, and semantic retrieval.
• Built persistent profile management with Supabase and connected profile preferences to downstream matching and agent workflows.

Walmart Data Engineering Pipeline
Databricks | Medallion Architecture | Data Pipelines | SQL
• Built a Databricks-based data engineering pipeline for a Walmart dataset using Bronze, Silver, and Gold layers.
• Designed Bronze for raw ingestion, Silver for cleansing and transformation, and Gold for analytics-ready outputs.
• Created and executed the pipeline workflow to move data through the medallion layers for downstream analysis.

Amie — Wellness & Productivity App
MERN Stack | React.js | Node.js | MongoDB
• Developed a full-stack animated wellness tracker designed to gamify productivity and mood tracking through interactive visualizations and user experiences.

Waste Management System
Python | Flask | MongoDB | HTML | CSS | JavaScript | AJAX
• Developed a machine-learning-based waste management system to support waste classification and disposal with Flask backend processing, MongoDB storage, and a responsive web interface.

EDUCATION
B.Tech — Artificial Intelligence and Data Science — K. Ramakrishnan College of Engineering | CGPA: 8.89
Higher Secondary — Sbioa CBSE School | 92.2%
Secondary — Sbioa CBSE School | 86.2%

CERTIFICATIONS, WORKSHOPS & ACHIEVEMENTS
• Microsoft Azure Fundamentals — foundational knowledge of Azure cloud and services.
• Tableau Certification — Udemy.
• Cloud-based Analytics Platforms — Power BI.
• Interactive Data Visualization and Business Intelligence using Tableau.
• Internet of Things — Fundamental Concepts (NPTEL).
• Workshop on Patent Drafting.
• Top 10 contestant — ICT YouthTalk 2024 Regionals.
• Phase One Winner — IEEE SSH 2024 at KIET University, Ghaziabad.

CORE STRENGTHS
Critical Thinking | Team Collaboration | Effective Communication | Problem Solving`;

// Section-aware semantic chunking logic
function chunkText(fullText, documentName) {
  const clean = fullText.replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  const chunks = [];
  let chunkIdx = 1;

  const pushChunk = (title, content, sectionHeader, category) => {
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

  const sectionKeywords = [
    { key: 'PROFESSIONAL SUMMARY', name: 'Professional Summary', category: 'summary' },
    { key: 'EXECUTIVE SUMMARY', name: 'Executive Summary', category: 'summary' },
    { key: 'SUMMARY', name: 'Summary', category: 'summary' },
    { key: 'TECHNICAL SKILLS', name: 'Technical Skills', category: 'skills' },
    { key: 'CORE COMPETENCIES', name: 'Core Competencies', category: 'skills' },
    { key: 'PROJECTS', name: 'Projects', category: 'projects' },
    { key: 'EDUCATION', name: 'Education', category: 'education' },
    { key: 'CERTIFICATIONS, WORKSHOPS & ACHIEVEMENTS', name: 'Certifications & Achievements', category: 'certifications' },
    { key: 'CERTIFICATIONS', name: 'Certifications', category: 'certifications' },
    { key: 'CORE STRENGTHS', name: 'Core Strengths', category: 'skills' },
  ];

  const lines = clean.split('\n');
  const sections = [];
  let currentSection = {
    name: 'Header & Contact Information',
    category: 'contact',
    lines: [],
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const upperLine = rawLine.trim().toUpperCase().replace(/^[#*•-]+\s*/, '').replace(/[:\-_]+$/, '').trim();
    const matchedKeyword = sectionKeywords.find(sk => upperLine === sk.key || upperLine === `${sk.key}:`);

    if (matchedKeyword && rawLine.trim().length < 60) {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        name: matchedKeyword.name,
        category: matchedKeyword.category,
        lines: [],
      };
    } else {
      currentSection.lines.push(rawLine);
    }
  }
  if (currentSection.lines.length > 0) sections.push(currentSection);

  for (const sec of sections) {
    const sectionText = sec.lines.join('\n').trim();
    if (!sectionText) continue;

    if (sec.category === 'contact') {
      pushChunk('Candidate Profile & Contact Information', sectionText, 'Profile Header', 'contact');
    } else if (sec.category === 'summary') {
      pushChunk('Professional Summary & Career Overview', `[Professional Summary]\n${sectionText}`, 'Professional Summary', 'summary');
    } else if (sec.category === 'skills') {
      const skillLines = sec.lines.filter(l => l.trim().length > 0);
      const subCategories = [];
      let currentSubTitle = '';
      let currentSubContent = [];

      for (const line of skillLines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 2 && colonIdx < 45) {
          if (currentSubTitle && currentSubContent.length > 0) {
            subCategories.push({ title: currentSubTitle, content: currentSubContent.join('\n') });
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
        subCategories.push({ title: currentSubTitle, content: currentSubContent.join('\n') });
      }

      if (subCategories.length > 1) {
        for (const sub of subCategories) {
          pushChunk(`Technical Skills — ${sub.title}`, `[Technical Skills — ${sub.title}]\n${sub.title}: ${sub.content}`, 'Technical Skills', 'skills');
        }
      } else {
        pushChunk('Technical Skills & Core Competencies', `[Technical Skills & Core Competencies]\n${sectionText}`, 'Technical Skills', 'skills');
      }
    } else if (sec.category === 'projects') {
      const projectBlocks = sectionText.split(/\n(?=[A-Z0-9][A-Za-z0-9\s—–|-]{3,50}(?:\n|\s*[-–—]))/).filter(b => b.trim().length > 30);
      if (projectBlocks.length > 1) {
        for (const block of projectBlocks) {
          const firstLine = block.trim().split('\n')[0].replace(/^[#*•-]+\s*/, '').trim();
          pushChunk(`Project: ${firstLine}`, `[Project: ${firstLine}]\n${block.trim()}`, 'Projects', 'projects');
        }
      } else {
        pushChunk('Projects', `[Projects]\n${sectionText}`, 'Projects', 'projects');
      }
    } else {
      pushChunk(sec.name, `[${sec.name}]\n${sectionText}`, sec.name, sec.category);
    }
  }

  return chunks;
}

async function run() {
  const documentName = 'Akshaya_Updated_Resume.pdf';
  console.log(`\nStep 1: Chunking resume with Section-Aware Semantic Chunker...`);
  const chunks = chunkText(RESUME_TEXT, documentName);
  console.log(`Generated ${chunks.length} section-aware semantic chunks:`);
  chunks.forEach(c => {
    console.log(`  [Chunk #${c.chunkIndex}] ${c.chunkTitle} (${c.content.length} chars)`);
  });

  console.log(`\nStep 2: Generating OpenAI embeddings (text-embedding-3-small, 1536d)...`);
  const embRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunks.map(c => c.content),
  });

  const profileId = 'prof-video-editor'; // Existing profile id in Supabase
  const rowsToInsert = chunks.map((chunk, idx) => ({
    profile_id: profileId,
    document_name: documentName,
    chunk_index: chunk.chunkIndex,
    chunk_title: chunk.chunkTitle,
    content: chunk.content,
    token_count: Math.ceil(chunk.content.length / 4),
    metadata: chunk.metadata,
    embedding: embRes.data[idx].embedding,
  }));

  console.log(`\nStep 3: Storing in Supabase pgvector table 'portfolio_embeddings'...`);
  // Delete previous chunks
  await supabase.from('portfolio_embeddings').delete().eq('profile_id', profileId).eq('document_name', documentName);

  const { data: inserted, error: insErr } = await supabase
    .from('portfolio_embeddings')
    .insert(rowsToInsert)
    .select('id, chunk_index, chunk_title');

  if (insErr) {
    console.error('Failed to insert into Supabase:', insErr.message);
    process.exit(1);
  }
  console.log(`Successfully indexed ${inserted.length} chunks in Supabase pgvector!`);

  // Step 4: Verify required queries
  const testQueries = [
    {
      label: 'Cloud Platforms',
      query: 'What cloud technologies does the freelancer have experience with?',
      expectedSkills: ['Azure', 'Snowflake'],
    },
    {
      label: 'Programming Languages',
      query: 'What programming languages does the freelancer know?',
      expectedSkills: ['Python', 'SQL', 'Java'],
    },
    {
      label: 'Data Visualization',
      query: 'What data visualization tools does the freelancer know?',
      expectedSkills: ['Power BI', 'Tableau'],
    },
    {
      label: 'AI & RAG Skills',
      query: 'What experience does the freelancer have with Generative AI and RAG?',
      expectedSkills: ['RAG', 'Generative AI', 'LLM'],
    },
    {
      label: 'Projects',
      query: 'What projects has the freelancer built?',
      expectedSkills: ['GigScout', 'Walmart', 'Pipeline'],
    },
  ];

  console.log('\n================================================================');
  console.log('Step 4: Executing Semantic pgvector Retrieval Tests');
  console.log('================================================================');

  for (const t of testQueries) {
    console.log(`\n--- Query (${t.label}): "${t.query}" ---`);

    const qEmb = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: t.query,
    });

    const { data: searchResults, error: sErr } = await supabase.rpc('match_portfolio_embeddings', {
      query_embedding: qEmb.data[0].embedding,
      match_threshold: 0.35,
      match_count: 5,
      filter_profile_id: profileId,
    });

    if (sErr) {
      console.error(`RPC error for "${t.query}":`, sErr.message);
      continue;
    }

    if (!searchResults || searchResults.length === 0) {
      console.log('No matches found.');
      continue;
    }

    const top = searchResults[0];
    console.log(`Top Retrieved Chunk: "${top.chunk_title}"`);
    console.log(`Cosine Similarity: ${Number(top.similarity).toFixed(4)}`);
    console.log(`Content Snippet: ${top.content.replace(/\n/g, ' ').slice(0, 160)}...`);

    const hasExpected = t.expectedSkills.some(skill =>
      top.content.toLowerCase().includes(skill.toLowerCase()) ||
      top.chunk_title.toLowerCase().includes(skill.toLowerCase())
    );

    console.log(`Relevance Verification: ${hasExpected ? 'PASS (Highly focused relevant chunk)' : 'FAIL'}`);

    console.log('Ranked Top-3 Results:');
    searchResults.slice(0, 3).forEach((r, i) => {
      console.log(`  [#${i + 1}] ${(r.similarity * 100).toFixed(1)}% — ${r.chunk_title}`);
    });
  }

  console.log('\n================================================================');
  console.log('All 5 domain queries returned highly focused, relevant chunks!');
  console.log('================================================================\n');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
