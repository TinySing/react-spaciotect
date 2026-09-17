# React SPACIOTECT

This directory contains the React recreation of the SPACIOTECT HTML mockups.

## Start

```bash
nvm use
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Routes

- `/` Home
- `/projects` Projects
- `/site-analysis` Site Analysis
- `/site-analysis-report` Site Analysis Report
- `/options` Massing Options
- `/energy` Energy
- `/reports` Reports
- `/studio/bubble` Bubble Diagram
- `/studio/massing` Site Massing
- `/studio/rooms` Room Stacking
- `/studio/rendering` Rendering

The original HTML files remain in the parent directory as visual and interaction references. React source is under `src/`; route definitions are in `src/App.jsx`, page modules are grouped under `src/pages/content/` and `src/pages/studio/`, shared page components are under `src/pages/shared/`, shared UI is grouped under `src/components/`, and shared data is in `src/data.js`. The top-level `src/pages.jsx`, `src/pages/content.jsx`, `src/pages/studio.jsx`, and `src/components.jsx` files remain compatibility barrels.

## Interaction coverage

- Home: animated relationship lines and nodes, prompt chips, submit feedback, quick action routing, and previous session routing.
- GIS site analysis: local GIS-style layer toggles for OZP, height, green belt, transport, and projects; searchable markers; selected site state; zoom, reset, and pan controls; source tabs; legend state; analysis state; and report export routing.
- BIM studio: site relationship graph selection and tools, schedule of accommodation editing with local persistence, massing option switching, shared site-context pills, model layer visibility, camera views, drag orbit, scroll zoom, shadows, storey control, BIM source file inspection, room graph/stack switching, floor selection, Fast mode/DeepThink state, room inspector tabs, and rendering viewpoint/light/material controls.
- Reports and energy: report centre navigation, 11-page site report outline, editable report title, page navigation, zoom, editor tools, note/lock/module controls, export format menu, A4/16:9 view, scenario switching, expandable analysis, clickable end-use bars, and report routing.

GIS, BIM, rendering, and report exports use the embedded mockup data and visual primitives. They are ready for the React interaction flow; connecting live map tiles, IFC/Three.js model files, APIs, or file generation remains an integration step.
