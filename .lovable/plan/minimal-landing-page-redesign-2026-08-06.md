# Minimal landing page redesign

## Goal
Strip the public homepage down to a clean, focused welcome screen that shows only the club identity and a single entry point.

## What will change
- Replace the current split hero, feature grid, badge preview, and CTA sections with one centered, spacious hero.
- Keep the top `SparkMark` header and the existing footer.
- Main content:
  - Small label: "The Hackathon Club"
  - Large heading: "Yuga Spark"
  - Subheading: "Welcome to Yuga Spark"
  - One primary button: "Enter the club" → `/auth`
- Remove the "I'm an admin" secondary button and the feature cards.
- Keep SEO `head()` metadata unchanged.

## Visual approach
- Centered layout with generous vertical spacing.
- Large display typography for "Yuga Spark" using the existing `font-display` token.
- Muted secondary text for the welcome line.
- Single prominent primary button; no competing actions.
- Light theme preserved, no new colors added.

## File to edit
- `src/routes/index.tsx` — rewrite the page component.

## Out of scope
- No changes to auth, admin console, student dashboard, or backend.
- No new dependencies.
