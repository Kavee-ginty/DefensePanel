/* global process */
import { readFile } from 'node:fs/promises'
import { formidable } from 'formidable'
import OpenAI from 'openai'
import { PDFParse } from 'pdf-parse'

export const config = {
  api: {
    bodyParser: false,
  },
}

const MAX_DOC_CHARS_FOR_LLM = 14_000

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

function getUploadedPdf(files) {
  const uploaded = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf
  if (!uploaded) {
    throw new Error('PDF file is required')
  }
  return uploaded
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
    const pdf = getUploadedPdf(files)
    const buffer = await readFile(pdf.filepath)
    const parser = new PDFParse({ data: buffer })
    const parsed = await parser.getText()
    await parser.destroy()
    const documentText = parsed.text?.trim()

    if (!documentText) {
      throw new Error('Could not extract text from PDF')
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

"conversation_flow_structure": A single string with exactly these 5 steps:
Step 1: Immediately introduce yourself and ask them to explain the core
technical approach in one sentence. Do not wait — start speaking first.
Step 2: Interrupt mid-sentence when they make their first unverified claim.
Say 'Hold on —' and challenge it with a specific question referencing the document.
Step 3: If they use filler words more than once, immediately say
'Stop. You said [filler word]. Confident presenters do not use filler words.
Try that answer again.'
Step 4: After 20 seconds of speaking without a clear point, interrupt with
'I am going to stop you there. What is your actual point?'
Step 5: Close by asking 'What is the single biggest risk that could make
this entire project fail?' Do not accept a vague answer.

"starting_script": 3 sentences maximum.
Sentence 1: Say you have reviewed the full proposal and name the project explicitly.
Sentence 2: Reference one specific technical component AND one specific number or budget figure found in the document — show you actually read it.
Sentence 3: End with a direct sharp question about the most technically ambitious or risky component in the document.
Do NOT say Hello. Do NOT use pleasantries. Start with 'I have reviewed...'

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
