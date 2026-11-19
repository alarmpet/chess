# B. Merge and fusion survey (합성) for WILD CROWN cards

Researched 2026-10-31. Scope: card or unit merge, fusion, roguelike deckbuilders, chess-with-cards hybrids, and card-visual trends.
Read with [the capture card plan](../../../plans/2026-10-31-capture-card-plan.md). The plan's duplicate sink today is stardust only, so this file asks whether merging should sit alongside it.

## How to read this

**Marks:** `[O]` official or the developer's own statement. `[W]` wiki. `[F]` fan guide, press guide or calculator site. `[U]` unverified, single source or conflicting. `[S]` Steam store aggregate read on 2026-10-31. `[M]` my own simulation (section 7).

**Review evidence:** `R12` means review 12 in `steam-dumps/<game>.md`. Each file holds 40 to 90 reviews gathered through eight browse filters plus Korean top and recent. These are samples, not a census.

**Limits, stated up front**
- Pages I opened in full: Wikipedia, the wiki.gg, balatrowiki, namu.wiki and vampire.survivors.wiki pages listed by name, Game Developer (Stacklands), Weather Factory, Supercell, Mobile Free To Play, GoNintendo, PCGamesN (Backpack Battles), Pocket Gamer.biz, CGMagazine, Dexerto (trading), The Sixth Axis. Other URLs were read as search result extracts only, so treat their wording as second-hand.
- Reddit was reached only through mirrors in search results, and thinly. Korean coverage is Steam Korean reviews, namu.wiki and Inven. A DCInside and Inven search for merge failure complaints returned nothing usable.
- Some wikis refused the fetcher (Inscryption, Stacklands, Cultist Simulator, Monster Train, Yu-Gi-Oh Fandom, chessvariants.org). The GDC Vault talk is behind a login.
- "How long it stays interesting" is almost never measured anywhere. The column reports review hours and complaints, not retention.
- Nobody has tested any of this with WILD CROWN players.

---

## 1. Same-copy ladders: N identical things become one better thing

| Game | Exact rule | Recipes | Chance | Reveal | If it fails | Stays interesting | Review evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Teamfight Tactics | 3 copies make 2-star, 3 two-stars make 3-star, 9 copies in total. Auto-merge when copies are out of combat. [W](https://en.wikipedia.org/wiki/Teamfight_Tactics) | Obvious rule | 100%, but the copies are drawn from a shop | Unit cards have animated "almost upgraded" states. [F](https://www.behance.net/gallery/133371555/Teamfight-Tactics-UI-Design) Merge timing not found | Cannot fail. You may just not find copies | Lives on set rotation. Unmeasured | Not on Steam |
| Dota Auto Chess | 3 same make 2-star, 3 two-stars make 3-star. [W](https://en.wikipedia.org/wiki/Auto_Chess) | Obvious | 100% | Not found | Cannot fail | Mod fame, standalone Steam score 65% of 1,027 [S] | `auto-chess.md` |
| Dota Underlords | 3 identical heroes combine into a stronger version with new abilities. [W](https://en.wikipedia.org/wiki/Dota_Underlords) | Obvious | 100% | Not found | Cannot fail | 84% of 33,532 English [S] | Korean review lists 유닛 자동조합 as a comfort, R55 |
| Might & Magic: Chess Royale | 3 same units merge into a much stronger unit. About 10 minute match, 25 units. [F](https://gurugamer.com/mobile-games/might-and-magic-chess-royale-10934), [F](https://pcgamer.com/how-to-play-might-magic-chess-royale) | Obvious | 100% | Not found | Cannot fail | PC Gamer 70, Metacritic users 3.3 of 29 ratings [F](https://www.metacritic.com/game/might-magic-chess-royale/) | Shut-down status not checked |
| Clash Royale Merge Tactics | Duplicates merge. 1 to 3 star, 4-star possible with luck. 4 copies of each troop in a shared pool. [O](https://supercell.com/en/games/clashroyale/blog/release-notes/new-game-mode-merge-tactics/) N is not stated there. Fan guides say 2. [F](https://gamingonphone.com/guides/clash-royale-a-complete-guide-to-the-merge-tactics-game-mode) | Obvious | 100% | Not found | Cannot fail | Seasonal modifiers keep it moving | Not on Steam |
| Hearthstone Battlegrounds | 3 copies make one golden with doubled stats and kept buffs, plus a Discover reward from the next tier. [F](https://www.hearthstonetopdecks.com/guides/hearthstone-battlegrounds-minions-guide/) | Obvious | 100% | Golden frame change. Timing not found | Cannot fail | A merge pays twice: stronger unit and a free pick | Not checked |
| Super Auto Pets | Level 2 needs 2 XP, level 3 needs 3 more. Each merge gives +1 XP, so 3 copies reach level 2 and 6 reach level 3, with +1/+1 per XP. A shop level-up offers a pet from one tier higher. [W](https://superautopets.wiki.gg/wiki/Experience) | Obvious | 100% | Stat pop | Cannot fail. Merging two level 2s gives no reward pet [W] | 91% of 25,100 English [S] | Merge rarely mentioned. Players talk about 조합 of team, R67, R73 |
| The Bazaar | Bronze to Silver to Gold to Diamond. Buying a duplicate upgrades the item. Holding two does nothing. Enchantment is replaced. [F](https://gamerblurb.com/articles/how-to-get-duplicate-items-the-bazaar) | Tooltip | 100% | Not found | Cannot fail | 78% of 6,288 English, 56% recent [S] | Upgrades mentioned neutrally, R10, R11 |
| Suika Game | 2 same fruits merge into the next fruit, up to the watermelon. [W](https://en.wikipedia.org/wiki/Suika_Game) | Fruit cycle shown on screen | 100% on contact, but physics decides whether they touch | Instant pop, then chain | Box overflow ends the run | 11M+ downloads by October 2024 [W]. Score chasing | Clone sample: "Couldn't breed the watermelon" (`watermelon-game.md` R31) |
| Triple Town | 3 or more adjacent identical tiles merge at the last tile placed. Grass, bush, tree, hut, house. 4+ give a bonus. Crystal is a wild card. [W](https://en.wikipedia.org/wiki/Triple_Town) | Learned by play | 100% | Tile transforms in place. Built first for e-ink, no animation, no colour [F](https://www.pocketgamer.biz/colonisation-cloning-and-rethinking-genre-the-making-of-triple-town/) | Board fills | 92% of 592 [S]. One reviewer logged 200 hours (R8) | Praises "bears make little grunts" (R2). Revenue topped out at "$4-$6 per person" [O](https://www.pocketgamer.biz/news/49594/gdc-2013-triple-town-not-the-massive-success-people-think-it-is-admits-spry-fox/) |
| Merge Dragons | 3 adjacent make 1. 5 make 2. Dragons 3, 5 or 10 make 1, 2 or 3. No undo. [F](https://www.bluestacks.com/blog/game-guides/merge-dragons/md-tips-and-tricks-en.html) | Learned by play | 100% | Not found | Accidental 3-merge is the failure. "Require Overlap" option exists [F](https://cyberpost.co/what-is-the-best-number-to-merge-in-merge-dragons/) | Long live game | The 5-for-2 rule rewards waiting |
| Merge Mansion | Merge-2 on one board, unlike the merge-3 norm. [F](https://blog.udonis.co/mobile-marketing/mobile-games/merge-mansion-advertising-analysis) Generators and energy. [O](https://metacore.theymes.com/hc/en/merge-mansion/articles/welcome-to-merge-mansion-76) | Item chain viewable (not confirmed) | 100% | Not found | Board clutter | Record $12M month in December 2024 after live-ops work. [F](https://appmagic.rocks/blog/merge-mansion-reclaiming-top-spot) | Drag miss complaint. [F](https://www.commonsensemedia.org/app-reviews/merge-mansion) Clutter advice. [F](https://www.levelwinner.com/merge-mansion-beginners-guide-tips-tricks-strategies/) |
| Travel Town | 2 identical items merge. Energy is spent on tapping and, per one guide, on merges. [U](https://www.bluestacks.com/pl/blog/game-guides/travel-town/ttma-beginners-guide-pl.html) | Learned by play | 100% | Not found | Energy runs out | Retention rivalled by Gossip Harbor. [F](https://naavik.co/digest/gossip-harbors-meteoric-rise-in-merge/) | Sources here are poor |
| 랜덤다이스 (Random Dice) | 2 dice of the same type and pips merge into a random die with +1 pip, max 7 pips. Full board forces merges. [W](https://namu.wiki/w/%EB%9E%9C%EB%8D%A4%20%EB%8B%A4%EC%9D%B4%EC%8A%A4) | Obvious | Pips guaranteed, type random | Not found | Cannot fail. The type can be wrong for you | Long-running PvP | Not on Steam |
| 운빨존많겜 (Lucky Defense) | Store text says unit merge exists. [O](https://apps.apple.com/kr/app/%EC%9A%B4%EB%B9%A8%EC%A1%B4%EB%A7%8E%EA%B2%9C/id6482291732) Namu tip: same 3 heroes merge early, and myth units use recipes. [W](https://namu.wiki/w/%EC%9A%B4%EB%B9%A8%EC%A1%B4%EB%A7%8E%EA%B2%9C) | Myth recipes exist | **Exact odds not found** | Not found | 도박 (gamble) loop sits beside the merge | 4.3 and 4.5 store scores as of 2026-04-09 [W] | February 2026: operator admitted biased pet and rune draws. [W] A trust loss, not a merge loss |
| Survivor.io (탕탕특공대) | 3 copies raise rarity. Lower tiers accept any same-slot item. Epic and Legendary rules conflict between guides. [U](https://gamerjournalist.com/how-to-merge-equipment-in-survivor-io-survivor-io-merge-guide) | Forge shows it | 100% | Not found | Cannot fail | Not measured | Loose early rule, strict late rule is the useful idea |
| 세븐나이츠 리버스 | 2 same-star heroes at +5 give one higher-star hero, level reset to 1. Same legend odds as summon. 200 5-star merges give a guaranteed hero. [F](https://www.inven.co.kr/board/sena/6379/201) | Odds shown in game (not confirmed) | Random result | Summon style | Result can be junk, so the 200 count is the safety net | Not measured | A merge that is really a pull |

## 2. Recipe fusion: different things become something new

| Game | Exact rule | Recipes | Chance | Reveal | If it fails | Stays interesting | Review evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Persona 5 Royal | 2 Persona, arcana chart picks the result arcana. Fusion Alarm: 50% chance of a second skill inherited. [W](https://megatenwiki.com/wiki/Fusion_Alarm) Older Persona accidents 1/64 for two, 1/32 for three. [W](https://megatenwiki.com/wiki/Fusion_accident) | Fan calculators conflict on examples. [U](https://everycalculators.com/p5r-persona-calculator.html) Recipe lists: [F](https://www.thegamer.com/persona-5-royal-p5r-fusion-chart-cheapest-recipes-compendium/) | Result fixed, inheritance not | Not found | Accident gives another Persona | Core system for a whole RPG. Unmeasured | Korean R63 of SMT says P5R compendium still needed outside guides |
| SMT V: Vengeance | 2 demons, race chart, special fusions, accidents. Full moon raises accident odds. [F](https://primagames.com/tips/shin-megami-tensei-v-all-about-the-moon-phases) Strange Journey base 1/64, 1/32 at new or full moon. [W](https://megatenwiki.com/wiki/Fusion_Accident) | Vengeance lists every formula for demons you own (`smt-v-vengeance.md` R63) | Fixed, rare accident | Not found | Accident gives a different demon | 94% of 4,101 English [S]. "Fusion meta" praised, R30 | "모든 조합식을 다 볼 수 있기" (R63) |
| Yu-Gi-Oh! (paper, Master Duel) | Polymerization needs materials named on the Fusion Monster. Hand use is inferred, not read directly. [U](https://www.ygostats.com/rulings/Flash%20Fusion) | Printed on the card | 100% if materials exist | Summon animation | Spell wasted if disrupted | 72% of 49,328, 47% recent [S] | Review sample did not discuss fusion |
| Yu-Gi-Oh! Forbidden Memories | Hidden fixed fusion list that ignores card game logic. [F](https://yugipedia.com/wiki/List_of_Yu-Gi-Oh!_Forbidden_Memories_Fusions_(001%E2%80%93200)) | Hidden, fan lists exist | Fixed | Not found | Mismatch fails | Fan lists from 2002 still circulate | Hidden recipes moved players to spreadsheets |
| Backpack Battles | Touching items combine at the next shop phase after a win. Catalysts survive. Lockable. Recipe book shows black silhouettes until crafted. [W](https://backpackbattles.wiki.gg/wiki/Recipe) About 86 recipes. [F](https://www.pcgamesn.com/backpack-battles/recipes) Hover gives blue glow, placed gives orange. [F](https://www.pcgamesn.com/backpack-battles/recipes) | Hidden until first craft | 100% | New item appears in prep phase | Lose the battle and the merge waits | 92% of 5,614 [S]. "don't expect too much longevity" (R8) | "조합표를 숨겨놓는것이 무슨의미가 있는지 모르겠습니다" (R53, 188 hours) |
| Vampire Survivors | Max base weapon, usually a matching passive, then a chest from a boss after minute 10. One chest can evolve 3 items. Union merges weapons into one slot. [W](https://vampire.survivors.wiki/w/Evolution) | Learned, then wiki | 100% once eligible | Treasure chest | No evolution in that chest | 98% of 128,467 [S] | "woah you can evolve items" (R30). "진화시키는 손맛이 중독적입니다" (R74) |
| BALL x PIT | Fusion Reactor: fusion of 2+ level 3 balls, or evolution by fixed recipe. Sources disagree on recipe count (42 vs 95+). [U](https://ball-x-pit-web.pages.dev/fusion-reactor) | Discovered | Reactor offers vary (`ball-x-pit.md` R54 grumbles about "single fusions") | Reactor pick | Weak offer | 95% of 15,792 [S] | "combining things is cool" (R7). "nothing special on their own" (R14) |
| Stacklands | Stack cards to craft. Idea cards list recipes, but any combo works without the card. [O](https://www.gamedeveloper.com/road-to-igf-2023/how-stacklands-uses-simplicity-to-create-a-compelling-card-based-village-builder) | Open to experiment, logged on find | 100% | Card bounces, new card | Nothing happens | 95% of 12,026 [S]. Sampled reviews sit mostly under 60 hours, one wishes it were longer (R45) | "automatically adds the recipe to your list" (R43). "처음에는 조합하는 재미가 있는데" then automation (R72) |
| Cultist Simulator | Verbs plus aspect cards. Slots filtered from about 800 options to about 50 after players kept guessing. [O](https://weatherfactory.biz/the-labyrinth-under-the-skin/) | Hidden | Often random | Text | Fail text, sometimes death | 79% of 5,351 [S] | "taking notes barely helps" (R17). "a lot of trial and error" (R8) |
| Cassette Beasts | Any two forms fuse in battle. Temporary, reversible, needs a full meter. [W](https://wiki.cassettebeasts.com/wiki/Fusion) 120 forms, 14,400 sprites by developer estimate. [O](https://www.cassettebeasts.com/2020/05/11/fusion/) | Every pair works | 100% | Generated animated sprite | Cannot fail | 95% of 6,315 [S] | "unique sprites for every single fusion" (R1). Curiosity drives collecting (R19) |
| Palworld | Species set by averaged rank, stats and passives rolled. [F](https://allthings.how/palworld-1-0-how-breeding-and-trait-inheritance-work/) | Calculator sites | Mixed | Egg hatch | Wrong passives | 95% of 184,879 [S] | Long tail: "Spent 200 hours breeding" (R21) |
| Mewgenics | Breed cats between runs (R22). Loss can erase bred stats (R38). | Discovered | Random inheritance | Kitten | Runt, or lost cat | 91% of 29,180 [S] | Split. "Breeding and cat management isn't fun." (R35). "losing up to hours of achieved stats" (R38). Praised at R32 |

## 3. Deck modification in roguelikes

| Game | Exact rule | Recipes | Chance | Reveal | If it fails | Stays interesting | Review evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Inscryption | Mycologists merge 2 identical cards, adding stats and sigils up to 4. [F](https://sites.google.com/view/kaycees-mod-general-info/tips/map-nodes) Campfire first buff safe, second has a 50% chance the card is eaten, per a version-tied fan guide and a forum reply. [U](https://steamcommunity.com/app/1092790/discussions/0/3164335241614011070) | Node tells you | Merge 100%, campfire risk | Characters perform it in the cabin | Card lost, which is the drama | 96% of 77,023 [S] | "Be ready to make sacrifices." (R63) |
| Balatro | Tarot edits the deck. Hanged Man destroys up to 2. Wheel of Fortune 1 in 4 adds an edition. [W](https://balatrowiki.org/w/Tarot_Cards) Joker shop edition odds: Foil 2%, Holo 1.4%, Poly 0.3%, Negative 0.3%. [W](https://balatrowiki.org/w/Editions) Editions are permanent. | Full text in collection | Stated | Shader on the card itself | Wheel simply misses | 98% of 105,439 [S] | "이걸 조합하는 맛이 아주 좋습니다" (R74) |
| Slay the Spire | One upgrade per card, adds + and turns green. Searing Blow is unlimited. [W](https://slaythespire.wiki.gg/wiki/Upgrade) Smith trades against healing at rest. [W](https://slaythespire.wiki.gg/wiki/Rest_Sites) | Preview shown | 100% | Card flash, previewed | Cannot fail | 97% of 77,398 [S] | R32 |
| Slay the Spire 2 | Enchantments beyond the plus. Corrupted +50% damage, 3 HP per play. Reportedly 22. [F](https://www.pcgamesn.com/slay-the-spire-2/enchantments) | Text | Mostly fixed | Not found | Risk built into the card | 91% of 71,733, 73% recent [S] | Off-topic review events noted by Steam |
| Monster Train | **No base merge.** The Last Divinity adds Unit Synthesis: one monster fuses essence into another. [O](https://www.themonstertrain.com/dlc/the-last-divinity) | Named essence text | 100% | Not found | Cannot fail | 96% of 12,275 [S] | "you can now combine units into one" (R34) with a shard risk attached |
| Monster Train 2 | Units and spells upgrade, equipment can combine into one with added cost. [F](https://www.thesixthaxis.com/2025/04/11/monster-train-2-is-shaping-up-to-be-a-fantastic-sequel/) | Text | 100% | Not found | Cannot fail | 95% of 5,107 [S] | R3 |
| Across the Obelisk | Shards upgrade cards along two paths and transmute between them (`across-the-obelisk.md` R1). Exact costs not found | Shown | 100% | Not found | Cannot fail | 81% of 7,867 [S] | R1 |
| Wildfrost | Up to 3 Charms per card, permanent for the run. [W](https://wildfrostwiki.com/Charms) | Text | 100% | Not found | Cannot undo | 91% of 5,368 [S] | "limited opportunities" complaint, R19 |
| Dicey Dungeons | Items upgrade to stronger or smaller. (`dicey-dungeons.md` R1) Rules not confirmed | Text | 100% | Not found | Cannot fail | 89% of 6,319 [S] | R1 |
| Peglin | Orbs level to 3, gained after battles or events, now for coins. [W](https://peglin.wiki.gg/wiki/Upgrade) No duplicate merge found | Text | 100% | Not found | Cannot fail | 88% of 10,350 [S] | "늘 쓰던 조합만" (R59) |
| Shogun Showdown | Tile upgrade slots after fights or shops. (`shogun-showdown.md` R9) | Text | 100% | Not found | Cannot fail | 97% of 3,555 [S] | R44 wants less random upgrades |

## 4. Chess with cards or merging

| Game | Rule | Merge? | Review evidence |
| :--- | :--- | :--- | :--- |
| Shotgun King | After each stage, pick from pairs: a black card helps you, a white card helps enemies. Count 2 or 3 varies by source. [F](https://www.nintendolife.com/reviews/switch-eshop/shotgun-king-the-final-checkmate) | No merge. The pair is a price tag | 93% of 3,851 [S] |
| Pawnbarian | Single hero on a small board, chess-move cards, upgrades in shop. [F](https://www.pocketgamer.com/pawnbarian/review/) | Piece upgrades, no merge. Reviewers call replay limited | 91% of 452 [S]. Upgrades liked, R28 |
| Chessplosion | Chess-piece bombs, arcade. | None found | 95% of 140 [S] |
| Chess Evolved Online | Custom armies, PvP. | No merge rule found. [U](https://rawg.io/games/chess-evolved-online) | 91% of 809 [S] |
| Chess Royale (Steam 2197600, Mewton) | Kings with magic abilities. Different game from Might & Magic. | None found | 93% of 16 [S] |
| Gambonanza (2026) | Balatro-like chess on a tiny board with shop, upgrades, gambits. | Upgrades, no merge | 74% of 1,685 [S]. "making it feel like you're playing chess" (R17). "balance the serious in chess and the crazy combo-build" (R41). Lost pieces and AI blunders hurt, R3, R5 |
| Passant (2025) | Chess roguelike with pieces and items. | Combined-move pieces count as dull upgrades, R10 | 79% of 367 [S]. "think like a normal chess AI" (R5) |
| Fusion Chess, Chessplus | Friendly pieces merge into one, combining moves, and can split. [W](https://chessvariants.com/other.dir/fusion.html) Chessplus: 2 pieces max, never the king. [F](https://episteme.tllm.fr/wiki/Chessplus) | Real merge, but it changes legal moves | Against plan section 2. Listed only to close the idea |

**No shipping chess game I found merges cards.** Merging on the board is a variant rule, which the plan already rejects.

## 5. Duplicate handling, the closest comparison to our stardust

| Game | Rule | Result |
| :--- | :--- | :--- |
| Pokémon TCG Pocket | Trade Tokens from sacrificing duplicates: 25 for three diamond, 125 for four diamond, 100 for one star, 300 for two and three star, 1,500 for crown. [F](https://www.dexerto.com/pokemon/how-to-trade-in-pokemon-tcg-pocket-3050521) Backlash, then tokens removed for Shinedust given automatically on duplicates. [F](https://www.cgmagonline.com/news/pokemong-tcg-pocket-trading-changes/) Doubled, scheduled for July 29, 2025. [F](https://www.pokemon-zone.com/articles/trade-updates-july-2025/) | A second currency fed by sacrifice failed. Automatic income replaced it |
| Hearthstone | Dust for crafting. Mobile Free To Play says dust is worth far less than a direct buy, so players still feel bad. [F](https://mobilefreetoplay.com/creating-strong-gacha-pros-make-sure-duplicates-arent-bad-drops/) | A fallback, not a joy |
| Marvel Snap | Spends currency to upgrade looks: 25 credits and 5 boosters, then 100/10, 200/20, 300/30. [F](https://www.gameskinny.com/6sf63/marvel-snap-how-to-upgrade-cards) Upper tiers conflict. Upgrades give 3D, animation, then Collection Level. [F](https://upcomer.com/what-does-upgrading-cards-do-in-marvel-snap-card-upgrades-and-levels-explained/) | Look-only upgrade with a progress score. Fits our "no chess power" rule |
| Fusion-for-stars games | Single-duplicate dependence frustrates. [F](https://mobilefreetoplay.com/creating-strong-gacha-pros-make-sure-duplicates-arent-bad-drops/) | Do not gate a slot on one exact card |
| CS:GO | Duplicates are chased for better-looking wear. [F](https://mobilefreetoplay.com/creating-strong-gacha-pros-make-sure-duplicates-arent-bad-drops/) | A duplicate can be a look variant |

## 6. Card-visual trends in shipping games

| Pattern | Shipping example | Worth taking |
| :--- | :--- | :--- |
| Sound is the pack | Pocket's art director studied real packs and tested the finger slide and the rip, since players open packs daily. [O](https://gonintendo.com/contents/40485-pokemon-trading-card-game-pocket-dev-on-why-sound-design-is-key-to-a-satisfying) | Spend on one tear or merge sound before more particles |
| Gesture as ceremony | Swipe to open. A short official animation about the swipe was reported in a search extract. [U](https://www.gamer.ne.jp/news/202410300011/) | One tap or swipe to merge |
| Rarity hint before the flip | Hearthstone face-down cards glow on hover: none, blue, purple, orange. [W](https://hearthstone.wiki.gg/wiki/Card_pack) Wuthering Waves colour states the top rarity and never shifts. [F](https://samurai-gamers.com/wuthering-waves/wuwa-wish-rarity-indicator-guide/) | Show the colour first, honestly. Never fake it |
| Sorted reveal | Hearthstone multi-pack shows best cards face down, rest in a sorted list. [W](https://hearthstone.wiki.gg/wiki/Open_Packs) | Matches plan section 1, step 4 |
| Skip | Players of Pocket want a skip when opening many packs (search extract only). [U](https://www.sportskeeda.com/pokemon/are-pokemon-tcg-pocket-animations-long) | Add skip and "merge all" from day one |
| Tilt foil | Pocket shiny cards sparkle on tilt (March 2025). [F](https://www.siliconera.com/shiny-pokemon-cards-join-in-new-pokemon-tcg-pocket-expansion/) Immersive cards with a 3D feel in Mega Shine (March 2026). [F](https://finalweapon.net/2026/03/19/pokemon-tcg-pocket-mega-shine-themed-booster-pack-release-date/) | Plan section 8 already matches |
| Web-native holo | pokemon-cards-css uses CSS transforms, gradients, blend modes and filters. [O](https://awesome.ecosyste.ms/projects/github.com%2Fsimeydotme%2Fpokemon-cards-css) Check the licence before reuse | Proof the plan's "CSS holo" is feasible on the web |
| Material ladder | Marvel Snap steps through frame break, 3D, animated. [F](https://upcomer.com/what-does-upgrading-cards-do-in-marvel-snap-card-upgrades-and-levels-explained/) Balatro's foil, holo and polychrome double as mechanics. [W](https://balatrowiki.org/w/Editions) | Merge can walk our matte, silver, holo, gold ladder with no new art |
| Near-merge hint | TFT unit cards animate when an upgrade is close. [F](https://www.behance.net/gallery/133371555/Teamfight-Tactics-UI-Design) | Pips such as ●●○ on the codex |
| Golden merge | Battlegrounds golden copy plus Discover. [F](https://www.hearthstonetopdecks.com/guides/hearthstone-battlegrounds-minions-guide/) | A merge should pay twice |
| Generated results | Cassette Beasts builds sprites for any pair. [O](https://www.cassettebeasts.com/2020/05/11/fusion/) | Too large for us. Six animals give 15 pairs if ever wanted |

**Not found:** frame timings for any 3-of-a-kind animation, TFT's merge sound or VFX notes, any Balatro shader or feel interview, Genshin's wish colour explanation, and a sourced God Pack rate above fan level. I do not state these.

## 7. Simulation against the plan's table (mine, not a measurement)

Assumptions: section 4 rarity table. Capture mix proportional to piece count (8:4:2:1). Animal uniform across 6. Pity 10/60 as in the plan. Adult: 5.5 captures with 50% wins gives about 6.4 cards. Child: 3.3 captures with 30% wins gives about 3.8 cards. First copy always stays in the codex. Stardust exchange is excluded because no price exists yet. Scripts are in my session scratchpad, not the repository.

**Chance of a natural triple inside one game**

| Cards in the game | 3 identical (animal and rarity) | 3 of any one rarity |
| :---: | :---: | :---: |
| 4 | 3% | 66% |
| 6 | 14% | 98% |
| 8 | 32% | 100% |
| 12 | 73% | 100% |

**Long-run economy**

| Rule | First full animal set, games | All 18 non-epic, games | All 24, games (p90) | Merges per game | Merged epics per game | Dropped epics per game |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| No merge, adult | 9.6 | 18.2 | 98 (157) | 0 | 0 | 0.155 |
| 3 spares, stop at rare, adult | 8.4 | 11.1 | 97 (148) | 1.9 | 0 | 0.156 |
| 5 spares, stop at rare, adult | 9.0 | 14.5 | 97 (150) | 1.0 | 0 | 0.156 |
| 3 spares, then 5 rares to epic if slot empty, adult | 8.5 | 11.2 | 29 (35) | not captured | 0.12 | not captured |
| 3 spares, free to epic, adult | 7.6 | 11.1 | 22 (28) | 2.0 | 0.34 | 0.14 |
| No merge, child | 15.3 | 29.8 | 159 (251) | 0 | 0 | 0.095 |
| 3 spares, stop at rare, child | 13.7 | 18.2 | 160 (259) | 1.2 | 0 | 0.094 |
| 3 spares, then 5 rares to epic if slot empty, child | 13.8 | 18.1 | 49 (59) | not captured | 0.07 | not captured |
| 3 spares, free to epic, child | 12.3 | 18.4 | 37 (46) | 1.2 | 0.20 | 0.084 |

An earlier run without the "keep first copy" rule gave a merge-2 ladder 1.1 merged epics per game, about twelve times the drop rate.

What this says:
- A free ladder to epic makes merged epics about 2.4 times more common than dropped ones. That breaks the plan's epic moment.
- Merge does nothing for the last epics when it stops at rare. Stardust exchange or a costly epic step must do that job.
- 1 to 2 merges per game is a good beat: something to do on nearly every end screen.
- Three spares finish non-epic slots about 40% sooner. If the codex then feels short, use five.

---

## What makes merging satisfying

1. **The rule fits in one line.** Every long-lived ladder here is "same plus same makes better". TFT, Suika and Triple Town need no text.
2. **Progress shows before it pays.** TFT's almost-upgraded cards, and the Suika cycle on screen. The player spots the merge coming, which is half the pleasure.
3. **It pays twice.** Battlegrounds gives a golden unit plus a Discover. Super Auto Pets gives a level plus a higher tier offer.
4. **The result is visible at a glance.** Stars, gold frames, Marvel Snap's 3D step.
5. **Curiosity about the outcome.** Cassette Beasts reviewers want to see what a pair looks like. "unique sprites for every single fusion" (R1). BALL x PIT: "combining things is cool" (R7).
6. **Certainty about success, uncertainty about discovery.** Vampire Survivors and Backpack Battles guarantee the result once conditions are met. The surprise is the first time you learn it exists: "woah you can evolve items" (R30).
7. **Sound and small life.** Triple Town: "bears make little grunts" (R2). Pocket spent its art direction time on the tear. Stacklands found its fun in a simple card bounce. [O](https://www.gamedeveloper.com/road-to-igf-2023/how-stacklands-uses-simplicity-to-create-a-compelling-card-based-village-builder)
8. **Sacrifice has meaning when it is the theme.** Inscryption can eat your card because that is the horror. Not transferable to a cute game.

## What fails

| Failure | Evidence | For us |
| :--- | :--- | :--- |
| Recipes hidden, then solved by a wiki | Backpack Battles R53. Forbidden Memories lists. Cultist's 800 to 50 filter | Show rules in the game |
| Non-repeatable outcomes | Cultist: "taking notes barely helps" (R17) | Same input, same output |
| Sacrifice into a second currency | Pocket Trade Tokens removed after backlash | No token step. Stardust stays automatic |
| Losing hours of bred value | Mewgenics R38 | Nothing a merge touches can be lost |
| Chance of losing the card | Inscryption players call the campfire loss bad RNG. [U](https://steamcommunity.com/app/1092790/discussions/0/3182362324976078087) Seven Knights enhancement odds 50% and 25%. [F](https://www.inven.co.kr/board/sena/6379/77) Material loss there and Lineage M rates not confirmed, so evidence is thin and this is partly a design call | Zero failure |
| Merge that is secretly a pull | Seven Knights merge needs a 200 count safety net. [F](https://www.inven.co.kr/board/sena/6379/201) Lucky Defense bias admission, February 2026. [W](https://namu.wiki/w/%EC%9A%B4%EB%B9%A8%EC%A1%B4%EB%A7%8E%EA%B2%9C) | Output is fixed. Do not add hidden odds |
| Clutter | Merge Mansion advice. Stacklands: "fill up your screen with useless stuff" (R45) | Stack counts, not rows of copies |
| Energy on merges | Travel Town guides | No cost to merge |
| Accidental merge | Merge Dragons' overlap option. [F](https://cyberpost.co/what-is-the-best-number-to-merge-in-merge-dragons/) | Merge on a button, never on drag |
| Over-long ceremony | Pocket skip complaints [U] | Skip and merge-all |
| Cosmetics nobody sees | Edery: cosmetic sales failed in single player since no one else sees them. [O](https://www.pocketgamer.biz/news/49594/gdc-2013-triple-town-not-the-massive-success-people-think-it-is-admits-spry-fox/) | Show merged cards on the village wall |
| Dead end once collected | Backpack Battles R8. Stacklands R29 | Plan a sink after the codex fills |
| Upgrades take over the chess | Gambonanza R41. Passant R5 | Keep merge outside the match |

## What fits a free solo cute chess game with 4 to 12 cards per game

Recommendations are mine, built from the above. Nothing has been played yet.

1. **Merge after the game only, never in the match.** The capture wait is already about 4.2 seconds, the hand has 3 slots, and the hand empties at game end. This respects plan sections 2, 3 and 7.
2. **Rule: 3 spare cards of the same animal and rarity make 1 of the next rarity of that animal.** Spares only, so the codex entry stays. Rule of three is the most proven ladder, and merge-2 inflates too hard (section 7).
3. **Guaranteed, deterministic, shown before you press.** No failure, no lost material, no energy, no ads. This also keeps the plan's "no hidden odds" line clean, since merging adds no chance at all.
4. **Stop the free ladder at rare.** Three spare rares do not make an epic. If the last epics feel endless, add a dear one-way step: 5 spare rares make an epic only if that slot is empty. In section 7 that brings all 24 from 98 games to 29 without flooding epics. Pick this only after real capture counts.
5. **Merge is the material ladder, not new art.** Matte to silver to holo uses plan section 8 as it stands. No extra drawings beyond the 24.
6. **Do not add a merge currency.** Spares stack with pips (●●○). Copies beyond any use turn to stardust automatically. Pocket's reversal is the warning.
7. **Make it pay twice, gently.** First merge into a slot gives village decoration progress as well as the codex tick. Never chess power.
8. **Optional surprise: 세 쌍둥이.** Three identical cards in one game is rare enough to feel special, 14% at 6 cards and 3% at 4. Show a named end-screen moment with a small bonus. Do not build a promise around it, because the odds swing with card count (73% at 12).
9. **Keep discovery small and fair.** Blank silhouettes in the codex, as Backpack Battles does, but with the rule printed. For later, 2 or 3 named animal pairs could unlock a village prop, and these should log on first find, as Stacklands does. Avoid Cultist depth, because children and casual players are the audience.
10. **Reveal budget.** Suggested starting point, not evidence: pips fill, three cards pull in, colour shows first, flip, one good sound, about 1 to 1.5 seconds. Rare gets the longer version. Add "merge all" with a sorted summary and a skip. Merge on a button, never on drag.
11. **Children.** 3.8 cards a game still gives about one merge a game. Keep the screen wordless: three same pictures, one arrow, one better picture.
12. **Measure before tuning.** Add to the plan's section 11 list: merges per game, share of end screens with a merge available, skip rate, and share of players who hoard spares. Change 3 to 5 if non-epic slots fill too fast.

**Open conflict for the integrator:** the plan says duplicates become stardust. This file suggests stacks first, stardust for overflow. That changes plan section 1 step 4 and section 9, and stardust pricing has to be set with merge in mind.
