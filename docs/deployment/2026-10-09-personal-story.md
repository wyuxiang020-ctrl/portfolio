# Personal story and contact update · 2026-10-09.4

## Changes

- Removed public availability and expected graduation copy from home, About, contact, AI overview, web resume and current resume PDF. Historical original PDF remains explicitly labelled as the original.
- Added an uppercase ARCHITECTURE & PRODUCT marquee at the lower edge of the portrait, with an explicit pause button and reduced-motion fallback.
- Replaced the horizontal text color wipe with measured, clipped lines sliding upward. Measurement runs again on font readiness and width changes. Without JS or with reduced motion, text remains readable.
- About now tells a personal story through five years at Sichuan Fine Arts Institute, Chongqing/Manchester, visual judgement, collaboration, product practice and badminton. Uses the existing travel portrait and the real Hard Hat Café team discussion photo. Travel photo is not mislabelled as Manchester.
- The About globe changes accent color every five seconds while visible; supports manual change, pause and reduced motion.
- Internship dates and all three project descriptions follow the user's supplied text. The current web and two-page PDF resumes use the same central data.
- Two confirmed exhibition works are linked image cards. Unverified award-to-project associations were not invented.
- Footer invitation: “有个想法？写信给我。” Contact page has a numbered form and circular “投递” action.

## Contact behavior

There is no server-side email delivery. A valid submission opens a mailto draft addressed to the published email; the visitor confirms sending in their own email client. The page explicitly explains this, never claims delivery, retains inputs and offers a copy fallback. Required fields and email format use browser validation. Draft encoding is tested with Chinese, newlines and URL delimiter characters. No test email was sent.

## References

- https://dennissnellenberg.com/about — portrait/story composition, masked line motion, round interaction and numbered contact form.
- https://brittanychiang.com/ — personal interests alongside professional craft in About.
- https://paco.me/ — a short, direct invitation to get in touch, rather than a generic product slogan.

## Validation

- Astro build: 26 static pages.
- Local link check: 1,613 references, zero failures.
- Architecture asset integrity: 830 original assets preserved.
- Desktop and 390px mobile browser checks: home, About and contact; no horizontal overflow or broken images.
- Browser checks: color switch, internal page transition, required fields and invalid email validation.
- Contact draft test: `node scripts/test-contact-draft.mjs` passed; no network transmission.
- Current resume PDF rendered and visually reviewed on both pages, including updated internship descriptions.

Production release is identified by `/release.json`, version `2026-10-09.4`.
