# Org Viewer — VS Code Extension

A Visual Studio Code extension that provides a **live rendered preview panel** for Emacs Org-mode (`.org`) files, mirroring the UX of VS Code's built-in Markdown preview.

Open a `.org` file, click the split-preview icon in the editor title bar (or press `Cmd+K V`), and see the rendered HTML side-by-side. Edits live-update the preview.

---

## Features

- Split-pane preview for `.org` files (same UX as Markdown preview)
- Live updates as you type
- Preview follows active editor (switching .org files updates the preview)
- Theme-aware styling (respects VS Code light/dark/high-contrast themes)
- Colored headings by level (h1=blue, h2=purple, h3=yellow, etc.)
- TODO/DONE keyword badges with color coding
- Priority cookies `[#A]`/`[#B]`/`[#C]` with color-coded badges
- Tags rendered as pill badges
- Checkbox rendering with Unicode symbols (☑/☐/☒)
- Display math (`$$...$$`) vs inline math (`$...$`) distinction
- Code blocks with syntax highlighting (highlight.js, VS Code Dark+ colors)
- Collapsible sections with toggle chevrons on headings
- Stacked sticky headings that pin below their parent as you scroll
- Table of contents sidebar with scroll spy and color-coded heading levels
- Tables with styled headers
- Planning lines (SCHEDULED/DEADLINE/CLOSED) rendered
- Property drawers and custom drawers (LOGBOOK, NOTES, etc.) rendered
- CLOCK entries with time ranges and durations
- Document metadata (#+TITLE, #+AUTHOR, #+DATE, etc.)

## Keybindings

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+V` | Open preview (replaces current pane) |
| `Cmd+K V` | Open preview to the side (split view) |

---

## Project Structure

```
org_viewer/
├── package.json              # Extension manifest (commands, activation, menus, keybindings)
├── tsconfig.json             # TypeScript compiler config
├── esbuild.js                # Bundler — two targets: extension (Node) + webview (browser)
├── .vscode/
│   ├── launch.json           # F5 debug configs for Extension Development Host
│   └── tasks.json            # Build/watch tasks
├── .vscodeignore             # Files excluded from published .vsix
├── .gitignore
├── src/
│   ├── extension.ts          # Entry point: activate() / deactivate(), command registration
│   ├── preview.ts            # WebviewPanel creation, update, disposal, HTML shell
│   ├── orgParser.ts          # Unified pipeline: uniorg-parse → orgMetadata → uniorg-rehype → rehype-raw → rehype-stringify
│   ├── orgMetadata.ts        # Custom uniorg plugin for metadata, checkboxes, display math, drawers, CLOCK
│   ├── webview.ts            # Browser-side script: highlight.js, collapsible sections, TOC, sticky headings
│   └── util.ts               # getNonce(), getUri() helpers
├── media/
│   ├── preview.css           # Theme-aware styles for preview, TOC sidebar, highlight.js tokens
│   ├── preview.js            # Bundled webview script (built from src/webview.ts)
│   ├── marketplace-icon.png   # 256x256 icon for VS Code Marketplace listing
│   ├── icon-dark.svg         # Preview button icon for dark themes
│   └── icon-light.svg        # Preview button icon for light themes
├── test/
│   ├── runTest.ts            # Test bootstrap (launches VS Code + test suite)
│   └── suite/
│       ├── index.ts          # Mocha runner that discovers *.test.js files
│       ├── orgParser.test.ts # Parser unit tests
│       └── extension.test.ts # Extension integration tests
├── demo/                     # Comprehensive .org test files (8 files, ~2700 lines)
│   ├── basics.org            # Headings, text formatting, entities
│   ├── lists.org             # All list types, checkboxes, nesting
│   ├── links-images.org      # Links, images, footnotes
│   ├── tables.org            # Tables, alignment, formulas
│   ├── code-blocks.org       # Source blocks, example blocks, inline code
│   ├── metadata.org          # Properties, drawers, timestamps, CLOCK
│   ├── blocks.org            # Quote/center/verse/export blocks, LaTeX, horizontal rules
│   └── kitchen-sink.org      # Everything combined in a realistic document
├── debug/                    # Generated HTML output for auditing (not committed, gitignored)
└── dist/                     # Build output (not committed)
    └── extension.js          # Bundled extension (Node.js)
```

---

## Architecture

### Parsing Pipeline (Server-Side — Node.js)

The core pipeline in `src/orgParser.ts` uses [unified](https://unifiedjs.com/) with these plugins in order:

```
.org text
  → uniorg-parse          (org text → uniorg AST)
  → orgMetadata            (custom plugin: transforms metadata nodes, adds checkboxes, fixes display math)
  → uniorg-rehype          (uniorg AST → hast/HTML AST)
  → rehype-raw             (processes raw HTML nodes, with passThrough for unknown types)
  → rehypeCleanUnknownNodes (strips any remaining non-standard nodes before serialization)
  → rehype-stringify        (hast → HTML string)
```

### Webview Enhancement Pipeline (Client-Side — Browser)

The webview script `src/webview.ts` runs in the browser after the HTML is injected. It enhances the rendered output with interactive features:

```
HTML in webview
  → highlight.js           (syntax highlighting for code blocks, VS Code Dark+ colors)
  → buildSections()        (restructures flat HTML into nested collapsible <div> sections)
  → setStickyOffsets()      (calculates stacked top offsets so sub-headings don't overlap parents)
  → buildToc()             (generates a fixed sidebar with all headings, color-coded by level)
  → setupScrollSpy()       (highlights active heading in TOC as user scrolls)
```

### Custom Plugin: `orgMetadata.ts`

This plugin runs at the **uniorg AST level** (before conversion to HTML) and handles features that `uniorg-rehype` silently drops:

| Feature | What the plugin does |
|---------|---------------------|
| `#+TITLE`, `#+AUTHOR`, etc. | Converts `keyword` nodes to bold-label paragraphs |
| SCHEDULED/DEADLINE/CLOSED | Converts `planning` nodes to formatted paragraphs |
| Property drawers | Converts `property-drawer` nodes to key:value displays |
| Custom drawers (LOGBOOK, NOTES) | Converts `drawer` nodes, including their children |
| CLOCK entries | Converts `clock` nodes to bold-label + code-styled time ranges |
| Checkboxes `[X]`/`[ ]`/`[-]` | Injects ☑/☐/☒ Unicode symbols into `list-item` nodes |
| Display math `$$...$$` | Converts `latex-fragment` with `$$` prefix to `latex-environment` for block rendering |
| Subscript/superscript flattening | Converts `_text` and `^text` back to plain text so snake_case identifiers render correctly |

### Webview Panel: `preview.ts`

- Creates a `vscode.WebviewPanel` in a split column
- Injects a full HTML page with parsed content + CSS + webview script
- Uses Content Security Policy (CSP) with nonces for both styles and scripts
- Tracks panels per document URI to avoid duplicates
- Follows active editor — switching `.org` files updates the preview automatically
- Updates on `onDidChangeTextDocument` and `onDidChangeActiveTextEditor`

### Webview Script: `webview.ts`

Bundled separately by esbuild (target: browser, format: IIFE) → `media/preview.js`. Features:

| Feature | How it works |
|---------|-------------|
| Syntax highlighting | highlight.js (`common` bundle) auto-detects language from `language-*` classes |
| Collapsible sections | Restructures flat HTML into nested `<div>` sections with ▼/▶ toggle chevrons |
| Stacked sticky headings | Each heading's `top` = sum of ancestor heading heights, so they stack not overlap |
| TOC sidebar | Fixed 180px sidebar with headings color-coded to match viewer (h1=blue, h2=purple, etc.) |
| Scroll spy | `requestAnimationFrame` throttled scroll listener highlights active heading in TOC |

### Styles: `media/preview.css`

All styles use VS Code CSS variables (e.g., `--vscode-editor-foreground`) for theme compatibility. Includes:
- Heading colors by level (h1=blue, h2=purple, h3=yellow, h4=light blue, h5=orange, h6=green)
- highlight.js token colors matching VS Code Dark+ theme
- Collapsible section styling with guide lines and toggle chevrons
- TOC sidebar with heading-level colors, active item highlighting, and indentation
- TODO/DONE badges, priority cookies, tags, timestamps, code blocks, tables

---

## Development Workflow

### Setup

```bash
npm install
```

### Build

```bash
npm run build       # One-time production build
npm run watch       # Watch mode for development
```

### Run & Debug

1. Open the project in VS Code
2. Press **F5** (or select "Run Extension" from the Run & Debug panel)
3. This opens an **Extension Development Host** with the `demo/` folder
4. Open any `.org` file → click the preview icon or press `Cmd+K V`
5. Edit the `.org` file and watch the preview live-update

### Debug Workflow for Rendering Issues

This is the key workflow used during development to identify rendering gaps:

```bash
# 1. Regenerate HTML debug output for all demo files
node -e "
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
esbuild.buildSync({
  entryPoints: ['src/orgParser.ts'],
  bundle: true,
  outfile: '/tmp/orgparser-test.js',
  format: 'cjs',
  platform: 'node',
  external: ['vscode'],
});
const { orgToHtml } = require('/tmp/orgparser-test.js');
const demoDir = './demo';
const debugDir = './debug';
const files = fs.readdirSync(demoDir).filter(f => f.endsWith('.org'));
Promise.all(files.map(async f => {
  const content = fs.readFileSync(path.join(demoDir, f), 'utf8');
  const html = await orgToHtml(content);
  const outName = f.replace('.org', '.html');
  fs.writeFileSync(path.join(debugDir, outName), html);
  console.log(html.includes('org-error') ? 'WARN' : 'OK  ', f, '-', html.length, 'chars');
}));
"

# 2. Compare .org source against .html output to find gaps
# The debug/*.html files can be read by AI agents or opened in a browser
# to identify what's rendering correctly vs. what's missing/wrong
```

### Quick Parser Smoke Test

```bash
node -e "
const esbuild = require('esbuild');
esbuild.buildSync({
  entryPoints: ['src/orgParser.ts'], bundle: true,
  outfile: '/tmp/orgparser-test.js', format: 'cjs',
  platform: 'node', external: ['vscode'],
});
const { orgToHtml } = require('/tmp/orgparser-test.js');
orgToHtml('* Hello\n- [X] Done\n- [ ] Todo\n\n\$\$E=mc^2\$\$').then(console.log);
"
```

---

## Session Handoff Notes

### Current Status (as of 2026-02-11)

**Phase 1 (Scaffolding): COMPLETE**
- npm project initialized with all dependencies (including highlight.js)
- TypeScript, esbuild (dual-target), launch.json, tasks.json all configured

**Phase 2 (Core Extension): COMPLETE**
- `extension.ts` — registers commands, listens for doc changes, follows active editor
- `preview.ts` — WebviewPanel with live update, CSP (scripts + styles), per-document tracking
- `orgParser.ts` — full unified pipeline with error handling
- `orgMetadata.ts` — custom plugin for metadata/checkboxes/display-math/drawers/CLOCK/subscript flattening

**Phase 3 (Webview Enhancements): COMPLETE**
- `webview.ts` — highlight.js syntax coloring, collapsible sections, stacked sticky headings, TOC sidebar with scroll spy
- `preview.css` — theme-aware styles, highlight.js Dark+ tokens, TOC sidebar, section hierarchy
- `icon-dark.svg` / `icon-light.svg` — themed preview button icons

**Phase 4 (Demo Files): COMPLETE**
- 8 comprehensive `.org` files covering all syntax (~2700 lines)

**Phase 5 (Testing): SCAFFOLDED**
- Test runner and test files created but not verified running

**Phase 6 (Publish): COMPLETE**
- Published to VS Code Marketplace as `johannes-exe-or-something.org-viewer`
- Version 0.1.3

### Known Remaining Issues

These were identified through 3 rounds of automated HTML auditing:

**Checkboxes / Lists:**
- Checkboxes inside table cells are not converted to Unicode symbols (only works in list items)
- `[@N]` counter syntax in ordered lists not implemented
- Letter-based ordered lists (`a.`, `b.`) render as numeric

**Math / LaTeX:**
- `\[...\]` display math syntax not converted to block display (only `$$...$$` works)
- Multi-line `$$...$$` that spans across paragraphs may get split into separate fragments
- Some entities (`\LaTeX`, `\copyright`, `\degree`) rendered as math-inline instead of Unicode

**Links / Images:**
- Internal heading links use `*Heading` format instead of `#heading-id` anchors
- Target definitions (`<<target>>`) and radio targets (`<<<target>>>`) rendered as literal text
- Images with descriptions rendered as links instead of `<img>` with alt text

**Tables:**
- Table column alignment specifiers (`<l>`, `<c>`, `<r>`) shown as cell content

**Blocks / Metadata:**
- `#+ATTR_HTML` attributes sometimes attach to the wrong element (e.g. wrapping `<p>` instead of `<img>`)
- `@@latex:...@@` export snippets visible in HTML output (should be hidden)
- `#+NAME:` on source blocks not preserved as HTML id
- `-n` line numbers flag on source blocks ignored
- Inline source blocks (`src_python{...}`) parsed as subscript

**Drawers:**
- Mixed LOGBOOK + PROPERTIES drawers: when both appear under a heading, parsing can be fragile
- `CUSTOM_ID` property values containing underscores may trigger subscript parsing (e.g. `custom-id-section` → `custom-id-<sub>section</sub>`)

**Lower priority / edge cases:**
- Footnotes with complex inline content (lists inside inline footnotes) partially render
- Radio targets don't auto-link subsequent mentions in the document

### How to Continue

1. **Fix remaining parser issues** — Most require adding handlers to `orgMetadata.ts` (uniorg AST level) or custom uniorg-rehype handlers. The pattern is:
   - Check the AST: `unified().use(uniorgParse).parse(orgText)` → inspect the node
   - Add a case to `visitNode()` or `addCheckboxes()` in `orgMetadata.ts`
   - Rebuild: `node esbuild.js`
   - Test: use the debug workflow above

2. **Run the audit cycle** — Regenerate `debug/*.html`, then compare against `demo/*.org` to find gaps. AI agents work well for this: give them both files and ask for a diff of what's missing.

3. **Write tests** — The test scaffolding exists. Run: `npm run compile && npm test`

4. **Publish** — When ready:
   ```bash
   npm install -g @vscode/vsce
   # Set publisher in package.json
   vsce package          # Creates .vsix
   code --install-extension org-viewer-0.0.1.vsix  # Test locally
   vsce publish          # Push to Marketplace (needs Azure PAT)
   ```

### Dependencies

| Package | Purpose |
|---------|---------|
| `uniorg-parse` | Parses `.org` text into uniorg AST |
| `uniorg-rehype` | Converts uniorg AST to hast (HTML AST) |
| `rehype-raw` | Processes raw HTML nodes in the hast tree |
| `rehype-stringify` | Serializes hast to HTML string |
| `unified` | Pipeline orchestrator |
| `uniorg` | Type definitions for the uniorg AST |
| `highlight.js` | Syntax highlighting for code blocks in the webview |

### Key Technical Decisions

1. **uniorg over orga** — uniorg has better ecosystem integration (unified/rehype) and more complete Org-mode parsing
2. **Custom orgMetadata plugin** — Rather than forking uniorg-rehype, we intercept at the AST level before conversion. This is cleaner and won't break on library updates.
3. **esbuild dual-target** — Two bundles: extension (Node.js/CJS) and webview (browser/IIFE). Faster builds, simpler config than webpack.
4. **Client-side DOM restructuring** — Collapsible sections, sticky headings, and TOC are built by the webview script rather than modifying the parser pipeline. This keeps the parser clean and the enhancements toggleable.
5. **highlight.js common bundle** — Uses the `common` subset (~40 languages) rather than all 190+ to keep the webview bundle lean (~159KB minified).
6. **Stacked sticky via offsetHeight** — Each heading measures its ancestor headings' heights at render time, so `top` offsets are pixel-accurate regardless of font size or content.
7. **Unicode checkbox symbols** — Injecting ☑/☐/☒ text nodes is simpler and more reliable than HTML checkbox elements in the webview context
8. **Display math via node type swap** — Converting `latex-fragment` ($$) to `latex-environment` leverages uniorg-rehype's existing `div.math.math-display` handler
