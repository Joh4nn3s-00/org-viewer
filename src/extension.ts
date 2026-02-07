import * as vscode from "vscode";
import { showPreview, updatePreviewIfVisible, followActiveEditor } from "./preview";

export function activate(context: vscode.ExtensionContext): void {
  // Command: Open preview in the current column
  context.subscriptions.push(
    vscode.commands.registerCommand("orgViewer.showPreview", () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === "org") {
        showPreview(editor.document, context.extensionUri, false);
      }
    })
  );

  // Command: Open preview to the side (split view)
  context.subscriptions.push(
    vscode.commands.registerCommand("orgViewer.showPreviewToSide", () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === "org") {
        showPreview(editor.document, context.extensionUri, true);
      }
    })
  );

  // Live-update the preview when the document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === "org") {
        updatePreviewIfVisible(event.document, context.extensionUri);
      }
    })
  );

  // Update preview when the active editor changes — follow to new .org files
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.languageId === "org") {
        followActiveEditor(editor.document, context.extensionUri);
      }
    })
  );
}

export function deactivate(): void {
  // Nothing to clean up — panel disposal is handled by VS Code
}
