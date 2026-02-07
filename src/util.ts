import * as vscode from "vscode";
import * as crypto from "crypto";

/**
 * Generate a nonce string for Content Security Policy in webviews.
 */
export function getNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Get a webview-safe URI for a local resource.
 */
export function getUri(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  pathSegments: string[]
): vscode.Uri {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathSegments));
}
