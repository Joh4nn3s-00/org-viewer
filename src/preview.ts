import * as vscode from "vscode";
import { orgToHtml } from "./orgParser";
import { getNonce, getUri } from "./util";

const previewPanels = new Map<string, vscode.WebviewPanel>();

// Track the most recently created "side" preview panel so it can
// follow the active editor when the user switches .org files.
let activeFollowPanel: vscode.WebviewPanel | null = null;
let activeFollowKey: string | null = null;

/**
 * Show or reveal a preview panel for the given document.
 * If `beside` is true, opens in a split column.
 */
export async function showPreview(
  document: vscode.TextDocument,
  extensionUri: vscode.Uri,
  beside: boolean
): Promise<void> {
  const key = document.uri.toString();
  const existing = previewPanels.get(key);

  if (existing) {
    existing.reveal(beside ? vscode.ViewColumn.Beside : undefined);
    await updatePreview(existing, document, extensionUri);
    return;
  }

  // If there's already a follow panel open, reuse it for the new file
  if (beside && activeFollowPanel) {
    // Remove old key mapping
    if (activeFollowKey) {
      previewPanels.delete(activeFollowKey);
    }
    previewPanels.set(key, activeFollowPanel);
    activeFollowKey = key;
    await updatePreview(activeFollowPanel, document, extensionUri);
    return;
  }

  const column = beside
    ? vscode.ViewColumn.Beside
    : vscode.ViewColumn.Active;

  const panel = vscode.window.createWebviewPanel(
    "orgPreview",
    `Preview: ${fileName(document)}`,
    column,
    {
      enableScripts: false,
      localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
    }
  );

  previewPanels.set(key, panel);

  if (beside) {
    activeFollowPanel = panel;
    activeFollowKey = key;
  }

  panel.onDidDispose(() => {
    previewPanels.delete(key);
    if (activeFollowPanel === panel) {
      activeFollowPanel = null;
      activeFollowKey = null;
    }
  });

  await updatePreview(panel, document, extensionUri);
}

/**
 * Update the preview panel content for a given document.
 */
export async function updatePreview(
  panel: vscode.WebviewPanel,
  document: vscode.TextDocument,
  extensionUri: vscode.Uri
): Promise<void> {
  const html = await orgToHtml(document.getText());
  panel.title = `Preview: ${fileName(document)}`;
  panel.webview.html = getWebviewContent(panel.webview, extensionUri, html);
}

/**
 * If a preview panel exists for the given document URI, update it.
 */
export async function updatePreviewIfVisible(
  document: vscode.TextDocument,
  extensionUri: vscode.Uri
): Promise<void> {
  const panel = previewPanels.get(document.uri.toString());
  if (panel) {
    await updatePreview(panel, document, extensionUri);
  }
}

/**
 * When the active editor changes to a different .org file,
 * update the follow panel to show the new file's preview.
 */
export async function followActiveEditor(
  document: vscode.TextDocument,
  extensionUri: vscode.Uri
): Promise<void> {
  if (!activeFollowPanel) return;

  const key = document.uri.toString();

  // Already showing this document
  if (activeFollowKey === key) return;

  // Remap the panel to the new document
  if (activeFollowKey) {
    previewPanels.delete(activeFollowKey);
  }
  previewPanels.set(key, activeFollowPanel);
  activeFollowKey = key;

  await updatePreview(activeFollowPanel, document, extensionUri);
}

/**
 * Build the full HTML page to inject into the webview.
 */
function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  bodyHtml: string
): string {
  const cssUri = getUri(webview, extensionUri, ["media", "preview.css"]);
  const nonce = getNonce();

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}';"
  />
  <link rel="stylesheet" href="${cssUri}" />
  <title>Org Preview</title>
</head>
<body>
  <article class="org-preview">
    ${bodyHtml}
  </article>
</body>
</html>`;
}

function fileName(doc: vscode.TextDocument): string {
  const parts = doc.uri.path.split("/");
  return parts[parts.length - 1];
}
