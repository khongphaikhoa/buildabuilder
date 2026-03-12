# UX Portfolio Questionnaire

A webapp that helps new UX professionals create polished portfolio case studies through a guided questionnaire. Uses AI to synthesize answers and uploaded process notes/photos into structured case study content.

## Features

- **Guided questionnaire** – Step-by-step flow covering Project Overview, Problem & Goals, Process, Solution, Impact & Learnings, Role & Collaboration
- **File uploads** – Process notes (txt, md) and photos (jpg, png, webp) per section
- **AI synthesis** – OpenAI GPT-4o-mini generates case studies from your input (streaming)
- **Multiple projects** – localStorage-based project list (create, open, delete)
- **Showcase** – Select projects, publish to get a shareable link, or export as HTML

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add your keys:
   ```bash
   cp .env.example .env.local
   ```
   - `OPENAI_API_KEY` – Required for AI synthesis
   - `BLOB_READ_WRITE_TOKEN` – Required for showcase publishing (from Vercel Blob)

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- OpenAI API (GPT-4o-mini)
- Vercel Blob (showcase storage)
- Zod (validation)
