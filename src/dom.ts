export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export function button(text: string, action: () => void, className = 'af-btn af-btn--secondary af-btn--sm'): HTMLButtonElement {
  const b = el('button', className, text); b.type = 'button'; b.addEventListener('click', action); return b;
}
export function announce(target: HTMLElement, text: string) { target.dispatchEvent(new CustomEvent('af:change', { bubbles: true, detail: text })); }
