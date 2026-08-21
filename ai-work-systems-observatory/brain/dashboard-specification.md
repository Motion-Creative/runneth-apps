# Executive report specification

## Page shape

The Observatory is a browser-openable executive report. It is not a dashboard shell and has no navigation rail. Use a headerless `wa-page` containing `report-page`, a masthead, one KPI strip, seven report sections, and a floating theme toggle.

## Narrative order

1. Executive thesis and Monday change.
2. Role and responsibility map with current rhythms and handoffs.
3. Qualified current systems as end-to-end loops.
4. Proposed future systems as separately labeled recommendations.
5. Stop, continue, start and the future weekly cadence.
6. Opportunity portfolio and phased roadmap.
7. Collapsible evidence, source coverage, governance, limitations, and unknowns.

## Runtime data

The browser controller fetches `/data/observatory.json` with `cache: no-store`. Do not import the data into the build. Do not load browser TypeScript with `?url`. The Astro page contains only loading and error states; the controller creates report elements after valid data arrives so empty charts, tables, and KPI strips never connect.

## Visual contract

- Use Motion's Web Awesome report elements and layout primitives.
- KPI strips and tables support the narrative but never lead it.
- Current loops and proposed loops must have distinct labels and tones.
- Use Runneth cream, warm brown, lime, and butter tokens; Inter; 10px corners; flat surfaces; no shadows or gradients.
- Surface refreshed time, source scope, evidence confidence, last-confirmed dates, limitations, and adoption definition.
- Keep the app private by default.

## Empty and partial states

Show a plain-language callout when data is illustrative, incomplete, or unavailable. Never infer a current system from a package, app, or incomplete workflow. If no system qualifies, say so and render the evidence gaps and proposed model without inventing a portfolio.
