# Org Viewer

An enhanced live preview panel for Org-mode (`.org`) and Markdown (`.md`) files in VS Code — with collapsible sections, a TOC sidebar, token counting, and more.

![Org Viewer Preview](https://raw.githubusercontent.com/Joh4nn3s-00/org-viewer/main/media/demo1.png)

## Features

- **Dual-format preview** — Works with both `.org` and `.md` files. Open any supported file and see rendered HTML side-by-side. Edits update in real time.
- **Collapsible sections** — Click any heading to collapse/expand its content. Chevron indicators show section state.
- **Sticky headings** — Headings pin to the top as you scroll, stacking neatly without overlapping.
- **Table of contents** — Fixed sidebar with color-coded headings, click-to-navigate, and scroll spy highlighting.
- **Token count** — See the file's token count in the TOC header — useful for managing AI context window budgets.
- **Syntax highlighting** — Code blocks highlighted with VS Code Dark+ colors via highlight.js (~40 languages).
- **File reference detection** — File paths in your document are automatically detected and color-coded by type. `.org` and `.md` references are clickable and open directly in the editor.
- **Doc Map** — Toggle from preview to a workspace-wide documentation map showing all `.org` files organized by layer (Strategic, Quick Reference, Other). Click any file to navigate.
- **Org-mode rendering** — Headings, lists, tables, links, images, blockquotes, code blocks, math, horizontal rules, and more.
- **Markdown rendering** — Full GitHub-Flavored Markdown support including tables, task lists, strikethrough, and fenced code blocks.
- **Metadata support** (Org) — `#+TITLE`, `#+AUTHOR`, `#+DATE`, planning lines (SCHEDULED/DEADLINE/CLOSED), property drawers, custom drawers, and CLOCK entries.
- **TODO/DONE badges** (Org) — Color-coded keyword badges, priority cookies (`[#A]`/`[#B]`/`[#C]`), and tags as pill badges.
- **Checkboxes** — `[X]`, `[ ]`, and `[-]` rendered as Unicode symbols (Org) or native checkboxes (Markdown).
- **Theme-aware** — All styles respect your VS Code theme (light, dark, and high-contrast).

## Keybindings

| Shortcut | Action | Scope |
|----------|--------|-------|
| `Cmd+Shift+V` | Open preview (replaces current pane) | `.org` files |
| `Cmd+K V` | Open preview to the side (split view) | `.org` files |

For `.md` files, use the command palette (`Cmd+Shift+P`) and search for **"Doc Viewer: Open Preview"** or click the preview icon in the editor title bar.

## Getting Started

1. Install the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=johannes-exe-or-something.org-viewer)
2. Open any `.org` or `.md` file
3. Click the preview icon in the editor title bar, or press `Cmd+K V` (for `.org` files)

## File Reference Colors

File paths mentioned in your documents are automatically styled:

| Type | Extensions | Color |
|------|-----------|-------|
| Org / Markdown | `.org`, `.md` | Blue (clickable) |
| Docs | `.mdx`, `.rst`, `.txt` | Purple |
| Code | `.py`, `.js`, `.ts`, `.go`, `.rs`, etc. | Yellow |
| Config | `.json`, `.yaml`, `.toml`, `.xml`, etc. | Orange |

## Contributing

```bash
git clone https://github.com/Joh4nn3s-00/org-viewer.git
cd org-viewer
npm install
npm run build
```

Press **F5** in VS Code to launch the Extension Development Host.

See `README.org` for the full developer reference (architecture, pipeline details, known issues).

## License

[MIT](LICENSE)
