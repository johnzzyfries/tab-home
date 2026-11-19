'use strict';

// QUOTES_REVIEW.md records the editions and source links for these excerpts.
const quoteLibrary = [
  ["老子", "Laozi", "《道德经》", "Tao Te Ching",
    "https://www.daodej.wiki/english#ch-64", [
      ["千里之行，始于足下。", "the journey of a thousand li commenced with a single step."],
    ]],
  ["李白", "Li Bai", "《将进酒》", "Invitation to Wine",
    "https://zhujiang.tjufe.edu.cn/_upload/article/files/54/17/6817eeff403e936f4ce21e0a4554/2cdce4e1-32c2-4791-a3e0-67de2b0eaa77.pdf", [
      ["天生我材必有用，千金散尽还复来。", "Heaven has made us talents, we're not made in vain. / A thousand gold coins spent, more will turn up again."],
    ]],
  ["杜甫", "Du Fu", "《望岳》", "Looking at Mt. Arch",
    "https://www.flebm.com/goods.php?id=9566", [
      ["会当凌绝顶，一览众山小。", "When I reach the top to view all, / All mountains under me are small."],
    ]],
  ["苏轼", "Su Shi", "《水调歌头》", "Prelude to Water Melody",
    "https://language.chinadaily.com.cn/a/201909/13/WS5d7af820a310cf3e3556b5ae_3.html", [
      ["但愿人长久，千里共婵娟。", "So let us wish that man / Will live long as he can! / Though miles apart, we’ll share the beauty she displays."],
    ]],
  ["威廉·莎士比亚", "William Shakespeare", "《哈姆雷特》", "Hamlet",
    "https://www.folger.edu/explore/shakespeares-works/hamlet/read/2/2/", [
      ["简洁是智慧的灵魂。", "Brevity is the soul of wit."],
      ["世上的事情本来没有善恶，都是各人的思想把它们分别出来的。", "There is nothing either good or bad but thinking makes it so."],
    ]],
  ["威廉·莎士比亚", "William Shakespeare", "《暴风雨》", "The Tempest",
    "https://www.folger.edu/explore/shakespeares-works/the-tempest/read/4/1/", [
      ["构成我们的料子也就是那梦幻的料子；我们的短暂的一生，前后都环绕在酣睡之中。", "We are such stuff as dreams are made on, and our little life is rounded with a sleep."],
    ]],
  ["简·奥斯汀", "Jane Austen", "《劝导》第二十三章", "Persuasion, Chapter XXIII",
    "https://en.wikisource.org/wiki/Persuasion/Chapter_XXIII", [
      ["我是半怀着痛苦，半怀着希望。", "I am half agony, half hope."],
    ]],
  ["艾米莉·狄金森", "Emily Dickinson", "《希望是长羽毛的东西》", "Hope is the thing with feathers",
    "https://www.poetryfoundation.org/poems/42889/hope-is-the-thing-with-feathers-314", [
      ["“希望”是个有羽毛的东西，／它栖息在灵魂里，", "“Hope” is the thing with feathers – / That perches in the soul –"],
    ]],
  ["约翰·济慈", "John Keats", "《希腊古瓮颂》", "Ode on a Grecian Urn",
    "https://en.wikisource.org/wiki/Ode_on_a_Grecian_Urn", [
      ["听见的乐声虽好，但若听不见／却更美", "Heard melodies are sweet, but those unheard / Are sweeter"],
    ]],
  ["沃尔特·惠特曼", "Walt Whitman", "《自我之歌》第五十一节", "Song of Myself, §51",
    "https://www.poetryfoundation.org/poems/45477/song-of-myself-1892-version", [
      ["我自相矛盾吗？／那好吧，我是自相矛盾的。", "Do I contradict myself? / Very well then I contradict myself,"],
    ]],
  ["艾米莉·勃朗特", "Emily Brontë", "《呼啸山庄》第九章", "Wuthering Heights, Chapter IX",
    "https://en.wikisource.org/wiki/Wuthering_Heights_%281st_edition%29/Volume_1/Chapter_9", [
      ["不管我们的灵魂是什么做的，他的和我的是完全一样的。", "Whatever our souls are made of, his and mine are the same"],
    ]],
  ["玛丽·雪莱", "Mary Shelley", "《弗兰肯斯坦》", "Frankenstein",
    "https://anthologydev.lib.virginia.edu/work/Shelley/shelley-frankenstein-1818.pdf", [
      ["要坚持你们的目标，做像岩石一样坚定的人！", "Be steady to your purposes, and firm as a rock."],
    ]],
  ["荀子", "Xunzi", "《荀子·劝学》", "Xunzi, Encouraging Learning",
    "https://www.fkf.mpg.de/7636344/dok123-EPFL_phd_thesis_final_HaonanHuang.pdf", [
      ["故不积跬步，无以至千里；不积小流，无以成江海。", "For unless a person adds steps and half-steps to each other, he cannot go a thousand li; unless little streams are gathered, rivers and seas cannot be formed."],
    ]],
  ["苏格拉底（柏拉图记述）", "Socrates, as recorded by Plato", "《申辩篇》38a", "Apology, 38a",
    "https://classics.mit.edu/Plato/apology.html", [
      ["未经审视的人生是不值得过的", "The life which is unexamined is not worth living."],
    ]],
  ["马可·奥勒留", "Marcus Aurelius", "《沉思录》第六卷第六节", "Meditations, VI.6",
    "https://classics.mit.edu/Antoninus/meditations.6.six.html", [
      ["亲自报复的最好方式就是不要变成一个像作恶者一样的人。", "The best way of avenging thyself is not to become like the wrong doer."],
    ]],
  ["勒内·笛卡尔", "René Descartes", "《谈谈方法》第四部分", "Discourse on Method, Part IV",
    "https://www.marxists.org/reference/subject/philosophy/works/fr/descarte.htm", [
      ["我想，所以我是。", "I think, therefore I am."],
    ]],
  ["巴鲁赫·斯宾诺莎", "Baruch Spinoza", "《伦理学》第五部，命题四十二附释", "Ethics, V, Proposition 42, Note",
    "https://en.wikisource.org/wiki/Ethics_(Spinoza)/Part_5", [
      ["但是一切高贵的事物，其难得正如它们的稀少一样。", "But all things excellent are as difficult as they are rare."],
    ]],
  ["大卫·休谟", "David Hume", "《人性论》2.3.3.4", "A Treatise of Human Nature, 2.3.3.4",
    "https://davidhume.org/texts/t/2/3/3", [
      ["理性是、并且也应该是情感的奴隶", "Reason is, and ought only to be the slave of the passions."],
    ]],
  ["约翰·斯图亚特·密尔", "John Stuart Mill", "《论自由》第一章", "On Liberty, Chapter I",
    "https://davidmhart.com/liberty/EnglishClassicalLiberals/MilJS/1869_OnLiberty/Mill_OnLiberty1869.pdf", [
      ["对于本人自己，对于他自己的身和心，个人乃是最高主权者。", "Over himself, over his own body and mind, the individual is sovereign."],
    ]],
  ["伯特兰·罗素", "Bertrand Russell", "《哲学问题》第十五章", "The Problems of Philosophy, Chapter XV",
    "https://en.wikisource.org/wiki/The_Problems_of_Philosophy/Chapter_15", [
      ["事实上，哲学的价值大部分须在它的极其不确定性之中去追求。", "The value of philosophy is, in fact, to be sought largely in its very uncertainty."],
    ]],
  ["玛丽·沃斯通克拉夫特", "Mary Wollstonecraft", "《女权辩护》第四章", "A Vindication of the Rights of Woman, Chapter IV",
    "https://oll-resources.s3.amazonaws.com/titles/126/Wollstonecraft_0730_EBk_v6.0.pdf", [
      ["我不希望她们有支配男人的力量；而是希望她们有力量支配自己。", "I do not wish them to have power over men; but over themselves."],
    ]],
  ["弗里德里希·尼采", "Friedrich Nietzsche", "《偶像的黄昏》〈格言与箭〉第八节", "Twilight of the Idols, Maxims and Missiles, §8",
    "https://www.sharper-than-time.com/book/Twilight%20of%20the%20Idols/Anthony%20M.%20Ludovici", [
      ["没能杀死我的东西，使我更加强健。", "That which does not kill me, makes me stronger."],
    ]],
  ["高尔基", "Maxim Gorky", "《我怎样读书》", "How I Studied",
    "https://michaelharrison.org.uk/wp-content/uploads/2022/03/On-Literature-by-Maxim-Gorky.pdf#page=17", [
      ["每一本书就像阶梯的一小级，每攀登一级，我就愈脱离动物走向人", "Each book was a rung in my ascent from the brutish to the human"],
    ]],
  ["列夫·托尔斯泰", "Leo Tolstoy", "《安娜·卡列尼娜》第一部第一章", "Anna Karenina, Part I, Chapter 1",
    "https://en.wikisource.org/wiki/Anna_Karenina_(Garnett)/Part_One/Chapter_1", [
      ["幸福的家庭都是相似的，不幸的家庭各有各的不幸。", "Happy families are all alike; every unhappy family is unhappy in its own way."],
    ]],
  ["鲁迅", "Lu Xun", "《故乡》", "My Old Home",
    "https://www.bannedthought.net/China/Individuals/LuXun/SelectedWorksOfLuHsun-V1-1956.pdf", [
      ["其实地上本没有路；走的人多了，也便成了路。", "For actually the earth had no roads to begin with, but when many men pass one way, a road is made."],
    ]],
  ["鲁迅", "Lu Xun", "《呐喊》自序", "Call to Arms, Preface",
    "https://www.sohu.com/a/407464730_120488763", [
      ["然而说到希望，却是不能抹杀的，因为希望是在于将来", "I could not blot out hope, for hope lies in the future."],
    ]],
  ["安托万·德·圣埃克苏佩里", "Antoine de Saint-Exupéry", "《小王子》第二十一章", "The Little Prince, Chapter XXI",
    "https://www.cjvlang.com/petitprince/foxsecret/heartseepopupce.html", [
      ["只有用心才能看到真切", "It is only with the heart that one can see rightly;"],
    ]],
  ["罗宾德拉纳特·泰戈尔", "Rabindranath Tagore", "《飞鸟集》第 18 则", "Stray Birds, No. 18",
    "https://en.wikisource.org/wiki/Page:Stray_Birds.djvu/17", [
      ["你看不见你自己，你所看见的只是你的影子。", "What you are you do not see, what you see is your shadow."],
    ]],
  ["罗宾德拉纳特·泰戈尔", "Rabindranath Tagore", "《飞鸟集》第 40 则", "Stray Birds, No. 40",
    "https://en.wikisource.org/wiki/Page:Stray_Birds.djvu/22", [
      ["不要因为你自己没有胃口而去责备你的食物。", "Do not blame your food because you have no appetite."],
    ]],
  ["罗宾德拉纳特·泰戈尔", "Rabindranath Tagore", "《飞鸟集》第 75 则", "Stray Birds, No. 75",
    "https://en.wikisource.org/wiki/Page:Stray_Birds.djvu/31", [
      ["我们把世界看错了，反说它欺骗我们。", "We read the world wrong and say that it deceives us."],
    ]],
  ["罗宾德拉纳特·泰戈尔", "Rabindranath Tagore", "《飞鸟集》第 82 则", "Stray Birds, No. 82",
    "https://en.wikisource.org/wiki/Page:Stray_Birds.djvu/33", [
      ["使生如夏花之绚烂，死如秋叶之静美。", "Let life be beautiful like summer flowers and death like autumn leaves."],
    ]],
  ["罗宾德拉纳特·泰戈尔", "Rabindranath Tagore", "《飞鸟集》第 85 则", "Stray Birds, No. 85",
    "https://en.wikisource.org/wiki/Page:Stray_Birds.djvu/33", [
      ["艺术家是自然的情人，所以他是自然的奴隶，也是自然的主人。", "The artist is the lover of Nature, therefore he is her slave and her master."],
    ]],
  ["Chimamanda Ngozi Adichie", "Chimamanda Ngozi Adichie", "《单一故事的危险性》", "The danger of a single story",
    "https://www.ted.com/talks/chimamanda_ngozi_adichie_the_danger_of_a_single_story/transcript?language=en", [
      ["故事可以击毁一个民族的尊严，但也可以修补那被击毁的尊严。", "Stories can break the dignity of a people, but stories can also repair that broken dignity."],
    ]],
  ["Chimamanda Ngozi Adichie", "Chimamanda Ngozi Adichie", "《我们都应成为女权主义者》", "We should all be feminists",
    "https://www.ted.com/talks/chimamanda_ngozi_adichie_we_should_all_be_feminists/transcript?language=en", [
      ["文化不会塑造人，人创造文化。", "Culture does not make people, people make culture."],
    ]],
  ["Sir Ken Robinson", "Sir Ken Robinson", "《学校扼杀创造力》", "Do schools kill creativity?",
    "https://www.ted.com/talks/sir_ken_robinson_do_schools_kill_creativity/transcript?language=en", [
      ["但我们都知道如果你不打算做错误的尝试你永远不会创造出新东西。", "What we do know is, if you're not prepared to be wrong, you'll never come up with anything original --"],
    ]],
  ["Angela Lee Duckworth", "Angela Lee Duckworth", "《成功的钥匙？毅力》", "Grit: The power of passion and perseverance",
    "https://www.ted.com/talks/angela_lee_duckworth_grit_the_power_of_passion_and_perseverance/transcript?language=en", [
      ["毅力是把生活当成一场马拉松而不是一次短跑。", "Grit is living life like it's a marathon, not a sprint."],
    ]],
  ["Robert Waldinger", "Robert Waldinger", "《如何才能幸福？请看历时最长的关于幸福的研究成果》", "What makes a good life? Lessons from the longest study on happiness",
    "https://www.ted.com/talks/robert_waldinger_what_makes_a_good_life_lessons_from_the_longest_study_on_happiness/transcript?language=en", [
      ["美好人生，从良好的人际关系开始。", "The good life is built with good relationships."],
    ]],
  ["Matthieu Ricard", "Matthieu Ricard", "《Matthieu Richard：论幸福》", "The habits of happiness",
    "https://www.ted.com/talks/matthieu_ricard_the_habits_of_happiness/transcript?language=en", [
      ["人不会总是发怒、嫉妒，也不会总是很慷慨。", "We know we're not always angry, always jealous, always generous."],
    ]],
  ["Tim Urban", "Tim Urban", "《拖延症人群的内心世界》", "Inside the mind of a master procrastinator",
    "https://www.ted.com/talks/tim_urban_inside_the_mind_of_a_master_procrastinator/transcript?language=en", [
      ["我们需要认真思考我们真正拖延的是什么，因为每个人都在拖延某件事。", "We need to think about what we're really procrastinating on, because everyone is procrastinating on something in life."],
    ]],
  ["Rita F. Pierson", "Rita F. Pierson", "《每个孩子都需要一个支持者》", "Every kid needs a champion",
    "https://www.ted.com/talks/rita_pierson_every_kid_needs_a_champion/transcript?language=en", [
      ["教学和学习应该是让人愉快的事情。", "Teaching and learning should bring joy."],
    ]],
  ["Jane Goodall", "Jane Goodall", "《珍妮·古道尔论人和猿的区别》", "What separates us from chimpanzees?",
    "https://www.ted.com/talks/jane_goodall_what_separates_us_from_chimpanzees/transcript?language=en", [
      ["我们反对暴力。不需要暴力，不要炸弹，不要枪支。这不是解决问题的方法。", "We do not believe in violence. No violence, no bombs, no guns. That's not the way to solve problems."],
    ]],
  ["Greta Thunberg", "Greta Thunberg", "《应对气候变化迫在眉睫》", "The disarming case to act right now on climate change",
    "https://www.ted.com/talks/greta_thunberg_the_disarming_case_to_act_right_now_on_climate_change/transcript?language=en", [
      ["一切都需要改变—— 必须从今天开始。", "Everything needs to change -- and it has to start today."],
    ]],
  ["Shigeru Ban", "Shigeru Ban", "《纸制的应急避难所》", "Emergency shelters made from paper",
    "https://www.ted.com/talks/shigeru_ban_emergency_shelters_made_from_paper/transcript?language=en", [
      ["即使是一个用纸搭建的建筑，只要人们喜欢，它就可以变成永恒的。", "Even a building made in paper can be permanent as long as people love it."],
    ]],
  ["Paola Antonelli", "Paola Antonelli", "《保拉·安特那利：设计即艺术》", "Treat design as art",
    "https://www.ted.com/talks/paola_antonelli_treat_design_as_art/transcript?language=en", [
      ["设计其实是从不同的领域角度来看待整个世界。", "Design really looks upon the whole world and it considers the world in all of its different ranges."],
    ]],
  ["Anil Seth", "Anil Seth", "《你的大脑如何幻化出你所意识到的现实》", "Your brain hallucinates your conscious reality",
    "https://www.ted.com/talks/anil_seth_your_brain_hallucinates_your_conscious_reality/transcript?language=en", [
      ["我们对世界的体验也会由内而外产生，并不只是由外到内的。", "Our experienced world comes from the inside out, not just the outside in."],
    ]],
  ["Elora Hardy", "Elora Hardy", "《精美的竹制魔法屋》", "Magical houses, made of bamboo",
    "https://www.ted.com/talks/elora_hardy_magical_houses_made_of_bamboo/transcript?language=en", [
      ["你是否觉得自己在这世界上的足迹都会产生变化呢？", "Can it change the footprint that you'll ultimately leave on the world?"],
    ]],
  ["Kakenya Ntaiya", "Kakenya Ntaiya", "《Kakenya Ntaiya: 一位要求学校教育的女孩》", "A girl who demanded school",
    "https://www.ted.com/talks/kakenya_ntaiya_a_girl_who_demanded_school/transcript?language=en", [
      ["做第一个走在前面的人，人们会跟随你。勇敢些，担责任，不畏惧，有信心。", "Be the first. People will follow you. Be bold. Stand up. Be fearless. Be confident."],
    ]],
  ["Amanda Palmer", "Amanda Palmer", "《Amanda Palmer： 请求的艺术》", "The art of asking",
    "https://www.ted.com/talks/amanda_palmer_the_art_of_asking/transcript?language=en", [
      ["在人类历史上的大部分时期，音乐人、艺术家是社群的一部分他们促进沟通，开拓新领域，不是无法触及的明星。", "For most of human history, musicians, artists, they've been part of the community. Connectors and openers, not untouchable stars."],
    ]],
].flatMap(([authorZh, authorEn, workZh, workEn, url, excerpts]) =>
  excerpts.map(([zh, en]) => ({ zh, en, authorZh, authorEn, workZh, workEn, url })));

function drawTabOutQuote(storage) {
  const key = 'tabOutQuoteDeck';
  const deckVersion = 2;
  const catalog = quoteLibrary.map(quote => quote.en);
  let state;
  try { state = JSON.parse(storage.getItem(key)); } catch { /* Use a fresh deck. */ }

  const last = state?.last;
  // Start the expanded rotation immediately for existing installations.
  let remaining = state?.version === deckVersion && Array.isArray(state.remaining)
    ? [...new Set(state.remaining.filter(id => catalog.includes(id)))]
    : [];
  remaining = remaining.filter(id => id !== last);
  const newDeck = remaining.length === 0;
  if (newDeck) remaining = [...catalog];

  // On a new cycle, avoid showing the last line from the previous cycle again.
  const candidates = newDeck ? remaining.filter(id => id !== last) : remaining;
  const selected = candidates[Math.floor(Math.random() * candidates.length)] ?? remaining[0];
  try {
    storage.setItem(key, JSON.stringify({
      version: deckVersion,
      last: selected,
      remaining: remaining.filter(id => id !== selected),
    }));
  } catch { /* Quotes still work when storage is unavailable. */ }
  return quoteLibrary.find(quote => quote.en === selected);
}

function setQuoteText(element, text) {
  const fragment = document.createDocumentFragment();
  // Keep commas, periods, and any closing quote marks with the preceding clause.
  const clauses = text.match(/.+?(?:[，。]+[」』”’）)]*|[,.]+[」』”’）)]*(?=\s|$)|$)/gsu) ?? [];
  for (const clause of clauses) {
    const content = clause.trimStart();
    const leadingSpace = clause.slice(0, clause.length - content.length);
    if (leadingSpace) fragment.append(leadingSpace);

    const span = document.createElement('span');
    span.className = 'quote-clause';
    span.textContent = content;
    fragment.append(span);
  }
  element.replaceChildren(fragment);
}

async function renderTabOutQuote() {
  const draw = () => {
    try {
      return drawTabOutQuote(localStorage);
    } catch {
      return quoteLibrary[Math.floor(Math.random() * quoteLibrary.length)];
    }
  };
  const quote = navigator.locks
    ? await navigator.locks.request('tab-out-quote-deck', draw).catch(draw)
    : draw();
  const isChinese = tabOutPreferences.language === 'zh-CN';
  const primary = document.getElementById('quotePrimary');
  const secondary = document.getElementById('quoteSecondary');
  const credit = document.getElementById('quoteSource');
  setQuoteText(primary, isChinese ? quote.zh + '」' : quote.en + '”');
  const openingMark = document.createElement('span');
  openingMark.className = 'quote-opening';
  openingMark.textContent = isChinese ? '「' : '“';
  primary.prepend(openingMark);
  primary.lang = isChinese ? 'zh' : 'en';
  setQuoteText(secondary, isChinese ? quote.en : quote.zh);
  secondary.lang = isChinese ? 'en' : 'zh';
  credit.textContent = isChinese
    ? quote.authorZh + ' · ' + quote.workZh
    : quote.authorEn + ' · ' + quote.workEn;
  credit.href = quote.url;
}

if (typeof document !== 'undefined') renderTabOutQuote();
