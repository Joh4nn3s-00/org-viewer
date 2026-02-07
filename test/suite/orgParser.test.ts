import * as assert from "assert";
import { orgToHtml } from "../../src/orgParser";

suite("Org Parser Test Suite", () => {
  test("should convert heading level 1", async () => {
    const input = "* Heading 1";
    const result = await orgToHtml(input);
    assert.ok(result.includes("<h1"));
    assert.ok(result.includes("Heading 1"));
  });

  test("should convert heading level 2", async () => {
    const input = "** Heading 2";
    const result = await orgToHtml(input);
    assert.ok(result.includes("<h2"));
    assert.ok(result.includes("Heading 2"));
  });

  test("should convert heading level 3", async () => {
    const input = "*** Heading 3";
    const result = await orgToHtml(input);
    assert.ok(result.includes("<h3"));
    assert.ok(result.includes("Heading 3"));
  });

  test("should convert bold text", async () => {
    const input = "*bold text*";
    const result = await orgToHtml(input);
    assert.ok(result.includes("<strong>") || result.includes("<b>"));
    assert.ok(result.includes("bold text"));
  });

  test("should convert italic text", async () => {
    const input = "/italic text/";
    const result = await orgToHtml(input);
    assert.ok(result.includes("<em>") || result.includes("<i>"));
    assert.ok(result.includes("italic text"));
  });

  test("should convert code text", async () => {
    const input = "~code text~";
    const result = await orgToHtml(input);
    assert.ok(result.includes("<code>"));
    assert.ok(result.includes("code text"));
  });

  test("should convert unordered list", async () => {
    const input = "- Item 1\n- Item 2\n- Item 3";
    const result = await orgToHtml(input);
    assert.ok(result.includes("<ul"));
    assert.ok(result.includes("<li"));
    assert.ok(result.includes("Item 1"));
    assert.ok(result.includes("Item 2"));
  });

  test("should convert ordered list", async () => {
    const input = "1. First item\n2. Second item\n3. Third item";
    const result = await orgToHtml(input);
    assert.ok(result.includes("<ol"));
    assert.ok(result.includes("<li"));
    assert.ok(result.includes("First item"));
    assert.ok(result.includes("Second item"));
  });

  test("should convert links", async () => {
    const input = "[[https://example.com][Example Link]]";
    const result = await orgToHtml(input);
    assert.ok(result.includes("<a"));
    assert.ok(result.includes("href"));
    assert.ok(result.includes("https://example.com"));
    assert.ok(result.includes("Example Link"));
  });

  test("should convert code blocks", async () => {
    const input = "#+BEGIN_SRC javascript\nconst x = 1;\n#+END_SRC";
    const result = await orgToHtml(input);
    assert.ok(result.includes("<pre"));
    assert.ok(result.includes("<code"));
    assert.ok(result.includes("const x = 1;"));
  });

  test("should convert tables", async () => {
    const input = "| Header 1 | Header 2 |\n|----------+----------|\n| Cell 1   | Cell 2   |";
    const result = await orgToHtml(input);
    assert.ok(result.includes("<table"));
    assert.ok(result.includes("Header 1"));
    assert.ok(result.includes("Cell 1"));
  });

  test("should convert horizontal rules", async () => {
    const input = "-----";
    const result = await orgToHtml(input);
    assert.ok(result.includes("<hr"));
  });

  test("should convert blockquotes", async () => {
    const input = "#+BEGIN_QUOTE\nThis is a quote\n#+END_QUOTE";
    const result = await orgToHtml(input);
    assert.ok(result.includes("<blockquote"));
    assert.ok(result.includes("This is a quote"));
  });

  test("should handle mixed formatting", async () => {
    const input = "* Heading with *bold* and /italic/";
    const result = await orgToHtml(input);
    assert.ok(result.includes("<h1"));
    assert.ok(result.includes("<strong>") || result.includes("<b>"));
    assert.ok(result.includes("<em>") || result.includes("<i>"));
  });

  test("should handle empty input", async () => {
    const input = "";
    const result = await orgToHtml(input);
    assert.strictEqual(typeof result, "string");
  });

  test("should handle plain text", async () => {
    const input = "This is plain text without any formatting.";
    const result = await orgToHtml(input);
    assert.ok(result.includes("This is plain text"));
  });
});
