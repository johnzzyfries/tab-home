const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const source = readFileSync('extension/app.js', 'utf8');

async function openDashboard(pages = [
  { id: 2, url: 'https://a.example/1', title: 'First page' },
  { id: 3, url: 'https://a.example/2', title: 'Second page' },
  { id: 4, url: 'https://b.example/', title: 'Third page' },
]) {
  const tabs = [
    { id: 1, url: 'chrome-extension://tabout/index.html', title: 'Tab Out' }, ...pages,
  ].map(tab => ({ windowId: 1, active: tab.id === 1, ...tab }));
  const nodes = new Map();
  const clickListeners = [];
  const events = { onRemoved: [], onCreated: [], onUpdated: [] };
  const emit = (name, ...args) => events[name].forEach(listener => listener(...args));
  const timers = new Map();
  let timerId = 0;
  function removeTab(id) {
    const index = tabs.findIndex(tab => tab.id === id);
    assert.notEqual(index, -1, 'Chrome can only close an existing tab');
    tabs.splice(index, 1);
    emit('onRemoved', id, { windowId: 1, isWindowClosing: false });
  }
  const context = vm.createContext({
    URL,
    tabOutPreferences: { language: 'en' },
    t: (message, values = {}) => message.replace(/\{(\w+)\}/g, (_, key) => values[key]),
    document: {
      querySelectorAll: () => [],
      addEventListener(event, listener) {
        if (event === 'click') clickListeners.push(listener);
      },
      getElementById(id) {
        if (id === 'deferredColumn') return null;
        if (!nodes.has(id)) {
          nodes.set(id, {
            textContent: '', style: {},
            get innerHTML() { return this.textContent; },
            set innerHTML(value) { this.textContent = value; },
            classList: { add() {}, remove() {} },
            querySelectorAll: () => [],
            replaceChildren() { this.innerHTML = ''; },
          });
        }
        return nodes.get(id);
      },
    },
    chrome: {
      runtime: { id: 'tabout', getURL: path => new URL(path, 'chrome-extension://tabout/').href },
      tabs: {
        query: async () => structuredClone(tabs),
        remove: async ids => [ids].flat().forEach(removeTab),
        ...Object.fromEntries(Object.entries(events).map(([event, listeners]) => [event, {
          addListener: listener => listeners.push(listener),
        }])),
      },
    },
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); },
  });
  await vm.runInContext(source, context);

  return {
    removeTab,
    createTab(page) {
      const tab = { windowId: 1, active: false, ...page };
      tabs.push(tab);
      emit('onCreated', tab);
    },
    navigateTab(id, url) {
      const tab = tabs.find(tab => tab.id === id);
      tab.url = url;
      emit('onUpdated', id, { url }, tab);
    },
    async click(action, data) {
      const element = { dataset: { action, ...data }, closest: () => null };
      await clickListeners[0]({ target: { closest: () => element }, stopPropagation() {} });
    },
    async flushRefresh() {
      for (const callback of timers.values()) await callback();
      timers.clear();
    },
    get total() { return Number(nodes.get('openTabsTotal').textContent); },
    get summary() { return nodes.get('openTabsSectionCount').textContent; },
    get cards() { return nodes.get('openTabsMissions').innerHTML; },
    get tabIds() { return tabs.map(tab => tab.id); },
  };
}

test('updates the summary and cards after closing tabs in Tab Out and in Chrome', async () => {
  const dashboard = await openDashboard();
  assert.equal(dashboard.total, 3);
  assert.match(dashboard.summary, /2 domains.*Close all 3 tabs/);

  await dashboard.click('close-single-tab', { tabUrl: 'https://a.example/1' });
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

test('updates the dashboard for new tabs and subsequent navigation', async () => {
  const dashboard = await openDashboard([]);
  dashboard.createTab({ id: 2, url: 'https://a.example/', title: 'New page' });
  await dashboard.flushRefresh();
  assert.equal(dashboard.total, 1);
  assert.match(dashboard.summary, /1 domain.*Close all 1 tab/);

  dashboard.navigateTab(2, 'chrome://settings/');
  await dashboard.flushRefresh();
  assert.equal(dashboard.total, 0);
  assert.equal(dashboard.summary, '0 domains');

  dashboard.createTab({ id: 3, url: '', pendingUrl: 'https://b.example/' });
  await dashboard.flushRefresh();
  assert.equal(dashboard.total, 0);
  dashboard.navigateTab(3, 'https://b.example/');
  await dashboard.flushRefresh();
  assert.equal(dashboard.total, 1);
  assert.match(dashboard.cards, /b\.example/);
});

test('closing a website card leaves the homepage on the same host open', async () => {
  const dashboard = await openDashboard([
    { id: 2, url: 'https://github.com/', title: 'Home' },
    { id: 3, url: 'https://github.com/example/project', title: 'Repository' },
  ]);
  const button = dashboard.cards.match(/data-action="close-domain-tabs" data-domain-id="([^"]*github[^"]*)"/);
  assert.ok(button, 'GitHub card is shown separately');
  await dashboard.click('close-domain-tabs', { domainId: button[1] });
  assert.deepEqual(dashboard.tabIds, [1, 2]);
});

test('close all uses the current Chrome tabs even before the next dashboard refresh', async () => {
  const dashboard = await openDashboard();
  dashboard.createTab({ id: 5, url: 'https://new.example/', title: 'New page' });
  dashboard.createTab({ id: 6, url: 'chrome://settings/', title: 'Settings' });
  await dashboard.click('close-all-open-tabs');
  assert.deepEqual(dashboard.tabIds, [1, 6]);
});

test('pages without a hostname appear in a card and can be closed', async () => {
  const dashboard = await openDashboard([{ id: 2, url: 'data:text/plain,QA', title: 'Data page' }]);
  assert.equal(dashboard.total, 1);
  assert.match(dashboard.summary, /1 domain.*Close all 1 tab/);
  assert.match(dashboard.cards, /Other tabs/);
  await dashboard.click('close-all-open-tabs');
  assert.deepEqual(dashboard.tabIds, [1]);
});

test('website cards load icons from the Chrome favicon cache', async () => {
  const dashboard = await openDashboard();
  const faviconUrl = new URL(dashboard.cards.match(/<img class="chip-favicon" src="([^"]+)"/)[1].replaceAll('&amp;', '&'));
  assert.equal(faviconUrl.protocol, 'chrome-extension:');
  assert.equal(faviconUrl.pathname, '/_favicon/');
  assert.equal(faviconUrl.searchParams.get('pageUrl'), 'https://a.example/1');
});
