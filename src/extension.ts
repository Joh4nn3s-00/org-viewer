import * as vscode from "vscode";
import { PreviewManager } from "./preview";
import { SUPPORTED_LANGUAGES } from "./parsers";

const UPDATE_DEBOUNCE_MS = 300;

function isSupported(doc: vscode.TextDocument): boolean {
  return SUPPORTED_LANGUAGES.has(doc.languageId);
}

export function activate(context: vscode.ExtensionContext): void {
  const previews = new PreviewManager(context.extensionUri);

  context.subscriptions.push(
    vscode.commands.registerCommand("docViewer.showPreview", () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && isSupported(editor.document)) {
        previews.show(editor.document, false);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("docViewer.showPreviewToSide", () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && isSupported(editor.document)) {
        previews.show(editor.document, true);
      }
    })
  );

  // Debounced live-update on document edits
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (isSupported(event.document)) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          previews.updateIfVisible(event.document);
        }, UPDATE_DEBOUNCE_MS);
      }
    })
  );

  // Follow active editor to new .org / .md files
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && isSupported(editor.document)) {
        previews.followActiveEditor(editor.document);
      }
    })
  );

  context.subscriptions.push({ dispose: () => clearTimeout(debounceTimer) });
}

export function deactivate(): void {
  // Nothing to clean up — panel disposal is handled by VS Code
}
