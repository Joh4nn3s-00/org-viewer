import * as vscode from "vscode";
import { PreviewManager } from "./preview";

const UPDATE_DEBOUNCE_MS = 300;

export function activate(context: vscode.ExtensionContext): void {
  const previews = new PreviewManager(context.extensionUri);

  context.subscriptions.push(
    vscode.commands.registerCommand("orgViewer.showPreview", () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === "org") {
        previews.show(editor.document, false);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("orgViewer.showPreviewToSide", () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === "org") {
        previews.show(editor.document, true);
      }
    })
  );

  // Debounced live-update on document edits
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === "org") {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          previews.updateIfVisible(event.document);
        }, UPDATE_DEBOUNCE_MS);
      }
    })
  );

  // Follow active editor to new .org files
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.languageId === "org") {
        previews.followActiveEditor(editor.document);
      }
    })
  );

  context.subscriptions.push({ dispose: () => clearTimeout(debounceTimer) });
}

export function deactivate(): void {
  // Nothing to clean up — panel disposal is handled by VS Code
}
