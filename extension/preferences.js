'use strict';

const tabOutPreferences = (() => {
  const root = document.documentElement;
  const themeKey = 'tabOutTheme';
  const languageKey = 'tabOutLanguage';
  const paletteKey = 'tabOutPalettes';
  const defaults = {
    light: { background: '#fcfdfd', panel: '#e3eff7' },
    dark: { background: '#212121', panel: '#2f2f2f' },
  };

  function readPalettes() {
    const palettes = structuredClone(defaults);
    try {
      const stored = JSON.parse(localStorage.getItem(paletteKey));
      for (const [theme, colors] of Object.entries(palettes)) {
        for (const surface of Object.keys(colors)) {
          const color = stored?.[theme]?.[surface];
          if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) colors[surface] = color;
        }
      }
    } catch { /* Use the default colors if saved data is malformed. */ }
    return palettes;
  }

  let palettes = readPalettes();

  function needsLightInk(hex) {
    const channels = hex.slice(1).match(/../g).map(pair => parseInt(pair, 16) / 255);
    const [r, g, b] = channels.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return .2126 * r + .7152 * g + .0722 * b < .179;
  }

  function read(key, options, fallback) {
    const value = localStorage.getItem(key);
    return options.includes(value) ? value : fallback;
  }

  function updateTheme() {
    const mode = read(themeKey, ['auto', 'light', 'dark', 'pastel', 'custom'], 'auto');
    const hour = new Date().getHours();
    const daytimeTheme = hour >= 7 && hour < 19 ? 'light' : 'dark';
    const followsClock = mode === 'auto' || mode === 'custom';
    const theme = followsClock ? daytimeTheme : mode === 'dark' ? 'dark' : 'light';
    if (root.dataset.theme !== theme) root.dataset.theme = theme;
    if (root.dataset.themeMode !== mode) root.dataset.themeMode = mode;

    for (const surface of ['background', 'panel']) {
      const property = '--custom-' + surface;
      const tone = surface + 'Tone';
      if (mode === 'custom') {
        const color = palettes[theme][surface];
        if (root.style.getPropertyValue(property) !== color) {
          root.style.setProperty(property, color);
          root.dataset[tone] = needsLightInk(color) ? 'dark' : 'light';
        }
      } else if (root.dataset[tone]) {
        root.style.removeProperty(property);
        delete root.dataset[tone];
      }
    }
    const control = document.getElementById('themeMode');
    if (control && control.value !== mode) control.value = mode;
  }

  function bindColorEditor() {
    const dialog = document.getElementById('paletteDialog');
    const opener = document.getElementById('paletteOpen');
    const theme = document.getElementById('paletteTheme');
    const sample = document.getElementById('paletteSample');
    const sampleCard = document.getElementById('paletteSampleCard');
    let draft;

    function renderSample() {
      const { background, panel } = draft[theme.value];
      sample.style.backgroundColor = background;
      sample.style.color = needsLightInk(background) ? '#fff' : '#000';
      sampleCard.style.backgroundColor = panel;
      sampleCard.style.color = needsLightInk(panel) ? '#fff' : '#000';
    }
    const inputs = {
      background: document.getElementById('paletteBackground'),
      panel: document.getElementById('palettePanel'),
    };
    const outputs = {
      background: document.getElementById('paletteBackgroundHex'),
      panel: document.getElementById('palettePanelHex'),
    };

    function showValues() {
      for (const [surface, input] of Object.entries(inputs)) {
        input.value = draft[theme.value][surface];
        outputs[surface].textContent = input.value.toUpperCase();
      }
      renderSample();
    }

    opener.addEventListener('click', () => {
      draft = structuredClone(palettes);
      theme.value = root.dataset.theme;
      showValues();
      dialog.showModal();
    });
    theme.addEventListener('change', showValues);
    for (const [surface, input] of Object.entries(inputs)) {
      input.addEventListener('input', () => {
        draft[theme.value][surface] = input.value;
        outputs[surface].textContent = input.value.toUpperCase();
        renderSample();
      });
    }
    document.getElementById('paletteReset').addEventListener('click', () => {
      draft[theme.value] = { ...defaults[theme.value] };
      showValues();
    });
    document.getElementById('paletteSave').addEventListener('click', () => {
      localStorage.setItem(paletteKey, JSON.stringify(draft));
      palettes = draft;
      updateTheme();
      dialog.close();
    });
    document.getElementById('paletteCancel').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      opener.focus();
    });
  }

  const language = read(languageKey, ['en', 'zh-CN'], 'en');
  root.lang = language;
  updateTheme();

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-i18n]').forEach(node => {
      node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
      node.placeholder = t(node.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-label]').forEach(node => {
      node.setAttribute('aria-label', t(node.dataset.i18nLabel));
    });
    const theme = document.getElementById('themeMode');
    const locale = document.getElementById('languageMode');
    locale.value = language;
    bindColorEditor();
    updateTheme();
    theme.addEventListener('change', () => {
      localStorage.setItem(themeKey, theme.value);
      updateTheme();
    });
    locale.addEventListener('change', () => {
      localStorage.setItem(languageKey, locale.value);
      location.reload();
    });
  });
  window.addEventListener('focus', updateTheme);
  document.addEventListener('visibilitychange', updateTheme);
  window.addEventListener('storage', event => {
    if (event.key === paletteKey || event.key === null) palettes = readPalettes();
    if (event.key === themeKey || event.key === paletteKey || event.key === null) updateTheme();
    if (event.key === languageKey && event.newValue !== language && !document.querySelector('dialog[open]')) {
      location.reload();
    }
  });
  setInterval(updateTheme, 1000 * 15);
  return { language };
})();

function t(message, values = {}) {
  const template = tabOutPreferences.language === 'zh-CN' && Object.hasOwn(tabOutChinese, message)
    ? tabOutChinese[message] : message;
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}

const tabOutChinese = {
  'Pastel': '柔和彩色', 'Custom': '自定义', 'Preview': '预览',
  'Saved colors apply when you choose Custom in the Theme menu.': '保存后，在主题菜单选择「自定义」即可使用。',
  'Adjust colors': '调节颜色', 'Preview theme': '预览主题',
  'Page background': '页面背景', 'Card color': '卡片颜色',
  'Reset this theme': '恢复当前主题默认颜色', 'Save colors': '保存颜色',
  'Appearance': '外观', 'Theme': '主题', 'Language': '语言',
  'Auto': '自动', 'Light': '浅色', 'Dark': '深色',
  'Favorites': '收藏', 'Edit favorites': '编辑收藏',
  'Adapted by Ziyuan Zhao': '由 Ziyuan Zhao 改版',
  'Enjoying Tab Out?': '喜欢这个版本？',
  'Give it a star on GitHub': '去 GitHub 点个小星星',
  'You have': '你打开了', 'Tab Out tabs open. Keep just this one?': '个 Tab Out 标签页。只保留当前页？',
  'Close extras': '关闭多余页面', 'Windows & groups': '窗口与群组',
  'Drag a tab up or down to reorder it, or move it to another window or group.': '上下拖动标签页可排序，也可以拖到其他窗口或群组。',
  'Open tabs': '打开的标签页', 'Saved for later': '稍后阅读', 'Archive': '归档',
  'Nothing saved. Living in the moment.': '暂无稍后阅读的页面。',
  'Search archived tabs...': '搜索已归档的标签页…',
  'Choose Chrome bookmarks': '选择 Chrome 书签', 'Search bookmarks': '搜索书签',
  'Custom websites': '自定义网站', 'Website address': '网站地址', 'Name (optional)': '名称（可选）',
  'Add website': '添加网站', 'Cancel': '取消', 'Save favorites': '保存收藏',
  'Inbox zero, but for tabs.': '没有打开的网页', "You're free.": '打开的网页会显示在这里。',
  'just now': '刚刚', 'yesterday': '昨天', '{n} min ago': '{n} 分钟前',
  '{n} hr ago': '{n} 小时前', '{n} hrs ago': '{n} 小时前', '{n} days ago': '{n} 天前',
  '{n} domain': '{n} 个网站', '{n} domains': '{n} 个网站', '{n} item': '{n} 项', '{n} items': '{n} 项',
  'Homepages': '网站首页', 'Local Files': '本地文件', 'YouTube Video': 'YouTube 视频',
  'Save for later': '稍后阅读', 'Close this tab': '关闭此标签页', '+{n} more': '另有 {n} 个',
  '{n} tab open': '{n} 个标签页', '{n} tabs open': '{n} 个标签页',
  '{n} duplicate': '{n} 个重复项', '{n} duplicates': '{n} 个重复项',
  'Close all {n} tab': '关闭全部 {n} 个标签页', 'Close all {n} tabs': '关闭全部 {n} 个标签页',
  'Close {n} duplicate': '关闭 {n} 个重复项', 'Close {n} duplicates': '关闭 {n} 个重复项',
  'tabs': '标签页', 'Dismiss': '移除', 'No results': '没有匹配结果',
  'Closed extra Tab Out tabs': '已关闭多余的 Tab Out 标签页', 'Tab closed': '已关闭标签页',
  'Failed to save tab': '保存标签页失败', 'Closed {n} tab from {group}': '已关闭「{group}」的 {n} 个标签页',
  'Closed {n} tabs from {group}': '已关闭「{group}」的 {n} 个标签页',
  'Closed duplicates, kept one copy each': '已关闭重复标签页，每个网页保留一个',
  'All tabs closed. Fresh start.': '已关闭所有网页标签页',
  'Chrome bookmarks are unavailable. You can still add custom websites.': '无法读取 Chrome 书签，仍可添加自定义网站。',
  'Choose bookmarks or add a website using Edit favorites.': '点击「编辑收藏」选择书签或添加网站。',
  'Could not load favorites. Refresh to try again.': '无法加载收藏，请刷新后重试。',
  'Could not read Chrome bookmarks.': '无法读取 Chrome 书签。',
  'No matching bookmarks.': '没有匹配的书签。', 'No websites in Chrome bookmarks.': 'Chrome 书签中没有网站。',
  'Remove': '移除', 'Remove {name}': '移除 {name}',
  'Could not open the favorites editor. Refresh to try again.': '无法打开收藏编辑器，请刷新后重试。',
  'This website is already in your custom list.': '该网站已在自定义列表中。',
  'Enter a website address.': '请输入网站地址。', 'Enter a valid website address.': '请输入有效的网站地址。',
  'Use an http:// or https:// website address.': '请输入以 http:// 或 https:// 开头的网站地址。',
  'Could not save favorites.': '无法保存收藏。',
  'Could not save the favorites order.': '无法保存收藏顺序。',
  'Moved to {destination}.': '已移动到 {destination}。', 'The group has moved.': '该群组已被移动。',
  'Unpin this tab in Chrome before adding it to a group.': '请在 Chrome 中取消固定此标签页，再将其加入群组。',
  'Chrome did not move the tab to the target window.': 'Chrome 未能将标签页移到目标窗口。',
  'Moved to the target window, but could not join the group.': '已移到目标窗口，但未能加入群组。',
  'Could not move the tab.': '无法移动标签页。', 'This tab is no longer available.': '此标签页已不可用。',
  'Tab order updated.': '已更新标签页顺序。',
  'The drop position has changed.': '拖放位置已发生变化。',
  'Chrome could not place the tab at that position.': 'Chrome 无法将标签页放到该位置。',
  'Could not finish reordering the tab.': '未能完成标签页排序。',
  'Untitled tab': '无标题标签页', 'Move {title}': '移动 {title}', 'Move…': '移动…',
  'Window {n}': '窗口 {n}', 'Current': '当前', 'Ungrouped': '未分组', 'Unnamed group': '未命名群组',
  '{n} tab': '{n} 个标签页', '{n} tabs': '{n} 个标签页', 'Drop a tab here': '拖放标签页到此处',
  'Could not load Chrome windows and groups. Reload Tab Out and check its tab group permission.': '无法加载 Chrome 窗口与群组。请重新加载 Tab Out 并检查群组权限。',
};
