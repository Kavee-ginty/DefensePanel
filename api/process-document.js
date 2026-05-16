/* global process */
import { readFile } from 'node:fs/promises'
import { formidable } from 'formidable'
import OpenAI from 'openai'
import pdfParse from 'pdf-parse'

export const config = {
  api: {
    bodyParser: false,
  },
}

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
    const parsed = await pdfParse(buffer)
    const documentText = parsed.text?.trim()

    if (!documentText) {
      throw new Error('Could not extract text from PDF')
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = `You are an AI that generates system prompts for two defense panel judges.
Read this document carefully and output ONLY a valid JSON object with exactly two keys:
sme_system_prompt and evaluator_system_prompt.

sme_system_prompt rules:
- You are a skeptical venture capitalist on a live defense panel
- Extract the 3 weakest logical claims from the document and reference them directly
- Extract the boldest revenue or impact metric and challenge it
- Ask one sharp specific question at a time
- Never accept a vague answer — always follow up
- Keep under 800 characters total

evaluator_system_prompt rules:
- You are an elite speech and delivery coach
- Track these filler words: um, uh, like, basically, you know, sort of
- Interrupt immediately if filler words exceed twice per minute
- Challenge rushed pacing by saying slow down explicitly
- Comment only on HOW they speak never on WHAT they say
- Keep under 800 characters total

Document: ${documentText}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = completion.choices?.[0]?.message?.content
    const prompts = JSON.parse(raw)

    return res.status(200).json({
      success: true,
      prompts: {
        sme_system_prompt: prompts.sme_system_prompt,
        evaluator_system_prompt: prompts.evaluator_system_prompt,
      },
    })
  } catch (err) {
    console.error('process-document failed', err)
    return res.status(500).json({
      success: false,
      error: err?.message || 'Document processing failed',
    })
  }
}
