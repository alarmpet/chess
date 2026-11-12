# C. Open-source survey for the capture-card system

Date 2026-10-31. Read with the [capture card plan](../../../plans/2026-10-31-capture-card-plan.md) and the [first round](../2026-10-31-capture-cards/README.md).

**Method.** 38 repos were cloned shallow, each into its own folder `D:\tmp\oss-cards2\<owner>__<repo>`. Images, audio and binaries were left out with sparse checkout. Forge, Pokemon Auto Chess, PokéRogue and Cockatrice are code-only subsets. Nothing from these repos was run, built or installed. Only file reads, `git` metadata and searches. No code was copied into `D:\chess`.

**Licence column.** It comes from the first line of the LICENSE file in the repo tree, not from the GitHub badge. GitHub API values were used only for stars and last push. Line numbers are at the commit in the table.

**Depth.** `deep` means the relevant code was read. `targeted` means searched, then key slices read. `skim` means layout and one or two facts. Where a topic has no entry, it was either not present or not searched for. This is not a legal opinion.

**Limit.** Rates in fan projects are community reconstructions, not official numbers.

## 1. Summary table

| Repo | Licence file | Last push | Stars | Commit | Depth | Why it matters |
| :--- | :--- | :--- | ---: | :--- | :--- | :--- |
| [pagefaultgames/pokerogue](https://github.com/pagefaultgames/pokerogue) | **AGPL-3.0** | 2026-10-31 | 5908 | 7c08812 | deep | Closest match: gacha pity, missing-item pity, seed offsets, save migrations |
| [keldaanCommunity/pokemonAutoChess](https://github.com/keldaanCommunity/pokemonAutoChess) | **GPL-3.0** | 2026-10-30 | 1833 | f6be968 | deep | Free boosters, per-species shards, flip reveal UI in React |
| [simeydotme/pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css) | **GPL-3.0** | 2025-12-15 | 8338 | acb1197 | deep | Holo technique. Do not ship its code |
| [00-Evan/shattered-pixel-dungeon](https://github.com/00-Evan/shattered-pixel-dungeon) | **GPL-3.0** | 2026-10-07 | 6742 | 57a4e06 | deep | Deck-based drops, recipes, seed per floor |
| [tmewett/BrogueCE](https://github.com/tmewett/BrogueCE) | **AGPL-3.0** | 2026-10-20 | 1510 | 363440c | targeted | Metered drops, separate cosmetic RNG |
| [Mantan21/Genshin-Impact-Wish-Simulator](https://github.com/Mantan21/Genshin-Impact-Wish-Simulator) | MIT | 2026-06-13 | 296 | d7d1870 | deep | Soft pity formula, duplicates to currency |
| [DesirePathGames/Slay-The-Robot](https://github.com/DesirePathGames/Slay-The-Robot) | MIT | 2026-10-31 | 293 | 4dac5ab | deep | JSON cards, actions, interceptors, named RNGs, pity |
| [BigJk/end_of_eden](https://github.com/BigJk/end_of_eden) | MIT | 2024-09-02 | 206 | bdfd8e3 | targeted | Definition/instance split, UI-free core, state diffs for animation |
| [MCG-NJU/AutoTavern](https://github.com/MCG-NJU/AutoTavern) | MIT (code); NOTICE excludes game data | 2026-10-25 | 178 | fb61201 | targeted | Triple merge rules, fixed in-repo RNG |
| [boardgameio/boardgame.io](https://github.com/boardgameio/boardgame.io) | MIT | 2026-10-30 | 12480 | 47adef2 | targeted | Plugin boundary, PRNG state kept in game state, undo |
| [danielyule/hearthbreaker](https://github.com/danielyule/hearthbreaker) | MIT | 2018-04-28 | 512 | 884c703 | targeted | Effects as pure JSON, replay with recorded random numbers |
| [Fluorohydride/ygopro-core](https://github.com/Fluorohydride/ygopro-core) | MIT | 2026-10-29 | 426 | c4ccbab | targeted | Script-driven effect object, seeded deterministic duel |
| [Fluorohydride/ygopro-scripts](https://github.com/Fluorohydride/ygopro-scripts) | **GPL-2.0** | 2026-10-21 | 179 | 0be9a8a | skim | 13,576 card scripts over that effect object |
| [dr4fters/dr4ft](https://github.com/dr4fters/dr4ft) | MIT text (no title line, "Copyright (c) James Campos") | 2026-10-26 | 118 | b59b94d | targeted | Sheet-based booster generator |
| [Card-Forge/forge](https://github.com/Card-Forge/forge) | **GPL-3.0** | 2026-10-31 | 2866 | 49dd5e4 | targeted | Text card scripts, booster slot data, sell prices |
| [Steamodded/smods](https://github.com/Steamodded/smods) | **GPL-3.0** | 2026-10-30 | 1005 | b482166 | targeted | Balatro rarity weights, booster object, seed keys |
| [GBALATRO/balatro-gba](https://github.com/GBALATRO/balatro-gba) | **None** | 2026-10-28 | 2483 | 8dee4b7 | targeted | One RNG stream per purpose, small save struct |
| [SMMURDA/deckstorm](https://github.com/SMMURDA/deckstorm) | MIT | 2026-10-16 | 0 | 6fd1d44 | targeted | Web Balatro-like: pure effect functions returning deltas |
| [demilich1/metastone](https://github.com/demilich1/metastone) | **GPL-2.0** | 2018-08-17 | 140 | bab2c6a | targeted | Card JSON with spell class plus arguments |
| [jleclanche/fireplace](https://github.com/jleclanche/fireplace) | **AGPL-3.0** | 2025-12-19 | 746 | 47a2572 | targeted | Effect DSL on card classes, action queue |
| [HearthSim/SabberStone](https://github.com/HearthSim/SabberStone) | **AGPL-3.0** | 2022-12-08 | 290 | 1db6e27 | targeted | Power object: named slots for each effect kind |
| [oskarrough/slaytheweb](https://github.com/oskarrough/slaytheweb) | **AGPL-3.0** | 2026-10-26 | 318 | a108c3e | targeted | Web deckbuilder: immutable actions, undo by stored state |
| [manny405/sapai](https://github.com/manny405/sapai) | MIT | 2023-04-05 | 75 | 3850d25 | targeted | Merge by XP, data-driven abilities |
| [a327ex/emoji-merge](https://github.com/a327ex/emoji-merge) | MIT | 2023-12-22 | 79 | 3b63aaa | targeted | Suika rule as one value table |
| [demouth/suika-game-go](https://github.com/demouth/suika-game-go) | MIT | 2026-09-19 | 31 | 4dd34c9 | skim | Suika rule as if-chain, the contrast case |
| [gabrielecirulli/2048](https://github.com/gabrielecirulli/2048) | MIT | 2024-10-24 | 13454 | 478b6ec | skim | Merge once per move guard |
| [Bluedimensional/triple-town-pwa](https://github.com/Bluedimensional/triple-town-pwa) | **None** | 2026-09-10 | 0 | 615253e | targeted | Merge table with `need`, flood fill, charms bending rules |
| [gregorybchris/triple-town](https://github.com/gregorybchris/triple-town) | **None** | 2020-11-29 | 2 | cf9a9a8 | skim | Plain spawn table |
| [fuuhakugetsurei/gacha-game](https://github.com/fuuhakugetsurei/gacha-game) | MIT | 2026-02-25 | 2 | ae4f4b1 | targeted | Single-file gacha: pity per reward, ticket from non-top pulls |
| [PTCGPBPS/PTCGPBPS.github.io](https://github.com/PTCGPBPS/PTCGPBPS.github.io) | **GPL-3.0** | 2024-12-01 | 1 | a7e7412 | skim | Slot-based pack rates |
| [jwkeena/pokemon-booster-pack-simulator](https://github.com/jwkeena/pokemon-booster-pack-simulator) | **None** | 2021-09-03 | 9 | c9a10b3 | skim | Set-level odds fields |
| [mtgatool/mtgatool-desktop](https://github.com/mtgatool/mtgatool-desktop) | **GPL-3.0** | 2026-09-16 | 111 | 925800a | skim | Set completion views, wildcard costs |
| [Cockatrice/Cockatrice](https://github.com/Cockatrice/Cockatrice) | **GPL-2.0** | 2026-10-30 | 1841 | 0369aaf | skim | Tabletop model: no rules engine, server RNG |
| [sorcio003/Arcane-Chess](https://github.com/sorcio003/Arcane-Chess) | **None** | 2026-08-30 | 1 | 48459f4 | targeted | Chess where cards drive moves |
| [AlistairBishop06/Chaos-Chess](https://github.com/AlistairBishop06/Chaos-Chess) | **None** (package.json says ISC) | 2026-08-28 | 2 | e7ce378 | targeted | Rule cards as apply + modifiers, the anti-pattern for us |
| [esm2000/league-of-chess](https://github.com/esm2000/league-of-chess) | **GPL-3.0** | 2026-05-28 | 0 | e991f83 | skim | Chess with shop, gold and stacks. Own engine |
| [kongyo2/cards-css](https://github.com/kongyo2/cards-css) | MIT **(provenance doubt)** | 2026-07-01 | 11 | cd25c33 | deep | Do not depend. See section 2 |
| [codeweb-dev/holo-card](https://github.com/codeweb-dev/holo-card) | MIT | 2026-07-26 | 60 | e670f2d | deep | Small React holo. Usable |

Not cloned, checked by API only: [simeydotme/hover-tilt](https://github.com/simeydotme/hover-tilt). Root LICENSE file is MIT, but `packages/hover-tilt/package.json` line 11 says MPL-2.0. Svelte 5 is a peer dependency.

**Bold licence means structure only.** GPL and AGPL: never copy code. **None** means no licence granted, so all rights reserved: read, and take only ideas. Ideas, rates and mechanics are not what the licence covers, but code and expression are.

## 2. Holo cards

### simeydotme/pokemon-cards-css

- **Licence:** GNU GPL-3.0, read from `LICENSE`. Shipping this CSS or JS in WILD CROWN would pull the whole game under GPL.
- **Author's position:** issue #19 says the repo is a demo, will not be on npm, and CSS and JS are not separable. It says the code is not useful for an application.
- **Art attribution:** `README.md` credits a DeviantArt galaxy texture and Vecteezy backgrounds. Those textures are not cleared for us either.
- **Size:** 83 files, 26.6 MB in the git tree. 21.3 MB of that is `public/pokemon-cards-demo.gif`.

| Asset | Size |
| :--- | ---: |
| All foil CSS, `public/css/cards/*.css`, 23 files | 79,789 B |
| `base.css` | 8,927 B |
| One foil, typical | 3–5 KB |
| `cosmos.png` | 1.7 MB |
| `rainbow.jpg` | 1.1 MB |
| `glitter.png` | 113 KB |
| `grain.webp` | 59 KB |

**How the effect works, in our words:**

1. **Layers.** A card is a stack: back, front image, a `shine` div and a `glare` div. All share one grid cell (`base.css:189-200`).
2. **Pointer to variables.** On pointer move, position becomes a percentage, then three things: rotation (centre offset divided by 3.5), a background offset compressed to about 37–63 / 33–67, and glare position (`Card.svelte:104-128`).
3. **Spring.** Values go through Svelte springs, throttled to one update per animation frame (`Card.svelte:60-62`, `130-143`). The result is written to CSS variables such as `--pointer-x`, `--rotate-x`, `--pointer-from-center` (`Card.svelte:277-295`).
4. **Foil as blended gradients.** The foil is CSS only. A repeating rainbow gradient, 400% size, moves opposite to the pointer. It is blended over thin scanlines. `color-dodge` over the art makes only bright regions flare (`regular-holo.css:41-62`).
5. **Second and third sheen.** Vertical bars at two speeds use `hard-light` (`:66-100`). A pointer-centred radial gradient with `luminosity` adds a hotspot (`:102-124`).
6. **Glare.** A radial highlight with `overlay` (`:143-166`).
7. **Clip.** `clip-path` or a mask keeps the foil on the art box only (`:7-16`, `:39`).
8. **Rarity by data attribute.** `.card[data-rarity="rare holo"]` picks the foil. Rarity is a pure CSS switch.
9. **Device tilt.** Device orientation is clamped to ±16/±18 degrees and fed into the same springs (`Card.svelte:310-329`).
10. **Reveal.** The active card flies to centre, scales up to 1.75, and spins 360 once on first open (`Card.svelte:226-243`).

**Cost note.** `color-dodge` plus filters on stacked full-card layers are repainted per frame. The source itself notes workarounds for perf and backface (`base.css:152-153`), and halves scanline space on small screens (`regular-holo.css:126-130`). Do not animate 3 hand cards this way at once. Only the card being looked at.

**Ideas we may reimplement:** the variable list, rarity as data attribute, foil only when active, parallax opposite to pointer. Write our own gradients and values, or do it in a three.js shader as plan section 8 allows.

### kongyo2/cards-css: do not depend on it

The LICENSE says MIT and the README has no credit. But the CSS repeats pokemon-cards-css values word for word: `--sunpillar-1…6` hues, `--card-aspect: 0.718`, `--card-radius: 4.55% / 3.5%`, `--card-glow`, `--bars: 3%`, and the exact formula `calc(((50% - var(--background-x)) * 2.6) + 50%)…`.

A line comparison found 166 of 812 distinct non-trivial CSS lines identical. `src/styles/effects/holo.css` follows the same layer order as `regular-holo.css`. This looks like a derivative of GPL code relabelled MIT. Treat it as GPL-tainted. Its one fresh idea is usable as an idea: procedural textures from code instead of image files (`src/textures.ts`).

### codeweb-dev/holo-card: usable, small

- **Licence:** MIT. README credits a different MIT project, `van123helsing/react-holo-card-effect` (also verified MIT by API).
- **Overlap check:** only 11 of 69 lines match pokemon-cards-css, all generic property names.
- **Size:** 377 lines of TS in `src/`. One dependency, `react-parallax-tilt` (MIT, 1084 stars), with React as peer.
- **Structure:** CSS in a string injected once (`src/styles.ts`), three layers, gyroscope hook (`src/useHoloTilt.ts`).
- **Comment worth keeping:** `preserve-3d` on the tilt wrapper flattens the overflow clip and blend mode (`src/styles.ts:5`).
- **Advice:** it shows one foil only, and we need four rarity materials. Write our own about 100 lines using this as a reference, or use `react-parallax-tilt` for the tilt alone.

## 3. Gacha, pity, duplicates

### pagefaultgames/pokerogue (AGPL-3.0, structure only)

The closest design to ours: a free in-game gacha with published pity.

**Drop table.** Roll 0–255 against thresholds, giving Common 204/256, Rare 44/256, Epic 7/256, Legendary 1/256 (`src/data/egg.ts:390-398`, `src/data/balance/rates.ts:22-25`). All rates sit in one balance file.

**Pity.** Three counters, thresholds 9, 59, 412 (`rates.ts:29-31`). The logic is in `src/data/egg.ts:674-692`.
- All counters tick up on each pull.
- An override applies **only when the natural roll was Common** (`:683`, `:686`, `:688`).
- Afterwards only the counter of the resulting tier resets (`:691`). An Epic does not reset the Rare counter.
- The code comment says thresholds were placed near the 80% mark (`:680`).

**Duplicate protection, the best idea found.** A separate `unlockPity` counter per tier. After 9 eggs with nothing new, the species pool is narrowed to unowned species (`egg.ts:454-464`). It counts up on a duplicate and resets on something new (`:509-516`). If everything is owned, it does nothing.

**RNG.** Unseeded and seeded random are separate, named functions (`src/utils/common.ts:82-107`). `executeWithSeedOffset` runs a block on a seed derived from the wave (`src/battle-scene.ts:1317`, `:1410`). The same wave gives the same result regardless of what ran before.

**Save.** Encrypted JSON in localStorage (`src/system/game-data.ts:278`, `:306`). Migrations are one file per version (`src/system/version-migration/versions/`), applied on load (`game-data.ts:346`). A save from a newer version is detected (`:442`).

**Rewards.** Modifier pools by tier, with weight functions reading the party state (`src/modifier/init-modifier-pools.ts:70-90`). So rewards stay relevant. Tier roll with upgrade chance from luck: `src/modifier/modifier-type.ts:2760-2769`.

### keldaanCommunity/pokemonAutoChess (GPL-3.0, structure only)

**Booster.** 10 cards, last one guaranteed from the Unique or Legendary lists, a 1/1000 "god pack" that makes every card such, reroll on repeats within a pack up to 50 tries (`app/services/collection.ts:178-206`, `:218-224`). Rates are open data (`app/config/game/shop.ts:44-54`).

**Duplicates.** `app/services/booster.ts:76-117`: a new card sets a bit in an unlock mask. A repeat gives 50 shards, or 250 if shiny (`app/config/game/collection.ts:4-5`).

**Shards belong to the species** (`booster.ts:37`, `:109`), not to one global pool. A pack costs 250–1000 shards by rarity (`collection.ts:35-45`). Shards also buy cosmetic emotions at 50–200, ×3 when shiny (`:7-32`). The comment says prices should track rarity, yet the numbers are hand-tuned.

**Bug to avoid.** `booster.ts:111` assigns the gain instead of adding, so two repeats of one species in one pack give shards once. Our `addDust` must sum.

**Reveal UI** (React + CSS): `app/public/src/pages/component/booster/booster-card.tsx`, `booster-card.css`.
- Face-down grid, click to flip.
- Rarity colour through a CSS variable (`booster-card.tsx:25-27`).
- Unflipped cards shake (`booster-card.css:65`).
- Flip takes 500 ms with a scale bump (`:72-88`).
- Each card shows `NEW` or `+50 shards` (`booster-card.tsx:57-67`).

**Shop rates by level:** `shop.ts:56-67`. **Pool sizes:** `app/config/game/pools.ts:4-12`. **Merge:** three copies, see section 6.

### Mantan21/Genshin-Impact-Wish-Simulator (MIT)

Rates and images belong to the original game. Only the code is MIT.

**Soft pity.** `src/lib/helpers/gacha/probabilities.js:4-19`. Flat base rate until `rateIncreasedAt`, then a linear climb to 100% at `maxPity`. Values: base 0.6%, ramp from 74, cap 90; 4-star 5.1%, ramp 9, cap 10 (`src/lib/data/wish-setup.json:22-27`).

**Roll.** `gacha/roll.js:15-111`. Pity loaded per banner, three chances computed fresh per pull, rarity picked first, item second. A 5-star bumps the 4-star counter, not resets it (`:73-77`).

**Duplicates.** `roll.js:121-135`. By rarity and full-copy state: 15 / 2 / 10 for weapons; 2 or 5 for 4-star repeats; 10 or 25 for 5-star repeats.

**RNG:** plain `Math.random` (`probabilities.js:27`). No seed.

**Save:** pity in localStorage, history in IndexedDB with a versioned schema (`dataAPI/api-indexeddb.js:4-30`). Result object carries `isNew`, `pity`, `bonusType`, `bonusQty` (`roll.js:109`). That is a good shape for our reveal.

### fuuhakugetsurei/gacha-game (MIT, single file)

Pool text like `SSR: name @2 !80`: weight and pity limit per reward (`index.html:283-288`). When several rewards hit pity, the highest weight wins (`:294-297`). Only the top tier resets (`:298`). Ten non-top pulls give a ticket for a fair wheel. This is a second, gentler pity. Saves use a version in the key name (`:233`).

### Slay-The-Robot pity (MIT)

Details in section 5. Weights by source (`autoload/Random.gd:125-149`): Standard 55/43/2, Miniboss 50/40/10, Boss 0/0/100, Shop 55/40/5. That is the same idea as our table by captured piece.

Pity adds to Rare and subtracts from Common (`:170-171`), +1.5 per common shown (`data/prototype/PlayerData.gd:135`).

**Apparent bug.** `rare_card_found` is set but never read (`Random.gd:175`, `:204`). A search of all `.gd` files for the modifier found only a read, the increment and one raise (`PlayerData.gd:579`), so within a run pity seems to never fall. Tests for us must cover reset after success.

### Community Balatro numbers

Round 1 left 70/25/5 unconfirmed. Two independent community sources now give it: `smods/src/game_object.lua:1118,1128,1138` and `balatro-gba/include/joker.h:32-35`, Legendary 0 in the shop in both. Still not an official source, but no longer unsupported.

## 4. Pack generators

| Repo | Structure | Reference |
| :--- | :--- | :--- |
| dr4ft (MIT) | Booster rules are weighted sheet lists; each sheet code gives a count, cards are weighted by copies. Fallback: 1 in 8 mythic instead of rare | `backend/boosterGenerator.js:18-24`, `:34`, `:58-65`, `:95` |
| Forge (GPL-3) | Edition text file lists slots, then each slot is a filter with optional `Replace=.015625F` chance. Excellent data format | `forge-gui/res/editions/Aetherdrift.txt` (lines 10-11, 15-20); `forge-core/.../item/generation/BoosterGenerator.java:121`, `:154-158` |
| smods (GPL-3) | Booster: `extra` shown, `choose` picked, default 3 and 1 (`config`), plus `create_card` per slot | `src/game_object.lua:1618-1630` |
| PTCGP sim (GPL-3) | Slot × rarity weight table; slots 1–3 common, 4 and 5 differ | `script.js:143-152`, `:293-300` |
| Booster sim (no licence) | Set object with `chanceOfHolo`, `chanceOfSecretRare`, `cardsToPull` | `js/card-logic.js:26-28`, `:63-67` |

**The fact most useful to us:** a Forge edition puts everything in data, with the source link for the rates as a comment. Our table in plan section 4 should look the same: one data file, shown on screen as is.

## 5. Card effects as data, and keeping them out of the rules

| Repo | Schema in one line | Effect ↔ core boundary | Reference |
| :--- | :--- | :--- | :--- |
| Slay-The-Robot (MIT) | Card JSON lists reusable actions with parameters | Actions, interceptors with priority, validators for conditions | `README.md:15-41`, `data/readonly/ActionInterceptorData.gd:5-8` |
| hearthbreaker (MIT) | Effects as JSON: selector, action, event, condition | Tag objects serialise both ways, so state is a data tree | `card_defs.json:114-136`, `hearthbreaker/tags/base.py:32` |
| metastone (GPL-2) | Card JSON has `trigger` and `deathrattle` with `class` plus args | Reflection from class name, `GameContext` is clonable | `cards/.../minion_acolyte_of_pain.json`, `game/.../spells/desc/SpellFactory.java:7-10`, `GameContext.java:84` |
| Forge (GPL-3) | Text script: `SP$ Discard | ValidTgts$ …` | `ApiType` enum maps a name to an effect class | `forge-gui/res/cardsfolder/a/abandon_hope.txt`, `forge-game/.../ability/ApiType.java:15` |
| fireplace (AGPL) | Python DSL per card ID: `play = Heal(TARGET, 2)` | Actions queued through `game.trigger` | `fireplace/cards/classic/neutral_common.py`, `fireplace/game.py:194`, `actions.py:119` |
| SabberStone (AGPL) | `Power` with named slots: aura, enchant, trigger, tasks | Tasks are small commands | `SabberStoneCore/src/Enchants/Power.cs:23-41` |
| ygopro-core (MIT) | Effect struct: code, range, count limit, plus condition, cost, target, value, operation refs | C++ core knows no card; Lua registers effects; API is `create_duel(seed)`, `process`, `get_message` | `effect.h:28-64`, `ocgapi.h:41-55`, sample `ygopro-scripts/c10000.lua` |
| smods (GPL-3) | Objects extend `SMODS.GameObject`, keyed | Events pass through `SMODS.calculate_context` | `src/game_object.lua:12`, `:1330`, `:1441`, `src/utils.lua:2192` |
| deckstorm (MIT) | `effect(ctx)` returns `{chips, mult, money, label}`; optional hooks | Effects return deltas, the caller applies them | `js/jokers.js:1-14` |
| slaytheweb (AGPL) | Plain card object plus `upgrade(card)` | Each action is pure over state with immer | `src/content/cards/bash.js`, `src/game/actions.js:1`, `src/game/action-manager.js:57-73` |
| end_of_eden (MIT) | Definition with callbacks; instance is `{TypeID, GUID, Level, Owner}` | "Base game logic and ui is fully separated"; UI diffs state events for animation | `game/card.go:15-45`, `game/README.md`, `game/checkpoint.go:23-76` |
| boardgame.io (MIT) | Plugin: `setup`, `api`, `flush`, `action`, `isInvalid`, `fnWrap` | Core rules never touch plugin data except through this surface | `src/types.ts:152-178` |
| Chaos-Chess (none) | Rule: `kind`, `apply(game)`, `modifiers(game)` | **Anti-pattern for us:** the engine reads flags, so it is its own engine | `src/server/game/rules/ruleset.js:1-6`, `RuleManager.js:56-68` |
| Arcane-Chess (none) | `DECK_TEMPLATE` of id and copies | Cards are the move system; own 7×7 rules, king capture | `script.js:408-420` |
| Cockatrice (GPL-2) | Card metadata database | No rules engine at all. Humans enforce rules | `libcockatrice_card/`, `README.md` |

**Pattern across the good ones:** the rules core never imports card code. Cards reach it only by a narrow, named surface. Our `referee.js` must stay at exactly that level: it never imports the card module, and cards read the match log, not the other way round.

## 6. Merge and evolution rules

| Repo | Rule | Data or code | Reference |
| :--- | :--- | :--- | :--- |
| emoji-merge (MIT) | Two same value touch: value+1. Table holds radius, score, mass | Table, best form | `main.lua:172-184`, `:742`, `:761`. Spawn weights 30/25/20/15/10 at `:738` |
| suika-game-go (MIT) | Same, as an if-chain per fruit. New type means new branch | Code, worst form | `calc.go:53-94` |
| 2048 (MIT) | Slide merge. A merged tile cannot merge twice in one move. 90/10 spawn | `mergedFrom` guard | `js/game_manager.js:71`, `:156-160` |
| triple-town-pwa (none) | Flood fill connected group ≥ `need`; `{next, need}` table; 4+ gives super tile; charms change `need`, `next` and neighbours | Table plus charms | `js/config.js:47-68`, `js/match.js:11-45`, `:61-81` |
| Pokemon Auto Chess (GPL-3) | Three copies upgrade; rule object per species; handlers by rule type (count, item, others) | Rule objects | `app/core/evolution-logic/count-evolution-handler.ts:21-38`, `evolution-manager.ts:29-32` |
| AutoTavern (MIT, data excluded) | `triple_copies: 3` in config. Stats carry over. Merge deferred while a menu is open or outside the recruit phase | Config plus guards | `crates/taverngym/src/config.rs:192`, `:284`, `engine.rs:3417-3445` |
| sapai (MIT) | Duplicates give XP: 2 to level 2, 3 to level 3; merged stats take max + 1 | Code | `sapai/pets.py:147-172`, `sapai/player.py:407-426` |
| SPD alchemy (GPL-3) | Recipe: inputs, quantities, energy cost, output, quantity. Grouped by ingredient count. Item has an energy value when dismantled | Declarative subclass | `.../items/Recipe.java:66-86`, `:170-220`, `items/spells/Recycle.java:105-116`, `items/Item.java:555` |

**Guard lessons.** Merging must not fire while a menu is open (AutoTavern). One result per action (2048). Keep "what merges" as a table, never as branches (emoji-merge vs suika-go).

## 7. RNG

| Repo | Approach | Reference | What it gives us |
| :--- | :--- | :--- | :--- |
| balatro-gba (no licence) | One state per purpose, enum of streams, base-36 seed | `include/random.h:18-46` | Adding a stream does not shift others |
| BrogueCE (AGPL) | Two RNGs: substantive and cosmetic, switched by macro | `src/brogue/Rogue.h:402-404`, `:1275-1276` | Effects cannot change the game |
| AutoTavern (MIT) | xoshiro256** in-tree: "crate upgrades must never change replay results" | `crates/taverngym/src/rng.rs:1-5`, `:14-45` | Do not depend on a library's algorithm |
| smods / Balatro (GPL-3) | Key strings mixing a purpose and the round | `src/game_object.lua:1905`, `:3340` | Roll keyed by purpose + progress |
| pokerogue (AGPL) | Seed offset around a block | `src/battle-scene.ts:1317` | Same |
| SPD (GPL-3) | Stack of generators, seed per floor | `SPD-classes/.../utils/Random.java:47-68`, `Dungeon.java:418` | Generated content stable |
| Slay-The-Robot (MIT) | Dictionary of named RNGs in player data | `data/prototype/PlayerData.gd:54`, `:228` | Saved with the run |
| boardgame.io (MIT) | Alea PRNG, state kept inside game state so moves stay pure | `src/plugins/random/random.ts:44-48`, `random.alea.ts` | Undo restores RNG too |
| hearthbreaker (MIT) | Replay stores every random number | `hearthbreaker/replay.py:63`, `:89` | Alternative to seeds |
| ygopro-core (MIT) | `create_duel(seed)`, Mersenne Twister | `ocgapi.h:41`, `duel.h:32` | Deterministic core |
| Cockatrice (GPL-2) | SFMT with 64-bit seed | `libcockatrice_rng/.../rng_sfmt.cpp:18-22` | Not needed |
| Unseeded | Genshin sim, slaytheweb, deckstorm, Chaos-Chess, metastone | see sections above | Not suitable for us |

Note: `seedrandom` (2132 stars) has no licence detected by the API. boardgame.io's inlined copy carries a permissive notice at `random.alea.ts:5-26`. A 15-line PRNG of our own avoids the question.

## 8. Metered drops: an alternative to a hard ceiling

**SPD deck system (GPL-3).** Probabilities act like cards in a deck: picking lowers that entry, and the deck refills when empty (`.../items/Generator.java:256-268`, `:645-649`, `:717-722`). Two decks swap to vary the run (`:275-276`, `:621-626`). Scheduled guarantees sit on top: strength potions per set (`Dungeon.java:529-531`), one catalyst on floors 1–3 (`:584-587`). State is saved (`Generator.java:900-903`). Result: long dry streaks cannot happen and the player never sees a counter.

**Brogue metered items (AGPL).** Each entry has a live frequency: raised every level, lowered on spawn. Enchant scroll: start 60, +30, −50. Life potion: start 0, +34, −150, plus a floor tied to depth (`src/variants/GlobalsBrogue.c:625`, `:639`, `src/brogue/Items.c:576-579`, `:702-713`, `:743-749`, struct `Rogue.h:1447-1454`). This is soft pity with memory. A hit pushes the rate down, then it climbs back.

Decision: plan section 4 requires public rates. SPD and Brogue make rates a moving target, hard to show. Keep the public hard ceiling for the first prototype. Use the deck idea only for **which card within a rarity**.

## 9. Other sections per repo

Facts already given above are not repeated.

**Slay-The-Robot.** Cards built from JSON (`README.md:15`), save through `autoload/FileLoader.gd:408-415`, `SerializableData` base class. A Godot project, so usable as a reference only.

**end_of_eden.** `SavedState` holds seed, RNG state, actors, instances, event history and mods (`game/saved_state.go:14-29`). Encoded with Go gob. `game/checkpoint.go` marks state, then the UI diffs events like damage and card added. That is how our capture sequence should read card events without blocking the engine.

**AutoTavern.** NOTICE line 5-6 and 15-17: the MIT grant excludes `cards.json`, which is Blizzard's data. Copies by tier 15, 15, 13, 11, 9, 7, 5 (`config.rs:245`).

**sapai.** Ability JSON shape: trigger, triggeredBy, effect with `kind` and target (`sapai/data.py:57-79`). Very readable. The data describes a commercial game, so take the shape only.

**Cockatrice.** Read only for the model: a virtual table, no rules. Nothing else applies to us.

**mtgatool-desktop.** A companion app, not a game. Useful screens: `src/components/views/collection/SetCompletionStats.tsx`, `CompletionProgressBar.tsx`, `CompletionHeatMap.tsx`. Ideas for showing how full the dex is. Wildcard cost by rarity in `src/components/WildcardsCost.tsx`.

**league-of-chess.** A heavily changed chess with stacks, gold and a shop (`README.md:114-150`). Written as its own move system under `backend/src/moves/`. It shows the cost of that road, which we rejected.

**slaytheweb undo.** Each past action stores the whole prior state (`src/game/action-manager.js:57-73`, `:79-87`). Simple and memory-heavy. Save is `JSON.stringify` with derived data removed (`src/ui/save-load.js:14-28`).

**balatro-gba save.** Magic number, version, section-valid flags (`source/save.c:33`, `:41-67`). Only IDs and minimum data stored per Joker (`:118-122`).

**triple-town-pwa save.** localStorage in try/catch, migrates older key forms on read (`js/persistence.js:22-27`, `:112-142`).

**Forge dust ratio.** Value by rarity 6 / 40 / 120 / 600, with a sell multiplier and a limit (`QuestSpellShop.java:72-91`, `:138`, `:272-293`). Mythic share: 1 per 8 rares (`BoosterUtils.java:49`).

## 10. Reusable structures for us

Written fresh for this report. Nothing here is copied from any repo. Numbers are placeholders until plan phase 0 measures humans.

### Card data schema

Split definition (static, in the bundle) from owned state (in the save). End of Eden and Slay-The-Robot do this.

```ts
// data/cards.ts — no functions, no references to the chess engine
interface CardDef {
  id: string;                 // stable forever, saved in player data
  animal: 'meerkat' | 'panda' | 'kangaroo' | 'rhino' | 'tiger' | 'lion' | null;
  rarity: 0 | 1 | 2 | 3;      // common, fine, rare, hero
  kind: 'help' | 'reward' | 'cosmetic';
  oneLine: string;            // i18n key. One line, per plan section 6
  use?: {
    when: 'myTurnBeforeMove' | 'afterCapture' | 'gameEnd';
    limitPerGame?: number;
    marksWin?: boolean;       // shown in the rival record
    effects: Effect[];        // closed list below
  };
}

type Effect =
  | { op: 'revealThreats' }
  | { op: 'hintMoves'; count: number }
  | { op: 'rerollMission' }
  | { op: 'rewardMultiplier'; target: 'acorn'; by: number; uses: number }
  | { op: 'dropTierUp'; tiers: number; scope: 'nextCapture' | 'restOfGame' }
  | { op: 'extraCheckmateCard'; count: number }
  | { op: 'rivalMistakeExtra'; rolls: number }
  | { op: 'undoPair' };       // the only op that touches the game
```

- Rule enforced by a test: `src/rules/` imports nothing from `src/cards/`.
- `Effect` is a closed union, as in metastone's class list but with no reflection. A new op needs code review.
- `undoPair` calls the existing engine undo. It never edits a board.
- Effects return deltas and a thin runner applies them (deckstorm).

### Drop roller with pity

Three decisions the plan leaves open. Answers come from Genshin, PokéRogue and Slay-The-Robot.

| Question | Sources | Choice |
| :--- | :--- | :--- |
| Does a ceiling upgrade only from common, or from any tier? | PokéRogue: common only | Any lower tier. The plan says "the next is hero", and players will read it that way |
| Does a hero reset the rare counter? | PokéRogue: no. Genshin: no, it bumps it | Yes, hero resets both. Plan says "rare or better" |
| Hard or soft? | Genshin soft ramp, PokéRogue hard | Hard. Easy to print on screen |

```ts
// Weights out of 1000, so 0.1% stays an integer.
const DROP: Record<SourceKey, [number, number, number, number]> = {
  pawn:      [900,  90,   9,   1],
  minor:     [500, 400,  95,   5],
  rook:      [400, 400, 180,  20],
  queen:     [200, 400, 350,  50],
  checkmate: [  0, 500, 400, 100],
};
const CEILING = { rare: 10, hero: 60 };

interface Pity { sinceRare: number; sinceHero: number; sinceNew: number[] }

function rollCard(key: RollKey, source: SourceKey, boost: number, pity: Pity) {
  const rng = rngFor(key);            // pure, see below
  let tier = pick(rng, DROP[source]);
  tier = Math.min(3, tier + boost);   // rhino card, AI-first consolation
  const sinceRare = pity.sinceRare + 1, sinceHero = pity.sinceHero + 1;
  if (sinceHero >= CEILING.hero) tier = 3;
  else if (sinceRare >= CEILING.rare && tier < 2) tier = 2;
  const card = pickCardInTier(rng, tier, pity.sinceNew[tier]);
  return { tier, card, pity: nextPity(pity, tier, card) };
}
```

- **Return new pity, never mutate.** Undo then needs no special code.
- **`pickCardInTier`:** after 9 repeats in a row at that tier, restrict the pool to unowned cards. If the pool is empty, ignore (PokéRogue `unlockPity`).
- **`rngFor(key)`:** seed from `hash(gameSeed, 'captureCard', ply)`. Pure, so it consumes no shared stream. This satisfies plan section 11, "same moves with cards on or off give the same game record". The AI's stream is untouched. Keep it separate from anything cosmetic (Brogue).
- **Undo and re-capture:** store `highestRewardedPly` in the match. A capture grants only if `ply > highestRewardedPly`. Without this, undoing and capturing again would pay twice. A pure roll alone is not enough, because a different capture on the same ply would roll again.
- **Own PRNG.** 15 lines, committed, with a fixed test vector (AutoTavern).
- **Test list:**
  - Rates over 10⁶ rolls with `pity` frozen at 0.
  - No gap ever exceeds the ceiling.
  - Hero resets both counters.
  - Pity falls after success (the Slay-The-Robot gap).
  - Duplicates in one game sum (the Pokemon Auto Chess bug).

### Merge and duplicate rule

The plan uses dust, not merge, which is the right default. Forced merges make duplicates feel like a chore.

```ts
const DUST_FROM_DUP = [5, 20, 60, 300];   // 1 : 4 : 12 : 60. Forge is about 1 : 7 : 20 : 100
const DUST_PRICE    = [40, 160, 480, 2400]; // 8 repeats of the same tier for one chosen card
```

- Keep the ratio in one data file. Show the result as `isNew` or `+N dust` on reveal (Pokemon Auto Chess, Genshin result shape).
- Global dust, not per species as in Pokemon Auto Chess. Children cannot track 6 currencies.
- If a fusion is wanted later, use a table, not branches: `{ from: rarity, need: 3, to: rarity + 1 }`, with `need` read from data (triple-town, emoji-merge). Run it only on the end screen, never during a game (AutoTavern).
- Set completion is a plain check: all 4 rarities of an animal owned gives its frame.

### Save format

```ts
// localStorage key 'wc.cards', separate from match save. Try/catch on every access.
interface CardSave {
  v: 1;
  owned: Record<CardId, number>;      // copies seen, per id
  firstSeen: Record<CardId, number>;  // optional, for "new" flags
  dust: number;
  pity: { sinceRare: number; sinceHero: number; sinceNew: [number, number, number, number] };
  stats: { pulls: number; byTier: [number, number, number, number] };
}
interface MatchCards {               // inside the existing match save
  seed: string;
  hand: CardId[];                    // max 3, cleared at game end
  highestRewardedPly: number;
  mission?: { id: string; state: 'open' | 'done' | 'aiFirst' };
  drops: { ply: number; card: CardId; tier: number }[];  // the ledger
}
```

- **Version plus one migration function per version**, run on load (PokéRogue).
- **Reject junk:** a wrong shape falls back to an empty save and keeps the old string under a backup key. Do not silently erase.
- **Do not encrypt.** PokéRogue's AES key ships to the client, so it adds nothing for us. There are no payments.
- **Commit at game end from `drops`.** Hand is cleared. So a closed tab cannot duplicate rewards, and the ledger replays against the game record for audit.
- **Store IDs only, never text or stats** (balatro-gba, End of Eden).

### Reveal and hand UI

- Rarity through `data-rarity`, foil only on hover or active card.
- Pointer and gyro feed one spring, one rAF update.
- Use `src/fx/` with three.js for hero flash and keep the card as DOM over the canvas.
- Announce card events through a state diff (End of Eden checkpoints), so the capture sequence reads them without waiting.
- End-screen reveal: face-down, click to flip, 500 ms, shaking when unflipped for rare or better (Pokemon Auto Chess).

## 11. What to take and what to avoid

| Take | From | Licence state |
| :--- | :--- | :--- |
| Missing-item pity | PokéRogue | AGPL, idea only |
| Purpose-keyed pure rolls | Balatro via smods, PokéRogue, balatro-gba | Idea only |
| Result object `isNew`, `bonusQty` | Genshin sim | MIT |
| Rates as one displayable data file | Forge, PokéRogue | Idea only |
| Effect as closed op list returning deltas | hearthbreaker, deckstorm | MIT |
| Version-file migrations | PokéRogue | AGPL, idea only |
| `react-parallax-tilt`, if we want a tilt dependency | npm | MIT |

| Avoid | Why |
| :--- | :--- |
| Copying pokemon-cards-css | GPL-3.0 |
| kongyo2/cards-css | MIT label over apparent GPL copy |
| hover-tilt | Licence conflict inside the repo, Svelte peer |
| boardgame.io as a dependency | It would own turn flow. Copy the idea of plugin boundaries only |
| Effects that hold functions in saved state | Saves cannot round-trip |
| Modifier flags read by the rules (Chaos-Chess) | That is the rule-changing road we rejected |
| Deck-style hidden rate changes for tiers | Conflicts with public rates |
