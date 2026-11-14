const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const OmniBarDefaultPage = require('../default-page.js');

const SIDEBAR_SRC = fs.readFileSync(path.join(__dirname, '..', 'sidebar.js'), 'utf8');

function createElement(id = '') {
  const classes = new Set();
  const listeners = {};
  return {
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    style: {},
    dataset: {},
    children: [],
    options: [],
    selected: false,
    draggable: false,
    className: '',
    classList: {
      add: (...c) => c.forEach(x => classes.add(x)),
      remove: (...c) => c.forEach(x => classes.delete(x)),
      toggle: (c, force) => {
        if (force === undefined) {
          if (classes.has(c)) classes.delete(c); else classes.add(c);
        } else if (force) {
          classes.add(c);
        } else {
          classes.delete(c);
        }
      },
      contains: c => classes.has(c)
    },
    setAttribute() {},
    appendChild(child) {
      this.children.push(child);
      if (this.id === 'settings-default-page') this.options.push(child);
      return child;
    },
    addEventListener(evt, fn) {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(fn);
    },
    dispatchEvent(evt) {
      (listeners[evt.type] || []).forEach(fn => fn(evt));
    }
  };
}

async function bootSidebar(initialStorage = {}) {
  const storageData = { ...initialStorage };
  const getCalls = [];
  const setCalls = [];
  const elements = new Map();
  const getEl = (id) => {
    if (!elements.has(id)) elements.set(id, createElement(id));
    return elements.get(id);
  };

  // Pre-register overlays as hidden like sidebar.html
  getEl('content-panel').classList.add('hidden');
  getEl('settings-overlay').classList.add('hidden');
  getEl('modal-overlay').classList.add('hidden');

  const doc = {
    title: 'OmniBar',
    getElementById: getEl,
    createElement: (tag) => createElement(tag),
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const chrome = {
    windows: { getCurrent: async () => ({ id: 1 }) },
    runtime: { sendMessage: async () => {} },
    tabs: { create: () => {} },
    storage: {
      local: {
        get: async (keys) => {
          getCalls.push(keys);
          const list = Array.isArray(keys) ? keys : [keys];
          const out = {};
          for (const k of list) {
            if (k in storageData) out[k] = storageData[k];
          }
          return out;
        },
        set: async (obj) => {
          setCalls.push(obj);
          Object.assign(storageData, obj);
        }
      }
    }
  };

  let fileReaderResult = '';
  class MockFileReader {
    readAsText() {
      this.onload({ target: { result: fileReaderResult } });
    }
  }

  const context = {
    console,
    setTimeout: () => 0,
    clearTimeout: () => {},
    requestAnimationFrame: (fn) => fn(),
    confirm: () => true,
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} },
    Blob: class {},
    FileReader: MockFileReader,
    navigator: { userAgent: '' },
    document: doc,
    window: { addEventListener: () => {}, innerWidth: 400, innerHeight: 800 },
    chrome,
    OmniBarDefaultPage,
    setFileReaderResult: (str) => { fileReaderResult = str; }
  };

  vm.createContext(context);
  vm.runInContext(SIDEBAR_SRC, context);
  // Wait a microtask for async init() to settle
  await new Promise(resolve => setImmediate(resolve));

  return { context, storageData, getCalls, setCalls, getEl };
}

const SAMPLE_APPS = [
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/new' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com' }
];

describe('sidebar.js default-page integration', () => {
  it('init() reads apps and defaultAppId in one call and auto-opens matching app', async () => {
    const { context, getCalls, getEl } = await bootSidebar({
      apps: SAMPLE_APPS,
      defaultAppId: 'gemini'
    });

    assert.equal(getCalls.length, 1);
    assert.deepEqual(Array.from(getCalls[0]), ['apps', 'defaultAppId']);
    assert.equal(getEl('content-panel').classList.contains('hidden'), false);
    assert.equal(getEl('app-frame').src, 'https://gemini.google.com');
  });

  it('init() stays closed when defaultAppId is null or stale', async () => {
    const nullRun = await bootSidebar({ apps: SAMPLE_APPS, defaultAppId: null });
    assert.equal(nullRun.getEl('content-panel').classList.contains('hidden'), true);
    assert.equal(nullRun.getEl('app-frame').src, undefined);

    const staleRun = await bootSidebar({ apps: SAMPLE_APPS, defaultAppId: 'missing' });
    assert.equal(staleRun.getEl('content-panel').classList.contains('hidden'), true);
    assert.equal(staleRun.getEl('app-frame').src, undefined);
  });

  it('openSettings() populates #settings-default-page with None and current apps', async () => {
    const { context, getEl } = await bootSidebar({
      apps: SAMPLE_APPS,
      defaultAppId: 'claude'
    });

    context.openSettings();
    const select = getEl('settings-default-page');
    assert.equal(select.children.length, 3);
    assert.deepEqual(
      select.children.map(o => ({ value: o.value, label: o.textContent, selected: o.selected })),
      [
        { value: '', label: 'None', selected: false },
        { value: 'claude', label: 'Claude', selected: true },
        { value: 'gemini', label: 'Gemini', selected: false }
      ]
    );
  });

  it('onDefaultPageChange persists defaultAppId and apps on fresh install, and clears to null for None', async () => {
    const { context, storageData, getEl } = await bootSidebar({});
    context.openSettings();
    const firstId = getEl('settings-default-page').children[1].value;

    context.onDefaultPageChange(firstId);
    assert.equal(storageData.defaultAppId, firstId);
    assert.ok(Array.isArray(storageData.apps));
    assert.equal(storageData.apps[0].id, firstId);

    context.onDefaultPageChange('');
    assert.equal(storageData.defaultAppId, null);
  });

  it('removeApp clears defaultAppId only when removing the default app', async () => {
    const { context, storageData } = await bootSidebar({
      apps: [...SAMPLE_APPS],
      defaultAppId: 'claude'
    });

    context.removeApp('gemini');
    assert.equal(storageData.defaultAppId, 'claude');

    context.removeApp('claude');
    assert.equal(storageData.defaultAppId, null);
  });

  it('resetToDefaults clears defaultAppId to null', async () => {
    const { context, storageData } = await bootSidebar({
      apps: [...SAMPLE_APPS],
      defaultAppId: 'claude'
    });

    context.resetToDefaults();
    assert.equal(storageData.defaultAppId, null);
  });

  it('importApps reconciles defaultAppId (clears if missing, keeps if present)', async () => {
    const { context, storageData } = await bootSidebar({
      apps: [...SAMPLE_APPS],
      defaultAppId: 'claude'
    });

    context.setFileReaderResult(JSON.stringify([
      { id: 'claude', name: 'Claude 2', url: 'https://claude.ai' }
    ]));
    context.importApps({});
    assert.equal(storageData.defaultAppId, 'claude');

    context.setFileReaderResult(JSON.stringify([
      { id: 'other', name: 'Other', url: 'https://example.com' }
    ]));
    context.importApps({});
    assert.equal(storageData.defaultAppId, null);
  });
});
