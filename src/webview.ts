/**
 * Webview-side script for the Org Preview panel.
 * Runs in the browser context (VS Code webview iframe).
 *
 * Features:
 * 1. Syntax highlighting for code blocks (highlight.js)
 * 2. Collapsible sections with toggle chevrons
 * 3. Stacked sticky headings (sub-headings sit below parent headings)
 * 4. Table of contents sidebar with scroll spy
 */

import hljs from "highlight.js/lib/common";

document.addEventListener("DOMContentLoaded", () => {
  highlightCode();
  buildSections();
  setStickyOffsets();
  buildToc();
  setupScrollSpy();
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
      // Pop stack until we find a parent level (strictly lower number = higher rank)
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      // Create section wrapper
      const section = document.createElement("div");
      section.className = `org-section org-level-${level}`;

      // Add toggle chevron to heading
      const toggle = document.createElement("span");
      toggle.className = "section-toggle";
      toggle.textContent = "\u25BC"; // ▼
      child.insertBefore(toggle, child.firstChild);

      // Make heading clickable for collapse/expand
      child.classList.add("section-heading");
      child.addEventListener("click", (e) => {
        // Don't toggle when clicking links inside headings
        if ((e.target as HTMLElement).closest("a")) return;

        const body = section.querySelector(
          ":scope > .section-body"
        ) as HTMLElement | null;
        if (body) {
          const collapsed = body.classList.toggle("collapsed");
          toggle.textContent = collapsed ? "\u25B6" : "\u25BC"; // ▶ or ▼
          section.classList.toggle("is-collapsed", collapsed);
        }
      });

      section.appendChild(child);

      // Create body wrapper for section content
      const body = document.createElement("div");
      body.className = "section-body";
      section.appendChild(body);

      // Attach to parent section or root
      if (stack.length > 0) {
        stack[stack.length - 1].body.appendChild(section);
      } else {
        fragment.appendChild(section);
      }

      stack.push({ level, body });
    } else {
      // Non-heading element: append to current section body or root
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
// Each heading's `top` = sum of all ancestor sticky heading heights,
// so sub-headings sit below their parent instead of overlapping.

function setStickyOffsets(): void {
  const headings = document.querySelectorAll<HTMLElement>(".section-heading");

  headings.forEach((heading, index) => {
    // Tag each heading with an ID for TOC linking
    heading.setAttribute("data-toc-id", String(index));

    // Walk up the section tree to find ancestor headings
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

// ─── 4. Table of Contents Sidebar ────────────────────────────────

function buildToc(): void {
  const headings = document.querySelectorAll<HTMLElement>(".section-heading");
  if (headings.length === 0) return;

  const nav = document.createElement("nav");
  nav.className = "org-toc";

  const header = document.createElement("div");
  header.className = "toc-header";
  header.textContent = "Contents";
  nav.appendChild(header);

  const list = document.createElement("div");
  list.className = "toc-items";

  headings.forEach((heading) => {
    const id = heading.getAttribute("data-toc-id") || "";
    const level = headingLevel(heading);

    // Get heading text without the toggle chevron
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

// ─── 5. Scroll Spy ──────────────────────────────────────────────

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

  // Initial highlight
  updateActiveTocItem(headings);
}

function updateActiveTocItem(headings: NodeListOf<HTMLElement>): void {
  let current: HTMLElement | null = null;

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const rect = heading.getBoundingClientRect();
    const stickyTop = parseFloat(heading.style.top) || 0;
    // Heading is "active" once it reaches or passes its sticky position
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
