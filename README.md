# IndiaAI 

IndiaAI Intelligence is a polished document intelligence workspace built with React, TypeScript, and Tailwind CSS. Upload PDFs, Word documents, or scans, watch a simulated AI pipeline extract structured fields and tables, and interact with adaptive summaries, multilingual explanations, and export options—all within a single responsive UI that showcases what a next-generation document assistant could feel like.

## What the app does

- **Smart ingestion**: Drag-and-drop or browse for PDF/DOC/DOCX/PNG/JPG inputs and see a visual upload tracker that mimics real-time progress, processing, and completion states.
- **Document preview**: Once a file is ready, the app renders a framed preview panel where highlighted regions can be synchronized with extraction fields, summaries, and citations for a contextual feel.
- **Extracted data & tables**: A tabbed right rail lets you explore simulated field extraction, detect and scroll through tables, and dive into AI-synthesized key-value pairs without leaving the page.
- **AI summaries with sourcing**: Flip to the summary tab to read generated insights and click citations to refocus the preview on the underlying region.
- **Multilanguage support**: Switch between languages for translated snippets so you can validate that the same intelligence can span Hindi, English, and over 50 additional locales.
- **Flexible exports**: Download processed data in formats such as JSON, CSV, or Word so you can hand off structured outputs to downstream workflows.

## Architecture & tooling

- **Framework**: Vite + React (via `@vitejs/plugin-react-swc`) for fast refresh, modern bundling, and lean builds.
- **TypeScript** ensures every component and hook has precise typings (`UploadedDocument`, tab states, callbacks, etc.).
- **UI stack**: shadcn/ui primitives, Radix UI building blocks, and `tailwindcss`/`tailwind-merge` deliver the polished layout, animations, and responsive utility classes seen in `src/components/*`.
- **State & utils**: Local `useState` drives upload/simulation state while `src/lib/utils.ts` holds helpers like `cn`. Document shapes live in `src/types/document.ts`.

## Folder highlights

| Folder                               | Purpose                                                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/Index.tsx`                | Main experience that ties the hero, upload, and tabbed content together.                                                                                      |
| `src/components/DocumentUpload.tsx`  | Handles drag-drop, progress simulation, and invokes `onDocumentUpload` after the fake processing completes.                                                   |
| `src/components/*Panel.tsx`          | `ExtractedDataPanel`, `SummaryPanel`, `TableViewer`, `MultiLanguagePanel`, and `ExportPanel` host the content for each tab and emit hover/citation callbacks. |
| `src/components/DocumentPreview.tsx` | Renders the preview frame and highlights regions triggered from the panels to look synchronized with document analysis.                                       |
| `src/hooks/use-toast.ts`             | Custom toast hook integrating `sonner` for inline notifications.                                                                                              |

## Getting started

```sh
npm install        # install dependencies
npm run dev        # start dev server with hot reload
npm run build      # produce a production-ready bundle in dist/
npm run preview    # locally serve the production build
```

## Testing & linting

- `npm run test` runs `vitest` suites defined in `src/test/`.
- `npm run lint` checks the codebase with `eslint` (configured via `eslint.config.js`).

## Deployment

Build the static assets with `npm run build` and deploy the `dist/` directory to any static host (Vercel, Netlify, GitHub Pages, etc.). Because this app is entirely frontend, you can also run `npm run preview` to sanity-check the production output before publishing.

## Notes

- The current extraction, summary, and citation data are simulated. Hook up a backend or AI service where `handleDocumentUpload` currently sets the uploaded document to push real insights.
- Tailwind styles come from `src/index.css` + `tailwind.config.ts`, with animations provided by `tailwindcss-animate`.
- Feel free to extend the mock datasets in each panel or add new export formats to mirror your production integration.
