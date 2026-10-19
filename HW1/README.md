# FurniPro – Production Enterprise Data-Grid

## Project Overview

FurniPro is a furniture management dashboard developed using React, TypeScript, and Vite.

The project focuses on building a reusable, accessible Data-Grid component with sorting, filtering, pagination, row selection, and keyboard navigation.

## Technology Stack

- React 19
- TypeScript
- Vite
- HTML5 and CSS3

## Features

- Reusable generic `DataGrid<T>` component
- Column sorting (ascending and descending)
- Product search and category filtering
- Configurable pagination (5, 10, 20 rows)
- Row selection with stable product IDs
- Arrow-key navigation
- Enter and Space keyboard interactions
- Roving tabindex and visible focus indicators
- Responsive light-themed furniture dashboard
- Semantic HTML table structure and ARIA grid support

## Installation

Open a terminal inside the HW1 directory.

```bash
npm install
npm run dev
```

Open the localhost URL displayed by Vite.

## Production Build

```bash
npm run build
npm run preview
```

## Accessibility Verification

The project targets WCAG 2.2 Level AA.

Lighthouse audit results recorded during development:

| Category | Score |
|---|---|
| Performance | 93/100 |
| Accessibility | 100/100 |
| Best Practices | 100/100 |
| SEO | 82/100 |

These scores represent a Lighthouse audit run and may vary across environments. Lighthouse scores alone do not establish full WCAG 2.2 AA compliance.

Manual verification includes keyboard navigation, focus visibility, accessible labels, sorting announcements, and row-selection behavior. Record completion of each check before final submission.

## Project Structure

```text
HW1/
├── src/
│   ├── components/
│   │   └── DataGrid.tsx
│   ├── data/
│   │   └── products.ts
│   ├── types/
│   │   ├── data-grid-contract.ts
│   │   └── product.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── style.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── task_decomposition.md
```

## Development Workflow

The project was divided into nine tasks:

1. Project Setup
2. UI Layout & Styling
3. TypeScript Contracts & Sample Data
4. Semantic Data-Grid
5. Column Sorting
6. Filtering & Pagination
7. Keyboard Navigation & Row Selection
8. Accessibility & Lighthouse Audit
9. Final Verification & Documentation

Each implementation task follows the development workflow: Code → Test → Review → Commit.

## Known Limitations

- Product information uses local sample data.
- The application does not include a backend or database.
- Accessibility compliance requires ongoing manual verification in addition to automated testing.