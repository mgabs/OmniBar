const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const OmniBarDefaultPage = require('../default-page.js');
const OmniBarStripReconciler = require('../strip-reconciler.js');
const OmniBarFrameManager = require('../frame-manager.js');

const CSS_SRC = fs.readFileSync(path.join(__dirname, '..', 'sidebar.css'), 'utf8');
const SIDEBAR_SRC = fs.readFileSync(path.join(__dirname, '..', 'sidebar.js'), 'utf8');

describe('m3-theme', () => {
  it('defines M3 surface, semantic, state-layer, shape, and motion tokens in sidebar.css', () => {
    const requiredTokens = [
      '--md-sys-color-surface:',
      '--md-sys-color-surface-container-low:',
      '--md-sys-color-surface-container:',
      '--md-sys-color-surface-container-high:',
      '--md-sys-color-surface-container-highest:',
      '--md-sys-color-primary:',
      '--md-sys-color-on-primary:',
      '--md-sys-color-primary-container:',
      '--md-sys-color-on-primary-container:',
      '--md-sys-color-on-surface:',
      '--md-sys-color-on-surface-variant:',
      '--md-sys-color-outline:',
      '--md-sys-color-outline-variant:',
      '--md-sys-color-error:',
      '--md-sys-state-hover-opacity:',
      '--md-sys-state-focus-opacity:',
      '--md-sys-shape-corner-small:',
      '--md-sys-shape-corner-medium:',
      '--md-sys-shape-corner-large:',
      '--md-sys-shape-corner-full:',
      '--md-sys-motion-easing-standard:',
      '--md-sys-motion-duration-short:'
    ];
    for (const token of requiredTokens) {
      assert.ok(CSS_SRC.includes(token), `Missing M3 token: ${token}`);
    }
    assert.ok(CSS_SRC.includes('@media (prefers-color-scheme: light)'), 'Missing light scheme');
    assert.ok(CSS_SRC.includes('@media (prefers-reduced-motion: reduce)'), 'Missing reduced motion');
    assert.ok(CSS_SRC.includes('.toast--success') && CSS_SRC.includes('.toast--error') && CSS_SRC.includes('.toast--info'), 'Missing toast modifier classes');
  });

  it('showToast() uses semantic toast--* classes without inline style.background', async () => {
    const elements = new Map();
    const makeEl = (id = '') => {
      const classes = new Set();
      return {
        id,
        value: '',
        textContent: '',
        innerHTML: '',
        src: '',
        style: {},
        dataset: {},
        children: [],
        options: [],
        className: '',
        classList: {
          add: (...c) => c.forEach(x => classes.add(x)),
          remove: (...c) => c.forEach(x => classes.delete(x)),
          toggle: () => {},
          contains: c => classes.has(c)
        },
        setAttribute() {},
        remove() {},
        appendChild(ch) { this.children.push(ch); return ch; },
        addEventListener() {}
      };
    };
    const getEl = id => (elements.has(id) ? elements.get(id) : elements.set(id, makeEl(id)).get(id));

    const context = {
      console,
      setTimeout: () => 0,
      clearTimeout: () => {},
      requestAnimationFrame: fn => fn(),
      URL,
      document: {
        title: 'OmniBar',
        getElementById: getEl,
        createElement: makeEl,
        querySelectorAll: () => [],
        addEventListener: () => {}
      },
      window: { addEventListener: () => {}, innerWidth: 400, innerHeight: 800 },
      chrome: {
        windows: { getCurrent: async () => ({ id: 1 }) },
        runtime: { sendMessage: async () => {} },
        tabs: { create: () => {} },
        storage: { local: { get: async () => ({}), set: async () => {} } }
      },
      OmniBarDefaultPage,
      OmniBarStripReconciler,
      OmniBarFrameManager
    };

    vm.createContext(context);
    vm.runInContext(SIDEBAR_SRC, context);
    await new Promise(resolve => setImmediate(resolve));

    const toast = getEl('toast');
    context.showToast('Saved!', 'success');
    assert.equal(toast.style.background, undefined);
    assert.ok(toast.className.includes('toast--success'));

    context.showToast('Oops', 'error');
    assert.equal(toast.style.background, undefined);
    assert.ok(toast.className.includes('toast--error'));

    context.showToast('FYI');
    assert.equal(toast.style.background, undefined);
    assert.ok(toast.className.includes('toast--info'));
  });
});
