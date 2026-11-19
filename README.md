# Tab Out

[English](README.md) | [简体中文](README.zh-CN.md)

**Keep tabs on your tabs.**

Tab Out is a Chrome extension that replaces your new tab page with a dashboard of everything you have open. Tabs are grouped by domain, with homepages (Gmail, X, LinkedIn, etc.) pulled into their own group. Close tabs with a satisfying swoosh + confetti.

No server. No account. No external API calls. Just a Chrome extension.

---

## Install with a coding agent

Send your coding agent (Claude Code, Codex, etc.) this repo and say **"install this"**:

```
https://github.com/johnzzyfries/tab-out
```

The agent will walk you through it. Takes about 1 minute.

---

## Features

- **See all your tabs at a glance** on a clean grid, grouped by domain
- **Homepages group** pulls Gmail inbox, X home, YouTube, LinkedIn, GitHub homepages into one card
- **Close tabs with style** with swoosh sound + confetti burst
- **Duplicate detection** flags when you have the same page open twice, with one-click cleanup
- **Click any tab to jump to it** across windows, no new tab opened
- **Save for later** bookmark tabs to a checklist before closing them
- **Favorites** pin Chrome bookmarks or custom websites and drag them into order
- **Windows & groups** reorder the Chrome tab strip or move tabs across windows and groups
- **Appearance** switch between English and Simplified Chinese, customize colors, and read a bilingual quote on each new tab
- **Localhost grouping** shows port numbers next to each tab so you can tell your vibe coding projects apart
- **Expandable groups** show the first 8 tabs with a clickable "+N more"
- **100% local** your data never leaves your machine
- **Pure Chrome extension** no server, no Node.js, no npm, no setup beyond loading the extension

---

## Manual Setup

**1. Clone the repo**

```bash
git clone https://github.com/johnzzyfries/tab-out.git
cd tab-out
```

**2. Load the Chrome extension**

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Navigate to the `extension/` folder inside the cloned repo and select it

**3. Open a new tab**

You'll see Tab Out.

---

## How it works

```
You open a new tab
  -> Tab Out shows your open tabs grouped by domain
  -> Homepages (Gmail, X, etc.) get their own group at the top
  -> Click any tab title to jump to it
  -> Close groups you're done with (swoosh + confetti)
  -> Save tabs for later before closing them
```

Everything runs inside the Chrome extension. No external server, no API calls, no data sent anywhere. Saved tabs are stored in `chrome.storage.local`.

---

## Tech stack

| What | How |
|------|-----|
| Extension | Chrome Manifest V3 |
| Storage | chrome.storage.local |
| Sound | Web Audio API (synthesized, no files) |
| Animations | CSS transitions + JS confetti particles |

---

## License

The original [Tab Out](https://github.com/zarazhangrui/tab-out) was created by
Zara Zhang and is distributed under the [MIT License](LICENSE). This adaptation
is maintained by Ziyuan Zhao.

The [quote list](QUOTES_REVIEW.md) records the sources. Any applicable rights
in third-party quotations and translations remain with their respective holders.

### Windows & groups

Use **Windows & groups** to see open Chrome windows and their native tab
groups. Drag a tab above or below another tab to change its position in
Chrome's tab strip. You can also drag it to a group or to a window's
**Ungrouped** area, or use its **Move…** menu.
Chrome requires the tab group permission to display and use native groups.

### Favorites

Use **Edit favorites** to search and select Chrome bookmarks or add a website by
address. Click **Save favorites** to update the grid. Click any tile to open
the page in a new tab, or drag tiles to reorder them. Existing custom Favorites are loaded automatically.
Chrome bookmarks are shown after you select them. Selections follow bookmark
updates, and removed bookmarks disappear from the grid. Changes in the editor
are saved locally to Tab Out and do not modify Chrome bookmarks.

After updating an unpacked installation, click **Reload** for Tab Out in
`chrome://extensions`, then refresh or open a new Tab Out page.

Developer checks (Node.js is only needed to run tests, not to use the extension):

```bash
node --test tests/*.test.cjs
```
