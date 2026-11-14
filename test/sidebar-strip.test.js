const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const OmniBarDefaultPage = require('../default-page.js');
const OmniBarStripReconciler = require('../strip-reconciler.js');
const OmniBarFrameManager = require('../frame-manager.js');

const SIDEBAR_SRC = fs.readFileSync(path.join(__dirname, '..', 'sidebar.js'), 'utf8');

function createDomStub() {
  let createCount = 0;
  const makeEl = (tagOrId = '') => {
    const classes = new Set();
    const listeners = {};
    const el = {
      tagName: tagOrId,
      id: tagOrId,
      value: '',
      textContent: '',
      src: '',
      alt: '',
      title: '',
      style: {},
      dataset: {},
      children: [],
      className: '',
      draggable: false,
      classList: {
        add: (...c) => c.forEach(x => classes.add(x)),
        remove: (...c) => c.forEach(x => classes.delete(x)),
        toggle: (c, force) => {
          if (force === undefined) {
            if (classes.has(c)) classes.delete(c); else classes.add(c);
          } else if (force) classes.add(c);
          else classes.delete(c);
        },
        contains: c => classes.has(c)
      },
      setAttribute() {},
      remove() {
        if (this.parentNode) {
          const idx = this.parentNode.children.indexOf(this);
          if (idx >= 0) this.parentNode.children.splice(idx, 1);
          this.parentNode = null;
        }
      },
      appendChild(child) {
        if (child.parentNode) child.remove();
        child.parentNode = this;
        this.children.push(child);
        return child;
      },
      addEventListener(evt, fn) {
        listeners[evt] = listeners[evt] || [];
        listeners[evt].push(fn);
      },
      trigger(evt, payload = {}) {
        (listeners[evt] || []).forEach(fn => fn({ preventDefault: () => {}, stopPropagation: () => {}, ...payload }));
      }
    };
    return el;
  };

  const elements = new Map();
  const getEl = id => (elements.has(id) ? elements.get(id) : elements.set(id, makeEl(id)).get(id));
  getEl('content-panel').classList.add('hidden');
  getEl('settings-overlay').classList.add('hidden');
  getEl('modal-overlay').classList.add('hidden');

  return {
    getCreateCount: () => createCount,
    resetCreateCount: () => { createCount = 0; },
    getEl,
    doc: {
      title: 'OmniBar',
      getElementById: getEl,
      createElement: (tag) => { createCount++; return makeEl(tag); },
      querySelectorAll: () => [],
      addEventListener: () => {}
    }
  };
}

async function bootSidebarForStrip(apps) {
  const dom = createDomStub();
  const storageData = { apps };
  const context = {
    console,
    setTimeout: () => 0,
    clearTimeout: () => {},
    requestAnimationFrame: fn => fn(),
    URL,
    document: dom.doc,
    window: { addEventListener: () => {}, innerWidth: 400, innerHeight: 800 },
    chrome: {
      windows: { getCurrent: async () => ({ id: 1 }) },
      runtime: { sendMessage: async () => {} },
      tabs: { create: () => {} },
      storage: {
        local: {
          get: async () => ({ apps: storageData.apps }),
          set: async (obj) => { Object.assign(storageData, obj); }
        }
      }
    },
    OmniBarDefaultPage,
    OmniBarStripReconciler,
    OmniBarFrameManager
  };
  vm.createContext(context);
  vm.runInContext(SIDEBAR_SRC, context);
  await new Promise(resolve => setImmediate(resolve));
  return { context, dom, storageData };
}

describe('sidebar.js strip reconciliation', () => {
  it('openApp, closePanel, and toggleEditMode reuse existing icon DOM nodes with zero recreations', async () => {
    const apps = [
      { id: 'a', name: 'Claude', url: 'https://claude.ai/new' },
      { id: 'b', name: 'Gemini', url: 'https://gemini.google.com' }
    ];
    const { context, dom } = await bootSidebarForStrip(apps);
    const iconsEl = dom.getEl('app-icons');
    const firstNode = iconsEl.children[0];
    const secondNode = iconsEl.children[1];

    dom.resetCreateCount();
    context.openApp(apps[1]);
    assert.equal(dom.getCreateCount(), 0);
    assert.equal(iconsEl.children[0], firstNode);
    assert.equal(iconsEl.children[1], secondNode);
    assert.equal(secondNode.classList.contains('active'), true);

    context.toggleEditMode();
    assert.equal(dom.getCreateCount(), 0);
    assert.equal(iconsEl.classList.contains('edit-mode'), true);

    context.closePanel();
    assert.equal(dom.getCreateCount(), 0);
    assert.equal(secondNode.classList.contains('active'), false);
  });

  it('reads dynamic dataset.idx during consecutive drag-and-drop reorders', async () => {
    const apps = [
      { id: 'a', name: 'A', url: 'https://a.example' },
      { id: 'b', name: 'B', url: 'https://b.example' },
      { id: 'c', name: 'C', url: 'https://c.example' }
    ];
    const { dom, storageData } = await bootSidebarForStrip(apps);
    const iconsEl = dom.getEl('app-icons');
    const dt = { effectAllowed: '', dropEffect: '' };

    // First drag: move index 0 ('a') to index 2 -> [b, c, a]
    iconsEl.children[0].trigger('dragstart', { dataTransfer: dt });
    iconsEl.children[2].trigger('drop', { dataTransfer: dt });
    assert.deepEqual(storageData.apps.map(x => x.id), ['b', 'c', 'a']);

    // Second drag: move current index 0 ('b') to index 1 -> [c, b, a]
    iconsEl.children[0].trigger('dragstart', { dataTransfer: dt });
    iconsEl.children[1].trigger('drop', { dataTransfer: dt });
    assert.deepEqual(storageData.apps.map(x => x.id), ['c', 'b', 'a']);
  });
});
