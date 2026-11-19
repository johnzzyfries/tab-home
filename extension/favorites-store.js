/* Favorites combine selected Chrome bookmarks with local shortcuts. */
'use strict';
globalThis.FavoritesStore = class FavoritesStore {
  constructor(bookmarks, storage) {
    this.bookmarks = bookmarks;
    this.storage = storage;
  }

  async getSettings() {
    const { favorites = [], favoriteBookmarkIds = [], favoriteOrder } =
      await this.storage.get(['favorites', 'favoriteBookmarkIds', 'favoriteOrder']);
    const order = Array.isArray(favoriteOrder) ? favoriteOrder : [];
    return { custom: favorites, bookmarkIds: favoriteBookmarkIds, order };
  }

  async saveSettings({ custom, bookmarkIds }) {
    await this.storage.set({ favorites: custom, favoriteBookmarkIds: bookmarkIds });
  }

  async saveOrder(keys) {
    const { order } = await this.getSettings();
    const pending = [...keys];
    const visible = new Set(keys);
    // Keep slots for previously sorted bookmarks that are currently hidden.
    const merged = [...new Set(order)].map(key => visible.has(key) ? pending.shift() : key);
    await this.storage.set({ favoriteOrder: [...merged, ...pending] });
  }

  static customShortcut(title, address) {
    const url = FavoritesStore.normalizeUrl(address);
    return { id: crypto.randomUUID(), title: title.trim() || new URL(url).hostname, url };
  }

  visible(bookmarks, { custom, bookmarkIds, order = [] }) {
    const selected = new Set(bookmarkIds);
    const seen = new Set();
    const shortcuts = custom.map(item => ({ ...item, key: `custom:${item.id ?? item.url}` }));
    const bookmarkShortcuts = bookmarks
      .filter(item => selected.has(item.id))
      .map(item => ({ ...item, key: `bookmark:${item.id}` }));
    const favorites = [...shortcuts, ...bookmarkShortcuts].filter(item => {
      try {
        const url = new URL(item.url);
        if (!['http:', 'https:'].includes(url.protocol) || seen.has(url.href)) return false;
        seen.add(url.href);
        return true;
      } catch {
        return false;
      }
    });
    const positions = new Map(order.map((key, index) => [key, index]));
    return favorites.sort((a, b) => (positions.get(a.key) ?? order.length) - (positions.get(b.key) ?? order.length));
  }

  static normalizeUrl(input) {
    const value = input.trim();
    if (!value) throw new Error('Enter a website address.');
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(value);
    // A hostname with a port is also a valid address without a scheme.
    const hostWithPort = /^[^/:\s]+:\d+(?:\/|$)/.test(value);
    let url;
    try { url = new URL(hasScheme && !hostWithPort ? value : `https://${value}`); }
    catch { throw new Error('Enter a valid website address.'); }
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
      throw new Error('Use an http:// or https:// website address.');
    }
    return url.href;
  }

  async list() {
    const tree = await this.bookmarks.getTree();
    const favorites = [];
    function visit(nodes, folders = []) {
      for (const node of nodes) {
        if (node.url) {
          try {
            // Exclude bookmarklets and browser pages; never execute stored scripts.
            const parsed = new URL(node.url);
            if (['http:', 'https:'].includes(parsed.protocol)) {
              const url = FavoritesStore.normalizeUrl(node.url);
              favorites.push({ id: node.id, title: node.title || parsed.hostname, url, folder: folders.join(' / ') });
            }
          } catch { /* A malformed bookmark must not hide the rest. */ }
        }
        if (node.children) visit(node.children, node.title ? [...folders, node.title] : folders);
      }
    }
    visit(tree);
    return favorites;
  }
};
