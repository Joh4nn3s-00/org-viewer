import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify, { allowDangerousHtml: true });

/**
 * Parse Markdown text and return an HTML string.
 */
export async function mdToHtml(mdText: string): Promise<string> {
  try {
    const result = await processor.process(mdText);
    return String(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return `<div class="parse-error">
      <h3>Markdown Preview Error</h3>
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
