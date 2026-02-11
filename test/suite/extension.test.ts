import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Integration Test Suite", () => {
  test("Extension should be present", () => {
    const extension = vscode.extensions.getExtension("johannes-exe-or-something.org-viewer");
    assert.ok(extension, "Extension should be installed");
  });

  test("Extension should activate", async () => {
    const extension = vscode.extensions.getExtension("johannes-exe-or-something.org-viewer");
    assert.ok(extension, "Extension should be installed");

    await extension.activate();
    assert.strictEqual(extension.isActive, true, "Extension should be active");
  });

  test("showPreview command should be registered", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("orgViewer.showPreview"),
      "orgViewer.showPreview command should be registered"
    );
  });

  test("showPreviewToSide command should be registered", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("orgViewer.showPreviewToSide"),
      "orgViewer.showPreviewToSide command should be registered"
    );
  });
});
