import JSZip from 'jszip';
import mammoth from 'mammoth';
import pdfToText from 'react-pdftotext';
import { ALLOWED_ACCEPT } from '../config/allowedAccept.js';

export { ALLOWED_ACCEPT };

const DRAWINGML_NS =
  'http://schemas.openxmlformats.org/drawingml/2006/main';

const MIME_BY_KIND = {
  pdf: ['application/pdf'],
  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  pptx: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
};

function extensionOf(file) {
  const name = file?.name ?? '';
  const dot = name.lastIndexOf('.');
  if (dot < 0) return '';
  return name.slice(dot + 1).toLowerCase();
}

export function getDocumentKind(file) {
  if (!file) return null;

  const ext = extensionOf(file);
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'pptx') return 'pptx';

  const type = (file.type ?? '').toLowerCase();
  for (const [kind, mimes] of Object.entries(MIME_BY_KIND)) {
    if (mimes.includes(type)) return kind;
  }

  return null;
}

async function extractPdfText(file) {
  const text = await pdfToText(file);
  return typeof text === 'string' ? text.trim() : String(text ?? '').trim();
}

async function extractDocxText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return (value ?? '').trim();
}

function textFromSlideXml(xml) {
  const dom = new DOMParser().parseFromString(xml, 'application/xml');
  const nodes = dom.getElementsByTagNameNS(DRAWINGML_NS, 't');
  const parts = [];
  for (let i = 0; i < nodes.length; i += 1) {
    const chunk = nodes[i].textContent;
    if (chunk) parts.push(chunk);
  }
  return parts.join(' ').trim();
}

async function extractPptxText(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slidePaths = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path))
    .sort((a, b) => {
      const num = (path) => Number(path.match(/slide(\d+)\.xml/i)?.[1] ?? 0);
      return num(a) - num(b);
    });

  if (slidePaths.length === 0) {
    throw new Error('No slides found in this presentation.');
  }

  const slides = await Promise.all(
    slidePaths.map(async (path) => {
      const xml = await zip.file(path).async('text');
      return textFromSlideXml(xml);
    }),
  );

  return slides.filter(Boolean).join('\n\n').trim();
}

export async function extractDocumentText(file) {
  const kind = getDocumentKind(file);
  if (!kind) {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or PPTX file.');
  }

  try {
    if (kind === 'pdf') {
      const text = await extractPdfText(file);
      if (!text) throw new Error('No text could be read from this PDF.');
      return text;
    }
    if (kind === 'docx') {
      const text = await extractDocxText(file);
      if (!text) throw new Error('No text could be read from this document.');
      return text;
    }
    const text = await extractPptxText(file);
    if (!text) throw new Error('No text could be read from this presentation.');
    return text;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('No ')) throw err;
    if (err instanceof Error && err.message.startsWith('Unsupported')) throw err;
    const label =
      kind === 'pdf' ? 'PDF' : kind === 'docx' ? 'Word document' : 'presentation';
    throw new Error(`Could not read text from this ${label}.`);
  }
}
