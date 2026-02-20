import { orgToHtml } from "./orgParser";
import { mdToHtml } from "./mdParser";

/** Supported language IDs for the preview. */
export const SUPPORTED_LANGUAGES = new Set(["org", "markdown"]);

/**
 * Parse document text to HTML, dispatching to the correct parser
 * based on the VS Code languageId.
 */
export function parseToHtml(text: string, languageId: string): Promise<string> {
  switch (languageId) {
    case "org":
      return orgToHtml(text);
    case "markdown":
      return mdToHtml(text);
    default:
      return Promise.resolve(
        `<div class="parse-error"><h3>Unsupported format: ${languageId}</h3></div>`
      );
  }
}
