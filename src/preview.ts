import * as vscode from "vscode";
import { orgToHtml } from "./orgParser";
import { countTokens } from "./tokenCount";
import { getNonce, getUri } from "./util";

/** Describes an .org file found in the workspace. */
interface OrgFileEntry {
  /** Display name (e.g. "README.org") */
  name: string;
  /** Relative path from workspace root (e.g. "workers/quick_reference.org") */
  path: string;
  /** Classification: "strategic" (root-level), "quickref", or "other" */
  layer: "strategic" | "quickref" | "other";
  /** Parent directory name (e.g. "workers") or "" for root */
  dir: string;
}

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

    this.setupMessageHandler(panel);
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

  private setupMessageHandler(panel: vscode.WebviewPanel): void {
    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "openFile" && message.path) {
        await this.openReferencedFile(message.path);
      } else if (message.command === "scanOrgFiles") {
        const files = await this.discoverOrgFiles();
        panel.webview.postMessage({ command: "orgFileMap", files });
      }
    });
  }

  private async openReferencedFile(refPath: string): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    for (const folder of workspaceFolders) {
      const uri = vscode.Uri.joinPath(folder.uri, refPath);
      try {
        await vscode.workspace.fs.stat(uri);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
        return;
      } catch {
        // File not found in this folder, try next
      }
    }

    const results = await vscode.workspace.findFiles(
      `**/${refPath}`,
      "**/node_modules/**",
      1
    );
    if (results.length > 0) {
      const doc = await vscode.workspace.openTextDocument(results[0]);
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
    }
  }

  private async discoverOrgFiles(): Promise<OrgFileEntry[]> {
    const results = await vscode.workspace.findFiles(
      "**/*.org",
      "{**/node_modules/**,**/.vscode-test/**,**/dist/**,**/out/**}",
      200
    );

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
    if (!workspaceRoot) return [];

    const entries: OrgFileEntry[] = [];

    for (const uri of results) {
      const relPath = vscode.workspace.asRelativePath(uri, false);
      const parts = relPath.split("/");
      const name = parts[parts.length - 1];
      const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";

      let layer: OrgFileEntry["layer"] = "other";

      if (name === "quick_reference.org") {
        layer = "quickref";
      } else if (
        parts.length === 1 ||
        (parts.length === 2 && /^[A-Z][A-Z_]*\.org$/.test(name))
      ) {
        // Root-level file or ALL_CAPS file one level deep
        layer = "strategic";
      }

      entries.push({ name, path: relPath, layer, dir });
    }

    // Sort: strategic first, then quickrefs by dir, then other
    entries.sort((a, b) => {
      const layerOrder = { strategic: 0, quickref: 1, other: 2 };
      const ld = layerOrder[a.layer] - layerOrder[b.layer];
      if (ld !== 0) return ld;
      return a.path.localeCompare(b.path);
    });

    return entries;
  }

  private async update(
    panel: vscode.WebviewPanel,
    document: vscode.TextDocument
  ): Promise<void> {
    const rawText = document.getText();
    const html = await orgToHtml(rawText);
    const tokens = countTokens(rawText);
    const docUri = document.uri.toString();
    const currentFile = vscode.workspace.asRelativePath(document.uri, false);
    panel.title = `Preview: ${fileName(document)}`;
    panel.webview.html = buildWebviewHtml(
      panel.webview, this.extensionUri, html, tokens, docUri, currentFile
    );
  }
}

function buildWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  bodyHtml: string,
  tokenCount: number,
  docUri: string,
  currentFile: string
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
  <article class="org-preview"
    data-token-count="${tokenCount}"
    data-doc-uri="${escapeAttr(docUri)}"
    data-current-file="${escapeAttr(currentFile)}">
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

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
