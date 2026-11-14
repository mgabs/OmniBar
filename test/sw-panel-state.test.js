const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const OmniBarDefaultPage = require('../default-page.js');
const OmniBarStripReconciler = require('../strip-reconciler.js');
const OmniBarFrameManager = require('../frame-manager.js');

const BG_SRC = fs.readFileSync(path.join(__dirname, '..', 'background.js'), 'utf8');
const SIDEBAR_SRC = fs.readFileSync(path.join(__dirname, '..', 'sidebar.js'), 'utf8');

async function bootBackground(initialSession = {}) {
  const sessionData = { ...initialSession };
  const calls = [];
  const listeners = {
    actionClicked: null,
    command: null,
    message: null,
    startup: null,
    windowRemoved: null
  };

  const chrome = {
    sidePanel: {
      setPanelBehavior: async () => {},
      open: async (opts) => { calls.push({ type: 'open', opts }); },
      close: async (opts) => { calls.push({ type: 'close', opts }); }
    },
    action: { onClicked: { addListener: fn => { listeners.actionClicked = fn; } } },
    commands: { onCommand: { addListener: fn => { listeners.command = fn; } } },
    runtime: {
      onMessage: { addListener: fn => { listeners.message = fn; } },
      onStartup: { addListener: fn => { listeners.startup = fn; } }
    },
    windows: {
      getCurrent: cb => cb({ id: 1 }),
      onRemoved: { addListener: fn => { listeners.windowRemoved = fn; } }
    },
    tabs: { query: (_q, cb) => cb([]) },
    storage: {
      session: {
        get: async (key) => {
          calls.push({ type: 'session.get', key });
          return key in sessionData ? { [key]: sessionData[key] } : {};
        },
        set: async (obj) => {
          calls.push({ type: 'session.set', obj });
          Object.assign(sessionData, obj);
        }
      }
    }
  };

  const context = { console, chrome, Set, Array };
  vm.createContext(context);
  vm.runInContext(BG_SRC, context);
  await new Promise(resolve => setImmediate(resolve));

  return { context, sessionData, calls, listeners };
}

describe('sw-panel-state (background.js + sidebar.js)', () => {
  it('hydrates openWindows from chrome.storage.session on SW wake and closes panel on toggle', async () => {
    const { listeners, calls } = await bootBackground({ openWindows: [42] });

    listeners.actionClicked({ windowId: 42 });
    const closeCall = calls.find(c => c.type === 'close');
    assert.deepEqual(JSON.parse(JSON.stringify(closeCall)), { type: 'close', opts: { windowId: 42 } });
  });

  it('invokes sidePanel.open synchronously inside user gesture without awaiting session.get', async () => {
    const { listeners, calls } = await bootBackground({});
    const beforeLen = calls.length;

    listeners.command('toggle-sidebar', { windowId: 7 });
    // First call triggered by command must be synchronous sidePanel.open
    assert.equal(calls[beforeLen].type, 'open');
    assert.deepEqual({ ...calls[beforeLen].opts }, { windowId: 7 });
    await new Promise(resolve => setImmediate(resolve));
    const setCall = calls.findLast(c => c.type === 'session.set');
    assert.deepEqual(Array.from(setCall.obj.openWindows), [7]);
  });

  it('persists panel-opened / panel-closed messages and prunes on windows.onRemoved', async () => {
    const { listeners, sessionData } = await bootBackground({});

    listeners.message({ type: 'panel-opened', windowId: 5 }, {}, () => {});
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(Array.from(sessionData.openWindows), [5]);

    assert.equal(typeof listeners.windowRemoved, 'function');
    listeners.windowRemoved(5);
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(Array.from(sessionData.openWindows), []);
  });

  it('sidebar.js keeps side panel open in openWindows on closePanel() and sends windowId on pagehide', async () => {
    const messages = [];
    let pagehideHandler = null;
    const makeEl = (id = '') => {
      const classes = new Set();
      return {
        id,
        value: '',
        textContent: '',
        innerHTML: '',
        style: {},
        dataset: {},
        children: [],
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
    const elements = new Map();
    const getEl = id => (elements.has(id) ? elements.get(id) : elements.set(id, makeEl(id)).get(id));

    const context = {
      console,
      setTimeout: () => 0,
      clearTimeout: () => {},
      requestAnimationFrame: fn => fn(),
      document: {
        title: 'OmniBar',
        getElementById: getEl,
        createElement: makeEl,
        querySelectorAll: () => [],
        addEventListener: () => {}
      },
      window: {
        addEventListener: (evt, fn) => { if (evt === 'pagehide') pagehideHandler = fn; },
        innerWidth: 400,
        innerHeight: 800
      },
      chrome: {
        windows: { getCurrent: async () => ({ id: 99 }) },
        runtime: { sendMessage: async (msg) => { messages.push(msg); } },
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

    messages.length = 0;
    context.closePanel();
    assert.equal(messages.some(m => m.type === 'panel-closed'), false);

    assert.equal(typeof pagehideHandler, 'function');
    pagehideHandler();
    assert.deepEqual(JSON.parse(JSON.stringify(messages)), [{ type: 'panel-closed', windowId: 99 }]);
  });
});
