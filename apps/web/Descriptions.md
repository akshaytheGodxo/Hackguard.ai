Build a modern, high-conversion landing page for "HackGuard AI", a secure AI-powered
hackathon hosting and automated evaluation platform.

## PRODUCT CONTEXT
HackGuard AI is an end-to-end platform for universities, companies, and developer
communities to run hackathons at scale. It handles registration, team formation,
secure submissions, and automated evaluation. It runs submitted code in isolated
sandboxes, analyzes repositories, pitch decks, and demo videos with AI, checks
for plagiarism and suspicious commit history, and publishes live leaderboards.
Final decisions stay with humans (AI flags and scores, organizers and judges decide).

## TARGET AUDIENCE
1. Hackathon organizers (universities, tech companies, communities)
2. Judges and sponsors
3. Participants (secondary)

## DESIGN DIRECTION
- Dark-first theme with a light mode toggle
- Cybersecurity x developer-tool aesthetic: deep navy/near-black background,
  one accent gradient (electric indigo to cyan), subtle grid or glow backgrounds
- Typography: Inter for UI, JetBrains Mono for code and terminal elements
- Rounded cards, thin borders, soft glows, generous whitespace
- Fully responsive (mobile-first), WCAG AA contrast, visible focus states,
  respect prefers-reduced-motion
- Use CSS variables / Tailwind tokens for colors so the theme is easy to change

## PAGE SECTIONS (in order)

1. **Navbar** (sticky, blurred background)
   Logo + wordmark, links: Features, How it Works, Integrity, Pricing, FAQ.
   Right side: theme toggle, "Sign in" (ghost), "Host a Hackathon" (primary).
   Collapses to a hamburger sheet on mobile.

2. **Hero**
   - Small badge: "AI-powered judging, human-approved decisions"
   - H1: "Host hackathons you can trust. Judge them in minutes."
   - Subheading: one or two sentences about automated scoring, sandboxed code
     execution, and plagiarism detection.
   - CTAs: "Host a Hackathon" (primary), "View Live Demo" (secondary)
   - Visual: a mock dashboard card showing a leaderboard with animated rank
     changes, a radar chart of rubric scores, and a "Sandbox build: passed" pill.
     Build it with plain components and fake data, no images.
   - Trust line below: "Built for universities, startups, and developer communities"
     with placeholder logo slots.

3. **Problem section** ("Hackathons don't scale. Evaluation breaks first.")
   Three cards:
   - Judge overload and inconsistent scoring
   - Plagiarized or pre-built submissions
   - Fragmented tooling across registration, submission, and scoring

4. **Features grid** (6 cards with icons)
   - Multi-modal AI scoring (code, pitch deck, demo video)
   - Isolated execution sandboxes (build, test, performance metrics)
   - Plagiarism and commit-history audit
   - Custom weighted rubrics (Technical Complexity, Design, Impact, Originality)
   - Live leaderboards
   - Full lifecycle portal (registration, team matching, mentor check-ins, prizes)

5. **How it works** (4-step horizontal timeline, vertical on mobile)
   1. Create event and define rubric
   2. Participants register, team up, and submit
   3. Automated pipeline analyzes every submission
   4. Review flags, finalize, publish leaderboard

6. **Evaluation pipeline showcase**
   An interactive tabbed component (Code, Sandbox, Integrity, Pitch Deck, Video).
   Each tab shows a small mock panel. Examples: a terminal-style build
The landing.tsx file has already been created