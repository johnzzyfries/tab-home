const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const source = readFileSync('extension/app.js', 'utf8');

async function openDashboard() {
  const tabs = [
    { id: 1, url: 'chrome-extension://tabout/index.html', title: 'Tab Out' },
    { id: 2, url: 'https://a.example/1', title: 'First page' },
    { id: 3, url: 'https://a.example/2', title: 'Second page' },
    { id: 4, url: 'https://b.example/', title: 'Third page' },
  ].map(tab => ({ windowId: 1, active: tab.id === 1, ...tab }));
  const nodes = new Map();
  const clickListeners = [];
  const removedListeners = [];
  const timers = new Map();
  let timerId = 0;
  function removeTab(id) {
    tabs.splice(tabs.findIndex(tab => tab.id === id), 1);
    for (const listener of removedListeners) listener(id, { windowId: 1, isWindowClosing: false });
  }
  const context = vm.createContext({
    URL,
    tabOutPreferences: { language: 'en' },
    t: (message, values = {}) => message.replace(/\{(\w+)\}/g, (_, key) => values[key]),
    document: {
      addEventListener(event, listener) {
        if (event === 'click') clickListeners.push(listener);
      },
      getElementById(id) {
        if (id === 'deferredColumn') return null;
        if (!nodes.has(id)) {
          nodes.set(id, {
            innerHTML: '', textContent: '', style: {},
            classList: { add() {}, remove() {} },
            querySelectorAll: () => [],
            replaceChildren() { this.innerHTML = ''; },
          });
        }
        return nodes.get(id);
      },
    },
    chrome: {
      runtime: { id: 'tabout' },
      tabs: {
        query: async () => structuredClone(tabs),
        remove: async id => removeTab(id),
        onRemoved: { addListener: listener => removedListeners.push(listener) },
      },
    },
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); },
  });
  await vm.runInContext(source, context);

  return {
    removeTab,
    async clickClose(url) {
      const action = { dataset: { action: 'close-single-tab', tabUrl: url }, closest: () => null };
      await clickListeners[0]({ target: { closest: () => action }, stopPropagation() {} });
    },
    async flushRefresh() {
      for (const callback of timers.values()) await callback();
      timers.clear();
    },
    get total() { return Number(nodes.get('openTabsTotal').textContent); },
    get summary() {
      const node = nodes.get('openTabsSectionCount');
      return node.textContent || node.innerHTML;
    },
    get cards() { return nodes.get('openTabsMissions').innerHTML; },
  };
}

test('updates the summary and cards after closing tabs in Tab Out and in Chrome', async () => {
  const dashboard = await openDashboard();
  assert.equal(dashboard.total, 3);
  assert.match(dashboard.summary, /2 domains.*Close all 3 tabs/);

  await dashboard.clickClose('https://a.example/1');
  await dashboard.flushRefresh();
  assert.equal(dashboard.total, 2);
  assert.match(dashboard.summary, /2 domains.*Close all 2 tabs/);
  assert.doesNotMatch(dashboard.cards, /First page/);

  dashboard.removeTab(3);
  await dashboard.flushRefresh();
  assert.equal(dashboard.total, 1);
  assert.match(dashboard.summary, /1 domain.*Close all 1 tab/);
  assert.doesNotMatch(dashboard.cards, /Second page/);

  dashboard.removeTab(4);
  await dashboard.flushRefresh();
  assert.equal(dashboard.total, 0);
  assert.equal(dashboard.summary, '0 domains');
  assert.match(dashboard.cards, /missions-empty-state/);
});
