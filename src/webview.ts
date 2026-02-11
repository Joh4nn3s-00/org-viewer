/**
 * Webview-side script for the Org Preview panel.
 * Runs in the browser context (VS Code webview iframe).
 *
 * Features:
 * 1. Syntax highlighting for code blocks (highlight.js)
 * 2. Collapsible sections with toggle chevrons
 * 3. Stacked sticky headings (sub-headings sit below parent headings)
 * 4. Table of contents sidebar with scroll spy + token count
 * 5. File reference detection and styling
 * 6. Clickable .org file references (opens in editor)
 * 7. Doc Map toggle — workspace .org file tree view
 */

import hljs from "highlight.js/lib/common";

// VS Code webview API for messaging back to the extension host
declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void;
};
const vscode = acquireVsCodeApi();

document.addEventListener("DOMContentLoaded", () => {
  highlightCode();
  buildSections();
  setStickyOffsets();
  linkifyFileReferences();
  buildToc();
  buildViewToggle();
  setupScrollSpy();
  setupMessageListener();
});

// ─── 1. Code Syntax Highlighting ─────────────────────────────────

function highlightCode(): void {
  document.querySelectorAll("pre code[class*='language-']").forEach((el) => {
    hljs.highlightElement(el as HTMLElement);
  });
}

// ─── 2. Collapsible Section Hierarchy ────────────────────────────

interface StackEntry {
  level: number;
  body: HTMLElement;
}

function headingLevel(el: Element): number {
  const m = el.tagName.match(/^H([1-6])$/);
  return m ? parseInt(m[1], 10) : 0;
}

function buildSections(): void {
  const article = document.querySelector(".org-preview");
  if (!article) return;

  const children = Array.from(article.children);
  const fragment = document.createDocumentFragment();
  const stack: StackEntry[] = [];

  for (const child of children) {
    const level = headingLevel(child);

    if (level > 0) {
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      const section = document.createElement("div");
      section.className = `org-section org-level-${level}`;

      const toggle = document.createElement("span");
      toggle.className = "section-toggle";
      toggle.textContent = "\u25BC";
      child.insertBefore(toggle, child.firstChild);

      child.classList.add("section-heading");
      child.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).closest("a")) return;
        if ((e.target as HTMLElement).closest(".file-ref")) return;

        const body = section.querySelector(
          ":scope > .section-body"
        ) as HTMLElement | null;
        if (body) {
          const collapsed = body.classList.toggle("collapsed");
          toggle.textContent = collapsed ? "\u25B6" : "\u25BC";
          section.classList.toggle("is-collapsed", collapsed);
        }
      });

      section.appendChild(child);

      const body = document.createElement("div");
      body.className = "section-body";
      section.appendChild(body);

      if (stack.length > 0) {
        stack[stack.length - 1].body.appendChild(section);
      } else {
        fragment.appendChild(section);
      }

      stack.push({ level, body });
    } else {
      if (stack.length > 0) {
        stack[stack.length - 1].body.appendChild(child);
      } else {
        fragment.appendChild(child);
      }
    }
  }

  article.innerHTML = "";
  article.appendChild(fragment);
}

// ─── 3. Stacked Sticky Offsets ───────────────────────────────────

function setStickyOffsets(): void {
  const headings = document.querySelectorAll<HTMLElement>(".section-heading");

  headings.forEach((heading, index) => {
    heading.setAttribute("data-toc-id", String(index));

    let top = 0;
    let ancestor: Element | null =
      heading.closest(".org-section")?.parentElement?.closest(".org-section") ??
      null;

    while (ancestor) {
      const parentHeading = ancestor.querySelector(
        ":scope > .section-heading"
      ) as HTMLElement | null;
      if (parentHeading) {
        top += parentHeading.offsetHeight;
      }
      ancestor =
        ancestor.parentElement?.closest(".org-section") ?? null;
    }

    heading.style.top = `${top}px`;
  });
}

// ─── 4. File Reference Detection & Styling ───────────────────────

const FILE_TYPE_MAP: Record<string, string> = {};
["org"].forEach((e) => (FILE_TYPE_MAP[e] = "org"));
["md", "mdx", "rst", "txt"].forEach((e) => (FILE_TYPE_MAP[e] = "doc"));
["py", "js", "ts", "tsx", "jsx", "rs", "go", "java", "c", "cpp", "h", "rb",
 "php", "swift", "kt", "cs", "sh", "bash", "zsh", "lua", "r", "pl", "ex",
 "exs", "hs", "ml", "scala", "clj"].forEach((e) => (FILE_TYPE_MAP[e] = "code"));
["json", "yaml", "yml", "toml", "xml", "html", "css", "scss", "less", "ini",
 "cfg", "conf", "env", "sql"].forEach((e) => (FILE_TYPE_MAP[e] = "config"));

const FILE_REF_PATTERN =
  /(?:(?:[\w.*-]+\/)*[\w.*-]+\.(?:org|md|mdx|py|js|ts|tsx|jsx|rs|go|java|c|cpp|h|rb|php|swift|kt|cs|sh|bash|zsh|lua|r|pl|ex|exs|hs|ml|scala|clj|json|yaml|yml|toml|xml|html|css|scss|less|ini|cfg|conf|env|sql|rst|txt)(?::\d+)?)/g;

function linkifyFileReferences(): void {
  const article = document.querySelector(".org-preview");
  if (!article) return;

  const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const parent = node.parentElement;
    if (parent && (
      parent.closest("pre") ||
      parent.closest("code") ||
      parent.closest("a") ||
      parent.closest(".file-ref")
    )) continue;

    if (FILE_REF_PATTERN.test(node.textContent || "")) {
      textNodes.push(node);
    }
    FILE_REF_PATTERN.lastIndex = 0;
  }

  for (const textNode of textNodes) {
    replaceFileRefs(textNode);
  }
}

function replaceFileRefs(textNode: Text): void {
  const text = textNode.textContent || "";
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;

  FILE_REF_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = FILE_REF_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      fragment.appendChild(
        document.createTextNode(text.slice(lastIndex, match.index))
      );
    }

    const ref = match[0];
    const ext = ref.replace(/:\d+$/, "").split(".").pop() || "";
    const fileType = FILE_TYPE_MAP[ext] || "generic";

    if (fileType === "org") {
      const link = document.createElement("a");
      link.className = `file-ref file-ref-${fileType}`;
      link.textContent = ref;
      link.title = `Open ${ref}`;
      link.href = "#";
      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        vscode.postMessage({ command: "openFile", path: ref });
      });
      fragment.appendChild(link);
    } else {
      const span = document.createElement("span");
      span.className = `file-ref file-ref-${fileType}`;
      span.textContent = ref;
      fragment.appendChild(span);
    }

    lastIndex = match.index + ref.length;
  }

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  if (lastIndex > 0) {
    textNode.parentNode?.replaceChild(fragment, textNode);
  }
}

// ─── 5. Table of Contents Sidebar ────────────────────────────────

function buildToc(): void {
  const headings = document.querySelectorAll<HTMLElement>(".section-heading");
  if (headings.length === 0) return;

  const nav = document.createElement("nav");
  nav.className = "org-toc";

  const header = document.createElement("div");
  header.className = "toc-header";

  const headerTitle = document.createElement("span");
  headerTitle.textContent = "Contents";
  header.appendChild(headerTitle);

  const article = document.querySelector(".org-preview") as HTMLElement | null;
  const tokenCount = article?.dataset.tokenCount;
  if (tokenCount && tokenCount !== "0") {
    const badge = document.createElement("span");
    badge.className = "toc-token-count";
    badge.textContent = formatTokenCount(parseInt(tokenCount, 10));
    badge.title = `${parseInt(tokenCount, 10).toLocaleString()} tokens (cl100k estimate)`;
    header.appendChild(badge);
  }

  nav.appendChild(header);

  const list = document.createElement("div");
  list.className = "toc-items";

  headings.forEach((heading) => {
    const id = heading.getAttribute("data-toc-id") || "";
    const level = headingLevel(heading);

    const clone = heading.cloneNode(true) as HTMLElement;
    const toggleEl = clone.querySelector(".section-toggle");
    if (toggleEl) toggleEl.remove();
    const text = clone.textContent?.trim() || "";

    const item = document.createElement("a");
    item.className = `toc-item toc-level-${level}`;
    item.setAttribute("data-toc-id", id);
    item.textContent = text;
    item.title = text;
    item.addEventListener("click", (e) => {
      e.preventDefault();
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    list.appendChild(item);
  });

  nav.appendChild(list);
  document.body.insertBefore(nav, document.body.firstChild);
  document.body.classList.add("has-toc");
}

function formatTokenCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

// ─── 6. View Toggle (Preview / Doc Map) ─────────────────────────

let docMapLoaded = false;

function buildViewToggle(): void {
  const article = document.querySelector(".org-preview");
  if (!article) return;

  const bar = document.createElement("div");
  bar.className = "view-toggle-bar";

  const previewBtn = document.createElement("button");
  previewBtn.className = "view-toggle-btn active";
  previewBtn.textContent = "Preview";
  previewBtn.setAttribute("data-view", "preview");

  const mapBtn = document.createElement("button");
  mapBtn.className = "view-toggle-btn";
  mapBtn.textContent = "Doc Map";
  mapBtn.setAttribute("data-view", "docmap");

  bar.appendChild(previewBtn);
  bar.appendChild(mapBtn);

  // Insert before the article
  article.parentElement?.insertBefore(bar, article);

  // Create the doc map container (hidden initially)
  const mapContainer = document.createElement("div");
  mapContainer.className = "doc-map-container";
  mapContainer.style.display = "none";
  mapContainer.innerHTML = `<div class="doc-map-loading">Scanning workspace for .org files...</div>`;
  article.parentElement?.insertBefore(mapContainer, article.nextSibling);

  previewBtn.addEventListener("click", () => {
    previewBtn.classList.add("active");
    mapBtn.classList.remove("active");
    (article as HTMLElement).style.display = "";
    mapContainer.style.display = "none";
  });

  mapBtn.addEventListener("click", () => {
    mapBtn.classList.add("active");
    previewBtn.classList.remove("active");
    (article as HTMLElement).style.display = "none";
    mapContainer.style.display = "";

    if (!docMapLoaded) {
      docMapLoaded = true;
      vscode.postMessage({ command: "scanOrgFiles" });
    }
  });
}

// ─── 7. Message Listener (Doc Map Data) ──────────────────────────

interface OrgFileEntry {
  name: string;
  path: string;
  layer: "strategic" | "quickref" | "other";
  dir: string;
}

function setupMessageListener(): void {
  window.addEventListener("message", (event) => {
    const message = event.data;
    if (message.command === "orgFileMap") {
      renderDocMap(message.files as OrgFileEntry[]);
    }
  });
}

function renderDocMap(files: OrgFileEntry[]): void {
  const container = document.querySelector(".doc-map-container");
  if (!container) return;

  const article = document.querySelector(".org-preview") as HTMLElement | null;
  const currentFile = article?.dataset.currentFile || "";

  const strategic = files.filter((f) => f.layer === "strategic");
  const quickrefs = files.filter((f) => f.layer === "quickref");
  const other = files.filter((f) => f.layer === "other");

  // Group quickrefs by directory
  const qrByDir = new Map<string, OrgFileEntry[]>();
  for (const f of quickrefs) {
    const group = qrByDir.get(f.dir) || [];
    group.push(f);
    qrByDir.set(f.dir, group);
  }

  // Group other files by directory
  const otherByDir = new Map<string, OrgFileEntry[]>();
  for (const f of other) {
    const key = f.dir || "(root)";
    const group = otherByDir.get(key) || [];
    group.push(f);
    otherByDir.set(key, group);
  }

  let html = `<div class="doc-map">`;
  html += `<h2 class="doc-map-title">Documentation Map</h2>`;
  html += `<p class="doc-map-subtitle">${files.length} .org files in workspace</p>`;

  // Strategic layer
  if (strategic.length > 0) {
    html += `<div class="doc-map-section">`;
    html += `<div class="doc-map-section-header">`;
    html += `<span class="doc-map-layer-badge layer-strategic">Strategic</span>`;
    html += `<span class="doc-map-section-desc">Root-level documentation</span>`;
    html += `</div>`;
    html += `<div class="doc-map-tree">`;
    for (const f of strategic) {
      const active = f.path === currentFile ? " doc-map-active" : "";
      html += `<a class="doc-map-file doc-map-file-strategic${active}" data-path="${esc(f.path)}" title="${esc(f.path)}">`;
      html += `<span class="doc-map-icon">&#128196;</span>`;
      html += `<span class="doc-map-name">${esc(f.name)}</span>`;
      if (f.dir) html += `<span class="doc-map-dir">${esc(f.dir)}/</span>`;
      html += `</a>`;
    }
    html += `</div></div>`;
  }

  // Quick reference layer
  if (qrByDir.size > 0) {
    html += `<div class="doc-map-section">`;
    html += `<div class="doc-map-section-header">`;
    html += `<span class="doc-map-layer-badge layer-quickref">Quick Reference</span>`;
    html += `<span class="doc-map-section-desc">Module-level detail docs</span>`;
    html += `</div>`;
    html += `<div class="doc-map-tree">`;

    for (const [dir, dirFiles] of qrByDir) {
      html += `<div class="doc-map-dir-group">`;
      html += `<div class="doc-map-dir-label">`;
      html += `<span class="doc-map-icon">&#128193;</span>`;
      html += `<span>${esc(dir)}/</span>`;
      html += `</div>`;

      for (const f of dirFiles) {
        const active = f.path === currentFile ? " doc-map-active" : "";
        html += `<a class="doc-map-file doc-map-file-quickref${active}" data-path="${esc(f.path)}" title="${esc(f.path)}">`;
        html += `<span class="doc-map-connector"></span>`;
        html += `<span class="doc-map-icon">&#128196;</span>`;
        html += `<span class="doc-map-name">${esc(f.name)}</span>`;
        html += `</a>`;
      }
      html += `</div>`;
    }
    html += `</div></div>`;
  }

  // Other files
  if (other.length > 0) {
    html += `<div class="doc-map-section">`;
    html += `<div class="doc-map-section-header">`;
    html += `<span class="doc-map-layer-badge layer-other">Other</span>`;
    html += `<span class="doc-map-section-desc">Additional .org files</span>`;
    html += `</div>`;
    html += `<div class="doc-map-tree">`;

    for (const [dir, dirFiles] of otherByDir) {
      if (dir !== "(root)") {
        html += `<div class="doc-map-dir-group">`;
        html += `<div class="doc-map-dir-label">`;
        html += `<span class="doc-map-icon">&#128193;</span>`;
        html += `<span>${esc(dir)}/</span>`;
        html += `</div>`;
      }

      for (const f of dirFiles) {
        const active = f.path === currentFile ? " doc-map-active" : "";
        const indent = dir !== "(root)" ? `<span class="doc-map-connector"></span>` : "";
        html += `<a class="doc-map-file doc-map-file-other${active}" data-path="${esc(f.path)}" title="${esc(f.path)}">`;
        html += indent;
        html += `<span class="doc-map-icon">&#128196;</span>`;
        html += `<span class="doc-map-name">${esc(f.name)}</span>`;
        if (dir === "(root)" && f.dir) {
          html += `<span class="doc-map-dir">${esc(f.dir)}/</span>`;
        }
        html += `</a>`;
      }

      if (dir !== "(root)") {
        html += `</div>`;
      }
    }
    html += `</div></div>`;
  }

  if (files.length === 0) {
    html += `<p class="doc-map-empty">No .org files found in the workspace.</p>`;
  }

  html += `</div>`;
  container.innerHTML = html;

  // Attach click handlers to file links
  container.querySelectorAll<HTMLElement>(".doc-map-file").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const path = el.dataset.path;
      if (path) {
        vscode.postMessage({ command: "openFile", path });
      }
    });
  });
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── 8. Scroll Spy ──────────────────────────────────────────────

function setupScrollSpy(): void {
  const headings = document.querySelectorAll<HTMLElement>(".section-heading");
  if (headings.length === 0) return;

  let ticking = false;

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveTocItem(headings);
        ticking = false;
      });
      ticking = true;
    }
  });

  updateActiveTocItem(headings);
}

function updateActiveTocItem(headings: NodeListOf<HTMLElement>): void {
  let current: HTMLElement | null = null;

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const rect = heading.getBoundingClientRect();
    const stickyTop = parseFloat(heading.style.top) || 0;
    if (rect.top <= stickyTop + 10) {
      current = heading;
    }
  }

  document.querySelectorAll(".toc-item.active").forEach((el) => {
    el.classList.remove("active");
  });

  if (current) {
    const id = current.getAttribute("data-toc-id");
    const tocItem = document.querySelector(
      `.toc-item[data-toc-id="${id}"]`
    );
    if (tocItem) {
      tocItem.classList.add("active");
      tocItem.scrollIntoView({ block: "nearest" });
    }
  }
}
