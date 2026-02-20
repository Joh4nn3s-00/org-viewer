/**
 * Embedded documentation philosophy template.
 * This is the raw .org text that users can copy into their projects.
 * Stored as a string constant to avoid filesystem reads and packaging issues
 * (temp/ is excluded in .vscodeignore).
 */

export const TEMPLATE_ORG = `#+TITLE: Documentation Philosophy
#+DATE: YYYY-MM-DD

* Purpose

This file codifies the documentation philosophy for this codebase. It serves as the authoritative reference for:
- Main coordinating agents reading documentation
- Sub-agents updating or validating documentation
- Humans maintaining the system

*If you are a main coordinating agent*: Read this file after README.org to understand how documentation is structured and maintained.

*If you are a sub-agent*: Reference the relevant section for your task. You do NOT need to update documentation unless explicitly instructed.

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

Documentation follows a two-layer hierarchy. Each layer has a distinct purpose.

| Layer | Files | Purpose | Audience |
|-------|-------|---------|----------|
| Strategic | README.org, ARCHITECTURE.org, API.org, DATABASE.org | High-level overview, navigation, architectural decisions | Main agent, humans |
| Quick Reference | */quick_reference.org | Detailed implementation: line numbers, method signatures, algorithms | Sub-agents, implementers |

*Key rule*: Strategic docs should be LEAN. They link to quick_references for details — they don't duplicate them.

** 3. AI-First Formatting

Primary documentation consumers are AI agents. Optimize for machine parsing.

| Prefer | Over |
|--------|------|
| Tables | Prose paragraphs |
| Bullet lists | Long sentences |
| Structured hierarchies | ASCII art diagrams |
| Explicit relationships | Spatial/visual positioning |

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
- 3+ files with non-trivial logic
- Classes or functions that other modules depend on
- Algorithms or patterns that aren't self-evident from the code
- Configuration that affects runtime behavior

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
Brief 1-2 sentence description.

* Components
| Component | File | Purpose |
|-----------|------|---------|
| ClassName | file.ext:123 | 5-10 word description |

* Key Functions/Methods
| Name | Location | Purpose |
|------|----------|---------|
| method_name() | file.ext:45 | 5-10 word description |

* [Module-specific sections]
Tables, bullets, algorithms as needed.

* Configuration
| Setting | Default | Purpose |
|---------|---------|---------|

---
/Last Updated/: YYYY-MM-DD
#+END_EXAMPLE

*Constraints*:
- Line numbers use format =file.ext:123=
- Descriptions are 5-10 words max
- Tables over prose
- Avoid unnecessary bloat (repetition, content that belongs elsewhere, low-value verbosity)
- Larger modules warrant larger docs — length is acceptable if the content is necessary

* Agent Roles

** Main Coordinating Agent

The main agent orchestrates work and maintains high-level context.

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

Sub-agents execute focused tasks.

*Key rules*:
- Do NOT update documentation unless explicitly instructed
- Return compact summaries in chat — not verbose markdown files
- Read the relevant quick_reference.org before modifying code in a module
- Follow patterns documented in quick_references (reuse existing utilities)

*When instructed to update documentation*:
- Verify against actual code, not other .org files
- Follow Present-State-Only principle
- Keep compact format (tables, bullets)
- Update "Last Updated" date if making changes
- Only edit the file(s) specified — don't touch other files

* Documentation Maintenance

** When to Update

Documentation updates are needed when:
- Code changes affect documented behavior
- Line numbers have drifted
- New features/components are added
- Existing features are removed (delete from docs, don't mark as "REMOVED")

** Maintenance Workflow

The recommended approach uses =git diff= to identify what changed:

#+BEGIN_EXAMPLE
1. Complete code changes
2. Run: git diff -- '*.py' (or '*.ts', '*.go', etc.)
3. Identify affected modules
4. Deploy sub-agents to update relevant quick_reference.org files
5. If architectural changes: update root-level .org files
6. Commit documentation with code
#+END_EXAMPLE

** Batch Maintenance Process

For large refactors or periodic sync, use parallel sub-agents:

*Phase 1: Quick References (parallel sub-agents)*
- Deploy one agent per quick_reference.org file
- Each agent validates content against actual code
- Agents work independently (no file conflicts)

Per-agent tasks:
1. *Hygiene*: Remove "Recent Changes" sections or time-relative phrasing
2. *Hygiene*: Ensure present-state-only language
3. *Validation*: Verify line numbers against actual code
4. *Validation*: Fix stale method names or descriptions

*Phase 2: Root-Level Files*
- Update ARCHITECTURE.org, DATABASE.org after quick_refs are accurate
- Can trust quick_references as source of truth

*Phase 3: Navigation*
- Update README.org links and tables
- Verify all references are correct

* Common Violations to Avoid

| Violation | Example | Fix |
|-----------|---------|-----|
| Change logs | "Recent Changes (2026-01-14): Added X" | Delete the section entirely |
| Tombstone markers | "some_field - REMOVED in V5" | Delete the row entirely |
| Historical language | "We migrated from V4 to V5" | Rewrite in present tense or delete |
| Layer bleed | 100-line algorithm details in ARCHITECTURE.org | Move to quick_reference, add link |
| Stale references | Link to deleted file or removed feature | Delete the reference |
| Verbose prose | Paragraph explaining a method | Convert to table row |

* Quick Checklist

Before committing documentation changes:

- [ ] No "Recent Changes" or historical sections
- [ ] No "REMOVED" or "deprecated" markers for deleted features
- [ ] Present-tense language throughout
- [ ] Strategic docs are lean (details in quick_refs)
- [ ] Line numbers verified against actual code
- [ ] Tables used instead of prose where possible
- [ ] "Last Updated" date is current

---
/Last Updated/: YYYY-MM-DD
`;
