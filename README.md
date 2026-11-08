# Dissertation Matrix & Academic Literature Synthesis

A high-performance research matrix application engineered for doctoral candidates and academic scholars. It facilitates literature review organization, peer-reviewed source validation (OpenAlex / CrossRef), automated APA 7th edition compliance checks, citation generation, and annotated bibliography compilation.

## Features

- **Literature Matrix Dashboard**: Cross-synthesize literature themes against empirical sources with rich extraction cards, methodological notes, critique points, and excerpt citations.
- **Academic Source Integration**: Query and validate articles against OpenAlex and CrossRef APIs with automated peer-review and DOI verification.
- **APA 7th Compliance Engine**: Rule-based detection and one-click auto-fixes for APA 7th guidelines:
  - Title sentence casing (proper nouns preserved)
  - Author name inversion (`LastName, F. M.`) & ampersand rules
  - Canonical DOI formatting (`https://doi.org/...`)
  - Journal & volume italicization rules
  - Retraction & preprint cautionary badges
- **Citation Generator & Annotated Bibliography**: Export in APA 7th format, BibTeX, Markdown, and CSV, with full annotated bibliography compile capabilities.
- **Supabase & Local-First Storage**: Real-time cloud persistence with Supabase, paired with robust offline local storage fallbacks.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend / Proxy**: Express, Node.js (`server.ts`)
- **APIs**: OpenAlex API, CrossRef API
- **Database / Auth**: Supabase (`@supabase/supabase-js`) with offline LocalStorage fallback
- **Build**: Vite & tsx

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm or bun

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional):
   ```bash
   cp .env.example .env
   ```
   Add your optional Supabase project URL and anon key if using cloud sync:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open your browser to [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev`: Starts the Express server and Vite development server on port 3000.
- `npm run build`: Bundles the Vite frontend and compiles the backend server for production.
- `npm run start`: Runs the built production server.
- `npm run lint`: Checks TypeScript compilation with `tsc --noEmit`.

## License

MIT License. Crafted for academic researchers and doctoral dissertations.
