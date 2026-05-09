import {
  analyzeInlineText,
  type InlineSuggestion,
} from "../../src/features/proofreader/inlineRules";

type Editable = HTMLTextAreaElement | HTMLInputElement | HTMLElement;

const button = document.createElement("button");
const panel = document.createElement("div");
let activeEditable: Editable | null = null;

button.type = "button";
button.textContent = "Proofread";
button.setAttribute("aria-label", "Run Local Proofreader");
button.className = "lp-floating-button";

panel.className = "lp-panel";
panel.hidden = true;

const style = document.createElement("style");
style.textContent = `
  .lp-floating-button {
    position: fixed;
    z-index: 2147483647;
    display: none;
    min-height: 34px;
    border: 1px solid #c8d4c5;
    border-radius: 8px;
    background: #fffffb;
    color: #162019;
    box-shadow: 0 10px 24px rgba(0,0,0,.14);
    padding: 0 10px;
    font: 700 13px system-ui, sans-serif;
  }
  .lp-panel {
    position: fixed;
    z-index: 2147483647;
    width: min(360px, calc(100vw - 24px));
    max-height: 320px;
    overflow: auto;
    border: 1px solid #d7d4c8;
    border-radius: 8px;
    background: #fffffb;
    color: #162019;
    box-shadow: 0 16px 44px rgba(0,0,0,.18);
    padding: 10px;
    font: 14px/1.45 system-ui, sans-serif;
  }
  .lp-panel article {
    border-bottom: 1px solid #e4e0d4;
    padding: 10px 0;
  }
  .lp-panel article:last-child {
    border-bottom: 0;
  }
  .lp-panel strong {
    display: block;
  }
  .lp-panel p {
    margin: 4px 0 8px;
  }
  .lp-panel button {
    min-height: 30px;
    border: 1px solid #c8d4c5;
    border-radius: 8px;
    background: #f8f7f0;
    color: #162019;
    padding: 0 9px;
    font-weight: 700;
  }
`;

document.documentElement.append(style, button, panel);

document.addEventListener("focusin", (event) => {
  const target = event.target;

  if (!isEditable(target)) {
    return;
  }

  activeEditable = target;
  positionButton(target);
});

document.addEventListener("input", (event) => {
  if (event.target === activeEditable && activeEditable) {
    positionButton(activeEditable);
  }
});

document.addEventListener("scroll", () => {
  if (activeEditable) {
    positionButton(activeEditable);
  }
});

button.addEventListener("click", () => {
  if (!activeEditable) {
    return;
  }

  const suggestions = analyzeInlineText(getEditableText(activeEditable));
  renderPanel(activeEditable, suggestions);
});

function isEditable(target: EventTarget | null): target is Editable {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target instanceof HTMLTextAreaElement) {
    return true;
  }

  if (target instanceof HTMLInputElement) {
    return ["text", "search", "email", "url"].includes(target.type);
  }

  return target.isContentEditable;
}

function positionButton(editable: Editable): void {
  const rect = editable.getBoundingClientRect();
  button.style.display = "inline-flex";
  button.style.left = `${Math.min(window.innerWidth - 112, rect.right - 96)}px`;
  button.style.top = `${Math.max(12, rect.top + 8)}px`;
}

function renderPanel(
  editable: Editable,
  suggestions: InlineSuggestion[],
): void {
  const rect = editable.getBoundingClientRect();
  panel.hidden = false;
  panel.style.left = `${Math.min(window.innerWidth - 372, Math.max(12, rect.right - 360))}px`;
  panel.style.top = `${Math.min(window.innerHeight - 340, Math.max(48, rect.top + 48))}px`;

  if (suggestions.length === 0) {
    panel.replaceChildren("No local suggestions found.");
    return;
  }

  const nodes = suggestions.map((suggestion) => {
    const article = document.createElement("article");
    const title = document.createElement("strong");
    const message = document.createElement("p");
    const apply = document.createElement("button");

    title.textContent = suggestion.title;
    message.textContent = suggestion.message;
    apply.type = "button";
    apply.textContent = `Apply: ${suggestion.replacement}`;
    apply.addEventListener("click", () =>
      applyInlineSuggestion(editable, suggestion),
    );
    article.append(title, message, apply);

    return article;
  });

  panel.replaceChildren(...nodes);
}

function getEditableText(editable: Editable): string {
  if (
    editable instanceof HTMLTextAreaElement ||
    editable instanceof HTMLInputElement
  ) {
    return editable.value;
  }

  return editable.textContent ?? "";
}

function setEditableText(editable: Editable, text: string): void {
  if (
    editable instanceof HTMLTextAreaElement ||
    editable instanceof HTMLInputElement
  ) {
    editable.value = text;
  } else {
    editable.textContent = text;
  }

  editable.dispatchEvent(new Event("input", { bubbles: true }));
}

function applyInlineSuggestion(
  editable: Editable,
  suggestion: InlineSuggestion,
): void {
  const text = getEditableText(editable);
  setEditableText(
    editable,
    `${text.slice(0, suggestion.start)}${suggestion.replacement}${text.slice(suggestion.end)}`,
  );
  panel.hidden = true;
}
