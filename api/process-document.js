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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = `You are an AI that configures a single Beyond Presence conversational video agent from a user's document.

Read the document carefully. Output ONLY a valid JSON object with exactly these keys (all strings):
- role_objectives — "Role & objectives": who the agent is, goals, tone, constraints (bullet-style inside the string is fine).
- conversation_flow_structure — "Conversational flow & structure": phases, how to open, probe, clarify, close; one sharp question at a time when challenging.
- starting_script — "Agent's Starting Script": the exact first things the agent should say when the call begins (can be 2-4 short sentences).
- system_prompt — ONE combined system prompt for the LLM that MUST embed the role_objectives and conversation_flow_structure and MUST include key facts, names, numbers, and claims from the document so the agent can challenge vague answers using the document. Max length 9800 characters.
- greeting — A short opening line (what the agent says first when the session starts); should match starting_script intent; max 900 characters.
- document_summary — 2-4 sentences summarizing the document for logging.

Rules:
- system_prompt must stay under 9800 characters. greeting under 900 characters.
- If the document is a pitch or defense, the agent should be skeptical but professional.
- Do not output markdown fences or any text outside the JSON object.

Document:
${truncated}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = completion.choices?.[0]?.message?.content
    const parsedJson = JSON.parse(raw)

    const prompts = {
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
    ]) {
      if (!prompts[key] || typeof prompts[key] !== 'string') {
        throw new Error(`Missing or invalid field in model output: ${key}`)
      }
    }

    return res.status(200).json({
      success: true,
      prompts,
    })
  } catch (err) {
    console.error('process-document failed', err)
    return res.status(500).json({
      success: false,
      error: err?.message || 'Document processing failed',
    })
  }
}
