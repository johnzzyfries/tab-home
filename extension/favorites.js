'use strict';
(() => {
  const store = new FavoritesStore(chrome.bookmarks, chrome.storage.local);
  const grid = document.getElementById('favoritesGrid');
  const status = document.getElementById('favoritesStatus');
  const dialog = document.getElementById('favoritesDialog');
  const picker = document.getElementById('bookmarkPicker');
  const pickerStatus = document.getElementById('bookmarkPickerStatus');
  const search = document.getElementById('favoriteSearch');
  const customList = document.getElementById('favoriteCustomList');
  const addForm = document.getElementById('favoriteAddForm');
  const save = document.getElementById('favoritesSave');
  const error = document.getElementById('favoritesEditError');
  let bookmarks = [];
  let bookmarksAvailable = false;
  let renderVersion = 0;
  let draft;
  let saving = false;
  let draggedTile;
  let highlightedTile;
  let savingOrder = false;

  function makeTile(item, canReorder) {
    const tile = document.createElement('a');
    tile.className = 'favorite-tile';
    tile.dataset.favoriteKey = item.key;
    tile.draggable = canReorder;
    if (canReorder) tile.setAttribute('aria-keyshortcuts', 'Shift+ArrowLeft Shift+ArrowRight');
    tile.title = `${item.title}\n${item.url}`;
    tile.setAttribute('aria-label', item.title);
    tile.href = item.url;
    tile.target = '_blank';
    tile.rel = 'noopener noreferrer';
    const icon = document.createElement('span');
    icon.className = 'favorite-icon';
    const letter = document.createElement('span');
    letter.textContent = Array.from(item.title || new URL(item.url).hostname)[0].toUpperCase();
    icon.append(letter);
    // Chrome's favicon cache avoids requests to third-party icon services.
    const image = document.createElement('img');
    const favicon = new URL(chrome.runtime.getURL('/_favicon/'));
    favicon.searchParams.set('pageUrl', item.url);
    favicon.searchParams.set('size', '64');
    image.alt = '';
    image.draggable = false;
    image.hidden = true;
    image.addEventListener('load', () => { image.hidden = false; letter.hidden = true; });
    image.addEventListener('error', () => { image.hidden = true; letter.hidden = false; });
    image.src = favicon.href;
    icon.append(image);
    const label = document.createElement('span');
    label.className = 'favorite-label';
    label.textContent = item.title;
    tile.append(icon, label);
    return tile;
  }

  async function render() {
    if (draggedTile || savingOrder) return;
    const version = ++renderVersion;
    try {
      const [settings, bookmarkResult] = await Promise.all([
        store.getSettings(),
        store.list().then(items => ({ items, available: true }), () => ({ items: [], available: false })),
      ]);
      if (version !== renderVersion || draggedTile || savingOrder) return;
      bookmarks = bookmarkResult.items;
      bookmarksAvailable = bookmarkResult.available;
      const favorites = store.visible(bookmarks, settings);
      const focusedKey = grid.contains(document.activeElement) ? document.activeElement.dataset.favoriteKey : null;
      const tiles = favorites.map(item => makeTile(item, favorites.length > 1));
      grid.replaceChildren(...tiles);
      if (focusedKey) tiles.find(tile => tile.dataset.favoriteKey === focusedKey)?.focus();
      status.textContent = !bookmarksAvailable
        ? t('Chrome bookmarks are unavailable. You can still add custom websites.')
        : favorites.length ? '' : t('Choose bookmarks or add a website using Edit favorites.');
      if (dialog.open) renderPicker();
    } catch {
      if (version === renderVersion) status.textContent = t('Could not load favorites. Refresh to try again.');
    }
  }

  function highlight(tile) {
    if (highlightedTile === tile) return;
    highlightedTile?.classList.remove('is-favorite-drop-target');
    highlightedTile = tile;
    highlightedTile?.classList.add('is-favorite-drop-target');
  }

  function endDrag() {
    draggedTile?.classList.remove('is-favorite-dragging');
    draggedTile = undefined;
    highlight(undefined);
    if (refreshPending) refresh();
  }

  async function moveTile(tile, target) {
    const previous = Array.from(grid.children);
    const restoreFocus = tile === document.activeElement;
    savingOrder = true;
    ++renderVersion;
    // Dropping onto a favorite takes its slot, shifting the intervening favorites.
    if (previous.indexOf(tile) < previous.indexOf(target)) target.after(tile);
    else target.before(tile);
    if (restoreFocus) tile.focus();
    try {
      await store.saveOrder(Array.from(grid.children, item => item.dataset.favoriteKey));
    } catch {
      grid.replaceChildren(...previous);
      if (restoreFocus) tile.focus();
      status.textContent = t('Could not save the favorites order.');
    } finally {
      savingOrder = false;
      if (refreshPending) refresh();
    }
  }

  grid.addEventListener('dragstart', event => {
    const tile = event.target.closest('.favorite-tile');
    if (!tile?.draggable || savingOrder) {
      event.preventDefault();
      return;
    }
    draggedTile = tile;
    ++renderVersion;
    tile.classList.add('is-favorite-dragging');
    event.dataTransfer.clearData();
    event.dataTransfer.setData('application/x-tabout-favorite', tile.dataset.favoriteKey);
    event.dataTransfer.effectAllowed = 'move';
  });
  grid.addEventListener('dragover', event => {
    if (!draggedTile) return;
    const tile = event.target.closest('.favorite-tile');
    const target = tile === draggedTile ? null : tile;
    highlight(target);
    if (!target) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  });
  grid.addEventListener('dragleave', event => {
    if (!grid.contains(event.relatedTarget)) highlight(undefined);
  });
  grid.addEventListener('dragend', endDrag);
  grid.addEventListener('drop', event => {
    if (!draggedTile) return;
    const tile = event.target.closest('.favorite-tile');
    event.preventDefault();
    if (tile && tile !== draggedTile) moveTile(draggedTile, tile);
    endDrag();
  });
  grid.addEventListener('keydown', event => {
    if (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || savingOrder || draggedTile) return;
    const tile = event.target.closest('.favorite-tile');
    const target = event.key === 'ArrowLeft' ? tile?.previousElementSibling
      : event.key === 'ArrowRight' ? tile?.nextElementSibling : null;
    if (!target) return;
    event.preventDefault();
    moveTile(tile, target);
  });

  function renderPicker() {
    const query = search.value.trim().toLowerCase();
    const matches = bookmarks.filter(item =>
      [item.title, item.url, item.folder].some(value => value.toLowerCase().includes(query)));
    pickerStatus.textContent = !bookmarksAvailable ? t('Could not read Chrome bookmarks.')
      : matches.length ? '' : query ? t('No matching bookmarks.') : t('No websites in Chrome bookmarks.');
    const focusedId = picker.contains(document.activeElement) ? document.activeElement.value : null;
    const rows = matches.map(item => {
      const row = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.disabled = saving;
      checkbox.type = 'checkbox';
      checkbox.value = item.id;
      checkbox.checked = draft.bookmarkIds.has(item.id);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) draft.bookmarkIds.add(item.id);
        else draft.bookmarkIds.delete(item.id);
      });
      const label = document.createElement('span');
      const name = document.createElement('span');
      name.textContent = item.title;
      const detail = document.createElement('small');
      detail.textContent = [item.folder, item.url].filter(Boolean).join(' · ');
      label.append(name, detail);
      row.append(checkbox, label);
      return row;
    });
    picker.replaceChildren(...rows);
    if (focusedId) {
      const row = rows.find(item => item.firstChild.value === focusedId);
      (row?.firstChild || search).focus();
    }
  }

  function renderCustomList() {
    const rows = draft.custom.map(item => {
      const row = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = item.title;
      name.title = item.url;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = t('Remove');
      remove.setAttribute('aria-label', t('Remove {name}', { name: item.title }));
      remove.addEventListener('click', () => {
        draft.custom = draft.custom.filter(entry => entry.id !== item.id);
        renderCustomList();
        document.getElementById('favoriteUrl').focus();
      });
      row.append(name, remove);
      return row;
    });
    customList.replaceChildren(...rows);
  }

  const manage = document.getElementById('favoritesManage');
  manage.addEventListener('click', async () => {
    manage.disabled = true;
    try {
      const settings = await store.getSettings();
      draft = { custom: settings.custom, bookmarkIds: new Set(settings.bookmarkIds) };
      search.value = '';
      addForm.reset();
      error.textContent = '';
      renderPicker();
      renderCustomList();
      dialog.showModal();
      search.focus();
      render();
    } catch {
      status.textContent = t('Could not open the favorites editor. Refresh to try again.');
    } finally {
      manage.disabled = false;
    }
  });

  search.addEventListener('input', renderPicker);
  function addShortcut() {
    const item = FavoritesStore.customShortcut(
      document.getElementById('favoriteName').value, document.getElementById('favoriteUrl').value);
    if (draft.custom.some(entry => entry.url === item.url)) {
      throw new Error('This website is already in your custom list.');
    }
    draft.custom.push(item);
    addForm.reset();
    renderCustomList();
  }

  addForm.addEventListener('submit', event => {
    event.preventDefault();
    if (saving) return;
    error.textContent = '';
    try {
      addShortcut();
      save.focus();
    } catch (err) {
      error.textContent = t(err.message);
    }
  });

  document.getElementById('favoritesCancel').addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
  dialog.addEventListener('close', () => manage.focus());
  save.addEventListener('click', async () => {
    if (saving) return;
    error.textContent = '';
    let controls = [];
    try {
      if (document.getElementById('favoriteUrl').value.trim() ||
          document.getElementById('favoriteName').value.trim()) addShortcut();
      saving = true;
      controls = Array.from(dialog.querySelectorAll('input, button'));
      controls.forEach(control => { control.disabled = true; });
      await store.saveSettings({ custom: draft.custom, bookmarkIds: [...draft.bookmarkIds] });
      dialog.close();
      render();
    } catch (err) {
      error.textContent = saving ? t('Could not save favorites.') : t(err.message);
    } finally {
      saving = false;
      controls.forEach(control => { control.disabled = false; });
      if (dialog.open) renderPicker();
    }
  });

  let refreshTimer;
  let refreshPending = false;
  function refresh() {
    ++renderVersion;
    clearTimeout(refreshTimer);
    refreshPending = true;
    if (draggedTile || savingOrder) return;
    refreshTimer = setTimeout(() => {
      if (draggedTile || savingOrder) return;
      refreshPending = false;
      render();
    }, 100);
  }
  for (const event of ['onCreated', 'onRemoved', 'onChanged', 'onMoved', 'onChildrenReordered', 'onImportEnded']) {
    chrome.bookmarks?.[event]?.addListener(refresh);
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.favorites || changes.favoriteBookmarkIds || changes.favoriteOrder)) refresh();
  });
  render();
})();
