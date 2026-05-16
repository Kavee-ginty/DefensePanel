/* global process */
import { readFile } from 'node:fs/promises'
import { formidable } from 'formidable'
import OpenAI from 'openai'
import { PDFParse } from 'pdf-parse'
import JSZip from 'jszip'
import mammoth from 'mammoth'

export const config = {
  api: {
    bodyParser: false,
  },
}

const MAX_DOC_CHARS_FOR_LLM = 14_000
const PPTX_SLIDE_TEXT_RE = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g

function parseForm(req) {
  const form = formidable({
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024,
  })

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

function getUploadedDocument(files) {
  const field = files.document ?? files.pdf
  const uploaded = Array.isArray(field) ? field[0] : field
  if (!uploaded) {
    throw new Error('Document file is required')
  }
  return uploaded
}

function extensionOf(file) {
  const name = file?.originalFilename ?? file?.newFilename ?? ''
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''
}

function getDocumentKind(file) {
  const ext = extensionOf(file)
  if (ext === 'pdf' || ext === 'docx' || ext === 'pptx') return ext

  const type = (file?.mimetype ?? '').toLowerCase()
  if (type === 'application/pdf') return 'pdf'
  if (
    type ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx'
  }
  if (
    type ===
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return 'pptx'
  }

  return null
}

function decodeXmlText(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function textFromSlideXml(xml) {
  const parts = []
  for (const match of xml.matchAll(PPTX_SLIDE_TEXT_RE)) {
    if (match[1]) parts.push(decodeXmlText(match[1]))
  }
  return parts.join(' ').trim()
}

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer })
  try {
    const parsed = await parser.getText()
    return parsed.text?.trim() ?? ''
  } finally {
    await parser.destroy()
  }
}

async function extractDocxText(buffer) {
  const { value } = await mammoth.extractRawText({ buffer })
  return (value ?? '').trim()
}

async function extractPptxText(buffer) {
  const zip = await JSZip.loadAsync(buffer)
  const slidePaths = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path))
    .sort((a, b) => {
      const num = (path) => Number(path.match(/slide(\d+)\.xml/i)?.[1] ?? 0)
      return num(a) - num(b)
    })

  if (slidePaths.length === 0) {
    throw new Error('No slides found in this presentation')
  }

  const slides = await Promise.all(
    slidePaths.map(async (path) => {
      const xml = await zip.file(path).async('text')
      return textFromSlideXml(xml)
    }),
  )

  return slides.filter(Boolean).join('\n\n').trim()
}

async function extractDocumentText(file, buffer) {
  const kind = getDocumentKind(file)
  if (kind === 'pdf') return extractPdfText(buffer)
  if (kind === 'docx') return extractDocxText(buffer)
  if (kind === 'pptx') return extractPptxText(buffer)
  throw new Error('Unsupported file type. Please upload a PDF, DOCX, or PPTX file.')
}

/**
 * Vercel Serverless — POST /api/process-document
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { files } = await parseForm(req)
    const document = getUploadedDocument(files)
    const buffer = await readFile(document.filepath)
    const documentText = await extractDocumentText(document, buffer)

    if (!documentText) {
      throw new Error('Could not extract text from document')
    }

    const truncated =
      documentText.length > MAX_DOC_CHARS_FOR_LLM
        ? `${documentText.slice(0, MAX_DOC_CHARS_FOR_LLM)}\n\n[Document truncated for processing.]`
        : documentText

    const extractedText = truncated

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at reading project documents and generating precise AI agent configuration for a defense panel simulation. You always output valid JSON only. No markdown, no backticks, no explanation.',
        },
        {
          role: 'user',
          content: `You are generating configuration for a hyper-critical AI defense panel judge.

Read this document completely and output ONLY a valid JSON object with exactly these 6 keys:

"system_prompt": A string UNDER 900 characters containing ALL of these:
- The exact project name and one sentence on what it does
- Exactly 3 specific technical claims with real numbers or metrics copied from the document
- Exactly 2 budget or timeline figures copied verbatim from the document
- Exactly 2 team roles or responsibilities mentioned in the document
- End with these exact instructions: "Ask one sharp question at a time. Never accept vague answers. Challenge every metric. Demand justification for every technology choice. If they are vague, say: That is not specific enough. Give me exact details."

"greeting": One sentence only. Start with Hello. Name the project. State you are here to critically evaluate it.

"role_objectives": Maximum 3 sentences. State: (1) your role as skeptical evaluator, (2) the specific technical areas you will probe based on this document, (3) your tone is professional but unimpressed.

"conversation_flow_structure": Exactly 5 numbered steps as a single string:
Step 1: Introduce yourself and ask them to explain the core technical approach in one sentence.
Step 2: Challenge the most ambitious technical claim found in the document — name it specifically.
Step 3: Probe the budget with the exact figures from the document — ask them to justify each major cost.
Step 4: Question whether the team has the capability to execute — reference specific roles from the document.
Step 5: Close by asking them to name the single biggest risk that could make this project fail.

"starting_script": 2 to 3 sentences maximum. Name the project. Say you have reviewed the full proposal. Tell them you have specific questions about the most technically ambitious component you found in the document — name that component explicitly.

"document_summary": A plain English summary of the document in exactly 150 to 200 words. Include: project name, what it does, core components, budget total, team structure, and the 3 most ambitious claims.

Document text to analyze:
${extractedText}`,
        },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content
    const parsedJson = JSON.parse(raw)

    const data = {
      role_objectives: parsedJson.role_objectives,
      conversation_flow_structure: parsedJson.conversation_flow_structure,
      starting_script: parsedJson.starting_script,
      system_prompt: parsedJson.system_prompt,
      greeting: parsedJson.greeting,
      document_summary: parsedJson.document_summary,
    }

    for (const key of [
      'role_objectives',
      'conversation_flow_structure',
      'starting_script',
      'system_prompt',
      'greeting',
      'document_summary',
    ]) {
      if (!data[key] || typeof data[key] !== 'string') {
        throw new Error(`Missing or invalid field in model output: ${key}`)
      }
    }

    return res.status(200).json({
      success: true,
      prompts: data,
      document_summary: data.document_summary,
    })
  } catch (err) {
    console.error('process-document failed', err)
    return res.status(500).json({
      success: false,
      error: err?.message || 'Document processing failed',
    })
  }
}
