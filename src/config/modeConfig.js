import { ALLOWED_ACCEPT } from './allowedAccept.js';

const FILE_ERROR = 'Please upload a PDF file.';
const DROPZONE_SUBTEXT = 'PDF only (v1)';

export const MODE_CONFIG = {
  startup: {
    id: 'startup',
    title: 'Startup Pitch',
    briefingTitle: 'Brief the investors',
    briefingDescription:
      'Upload your pitch deck as a PDF. The panel will interrogate your traction, revenue model, and architecture.',
    uploadHint: 'Upload your pitch deck PDF',
    dropzoneSubtext: DROPZONE_SUBTEXT,
    fileError: FILE_ERROR,
    submitLabel: 'Deploy Panel',
    arenaSubtitle: 'VC Pitch Defense',
    accept: ALLOWED_ACCEPT,
    panelists: [
      {
        id: 'core',
        label: 'Panelist 1 (Core)',
        beyChatUrl: 'https://bey.chat/14aa8a81-1dce-4ed7-b4d2-e3daf164edc9',
      },
      {
        id: 'ops',
        label: 'Panelist 2 (Ops)',
        beyChatUrl: 'https://bey.chat/9f389e69-9392-4757-8511-a618c95c990a',
      },
    ],
  },
  academic: {
    id: 'academic',
    title: 'Academic Viva',
    briefingTitle: 'Prepare for your viva',
    briefingDescription:
      'Upload your thesis or research paper as a PDF. Examiners will challenge methodology, claims, and conclusions.',
    uploadHint: 'Upload your thesis PDF',
    dropzoneSubtext: DROPZONE_SUBTEXT,
    fileError: FILE_ERROR,
    submitLabel: 'Initialize Panel',
    arenaSubtitle: 'Academic Viva',
    accept: ALLOWED_ACCEPT,
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
      'Upload your CV as a PDF. The panel will probe resume claims and run spontaneous technical challenges.',
    uploadHint: 'Upload your CV PDF',
    dropzoneSubtext: DROPZONE_SUBTEXT,
    fileError: FILE_ERROR,
    submitLabel: 'Start Interview',
    arenaSubtitle: 'Technical Interview',
    accept: ALLOWED_ACCEPT,
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
