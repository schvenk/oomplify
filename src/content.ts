const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bartificial intelligence\b/gi, "Oompa-Loompas"],
  [/\bAI\b/g, "Oompa-Loompas"],
];

// Prevent processing our own text mutations and looping.
const SUPPRESSED = { active: false };

const isIgnoredElement = (el: Element | null): boolean => {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "script" ||
    tag === "style" ||
    tag === "textarea" ||
    tag === "input" ||
    tag === "noscript" ||
    (el as HTMLElement).isContentEditable
  );
};

const transformText = (text: string): string => {
  let next = text;
  for (const [regex, replacement] of REPLACEMENTS) {
    next = next.replace(regex, replacement);
  }
  return next;
};

const processTextNode = (node: Text): void => {
  const parent = node.parentElement;
  if (isIgnoredElement(parent)) return;

  const original = node.nodeValue;
  if (!original) return;

  const updated = transformText(original);
  if (updated !== original) {
    SUPPRESSED.active = true;
    node.nodeValue = updated;
    SUPPRESSED.active = false;
  }
};

const processSubtree = (root: Node): void => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = (node as Text).parentElement;
      return isIgnoredElement(parent)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });

  let current: Node | null = walker.nextNode();
  while (current) {
    processTextNode(current as Text);
    current = walker.nextNode();
  }
};

const handleMutations = (mutations: MutationRecord[]): void => {
  if (SUPPRESSED.active) return;

  for (const mutation of mutations) {
    if (mutation.type === "characterData") {
      processTextNode(mutation.target as Text);
      continue;
    }

    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          processTextNode(node as Text);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          processSubtree(node);
        }
      });
    }
  }
};

const observer = new MutationObserver(handleMutations);

const start = (): void => {
  processSubtree(document.body);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
