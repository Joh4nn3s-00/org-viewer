/**
 * Uniorg plugin that converts metadata nodes and enhances rendering
 * for features that uniorg-rehype silently drops or mishandles:
 *
 * - planning (SCHEDULED/DEADLINE/CLOSED)
 * - property-drawer
 * - clock entries
 * - custom drawers (LOGBOOK, NOTES, etc.)
 * - document keywords (#+TITLE, #+AUTHOR, etc.)
 * - checkboxes on list items
 * - display math ($$...$$) distinction from inline math ($...$)
 */

import type { Plugin } from "unified";

function visitNode(node: any, parent: any, index: number): any[] {
  const replacements: any[] = [];

  switch (node.type) {
    case "keyword": {
      const displayKeys = new Set([
        "TITLE", "AUTHOR", "DATE", "EMAIL", "DESCRIPTION",
        "CATEGORY", "FILETAGS", "LANGUAGE",
      ]);
      if (displayKeys.has(node.key)) {
        replacements.push(makeMetaBlock(node.key, node.value));
      }
      break;
    }

    case "planning": {
      const parts: string[] = [];
      if (node.scheduled) {
        parts.push(`SCHEDULED: ${node.scheduled.rawValue}`);
      }
      if (node.deadline) {
        parts.push(`DEADLINE: ${node.deadline.rawValue}`);
      }
      if (node.closed) {
        parts.push(`CLOSED: ${node.closed.rawValue}`);
      }
      if (parts.length > 0) {
        replacements.push(makePlanningBlock(parts));
      }
      break;
    }

    case "property-drawer": {
      const props = (node.children || [])
        .filter((c: any) => c.type === "node-property")
        .map((c: any) => ({ key: c.key, value: c.value }));
      if (props.length > 0) {
        replacements.push(makePropertyDrawer(props));
      }
      break;
    }

    case "drawer": {
      replacements.push(...makeCustomDrawer(node.name, node));
      break;
    }

    case "clock": {
      const duration = node.duration || "";
      const timeStr = node.value ? node.value.rawValue : "";
      const status = node.status === "running" ? " (running)" : "";
      replacements.push(makeClockEntry(timeStr, duration, status));
      break;
    }

    case "latex-fragment": {
      // Distinguish display math ($$...$$) from inline math ($...$)
      if (node.value && node.value.startsWith("$$")) {
        // Mark as display math by converting to latex-environment
        // which uniorg-rehype renders as div.math.math-display
        return [{
          type: "latex-environment",
          affiliated: {},
          value: node.contents.trim(),
        }];
      }
      return [node];
    }

    default:
      return [node];
  }

  return replacements.length > 0 ? replacements : [node];
}

/**
 * Walk list items and inject checkbox text nodes.
 * uniorg-rehype ignores the checkbox property entirely.
 */
function addCheckboxes(node: any): void {
  if (node.type === "list-item" && node.checkbox) {
    const symbol =
      node.checkbox === "on" ? "\u2611 " :  // ☑
      node.checkbox === "off" ? "\u2610 " : // ☐
      node.checkbox === "trans" ? "\u2612 " : ""; // ☒ (partial)

    if (symbol && node.children && node.children.length > 0) {
      // Find the first paragraph or text-bearing child
      const first = node.children[0];
      if (first.type === "paragraph" && first.children && first.children.length > 0) {
        first.children.unshift({ type: "text", value: symbol });
      } else if (first.type === "list-item-tag") {
        // Description list with checkbox - prepend to the tag
        if (first.children && first.children.length > 0) {
          first.children.unshift({ type: "text", value: symbol });
        }
      } else {
        // Wrap in a text node before existing content
        node.children.unshift({
          type: "paragraph",
          affiliated: {},
          contentsBegin: 0,
          contentsEnd: 0,
          children: [{ type: "text", value: symbol }],
        });
      }
    }
  }

  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      addCheckboxes(child);
    }
  }
}

function makeMetaBlock(key: string, value: string): any {
  return {
    type: "paragraph",
    affiliated: {},
    contentsBegin: 0,
    contentsEnd: 0,
    children: [
      { type: "bold", contentsBegin: 0, contentsEnd: 0, children: [{ type: "text", value: key + ": " }] },
      { type: "text", value: value + "\n" },
    ],
  };
}

function makePlanningBlock(parts: string[]): any {
  const children: any[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const label = part.split(":")[0] + ": ";
    const ts = part.substring(label.length);
    if (i > 0) children.push({ type: "text", value: "  " });
    children.push({
      type: "bold",
      contentsBegin: 0,
      contentsEnd: 0,
      children: [{ type: "text", value: label }],
    });
    children.push({ type: "code", value: ts });
  }
  children.push({ type: "text", value: "\n" });
  return {
    type: "paragraph",
    affiliated: {},
    contentsBegin: 0,
    contentsEnd: 0,
    children,
  };
}

function makePropertyDrawer(props: { key: string; value: string }[]): any {
  const children: any[] = [];
  children.push({
    type: "bold",
    contentsBegin: 0,
    contentsEnd: 0,
    children: [{ type: "text", value: "Properties" }],
  });
  children.push({ type: "line-break" });

  for (const prop of props) {
    children.push({ type: "code", value: prop.key });
    children.push({ type: "text", value: ": " + prop.value });
    children.push({ type: "line-break" });
  }

  return {
    type: "paragraph",
    affiliated: {},
    contentsBegin: 0,
    contentsEnd: 0,
    children,
  };
}

function makeCustomDrawer(name: string, node: any): any[] {
  const result: any[] = [];

  // Drawer header
  result.push({
    type: "paragraph",
    affiliated: {},
    contentsBegin: 0,
    contentsEnd: 0,
    children: [
      {
        type: "bold",
        contentsBegin: 0,
        contentsEnd: 0,
        children: [{ type: "text", value: name }],
      },
      { type: "text", value: "\n" },
    ],
  });

  // Process drawer children — transform clock/property nodes here too
  // since they won't be caught by the top-level transform
  if (node.children) {
    for (const child of node.children) {
      if (child.type === "clock") {
        const duration = child.duration || "";
        const timeStr = child.value ? child.value.rawValue : "";
        const status = child.status === "running" ? " (running)" : "";
        result.push(makeClockEntry(timeStr, duration, status));
      } else if (child.type === "property-drawer") {
        const props = (child.children || [])
          .filter((c: any) => c.type === "node-property")
          .map((c: any) => ({ key: c.key, value: c.value }));
        if (props.length > 0) {
          result.push(makePropertyDrawer(props));
        }
      } else {
        result.push(child);
      }
    }
  }

  return result;
}

function makeClockEntry(timeStr: string, duration: string, status: string): any {
  const children: any[] = [
    {
      type: "bold",
      contentsBegin: 0,
      contentsEnd: 0,
      children: [{ type: "text", value: "CLOCK: " }],
    },
    { type: "code", value: timeStr },
  ];
  if (duration) {
    children.push({ type: "text", value: " => " });
    children.push({ type: "code", value: duration });
  }
  if (status) {
    children.push({ type: "text", value: status });
  }
  children.push({ type: "text", value: "\n" });
  return {
    type: "paragraph",
    affiliated: {},
    contentsBegin: 0,
    contentsEnd: 0,
    children,
  };
}

function transformTree(node: any, parent: any = null, index: number = 0): void {
  if (node.children && Array.isArray(node.children)) {
    const newChildren: any[] = [];
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const result = visitNode(child, node, i);
      for (const r of result) {
        if (Array.isArray(r)) {
          newChildren.push(...r);
        } else {
          newChildren.push(r);
        }
      }
    }
    node.children = newChildren;

    // Recurse into new children
    for (let i = 0; i < node.children.length; i++) {
      transformTree(node.children[i], node, i);
    }
  }
}

const uniorgMetadata: Plugin = function () {
  return (tree: any) => {
    // First pass: transform metadata nodes
    transformTree(tree);
    // Second pass: inject checkbox symbols
    addCheckboxes(tree);
  };
};

export default uniorgMetadata;
