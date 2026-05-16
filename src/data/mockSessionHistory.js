export const MOCK_SESSION_HISTORY = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    created_at: '2026-05-14T09:15:00Z',
    scenario_type: 'Startup Pitch',
    document_summary:
      'SaaS platform claiming $10k MRR. Stack: React, Vercel, Supabase. Targeting SMB logistics.',
    duration_seconds: 245,
    filler_word_count: 8,
    critical_feedback:
      'Strong opening, but you faltered when defending serverless costs. Name one comparable and a concrete CAC payback period.',
    overall_score: 82,
    is_active: true,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    created_at: '2026-05-12T16:42:00Z',
    scenario_type: 'Academic Viva',
    document_summary:
      'Thesis on federated learning for edge devices. Claims 12% accuracy lift over baseline.',
    duration_seconds: 312,
    filler_word_count: 14,
    critical_feedback:
      'Methodology section was solid. Committee pushed on statistical significance — prepare a clearer ablation table.',
    overall_score: 74,
    is_active: true,
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    created_at: '2026-05-10T11:20:00Z',
    scenario_type: 'Technical Interview',
    document_summary:
      'Senior full-stack CV. Highlights: 4 years React, led migration to micro-frontends.',
    duration_seconds: 198,
    filler_word_count: 6,
    critical_feedback:
      'System design answer lacked trade-off analysis. Strong on React depth; weak on caching strategy.',
    overall_score: 88,
    is_active: true,
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    created_at: '2026-05-08T14:05:00Z',
    scenario_type: 'Startup Pitch',
    document_summary: 'Marketplace for freelance clinicians. Pre-seed, 500 beta users.',
    duration_seconds: 267,
    filler_word_count: 19,
    critical_feedback:
      'Unit economics slide was vague. Panel wanted clearer take rate and churn assumptions.',
    overall_score: 68,
    is_active: true,
  },
  {
    id: 'd4e5f6a7-b8c9-0123-def0-234567890123',
    created_at: '2026-05-05T10:30:00Z',
    scenario_type: 'Academic Viva',
    document_summary: 'Qualitative study on remote team communication in healthcare.',
    duration_seconds: 290,
    filler_word_count: 11,
    critical_feedback:
      'Excellent framing of research questions. Defend sample size limitations more confidently next time.',
    overall_score: 79,
    is_active: true,
  },
  {
    id: 'e5f6a7b8-c9d0-1234-ef01-345678901234',
    created_at: '2026-05-02T18:00:00Z',
    scenario_type: 'Technical Interview',
    document_summary: 'ML engineer resume. PyTorch, MLOps, prior startup exit.',
    duration_seconds: 220,
    filler_word_count: 9,
    critical_feedback:
      'Live coding was clean. Hiring manager flagged communication — explain thought process earlier.',
    overall_score: 85,
    is_active: true,
  },
];

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
