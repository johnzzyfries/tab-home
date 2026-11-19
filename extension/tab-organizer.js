'use strict';

(() => {
  const board = document.getElementById('tabOrganizerWindows');
  const status = document.getElementById('tabOrganizerStatus');
  const section = board.closest('details');
  const ungrouped = -1;
  let dragId;
  let moving = false;
  let refreshTimer;
  let renderVersion = 0;
  let refreshPending = false;
  let targets = new Map();
  let locations = new Map();

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content) node.textContent = content;
    return node;
  }

  async function getAnchor(placement, destination, pinned) {
    const anchor = await chrome.tabs.get(placement.tabId);
    if (anchor.windowId !== destination.windowId || anchor.groupId !== destination.groupId ||
        anchor.pinned !== pinned) throw new Error(t('The drop position has changed.'));
    return anchor;
  }

  async function move(tabId, destination, placement) {
    if (moving || !destination || (!placement && locations.get(tabId)?.key === destination.key)) return;
    moving = true;
    ++renderVersion;
    const { windowId, groupId } = destination;
    let crossedWindows = false;
    let positioning = false;
    try {
      const tab = await chrome.tabs.get(tabId);
      if (placement) await getAnchor(placement, destination, tab.pinned);
      if (groupId !== ungrouped) {
        const group = await chrome.tabGroups.get(groupId);
        if (group.windowId !== windowId) throw new Error(t('The group has moved.'));
        if (tab.pinned) throw new Error(t('Unpin this tab in Chrome before adding it to a group.'));
      }
      if (tab.windowId !== windowId) {
        const movedTab = await chrome.tabs.move(tabId, { windowId, index: -1 });
        if (movedTab?.windowId !== windowId) throw new Error(t('Chrome did not move the tab to the target window.'));
        crossedWindows = true;
      }
      if (groupId !== ungrouped && (crossedWindows || tab.groupId !== groupId)) {
        await chrome.tabs.group({ tabIds: [tabId], groupId });
      } else if (groupId === ungrouped && !crossedWindows && tab.groupId !== ungrouped) {
        await chrome.tabs.ungroup([tabId]);
      }
      if (placement) {
        positioning = true;
        // Chrome can shift both indices when the tab moves to a new window or group.
        const current = await chrome.tabs.get(tabId);
        const anchor = await getAnchor(placement, destination, current.pinned);
        const index = anchor.index + Number(placement.after) - Number(current.index < anchor.index);
        if (index !== current.index) {
          const result = await chrome.tabs.move(tabId, { index });
          if (result?.index !== index || result.windowId !== windowId || result.groupId !== groupId) {
            throw new Error(t('Chrome could not place the tab at that position.'));
          }
        }
      }
      status.textContent = placement ? t('Tab order updated.') : t('Moved to {destination}.', { destination: destination.label });
    } catch (error) {
      const message = positioning ? 'Could not finish reordering the tab.'
        : crossedWindows ? 'Moved to the target window, but could not join the group.' : 'Could not move the tab.';
      status.textContent = t(message) + ' ' + error.message;
    } finally {
      moving = false;
      await render();
      await renderDashboard();
    }
  }

  function makeRow(tab, options) {
    const row = element('li', 'organizer-tab');
    row.dataset.tabId = tab.id;
    row.draggable = true;
    const title = tab.title || tab.url || t('Untitled tab');
    const open = element('button', 'organizer-tab-title', title);
    open.type = 'button';
    open.title = title;
    open.addEventListener('click', async () => {
      try {
        const current = await chrome.tabs.get(tab.id);
        await chrome.tabs.update(tab.id, { active: true });
        await chrome.windows.update(current.windowId, { focused: true });
      } catch {
        status.textContent = t('This tab is no longer available.');
        scheduleRefresh();
      }
    });
    const select = element('select', 'organizer-move');
    select.setAttribute('aria-label', t('Move {title}', { title }));
    select.append(new Option(t('Move…'), ''));
    for (const target of options) {
      if (target.key === locations.get(tab.id)?.key || (tab.pinned && target.groupId !== ungrouped)) continue;
      select.append(new Option(target.label, target.key));
    }
    select.disabled = select.options.length === 1;
    select.addEventListener('change', async () => {
      const key = select.value;
      select.value = '';
      if (!key) return;
      await move(tab.id, targets.get(key));
      board.querySelector('[data-tab-id="' + tab.id + '"] .organizer-move')?.focus();
    });
    row.append(open, select);
    return row;
  }

  async function render() {
    if (moving || dragId !== undefined || !section.open) {
      refreshPending = true;
      return;
    }
    refreshPending = false;
    const version = ++renderVersion;
    try {
      const [windows, groups, current] = await Promise.all([
        chrome.windows.getAll({ windowTypes: ['normal'], populate: true }),
        chrome.tabGroups.query({}),
        chrome.windows.getCurrent(),
      ]);
      if (version !== renderVersion) return;
      if (dragId !== undefined) {
        refreshPending = true;
        return;
      }

      targets = new Map();
      locations = new Map();
      const ownUrl = chrome.runtime.getURL('index.html');
      const cards = [...windows].sort((a, b) => a.id - b.id).map((window, index) => {
        const label = t('Window {n}', { n: index + 1 });
        const tabs = (window.tabs || [])
          .filter(tab => tab.id !== undefined && tab.url !== ownUrl && tab.url !== 'chrome://newtab/')
          .sort((a, b) => a.index - b.index);
        const sections = [{ id: ungrouped, title: t('Ungrouped') },
          ...groups.filter(group => group.windowId === window.id)];
        const destinations = sections.map(group => {
          const key = window.id + ':' + group.id;
          const title = group.title || t('Unnamed group');
          const target = { key, windowId: window.id, groupId: group.id, title,
            label: label + ' · ' + title, color: group.color, incognito: window.incognito };
          targets.set(key, target);
          return target;
        });
        const lanes = [];
        const populated = new Set();
        for (const tab of tabs) {
          const target = targets.get(window.id + ':' + tab.groupId) || destinations[0];
          // Ungrouped tabs may appear on either side of a native group.
          if (lanes.at(-1)?.target !== target) lanes.push({ target, tabs: [] });
          lanes.at(-1).tabs.push(tab);
          populated.add(target);
          locations.set(tab.id, { key: target.key, pinned: tab.pinned });
        }
        for (const target of destinations) {
          if (!populated.has(target)) lanes.push({ target, tabs: [] });
        }
        return { window, label, lanes, ungroupedKey: destinations[0].key, count: tabs.length };
      });

      const focusedTab = document.activeElement.closest('.organizer-tab')?.dataset.tabId;
      const focusedSelector = document.activeElement.matches('select') ? 'select' : 'button';
      board.replaceChildren(...cards.map(({ window, label, lanes, ungroupedKey, count }) => {
        const card = element('article', 'organizer-window');
        card.dataset.dropTarget = ungroupedKey;
        const heading = element('h3', '', label + (window.id === current.id ? ' · ' + t('Current') : ''));
        card.append(heading, element('p', 'organizer-count', t(count === 1 ? '{n} tab' : '{n} tabs', { n: count })));
        const options = [...targets.values()].filter(target => target.incognito === window.incognito);
        for (const { target, tabs } of lanes) {
          const lane = element('div', 'organizer-lane');
          lane.dataset.dropTarget = target.key;
          const title = element('h4', 'organizer-lane-title', target.title);
          if (target.color) title.dataset.groupColor = target.color;
          lane.append(title);
          if (tabs.length) {
            const list = element('ul', 'organizer-tab-list');
            list.append(...tabs.map(tab => makeRow(tab, options)));
            lane.append(list);
          } else {
            lane.append(element('p', 'organizer-count', t('Drop a tab here')));
          }
          card.append(lane);
        }
        return card;
      }));
      if (focusedTab) board.querySelector('[data-tab-id="' + focusedTab + '"] ' + focusedSelector)?.focus();
    } catch {
      if (version === renderVersion) {
        status.textContent = t('Could not load Chrome windows and groups. Reload Tab Home and check its tab group permission.');
      }
    }
  }

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(render, 120);
  }

  function dropTarget(event) {
    if (dragId === undefined || moving) return;
    const lane = event.target.closest('[data-drop-target]');
    const source = locations.get(dragId);
    const origin = targets.get(source?.key);
    const target = targets.get(lane?.dataset.dropTarget);
    if (!target || !origin || origin.incognito !== target.incognito ||
        (source.pinned && target.groupId !== ungrouped)) return;

    const row = event.target.closest('.organizer-tab');
    if (!row) {
      if (origin.key !== target.key) return { node: lane, target, marker: 'is-drop-target' };
      return;
    }
    const tabId = Number(row.dataset.tabId);
    if (tabId === dragId || locations.get(tabId)?.pinned !== source.pinned) return;
    const bounds = row.getBoundingClientRect();
    const after = event.clientY >= bounds.top + bounds.height / 2;
    return { node: row, target, placement: { tabId, after },
      marker: after ? 'is-drop-after' : 'is-drop-before' };
  }

  function clearHighlight() {
    board.querySelector('.is-drop-target, .is-drop-before, .is-drop-after')
      ?.classList.remove('is-drop-target', 'is-drop-before', 'is-drop-after');
  }

  board.addEventListener('dragstart', event => {
    const row = event.target.closest('.organizer-tab');
    if (!row || moving || event.target.closest('select')) {
      event.preventDefault();
      return;
    }
    dragId = Number(row.dataset.tabId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-tabout-tab', String(dragId));
    board.classList.add('is-dragging');
  });
  board.addEventListener('dragover', event => {
    const drop = dropTarget(event);
    clearHighlight();
    if (!drop) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    drop.node.classList.add(drop.marker);
  });
  board.addEventListener('dragleave', event => {
    if (!board.contains(event.relatedTarget)) clearHighlight();
  });
  function endDrag() {
    dragId = undefined;
    clearHighlight();
    board.classList.remove('is-dragging');
    if (refreshPending) scheduleRefresh();
  }
  board.addEventListener('dragend', endDrag);
  board.addEventListener('drop', event => {
    const drop = dropTarget(event);
    if (!drop) return;
    event.preventDefault();
    const id = dragId;
    endDrag();
    move(id, drop.target, drop.placement);
  });

  section.addEventListener('toggle', () => { if (section.open) scheduleRefresh(); });
  for (const [api, events] of [
    [chrome.tabs, ['onCreated', 'onUpdated', 'onRemoved', 'onMoved', 'onAttached', 'onDetached']],
    [chrome.windows, ['onCreated', 'onRemoved']],
    [chrome.tabGroups, ['onCreated', 'onUpdated', 'onRemoved', 'onMoved']],
  ]) {
    for (const event of events) api?.[event]?.addListener(scheduleRefresh);
  }
  render();
})();
