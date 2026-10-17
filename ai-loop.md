# AI Coding Agent Workflow & Collaboration Loop — ORBIT-X

## Objective
Establish a disciplined, high-velocity loop for pair-programming with AI coding assistants (like Antigravity / Gemini) during the 48-hour hackathon, eliminating regressions and keeping code ultra-clean.

---

## The 5-Step AI Iteration Loop

```
  +------------------+       +------------------+       +------------------+
  |  1. Context Sync | ----> |  2. Focused Task | ----> |  3. Code Change  |
  +------------------+       +------------------+       +------------------+
                                                                  |
                                                                  v
  +------------------+       +------------------+       +------------------+
  | 5. Git Commit    | <---- | 4. Quality Audit | <---------------+
  +------------------+       +------------------+
```

### Step 1: Context Synchronization
Before requesting any feature or modification, prompt the AI agent with the active documents:
- Always reference `PRD.md` for acceptance criteria.
- Reference `design.md` for color tokens and visual rules.
- Reference `architecture.md` for component boundaries.

### Step 2: Single-Task Prompting
Never ask the AI to build three complex subsystems in a single prompt. Deconstruct features into discrete units:
- *Good:* "Implement the pentatonic Web Audio chime synthesizer with a mute toggle."
- *Avoid:* "Build the audio engine, redesign the story section, and connect an external database."

### Step 3: Minimal, High-Precision Code Changes
- Require the agent to preserve existing comments, styles, and functional code.
- Prefer targeted updates over wholesale file rewrites unless initializing a new module.

### Step 4: Quality & Console Audit
After every AI-generated change:
1. Open the browser Developer Console (`F12`).
2. Verify **Zero Errors** and **Zero Warnings**.
3. Verify responsive layout on mobile viewport emulation.
4. Verify audio mute state persists cleanly.

### Step 5: Clean Git Checkpoint
Once verified, stage and commit the work immediately with a descriptive conventional commit message:
```bash
git add .
git commit -m "feat(audio): add pentatonic chimes with persistent mute"
```

---

## AI Prompt Templates for Teammates

### Template A: New Feature Addition
```text
Task: [Feature Name]
Context: Refer to PRD.md (REQ-XX) and design.md.
Scope: Only modify [Component/File].
Rules: Must have zero console errors, support keyboard navigation, and respect prefers-reduced-motion.
```

### Template B: Bug Fix / Polish
```text
Issue: [Observed behavior vs Expected behavior]
File: [Target file]
Constraint: Do not alter existing CSS custom properties or break mobile responsiveness.
```
