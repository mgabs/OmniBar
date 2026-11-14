const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const OmniBarDefaultPage = require('../default-page.js');
const OmniBarStripReconciler = require('../strip-reconciler.js');
const OmniBarFrameManager = require('../frame-manager.js');

const SIDEBAR_SRC = fs.readFileSync(path.join(__dirname, '..', 'sidebar.js'), 'utf8');

async function bootSidebarForFrames(apps, defaultAppId) {
  const storageData = { apps, defaultAppId };
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
        toggle: (c, force) => {
          if (force === undefined) {
            if (classes.has(c)) classes.delete(c); else classes.add(c);
          } else if (force) classes.add(c);
          else classes.delete(c);
        },
        contains: c => classes.has(c)
      },
      setAttribute() {},
      remove() {},
      appendChild(ch) { this.children.push(ch); return ch; },
      addEventListener() {}
    };
  };
  const getEl = id => (elements.has(id) ? elements.get(id) : elements.set(id, makeEl(id)).get(id));
  getEl('content-panel').classList.add('hidden');
  getEl('default-app-frame').classList.add('hidden');
  getEl('settings-overlay').classList.add('hidden');
  getEl('modal-overlay').classList.add('hidden');

  const context = {
    console,
    setTimeout: () => 0,
    clearTimeout: () => {},
    requestAnimationFrame: fn => fn(),
    confirm: () => true,
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
      storage: {
        local: {
          get: async () => ({ apps: storageData.apps, defaultAppId: storageData.defaultAppId }),
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
  return { context, getEl, storageData };
}

describe('sidebar.js warm-default-frame integration', () => {
  const CLAUDE = { id: 'claude', name: 'Claude', url: 'https://claude.ai/new' };
  const GEMINI = { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com' };

  it('keeps #default-app-frame warm across switches and closePanel(), while clearing #app-frame', async () => {
    const { context, getEl } = await bootSidebarForFrames([CLAUDE, GEMINI], 'claude');
    const defFrame = getEl('default-app-frame');
    const transFrame = getEl('app-frame');

    // Initial launch opens Claude in #default-app-frame
    assert.equal(defFrame.src, CLAUDE.url);
    assert.equal(defFrame.classList.contains('hidden'), false);
    assert.equal(transFrame.classList.contains('hidden'), true);
    defFrame.onload(); // mark loaded

    // Switch to Gemini -> loads in #app-frame; #default-app-frame stays warm
    context.openApp(GEMINI);
    assert.equal(transFrame.src, GEMINI.url);
    assert.equal(transFrame.classList.contains('hidden'), false);
    assert.equal(defFrame.src, CLAUDE.url);
    assert.equal(defFrame.classList.contains('hidden'), true);

    // Switch back to Claude -> instant, spinner hidden, src not reset
    context.openApp(CLAUDE);
    assert.equal(defFrame.src, CLAUDE.url);
    assert.equal(defFrame.classList.contains('hidden'), false);
    assert.equal(getEl('load-spinner').classList.contains('hidden'), true);

    // closePanel() keeps #default-app-frame warm and clears #app-frame
    context.closePanel();
    assert.equal(defFrame.src, CLAUDE.url);
    assert.equal(defFrame.classList.contains('hidden'), true);
    assert.equal(transFrame.src, '');
  });

  it('clears #default-app-frame when defaultAppId changes in Settings', async () => {
    const { context, getEl } = await bootSidebarForFrames([CLAUDE, GEMINI], 'claude');
    const defFrame = getEl('default-app-frame');
    assert.equal(defFrame.src, CLAUDE.url);

    context.onDefaultPageChange('');
    assert.equal(defFrame.src, '');
  });
});
