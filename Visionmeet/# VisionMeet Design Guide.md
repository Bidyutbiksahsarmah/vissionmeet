# VisionMeet Design Guide

## Principles
- Look like a serious productivity tool, not an "AI product".
- Plain, calm, professional. Flat surfaces, thin borders, generous whitespace.
- No emoji anywhere: UI text, buttons, docs, commit messages, code comments.
- Every extracted item shows its source: timestamp, quote, audio clip.
- Low-confidence items show a "Needs review" badge.
- Recording state must be impossible to miss.
- Emotion/engagement data is shown as trends with an "Experimental" label.
- Light and dark mode from day one.

## Things to avoid
- Purple, violet, indigo, magenta, or blue-to-purple gradients
- Any gradients, glow effects, glassmorphism, or animated backgrounds
- Sparkle, magic wand, or robot icons; chat-bubble AI avatars
- Labels like "AI-powered", "Magic", "Smart" on buttons or headings
- Default unstyled shadcn look: customize radius, colors, and spacing
- Stock hero illustrations and generic 3D shapes

## Tools and libraries
- Figma for mockups, Tailwind CSS for styling, shadcn/ui as a base (customized)
- Lucide icons (use plain icons: clock, check, user, flag, play)
- Recharts for charts, Framer Motion only for simple fades
- Shared tokens in one package so extension and web app match

## Typography
- UI: a neutral sans such as Inter or IBM Plex Sans
- Timestamps and code: IBM Plex Mono or JetBrains Mono
- Sentence case for all headings and buttons

## Colors
- Primary: deep navy/steel blue  (#1F3A5F)
- Primary hover: #2B4C7A
- Accent: muted teal  (#0F766E), used sparingly for links and focus rings
- Background light: #FFFFFF, surface: #F5F6F8, border: #E2E5EA
- Background dark: #0F1419, surface: #171D25, border: #2A323D
- Text light mode: #111827 / secondary #5B6472
- Text dark mode: #E8EBEF / secondary #9AA4B2

## Task status (always color + label + icon)
- Extracted: gray
- Confirmed: blue
- Accepted: teal
- In progress: amber
- Blocked: red
- In review: slate blue
- Done: green

## Emotion/engagement colors
- Single-hue sequential scale (light blue to dark blue).
- Never red/green "good vs bad" judgments.

## Layout and shape
- Corner radius: 6px (not overly round)
- Borders over shadows; one subtle shadow level at most
- 8px spacing grid
- Dense, readable tables for task lists

## Extension popup (~360px wide)
1. Signed out: sign-in button
2. Ready: consent checkbox + "Start notes" button
3. Recording: timer, red recording indicator, Stop button
4. Done: link to open the meeting in the web app

## Web app screens
1. Meetings list
2. Meeting detail: summary, decisions, transcript
3. Task review: assigner, assignee, deadline, evidence quote, audio play, Confirm/Edit
4. Assigned by me: grouped by person, overdue/blocked/stale badges
5. Assigned to me: status dropdown, blocker button, comments
6. Insights: engagement timeline (opt-in)
7. Settings: members, integrations, consent, retention

## Writing style for UI text
- Short, direct, human. Example: "3 tasks need review", not "AI found 3 tasks for you".
- Describe the source, not the technology: "From 00:12:40" instead of "AI detected".
- No exclamation marks, no emoji.

## Accessibility
- WCAG AA contrast, keyboard navigation, visible focus states
- Never rely on color alone
- Responsive layout (phones included)

## Assets to prepare
- Logo (light/dark): simple wordmark "VisionMeet" with a minimal eye or lens mark in navy
- Extension icons: 16, 48, 128 px
- Chrome Web Store screenshots (1280x800) and promo tile