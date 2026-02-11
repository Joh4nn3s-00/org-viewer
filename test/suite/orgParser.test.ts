import * as assert from "assert";

// Use the esbuild-bundled parser (tests are bundled to out/test/)
import { orgToHtml } from "../../src/orgParser";

suite("Org Parser Test Suite", () => {
  test("should convert heading level 1", async () => {
    const result = await orgToHtml("* Heading 1");
    assert.ok(result.includes("<h1"));
    assert.ok(result.includes("Heading 1"));
  });

  test("should convert heading level 2", async () => {
    const result = await orgToHtml("** Heading 2");
    assert.ok(result.includes("<h2"));
    assert.ok(result.includes("Heading 2"));
  });

  test("should convert heading level 3", async () => {
    const result = await orgToHtml("*** Heading 3");
    assert.ok(result.includes("<h3"));
    assert.ok(result.includes("Heading 3"));
  });

  test("should convert bold text", async () => {
    const result = await orgToHtml("*bold text*");
    assert.ok(result.includes("<b>") || result.includes("<strong>"));
    assert.ok(result.includes("bold text"));
  });

  test("should convert italic text", async () => {
    const result = await orgToHtml("/italic text/");
    assert.ok(result.includes("<i>") || result.includes("<em>"));
    assert.ok(result.includes("italic text"));
  });

  test("should convert code text", async () => {
    const result = await orgToHtml("~code text~");
    assert.ok(result.includes("<code>"));
    assert.ok(result.includes("code text"));
  });

  test("should convert unordered list", async () => {
    const result = await orgToHtml("- Item 1\n- Item 2\n- Item 3");
    assert.ok(result.includes("<ul"));
    assert.ok(result.includes("<li"));
    assert.ok(result.includes("Item 1"));
  });

  test("should convert ordered list", async () => {
    const result = await orgToHtml("1. First item\n2. Second item");
    assert.ok(result.includes("<ol"));
    assert.ok(result.includes("<li"));
    assert.ok(result.includes("First item"));
  });

  test("should convert links", async () => {
    const result = await orgToHtml("[[https://example.com][Example Link]]");
    assert.ok(result.includes("<a"));
    assert.ok(result.includes("https://example.com"));
    assert.ok(result.includes("Example Link"));
  });

  test("should convert code blocks", async () => {
    const result = await orgToHtml("#+BEGIN_SRC javascript\nconst x = 1;\n#+END_SRC");
    assert.ok(result.includes("<pre"));
    assert.ok(result.includes("<code"));
    assert.ok(result.includes("const x = 1;"));
  });

  test("should convert tables", async () => {
    const result = await orgToHtml("| Header 1 | Header 2 |\n|----------+----------|\n| Cell 1   | Cell 2   |");
    assert.ok(result.includes("<table"));
    assert.ok(result.includes("Header 1"));
    assert.ok(result.includes("Cell 1"));
  });

  test("should convert horizontal rules", async () => {
    const result = await orgToHtml("-----");
    assert.ok(result.includes("<hr"));
  });

  test("should convert blockquotes", async () => {
    const result = await orgToHtml("#+BEGIN_QUOTE\nThis is a quote\n#+END_QUOTE");
    assert.ok(result.includes("<blockquote"));
    assert.ok(result.includes("This is a quote"));
  });

  test("should handle empty input", async () => {
    const result = await orgToHtml("");
    assert.strictEqual(typeof result, "string");
  });

  test("should handle plain text", async () => {
    const result = await orgToHtml("This is plain text without any formatting.");
    assert.ok(result.includes("This is plain text"));
  });

  // orgMetadata plugin tests

  test("should render checkboxes", async () => {
    const result = await orgToHtml("- [X] Done task\n- [ ] Open task\n- [-] Partial task");
    assert.ok(result.includes("\u2611"), "should contain checked checkbox");
    assert.ok(result.includes("\u2610"), "should contain unchecked checkbox");
    assert.ok(result.includes("\u2612"), "should contain partial checkbox");
  });

  test("should render #+TITLE keyword", async () => {
    const result = await orgToHtml("#+TITLE: My Document");
    assert.ok(result.includes("TITLE"));
    assert.ok(result.includes("My Document"));
  });

  test("should render planning lines", async () => {
    const result = await orgToHtml("* TODO Task\nSCHEDULED: <2026-02-11 Tue>");
    assert.ok(result.includes("SCHEDULED"));
  });

  test("should flatten subscripts in plain text", async () => {
    const result = await orgToHtml("The file quick_reference.org is useful.");
    assert.ok(!result.includes("<sub>"), "should not contain subscript tags");
    assert.ok(result.includes("quick_reference"), "should preserve underscore text");
  });

  test("should render display math as block", async () => {
    const result = await orgToHtml("$$E=mc^2$$");
    assert.ok(result.includes("math-display"), "should render as display math");
  });
});
