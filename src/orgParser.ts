import { unified } from "unified";
import uniorgParse from "uniorg-parse";
import uniorgMetadata from "./orgMetadata";
import uniorg2rehype from "uniorg-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import type { Root, RootContent } from "hast";

// Node types that uniorg-rehype may leave unconverted in the hast tree.
// rehype-raw needs to be told to pass these through instead of crashing.
const passthroughNodeTypes = [
  "export-snippet",
  "export-block",
  "inline-src-block",
  "statistics-cookie",
  "diary-sexp",
  "citation",
  "citation-reference",
  "citation-common-prefix",
  "citation-common-suffix",
  "citation-prefix",
  "citation-suffix",
  "citation-key",
];

/**
 * Rehype plugin that removes unknown node types from the tree
 * so that rehype-stringify doesn't choke on them.
 */
function rehypeCleanUnknownNodes() {
  const knownTypes = new Set([
    "root",
    "element",
    "text",
    "comment",
    "doctype",
    "raw",
  ]);

  function clean(node: any): any {
    if (!node) return node;
    if (node.children) {
      node.children = node.children
        .map((child: any) => {
          if (!knownTypes.has(child.type)) {
            // Convert unknown nodes: if they have a value, make them text nodes
            if (typeof child.value === "string") {
              return { type: "text" as const, value: child.value };
            }
            // If they have children, splice the children in
            if (child.children) {
              return child.children.map(clean);
            }
            return null;
          }
          return clean(child);
        })
        .flat()
        .filter(Boolean);
    }
    return node;
  }

  return (tree: Root) => {
    clean(tree);
  };
}

const processor = unified()
  .use(uniorgParse)
  .use(uniorgMetadata)
  .use(uniorg2rehype)
  .use(rehypeRaw, { passThrough: passthroughNodeTypes })
  .use(rehypeCleanUnknownNodes)
  .use(rehypeStringify, { allowDangerousHtml: true });

/**
 * Parse Org-mode text and return an HTML string.
 */
export async function orgToHtml(orgText: string): Promise<string> {
  try {
    const result = await processor.process(orgText);
    return String(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return `<div class="org-error">
      <h3>Org Preview Error</h3>
      <pre>${escapeHtml(message)}</pre>
    </div>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
