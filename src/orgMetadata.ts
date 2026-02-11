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

// ─── Uniorg AST Type Interfaces ─────────────────────────────────

interface OrgTimestamp {
  rawValue: string;
}

interface TextNode {
  type: "text";
  value: string;
}

interface BoldNode {
  type: "bold";
  contentsBegin: number;
  contentsEnd: number;
  children: OrgNode[];
}

interface CodeNode {
  type: "code";
  value: string;
}

interface LineBreakNode {
  type: "line-break";
}

interface ParagraphNode {
  type: "paragraph";
  affiliated: Record<string, unknown>;
  contentsBegin: number;
  contentsEnd: number;
  children: OrgNode[];
}

interface KeywordNode {
  type: "keyword";
  key: string;
  value: string;
}

interface PlanningNode {
  type: "planning";
  scheduled: OrgTimestamp | null;
  deadline: OrgTimestamp | null;
  closed: OrgTimestamp | null;
}

interface NodePropertyNode {
  type: "node-property";
  key: string;
  value: string;
}

interface PropertyDrawerNode {
  type: "property-drawer";
  children: OrgNode[];
}

interface DrawerNode {
  type: "drawer";
  name: string;
  children: OrgNode[];
}

interface ClockNode {
  type: "clock";
  value: OrgTimestamp | null;
  duration: string;
  status: string;
}

interface LatexFragmentNode {
  type: "latex-fragment";
  value: string;
  contents: string;
}

interface LatexEnvironmentNode {
  type: "latex-environment";
  affiliated: Record<string, unknown>;
  value: string;
}

interface ListItemNode {
  type: "list-item";
  checkbox: "on" | "off" | "trans" | null;
  children: OrgNode[];
}

/** Union of all org AST node types we handle. Includes a fallback for any others. */
type OrgNode =
  | TextNode
  | BoldNode
  | CodeNode
  | LineBreakNode
  | ParagraphNode
  | KeywordNode
  | PlanningNode
  | NodePropertyNode
  | PropertyDrawerNode
  | DrawerNode
  | ClockNode
  | LatexFragmentNode
  | LatexEnvironmentNode
  | ListItemNode
  | GenericOrgNode;

/** Catch-all for node types we don't explicitly handle. */
interface GenericOrgNode {
  type: string;
  value?: string;
  children?: OrgNode[];
  [key: string]: unknown;
}

// ─── Helper: narrowing guards ───────────────────────────────────

function hasChildren(node: OrgNode): node is OrgNode & { children: OrgNode[] } {
  return "children" in node && Array.isArray((node as GenericOrgNode).children);
}

// ─── AST Construction Helpers ───────────────────────────────────

const DISPLAY_KEYWORDS = new Set([
  "TITLE", "AUTHOR", "DATE", "EMAIL", "DESCRIPTION",
  "CATEGORY", "FILETAGS", "LANGUAGE",
]);

function makeText(value: string): TextNode {
  return { type: "text", value };
}

function makeBold(text: string): BoldNode {
  return {
    type: "bold",
    contentsBegin: 0,
    contentsEnd: 0,
    children: [makeText(text)],
  };
}

function makeParagraph(children: OrgNode[]): ParagraphNode {
  return {
    type: "paragraph",
    affiliated: {},
    contentsBegin: 0,
    contentsEnd: 0,
    children,
  };
}

function makeMetaBlock(key: string, value: string): ParagraphNode {
  return makeParagraph([
    makeBold(key + ": "),
    makeText(value + "\n"),
  ]);
}

function makePlanningBlock(parts: string[]): ParagraphNode {
  const children: OrgNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const label = part.split(":")[0] + ": ";
    const ts = part.substring(label.length);
    if (i > 0) children.push(makeText("  "));
    children.push(makeBold(label));
    children.push({ type: "code", value: ts } as CodeNode);
  }
  children.push(makeText("\n"));
  return makeParagraph(children);
}

function makePropertyDrawer(props: { key: string; value: string }[]): ParagraphNode {
  const children: OrgNode[] = [];
  children.push(makeBold("Properties"));
  children.push({ type: "line-break" } as LineBreakNode);

  for (const prop of props) {
    children.push({ type: "code", value: prop.key } as CodeNode);
    children.push(makeText(": " + prop.value));
    children.push({ type: "line-break" } as LineBreakNode);
  }

  return makeParagraph(children);
}

function makeCustomDrawer(name: string, node: DrawerNode): OrgNode[] {
  const result: OrgNode[] = [];

  result.push(makeParagraph([makeBold(name), makeText("\n")]));

  if (node.children) {
    for (const child of node.children) {
      if (child.type === "clock") {
        const clock = child as ClockNode;
        const duration = clock.duration || "";
        const timeStr = clock.value ? clock.value.rawValue : "";
        const status = clock.status === "running" ? " (running)" : "";
        result.push(makeClockEntry(timeStr, duration, status));
      } else if (child.type === "property-drawer") {
        const drawer = child as PropertyDrawerNode;
        const props = (drawer.children || [])
          .filter((c): c is NodePropertyNode => c.type === "node-property")
          .map((c) => ({ key: c.key, value: c.value }));
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

function makeClockEntry(timeStr: string, duration: string, status: string): ParagraphNode {
  const children: OrgNode[] = [
    makeBold("CLOCK: "),
    { type: "code", value: timeStr } as CodeNode,
  ];
  if (duration) {
    children.push(makeText(" => "));
    children.push({ type: "code", value: duration } as CodeNode);
  }
  if (status) {
    children.push(makeText(status));
  }
  children.push(makeText("\n"));
  return makeParagraph(children);
}

// ─── Tree Transforms ────────────────────────────────────────────

function visitNode(node: OrgNode): OrgNode[] {
  switch (node.type) {
    case "keyword": {
      const kw = node as KeywordNode;
      if (DISPLAY_KEYWORDS.has(kw.key)) {
        return [makeMetaBlock(kw.key, kw.value)];
      }
      break;
    }

    case "planning": {
      const plan = node as PlanningNode;
      const parts: string[] = [];
      if (plan.scheduled) parts.push(`SCHEDULED: ${plan.scheduled.rawValue}`);
      if (plan.deadline) parts.push(`DEADLINE: ${plan.deadline.rawValue}`);
      if (plan.closed) parts.push(`CLOSED: ${plan.closed.rawValue}`);
      if (parts.length > 0) return [makePlanningBlock(parts)];
      break;
    }

    case "property-drawer": {
      const pd = node as PropertyDrawerNode;
      const props = (pd.children || [])
        .filter((c): c is NodePropertyNode => c.type === "node-property")
        .map((c) => ({ key: c.key, value: c.value }));
      if (props.length > 0) return [makePropertyDrawer(props)];
      break;
    }

    case "drawer": {
      const drawer = node as DrawerNode;
      return makeCustomDrawer(drawer.name, drawer);
    }

    case "clock": {
      const clock = node as ClockNode;
      const duration = clock.duration || "";
      const timeStr = clock.value ? clock.value.rawValue : "";
      const status = clock.status === "running" ? " (running)" : "";
      return [makeClockEntry(timeStr, duration, status)];
    }

    case "latex-fragment": {
      const lf = node as LatexFragmentNode;
      if (lf.value && lf.value.startsWith("$$")) {
        return [{
          type: "latex-environment",
          affiliated: {},
          value: lf.contents.trim(),
        } as LatexEnvironmentNode];
      }
      return [node];
    }

    default:
      return [node];
  }

  return [node];
}

/**
 * Walk list items and inject checkbox text nodes.
 * uniorg-rehype ignores the checkbox property entirely.
 */
function addCheckboxes(node: OrgNode): void {
  if (node.type === "list-item") {
    const li = node as ListItemNode;
    if (li.checkbox) {
      const symbol =
        li.checkbox === "on"    ? "\u2611 " :  // ☑
        li.checkbox === "off"   ? "\u2610 " :  // ☐
        li.checkbox === "trans" ? "\u2612 " :   // ☒
        "";

      if (symbol && li.children && li.children.length > 0) {
        const first = li.children[0];
        if (first.type === "paragraph" && hasChildren(first) && first.children.length > 0) {
          first.children.unshift(makeText(symbol));
        } else if (first.type === "list-item-tag" && hasChildren(first)) {
          first.children.unshift(makeText(symbol));
        } else {
          li.children.unshift(makeParagraph([makeText(symbol)]));
        }
      }
    }
  }

  if (hasChildren(node)) {
    for (const child of node.children) {
      addCheckboxes(child);
    }
  }
}

function transformTree(node: OrgNode): void {
  if (!hasChildren(node)) return;

  const newChildren: OrgNode[] = [];
  for (const child of node.children) {
    const result = visitNode(child);
    for (const r of result) {
      if (Array.isArray(r)) {
        newChildren.push(...r);
      } else {
        newChildren.push(r);
      }
    }
  }
  node.children = newChildren;

  for (const child of node.children) {
    transformTree(child);
  }
}

// ─── Plugin Export ──────────────────────────────────────────────

const uniorgMetadata: Plugin = function () {
  return (tree: unknown) => {
    const root = tree as OrgNode;
    transformTree(root);
    addCheckboxes(root);
  };
};

export default uniorgMetadata;
