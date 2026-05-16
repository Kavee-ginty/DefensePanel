// v1: backend /api/process-document only handles PDF. DOCX/PPTX support
// stays in src/lib/extractDocumentText.js for future re-enable once the
// backend accepts pre-extracted text instead of a binary file.
export const ALLOWED_ACCEPT = 'application/pdf,.pdf';
