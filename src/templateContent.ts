/**
 * Embedded documentation philosophy template.
 * This is the raw .org text that users can copy into their projects.
 * Stored as a string constant to avoid filesystem reads and packaging issues
 * (temp/ is excluded in .vscodeignore).
 */

export const TEMPLATE_ORG = `#+TITLE: Documentation Philosophy
#+DATE: YYYY-MM-DD

*Philosophy Version*: v2 (2026-02-24)
- Adds "Document the Non-Obvious" and "Single Source of Truth" as core principles
- Replaces line-number and function-signature documentation with constraints-first approach
- Introduces canonical home assignments and sizing targets for quick references
- Adds architectural decisions routing (cross-cutting vs. module-specific)
- Expands sync workflow with git-assisted/code-only modes and sub-agent return format

* Purpose

Authoritative reference for how documentation is structured and maintained in this codebase. All agents and humans follow these rules.

*If you are a main coordinating agent*: Read this file after README.org before any documentation work.

*If you are a sub-agent*: Reference the relevant section for your task. Do NOT update documentation unless explicitly instructed.

* Core Principles

** 1. Present-State-Only

Documentation represents the *current state* of the system, not its history.

| Do | Don't |
|----|-------|
| Document what EXISTS now | Include "Recent Changes" sections |
| Use present-tense language | Use "we added", "we removed", "previously" |
| Delete references to removed features | Keep "REMOVED in V5" markers |
| Update or delete outdated content | Add change logs or audit trails |

*Rationale*: Historical content wastes context window tokens and creates confusion about what currently exists.

** 2. Layer Discipline

Documentation follows a two-layer hierarchy.

| Layer | Files | Purpose | Audience |
|-------|-------|---------|----------|
| Strategic | =ALL_CAPS.org= at project root | High-level overview, navigation, decisions | Main agent, humans |
| Quick Reference | =*/quick_reference.org= | Non-obvious patterns, constraints, component maps | Sub-agents, implementers |

*Key rule*: Strategic docs should be LEAN. They state counts and link to quick_references for details — they don't duplicate them.

** 3. AI-First Formatting

Primary documentation consumers are AI agents. Optimize for machine parsing.

| Prefer | Over |
|--------|------|
| Tables | Prose paragraphs |
| Bullet lists | Long sentences |
| Structured hierarchies | ASCII art diagrams |
| Explicit relationships | Spatial/visual positioning |

** 4. Document the Non-Obvious

This is the central principle. Document what agents *cannot easily discover* by reading code or running a grep. Skip what's self-evident.

| Document | Skip |
|----------|------|
| Data flow patterns (cascading useEffects, SSE streaming) | Individual function signatures (grep for them) |
| Caching strategies and singleton patterns | TypeScript interfaces with clear field names |
| External API limitations and workarounds | React props that mirror the interface |
| Decision rationale ("why", not just "what") | Every useState variable |
| Deviation from standard patterns | Standard error handling (document once) |
| Cross-file relationships not obvious from imports | File-to-file imports (read the code) |

*Test*: Before documenting something, ask: "Would an agent find this faster by reading the code or grepping?" If yes, skip it.

*Exception*: Document code-level details when they have non-obvious semantics — e.g., enum values where 0=incomplete, 1=complete, 2=complete_pass, or a module-level cache Map outside React that persists across tab navigation.

** 5. Single Source of Truth

Each fact lives in exactly one file. Other files reference it, never duplicate it.

| Do | Don't |
|----|-------|
| Assign a canonical home for each fact | Duplicate endpoint tables across 4 files |
| Link to the canonical home from other files | Copy project trees into ARCHITECTURE.org AND README.org |
| State counts in summary files ("12 components") | Reproduce component inventories in strategic files |

*Rationale*: Duplicated content drifts. Adding one page or endpoint should require updating one file, not six.

* File Structure

** Root-Level .org Files (Strategic Layer)

*** Naming Convention

Strategic files use =ALL_CAPS.org= naming and live at the project root (or one level deep). This convention enables automatic classification — tools like the Org Viewer Doc Map use the naming pattern to identify strategic vs. detail documentation.

*** Core Files (Every Project)

| File | Purpose | When to Read |
|------|---------|--------------|
| README.org | Navigation hub, quick start, links to all docs | First file for any agent |
| ARCHITECTURE.org | System design, layer overview, data flow, key decisions | Understanding overall system |
| DOCUMENTATION_PHILOSOPHY.org | This file — documentation standards | Before updating any documentation |

*** Optional Files (Add When Relevant)

| File | Add When | Typical Project Types |
|------|----------|-----------------------|
| DATABASE.org | Project has a database with 5+ tables or complex schema | Backend, full-stack |
| API.org | Project exposes or consumes APIs with multiple endpoints | Backend, full-stack |
| COMPONENTS.org | Project has a component library or complex UI hierarchy | Frontend, full-stack |
| ROUTES.org | Project has complex routing (20+ routes or nested layouts) | Frontend, full-stack |
| DEPLOYMENT.org | Non-trivial deployment (multi-stage, multi-environment) | Any |
| INTEGRATIONS.org | Project integrates with 3+ external services | Any |
| TESTING.org | Complex test architecture (E2E, fixtures, mocking strategies) | Any |

*** When to Create a New Strategic File

Create a new =ALL_CAPS.org= file when:
- A topic spans multiple modules and doesn't belong in any single quick_reference
- Main agents need the information before diving into module details
- The content would make ARCHITECTURE.org exceed ~300 lines if included inline

Do NOT create one when:
- The topic only affects one module (put it in that module's quick_reference instead)
- The content is configuration-only (a table in README.org suffices)

*** Canonical Home Assignments

Each fact type has one canonical home. Other files may reference it with a link or a summary count — never a full copy.

| Fact | Canonical Home | Others Do |
|------|---------------|-----------|
| Full endpoint list with API mappings | API.org | Backend QR summarises by route module |
| Component inventory | components/quick_reference.org | README.org states count only |
| Route table with layout details | pages/quick_reference.org | ARCHITECTURE.org states count only |
| Project structure tree | README.org | Not duplicated elsewhere |
| Tech stack and versions | ARCHITECTURE.org | — |
| Design tokens and colours | components/quick_reference.org | ARCHITECTURE.org links |
| Deployment config and workflow | DEPLOYMENT.org | README.org links |
| TypeScript interfaces | Code files (types/*.ts) | Not reproduced in QRs |

Adapt this table to your project's file structure. The principle is: one home per fact, links everywhere else.

*** Strategic File Guidelines

| File | Contains | Does Not Contain |
|------|----------|-----------------|
| README.org | Project structure tree, navigation hub, quick start, summary counts | Component inventories, route details |
| ARCHITECTURE.org | System design, tech stack, data flow, expanded key decisions with rationale | Duplicated project tree, component/page inventories |
| API.org | Full endpoint list with mappings (canonical home) | — |
| DATABASE.org | Schema overview, relationships, migration notes | — |

*Key decisions table format*: Include Rationale and Constraints columns, not just Decision + Description.

** Quick Reference Files (Detail Layer)

*** Naming and Placement

- File must be named exactly =quick_reference.org=
- Placed inside the module's directory
- One per module — never multiple quick_reference files in the same directory

#+BEGIN_EXAMPLE
project/
\u251C\u2500\u2500 README.org                    \u2190 Strategic
\u251C\u2500\u2500 ARCHITECTURE.org              \u2190 Strategic
\u251C\u2500\u2500 auth/
\u2502   \u2514\u2500\u2500 quick_reference.org       \u2190 Detail: auth module
\u251C\u2500\u2500 api/
\u2502   \u251C\u2500\u2500 routes/
\u2502   \u2502   \u2514\u2500\u2500 quick_reference.org   \u2190 Detail: route handlers
\u2502   \u2514\u2500\u2500 quick_reference.org       \u2190 Detail: API layer
\u251C\u2500\u2500 models/
\u2502   \u2514\u2500\u2500 quick_reference.org       \u2190 Detail: data models
\u251C\u2500\u2500 services/
\u2502   \u2514\u2500\u2500 quick_reference.org       \u2190 Detail: business logic
\u2514\u2500\u2500 utils/
    \u2514\u2500\u2500 quick_reference.org       \u2190 Detail: shared utilities
#+END_EXAMPLE

*** When to Create a Quick Reference

Create a =quick_reference.org= when a module has:
- Non-obvious patterns or algorithms that aren't self-evident from the code
- 3+ files with cross-file relationships worth mapping
- External integration constraints
- Configuration that affects runtime behavior in non-obvious ways

*** When NOT to Create a Quick Reference

Skip it when:
- The module is a thin wrapper (e.g., re-exports, type definitions only)
- The module has only 1-2 simple files with obvious logic
- The module is pure configuration (no runtime code)
- The module's purpose is fully captured by a few rows in ARCHITECTURE.org

*** Examples by Project Type

*Backend (Python/Node/Go)*:
#+BEGIN_EXAMPLE
project/
\u251C\u2500\u2500 README.org
\u251C\u2500\u2500 ARCHITECTURE.org
\u251C\u2500\u2500 DATABASE.org
\u251C\u2500\u2500 API.org
\u251C\u2500\u2500 auth/quick_reference.org
\u251C\u2500\u2500 models/quick_reference.org
\u251C\u2500\u2500 services/quick_reference.org
\u251C\u2500\u2500 workers/quick_reference.org
\u2514\u2500\u2500 clients/quick_reference.org
#+END_EXAMPLE

*Frontend (React/Vue/Svelte)*:
#+BEGIN_EXAMPLE
project/
\u251C\u2500\u2500 README.org
\u251C\u2500\u2500 ARCHITECTURE.org
\u251C\u2500\u2500 COMPONENTS.org
\u251C\u2500\u2500 ROUTES.org
\u251C\u2500\u2500 components/quick_reference.org
\u251C\u2500\u2500 hooks/quick_reference.org
\u251C\u2500\u2500 store/quick_reference.org
\u2514\u2500\u2500 api/quick_reference.org
#+END_EXAMPLE

*Full-Stack / Monorepo*:
#+BEGIN_EXAMPLE
project/
\u251C\u2500\u2500 README.org
\u251C\u2500\u2500 ARCHITECTURE.org
\u251C\u2500\u2500 DATABASE.org
\u251C\u2500\u2500 API.org
\u251C\u2500\u2500 backend/
\u2502   \u251C\u2500\u2500 ARCHITECTURE.org
\u2502   \u251C\u2500\u2500 auth/quick_reference.org
\u2502   \u2514\u2500\u2500 services/quick_reference.org
\u2514\u2500\u2500 frontend/
    \u251C\u2500\u2500 ARCHITECTURE.org
    \u251C\u2500\u2500 components/quick_reference.org
    \u2514\u2500\u2500 store/quick_reference.org
#+END_EXAMPLE

** Quick Reference Format

Each quick_reference.org follows this structure:

#+BEGIN_EXAMPLE
#+TITLE: Module Name - Quick Reference
#+DATE: YYYY-MM-DD

* Overview
Brief 1-2 sentence description of the module's role.

* Components
| Component | File | Purpose |
|-----------|------|---------|
| ClassName | file.ext | 5-10 word description |

File names only (e.g., moodle_client.py). No line numbers.

* Key Patterns
Non-obvious algorithms, data flows, caching strategies.
Document the "why" and "how", not the "what".

* Constraints & Gotchas
- External API limitation X requires workaround Y
- Module-level cache persists across tab navigation
- EventSource can't send headers — auth token passed via query param

* Configuration (if applicable)
| Setting | Default | Purpose |
|---------|---------|---------|

---
/Last Updated/: YYYY-MM-DD
#+END_EXAMPLE

*** What Belongs in a Quick Reference

| Include | Exclude |
|---------|---------|
| Component inventory (name, file, purpose) | Line numbers (agents grep for these) |
| Non-obvious data flow patterns | TypeScript interface fields (self-documenting) |
| Caching, streaming, and singleton patterns | React prop interfaces (read the .tsx file) |
| External API constraints and workarounds | Every useState variable (obvious from code) |
| Cross-file relationships | Standard error handling (document once, reference thereafter) |
| Algorithms that aren't self-evident | Function signatures (grep for the function name) |
| Module-specific architectural decisions | Information already in a strategic file |

*** Sizing Targets

| Module complexity | Target size |
|-------------------|-------------|
| Simple (3-5 files) | 50-100 lines |
| Medium (5-15 files) | 100-200 lines |
| Complex (15+ files) | 200-350 lines |

If a quick reference exceeds 350 lines, it likely documents content that is obvious from reading the code directly.

* Architectural Decisions

Decisions are documented at two levels depending on scope.

** Cross-Cutting Decisions -> ARCHITECTURE.org

Decisions that affect multiple modules or the overall system live in ARCHITECTURE.org. Each entry includes:

| Column | Purpose |
|--------|---------|
| Decision | What was decided |
| Choice | The option selected |
| Rationale | Why this choice was made |
| Constraints | Gotchas, limitations, or things to watch out for |

** Module-Specific Constraints -> Quick References

Decisions that only affect one module live in its quick_reference under =* Constraints & Gotchas=.

** Which Level?

| If the decision... | Document in |
|--------------------|-------------|
| Affects 2+ modules or the overall architecture | ARCHITECTURE.org |
| Involves a technology choice (framework, library, protocol) | ARCHITECTURE.org |
| Only affects one module's internal implementation | That module's quick_reference.org |
| Relates to an external API limitation | The module that calls that API |

* Agent Roles

** Main Coordinating Agent

Orchestrates work and maintains high-level context.

*Responsibilities*:
- Read strategic docs (README.org, ARCHITECTURE.org) for project understanding
- Decompose user requests into sub-agent tasks
- Deploy sub-agents with clear, scoped instructions
- Synthesize sub-agent findings into coherent responses
- Decide when documentation updates are needed

*Documentation reading order*:
1. README.org — navigation and quick start
2. ARCHITECTURE.org — system design (if needed)
3. DOCUMENTATION_PHILOSOPHY.org — before any doc maintenance
4. Specific quick_references — only when diving into module details

** Sub-Agents

Execute focused tasks.

*Key rules*:
- Do NOT update documentation unless explicitly instructed
- Return compact summaries in chat — not verbose output
- Read the relevant quick_reference.org before modifying code in a module
- Follow patterns documented in quick_references (reuse existing utilities)

*When instructed to update documentation*:
- Verify against actual code, not other .org files
- Follow all five core principles
- Update "Last Updated" date if making changes
- Only edit the file(s) specified — don't touch other files

* Documentation Sync Workflow

Standard process for syncing documentation after code changes. Uses parallel sub-agents (one per quick_reference) and a main coordinating agent.

** Prerequisites

Determine whether git history is trustworthy for this sync. Two modes:

| Mode | Meaning | Sub-agent strategy |
|------|---------|--------------------|
| Git-assisted | Recent commits accurately reflect changes | Sub-agents use =git diff= and =git log= to identify what changed, then validate against code |
| Code-only | Git history is unreliable or unavailable | Sub-agents read code files directly and validate against the quick_reference |

** Phase 1: Quick References (parallel sub-agents)

Deploy *one sub-agent per quick_reference.org file*, all in parallel. Each sub-agent:

1. *Read* the quick_reference.org to understand what's currently documented
2. *Identify changes* using git or direct code reading (per mode above)
3. *Validate against actual code*:
   - Check that documented components/files still exist
   - Check for new files or components not yet documented
   - Check for removed items still documented
   - Check that descriptions match current behavior
   - Look for new non-obvious patterns worth documenting
   - Check Constraints & Gotchas for accuracy
4. *Update the quick_reference.org* if anything is stale or missing:
   - Follow the quick reference format (no line numbers, no interface reproduction)
   - Present-state-only language
   - Tables over prose, descriptions 5-10 words max
   - Update "Last Updated" date
5. *Return a compact summary* to the main agent:

#+BEGIN_EXAMPLE
MODULE: [module name]
CHANGES MADE: [Yes/No]
SUMMARY: [2-5 bullet points of what was found/changed]
ARCHITECTURAL NOTES: [Items the main agent should reflect in strategic files, or "None"]
#+END_EXAMPLE

*Critical*: Each sub-agent edits ONLY its own quick_reference.org. No other files.

** Phase 2: Root-Level Files (main agent)

After all sub-agents complete, the main agent reads their summaries and updates strategic files. Respect canonical homes — only update counts and links, not duplicate detail.

| File | Update when sub-agents report... |
|------|----------------------------------|
| ARCHITECTURE.org | New cross-cutting decisions, structural changes, tech stack changes |
| API.org | New/removed endpoints, changed endpoint behavior |
| README.org | Structural changes, navigation updates (project tree is canonical here) |

*Rules*:
- Read the current file before editing (never edit blind)
- Keep changes minimal — strategic docs stay lean
- Update "Last Updated" dates on any file touched

** Phase 3: Commit

Stage and commit all .org changes in a single batch:

#+BEGIN_EXAMPLE
git add *.org **/quick_reference.org
git commit -m "Sync .org documentation with current code"
#+END_EXAMPLE

* Common Violations

| Violation | Example | Fix |
|-----------|---------|-----|
| Change logs | "Recent Changes: Added X" | Delete the section |
| Tombstone markers | "some_field - REMOVED in V5" | Delete the row |
| Historical language | "We migrated from V4 to V5" | Rewrite in present tense or delete |
| Layer bleed | 100-line algorithm details in ARCHITECTURE.org | Move to quick_reference, add link |
| Stale references | Link to deleted file or removed feature | Delete the reference |
| Verbose prose | Paragraph explaining a method | Convert to table row |
| Transcribed code | TypeScript interface reproduced in QR | Delete — agents read the code directly |
| Duplicated facts | Same endpoint table in API.org AND backend QR | Keep in canonical home, link from others |
| Exhaustive inventories | Every useState, every function listed | Keep only non-obvious items |
| Line numbers in tables | file.ext:123 | Use file name only — agents grep |
| Over-documentation | Props, state variables, function signatures | Only document if non-obvious |

* Quick Checklist

Before committing documentation changes:

- [ ] No "Recent Changes" or historical sections
- [ ] No "REMOVED" or "deprecated" markers
- [ ] Present-tense language throughout
- [ ] Only non-obvious content documented (no transcribed code)
- [ ] Each fact lives in its canonical home only
- [ ] Strategic docs are lean (details in quick_refs, counts not inventories)
- [ ] Quick references include Constraints & Gotchas section
- [ ] Quick references within sizing targets
- [ ] Tables used instead of prose where possible
- [ ] "Last Updated" date is current

---
/Last Updated/: YYYY-MM-DD
`;
