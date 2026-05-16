# Backend Schema Document: The Defense Panel

---

# 1. Global Architecture Overview

## Database Type

Relational SQL database:

- PostgreSQL via Supabase

---

## API Schema Structure

Communication style:

- RESTful JSON APIs
- React frontend ↔ Vercel serverless backend

---

## Authentication Method

### MVP Mode

Hardcoded bypass:

```txt
user_id = "demo-user-1"
```

---

### Production Mode

- Supabase Auth
  - Email/Password
  - Google OAuth
- JWT-based authentication

---

## Token & Session Storage

### WebRTC Stream Token

- Stored in React state only
- Exists only during active session

---

### Auth JWTs (Production)

- Stored in `httpOnly` secure cookies
- Prevents XSS access

---

## Role / Permission System

### MVP

- Single-tier access only

---

### Production

Roles:

- `student` → Standard user
- `admin` → Can modify AI prompts and system behavior

---

# 2. Data Management Rules

---

## Data Normalization Strategy

### Hackathon MVP

Intentionally denormalized:
- Store document summaries directly in session table
- Avoid JOIN queries
- Optimize for speed during demo

---

### Production

Migrates to:

```txt
3rd Normal Form (3NF)
```

---

## Validation Rules

Backend enforces:

- `duration_seconds > 0`
- `overall_score ∈ [0, 100]`

---

## File Storage Structure

### Supabase Storage Bucket

```txt
defense-documents
```

---

### File Path Format

```txt
/documents/{user_id}/{uuid}-{filename}.pdf
```

---

## Soft Delete / Hard Delete Rules

### Soft Delete Approach

- Field: `is_active`
- Default: `true`

### Deletion Behavior

- Instead of deleting rows:
  - Set `is_active = false`

Purpose:
- Preserve analytics integrity

---

## Backup / Recovery

Uses Supabase built-in features:

- Point-in-Time Recovery (PITR)
- Daily automated backups

---

## Data Retention Policies

### Retained Indefinitely

- Transcripts
- Scores
- Session metadata

---

### Temporary Storage

PDF documents:
- Deleted after **30 days**

Reason:
- Reduce storage costs

---

# 3. Entity Relationships (ERD Text Map)

---

## One-to-Many Relationships

### User → Pitch Sessions

- One user can have many sessions

---

### User → Documents

- One user can upload many documents

---

## One-to-One Relationships

### Pitch Session → Document

- Each session uses exactly one document context

---

# 4. Table Definitions

---

# Table 1: `pitch_sessions` (Core MVP Table)

## Purpose

Stores full lifecycle of a simulation run:

- Metadata
- Transcript analysis
- AI scoring output

This is the **only required table for hackathon MVP**.

---

## Schema

| Field Name | Data Type | Required? | Key Type | Description |
|------------|-----------|-----------|----------|-------------|
| id | uuid | Required | PK | Unique session ID |
| created_at | timestampz | Required | - | Creation timestamp |
| user_id | text | Required | FK | Hardcoded MVP user |
| scenario_type | text | Required | - | e.g., Startup Pitch |
| document_summary | text | Optional | - | GPT-4o extracted context |
| duration_seconds | integer | Required | - | Session length |
| filler_word_count | integer | Required | - | "um", "ah", etc. |
| critical_feedback | text | Required | - | AI evaluation |
| overall_score | integer | Required | - | Score (0–100) |
| is_active | boolean | Required | - | Soft delete flag |

---

## Indexing Strategy

- B-Tree index on:
  - `user_id`
  - `created_at DESC`

Purpose:
- Fast dashboard rendering
- Efficient session history retrieval

---

## Example Data Object

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "created_at": "2026-05-16T14:30:00Z",
  "user_id": "demo-user-1",
  "scenario_type": "Startup Pitch",
  "document_summary": "SaaS platform claiming $10k MRR. Tech stack: React, Vercel.",
  "duration_seconds": 245,
  "filler_word_count": 8,
  "critical_feedback": "Strong opening, but you faltered when defending serverless costs.",
  "overall_score": 82,
  "is_active": true
}
```

---

# Table 2: `users` (Production SaaS Only)

## Purpose

Central identity system for:

- Authentication
- Profile management
- Subscription tracking

---

## Schema

| Field Name | Data Type | Required? | Key Type | Description |
|------------|-----------|-----------|----------|-------------|
| id | uuid | Required | PK | Links to Supabase Auth |
| created_at | timestampz | Required | - | Account creation date |
| email | text | Required | - | Unique email |
| full_name | text | Optional | - | Display name |
| subscription_tier | text | Required | - | Free / Pro / Enterprise |

---

## Example Data Object

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "created_at": "2026-05-10T09:00:00Z",
  "email": "presenter@example.com",
  "full_name": "Alex Founder",
  "subscription_tier": "Pro"
}
```

---

# Table 3: `documents` (Production SaaS Only)

## Purpose

Stores uploaded PDFs permanently so users can reuse them across sessions.

---

## Schema

| Field Name | Data Type | Required? | Key Type | Description |
|------------|-----------|-----------|----------|-------------|
| id | uuid | Required | PK | Document ID |
| user_id | uuid | Required | FK | Owner |
| uploaded_at | timestampz | Required | - | Upload timestamp |
| filename | text | Required | - | Original file name |
| storage_url | text | Required | - | Supabase file URL |
| extracted_text | text | Required | - | Parsed PDF content |

---

## Example Data Object

```json
{
  "id": "d9876543-210a-bcde-f012-3456789abcde",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "uploaded_at": "2026-05-15T11:20:00Z",
  "filename": "Q3_Architecture_Review.pdf",
  "storage_url": "https://project.supabase.co/storage/v1/object/public/documents/file.pdf",
  "extracted_text": "The proposed architecture utilizes WebRTC..."
}
```

---

# 5. Integration Strategy for the Hackathon

---

## Core Principle

Speed > perfection.

---

## Key Hackathon Optimizations

### 1. Single Table Usage

Only:

```txt
pitch_sessions
```

is required for full MVP.

---

### 2. Hardcoded User

Bypass entire auth system:

```txt
user_id = "demo-user-1"
```

---

### 3. In-Memory PDF Handling

- No document persistence required
- PDF processed and discarded after session

---

## Final Architecture Outcome

During the 10-hour sprint:

### Backend Responsibility

- `/api/end-session` only:
  - Receives transcript
  - Calls OpenAI
  - Inserts into `pitch_sessions`

---

### Bypassed Systems

- users table
- documents table
- authentication system
- long-term storage flow

---

## Result

A simplified but powerful system that still produces:

- Real-time AI feedback
- Session scoring
- Analytics dashboard
- Judge-ready demo experience
```