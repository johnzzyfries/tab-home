const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.existsSync('extension/favorites-store.js') ? fs.readFileSync('extension/favorites-store.js', 'utf8') : '';
const context = vm.createContext({ URL, crypto: require('node:crypto').webcrypto });
vm.runInContext(source, context);

test('accepts web addresses and rejects executable or browser URLs', () => {
  assert.ok(context.FavoritesStore, 'Favorites store is available');
  assert.equal(context.FavoritesStore.normalizeUrl(' example.com/path '), 'https://example.com/path');
  assert.equal(context.FavoritesStore.normalizeUrl('http://localhost:3000'), 'http://localhost:3000/');
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'chrome://settings', '', 'not a website']) {
    assert.throws(() => context.FavoritesStore.normalizeUrl(url));
  }
});

test('reads websites from Chrome bookmark folders in browser order', async () => {
  const tree = [{ id: '0', children: [
    { id: '1', title: 'Bookmarks bar', children: [
      { id: '10', title: 'MyEd', url: 'https://myed.ed.ac.uk/' },
      { id: '11', title: 'Study', children: [
        { id: '12', title: 'Docs', url: 'https://docs.google.com/' },
        { id: '13', title: 'Script', url: 'javascript:alert(1)' },
      ] },
    ] },
    { id: '2', title: 'Other bookmarks', children: [
      { id: '20', title: '', url: 'https://example.com/' },
      { id: '21', title: 'Broken', url: 'invalid' },
      { id: '22', title: 'Settings', url: 'chrome://settings/' },
    ] },
  ] }];
  const before = JSON.stringify(tree);
  const store = new context.FavoritesStore({ getTree: async () => tree });
  const items = await store.list();
  assert.deepEqual(Array.from(items, item => item.id), ['10', '12', '20']);
  assert.equal(items[1].title, 'Docs');
  assert.equal(items[2].title, 'example.com');
  assert.equal(items[0].url, 'https://myed.ed.ac.uk/');
  assert.equal(JSON.stringify(tree), before, 'Reading favorites must not modify bookmarks');
});

test('reloads current bookmarks instead of keeping a separate favorites copy', async () => {
  let tree = [{ id: '1', children: [{ id: '10', title: 'Before', url: 'https://example.com/' }] }];
  const store = new context.FavoritesStore({ getTree: async () => tree });
  assert.equal((await store.list())[0].title, 'Before');
  tree[0].children[0].title = 'After';
  assert.equal((await store.list())[0].title, 'After');
  tree[0].children = [];
  assert.equal((await store.list()).length, 0);
});

test('propagates bookmark permission failures so the interface can report them', async () => {
  const store = new context.FavoritesStore({ getTree: async () => { throw new Error('Permission denied'); } });
  await assert.rejects(() => store.list(), /Permission denied/);
});

test('shows only selected bookmarks alongside existing custom shortcuts', async () => {
  const existing = { id: 'custom', title: 'Custom', url: 'https://custom.example/' };
  const data = { favorites: [existing], deferred: ['reading'] };
  const storage = {
    get: async () => structuredClone(data),
    set: async patch => Object.assign(data, structuredClone(patch)),
  };
  const nodes = [
    { id: 'first', title: 'First', url: 'https://first.example/' },
    { id: 'second', title: 'Second', url: 'https://second.example/' },
  ];
  const store = new context.FavoritesStore({ getTree: async () => nodes }, storage);
  const draft = await store.getSettings();
  assert.deepEqual(Array.from(store.visible(nodes, draft), item => item.title), ['Custom']);
  draft.bookmarkIds.push('second');
  const added = context.FavoritesStore.customShortcut(' Outside ', 'outside.example');
  draft.custom.push(added);
  await store.saveSettings(draft);
  nodes[1].title = 'Renamed';
  const saved = await store.getSettings();
  assert.deepEqual(Array.from(store.visible(nodes, saved), item => item.title), ['Custom', 'Outside', 'Renamed']);
  assert.equal(added.url, 'https://outside.example/');
  assert.deepEqual(data.deferred, ['reading']);
  saved.custom = saved.custom.filter(item => item.id !== existing.id);
  saved.bookmarkIds = [];
  await store.saveSettings(saved);
  assert.deepEqual(Array.from(store.visible(nodes, await store.getSettings()), item => item.title), ['Outside']);
});

test('persists a mixed order by favorite identity after bookmark edits and new selections', async () => {
  const custom = { id: '10', title: 'Custom', url: 'https://custom.example/' };
  const data = { favorites: [custom], favoriteBookmarkIds: ['10', '20'] };
  const storage = {
    get: async () => structuredClone(data),
    set: async patch => Object.assign(data, structuredClone(patch)),
  };
  const bookmarks = [
    { id: '10', title: 'First', url: 'https://first.example/' },
    { id: '20', title: 'Second', url: 'https://second.example/' },
    { id: '30', title: 'New bookmark', url: 'https://new.example/' },
  ];
  const store = new context.FavoritesStore({}, storage);
  const titles = async () => Array.from(store.visible(bookmarks, await store.getSettings()), item => item.title);
  assert.deepEqual(await titles(), ['Custom', 'First', 'Second']);

  const [shortcut, first, second] = store.visible(bookmarks, await store.getSettings());
  await store.saveOrder([second.key, shortcut.key, first.key]);
  const draft = await store.getSettings();
  draft.bookmarkIds.push('30');
  await store.saveSettings(draft);
  bookmarks[1].title = 'Updated';
  bookmarks[1].url = 'https://updated.example/';
  assert.deepEqual(await titles(), ['Updated', 'Custom', 'First', 'New bookmark']);
  assert.deepEqual(data.favorites, [custom]);
  assert.deepEqual(data.favoriteBookmarkIds, ['10', '20', '30']);
});

test('retains previously ordered bookmarks while they are temporarily unavailable', async () => {
  const data = { favoriteOrder: ['custom:a', 'bookmark:10', 'custom:b'] };
  const storage = {
    get: async () => structuredClone(data),
    set: async patch => Object.assign(data, structuredClone(patch)),
  };
  const store = new context.FavoritesStore({}, storage);
  await store.saveOrder(['custom:b', 'custom:a']);
  assert.deepEqual(data.favoriteOrder, ['custom:b', 'bookmark:10', 'custom:a']);
});
