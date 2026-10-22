/** Internal enhancement of native single selects; the native control still owns form state. */
const enhanced = new WeakMap<HTMLSelectElement, () => void>();
let nextId = 0;
let closeCurrent: (() => void) | undefined;

function supported(select: HTMLSelectElement) {
  return !select.multiple && select.size <= 1 && !select.hasAttribute('data-af-select-native');
}

export function initSelects(root: HTMLElement): () => void {
  const selects = [...root.querySelectorAll<HTMLSelectElement>('select.af-select')];
  if (root.matches('select.af-select')) selects.unshift(root as HTMLSelectElement);
  const cleanups = selects.filter(select => supported(select) && !enhanced.has(select)).map(enhance);
  return () => cleanups.forEach(cleanup => cleanup());
}

function enhance(select: HTMLSelectElement): () => void {
  const doc = select.ownerDocument;
  const win = doc.defaultView!;
  const abort = new AbortController();
  const {signal} = abort;
  const oldTabIndex = select.getAttribute('tabindex');
  const oldAriaHidden = select.getAttribute('aria-hidden');
  const hadFocus = doc.activeElement === select;
  const generatedLabels: Array<{label: HTMLLabelElement; id: string}> = [];
  const boundLabels = new Set<HTMLLabelElement>();
  const wrapper = doc.createElement('span');
  wrapper.className = 'af-select-box';
  const control = doc.createElement('button');
  control.type = 'button';
  control.className = 'af-select__control';
  control.setAttribute('role', 'combobox');
  control.setAttribute('aria-haspopup', 'listbox');
  control.setAttribute('aria-expanded', 'false');
  let prefix: string;
  do { prefix = `af-select-${++nextId}`; } while (doc.getElementById(prefix + '-control') || doc.getElementById(prefix + '-list'));
  control.id = prefix + '-control';
  control.tabIndex = oldTabIndex === null ? 0 : select.tabIndex;
  const value = doc.createElement('span');
  value.className = 'af-select__value';
  const icon = doc.createElement('span');
  icon.className = 'af-select__arrow';
  icon.setAttribute('aria-hidden', 'true');
  control.append(value, icon);
  const list = doc.createElement('div');
  list.className = 'af af-select-list';
  list.id = prefix + '-list';
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  const topLayer = typeof list.showPopover === 'function';
  if (topLayer) list.setAttribute('popover', 'manual');
  control.setAttribute('aria-controls', list.id);
  list.setAttribute('aria-labelledby', control.id);
  select.before(wrapper);
  wrapper.append(select, control, list);
  select.classList.add('af-select--enhanced');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');

  let disposed = false;
  let opened = false;
  let active = -1;
  let query = '';
  let typedAt = 0;
  let nativeInvalid = false;
  let rows = new Map<number, HTMLElement>();
  let optionCleanups: Array<() => void> = [];
  const readOnly = () => select.hasAttribute('data-af-readonly') || select.getAttribute('aria-readonly') === 'true';
  const disabled = () => select.matches(':disabled');
  const available = (index: number) => {
    const option = select.options[index];
    const group = option?.parentElement instanceof HTMLOptGroupElement ? option.parentElement : null;
    return !!option && !option.disabled && !option.hidden && !group?.disabled && !group?.hidden;
  };
  const enabledIndices = () => [...rows.keys()].filter(available);

  function close() {
    if (!opened) return;
    opened = false;
    if (topLayer && list.matches(':popover-open')) list.hidePopover();
    list.hidden = true;
    if (!topLayer && list.parentElement !== wrapper) wrapper.append(list);
    control.setAttribute('aria-expanded', 'false');
    control.removeAttribute('aria-activedescendant');
    query = ''; typedAt = 0;
    if (closeCurrent === close) closeCurrent = undefined;
  }

  function position() {
    if (!opened) return;
    const rect = control.getBoundingClientRect();
    if (!select.isConnected || !rect.width || !rect.height) { close(); return; }
    const viewport = win.visualViewport;
    const x = viewport?.offsetLeft ?? 0, y = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? doc.documentElement.clientWidth;
    const height = viewport?.height ?? win.innerHeight;
    if (rect.bottom < y || rect.top > y + height) { close(); return; }
    const edge = 8;
    const gap = 2;
    const menuWidth = Math.min(rect.width, Math.max(0, width - edge * 2));
    list.style.width = menuWidth + 'px';
    list.style.left = Math.max(x + edge, Math.min(rect.left, x + width - edge - menuWidth)) + 'px';
    const below = Math.max(0, y + height - rect.bottom - gap - edge);
    const above = Math.max(0, rect.top - y - gap - edge);
    const naturalHeight = list.scrollHeight + 2;
    const upwards = below < Math.min(naturalHeight, 160) && above > below;
    const menuHeight = Math.min(naturalHeight, 320, upwards ? above : below);
    list.style.maxHeight = menuHeight + 'px';
    list.style.top = (upwards ? rect.top - gap - menuHeight : rect.bottom + gap) + 'px';
  }

  function activate(index: number, scroll = true) {
    active = available(index) ? index : -1;
    rows.forEach((row, i) => row.toggleAttribute('data-active', i === active));
    const row = rows.get(active);
    if (opened && row) {
      control.setAttribute('aria-activedescendant', row.id);
      if (scroll) {
        const top = row.offsetTop, bottom = top + row.offsetHeight;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
      }
    } else control.removeAttribute('aria-activedescendant');
  }

  function sync() {
    if (disposed) return;
    if (!supported(select)) { destroy(); return; }
    if (nativeInvalid && select.validity.valid) {
      nativeInvalid = false;
      select.removeAttribute('aria-invalid');
    }
    for (const size of ['sm', 'lg']) {
      const on = select.classList.contains('af-select--' + size);
      wrapper.classList.toggle('af-select-box--' + size, on);
      list.classList.toggle('af-select-list--' + size, on);
    }
    for (const property of ['width', 'min-width', 'max-width']) wrapper.style.setProperty(property, select.style.getPropertyValue(property));
    wrapper.hidden = select.hidden || win.getComputedStyle(select).display === 'none';
    control.disabled = disabled();
    control.setAttribute('aria-readonly', String(readOnly()));
    control.setAttribute('aria-required', String(select.required));
    for (const attribute of ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'title']) {
      const text = select.getAttribute(attribute);
      if (text !== null) control.setAttribute(attribute, text);
      else control.removeAttribute(attribute);
    }
    if (!select.hasAttribute('aria-label') && !select.hasAttribute('aria-labelledby')) {
      const ids = [...(select.labels ?? [])].map(label => {
        if (!boundLabels.has(label)) {
          boundLabels.add(label);
          label.addEventListener('click', event => {
            const target = event.target as Element;
            if (target.closest('a,button,input,textarea,select') && target !== select) return;
            event.preventDefault();
            control.focus();
          }, {signal});
        }
        if (!label.id) {
          let suffix = generatedLabels.length;
          while (doc.getElementById(prefix + '-label-' + suffix)) suffix++;
          const id = prefix + '-label-' + suffix;
          label.id = id;
          generatedLabels.push({label, id});
        }
        return label.id;
      });
      if (ids.length) control.setAttribute('aria-labelledby', ids.join(' '));
    }
    const selected = select.selectedOptions[0];
    const label = selected?.label ?? select.dataset.afPlaceholder ?? '';
    // WebKit can drop the click if focus replaces the text node under the pointer.
    if (value.textContent !== label) value.textContent = label;
    control.toggleAttribute('data-placeholder', !selected || selected.value === '');
    rows.forEach((row, index) => {
      row.setAttribute('aria-selected', String(index === select.selectedIndex));
      row.setAttribute('aria-disabled', String(!available(index)));
    });
    if (disabled() || readOnly() || wrapper.hidden) close();
    if (opened) { activate(available(active) ? active : enabledIndices()[0] ?? -1); position(); }
  }

  // Observe writes on these instances only. Native prototypes and event semantics remain intact.
  function mirrorProperty(target: HTMLSelectElement | HTMLOptionElement, key: string): () => void {
    if (Object.hasOwn(target, key) || !Object.isExtensible(target)) return () => {};
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), key);
    if (!descriptor?.get || !descriptor.set) return () => {};
    const get = () => descriptor.get!.call(target);
    Object.defineProperty(target, key, {
      configurable: true, enumerable: descriptor.enumerable, get,
      set(next: unknown) { descriptor.set!.call(target, next); sync(); }
    });
    return () => { if (Object.getOwnPropertyDescriptor(target, key)?.get === get) Reflect.deleteProperty(target, key); };
  }

  function rebuild() {
    if (disposed) return;
    optionCleanups.forEach(cleanup => cleanup());
    optionCleanups = [];
    rows = new Map();
    const fragment = doc.createDocumentFragment();
    let index = 0;
    for (const child of select.children) {
      const group = child instanceof HTMLOptGroupElement ? doc.createElement('div') : null;
      if (group) {
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', (child as HTMLOptGroupElement).label);
        const heading = doc.createElement('div');
        heading.className = 'af-select-list__group';
        heading.setAttribute('aria-hidden', 'true');
        heading.textContent = (child as HTMLOptGroupElement).label;
        group.hidden = (child as HTMLOptGroupElement).hidden;
        group.append(heading);
        fragment.append(group);
      }
      const options = child instanceof HTMLOptGroupElement ? [...child.children] : [child];
      for (const option of options) {
        if (!(option instanceof HTMLOptionElement)) continue;
        const row = doc.createElement('div');
        row.className = 'af-select-option';
        row.id = prefix + '-option-' + index;
        row.setAttribute('role', 'option');
        row.dataset.index = String(index);
        row.hidden = option.hidden;
        row.textContent = option.label;
        rows.set(index++, row);
        (group ?? fragment).append(row);
        optionCleanups.push(mirrorProperty(option, 'selected'));
      }
    }
    list.replaceChildren(fragment);
    sync();
  }

  function open() {
    sync();
    if (disposed || opened || disabled() || readOnly() || wrapper.hidden || !control.getClientRects().length) return;
    closeCurrent?.();
    if (!topLayer) (control.closest('dialog[open]') ?? doc.body).append(list);
    list.hidden = false;
    if (topLayer) list.showPopover();
    opened = true;
    closeCurrent = close;
    control.setAttribute('aria-expanded', 'true');
    position();
    activate(available(select.selectedIndex) ? select.selectedIndex : enabledIndices()[0] ?? -1);
  }

  function choose(index: number) {
    if (!available(index) || disabled() || readOnly()) return;
    const changed = select.selectedIndex !== index;
    select.selectedIndex = index;
    close();
    sync();
    control.focus({preventScroll: true});
    if (changed) {
      select.dispatchEvent(new Event('input', {bubbles: true}));
      select.dispatchEvent(new Event('change', {bubbles: true}));
    }
  }

  control.addEventListener('click', () => opened ? close() : open(), {signal});
  control.addEventListener('focus', sync, {signal});
  select.addEventListener('focus', () => { sync(); control.focus({preventScroll: true}); }, {signal});
  select.addEventListener('input', sync, {signal});
  select.addEventListener('change', sync, {signal});
  select.addEventListener('invalid', event => {
    event.preventDefault();
    nativeInvalid = true;
    select.setAttribute('aria-invalid', 'true');
    sync(); control.focus({preventScroll: false});
  }, {signal});
  select.form?.addEventListener('reset', event => {
    // A trusted reset dispatch may flush microtasks before the browser resets selection.
    win.setTimeout(() => {
      if (disposed || event.defaultPrevented) return;
      close();
      if (nativeInvalid) { nativeInvalid = false; select.removeAttribute('aria-invalid'); }
      sync();
    }, 0);
  }, {signal});
  list.addEventListener('mousedown', event => event.preventDefault(), {signal});
  list.addEventListener('pointermove', event => {
    const row = (event.target as Element).closest<HTMLElement>('[data-index]');
    if (row && available(Number(row.dataset.index))) activate(Number(row.dataset.index), false);
  }, {signal});
  list.addEventListener('click', event => {
    const row = (event.target as Element).closest<HTMLElement>('[data-index]');
    if (row) choose(Number(row.dataset.index));
  }, {signal});
  control.addEventListener('blur', () => queueMicrotask(() => {
    if (!disposed && doc.activeElement !== control && !list.contains(doc.activeElement)) close();
  }), {signal});
  doc.addEventListener('pointerdown', event => {
    if (!wrapper.contains(event.target as Node) && !list.contains(event.target as Node)) close();
  }, {signal});
  doc.addEventListener('scroll', event => { if (event.target !== list && !list.contains(event.target as Node)) position(); }, {capture: true, passive: true, signal});
  win.addEventListener('resize', position, {signal});
  win.visualViewport?.addEventListener('resize', position, {signal});
  win.visualViewport?.addEventListener('scroll', position, {signal});
  const resize = new ResizeObserver(position);
  resize.observe(control);
  control.addEventListener('keydown', event => {
    if (disabled() || readOnly()) return;
    if (event.key === 'Tab') { close(); return; }
    if (event.key === 'Escape' && opened) { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const wasOpen = opened;
      open();
      const enabled = enabledIndices();
      if (event.key === 'Home') activate(enabled[0] ?? -1);
      else if (event.key === 'End') activate(enabled.at(-1) ?? -1);
      else if (wasOpen) {
        const next = enabled.indexOf(active) + (event.key === 'ArrowDown' ? 1 : -1);
        activate(enabled[Math.max(0, Math.min(next, enabled.length - 1))] ?? -1);
      }
      return;
    }
    const now = performance.now();
    if (event.key === 'Enter' || event.key === ' ' && (now - typedAt > 500 || !query)) {
      event.preventDefault();
      if (opened) active < 0 ? close() : choose(active);
      else open();
      return;
    }
    if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      open();
      query = now - typedAt > 500 ? event.key : query + event.key;
      typedAt = now;
      const term = [...query].every(c => c === query[0]) ? query[0] : query;
      const enabled = enabledIndices();
      const start = term.length === 1 ? enabled.indexOf(active) + 1 : 0;
      const ordered = [...enabled.slice(start), ...enabled.slice(0, start)];
      const found = ordered.find(i => select.options[i].label.toLocaleLowerCase().startsWith(term.toLocaleLowerCase()));
      if (found !== undefined) activate(found);
    }
  }, {signal});

  const selectionCleanups = ['value', 'selectedIndex'].map(key => mirrorProperty(select, key));
  const observer = new MutationObserver(rebuild);
  observer.observe(select, {attributes: true, childList: true, subtree: true, characterData: true});
  for (let parent = select.parentElement; parent; parent = parent.parentElement) {
    if (parent instanceof HTMLFieldSetElement) observer.observe(parent, {attributes: true, attributeFilter: ['disabled']});
  }

  function destroy() {
    if (disposed) return;
    const restoreFocus = doc.activeElement === control;
    close(); disposed = true;
    abort.abort(); observer.disconnect(); resize.disconnect();
    optionCleanups.forEach(cleanup => cleanup());
    selectionCleanups.forEach(cleanup => cleanup());
    select.classList.remove('af-select--enhanced');
    if (oldTabIndex === null) select.removeAttribute('tabindex'); else select.setAttribute('tabindex', oldTabIndex);
    if (oldAriaHidden === null) select.removeAttribute('aria-hidden'); else select.setAttribute('aria-hidden', oldAriaHidden);
    generatedLabels.forEach(({label, id}) => { if (label.id === id) label.removeAttribute('id'); });
    if (select.parentElement === wrapper) {
      if (wrapper.parentNode) wrapper.replaceWith(select);
      else select.remove();
    }
    else wrapper.remove();
    list.remove();
    if (enhanced.get(select) === destroy) enhanced.delete(select);
    if (restoreFocus && select.isConnected) select.focus({preventScroll: true});
  }

  enhanced.set(select, destroy);
  rebuild();
  if (hadFocus) control.focus({preventScroll: true});
  return destroy;
}
