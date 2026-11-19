# C. Open-source town, city, farm and idle survey

Date 2026-10-31. Sibling reports: `A-cozy.md`, `B-city-card.md`. Input: `docs/plans/2026-10-30-crown-village-plan.md`, `src/village/`, `src/VillageView.tsx`.

## How to read this

- 52 repos were shallow-cloned to `D:\tmp\oss-town\<folder>`. Media and binary files (including `*.dat`, `*.obj`, `*.po`, fonts, models), submodules, LFS, hooks and symlinks were left out. So a folder missing `images/` is the clone filter, not the project. Nothing from them was run, built or installed.
- Every citation is `path:LINE «token»`, relative to that folder at the commit in the table. A script confirmed each token is on that line. That proves the line exists, not that the reading of it is right, so the mechanisms the closing design depends on were also read by hand (Ethereal Farm, gooboo, Evolve, Kittens, Towngardia).
- Balance numbers are what those games ship. None is tuned for us. Performance figures are authors' claims or inspection, never measured here. All numbers in "Reusable structures" are placeholders.
- No file addressed the survey with instructions. Two repos ship agent config (`three-stylized-water/.claude/launch.json`, `three-stylized/.agents/skills`), so do not start a coding agent inside those folders. `CardSettler/index.html` embeds a Supabase anon key for its own scores table. Do not use it.

## Licence summary

Licences were read from the files in each clone, not from the GitHub badge. The badge says NOASSERTION or none for several.

- **Copyleft, structure only, never code:** GPL-2: OpenTTD, Widelands, Unknown Horizons, Lincity-NG, Trimps, farmhand. GPL-3: Micropolis, micropolisJS, 3d.city, OpenRCT2, Mindustry, shapez.io, gooboo, Ethereal Farm, civ-clicker, 1255-burgomaster. AGPL-3: Julius, the freeciv-web client (its C server is GPL).
- **File-level copyleft:** MPL-2.0: Evolve, A Dark Room. Treat as structure only for this project.
- **Not open source, ideas only:** Kittens Game ("WET PAWS": personal or educational changes, no commercial gain, no derivative works). Koi (Apache 2.0 with Commons Clause). kingdomarchitect (KASAL-1.0, source-available, no derivatives outside contribution). Simutrans is under the Artistic licence with its own terms; treat as ideas only.
- **No licence granted, so all rights reserved:** paperclips (a mirror of Lantz and Foddy's game), tuntian, CardSettler, stackworlds-clone, hexagrid-relaxing.
- **Permissive:** MIT, Apache-2.0, Unlicense as listed. The brief says no code goes into `D:\chess`, so these are ideas too. If that ever changes, keep the notices. folio-2025's MIT covers code; asset rights are not separately stated.

## Repo table

Stars and last push are from the GitHub API on 2026-10-31.

| Folder | URL (github.com/) | Commit | Stars | Last push | Licence (from file) |
| :--- | :--- | :--- | ---: | :--- | :--- |
| micropolisJS | graememcc/micropolisJS | f13a162 | 734 | 2025-07-13 | **GPL-3** + Micropolis extras |
| micropolis | SimHacker/micropolis | c98f6b0 | 1120 | 2026-02-10 | **GPL-3** (`micropolis-activity/COPYING`), name licence |
| lincity-ng | lincity-ng/lincity-ng | 21796de | 645 | 2026-10-05 | **GPL-2**, data GPL or CC-BY-SA 2 |
| OpenTTD | OpenTTD/OpenTTD | d4702b4 | 8443 | 2026-10-30 | **GPL-2** |
| simutrans | simutrans/simutrans | 2b16ea2 | 105 | 2026-10-30 | Artistic (own text) |
| widelands | widelands/widelands | 2975377 | 3118 | 2026-10-29 | **GPL-2** |
| unknown-horizons | unknown-horizons/unknown-horizons | c37c06e | 1557 | 2026-10-31 | **GPL-2** (`doc/licenses`, README) |
| OpenRCT2 | OpenRCT2/OpenRCT2 | 3b7114c | 16522 | 2026-10-28 | **GPL-3** |
| julius | bvschaik/julius | 34d1ecd | 3430 | 2026-09-12 | **AGPL-3** |
| Mindustry | Anuken/Mindustry | b873c01 | 29545 | 2026-10-22 | **GPL-3** |
| freeciv-web | freeciv/freeciv-web | c19ce06 | 2215 | 2026-03-27 | **AGPL** client, **GPL** server |
| shapez.io | tobspr-games/shapez.io | 8a79de5 | 7002 | 2026-09-07 | **GPL-3** |
| kittensgame | nuclear-unicorn/kittensgame | 781e379 | 115 | 2026-10-26 | **WET PAWS, no derivatives** |
| gooboo | Tendsty/gooboo | b775d12 | 116 | 2026-02-11 | **GPL-3** |
| etherealfarm | lvandeve/etherealfarm | 592c2b8 | 38 | 2026-10-18 | **GPL-3** |
| farmhand | jeremyckahn/farmhand | 0fb9494 | 146 | 2026-10-30 | **GPL-2** |
| Evolve | pmotschmann/Evolve | 3436358 | 1274 | 2026-10-16 | MPL-2.0 |
| Trimps.github.io | Trimps/Trimps.github.io | b9edb1d | 287 | 2025-03-12 | **GPL-2** |
| AntimatterDimensionsSourceCode | IvarK/AntimatterDimensionsSourceCode | 5409e32 | 416 | 2026-07-17 | MIT |
| civ-clicker | deathraygames/civ-clicker | ca77c85 | 65 | 2024-01-24 | **GPL-3** |
| adarkroom | doublespeakgames/adarkroom | 1fada46 | 8369 | 2025-05-23 | MPL-2.0 |
| paperclips | jgmize/paperclips | d1e9177 | 118 | 2019-09-25 | **None** (mirror) |
| yet-another-idle-rpg | miktaew/yet-another-idle-rpg | e335643 | 115 | 2026-06-26 | MIT |
| progress-knight | ihtasham42/progress-knight | f6dd0c3 | 182 | 2023-08-20 | Unlicense |
| 1255-burgomaster | Areso/1255-burgomaster | a8ebb11 | 142 | 2024-04-09 | **GPL-3** |
| kirkmcdonald.github.io | KirkMcDonald/kirkmcdonald.github.io | 349ebfb | 754 | 2025-07-02 | Apache-2.0 |
| stackcards | tercjak/stackcards | 574b19d | 0 | 2026-03-16 | Apache-2.0 |
| tuntian | mitanguse/tuntian | 78478b6 | 0 | 2026-10-27 | **None** |
| CardSettler | thomaswanggg0-bit/CardSettler | 17e7d8a | 0 | 2026-05-06 | **None** |
| stackworlds-clone | jalex-stark/stackworlds-clone | c83811b | 0 | 2025-06-29 | **None** (fan project note) |
| StartX | Frankfromfuture/StartX | 6aca77e | 3 | 2026-10-25 | MIT |
| simcity-threejs-clone | dgreenheck/simcity-threejs-clone | 9116cf6 | 275 | 2025-12-20 | MIT |
| isocity | victorqribeiro/isocity | c577241 | 3263 | 2024-10-14 | MIT |
| 3d.city | lo-th/3d.city | 60fc6de | 1760 | 2026-04-16 | **GPL-3** + Micropolis extras |
| Towngardia | dpmm99/Towngardia | 23aabac | 10 | 2026-10-30 | MIT |
| kingdomarchitect | trymnilsen/kingdomarchitect | 63fbf17 | 23 | 2026-10-30 | **KASAL-1.0, no derivatives** |
| Koi | jobtalle/Koi | f6f6666 | 413 | 2026-04-07 | **Commons Clause** |
| hex-map-wfc | felixturner/hex-map-wfc | ac797a9 | 442 | 2026-03-10 | MIT |
| wavefunctioncollapse | kchapelier/wavefunctioncollapse | f1374ee | 526 | 2023-08-24 | MIT |
| three-wfc | Fennec-hub/three-wfc | ebb5f56 | 82 | 2025-06-02 | MIT |
| hexcastle | Snokke/hexcastle | 3537bbe | 31 | 2025-08-10 | MIT |
| ndwfc | LingDong-/ndwfc | 3479af8 | 339 | 2020-05-21 | MIT |
| irregular_grid | sketchpunklabs/irregular_grid | 40014e3 | 57 | 2025-01-27 | MIT |
| hexagrid-relaxing | kchapelier/hexagrid-relaxing | 3fdc533 | 34 | 2020-05-06 | **None** |
| townsclipper | alvaro-cuesta/townsclipper | 8914b9d | 34 | 2020-09-30 | MIT text |
| webgl-outlines | OmarShehata/webgl-outlines | 42e2103 | 415 | 2022-12-09 | MIT |
| Three.js-Ocean-Scene | Nugget8/Three.js-Ocean-Scene | f476357 | 76 | 2023-11-19 | MIT |
| stylized-water | thaslle/stylized-water | 76a335f | 77 | 2025-03-04 | MIT (Codrops) |
| three-stylized-water | norio/three-stylized-water | 47cc902 | 80 | 2026-08-16 | MIT |
| threejs-grass-water-shaders | boona13/threejs-grass-water-shaders | 97fb7ea | 15 | 2026-05-09 | MIT |
| three-stylized | Steve245270533/three-stylized | 8eb0dde | 65 | 2026-08-11 | MIT |
| folio-2025 | brunosimon/folio-2025 | 41046b5 | 1997 | 2026-04-07 | MIT (code) |

### Gaps against the requested list

- **Melvor:** closed source. `yet-another-idle-rpg` is the nearest open analogue. The melvor-clone repos found have 0 or 1 stars and were skipped.
- **CivClicker:** the original is not on GitHub under the expected names. `deathraygames/civ-clicker` is the maintained fork.
- **Tiny Glade:** no open clone with substance. GitHub hits are mods, viewers and trainers. Its look is covered only by general stylised-render repos.
- **Townscaper:** no real open clone. The two matching three.js repos have 0 stars and were skipped. The grid algorithm comes from `irregular_grid`, the save format from `townsclipper`.
- **Stacklands:** only small clones exist. Treat them as prototypes, not proven balance.
- **Stardew-likes in JS:** nothing beyond phaser demos. `farmhand` and `gooboo` are the real farm references.
- **Factorio-likes in JS:** shapez.io is the only substantial one. Mindustry is Java.
- Many recent 0-star "cozy farm" and "city builder" repos were not cloned. Judged by description only, so something useful may be among them.

## Findings across repos

1. **Offline falls into five families.**
   - Closed form on cached rates: Kittens.
   - One `tick(n)` whose logic is analytic in `n`: gooboo.
   - Event-driven jumps with constant rates between events: Ethereal Farm.
   - Fixed tick budget, with step length = time left / ticks left: Antimatter Dimensions.
   - Real replay in small batches: Towngardia, Trimps.

   A sixth option grants a speed boost instead of goods (Evolve). All the desktop sims (OpenTTD, Widelands, Julius, OpenRCT2 and the others) have none.
2. **Bounded storage is the cleanest cap.** Towngardia buffers 5 days of output and Mindustry clamps to free storage. Neither needs a separate time cap, and "storage full" is a fair, visible reason to come back.
3. **Absolute timestamps beat counters.** kingdomarchitect stores only when a crop was planted, and stackworlds stores a finish tick. Offline resolution for those is one comparison. Our `build.done` already works this way.
4. **Adjacency is the smallest system with the most decisions.** Ethereal Farm builds its whole game from orthogonal neighbours. Julius uses rings that fade with distance. gooboo uses rows and columns. OpenRCT2 and Unknown Horizons count nearby items against a hard cap.
5. **Recipes converge on one shape:** inputs, kept inputs, outputs, time. tuntian and CardSettler both use an `in / keep / out` form. A per-input consume flag (StartX) is the most general version.
6. **Save versioning is settled.** The maintained games use ordered per-version migration steps. Keep each one small and self-contained (Antimatter avoids global accessors so old patches stay valid).
7. **Decay is the default that we must remove.** Widelands fields rot, Julius houses devolve, CivClicker and tuntian starve, farmhand crows destroy crops, Unknown Horizons happiness drains. Our plan bans all of these. gooboo's overgrow is the inverse: leaving a crop pays more, with diminishing returns.
8. **The best render references are WebGPU.** hex-map-wfc, folio-2025 and three-stylized-water all use TSL. Their ideas port to GLSL, their code does not. `three-stylized`, `stylized-water` and `hexcastle` are the WebGL ones.

## City and transport simulations

### micropolisJS
GPL-3. Pure-ish JS with a few `.ts` files. Read directly.
- demand: valves take projected migration plus births; birth rate 0.02 — `src/valves.js:56 «birthRate = 0.02»`
- tax curve: 21 entries from +200 at 0% to -600 at 20% — `src/valves.js:34 «200, 150, 120, 100, 80, 50, 30, 0»`
- demand velocity: each ratio adds to a clamped valve, not a level, so demand has momentum — `src/valves.js:129 «-RES_VALVE_RANGE, RES_VALVE_RANGE»`
- tick: 16-phase cycle; phases 1 to 8 each scan one eighth of map width, so a full pass is spread across frames — `src/simulation.js:313 «this._phaseCycle &= 15»`
- tick: scan slice — `src/simulation.js:337 «this._mapScanner.mapScan((this._phaseCycle - 1)»`
- speed: 100, 50 or 10 ms per step; paused returns early; no elapsed-time logic, so no offline — `src/simulation.js:204 «threshold = 10»`
- land value: (34 minus half the centre distance) shifted left 2, plus terrain, minus pollution — `src/blockMapUtils.js:246 «34 - Math.floor(getCityCentreDistance»`
- costs: airport 10000; zones 100, coal 3000, stations 500 — `src/gameTools.js:28 «new BuildingTool(10000, TileValues.AIRPORT»`
- road: 10 per tile, 50 on water, and bridges need an aligned road neighbour — `src/roadTool.js:37 «cost = 50»`
- road access: a trip must reach a destination within 30 steps — `src/traffic.js:101 «MAX_TRAFFIC_DISTANCE = 30»`
- traffic: each trip adds 50 to tile density, capped at 240 — `src/traffic.js:63 «traffic += 50»`
- placement: every footprint tile must be dirt or auto-bulldozable — `src/buildingTool.js:73 «tileValue === DIRT»`
- save: localStorage JSON, version 3, fall-through switch of upgrades on load — `src/storage.js:26 «this.transitionOldSave(savedGame)»`

Ideas: momentum demand meter, split scans across frames, fall-through save upgrade.

### micropolis
GPL-3. Original logic. Mostly the same design as the JS port.
- demand valves: migration and births project population, with birth rate 0.02 and internal market / 3.7 — `MicropolisCore/src/MicropolisEngine/src/simulate.cpp:560 «float birthRate = 0.02;»`
- valve velocity: ratios add to clamped valves (±2000 residential, ±1500 others) — `MicropolisCore/src/MicropolisEngine/src/simulate.cpp:653 «resValve + (short)resRatio»`
- C++ bug: residential ratio is overwritten with the industrial one — `MicropolisCore/src/MicropolisEngine/src/simulate.cpp:644 «resRatio = min(indRatio, indRatioMax);»`
- original C: clamps each ratio to 2 separately, so read this form, not the port — `micropolis-activity/src/sim/s_sim.c:488 «if (Iratio > 2) Iratio = 2;»`
- land value: (34 - distance/2) × 4 + terrain - pollution, -20 for high crime, clamped 1 to 250 — `MicropolisCore/src/MicropolisEngine/src/scan.cpp:265 «34 - getCityCenterDistance»`
- soft unlock: a stadium cap forces residential valve to 0 at population limits; raw save with no version field; no offline — `MicropolisCore/src/MicropolisEngine/src/simulate.cpp:657 «resCap && resValve > 0»`

Ideas: "needs a landmark" cap as a soft unlock; land value from distance to village centre minus nuisance.

### lincity-ng
GPL-2. C++.
- farm: base food 550 scaled by (fertile + watered tiles)/16 and labour/13, floor 30 — `src/lincity/modules/organic_farm.hpp:47 «ORGANIC_FARM_FOOD_OUTPUT 550»`
- market: range 9, size 2, tiered labour 1/5/12/28; links every construction in range — `src/lincity/modules/market.hpp:47 «GROUP_MARKET_RANGE 9»`
- flow: goods equalise so each partner reaches the same fill ratio of capacity; no routing — `src/lincity/modules/market.cpp:150 «trade_ratio = lvl * TRANSPORT_QUANTA»`
- transport: food capacity 2048 on track, ×4 on road, ×16 on rail; flow is per-tile diffusion — `src/lincity/transport.hpp:70 «(MAX_FOOD_ON_TRACK*4)»`
- gate: substation needs tech 200/1000 — `src/lincity/modules/substation.hpp:42 «(200 * (MAX_TECH_LEVEL / 1000))»`
- gate: each building has a tech number checked at build; cost also scales with tech — `src/lincity/lintypes.cpp:930 «world.tech_level < tech»`
- desirability: base good 30 versus bad 35; cricket +20, health +15, fire +15, fed +10, starving bad +250 — `src/lincity/modules/residence.cpp:205 «good += 20»`
- save: XML, version 2140 with compat floor 2130, others refused; no offline — `src/lincity/xmlloadsave.hpp:25 «LOADSAVE_VERSION_CURRENT 2140»`

Ideas: replace routing with "equalise fill ratios" between linked buildings, a market radius as the only logistics, one tech number per card.

### OpenTTD
GPL-2. C++.
- payment: income = dist × time_factor × pieces × payment >> 21; time factor falls past days1 and faster past days1+days2, floor 31 — `src/economy.cpp:1016 «MAX_TIME_FACTOR - periods_over_periods1»`
- curve: below factor 31 an asymptotic tail, never under factor 1 — `src/economy.cpp:1009 «asymptotically decreased to a limit»`
- cargo: passengers 3185 base, days 0/24, spoil fast — `src/table/cargo_const.h:58 «0x400, 3185,  0,  24»`
- cargo: grain 4778 with days 4/40, slow spoil — `src/table/cargo_const.h:67 «0x100, 4778,  4,  40»`
- industry: temperate farm accepts nothing, produces grain 10 and livestock 10 per cycle — `src/table/build_industry.h:1229 «MCT_GRAIN_WHEAT_MAIZE,      10»`
- industry: factory accepts livestock, grain, steel with multiplier 256 into goods — `src/table/build_industry.h:1200 «MCT_LIVESTOCK_FRUIT, 256»`
- conversion: output waiting += input × multiplier / 256, so 256 is 1:1 — `src/economy.cpp:1160 «indspec->input_cargo_multiplier[ita»`
- tick: primary industries pay out every 256 ticks, independent of delivery — `src/timer/timer_game_tick.h:82 «INDUSTRY_PRODUCE_TICKS = 256»`
- offline: none; world advances only in this fixed-step loop — `src/openttd.cpp:1197 «void StateGameLoop()»`
- town growth: interval depends on active stations (0 to 5+), divided by houses/50 + 1 — `src/town_cmd.cpp:3900 «320, 420, 300, 220, 160, 100»`
- catchment: bus/truck 3 tiles, train 4, dock 5; acceptance summed in eighths, accepted at 8/8 — `src/station_cmd.cpp:653 «amt >= 8»`
- save: one enum entry per format change, now 368, with 179 branches in afterload — `src/saveload/saveload.h:426 «Saveload version: 368»`

Ideas: two-threshold freshness price as a bonus only, fixed batch per farm tick, 1:1 conversion on delivery, town growth tied to number of served hubs, summed-eighths acceptance for "this tile wants X".

### simutrans
Artistic licence. C++. Goods and factory pak `.dat` content is not in this repo; its 16 `.dat` files are UI themes and text, per the git tree.
- goods format: `.dat` keys value, catg, speed_bonus, weight_per_unit, mapcolor — `src/simutrans/descriptor/writer/good_writer.cc:26 «"speed_bonus"»`
- factory format: indexed keys inputgood[n], inputsupplier[n], inputcapacity[n], inputfactor[n] (percent) — `src/simutrans/descriptor/writer/factory_writer.cc:247 «inputfactor[%d]»`
- boost: electricity_boost defaults to 1000 per mille; passenger and mail boosts default 0 — `src/simutrans/descriptor/writer/factory_writer.cc:188 «"electricity_boost",   1000»`
- production: prod = prodbase × boost × delta_t, with the shifted-off remainder carried, so no output is lost — `src/simutrans/simfab.cc:1929 «(uint64)prodbase * (uint64)boost»`
- passenger boost: pro rata, arrivals / demand × pax_boost, capped; averaged over 4 periods — `src/simutrans/simfab.cc:473 «desc->get_pax_boost()»`
- revenue: value × max(125, 1000 + (speed% - 100) × speed_bonus), floor 1/8 of base — `src/simutrans/simware.cc:184 «1000 + kmh_base*desc->get_speed_bonus()»`
- passengers: default passenger_factor 16 — `simutrans/config/simuconf.tab:136 «passenger_factor=16»`
- tick: variable delta_t step, so a catch-up could be one big delta; no offline logic exists — `src/simutrans/simfab.cc:1862 «void fabrik_t::step(uint32 delta_t)»`

Ideas: production as a pure function of elapsed time with a carried remainder; visitors give a pro-rata output boost.

### widelands
GPL-2. C++ engine, Lua data. The best text format for chains.
- recipe: bakery consumes 3 water and 3 wheat for 2 bread in about 68 s — `data/tribes/buildings/productionsites/barbarians/bakery/init.lua:58 «consume=water:3 wheat:3»`
- gate: first action skips the program unless the economy needs bread — `data/tribes/buildings/productionsites/barbarians/bakery/init.lua:57 «return=skipped unless economy needs»`
- farm: plant then harvest, 54.4 s minimum, 83.2 s maximum — `data/tribes/buildings/productionsites/barbarians/farm/init.lua:74 «29.2 + 25.2 = 54.4 sec»`
- worker: farmer finds free land in radius 2, walks, plants — `data/tribes/workers/barbarians/farmer/init.lua:26 «findspace=size:any radius:2 space»`
- crop stages: 30 s, 45 s, 50 s, 125 s to ripe — `data/tribes/buildings/productionsites/barbarians/farm/init.lua:68 «30 + 45 + 50 = 125 sec»`
- decay (reject): a ripe field stays 8m20s, then removes itself — `data/tribes/immovables/wheatfield/ripe/init.lua:13 «animate=idle duration:8m20s»`
- target: bread defaults to a stock target of 20 — `data/tribes/initialization/barbarians/units.lua:200 «default_target_quantity = 20»`
- need: a ware is not needed once warehouse stock reaches target — `src/economy/economy.cc:565 «quantity_global >= target_global»`
- road: wallet charged 1 per second per carrier, second carrier costs 600, max 1500 — `src/economy/road.cc:461 «/ 1000) * carriers_count()»`
- upgrade: a building declares an enhancement target with its own cost — `data/tribes/buildings/productionsites/barbarians/micro_brewery/init.lua:12 «enhancement = {»`
- tick: deterministic command queue advanced by frame time; no offline — `src/logic/game.cc:888 «cmdqueue().run_queue(»`
- save: each packet stores its version and accepts a range — `src/game_io/game_class_packet.cc:42 «packet_version >= 8»`

Ideas: cards as short action lists, auto-pause producers at a player-set stock target, upgrades as a card field. Keep rotting out.

### unknown-horizons
GPL-2. Python with YAML content.
- chain: farm turns 2 potatoes into 1 food; a field (150 gold) yields 1 potato per 26 s — `content/objects/buildings/farm.yaml:47 «[RES.POTATOES, -2]»`
- adjacency: farm output scales by nearby fields / 8, so eight fields is full utilisation — `horizons/world/production/utilization.py:66 «max_fields_possible = 8»`
- happiness: needs are production lines per tier; for Sailors 1 food gives +15 per 60 s — `content/objects/buildings/tent.yaml:60 «[RES.HAPPINESS, 15]»`
- thresholds: start 50, grow above 70, shrink below 30, level-up 80, level-down below 10 — `content/balance.sql:40 «happiness_level_up_requirement»`
- tiers: Settlers tax 10, 5 residents; Sailors 3/2 up to Aristocrats 28/21 — `content/game.sql:361 «'Settlers',    10,  5»`
- tick: every 30 s tax = base × rate × (0.5 + happiness/70) × fill, then happiness drops 6 — `horizons/world/building/settler.py:234 «0.5 + (float(self.happiness) / 70.0)»`
- unlock: buildings carry a tier, available when settler_level reaches it — `horizons/gui/mousetools/pipettetool.py:87 «building_tiers[building_id] <=»`
- save: SQLite with revision 77 and a rev-by-rev upgrader; no offline — `horizons/constants.py:110 «SAVEGAMEREVISION = 77»`

Ideas: farm yield = adjacent fields / 8, house needs as recipes that output happiness, tier level per card. Drop the constant drain.

### OpenRCT2
GPL-3. C++.
- scenery: count items in the 11×11 around the station, score = min(count, 47) × 5 — `src/openrct2/ride/RideRatings.cpp:1806 «std::min(numSceneryItems, 47) * 5»`
- weight: per-ride modifier; Ferris wheel takes 41831/65536 of the score — `src/openrct2/ride/rtd/gentle/FerrisWheel.h:67 «41831»`
- penalty: each intensity bound passed cuts excitement 25% — `src/openrct2/ride/RideRatings.cpp:1321 «{ 1000, 1100, 1200, 1320, 1450 }»`
- happiness: shown value eases ±4 toward a hidden target — `src/openrct2/entity/Guest.cpp:800 «newHappiness + 4»`
- thoughts: "nice scenery" fires at 40+ scenery with under 8 litter nearby — `src/openrct2/entity/Guest.cpp:2975 «num_scenery >= 40 && num_rubbish < 8»`
- park rating: base 1150, then -500 + 2 × min(250, happy% × 3) — `src/openrct2/world/Park.cpp:416 «(happyGuestCount * 300)»`
- research: funding levels advance at 0, 160, 250, 400 per step — `src/openrct2/management/Research.cpp:42 «_researchRate[]»`
- save: park file version 63 with minimum reader 57; no offline — `src/openrct2/park/ParkFile.h:22 «kParkFileCurrentVersion = 63»`

Ideas: decor score with hard cap, eased displayed value, thought bubbles from tile scans (animals could say why they like a spot), separate "written by" and "minimum reader" save versions.

### julius
AGPL-3. C. Highest value for adjacency. The real data table is `c3_model.txt` from the player's own Caesar III copy, so numbers below come from the test stub and should be read as shape only.
- spread: applied ring by ring to distance 6; value, then add step_size every step tiles, bounded ±100 — `src/map/desirability.c:53 «if (range > 6) range = 6;»`
- table: real values live in a game file, not shipped — `src/building/model.c:83 «c3_model.txt»`
- good: gardens cost 12, value +3, step 1, size -1, range 3 — `test/stub/model.c:43 «{12, 3, 1, -1, 3, 0}»`
- bad: warehouse 70, -5, 2, +2, range 3, 6 workers — `test/stub/model.c:76 «{70, -5, 2, 2, 3, 6}»`
- house: small insula devolves at 18, evolves at 25, with needs for entertainment, fountain, god, school, bath, food, pottery — `test/stub/model.c:144 «{18, 25, 25, 2, 1, 1, 0, 1, 0, 1, 1, 0»`
- hysteresis: separate up and down thresholds; devolving waits 2 failed checks — `src/building/house_evolution.c:174 «has_required_goods_and_services(house»`
- terrain: next to water +10; elevation adds more — `src/building/building.c:263 «b->desirability += 10;»`
- road: houses need a road within 2 tiles — `src/building/maintenance.c:235 «b->size, 2, &x_road, &y_road»`
- coverage: a walker passing sets a service to 96, decaying 1 per day, about 96 days of memory — `src/figure/service.c:10 «MAX_COVERAGE 96»`
- labour: daily progress += workers; done at 200 raw, 400 workshop — `src/building/industry.c:60 «progress += b->num_workers;»`
- risk: damage risk rises daily and collapses above 200 — `src/building/maintenance.c:185 «b->damage_risk > 200»`
- tick: 50 ticks a day with fixed jobs on set ticks; no offline — `src/game/tick.c:152 «map_desirability_update()»`

Ideas: value/step/size/range rings per decoration card, two-threshold house levels, service stamp instead of walkers. Upgrades only, no devolving for us.

### Mindustry
GPL-3. Java.
- recipe: graphite press 2 coal to 1 graphite in 90 ticks (1.5 s) — `core/src/mindustry/content/Blocks.java:1050 «consumeItem(Items.coal, 2)»`
- recipe: silicon smelter 1 coal + 2 sand to 1 silicon in 40 ticks — `core/src/mindustry/content/Blocks.java:1082 «Items.coal, 1, Items.sand, 2»`
- placement bonus: cultivator efficiency scales with terrain attribute under it — `core/src/mindustry/content/Blocks.java:2964 «attribute = Attribute.spores»`
- crafter: each frame progress += efficiency / craftTime; at 1 it crafts and dumps — `core/src/mindustry/world/blocks/production/GenericCrafter.java:240 «getProgressIncrease(craftTime)»`
- tech tree: nested node calls with objectives; the tree is code — `core/src/mindustry/content/SerpuloTechTree.java:20 «new SectorComplete(extractionOutpost)»`
- research cost: derived from build cost, 60 × mult + amount^1.11 × 20 × mult, rounded to 10 — `core/src/mindustry/world/Block.java:1289 «Mathf.pow(requirements[i].amount»`
- rate: rolling mean of real core deltas over 60 samples — `core/src/mindustry/game/SectorInfo.java:21 «valueWindow = 60»`
- away production: items += min(mean rate × seconds, free storage) — `core/src/mindustry/game/Universe.java:213 «stat.mean * newSecondsPassed»`
- away cadence: 2-minute turn on frame time only, so it runs while the app is open, not on wall clock — `core/src/mindustry/Vars.java:127 «turnDuration = 2 * Time.toMinutes»`
- away freeze: a sector under attack gets no time — `core/src/mindustry/game/Universe.java:207 «!sector.isAttacked()»`
- save: one class per version (Save1 to Save13) — `core/src/mindustry/io/SaveIO.java:100 «Unknown save version»`
- render: blocks stack small drawers instead of one sprite — `core/src/mindustry/content/Blocks.java:2970 «new DrawMulti(»`

Ideas: offline = min(rate × elapsed, storage) with a wall-clock timestamp, unlock costs derived from build cost, buildings composed of small animated layers.

### freeciv-web
AGPL client, GPL server. Ruleset files are fetched at setup, not stored here.
- rulesets: not in the repo — `freeciv/dl_freeciv_default.sh:23 «https://github.com/freeciv/freeciv.git»`
- reqs: requirements arrive as kind/value/present records — `freeciv-web/src/main/webapp/javascript/improvement.js:83 «['kind'] == 1»`
- gate: server sends a per-city can-build bitvector — `freeciv-web/src/main/webapp/javascript/city.js:600 «can_build_improvement»`
- production: turns = floor((cost - stock - 1)/surplus + 1) — `freeciv-web/src/main/webapp/javascript/city.js:639 «(cost - city_shield_stock - 1)»`
- absence: turn timeouts replace real time — `freeciv-web/src/main/webapp/javascript/game.js:162 «current_turn_timeout»`
- late join: LongTurn gives techs to late joiners, catch-up by gift — `freeciv/patches/longturn.patch:35 «do_longturn_tech_latejoiner_effect»`
- render: terrain blends by height bands, beach at 50 to 53.5 — `freeciv-web/src/main/webapp/javascript/webgl/shaders/terrain_fragment_shader.glsl:117 «beach_high = 53.5»`
- render: land mesh uses vertex colours — `freeciv-web/src/main/webapp/javascript/webgl/mapview.js:173 «vertexColors: THREE.VertexColors»`

Ideas: `{kind, value, present}` requirement records; "ready in N" formula; vertex-colour terrain.

## Idle, resource and farm games

### kittensgame
WET PAWS licence, no derivatives. Pure JS (dojo globals), about 43,700 lines. Core: `game.js`, `core.js`, `js/buildings.js`, `js/resources.js`.
- data: field costs 10 catnip, price ×1.12 per owned, +0.125 catnip per tick — `js/buildings.js:358 «priceRatio: 1.12»`
- data: hut has steep ratio 2.5 and an `unlocks` map — `js/buildings.js:491 «priceRatio: 2.5»`
- data: `stages` upgrades one slot in place with separate effects (pasture to solar farm) — `js/buildings.js:371 «stages: [»`
- cost: base × ratio^(owned + fakeBought) × modifiers, recomputed, never stored — `js/buildings.js:2608 «Math.pow(ratio, bldVal + fakeBought)»`
- caps: no cap table; cap is the summed `<res>Max` effect (barn catnip 5000) — `js/buildings.js:811 «"catnipMax": 5000»`
- chain: smelter consumes wood and minerals per tick, yields iron as effects; a separate on-count throttles it — `js/buildings.js:1092 «0.02 * smelterRatio»`
- unlock: building shows when stock reaches unlockRatio (usually 0.3) of each base price — `js/buildings.js:2846 «price.val * unlockRatio»`
- tick: 5 ticks per second, 10 ticks a day, 100 days a season — `game.js:2289 «ticksPerSecond: 5»`
- effects: `calculateAllEffects` runs on load and rebuilds the effect cache; it is not the offline routine — `game.js:5925 «calculateAllEffects: function()»`
- offline 1: elapsed ms / 2000 = days; under 3 days ignored as UI lag — `js/time.js:246 «Math.round(delta / 2000)»`
- offline 2: capped at 10 years, or 40 late game (4000 or 16000 days, about 2.2 h or 8.9 h) — `js/time.js:253 «? 40 : 10»`
- offline 3: closed form, cached perTick × days × ticks per day, limits relaxed so automation can spend, then re-clamped — `js/resources.js:855 «res.perTickCached * daysOffset»`
- offline 4: random events become expected counts, paid as a lump — `js/calendar.js:748 «Math.round(daysOffset * eventChance»`
- save: JSON + LZString, saveVersion 15 with stepwise blocks — `game.js:3309 «save.saveVersion == 1»`

Ideas: base price + ratio + effect keys, caps as summed effects, expected-value events paid once.

### gooboo
GPL-3. Plain ES modules plus Vuex and 210 `.vue` files, about 69,700 lines. Our plan already cites it. Closest overall to what we want.
- crop: grow minutes, yield, rareDrop, tier, type; ladder 1 h/130, 2 h/250, 4 h/480, 8 h/850, 20 h/1600 — `src/js/modules/farm/crop.js:53 «yield: 1600»`
- fertilizer: multiplier bundles; richSoil ×1/1.25 grow time, ×1.25 overgrow, ×1.4 yield — `src/js/modules/farm/fertilizer.js:15 «farmGrow: 1 / 1.25»`
- field: 7×7 null cells with centre 2×2 open; upgrades open more — `src/store/farm.js:401 «(x > 1 && x < 4 && y > 1 && y < 4)»`
- tick: farm ticks every 5 s; growth adds cached grow × ticks / 12 — `src/js/modules/farm.js:39 «cell.cache.grow * ticks / 12»`
- overgrow: past 1, each stage costs overgrowMult^stage in a small loop; yield multiplies by grow, so waiting pays with diminishing returns — `src/js/modules/farm.js:46 «cell.cache.overgrowMult, stage»`
- adjacency: sprinkler covers its row, +40% grow speed, +2 overgrow; lectern covers its column — `src/js/constants.js:90 «FARM_SPRINKLER_GROW = 0.4»`
- adjacency: pinwheel and gnome reach Chebyshev 1; flag boosts one crop type per diagonal quadrant — `src/store/farm.js:1065 «Math.abs(x - p.x) <= 1»`
- adjacency: building effects accumulate as value × ticks; harvest divides by cell time, so a bonus is time-weighted over the crop's life — `src/js/modules/farm.js:60 «value: decoration * ticks»`
- offline: no separate path; per-frame advance passes the whole gap to one tick per module. No cap found in the code read — `src/js/tick.js:86 «Math.floor(newTime * store.state.system»`
- summary: raw old save is kept and the return screen diffs it against live state, shown after 60 s away — `src/components/render/OfflineFeature.vue:102 «this.oldSavefile.currency[key]»`
- queue: list drained by a seconds budget; leftover carries to the next item, works unchanged for one tick or one day — `src/store/upgrade.js:393 «seconds < timeNeeded»`
- soft cap: gain above cap scales by overcapMult × overcapScaling^(stage-1), defaults 0.25 and 0.5 — `src/store/currency.js:159 «state[name].overcapMult * Math.pow»`
- unlock: three data fields, requirementBase, requirementStat, requirementValue — `src/js/modules/farm/upgrade.js:79 «requirementValue: 1»`
- cards: packs are data with unlock, amount, price and a public weight map per card — `src/js/modules/farm/card.js:33 «amount: 3, price: 30»`
- cards: named collections grant a reward when complete — `src/js/modules/farm/card.js:14 «collection: {»`
- cards: each pack has its own seeded RNG stream, so a reload cannot reroll — `src/store/card.js:184 «'cardPack_' + o.name»`
- save: JSON then base64, checksum, semver-keyed migrations — `src/js/savefile.js:81 «semverCompare(file.version, version)»`

Ideas: `tick(n)` analytic in n so offline is the live path, overgrow, return screen by save diff, seeded card streams, row and column tools. Its emerald-priced packs conflict with our no-paid-pack rule; take only the data shape.

### etherealfarm
GPL-3. Pure JS, no modules, about 68,600 lines (25,700 in game, data, state, save). Highest value for adjacency and time jumps.
- data: berry base scales 2000^tier — `data.js:2056 «Num.rpow(2000, Num(i))»`
- data: cost uses a quadratic exponent that outruns production on purpose — `data.js:2081 «Num.rpow(1.5, Num((i2 - 1) * (i2 - 1)))»`
- data: plant time 60 s for berry and mushroom, 90 s flower, 15 s nettle; field starts 5×5 — `data.js:2153 «berryplanttime0 = 60»`
- adjacency: flowers add with each other, then multiply the crop by (1 + sum of orthogonal boosts) — `data.js:1046 «mul_boost.addInPlace(boost)»`
- adjacency: flower base boost 0.5, 2, then 0.5 × 16^(tier-1) — `data.js:2139 «Num(16).powr(tier - 1)»`
- adjacency: nettle helps mushrooms but cuts neighbouring flowers and berries by 1/(sqrt(boost)+2) — `data.js:604 «boost.powr(0.5).addr(2).inv()»`
- adjacency: beehive boosts the boosters — `data.js:1555 «p.beeboostboost_received.addr(1)»`
- adjacency: consumers take neighbour seeds over 4 alternating passes, written so rotation or mirroring does not change results — `game.js:1920 «p2.prod2.seeds.divr(»`
- offline 1: same update() at 333 ms; over 2 s elapsed means fast-forward; no time cap found — `game.js:4146 «total_d > 2»`
- offline 2: each loop recomputes the field, then jumps to the next event at constant income — `game.js:4342 «nextEventTime(nexttime»`
- offline 3: events are season, weather, tree level-up, automation, and a forced 2 s step while crops grow — `game.js:3832 «addtime(2, 'growth')»`
- offline 4: minimum step grows to 2, 5, 10 s after 20, 50, 200 loops — `game.js:4364 «numloops > 200 && next < 10»`
- offline 5: growth adds d / plantTime and income adds production × d — `game.js:6177 «actualgain.addInPlace(prod.mulr(d))»`
- save: 'EF' + version + LZ77 token stream + checksum, with per-field version gates — `save.js:1131 «'EF' + save_version + ticks_code»`

Ideas: event-driven jumps, fixed-order neighbour passes (boosters of boosters, boosters, producers, consumers).

### farmhand
GPL-2. TypeScript and React, about 52,000 lines. Closest to our stack, but day-based.
- crop: seed + harvest item; timeline of days per stage — `src/data/crops/carrot.ts:6 «cropTimeline: [2, 1, 1, 1]»`
- value: derived, 10 + lifecycle days × tier × (1 seed, 3 crop) — `src/data/crop.ts:32 «10 + cropLifecycleDuration * tier»`
- price: daily multiplier random 0.5 to 1.5 per item — `src/common/utils.ts:27 «getValueAdjustmentStream(key)»`
- price: 20% daily chance of a crash or surge on a random crop — `src/constants.ts:166 «PRICE_EVENT_CHANCE = 0.2»`
- price: event duration is lifecycle minus 1 day — `src/utils/getPriceEventForCrop.ts:10 «getCropLifecycleDuration(cropItem»`
- day: end of day is an ordered array of pure reducers; no offline — `src/game-logic/reducers/computeStateForNextDay.ts:43 «processField,»`
- growth: +1 per watered day, +0.5 if fertilized — `src/game-logic/reducers/incrementPlotContentAge.ts:18 «: FERTILIZER_BONUS)»`
- stage: floor(daysWatered) indexed into expanded timeline — `src/utils/getCropLifeStage.ts:16 «Math.floor(daysWatered)»`
- adjacency: sprinkler range is a square of side 2r+1 — `src/utils/getRangeCoords.ts:6 «2 * rangeSize + 1»`
- unlock: sparse level table with unlocksShopItem, unlocksTool, increasesSprinklerRange — `src/data/levels.ts:39 «increasesSprinklerRange: true»`
- punish (reject): crows destroy crops unless a scarecrow is anywhere on the field — `src/game-logic/reducers/applyCrows.ts:28 «fieldHasScarecrow(field)»`
- xp: ((level-1) × 10)^2 — `src/utils/experienceNeededForLevel.ts:2 «((targetLevel - 1) * 10) ** 2»`
- recipes: ingredients + condition(state) + type; value 1.25 × ingredients; salt needs 30 rock sold — `src/data/recipes.ts:53 «state.itemsSold[items.saltRock.id]»`
- shop: fixed list filtered by level; save has no versioned migrations — `src/utils/getAvailableShopInventory.ts:12 «unlockableItems.hasOwnProperty(id)»`

Ideas: prices from a formula over timeline and tier, ordered reducer list, "sold N of X" gates.

### Evolve
MPL-2.0. Pure ES modules, about 102,000 lines. Ignore the built `evolve/` folder.
- data: cost is one function per resource taking an offset; farm lumber 20 × 1.36^n — `src/actions.js:1745 «'farm', offset, 20, 1.36»`
- unlock: `reqs` map of tech line to minimum level, with `grant` pair — `src/tech.js:1148 «reqs: { primitive: 3 }»`
- chain: factory recipes are per-tier rate arrays — `src/industry.js:120 «fur: [2,3,4,5,6]»`
- caps: crate adds 350 to a cap, 500 at container tech 2 — `src/resources.js:2645 «? 500 : 350»`
- tick: fast 250 ms, mid 1000 ms, long 5000 ms — `src/functions.js:156 «Math.floor(250 * modifier)»`
- offline: absence grants no goods; after 120 s it banks accelerated days lasting 2/3 of the absence, capped at 11520 days, then loops run faster — `src/functions.js:190 «2 / 3 * timeDiff»`
- catch-up: stalled worker ticks replay up to 12 days per call — `src/main.js:844 «webWorker.longRatio * 12»`
- save: JSON + LZString with about 90 inline version blocks — `src/vars.js:108 «convertVersion(global['version'])»`

Ideas: absence pays a capped speed boost, compact `reqs` + `grant` gates.

### Trimps.github.io
GPL-2. Pure JS, about 42,000 lines.
- data: scaling cost is [base, ratio]; hut food 125 and wood 75 at 1.24 — `config.js:11509 «food: [125, 1.24]»`
- caps: barn doubles food cap and costs 25% of the current cap — `config.js:11459 «calculatePercentageBuildingCost("Barn"»`
- job: farmer costs 5 food, gives 0.5 food/s — `config.js:11846 «modifier: 0.5»`
- cost: floor(base × ratio^(owned + added)) — `main.js:4709 «Math.pow(cost[1], (whatObj[compare]»`
- offline: after 5 min, replay at 10 ticks/s capped at 864000 ticks (24 h) — `main.js:2700 «maxTicks: 864000»`
- offline: batches self-tune to frame time, +50 under 100 ms, shrink over 200 ms — `main.js:2950 «loopTicks += 50»`
- offline: closed-form mode for overflow, in chunks over the elapsed time — `main.js:3186 «chunkPercent = 60000 / dif»`
- save: JSON + LZString with about 44 version blocks — `main.js:219 «LZString.compressToBase64(»`

Ideas: replay plus closed form for overflow; storage priced as percent of cap.

### AntimatterDimensionsSourceCode
MIT. 66,983 lines of JS plus Vue.
- offline 1: base tick 50 ms — `src/game.js:903 «Math.floor(seconds * 20)»`
- offline 2: tick never under 33 ms and never over 1e6 ticks — `src/core/storage/storage.js:87 «Math.floor(simulatedMs / 33), 1e6»`
- offline 3: default limit 1e5, so long absences use longer ticks — `src/core/player.js:798 «offlineTicks: 1e5»`
- offline 4: each tick = remaining seconds / remaining ticks, so speed-up or skip still spends all time exactly — `src/game.js:953 «remainingRealSeconds / i»`
- offline 5: short gaps always use exactly 50 ticks with no modal — `src/game.js:980 «let remaining = 50»`
- offline 6: long runs in 60 ms batches with progress — `src/game.js:992 «maxTime: 60»`
- save: marker + version + base64 of deflated JSON — `src/core/storage/serializer.js:43 «AntimatterDimensionsSavefileFormat»`
- save: numbered patches in sorted order, avoiding global accessors — `src/core/storage/migrations.js:1228 «this.patches[version]»`

Ideas: remaining-time / remaining-ticks stepping; export-string marker.

### civ-clicker
GPL-3. Pure JS, about 6,300 lines.
- data: `new Building({id, require, effectText})`; tent wood 2, skins 2, no growth field — `scripts/civclicker-data.js:122 «require: { wood: 2, skins: 2 }»`
- unlock: `prereqs` map from id to needed value — `scripts/civclicker-data.js:136 «prereqs: { masonry: true }»`
- unlock: check compares owned counts, with hard-coded special cases — `scripts/civclicker.js:412 «civData[i].owned < prereqObj[i]»`
- tick (reject): food minus living population, so upkeep can starve you — `scripts/civclicker.js:2332 «civData.food.net -= population.living»`
- tick: 1 Hz with no elapsed time, so nothing happens while closed — `scripts/civclicker.js:3340 «window.setInterval(gameLoop, 1000)»`
- save: LZString base64 — `scripts/civclicker.js:2135 «LZString.compressToBase64(savestring)»`
- save: compare version, refuse newer, field fixups for older — `scripts/civclicker.js:2051 «saveVersion.toNumber() < versionData»`

Ideas: generic prereq maps, but as a typed list.

### adarkroom
MPL-2.0. Pure JS with jQuery, about 15,900 lines.
- cost: function of owned count; trap wood = 10 + 10n, linear — `script/room.js:24 «'wood': 10 + (n * 10)»`
- unlock: button appears at half the wood cost if other ingredients were ever seen, and stays — `script/room.js:1088 «cost['wood'] * 0.5»`
- unlock: narrative staging as a builder state machine — `script/room.js:712 «game.builder.level»`
- income: dict of sources with delay and stores delta; gatherer 1 wood per 10 s — `script/outside.js:16 «delay: 10»`
- tick: 1 s collector decrements timeLeft; no offline — `script/state_manager.js:360 «income.timeLeft--»`
- income: pays atomically; if any input would go negative the payment is skipped — `script/state_manager.js:371 «have + cost[k] < 0»`
- events: every 3 to 6 min, each with an isAvailable predicate — `script/events.js:6 «_EVENT_TIME_RANGE: [3, 6]»`
- save: JSON, base64 export, chained upgrades — `script/engine.js:375 «Base64.encode(localStorage.gameState)»`

Ideas: `{delay, stores}` all-or-nothing payment, reveal through narrated thresholds.

### paperclips
No licence, a mirror of a proprietary game. Formulas noted as facts only.
- unlock: project has trigger(), cost(), effect(), uses, flag — `docs/projects.js:13 «return clipmakerLevel>=1»`
- unlock: a loop polls every trigger — `docs/main.js:189 «projects[i].trigger()»`
- cost: 1.1^level + 5 — `docs/main.js:1673 «Math.pow(1.1,clipmakerLevel)+5»`
- market: demand 0.8/margin × marketing — `docs/main.js:3356 «(.8/margin) * marketing»`
- market: wire price base + 6 × sin(counter), bumps on purchase — `docs/main.js:34 «6*(Math.sin(wirePriceCounter))»`
- tick: stacked intervals, counter-based, no offline — `docs/main.js:3598 «}, 10);»`
- save: flat globals, no migration — `docs/main.js:4026 «localStorage.setItem("saveGame"»`

Ideas: one market sine for a buy-low rhythm with no punishment.

### yet-another-idle-rpg
MIT. Pure ES modules, about 36,000 lines. Melvor-like analogue.
- skills: Farming base xp 40, max level 10 — `src/skills.js:1595 «xp_scaling: 1.6»`
- milestones: level-keyed rewards — `src/skills.js:1600 «max_stamina: {flat: 2}»`
- xp: geometric sum — `src/skills.js:146 «this.xp_scaling **»`
- recipes: tier maps of {material_id, count, result_id} — `src/crafting_recipes.js:423 «material_id: "Low quality iron ingot"»`
- recipes: success chance geometric across skill range — `src/crafting_recipes.js:67 «this.success_chance[0]*(»`
- market: sell price value × param/(param + sold), floor 0.1 — `src/market_saturation.js:174 «param/(param+how_many_sold)»`
- market: saturation recovers each game day — `src/main.js:5320 «trickle_market_saturations(»`
- save: JSON + btoa, no offline — `src/main.js:3695 «btoa(create_save())»`

Ideas: saturating sell prices that recover with time fit "absence only adds".

### progress-knight
Unlicense. Pure JS, about 1,320 lines.
- data: jobs dict of maxXp and income; Farmer 100/9 — `js/main.js:37 «"Farmer": {name: "Farmer", maxXp: 100»`
- cost: base × (level+1) × 1.01^level — `js/classes.js:14 «Math.pow(1.01, this.level)»`
- unlock: requirement classes with {task, requirement} — `js/main.js:1072 «{task: "Beggar", requirement: 10}»`
- unlock: completed requirements latch — `js/classes.js:119 «this.completed = true»`
- tick: 20 Hz, no offline — `js/main.js:314 «value * getGameSpeed() / updateSpeed»`
- save: base64 of JSON, no migration — `js/main.js:1038 «window.btoa(JSON.stringify(gameData))»`

Ideas: latching requirements.

### 1255-burgomaster
GPL-3. Pure JS. Nothing distinctive.
- tick: 30 s real-time turn — `js/config.js:3 «dcounter_def: 30»`
- tick: countdown runs calculateTurn; nothing offline — `js/game.js:4018 «game.calculateTurn()»`
- data: flat constants, 18×18 map — `js/config.js:22 «sizeMapX:18»`
- save: JSON with integer version 9 — `js/config.js:30 «glSaveVersion:9»`

Ideas: a visible turn countdown only.

### kirkmcdonald.github.io
Apache-2.0. Pure ES modules. Calculator, not a game.
- data: Factorio recipes array — `data/vanilla-2.0.55.json:3726 «"recipes": [ {»`
- data: energy_required, ingredients, results, category — `data/vanilla-2.0.55.json:3729 «"energy_required": 10»`
- solve: acyclic chains by recursive rate division — `solve.js:93 «rate.div(gives)»`
- solve: cycles go into a tableau — `solve.js:118 «[surplus items] [pseudo] [tax]»`
- solve: simplex over exact rationals — `solve.js:336 «simplex(A)»`

Ideas: recursive rate division for an "output per hour" display. Skip simplex.

## Town builders on the web

### Towngardia
MIT. TypeScript, about 35,500 lines. Real, deep, live game and the best slow idle-city reference. Its README claims 175 structures.
- time: long tick every 6 hours, short tick every 5 minutes, so 4 production ticks a day — `src/game/FundamentalConstants.ts:1 «const LONG_TICK_TIME = 6 * 60 * 60 * 1000»`
- catch-up: replay from stored timestamps, up to 4 long ticks per frame, no total cap — `src/game/GameState.ts:312 «longTickCount < 4»`
- catch-up: exact short ticks run before each long tick; saving is skipped until caught up — `src/game/GameState.ts:320 «save while fast-forwarding»`
- building: class per type; Farm is 3×3, picks one of 6 foods, 3 units per long tick — `src/game/BuildingTypes.ts:1636 «new foodType(0, 3)»`
- cost: Farm 40 flunds + 10 wood, as override methods — `src/game/BuildingTypes.ts:1667 «{ type: "flunds", amount: 40 }»`
- efficiency: minimum of upkeep × power × water × patronage, input coverage and damage; scales inputs and outputs — `src/game/Building.ts:444 «this.lastEfficiency = Math.min(»`
- storage: output buffer holds 5 days of production, which bounds absence — `src/game/ResourceTypes.ts:3 «const CAPACITY_MULTIPLIER = 5 * LONG_TICKS_PER_DAY»`
- collect: player taps an icon to move outputs to city stock; some resources auto-collect — `src/game/Building.ts:506 «transferResourcesFrom(this.outputResources»`
- placement: per-cell footprint flag masks, check and stamp are separate — `src/game/Building.ts:239 «if ((buildingTile & cityTile) === 0) return false;»`
- road: on placement gathers 1-tile neighbours and flood-fills road, power, water — `src/game/City.ts:982 «1, 1, true);»`
- unlock: tech rows with research cost and adoption rates — `src/game/TechTypes.ts:14 «{ type: 'research', amount: 10 }»`
- save: CITY_DATA_VERSION 9 with ordered steps on load — `src/game/City.ts:31 «const CITY_DATA_VERSION = 9»`

Ideas: timestamp plus capped per-frame replay, bounded output buffers, min-of-factors efficiency, tap-to-collect as a small daily joy.

### shapez.io
GPL-3. Pure source (ES modules with JSDoc), about 54,900 lines. Real shipped game with excellent structure.
- belt: base 2 items/s — `src/js/core/config.js:82 «beltSpeedItemsPerSecond: 2,»`
- miner: one fifth of belt speed, 0.4/s — `src/js/core/config.js:152 «beltSpeedItemsPerSecond / 5;»`
- processors: stacker 1/8, painter 1/6, mixer 1/5, cutter 1/4 of belt speed — `src/js/core/config.js:112 «stacker: 1 / 8,»`
- upgrades: first 7 tiers add +0.5, 0.5, 1, 1, 2, 1, 1 — `src/js/game/modes/regular.js:80 «[0.5, 0.5, 1, 1, 2, 1, 1]»`
- upgrade row: belt tier 4 costs 6000 of a two-layer shape — `src/js/game/modes/regular.js:119 «amount: 6000»`
- scaling: earlier tier shapes carry forward × 2.5 per tier — `src/js/game/modes/regular.js:271 «tier.amount * tierGrowth»`
- recipes: no table; a shape is a string key and buildings transform it — `src/js/game/shape_definition.js:140 «const sourceLayers = key.split(":");»`
- unlock: level row is shape, count, reward; rewards are queried from a set — `src/js/game/hub_goals.js:211 «return !!this.gainedRewards[reward];»`
- goals: freeplay rate grows 0.25 per level past 27, capped at 200/s — `src/js/game/hub_goals.js:255 «(this.level - 27) * 0.25»`
- tick: fixed steps consume a time budget in a while loop — `src/js/game/time/game_time.js:124 «while (this.logicTimeBudget >= effectiveDelta)»`
- offline: none; queued time is clamped and dropped — `src/js/game/time/game_time.js:104 «deltaMs * maxLogicSteps;»`
- save: version 1010, chained steps from 1000, one interface class per version — `src/js/savegame/savegame.js:122 «migrate1000to1001(data);»`

Ideas: tiers as plain data with fixed improvement arrays, one migration function per version.

### simcity-threejs-clone
MIT. Pure ES modules with three.js, about 3,500 lines. Tutorial-grade, no economy, closest to our stack.
- road rule: a building needs a road within 3 tiles — `src/scripts/config.js:30 «searchDistance: 3»`
- search: BFS over 4-neighbours bounded by distance — `src/scripts/sim/city.js:211 «if (distance > maxDistance) continue;»`
- growth: needs road access and power; construction 3 steps — `src/scripts/sim/buildings/modules/development.js:126 «zone.roadAccess.value &&»`
- rolls: 5% level-up per step to level 3 — `src/scripts/config.js:13 «levelUpChance: 0.05»`
- road mesh: 4 neighbours pick straight, corner, three-way or four-way — `src/scripts/sim/buildings/transportation/road.js:29 «if (top && bottom && left && right) {»`
- tick: simulate once per second; no save, no offline — `src/scripts/game.js:65 «setInterval(this.simulate.bind(this), 1000);»`
- picking: raycast the root; each node holds its sim object in userData — `src/scripts/game.js:221 «intersectObjects(this.city.root.children, true)»`
- render: per-tile cloned materials, no instancing — `src/scripts/assets/assetManager.js:56 «obj.material = obj.material.clone();»`

Ideas: module composition per building, userData back-pointers. Use instancing.

### 3d.city
GPL-3 with Micropolis extras. Pure in `src/micro` and `src/city3d`, about 18,000 own lines plus vendored three. Exclude `src/three`, `src/jsm`, `build/` from any analysis.
- origin: wraps micropolisJS — `README.md:12 «micropolisJS»`
- threading: sim in a Web Worker, render on main thread — `src/WorkerBridge.js:54 «new Worker(»`
- tick: simTick in a setTimeout loop — `src/micro/CityGame.js:181 «let up = this.simulation.simTick();»`
- merged geometry: per-layer buffers become one mesh per layer — `src/city3d/View.js:1095 «new THREE.Float32BufferAttribute( v , 3 ) );»`
- instancing: fire and power sprites — `src/city3d/Sprites.js:23 «new THREE.InstancedBufferAttribute(»`
- shader: ground patches MeshStandardMaterial chunks — `src/city3d/GroundShader.js:33 «include <map_fragment>»`
- picking: raycast land, round hit to tile — `src/city3d/View.js:1719 «Math.round( intersects[0].point.x )»`
- save: localStorage JSON with in-place migrate — `src/micro/Storage.js:42 «var from = savedGame.saveVersion || 0;»`

Ideas: per-layer merged tile geometry, economy tick in a worker.

### isocity
MIT. Pure, about 185 lines. Tile painter, no simulation.
- encoding: one byte per tile, row × 12 + col — `js/main.js:93 «map[i][j][0] * texWidth + map[i][j][1]»`
- save: base64 in the URL hash, pushed to history so back acts as undo — `js/main.js:98 «history.pushState(undefined, undefined,»`
- load: missing bytes default to tile 0 — `js/main.js:113 «const t = u8[c++] || 0»`
- size: 7×7, so 49 bytes — `js/main.js:36 «ntiles = 7»`
- picking: inverse isometric formula — `js/main.js:173 «x = Math.floor(_y - _x)»`
- draw: painter order — `js/main.js:163 «c.translate((y - x) * tileWidth / 2»`

Ideas: share an 8×8 village as a short URL-hash byte string.

### kingdomarchitect
KASAL-1.0, no derivatives. TypeScript, about 65,000 lines. Ideas only.
- crop: wheat yields 4 after 60 ticks; flax 80, straw 50 — `ts/src/data/crop/cropDefinitions.ts:41 «growthDuration: 60,»`
- crop tick: stores only plantedAtTick; readiness is a comparison — `ts/src/game/system/farmGrowthSystem.ts:17 «currentTick - farm.plantedAtTick >= growthDuration»`
- building: material map; windmill 20 wood, 40 stone, 2 gold, 10 frames, 4 gears — `ts/src/data/building/food/windmill.ts:21 «[stoneResource.id]: 40,»`
- jobs: union of records with claimedBy — `ts/src/game/job/job.ts:28 «claimedBy?: string;»`
- hunger: 0 to 100 at 1 Hz — `ts/src/game/system/hungerSystem.ts:11 «simulation runs at 1 Hz»`
- tick: 1000 ms, autosave every 10 ticks — `ts/src/server/gameServer.ts:112 «if (this.updateTick % 10 === 0) {»`
- adjacency: neighbour mask maps to one of 16 wall sprites — `ts/src/data/building/adjacency/wallAdjacency.ts:26 «case Adjacency.LeftRightUpperBottom:»`
- save: own doc says old saves break — `ts/src/server/persistence/README.md:39 «There is no migration path for saved games»`

Ideas: crop definitions apart from farm state, ready time derived from plantedAtTick.

### Koi
Commons Clause. Pure ES5, about 25,000 lines. Real Steam game. Ideas only.
- inheritance: parent order randomised 50/50 per child — `js/koi/fish/breeder/breeder.js:34 «const mixer = random.getFloat() < .5 ?»`
- genes: uint8 traits mixed through biased samplers — `js/koi/fish/breeder/mixers/mixerFishBody.js:21 «new SamplerPower(0, 1, 4);»`
- mutation: table of mother and father footprints, result, probability — `js/koi/fish/breeder/mutations/mutation.js:6 «@param {Number} probability»`
- look: pattern layers rendered to an atlas; genes as raw bytes — `js/koi/fish/fishBody.js:127 «buffer.writeUint8(this.length);»`
- save: binary buffer stringified per slot — `js/storage/storageLocal.js:26 «this.set(key, value.toString());»`
- sharing: encoded as a coloured card image with checksum — `js/koi/code/codeWriter.js:48 «const checksum = this.checksum(this.bytes);»`
- tick: fixed 14 Hz with interpolation — `js/koi/koi.js:65 «Koi.prototype.UPDATE_RATE = 1 / 14;»`

Ideas: a footprint-to-result mutation table for crop breeding, a shareable card code.

## Stacklands-like card games

All are prototypes. None has shown balance at scale. Use them for structure.

### tuntian
No licence. Pure JS, about 1,300 lines. Small, finished prototype, the cleanest of the group.
- config: 40 s day, 10 days to win, 6 cards per pile — `data.js:6 «DAY_MS: 40000»`
- recipe: in, keep, out, labor flag; villager + tree gives 2 wood — `data.js:49 «id: 'chop'»`
- crop: villager + farm gives 3 food, farm kept — `data.js:51 «out: { food: 3 }»`
- random output: alt list at equal odds — `data.js:53 «alt: [{ tree: 1 }, { stone: 1 }]»`
- match: multiset subset of the pile; extra cards allowed — `game.js:565 «if ((bag[id] || 0) < n)»`
- priority: most ingredients wins, ties to the earlier row — `game.js:568 «score > bestScore»`
- timer: flat 620 ms, a busy lock per pile — `game.js:635 «if (pile.busy) return false;»`
- worker: consumed, respawned tired, usable next day — `game.js:654 «worker.used = true;»`
- feeding (reject): each missing meal hits a random unit, 45% desertion — `game.js:796 «Math.random() < 0.45»`
- merge: over 6 cards shakes and is refused — `game.js:349 «merged.length > CONFIG.PILE_MAX»`
- economy: recruit pack 10 coins for 3 cards — `data.js:67 «cost: 10, n: 3»`
- offline: hidden tab pauses; no save — `game.js:776 «if (document.hidden»`

Ideas: `in / keep / out` with a labour flag and daily fatigue. This gives a daily-worker model with no timers, which fits "one more game then the village".

### CardSettler
No licence. Pure JS, all inline in one HTML file, about 5,767 lines. Follows Stacklands closely.
- recipe: berry_bush + villager gives berry in 4 s, both kept, repeats — `index.html:1129 «{i:['berry_bush','villager'],»`
- match: sorted exact multiset — `index.html:1737 «arrEq(types,[...r.i].sort())»`
- tools: keep list removed by type — `index.html:1777 «const keepQ=[...r.keep]»`
- timer: per-stack progress — `index.html:2268 «s.prog+=dt/s.recipe.t»`
- feeding: normal 50 s day, hard 38 s and 2 food per pop — `index.html:1236 «hard:  {moonDur:38»`
- pressure (reject): any shortfall at day end is game over — `index.html:2353 «showOverFamine»`
- merge: drop allowed only if the result can still become a recipe — `index.html:1954 «types.length<=10&&types.length>1»`
- save: flat JSON, no version — `index.html:1480 «setItem('stacklands_save'»`

Ideas: subset check while dragging plus exact match to start gives instant feedback on invalid stacks.

### stackcards
Apache-2.0. JSX, about 433 lines. Thin; the docs name files that do not exist.
- recipe: CSV row, two inputs, two outputs, seconds — `recipes.csv:2 «villager,berry_bush,berry,villager,5»`
- defect: wood + stone appears twice and first match wins, so farm is uncraftable — `recipes.csv:8 «wood,stone,farm,,15»`
- defect: wood + wood likewise shadows house — `recipes.csv:7 «wood,wood,house,,20»`
- match: exactly two cards, order-insensitive — `stacklands.jsx:24 «(r.a === b && r.b === a)»`
- stack: within 70% of card size — `stacklands.jsx:181 «CARD_W * 0.7»`
- timer: wall-clock end time — `stacklands.jsx:187 «recipe.time * 1000»`
- tool: output_b naming an input keeps it — `stacklands.jsx:222 «if (craft.recipe.out_b)»`
- tick: polled every 80 ms — `stacklands.jsx:245 «}, 80);»`
- gap: requires_building column is ignored by the parser — `stacklands.jsx:405 «parseInt(r.time_seconds || 5)»`
- unlock: finished quest adds a pack — `stacklands.jsx:270 «if (q.unlock_pack)»`
- pack: starter costs 30 gold for 3 cards — `assets.yaml:176 «cost: 30»`
- state: React useState only, no save — `stacklands.jsx:142 «useState(["humble_beginnings"])»`

Ideas: flat recipe table, but validate duplicate inputs at load. This repo shows why.

### stackworlds-clone
No licence. Python plus Rust. Thin and overclaiming.
- recipe: tuple of inputs, output, ticks; 3 wood + 1 stone gives house in 10 — `src/apps/crafting_recipes.py:24 «"house", 10)»`
- match: sorted exact multiset — `src/apps/crafting_recipes.py:41 «if sorted(inputs) == sorted_inputs:»`
- consumption: every card destroyed, no tools — `src/apps/stackworlds.py:742 «# Destroy all ingredient cards»`
- timer: absolute finish_tick — `src/apps/stackworlds.py:702 «current_tick + craft_time»`
- feeding: declared, read nowhere — `src/apps/stackworlds.py:196 «"food_timer": 60»`
- catch-up: batch tick capped at 10000 — `src/apps/stackworlds.py:290 «Cap at 10000 ticks»`
- save: SQLite WAL — `engine/db.py:43 «PRAGMA journal_mode = WAL»`
- UI: render is a stub — `src/apps/stackworlds.py:769 «Game UI not yet implemented»`

Ideas: absolute finish time makes offline a comparison.

### StartX
MIT. TypeScript (Cocos), about 5,900 lines. Real game with a spreadsheet data pipeline.
- recipe: inputs carry id, count, per-input consume flag, plus worker tags — `cocos/assets/scripts/GameModel.ts:13 «consume: boolean»`
- match: multiset at-least, then worker tags — `cocos/assets/scripts/GameModel.ts:365 «(counts[i.id] || 0) < i.count»`
- timer: elapsed scaled by stack capacity, so staff speed work but never duplicate output — `cocos/assets/scripts/GameModel.ts:522 «p.target.elapsed += dt»`
- nodes: non-consumed inputs still lose one use per completion — `cocos/assets/scripts/GameModel.ts:473 «--node.uses <= 0»`
- pressure (reject): 180 s month, unpaid salaries end the run — `cocos/assets/scripts/GameModel.ts:599 «this.gameOver = true;»`
- merge: height capped by board size — `cocos/assets/scripts/GameModel.ts:306 «(BOARD_HALF * 2 - 360) / CARD_OFFSET»`
- unlock: stage needs month, revenue, tasks — `cocos/assets/scripts/GameModel.ts:253 «stage.requiredTasks.every»`
- save: version 1, mismatch returns null, strict validator — `cocos/assets/scripts/ProgressSave.ts:10 «if (save.version !== 1»`

Ideas: consume flag per input, workers speed rather than multiply.

## Grids and wave function collapse

### hex-map-wfc
MIT. WebGPU (TSL). Real and polished, the best WFC reference. Everything visual needs a rewrite. Default DPR 2, 4096 shadows and half-res GTAO are not mid-phone settings, and the solve takes about 20 s by the author's account.
- tiles: edges per direction, weight; 30 types × 6 rotations × 5 levels = 900 states — `src/hexmap/HexTileData.js:19 «edges: { NE: 'grass', E: 'grass'»`
- adjacency: edges match by type and level, except grass joins at any level — `src/hexmap/HexWFCCore.js:127 «if (edgeTypeA === 'grass') return true»`
- entropy: log(count) + small noise, unweighted — `src/hexmap/HexWFCCore.js:184 «Math.log(this.possibilities.size)»`
- backtrack: delta trail, capped at 500 — `src/workers/wfc.worker.js:52 «this.maxBacktracks = 500»`
- restart: on the cap, full retry — `src/workers/wfc.worker.js:640 «Backtrack limit reached»`
- regions: 19 grids of radius 8, 217 cells each, 4,123 total — `docs/NOTES.md:84 «**217 cells per grid**»`
- recovery 1: unfix a conflicting border cell — `src/workers/wfc.worker.js:457 «unfixNeighbor(key, solveCells»`
- recovery 2: up to 5 local re-solves of a radius-2 patch — `src/hexmap/HexMap.js:464 «const maxLocalAttempts = 5»`
- recovery 3: drop a cell and hide the seam with a mountain — `src/hexmap/HexMap.js:687 «Place mountains on dropped cells»`
- claims: 60 fps desktop and mobile, not measured here — `README.md:15 «60fps on desktop and mobile»`
- mesh: 2 BatchedMesh per grid, one shared material, colour by palette texture — `src/hexmap/HexGrid.js:160 «new BatchedMesh(maxInstances»`
- colour: level blends two palette textures — `src/hexmap/HexMap.js:230 «mix(sampleA, sampleB, blendFactor)»`
- coast: no depth texture; 2048 ortho render dilated then box-blurred to a gradient — `src/hexmap/effects/WavesMask.js:115 «const blurRadius = 12»`
- water: sine bands on that gradient, broken by noise — `src/hexmap/effects/Water.js:105 «localDist.mul(this._waveCount)»`

Ideas: edge-string tile schema, trail backtracking, baked coast gradient in GLSL, palette single-material batching.

### wavefunctioncollapse
MIT. Faithful port of Gumin's algorithm. Square grid, no backtracking, bitmap output.
- rules: tiles + explicit neighbor pairs — `example/data/castle.definition.js:18 «left:"bridge 1", right:"river 1"»`
- symmetry: X/I/L/T classes expand rotations — `simple-tiled-model.js:73 «switch (currentTile.symmetry)»`
- weights: default 1 — `simple-tiled-model.js:178 «currentTile.weight || 1»`
- entropy: weighted Shannon, incremental — `model.js:293 «Math.log(sum)»`
- tie-break: 1e-6 noise — `model.js:102 «0.000001 * rng()»`
- contradiction: observe returns false; caller restarts — `model.js:97 «if (amount === 0) return false;»`
- scale: README example 48×48 — `README.md:39 «3, 48, 48, true, true, 4»`
- output: RGBA only — `simple-tiled-model.js:364 «this.weights[t] * lambda»`

### three-wfc
MIT. Work in progress. The "for three.js" description overclaims; it draws to 2D canvas. Has a bug where failure looks like success.
- sockets: 4 edges — `lib/constants.ts:1 «TILE_EDGES_COUNT = 4»`
- metadata: edges derived from image pixels — `lib/utils/annotateTiles2DEdges.ts:6 «sampling color + Sobel edge features»`
- weights: default 1 — `lib/WFCTile2D.ts:53 «weight = 1,»`
- entropy: typed-array min-heap — `lib/WFC2DBuffer.ts:269 «Math.log(sumOfWeights)»`
- noise: tie-break of 1e-5 — `lib/WFC2DBuffer.ts:35 «noise: number = 0.00001»`
- bug: collapseAll returns true when cells remain after a failure — `lib/WFC2DBuffer.ts:84 «return !this.entropyHeap.isEmpty();»`
- benchmark: 20×20 default, no recorded results — `live/src/performance.ts:7 «DEFAULT_GRID_SIZE = 20»`
- output: 2D context — `lib/WFC2D.ts:36 «getContext»`

### hexcastle
MIT. WebGL (three 0.169). Working game with a naive solver.
- rules: 6-element edge array — `src/Data/Configs/LandscapeTilesRulesConfig.ts:9 «edges: [ // 0 - 60 - 120 - 180»`
- weights: Grass 200, Water 5 — `src/Data/Configs/LandscapeTilesRulesConfig.ts:17 «weight: 200,»`
- variants: 6 rotations up front — `src/Scene/GameScene/CastleScene/Landscape/HexWFC.ts:296 «rotation < 6»`
- entropy: remaining count — `src/Scene/GameScene/CastleScene/Landscape/HexWFC.ts:442 «neighbor.entropy =»`
- contradiction: visible Error tile, generation continues — `src/Scene/GameScene/CastleScene/Landscape/HexWFC.ts:71 «this.placeErrorTile(hexTile);»`
- grid: radius 5 default — `src/Data/Configs/GameConfig.ts:10 «default: 5»`
- mesh: one InstancedMesh per tile type — `src/Scene/GameScene/CastleScene/HexTile/HexTileInstance.ts:129 «new THREE.InstancedMesh(geometry»`
- materials: Lambert, ambient 1.5 + directional 1.7, 2048 shadows; cheap — `src/Core/Materials/Materials.ts:37 «new THREE.MeshLambertMaterial({»`

Ideas: per-type instancing with Lambert, tile-reveal animation.

### ndwfc
MIT. Small, slow, not seedable. Its `expand()` idea is the point.
- rules: axis, tile a, tile b — `README.md:63 «['x',0,1],»`
- weights: flat array — `README.md:53 «var weights = [1, 1, 1]»`
- entropy: ±0.5 noise, recomputed every step — `ndwfc.js:209 «ent += (Math.random()-0.5)»`
- contradiction: reset wavefront from frozen cells — `ndwfc.js:203 «console.log»`
- chunks: results freeze, next expand grows around them — `ndwfc.js:217 «wave = this.readout();»`
- bug: fallback assigns x instead of y — `ndwfc.js:80 «if (x == undefined) {x = wave[q]}»`
- speed: scans the whole rule list per check — `ndwfc.js:48 «i < rules.length»`
- mesh: one Mesh per voxel — `ndwfc-tools.js:402 «new THREE.Mesh(geometry,material)»`

### irregular_grid
MIT. WebGL. Compact research sandbox with a real halfedge structure. Port the algorithm from its notes, not from its code paths.
- entry: radius, div, iter 50, relaxScl 0.1, seed — `grid/IrregularHexGrid.js:21 «static build( radius=3, div=3, iter=50»`
- merge order: seeded shuffle of edges — `grid/IrregularHexGrid.js:158 «edges.sort( ()=>rnd() - 0.5 );»`
- merge rule: only if both triangles are unassigned — `halfedge/ops/op_TriToQuadFromEdge.js:12 «aTri.face !== -1 || bTri.face !== -1»`
- leftovers: stay triangles — `grid/IrregularHexGrid.js:171 «op_TriToFace( top, he.tri );»`
- subdivide: quad to 4 quads — `halfedge/ops/op_AddQuadSubDivide.js:15 «op_AddQuadFace( top, a, ab, cp, da );»`
- subdivide: triangle to 3 quads, leaving all quads — `halfedge/ops/op_AddTriSubDivideFace.js:13 «op_AddQuadFace( top, cp, ca, a, ab );»`
- boundary: border vertices pinned, so patches tile — `grid/IrregularHexGrid.js:137 «top.vertices[ edg.aIdx ].userData»`
- relax: Stålberg's squaring force, rotating 90° per vertex — `_notes.txt:11 «force = (force .y,-force .x)}»`
- strength: forces × relaxScl per iteration, default 50 iterations at 0.1 — `grid/IrregularHexGrid.js:287 «vec3_scale( v, forces[ i ], relaxScl );»`
- deviation: force reset per iteration, not per face, so it leaks; use `_notes.txt` — `grid/IrregularHexGrid.js:295 «vec3_reset( force );»`
- bug: relax modes 1 to 3 reference `tthis` and throw — `grid/IrregularHexGrid.js:32 «tthis._relax_Centroid( final, iter )»`
- module map: normalise vertex to tile bounds, lerp between lattice corners; bilinear plus height on a flat footprint — `trilinear/TrilinearLatticeMaterial.js:37 «vec3 c0  = c00 * ( 1.0 - zd )»`
- winding: corners go in as 0,3,2,1 — `hex_tile_lerp.html:63 «pnts[0], pnts[3], pnts[2], pnts[1], 1»`
- cost: one Mesh and material per cell; bake on CPU instead — `hex_marchingcubes.html:287 «new THREE.Mesh( uTile.geo»`

Ideas: triangulate, seeded merge, subdivide, pinned relax, then bake bilinear deformation into batched geometry and recompute normals.

### hexagrid-relaxing
No licence. Algorithm reference only. Plain Laplacian, not Stålberg's force.
- input: side size, rng, search count — `src/hexagrid.js:3 «function Hexagrid (sideSize, rng»`
- merge: random until a miss limit — `src/hexagrid.js:79 «if (searchCount === this.searchIterationCount)»`
- bias: always the first adjacent — `src/hexagrid.js:87 «this.triangles[adjacents[0]]»`
- subdivide: midpoints via sorted-index key — `src/hexagrid.js:295 «Math.min(indexA, indexB)»`
- relax: full move to neighbour average — `src/hexagrid.js:238 «this.points[i][0] = sumX /»`
- weighted: weight by distance — `src/hexagrid.js:258 «let w = Math.sqrt(»`
- side: eases to radius 1 by 0.1 — `src/hexagrid.js:281 «(dx * distance) * 0.1»`
- demo: side 8, no iteration cap — `index.html:155 «sideCount: 8»`

### townsclipper
MIT text. Reverse-engineers the Townscaper share string. Says nothing about how it looks.
- alphabet: base64url-like with swapped characters — `lib/clip-bits.js:11 «uvxyzw0123456789_-»`
- bits: 6 per char, reversed, LSB-first — `lib/clip-bits.js:12 «BITS_PER_CHAR = 6»`
- header: three 5-bit field lengths — `lib/bits-dense.js:81 «BIT_LENGTH_BIT_LENGTH = 5»`
- origin: optional in offset binary — `lib/bits-dense.js:109 «bitReader.read(posBitLength)»`
- palette: up to 15 4-bit types — `lib/bits-dense.js:117 «bitReader.read(TYPE_COUNT_BIT_LENGTH)»`
- corners: 1-bit moved-x flag with delta — `lib/bits-dense.js:149 «Boolean(bitReader.read(»`
- voxels: bottom-up column, stop code, max 255 — `lib/bits-dense.js:184 «typeIndex - 1»`
- limit: irregular grid itself is not encoded — `README.md:212 «The grid is irregular»`

Ideas: palette + delta-sorted corners + stop-coded columns, keyed by a seed, for a short share string.

## Stylised rendering

### webgl-outlines
MIT. WebGL (three 0.143). Trustworthy tutorial. Thickness is fixed at 1 px.
- passes: depth target, outline pass, FXAA — `threejs/src/index.js:65 «composer.addPass(effectFXAA);»`
- depth: needs a DepthTexture — `threejs/src/index.js:36 «new THREE.DepthTexture()»`
- ID buffer: full-res half-float, no MSAA — `threejs/src/CustomOutlinePass.js:29 «THREE.HalfFloatType»`
- cost: second scene render with override material, doubling draw calls, plus 13 texture reads per pixel — `threejs/src/CustomOutlinePass.js:98 «renderer.render(this.renderScene»`
- surface IDs: connected components stored in vertex colours; overwrites them — `threejs/src/FindSurfaces.js:31 «colors.push(surfaceId, 0, 0, 1);»`
- encoding: id / maxSurfaceId in half-float — `threejs/src/FindSurfaces.js:165 «round(vColor.r) / maxSurfaceId»`
- bug: (0,1) sampled twice, (-1,0) never — `threejs/src/CustomOutlinePass.js:185 «getSurfaceValue(0, 1)»`
- thresholds: depthBias 0.9, depthMult 20, normalBias 1, normalMult 1 — `threejs/src/CustomOutlinePass.js:270 «new THREE.Vector4(0.9, 20, 1, 1)»`
- ID test: any nonzero difference is a full outline, which beats noisy normal thresholds on smooth models — `threejs/src/CustomOutlinePass.js:229 «surfaceValueDiff = 1.0;»`
- depth: linear 0 to 1, so depthMult must be retuned for our camera — `threejs/src/CustomOutlinePass.js:155 «viewZToOrthographicDepth»`
- gap: ID shader has no instanceMatrix or skinning, so our animals would be wrong until patched — `threejs/src/FindSurfaces.js:150 «projectionMatrix * modelViewMatrix»`
- prep: vertex welder for split-normal models — `vertex-welder/README.md:65 «renders much more efficiently»`

Ours, from three in `node_modules` (MIT):
- hull: extrudes along normals in clip space, default 0.003, handles skinning and morphs — `D:\chess\node_modules\three\examples\jsm\effects\OutlineEffect.js:71 «: 0.003»`
- hull cost: second BackSide pass per mesh, doubling draw calls, no render targets; silhouettes only — `D:\chess\node_modules\three\examples\jsm\effects\OutlineEffect.js:187 «side: BackSide»`

Ideas: hull for skinned animals; surface IDs only if static meshes need inner lines and only with a cheap pass.

### Three.js-Ocean-Scene
MIT. WebGL. Lightweight and readable. Realistic, not toy-like. No shoreline.
- normals: 2 scrolling normal maps — `shaders/OceanShaders.js:30 «_uv + VELOCITY_1 * _Time»`
- constants: strength 0.2 — `shaders/Settings.js:184 «NORMAL_MAP_STRENGTH = 0.2»`
- fresnel: pow2(1 - NdotV) — `shaders/OceanShaders.js:44 «pow2(1.0 - max(0.0, dot(»`
- colour: exponential absorption per channel — `shaders/Settings.js:192 «vec3(1.0) / vec3(10.0, 40.0, 100.0)»`
- fog: dithered to hide banding — `shaders/OceanShaders.js:50 «viewLen / FOG_DISTANCE + dither»`
- geometry: 2-triangle quad follows the camera — `scene/Ocean.js:71 «surface.position.set(camera.position.x»`
- renderer: plain WebGLRenderer — `scripts/Scene.js:10 «new WebGLRenderer()»`
- claim: designed for mobile — `README.md:2 «mainly designed for mobile»`

### stylized-water
MIT. WebGL (three 0.172, R3F). The closest match to our stack.
- foam: painted in the terrain shader as a stripe by world Y against water height; no depth texture — `src/components/Terrain/shaders/fragment.glsl:35 «smoothstep(currentWaterHeight + 0.01»`
- values: foam depth 0.05, water level 0.9, wave speed 1.2, amplitude 0.1 — `src/hooks/useStore.js:8 «foamDepth: 0.05»`
- wet sand: colour halves near water — `src/components/Terrain/shaders/fragment.glsl:18 «baseColor * 0.5»`
- seabed: blend by height — `src/components/Terrain/shaders/fragment.glsl:21 «smoothstep(min(uWaterLevel - 0.4, 0.2)»`
- grass band: smoothstep above water — `src/components/Terrain/shaders/fragment.glsl:25 «smoothstep(uWaterLevel + 0.8»`
- material: CustomShaderMaterial on MeshStandardMaterial — `src/components/Water/index.jsx:108 «baseMaterial={THREE.Mesh»`
- noise: 2D simplex twice per pixel — `src/components/Water/shaders/fragment.glsl:53 «csm_vUv * (textureSize * 2.8)»`
- foam spots: hard step on noise — `src/components/Water/shaders/fragment.glsl:58 «smoothstep(0.08, 0.001, colorBase)»`
- threshold: 0.6 pulsing ±0.01 — `src/components/Water/shaders/fragment.glsl:67 «0.6 + 0.01 * sin(uTime * 2.0)»`
- lines: 0.03-wide contour gives thin cartoon squiggles — `src/components/Water/shaders/fragment.glsl:68 «smoothstep(threshold + 0.03»`
- ramp: radial vignette, not depth — `src/components/Water/shaders/fragment.glsl:79 «smoothstep(0.1, 0.3, vec3(vignette))»`
- alpha: 0.2 near shore rising to 1 — `src/components/Water/shaders/fragment.glsl:93 «vignette + 0.5»`
- motion: whole plane bobs by one sine — `src/components/Water/shaders/vertex.glsl:13 «sin(uTime * uWaveSpeed)»`
- palette: saturated, needs muting under ACES — `src/components/Water/index.jsx:29 «#00fccd»`

Ideas: world-Y foam stripe via `onBeforeCompile`, tiling noise texture instead of per-pixel simplex, baked shore distance instead of the vignette.

### three-stylized-water
MIT. WebGPU (TSL). Careful and heavy. Not a mid-phone design.
- renderer: WebGPU — `src/main.ts:26 «new THREE.WebGPURenderer»`
- depth: requires a depth texture; mask is exp(-(height diff)/D) — `src/water/nodes/depth.ts:48 «vertical.negate().div(u.Water_Depth)»`
- colour: D 0.3 — `src/water/uniforms.ts:38 «Water_Depth: f(0.3)»`
- edge foam: depth band dissolved by panned noise — `src/water/nodes/intersection.ts:60 «smoothMask(float(0.1)»`
- shoreline: fract(depth - speed × 0.1 × t) × amount — `src/water/nodes/shoreline.ts:23 «depth.sub(u.SL_Speed.mul(0.1).mul(t))»`
- waves: 2 Gerstner, length 3 and 5 — `src/water/uniforms.ts:139 «Wave1_Length: f(3)»`
- cost: planar reflector and probes in presets — `src/water/nodes/reflection.ts:117 «const refl: any = reflector({»`
- budget: 4M pixel cap — `src/rendering/renderResolution.ts:2 «MAX_RENDER_PIXELS = 4_000_000»`

Ideas: the exp mask and fract shore band in GLSL, driven by a baked distance texture.

### threejs-grass-water-shaders
MIT. WebGL (three 0.170). Usable. The README undercounts: 44/0.18 gives about 59,000 tufts, about 1.4M triangles (derived), and its "<1 ms" is a desktop figure.
- count: the README's own figure — `README.md:101 «~30k blades over a 44»`
- wind: 2 hash octaves, tip-weighted — `src/grass/grassShader.glsl.ts:89 «* 0.0735 * windStrength»`
- colour: root × 0.78 to tip — `src/grass/grassShader.glsl.ts:184 «mix(vBladeColor * 0.78, tipColor, tip)»`
- LOD: none, culling off — `src/grass/GrassField.ts:139 «this.mesh.frustumCulled = false»`
- water normals: 4 octaves from a procedural LUT, no asset — `src/water/waterShader.glsl.ts:120 «scales[0] = 2.0»`
- shore: painted mask plus noise, no depth texture — `src/water/waterShader.glsl.ts:230 «vMaskValue + edgeNoise - 0.04»`
- foam: up to 48 discs per pixel, heavy on phones — `src/water/waterShader.glsl.ts:208 «MAX_FOAM_SOURCES»`
- portability: float mask with linear filtering, missing on many phones; use 8-bit — `src/water/WaterMask.ts:26 «THREE.FloatType»`

Ideas: procedural LUT normals, painted mask with noise edge.

### three-stylized
MIT. WebGL (three 0.185, WebGLRenderer + ACES). Same pipeline shape as ours. Best grass to port.
- count: area × density 40/unit², so 16,000 on 20×20 (derived) — `src/grass/GrassLayer.ts:432 «layout.coveredArea * this.normalized»`
- wind: two crossing sines, no texture — `src/grass/shaders.ts:27 «uTime * uWindSpeed»`
- colour: root to tip gradient — `src/grass/shaders.ts:96 «mix(uGrassBottom, uGrassTop, gradient)»`
- lighting: diffuse flattened to world up — `src/grass/shaders.ts:98 «Flattening diffuse lighting»`
- placement: blades align to sampled surface normal, works on any mesh — `src/grass/GrassLayer.ts:457 «rotation.setFromUnitVectors(»`
- backlight: view-to-sun^3 × edge-on × tip — `src/grass/shaders.ts:107 «viewToSun * edgeOn * thinTip»`
- shadows: receive floor 0.58 — `src/grass/shaders.ts:123 «mix(0.58, 1.0, shadow)»`
- LOD: none — `src/grass/GrassLayer.ts:445 «mesh.frustumCulled = false»`

Ideas: sine wind, up-flattened lighting, backlight term, sampled on selected tiles at low density.

### folio-2025
MIT code. WebGPU (TSL). Excellent art direction with real mobile tiers. Check asset rights separately.
- API: WebGPURenderer; can fall back to a WebGL2 backend but not WebGLRenderer — `sources/Game/Rendering.js:40 «new THREE.WebGPURenderer({»`
- shading: no toon ramp; soft terminator by smoothstep of N·L — `sources/Game/Materials/MeshDefaultMaterial.js:105 «smoothstep(this.game.lighting»`
- shadows: core and cast merged, mixed to base × a time-of-day shadow colour, so tinted, not black; maps 2048 desktop, 512 mobile — `sources/Game/Materials/MeshDefaultMaterial.js:117 «baseColor.rgb.mul(this.game.lighting»`
- fog: range fog whose colour is the background radial gradient, so objects melt into the sky — `sources/Game/Fog.js:22 «rangeFogFactor(this.near, this.far)»`
- wind: 2 Perlin scrolls — `sources/Game/Wind.js:35 «texture(this.game.noises.perlin, noiseUv1)»`
- grass: 280² single-triangle blades wrapped around the camera — `sources/Game/World/Grass.js:12 «this.subdivisions = 280»`
- foliage: alpha planes on a sphere, normals lerped 85% to sphere normal for soft blobs — `sources/Game/World/Foliage.js:72 «position.lerp(normal, 0.85)»`
- water: hard step at 0.17 on a terrain texture channel for the shore — `sources/Game/World/WaterSurface.js:226 «const shoreEdge = uniform(0.17)»`

Ideas: tinted shadows with soft terminator, background-matched fog, sphere-lerped foliage normals.

## REA targets

These three are the most useful pure JavaScript targets. All are plain unbundled source, so REA adds data-flow tracing rather than recovery; for simple reading, the citations above are enough. Use `mcp__rea__analyze_javascript_application` with `format: "directory"`, `detail: "summary"` and the listed `source_paths`. It parses without executing. Treat everything it returns as untrusted target content.

| Rank | `input_path` | `source_paths` | Why | What to trace |
| ---: | :--- | :--- | :--- | :--- |
| 1 | `D:\tmp\oss-town\etherealfarm` | `game.js`, `data.js`, `state.js`, `save.js` | Adjacency plus event-driven offline, no build step, globals only. GPL-3 | Backward from property `prevtime`, and from `nextEventTime`: what can shorten a jump, and which values stay constant inside one |
| 2 | `D:\tmp\oss-town\kittensgame` | `game.js`, `core.js`, `js/buildings.js`, `js/resources.js`, `js/time.js`, `js/calendar.js` | Data-driven effects into closed-form offline. Skip `lib/`. WET PAWS: read and learn, no derivatives | Forward from property `perTickCached`; how effect keys become rates and caps |
| 3 | `D:\tmp\oss-town\Evolve` | `src/main.js`, `src/functions.js`, `src/actions.js`, `src/tech.js`, `src/vars.js` | Large ES-module game with `reqs` gating and capped accelerated time. Skip the built `evolve/` folder and `lib/`. MPL-2.0 | Property `at` (in `global.settings`) and `timeAccelerationFactor`; property `reqs` into availability checks |

Alternates: `D:\tmp\oss-town\simcity-threejs-clone` (MIT, three.js, 3,500 lines, the easiest first run) and `D:\tmp\oss-town\shapez.io` (GPL-3, 54,900 lines, use `src/js/game` and `src/js/savegame`). gooboo would rank high, but with 210 `.vue` files it is not pure JS. If you want it anyway, select `src/js/tick.js`, `src/js/modules/farm.js`, `src/store/farm.js` and `src/store/upgrade.js`.

## Reusable structures for us

Everything here is new text written for WILD CROWN from the ideas above. No code was copied. All numbers are placeholders to be set by playtest. The plan's bans still hold: no loot boxes, no raids, no decay, no login pressure, nothing that changes chess. Cards may gate and shape the village only.

Current state to build on: `src/village/economy.js` has 4 buildings with flat cost and time, one builder, a single-currency `coins` field and `tickVillage(v, rivals, now)` called on open and on an interval. `sanitizeVillage` replaces anything that is not `v: 1` with a new village.

### 1. Data schema for buildings and recipes

One file of plain data, validated at load. Goods and recipes are separate tables so one building can run several recipes.

```js
export const GOODS = {
  acorn: { ko: '도토리', en: 'Acorn', cap: null },   // earned from chess only
  wheat: { ko: '밀', en: 'Wheat', sell: 2 },
  flour: { ko: '밀가루', en: 'Flour', sell: 6 },
  bread: { ko: '빵', en: 'Bread', sell: 16 }
};

export const BUILDINGS = {
  field: {
    ko: '밭', en: 'Field', tier: 1,
    cost: { acorn: 20 }, ratio: 1.15,          // price = base * ratio^owned, never stored
    buildMs: 1 * MIN,
    on: ['grass'],                             // placement masks
    recipes: ['wheat'],
    store: 12,                                 // output buffer, the only absence cap
    aura: null,
    needs: []                                  // typed list, see below
  },
  mill: {
    ko: '방앗간', en: 'Mill', tier: 2,
    cost: { acorn: 60, wheat: 5 }, ratio: 1.4,
    buildMs: 30 * MIN,
    on: ['grass', 'path'],
    recipes: ['flour'],
    store: 8,
    aura: { shape: 'king', bonus: { wheat: 0.25 } },
    needs: [{ kind: 'built', id: 'field', n: 2 }, { kind: 'card', id: 'panda_rare' }]
  }
};

export const RECIPES = {
  wheat: { in: {}, out: { wheat: 4 }, ms: 60 * MIN, overgrow: 1.5 },
  flour: { in: { wheat: 2 }, out: { flour: 1 }, ms: 10 * MIN, stopAt: 20 }
};
```

Rules, each with its source:

- **Price from count, not stored:** Kittens, Trimps. `ratio` keeps early buildings cheap.
- **`in / out`, with kept things implied by the building:** the card clones converge on this. If the village becomes card-stacking, add `keep: []` and a per-input consume flag (StartX).
- **`needs` is a typed list:** `{ kind: 'built' | 'card' | 'games' | 'sold' | 'tier', id, n }`. Use `some`/`every` in one function. No closures in data, so the shop can print each condition (freeciv `reqs`, Evolve `reqs`, gooboo). Once met, it latches in `v.unlocked` (progress-knight), so nothing re-locks.
- **`stopAt`:** stop a producer once global stock reaches a target (Widelands). This replaces all waste logic.
- **`store` as the only absence bound:** Towngardia, Mindustry.
- **Validate at load, in a test:** no two recipes with the same inputs in one building (stackcards shows the failure), no unknown ids, no cycle in the recipe graph unless declared.
- **Derived prices:** `sell` can start as a formula over chain depth and time (farmhand) so a new good needs one number, not a tuned row.
- **Selling price:** optional saturation that recovers with time (yet-another-idle-rpg), so rest helps. No random crashes.

Save: move to `v: 2` with ordered migration functions, one per version, each small and pure (shapez, Antimatter). A `v: 2` must not ship without this step, because today's `sanitizeVillage` would wipe `v: 1` villages on the way in or out.

### 2. Tick with offline catch-up

One function for live play and absence, using absolute times. Only completions change state, so the loop jumps from event to event (Ethereal Farm), and stored times make most checks a comparison (kingdomarchitect, stackworlds). A producer starts only if it has its inputs and room in `store`. So with an acyclic recipe graph, the event count is bounded with no separate time cap.

```js
// v.clock is the last simulated time. Each producer: { kind, sq, recipe, doneAt: ms | null, stock: {} }.
export function advance(v, now, defs) {
  if (now <= v.clock) return [];                 // a clock moved backwards never takes anything
  const report = [];
  for (let i = 0; i < MAX_EVENTS; i += 1) {
    startIdleProducers(v, defs, v.clock);        // needs inputs and room; sets doneAt = clock + ms / speed(p)
    const e = nextEvent(v, now);                 // earliest doneAt or queued build done, if <= now
    if (!e) break;
    v.clock = e.at;
    applyEvent(e, v, defs, report);              // pay into stock, or finish the build and refresh auras
  }
  v.clock = now;
  return report;
}
```

Details:

- **Fixed order:** sort producers by chain depth, then square, so results do not depend on array order.
- **Test the invariant:** `advance(a, c)` must equal `advance(a, b)` then `advance(b, c)`. This one property test catches most offline bugs.
- **Builds are events:** a queued building can finish while the player is away and change auras. It goes through the loop like any completion, so later cycles get the new speed. A running cycle keeps the speed it started with.
- **Inputs:** a producer draws from `v.goods`, then from other buildings' `stock`, so a mill keeps working while the player is away. This is the "no routing" choice (Lincity-NG's market radius is the same idea at larger scale).
- **Crops wait for a tap:** a crop with `overgrow` is not an event. It records `plantedAt` and pays on tap (kingdomarchitect). Yield × `min(overgrow, 1 + (elapsed - ms) / ms)` gives a capped bonus for leaving it longer (gooboo uses stages; use those if a curve is wanted). Crops never rot. So tapping starts a chain and absence finishes it, which suits "one more game, then the village".
- **Tap to collect:** finished goods in `stock` move to `v.goods` on a tap (Towngardia), so returning has something to do. Autocollect can be a later upgrade.
- **Return card:** snapshot before `advance` and diff after (gooboo), not by threading counters through the logic. Our plan's "card on return" already expects one summary.
- **Guard rails:** run under `MAX_EVENTS`, and if it is ever reached log it and clamp, since the buffers should make that impossible. Do not save mid-catch-up (Towngardia). Clock tampering only ever yields full buffers, which is acceptable for a solo game.
- **Do not add:** random events during absence. If visitors happen, use expected counts paid once (Kittens). Our `tickVillage` already pays at most one lump per rival on return.

### 3. Adjacency bonus

Our map is 8×8 chess squares, which gives a shape system no surveyed game has: **an aura follows its chess piece's move.** This is a proposal, untested. The shapes themselves exist elsewhere: gooboo has row, column and diagonal-quadrant tools, Ethereal Farm has orthogonal neighbours, farmhand has squares.

| Aura shape | Squares | Reference |
| :--- | :--- | :--- |
| `king` | 8 around | gooboo pinwheel, farmhand sprinkler r=1 |
| `rook` | same row and column, stops at a building | gooboo sprinkler and lectern |
| `bishop` | diagonals, stops at a building | gooboo flag, as quadrants |
| `knight` | L jumps | ours |
| `pawn` | 2 forward diagonals | ours |

The player already knows these shapes, so the tooltip is nearly free, and a slot's animal can lend its own shape. Rules:

```js
export function auraBonus(built, defs) {
  const bonus = {};                                       // sq -> { good: sum }
  for (const b of orderedByDepth(built)) {                // fixed order, never array order
    const a = defs[b.kind].aura;
    if (!a) continue;
    for (const sq of squaresOf(a.shape, b.sq, built)) {
      const slot = (bonus[sq] ||= {});
      for (const [good, n] of Object.entries(a.bonus)) slot[good] = (slot[good] || 0) + n;
    }
  }
  return bonus;
}
// speed(p) = 1 + Math.min(AURA_CAP, sum of bonus[p.sq] for the recipe's output)
```

- **Sum within a kind, multiply across kinds:** Ethereal Farm. Stacking the same aura stays linear, and mixing kinds rewards variety.
- **Hard cap:** OpenRCT2 stops at 47 items and Unknown Horizons at 8 fields. Set `AURA_CAP` so the best layout is reachable and legible.
- **Two passes only at first:** boosters then producers. Boosters of boosters (Ethereal Farm's bees) are a good late unlock.
- **Positive only:** no nettles, no bad neighbours. Julius and Ethereal Farm use penalties. A nuisance rule is the one idea here that needs a playtest before adding, since a child rearranging buildings should not feel punished.
- **Decor score for visitors:** per-card `{ value, range }` rings summed at a square (Julius), capped (OpenRCT2). Keep this separate from production and feed it to rival visits and animal thought bubbles.
- **Stable under mirroring:** test that mirroring a layout gives the same totals (Ethereal Farm notes this), except for `pawn`, whose direction is deliberate.
- **Show it:** highlight affected squares during placement, so the shape teaches itself.

### 4. Stylised rendering recipe for three.js

WebGL, mid phones, in `VillageView`'s own scene. It currently uses `MeshStandardMaterial`, a hemisphere and sun light, and shadow maps, with no tone mapping set (the chess engine uses ACES at 1.24). Steps are in order of value for cost. Measure each on a real phone. Nothing here has been tested on our scene.

1. **Palette texture, one material.** A small colour atlas with UVs per part (hex-map-wfc). Same material for every prop means instancing and batching work, and a mood change is a texture swap. Decide tone mapping first and author the palette under that setting. ACES shifts saturated colours, and the village and chess engine differ today.
2. **Tinted shadows and soft terminator.** In `onBeforeCompile` on a Lambert base: a smoothstep across N·L from about 1 down to -0.25, shadow mixed to base × warm shadow colour, never black (folio-2025). This is most of the toy look and costs almost nothing. Prefer this to a `MeshToonMaterial` ramp, which folio avoids and hexcastle does not need.
3. **Shape, not detail.** Rounded primitives already suit us (`makeBuilding`). Add a slight height gradient per object via vertex colour (freeciv-web) and foliage normals lerped 85% toward a sphere (folio-2025) so trees read as soft blobs.
4. **Fog matched to background.** Range fog whose colour equals the background gradient, so the plot's edges melt away (folio-2025). Add dithering if banding shows (Ocean Scene). Hides the board edge for free.
5. **Irregular grid, scaled down.** Skip full WFC for 8×8. Keep 64 logical squares and move only the visual lattice: 9×9 points, seeded jitter on interior points, then 20 to 50 iterations of the squaring force at 0.1 with the border pinned (`irregular_grid/_notes.txt`). Bake bilinear deformation of each building, path and tile into its geometry at load and recompute normals. The per-cell material route costs one draw call per cell. Picking stays on logical squares. Hex patches and triangle merging are only needed if the map grows past the board. Note the hero's route walking must follow the deformed centres.
6. **Water without a depth texture.** Bake a shore-distance texture once per layout (hex-map-wfc's dilate plus blur, or simply a painted mask). In GLSL use sine bands on that distance, a world-Y foam stripe on shore tiles (`stylized-water`), a tiling noise texture instead of per-pixel simplex, and an 8-bit mask (not float, see `threejs-grass-water-shaders`). Reasonable first target: the fountain and one pond.
7. **Grass near tiles only.** Instanced tufts at low density on grass squares, two crossing sines for wind, lighting flattened to up, tip gradient, optional backlight (`three-stylized`). Start at a few thousand blades. None of the surveyed grass ships LOD, so size by count rather than by distance.
8. **Outlines last and selectively.** Inverted hull on animals and the selected building, starting near `OutlineEffect`'s 0.003. It handles skinning and needs no render target, but it doubles those draw calls. Surface-ID post needs a second scene pass, has no skinning or instancing support as written, and is not a phone default.
9. **Batching.** One `InstancedMesh` per prop type (hexcastle), or `BatchedMesh` once several types share the palette material (hex-map-wfc). Our scene has few objects today, so do this when building count grows.
10. **Budget.** DPR cap (already 2, consider 1.5 on phones), shadow map 512 to 1024 on phones (folio uses 512), no AO or DOF on phones (folio's tiers), render on demand when nothing moves. `shadowMap.autoUpdate = false` is already the chess engine's pattern.

WFC is worth revisiting only for generated outer scenery around the board. If so, use the edge-string schema with a seeded solver, trail backtracking, and a safe fallback tile (hex-map-wfc), not the plain ports.

### Suggested order

1. Data tables, `needs`, `advance`, the split-invariance test and the `v: 2` migration, with 3 goods and one chain.
2. Tap to collect and a save-diff return card.
3. Chess-shaped auras with placement highlight. This is the feature to test with people first.
4. Render steps 1, 2, 4. Then 5 if the game feels too grid-like.
