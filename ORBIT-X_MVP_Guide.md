# ORBIT-X --- Track 2 MVP Guide

## 1. Project Goal

Build a complete, working, responsive portfolio website for the haX.baby
hackathon's Track 2: **Your Own Baby (Original Character)**.

This should be more than a landing-page mockup. Visitors should be able
to explore the original character, learn its story, interact with the
page, and discover a hidden Easter egg.

> **MVP rule:** Build the smallest complete version first. Add advanced
> features only after the required experience works reliably.

## 2. Character Direction

Use the team's existing original character artwork as the starting
point: a friendly character wearing a yellow-and-black hoodie.

Create a character sheet containing all five items:

1.  **Name**
2.  **Species, appearance, and personality**
3.  **Profession or special talent**
4.  **Origin story and journey**
5.  **Memorable tagline**

Keep the character's name, story, and profession easy to customise. Make
the identity original; do not imitate an existing copyrighted character.

**Working title:** *Abhay's Little Universe* (change this if the team
chooses a different name).

## 3. MVP Features

  -----------------------------------------------------------------------
  Feature                 Priority                Expected behaviour
  ----------------------- ----------------------- -----------------------
  Character portfolio     Must-have               Complete, navigable
                                                  single-page website

  Character sheet         Must-have               All five required
                                                  fields are present

  Three project cards     Must-have               Each opens meaningful
                                                  details or a small demo

  Interactive story       Must-have               Three scenes reveal the
                                                  character's journey

  Character reaction      Must-have               Character responds to
                                                  pointer movement, with
                                                  a touch-friendly
                                                  alternative

  Mood toggle             Must-have               Day/Night or mood
                                                  control visibly changes
                                                  the experience

  Hidden Easter egg       Must-have               A secret interaction
                                                  reveals a small
                                                  animation or message

  Responsive layout       Must-have               Works on mobile,
                                                  tablet, and desktop

  Sound effects + mute    Optional next           Only if time allows;
                                                  mute control must work

  AI character chatbot    Later                   Add after the core
                                                  portfolio is complete

  Persistent              Later                   Add only if the team
  guestbook/backend                               has time and a real
                                                  need

  3D character            Later                   Optional stretch goal
  -----------------------------------------------------------------------

## 4. Page Structure

### Screen 1 --- Home / Hero

-   A clear welcome headline and character artwork.
-   Working `Meet My Character` and `Explore My Work` navigation
    actions.
-   Small decorative stars or playful details.
-   A strong visual identity using warm cream, berry, and yellow
    accents.

### Screen 2 --- About the Character

-   Show the five-point character sheet.
-   Introduce the character's personality, abilities, and origin.
-   Include the working Day/Night or mood toggle.

### Screen 3 --- My Projects

Show three project cards. Suggested fictional concepts:

1.  **Interactive Pixel Playground**
2.  **Dream World Explorer**
3.  **Little Creative Lab**

These are proposed concepts, not claims about projects already
completed. Each card must open a detail view or an interactive demo.

### Screen 4 --- The Journey

-   Tell the character's story across three short scenes.
-   Use gentle transitions as the visitor scrolls.
-   Keep scrolling usable even if animations are disabled.
-   Add a hidden star or another discoverable Easter egg near the end.

### Footer

-   Add team/project links if available.
-   Credit artwork, fonts, libraries, and other assets.
-   Avoid fake links or non-functional buttons.

## 5. Visual Design

-   Warm cream background with berry accents and playful yellow details.
-   Friendly, expressive headings and rounded buttons/cards.
-   Cute early-web nostalgia with subtle pixel-art decorations.
-   Character artwork should remain the main visual focus.
-   Use smooth, lightweight animations and delightful
    micro-interactions.
-   Avoid a generic corporate dashboard look.
-   Prioritise readability, accessibility, and fast loading.

## 6. Recommended Technology

-   **React + Vite:** page structure and interactive components.
-   **CSS:** responsive styling, transitions, and animations.
-   **Existing character artwork:** use local assets where possible.
-   **GitHub:** source control and public repository, if required by the
    rules.
-   **Vercel or another static host:** deployment.

If the repository already has a suitable stack, inspect it first and
avoid rewriting it unnecessarily.

A backend is not needed for the first version unless a required feature
genuinely depends on one.

## 7. Master Prompt for an AI Coding Assistant

Copy the prompt below into your coding assistant:

------------------------------------------------------------------------

**Project:** ORBIT-X --- Track 2 Original Character Portfolio

Build a complete, original-character portfolio website for the haX.baby
"Your Own Baby (Original Character)" hackathon track.

### Objective

Create a polished, responsive, interactive portfolio for an original
cute character. Communicate the character's identity, work, and story
through visuals and interactions rather than long blocks of text.

### Character

Use our existing original character artwork: a friendly character
wearing a yellow-and-black hoodie, with a playful personality and a
whimsical universe.

Create a character sheet with: 1. Name 2. Species, appearance, and
personality 3. Profession or special talent 4. Origin story and journey
5. Memorable tagline

Keep the character name, story, and profession easy to customise. Do not
imitate an existing copyrighted character.

### Design direction

-   Warm cream background, berry accents, and playful yellow details.
-   Cute early-web nostalgia with rounded cards and oversized buttons.
-   Editorial headings, friendly typography, and subtle pixel-art
    decorations.
-   Original character artwork as the main visual focus.
-   Smooth transitions and delightful micro-interactions.
-   Avoid a generic corporate dashboard design.
-   Keep the website fast, accessible, and mobile-first.

### Required sections

1.  Hero section with character artwork and working navigation.
2.  About section with the five-point character sheet.
3.  Three project showcase cards with functional detail views.
4.  A three-scene, scroll-driven character story.
5.  A Day/Night or mood toggle that visibly changes the experience.
6.  A hidden Easter egg with a delightful reveal.
7.  Footer with credits for artwork, libraries, and other assets.

### Functional requirements

-   Character reacts to pointer movement with a touch-friendly
    alternative.
-   All buttons and navigation links work.
-   Project cards open meaningful details or interactive demos.
-   Story sections animate without blocking scrolling.
-   Mood toggle changes the actual theme and character mood.
-   Hidden Easter egg is discoverable and works on touch screens.
-   Any sound must have a visible, working mute control.
-   Respect reduced-motion preferences.
-   No broken image paths, placeholder buttons, or console errors.
-   No API keys or secrets in frontend code.

### Technology

Use React + Vite and clean CSS unless the existing repository already
uses a suitable stack. Keep components modular and use local assets
wherever possible. Do not add a backend unless genuinely required.

### Build sequence

1.  Inspect the existing project and available character assets.
2.  Create the complete responsive page structure.
3.  Implement all mandatory interactions.
4.  Test desktop and mobile layouts.
5.  Fix broken links, console errors, and accessibility issues.
6.  Add a README with setup instructions and asset credits.
7.  Prepare deployment using Vercel or another suitable static host.

### Acceptance criteria

The website must be a complete working portfolio, not just a screenshot
or mockup. Every required section must be present, all core interactions
must work, the character sheet must include all five fields, at least
three projects must be showcased, the story must have multiple scenes,
and one hidden Easter egg must function.

Build the minimum complete version first. Only after it passes these
checks should you add advanced features such as an AI character chatbot,
a persistent guestbook, or 3D graphics.

------------------------------------------------------------------------

## 8. Build Order

1.  Finalise the character name, character sheet, and story.
2.  Implement Hero, About, Projects, and Story sections.
3.  Implement the mood toggle, pointer reaction, and Easter egg.
4.  Test on mobile and desktop; fix layout and interaction bugs.
5.  Prepare deployment, repository, README, and asset credits.
6.  Add optional features only after the core experience passes testing.

## 9. Final Testing Checklist

-   [ ] All five character-sheet fields are present.
-   [ ] Hero and navigation work.
-   [ ] Three project cards open useful details or demos.
-   [ ] Story contains at least three scenes.
-   [ ] Character interaction works with a pointer and has a
    touch-friendly alternative.
-   [ ] Mood toggle visibly changes the experience.
-   [ ] Easter egg can be discovered and activated.
-   [ ] Layout works on phone, tablet, and desktop.
-   [ ] Reduced-motion preferences are respected.
-   [ ] All buttons and links work.
-   [ ] No broken assets or console errors.
-   [ ] README includes setup instructions and asset credits.
-   [ ] Deployment and submission requirements have been checked against
    the current official brief.

## 10. Submission Reminder

Before submitting, re-check the official hackathon brief for the latest
requirements, deadline, and submission format. Confirm whether the rules
require a deployed website, public repository, character sheet, project
story, asset credits, or a particular commit history. Do not assume that
an existing repository automatically satisfies any fresh-build
requirements.

**Priority:** Finish and polish the character portfolio first. Add the
AI chatbot and backend only after the required experience works
reliably.
