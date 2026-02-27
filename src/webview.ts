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
 * 8. Template tab — documentation philosophy with copy-to-clipboard
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
  setupAnchorLinks();
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
  const article = document.querySelector(".doc-preview");
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
      section.className = `doc-section org-level-${level}`;

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
      heading.closest(".doc-section")?.parentElement?.closest(".doc-section") ??
      null;

    while (ancestor) {
      const parentHeading = ancestor.querySelector(
        ":scope > .section-heading"
      ) as HTMLElement | null;
      if (parentHeading) {
        top += parentHeading.offsetHeight;
      }
      ancestor =
        ancestor.parentElement?.closest(".doc-section") ?? null;
    }

    heading.style.top = `${top}px`;
  });
}

// ─── 4. File Reference Detection & Styling ───────────────────────

const FILE_TYPE_MAP: Record<string, string> = {};
["org", "md"].forEach((e) => (FILE_TYPE_MAP[e] = "org"));
["mdx", "rst", "txt"].forEach((e) => (FILE_TYPE_MAP[e] = "doc"));
["py", "js", "ts", "tsx", "jsx", "rs", "go", "java", "c", "cpp", "h", "rb",
 "php", "swift", "kt", "cs", "sh", "bash", "zsh", "lua", "r", "pl", "ex",
 "exs", "hs", "ml", "scala", "clj"].forEach((e) => (FILE_TYPE_MAP[e] = "code"));
["json", "yaml", "yml", "toml", "xml", "html", "css", "scss", "less", "ini",
 "cfg", "conf", "env", "sql"].forEach((e) => (FILE_TYPE_MAP[e] = "config"));

const FILE_REF_PATTERN =
  /(?:(?:[\w.*-]+\/)*[\w.*-]+\.(?:org|md|mdx|py|js|ts|tsx|jsx|rs|go|java|c|cpp|h|rb|php|swift|kt|cs|sh|bash|zsh|lua|r|pl|ex|exs|hs|ml|scala|clj|json|yaml|yml|toml|xml|html|css|scss|less|ini|cfg|conf|env|sql|rst|txt)(?::\d+)?)/g;

function linkifyFileReferences(): void {
  const article = document.querySelector(".doc-preview");
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
  nav.className = "doc-toc";

  const header = document.createElement("div");
  header.className = "toc-header";

  const headerTitle = document.createElement("span");
  headerTitle.textContent = "Contents";
  header.appendChild(headerTitle);

  const article = document.querySelector(".doc-preview") as HTMLElement | null;
  const tokenCount = article?.dataset.tokenCount;
  if (tokenCount && tokenCount !== "0") {
    const badge = document.createElement("span");
    badge.className = "toc-token-count";
    badge.textContent = formatTokenCount(parseInt(tokenCount, 10)) + " tokens";
    badge.title = `${parseInt(tokenCount, 10).toLocaleString()} tokens (cl100k estimate)`;
    header.appendChild(badge);
  }

  const collapseBtn = document.createElement("span");
  collapseBtn.className = "toc-collapse-btn";
  collapseBtn.textContent = "\u00AB"; // «
  collapseBtn.title = "Collapse sidebar";
  collapseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const collapsed = nav.classList.toggle("toc-collapsed");
    document.body.classList.toggle("toc-collapsed", collapsed);
    collapseBtn.textContent = collapsed ? "\u00BB" : "\u00AB"; // » or «
    collapseBtn.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
  });
  header.appendChild(collapseBtn);

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

// ─── 6. View Toggle (Preview / Doc Map / Template) ──────────────

let docMapLoaded = false;
let templateLoaded = false;
let templateRawOrg = "";

function buildViewToggle(): void {
  const article = document.querySelector(".doc-preview");
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

  const templateBtn = document.createElement("button");
  templateBtn.className = "view-toggle-btn";
  templateBtn.textContent = "Template";
  templateBtn.setAttribute("data-view", "template");

  bar.appendChild(previewBtn);
  bar.appendChild(mapBtn);
  bar.appendChild(templateBtn);

  // Insert before the article
  article.parentElement?.insertBefore(bar, article);

  // Create the doc map container (hidden initially)
  const mapContainer = document.createElement("div");
  mapContainer.className = "doc-map-container";
  mapContainer.style.display = "none";
  mapContainer.innerHTML = `<div class="doc-map-loading">Scanning workspace for .org files...</div>`;
  article.parentElement?.insertBefore(mapContainer, article.nextSibling);

  // Create the template container (hidden initially)
  const templateContainer = document.createElement("div");
  templateContainer.className = "template-container";
  templateContainer.style.display = "none";
  templateContainer.innerHTML = `<div class="doc-map-loading">Loading template...</div>`;
  mapContainer.parentElement?.insertBefore(templateContainer, mapContainer.nextSibling);

  const allBtns = [previewBtn, mapBtn, templateBtn];

  function activateTab(activeBtn: HTMLButtonElement) {
    for (const btn of allBtns) btn.classList.remove("active");
    activeBtn.classList.add("active");
    (article as HTMLElement).style.display = "none";
    mapContainer.style.display = "none";
    templateContainer.style.display = "none";
  }

  previewBtn.addEventListener("click", () => {
    activateTab(previewBtn);
    (article as HTMLElement).style.display = "";
  });

  mapBtn.addEventListener("click", () => {
    activateTab(mapBtn);
    mapContainer.style.display = "";

    if (!docMapLoaded) {
      docMapLoaded = true;
      vscode.postMessage({ command: "scanDocFiles" });
    }
  });

  templateBtn.addEventListener("click", () => {
    activateTab(templateBtn);
    templateContainer.style.display = "";

    if (!templateLoaded) {
      templateLoaded = true;
      vscode.postMessage({ command: "getTemplate" });
    }
  });
}

// ─── 7. Message Listener (Doc Map + Template Data) ───────────────

interface DocFileEntry {
  name: string;
  path: string;
  layer: "strategic" | "quickref" | "other";
  dir: string;
  tokens: number;
}

function setupMessageListener(): void {
  window.addEventListener("message", (event) => {
    const message = event.data;
    if (message.command === "docFileMap") {
      renderDocMap(message.files as DocFileEntry[]);
    } else if (message.command === "templateData") {
      templateRawOrg = message.raw as string;
      renderTemplate(message.html as string);
    } else if (message.command === "clipboardCopied") {
      const btn = document.querySelector(".template-copy-btn");
      if (btn) {
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "Copy to Clipboard";
          btn.classList.remove("copied");
        }, 2000);
      }
    }
  });
}

function renderTemplate(html: string): void {
  const container = document.querySelector(".template-container");
  if (!container) return;

  let markup = `<div class="template-copy-bar">`;
  markup += `<span class="template-title">Documentation Philosophy Template</span>`;
  markup += `<button class="template-copy-btn">Copy to Clipboard</button>`;
  markup += `</div>`;
  markup += `<div class="template-content">${html}</div>`;

  container.innerHTML = markup;

  const copyBtn = container.querySelector(".template-copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      vscode.postMessage({ command: "copyToClipboard", text: templateRawOrg });
    });
  }
}

function renderDocMap(files: DocFileEntry[]): void {
  const container = document.querySelector(".doc-map-container");
  if (!container) return;

  const article = document.querySelector(".doc-preview") as HTMLElement | null;
  const currentFile = article?.dataset.currentFile || "";

  const strategic = files.filter((f) => f.layer === "strategic");
  const quickrefs = files.filter((f) => f.layer === "quickref");
  const other = files.filter((f) => f.layer === "other");

  const strategicTotal = strategic.reduce((s, f) => s + f.tokens, 0);
  const quickrefTotal = quickrefs.reduce((s, f) => s + f.tokens, 0);
  const otherTotal = other.reduce((s, f) => s + f.tokens, 0);
  const grandTotal = files.reduce((s, f) => s + f.tokens, 0);

  // Group quickrefs by directory
  const qrByDir = new Map<string, DocFileEntry[]>();
  for (const f of quickrefs) {
    const group = qrByDir.get(f.dir) || [];
    group.push(f);
    qrByDir.set(f.dir, group);
  }

  // Group other files by directory
  const otherByDir = new Map<string, DocFileEntry[]>();
  for (const f of other) {
    const key = f.dir || "(root)";
    const group = otherByDir.get(key) || [];
    group.push(f);
    otherByDir.set(key, group);
  }

  let html = `<div class="doc-map">`;
  html += `<h2 class="doc-map-title">Documentation Map</h2>`;
  html += `<p class="doc-map-subtitle">${files.length} .org files in workspace &middot; ${formatTokenCount(grandTotal)} tokens</p>`;

  // Helper: render token count span for a file
  const tokenSpan = (t: number) =>
    `<span class="doc-map-tokens" title="${t.toLocaleString()} tokens">${formatTokenCount(t)}</span>`;

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
      html += tokenSpan(f.tokens);
      html += `</a>`;
    }
    html += `</div>`;
    html += `<div class="doc-map-subtotal">`;
    html += `<span class="doc-map-subtotal-label">Strategic subtotal</span>`;
    html += `<span class="doc-map-subtotal-value">${formatTokenCount(strategicTotal)}</span>`;
    html += `</div>`;
    html += `</div>`;
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
        html += tokenSpan(f.tokens);
        html += `</a>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
    html += `<div class="doc-map-subtotal">`;
    html += `<span class="doc-map-subtotal-label">Quick Ref subtotal</span>`;
    html += `<span class="doc-map-subtotal-value">${formatTokenCount(quickrefTotal)}</span>`;
    html += `</div>`;
    html += `</div>`;
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
        html += tokenSpan(f.tokens);
        html += `</a>`;
      }

      if (dir !== "(root)") {
        html += `</div>`;
      }
    }
    html += `</div>`;
    html += `<div class="doc-map-subtotal">`;
    html += `<span class="doc-map-subtotal-label">Other subtotal</span>`;
    html += `<span class="doc-map-subtotal-value">${formatTokenCount(otherTotal)}</span>`;
    html += `</div>`;
    html += `</div>`;
  }

  if (files.length === 0) {
    html += `<p class="doc-map-empty">No .org files found in the workspace.</p>`;
  }

  // Grand total
  if (files.length > 0) {
    html += `<div class="doc-map-grand-total">`;
    html += `<span class="doc-map-grand-total-label">Total</span>`;
    html += `<span class="doc-map-grand-total-value">${formatTokenCount(grandTotal)}</span>`;
    html += `</div>`;
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

// ─── 9. Internal Anchor Links ────────────────────────────────────

function setupAnchorLinks(): void {
  document.addEventListener("click", (e) => {
    const link = (e.target as HTMLElement).closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return;

    const targetId = href.slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    // Expand any collapsed ancestor sections so the target is visible
    let ancestor: Element | null = target.closest(".doc-section");
    while (ancestor) {
      const body = ancestor.querySelector(":scope > .section-body");
      if (body?.classList.contains("collapsed")) {
        body.classList.remove("collapsed");
        ancestor.classList.remove("is-collapsed");
        const toggle = ancestor.querySelector(":scope > .section-heading .section-toggle");
        if (toggle) toggle.textContent = "\u25BC";
      }
      ancestor = ancestor.parentElement?.closest(".doc-section") ?? null;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
