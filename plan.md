# Org Viewer — VS Code Extension

## Goal

Build and publish a Visual Studio Code extension that provides a **live rendered preview panel** for `.org` (Emacs Org-mode) files — identical in UX to VS Code's built-in Markdown preview. The user opens a `.org` file, clicks the split-preview icon in the editor title bar, and sees the rendered HTML side-by-side. Edits to the `.org` file live-update the preview.

---

## How VS Code Extensions Work

A VS Code extension is a Node.js package loaded by VS Code at runtime. It uses the Extension API to register commands, contribute UI elements, and interact with the editor.

Key concepts:

- **Activation Events** — Tell VS Code *when* to load your extension (e.g., when a `.org` file is opened)
- **Commands** — Named actions the user can invoke (e.g., `orgViewer.showPreview`)
- **Contributions** — UI elements declared in `package.json`: menus, keybindings, languages, icons
- **Webview Panels** — Sandboxed iframes where you render arbitrary HTML/CSS/JS (this is how the preview works)
- **Extension Host** — The process where your extension runs, separate from the VS Code UI

### Lifecycle

1. VS Code detects an activation event (user opens a `.org` file)
2. VS Code calls your `activate()` function in `src/extension.ts`
3. Your extension registers commands, listens for document changes
4. When the user triggers the preview command, you create a `WebviewPanel`
5. You parse the `.org` content to HTML and inject it into the Webview
6. On document change, you re-parse and update the Webview
7. On extension shutdown, VS Code calls `deactivate()`

---

## Project Structure

```
org_viewer/
├── package.json              # Extension manifest (commands, activation, menus, etc.)
├── tsconfig.json             # TypeScript compiler config
├── esbuild.js                # Bundler for packaging the extension
├── .vscodeignore             # Files to exclude from published .vsix
├── .gitignore
├── README.md                 # Marketplace listing
├── CHANGELOG.md              # Version history
├── LICENSE                   # License file
├── src/
│   ├── extension.ts          # Entry point: activate() / deactivate()
│   ├── preview.ts            # WebviewPanel creation, update, disposal
│   ├── orgParser.ts          # .org → HTML conversion
│   └── util.ts               # Shared helpers (getNonce, getUri, etc.)
├── media/
│   ├── preview.css           # Styles for rendered preview
│   └── icon.svg              # Split-preview button icon
├── test/
│   ├── suite/
│   │   ├── extension.test.ts # Integration tests
│   │   └── orgParser.test.ts # Parser unit tests
│   └── runTest.ts            # Test runner bootstrap
└── demo/
    ├── basics.org            # Headings, paragraphs, text formatting
    ├── lists.org             # Ordered, unordered, description lists
    ├── links-images.org      # Links, images, footnotes
    ├── tables.org            # Tables with alignment
    ├── code-blocks.org       # Source blocks, inline code
    ├── metadata.org          # Properties, drawers, tags, timestamps
    ├── advanced.org          # LaTeX, TODO states, priorities, checkboxes
    └── kitchen-sink.org      # Everything combined in one file
```

---

## Key Files Explained

### `package.json` (Extension Manifest)

The most important file. Declares:
- `activationEvents`: `["onLanguage:org"]` — load when a `.org` file opens
- `contributes.commands`: Register `orgViewer.showPreview` and `orgViewer.showPreviewToSide`
- `contributes.menus.editor/title`: Add the preview button to the title bar (only for `.org` files)
- `contributes.languages`: Register the `org` language ID for `.org` files
- `contributes.keybindings`: Ctrl+Shift+V (preview) and Ctrl+K V (side preview), matching Markdown

### `src/extension.ts`

Entry point. In `activate()`:
- Register the preview commands
- Set up document change listeners to live-update the preview
- Handle Webview lifecycle (disposal, visibility)

### `src/preview.ts`

Manages the Webview panel:
- Creates a `vscode.WebviewPanel` in a split column
- Generates the HTML skeleton with embedded CSS
- Updates content when the source document changes
- Handles scroll sync (optional/stretch goal)

### `src/orgParser.ts`

The parsing engine. Converts Org-mode text to HTML. Options:
- **Use `uniorg`** — A mature Org-mode parser that produces a unist AST, convertible to HTML via `uniorg-rehype` + `rehype-stringify`. Best for correctness.
- **Use `orga`** — Another JS Org parser. Slightly different API.
- **Custom parser** — Write our own with regex. Full control but more work.

Recommendation: Use `uniorg` ecosystem for correctness, with a fallback or wrapper that handles edge cases.

### `media/preview.css`

Styles the rendered HTML in the Webview. Should:
- Respect VS Code's theme (use CSS variables like `--vscode-editor-foreground`)
- Style headings, lists, tables, code blocks, blockquotes
- Handle light/dark/high-contrast themes

---

## Development Workflow

### Setup
```bash
npm init -y
npm install --save-dev typescript @types/vscode esbuild
npm install uniorg uniorg-rehype rehype-stringify unified
```

### Local Testing
1. Open the project in VS Code
2. Press F5 → launches an **Extension Development Host** (second VS Code window)
3. Open a `.org` file in the dev host
4. Run the preview command or click the title bar icon
5. Edit the `.org` file and watch the preview update

### Debugging
- Set breakpoints in `src/extension.ts`
- Use the Debug Console in the primary VS Code window
- Webview content can be debugged via Developer Tools (Ctrl+Shift+I in the dev host)

---

## Testing Strategy

### Unit Tests (Parser)
- Test each Org-mode element converts to correct HTML
- Use Mocha + assert (VS Code extension testing convention)
- Located in `test/suite/orgParser.test.ts`

### Integration Tests (Extension)
- Use `@vscode/test-electron` to launch a real VS Code instance
- Verify commands are registered
- Verify preview panel opens
- Verify content updates on document change
- Located in `test/suite/extension.test.ts`

### Manual Testing
- Use the demo `.org` files in `demo/`
- Verify rendering of every Org-mode element
- Test across light, dark, and high-contrast themes

---

## Publishing

### Prerequisites
1. **Azure DevOps account** (free) → create a Personal Access Token (PAT) with Marketplace scope
2. **Publisher ID** → register at https://marketplace.visualstudio.com/manage
3. **`vsce` CLI** → `npm install -g @vscode/vsce`

### Steps
1. Update `README.md` with screenshots and feature description
2. Update `CHANGELOG.md` with version notes
3. Set `publisher` field in `package.json`
4. Bundle: `npm run build`
5. Package: `vsce package` → produces `org-viewer-0.0.1.vsix`
6. Test locally: `code --install-extension org-viewer-0.0.1.vsix`
7. Publish: `vsce publish`

### Marketplace Listing
- Clear description of what the extension does
- Screenshots showing the split preview
- Feature list (supported Org elements, theme support, live preview)
- Minimum VS Code version requirement

---

## Org-Mode Syntax Coverage

The demo files and parser must cover the **full scope** of Org-mode syntax. A research sub-agent will compile the authoritative list from the Org-mode manual. At minimum:

### Document Structure
- Headings (levels 1-6+)
- Sections and body text
- Document title, author, date (`#+TITLE`, `#+AUTHOR`, `#+DATE`)

### Text Formatting (Inline Markup)
- **Bold** (`*bold*`), /Italic/ (`/italic/`), _Underline_ (`_underline_`)
- `=verbatim=`, `~code~`, +strikethrough+ (`+strikethrough+`)
- Superscript (`^{}`), subscript (`_{}`), entities (`\alpha`)

### Lists
- Unordered (`-`, `+`, `*`)
- Ordered (`1.`, `1)`)
- Description lists (`- term :: definition`)
- Checkbox lists (`- [ ]`, `- [X]`)
- Nested lists

### Links and Images
- External links (`[[url][description]]`)
- Internal links / cross-references
- Bare URLs (auto-linked)
- Inline images (`[[file:image.png]]`)
- Footnotes (`[fn:1]`)

### Tables
- Basic tables with `|` delimiters
- Header rows (separated by `|-`)
- Column alignment
- Table formulas (display, not compute)

### Blocks
- Source code blocks (`#+BEGIN_SRC lang ... #+END_SRC`)
- Example blocks (`#+BEGIN_EXAMPLE ... #+END_EXAMPLE`)
- Quote blocks (`#+BEGIN_QUOTE ... #+END_QUOTE`)
- Center blocks, verse blocks, export blocks
- Inline source / inline results

### Metadata and Planning
- TODO keywords and states (`TODO`, `DONE`, custom)
- Priority cookies (`[#A]`, `[#B]`, `[#C]`)
- Tags (`:tag1:tag2:`)
- Properties and drawers (`:PROPERTIES: ... :END:`)
- Timestamps (`<2024-01-15 Mon>`, `[2024-01-15 Mon]`)
- Deadline, scheduled, closed timestamps
- Clocking (`CLOCK:` entries)

### Advanced
- LaTeX fragments (`$...$`, `\[...\]`)
- Horizontal rules (5+ dashes: `-----`)
- Comments (`# comment`, `#+BEGIN_COMMENT`)
- Macros (`{{{macro(args)}}}`)
- Include directives (`#+INCLUDE`)
- Table of contents directive (`#+TOC`)

---

## Implementation Plan (Task Breakdown)

### Phase 1: Scaffolding
- [ ] Initialize npm project and install dependencies
- [ ] Create `package.json` extension manifest
- [ ] Set up TypeScript config
- [ ] Set up esbuild bundler
- [ ] Create `.vscodeignore` and `.gitignore`
- [ ] Initialize git repo

### Phase 2: Core Extension
- [ ] Implement `src/extension.ts` — command registration, activation
- [ ] Implement `src/preview.ts` — Webview panel with live update
- [ ] Implement `src/orgParser.ts` — Org-to-HTML using uniorg
- [ ] Create `media/preview.css` — theme-aware styles
- [ ] Create `media/icon.svg` — preview button icon

### Phase 3: Demo Files
- [ ] Research complete Org-mode syntax (sub-agent)
- [ ] Create comprehensive demo `.org` files covering all syntax elements

### Phase 4: Testing
- [ ] Write parser unit tests
- [ ] Write extension integration tests
- [ ] Manual testing across themes

### Phase 5: Polish and Publish
- [ ] Write README with screenshots
- [ ] Write CHANGELOG
- [ ] Bundle and package with vsce
- [ ] Test .vsix installation
- [ ] Publish to Marketplace
