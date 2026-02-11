import * as vscode from "vscode";
import { orgToHtml } from "./orgParser";
import { getNonce, getUri } from "./util";

/**
 * Manages webview preview panels for .org documents.
 * Tracks one panel per document URI and supports a "follow" panel
 * that automatically switches to whichever .org file is active.
 */
export class PreviewManager {
  private readonly panels = new Map<string, vscode.WebviewPanel>();
  private readonly extensionUri: vscode.Uri;
  private followPanel: vscode.WebviewPanel | null = null;
  private followKey: string | null = null;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  async show(document: vscode.TextDocument, beside: boolean): Promise<void> {
    const key = document.uri.toString();
    const existing = this.panels.get(key);

    if (existing) {
      existing.reveal(beside ? vscode.ViewColumn.Beside : undefined);
      await this.update(existing, document);
      return;
    }

    // Reuse the follow panel for a different file
    if (beside && this.followPanel) {
      if (this.followKey) {
        this.panels.delete(this.followKey);
      }
      this.panels.set(key, this.followPanel);
      this.followKey = key;
      await this.update(this.followPanel, document);
      return;
    }

    const column = beside ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active;

    const panel = vscode.window.createWebviewPanel(
      "orgPreview",
      `Preview: ${fileName(document)}`,
      column,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
      }
    );

    this.panels.set(key, panel);

    if (beside) {
      this.followPanel = panel;
      this.followKey = key;
    }

    panel.onDidDispose(() => {
      this.panels.delete(key);
      if (this.followPanel === panel) {
        this.followPanel = null;
        this.followKey = null;
      }
    });

    await this.update(panel, document);
  }

  async updateIfVisible(document: vscode.TextDocument): Promise<void> {
    const panel = this.panels.get(document.uri.toString());
    if (panel) {
      await this.update(panel, document);
    }
  }

  async followActiveEditor(document: vscode.TextDocument): Promise<void> {
    if (!this.followPanel) return;

    const key = document.uri.toString();
    if (this.followKey === key) return;

    if (this.followKey) {
      this.panels.delete(this.followKey);
    }
    this.panels.set(key, this.followPanel);
    this.followKey = key;

    await this.update(this.followPanel, document);
  }

  private async update(
    panel: vscode.WebviewPanel,
    document: vscode.TextDocument
  ): Promise<void> {
    const html = await orgToHtml(document.getText());
    panel.title = `Preview: ${fileName(document)}`;
    panel.webview.html = buildWebviewHtml(panel.webview, this.extensionUri, html);
  }
}

function buildWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  bodyHtml: string
): string {
  const cssUri = getUri(webview, extensionUri, ["media", "preview.css"]);
  const jsUri = getUri(webview, extensionUri, ["media", "preview.js"]);
  const nonce = getNonce();

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';"
  />
  <link rel="stylesheet" href="${cssUri}" />
  <title>Org Preview</title>
</head>
<body>
  <article class="org-preview">
    ${bodyHtml}
  </article>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
}

function fileName(doc: vscode.TextDocument): string {
  const parts = doc.uri.path.split("/");
  return parts[parts.length - 1];
}
