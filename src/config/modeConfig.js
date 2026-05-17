import { PITCH_ACCEPT } from './allowedAccept.js';

const MULTI_FILE_ERROR = 'Please upload a PDF, DOCX, or PPTX file.';
const PITCH_DROPZONE = 'PDF, DOCX, or PPTX';

export const MODE_CONFIG = {
  startup: {
    id: 'startup',
    title: 'Startup Pitch',
    briefingTitle: 'Brief the investors',
    briefingDescription:
      'Upload your pitch deck as a PDF, Word document, or PowerPoint. The panel will interrogate your traction, revenue model, and architecture.',
    uploadHint: 'Upload your pitch deck',
    dropzoneSubtext: PITCH_DROPZONE,
    fileError: MULTI_FILE_ERROR,
    submitLabel: 'Deploy Panel',
    arenaSubtitle: 'VC Pitch Defense',
    accept: PITCH_ACCEPT,
    panelists: [
      {
        id: 'core',
        label: 'Primary panelist',
        beyChatUrl: 'https://bey.chat/14aa8a81-1dce-4ed7-b4d2-e3daf164edc9',
      },
      {
        id: 'ops',
        label: 'Assistant',
        beyChatUrl: 'https://bey.chat/9f389e69-9392-4757-8511-a618c95c990a',
      },
    ],
  },
  academic: {
    id: 'academic',
    title: 'Academic Viva',
    briefingTitle: 'Prepare for your viva',
    briefingDescription:
      'Upload your thesis or research paper as a PDF, Word document, or PowerPoint. Examiners will challenge methodology, claims, and conclusions.',
    uploadHint: 'Upload your thesis document',
    dropzoneSubtext: PITCH_DROPZONE,
    fileError: MULTI_FILE_ERROR,
    submitLabel: 'Initialize Panel',
    arenaSubtitle: 'Academic Viva',
    accept: PITCH_ACCEPT,
    panelists: [
      {
        id: 'examiner',
        label: 'Examiner',
        beyChatUrl: 'https://bey.chat/14aa8a81-1dce-4ed7-b4d2-e3daf164edc9',
      },
      {
        id: 'chair',
        label: 'Committee Chair',
        beyChatUrl: 'https://bey.chat/9f389e69-9392-4757-8511-a618c95c990a',
      },
    ],
  },
  interview: {
    id: 'interview',
    title: 'Technical Interview',
    briefingTitle: 'Brief the hiring panel',
    briefingDescription:
      'Upload your CV as a PDF, Word document, or PowerPoint. The panel will probe resume claims and run spontaneous technical challenges.',
    uploadHint: 'Upload your CV or portfolio document',
    dropzoneSubtext: PITCH_DROPZONE,
    fileError: MULTI_FILE_ERROR,
    submitLabel: 'Start Interview',
    arenaSubtitle: 'Technical Interview',
    accept: PITCH_ACCEPT,
    panelists: [
      {
        id: 'hm',
        label: 'Hiring Manager',
        beyChatUrl: 'https://bey.chat/14aa8a81-1dce-4ed7-b4d2-e3daf164edc9',
      },
      {
        id: 'tech',
        label: 'Technical Lead',
        beyChatUrl: 'https://bey.chat/9f389e69-9392-4757-8511-a618c95c990a',
      },
    ],
  },
};

export function getModeConfig(modeId) {
  if (!modeId) return MODE_CONFIG.startup;
  return MODE_CONFIG[modeId] ?? MODE_CONFIG.startup;
}
