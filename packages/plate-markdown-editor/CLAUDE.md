# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository exports a **Plate.js markdown editor** as a reusable React package. The editor is built on top of the [plate-playground-template](./plate-playground-template/) Next.js application.

### Architecture

```
plate-markdown-editor/
├── index.ts              # Main export (re-exports markdown-editor)
├── markdown-editor.tsx   # MarkdownEditor component (client-side Plate editor wrapper)
└── plate-playground-template/  # Submodule: full Next.js app with editor configuration
    └── src/components/editor/
        └── editor-kit.tsx  # Plugin configuration for Plate editor
```

### Key Components

- **`MarkdownEditor`** (`markdown-editor.tsx:15`): A client-side React component that wraps the Plate editor with the full plugin suite from `EditorKit`. Accepts `value` and `onChange` props for controlled usage.

- **`EditorKit`** (`plate-playground-template/src/components/editor/editor-kit.tsx:41`): Array of 40+ Plate plugins providing:
  - AI features (CopilotKit, AIKit)
  - Rich text elements (tables, code blocks, media, math)
  - Marks (bold, italic, font styling)
  - Collaboration (comments, discussions, suggestions)
  - UX (slash commands, DnD, emoji picker, toolbars)
  - Parsers (Markdown, DOCX)

## Commands

### Development (in plate-playground-template/)

```bash
bun install          # Install dependencies
bun run dev          # Start Next.js dev server
bun run build        # Production build
bun run typecheck    # TypeScript check
bun run lint:fix     # Auto-fix lint issues
```

**Required verification sequence:**
1. `bun install`
2. `bun run build`
3. `bun run typecheck`
4. `bun run lint:fix`

## Development Guidelines

- **Editor plugin architecture**: Plugins are composable arrays exported from `plugins/*.tsx` files. Add new plugins by importing and spreading into `EditorKit`.
- **Client components**: All editor code uses `'use client'` due to Plate's reliance on React hooks and browser APIs.
- **Path aliases**: `@/*` maps to `src/*` in the playground template.

## External Resources

- [Plate.js Documentation](https://platejs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Next.js](https://nextjs.org/docs)
