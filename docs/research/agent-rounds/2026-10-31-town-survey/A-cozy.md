# A. Cozy builders: how they work, why people stop, what WILD CROWN should take

Survey date 2026-10-31. Scope: Townscaper, Tiny Glade, Town to City, Township (mandatory), plus Islanders, Dorfromantik, Hay Day, Animal Crossing New Horizons, Stardew Valley, Neko Atsume, Pocket Camp, Tiny Tower, Fabledom, Kainga.
Read first: [capture card plan](../../../plans/2026-10-31-capture-card-plan.md), [crown village plan](../../../plans/2026-10-30-crown-village-plan.md). `src/VillageView.tsx` was also checked for the current art setup.

None of these games was played for this survey. Everything comes from sources below or is marked as my inference.

## How to read this

| Mark | Meaning |
| :--- | :--- |
| [official] | Developer's own talk, statement, store page or app listing |
| [wiki] | Wikipedia or a community wiki |
| [review] | Press review, press report or industry analysis |
| [fan] | Player post: Steam review, Reddit, Korean community, blog |
| [unverified] | Seen only in a search snippet, a single weak source, or my memory |
| **Inference** | My reasoning, not a sourced fact |

Quotes: this file paraphrases and uses one direct quote only. Steam reviews are cited by dump ID, such as `Top4` or `Mos12`, inside each game's section, so the exact wording can be read in [steam-dumps-A/](steam-dumps-A/). `Top` numbering restarts in the Korean section of each dump, so "Korean `Top5`" and `Top5` are different reviews. Dump files hold raw review text for local research; do not republish them.

**Limits of the Steam numbers.** "Hours" are medians of a small sample of reviews, taken from whoever wrote one, at the time of writing. Top-rated samples skew towards fans. They are not retention. They only suggest an order of magnitude.

## 1. Sources: what was reached and what was not

| Source | Result | Note |
| :--- | :--- | :--- |
| Steam store and community hub | Reached | 1,084 reviews in 9 dumps. Cursor paging through `/homecontent/` now works, which removes the 10-per-filter limit in the old note. Script: [steam_dump_cozy.py](steam_dump_cozy.py). The blocked `appreviews` API was not retested |
| Fabledom store page | **Failed** | Returned a Steam "Site Error", so tags and the review aggregate are missing. Reviews themselves were dumped |
| Reddit | Partly reached | WebFetch blocked, old.reddit needs login. `www.reddit.com` comment search worked without login in the browser. Relevance is poor. Searches in r/Townscaper, r/TinyGlade, r/TownToCity and r/cozygames (goal or burnout queries) returned no comments, and the Tiny Tower and Dorfromantik all-site queries returned nothing |
| X | **Not reached** | Login wall. I did not attempt login. Only a few posts surfaced through web search |
| Threads | Reached, nearly useless | Search works in the logged-in browser, but results were mostly unrelated. One relevant line about Townscaper's two-button control. Nothing cited below rests on it |
| Naver | Partly reached | Blog search pages work in the browser. Only result snippets were read, not post bodies. Cafes not opened. Naver's AI briefing text was ignored |
| DCinside | Partly reached | Title and snippet level only |
| Ruliweb | Reached, thin | Few and old hits |
| Inven | **Not reached** | Webzine search paths gave 404 or an empty result inside the portal page |
| GDC Vault | **Listing only** | Found Tahkokallio's Hay Day economy talk, did not watch it. No GDC talk on these games was actually consumed |
| Other conference talks | Reached | Auto-captions read in full for Stålberg 2019, Stålberg 2021 and Stachowiak 2024. Captions contain errors, so garbled numbers were dropped |
| Stardew wiki | **Blocked** (403) | Bundle counts come from a guide site instead |
| Wikipedia, Town to City | **Failed** (404 on fetch) | Search snippet only |
| PC Gamer interview with Stålberg | **Truncated** | Headline only |
| Mobile store reviews | Not attempted | App Store and Play reviews were not mined |
| Not on Steam | n/a | Township, Hay Day, ACNH, Pocket Camp, Neko Atsume and Tiny Tower have no dump, so their player evidence is thinner |
| Public retention figures | **Almost none** | The only number found is Hay Day's DAU/MAU of about 55%, a 2013 third-party estimate. No D1, D7 or D30 for any title |

## 2. Bottom line

1. The most repeated request across unrelated games is **life**: people, animals, workers doing something. WILD CROWN already has rigged, animated animals, while Townscaper and Tiny Glade have no residents who live in what you build. This is the cheapest large gain available.
2. Cozy builders fail in two opposite ways. Toys run out of reasons (Townscaper, Tiny Glade). Timer games turn into chores or money pressure (Township, Pocket Camp, late Hay Day). The best-reviewed middle ground gives mild goals with no punishment (Town to City, Stardew, Dorfromantik's quests).
3. The match is a natural heartbeat, so the village does not need clock timers. **Inference**, untested.
4. Take Dorfromantik's cheap art system and Townscaper's water and transition ideas. Do not copy Townscaper's tile count or Tiny Glade's renderer.

Recommended direction is in section 6.

## 3. Comparison

"Review hours" = median hours in top-rated English / most-recent English / top-rated Korean samples. Fabledom's and Kainga's Korean samples are only 3 and 4 reviews. Islanders: New Shores, not shown, is 21 / 25 / 19 with 96% of 1,252.

| Game | One action | Goal shape | Review hours | Review aggregate | Main reason to stop |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Townscaper | Click adds or removes one block; algorithm decides the building | None | 6 / 6 / 1.6 | 95% of 10,637 | Nothing motivates; town feels empty |
| Tiny Glade | Drag a wall or building; it assembles itself | None; soft daily theme | 10 / 10 / 6 | 97% of 14,053 | Runs out of ideas and items |
| Town to City | Place freely, off grid; decorate to pixel level | Population tiers, gentle needs | 18 / 29 / 22 | 97% of 4,270 | Late-game performance, urban phase |
| Township | Tap to plant, harvest, collect, send | Endless levels, orders, events | n/a | n/a | Monetisation, match-3 walls |
| Islanders | Pick one building, see score preview, commit | Score thresholds, run ends | 9 / 8 / 5 | 95% of 10,228 | Shallow, or score tension not relaxing |
| Dorfromantik | Draw one hex tile, rotate, place | Survive tile stack, quests, unlocks | 41 / 16 / 10 | 96% of 15,828 | Random tiles, optimising kills calm |
| Hay Day | Swipe to harvest, tap to collect | Levels, orders, neighbourhood | n/a | n/a | Storage, pass pricing, long-term fatigue |
| ACNH | Walk and act in real time | Island stars, then self-set | n/a | n/a | Island finished, routine fades |
| Stardew | Act within a day with stamina | Bundles, relationships, self-set | 238 / 43 / 167 | 98% of 396,550 | Grind habit, restarting |
| Neko Atsume | Place food and goods, leave, return | Collect cats and mementos | n/a | n/a | Album done; repairs in the sequel |
| Pocket Camp | Fulfil animal requests, craft, wait | Events, friendship | n/a | n/a | Timed events, subscription |
| Tiny Tower | Tap to stock, ride elevator, build floor | Taller tower | n/a | n/a | Thin evidence |
| Fabledom | Place buildings, manage seasons | Linear tech, kingdom | 18 / 15 / 18 | Unavailable | Thin content, bugs |
| Kainga | Direct a leader, choose techs | 30 to 90 minute challenge runs | 37 / 35 / 86 | 74% of 645 | Bugs, poor unit control, RNG |

## 4. Mandatory titles

### Townscaper (Oskar Stålberg, 2021 full release, $5.99)

**One click.** Left click adds a block, right click removes it, and a colour palette sets its colour. That is the entire input [review](https://www.gamedeveloper.com/game-platforms/how-townscaper-works-a-story-four-games-in-the-making), [fan](steam-dumps-A/townscaper.md) `Top28`. The player owns large shapes and the system owns small details. Stålberg calls the result what would normally be a level design tool, turned into a game with extra juice [official](https://www.youtube.com/watch?v=Uxeo9c-PX-w).

**How the look is achieved** [official](https://www.youtube.com/watch?v=1hqt8JkYRdI), [official](https://www.youtube.com/watch?v=Uxeo9c-PX-w):

- **Grid.** Triangles inside a hexagon, some randomly merged into quads, everything subdivided into quads, then relaxed towards squares. Patches are relaxed in clusters of three and interpolated so the grid can continue indefinitely. Coordinates are integer hex coordinates to avoid float errors.
- **Dual grid.** Players see a grid with triangles, pentagons and hexagons. Tiles sit on the dual grid, which is all quads, so square-authored modules just skew into place.
- **Why dual.** Interesting visuals live at transitions. Placing tiles on corners gives transitions the most room and needs far fewer pieces than a three-by-three neighbour scheme.
- **Modules.** About 200 tiles in 2019, with 300 to 400 expected; a later report says a re-skin would need around 500 [review](https://www.gamedeveloper.com/game-platforms/how-townscaper-works-a-story-four-games-in-the-making). Colour meetings multiply the count, because each colour boundary gets its own trim or drainpipe treatment.
- **Selection.** Marching cubes picks shape from corner occupancy. Wave function collapse then picks among valid variants, re-solving only the connected structure. The player can keep clicking while it resolves. It can fail silently, and long thin structures are its weak spot.
- **Windows and doors.** Not in the tiles. A prop system places them, and a stencil trick fakes the hole. They slide into place, which adds a lively feel.
- **Line and texture.** Roof lines stay one pixel thin at any zoom, which gives a drawn look. Bricks are very subtle, which hides seams.
- **Water.** A flipped copy of the mesh with a wobble shader. It keeps wall colours and omits doors, windows and props, partly because reflections should be simpler than the subject. He places everything in water because it needs no horizon and no background level-of-detail work.
- **Ambient occlusion.** A low-resolution voxel-like atlas baked on the fly and sampled in the vertex shader, so it runs on phones. Shadows are ordinary shadow maps.
- **Hidden surprises.** Enclosed flat areas become gardens, and birds and butterflies react to local shapes [review](https://www.gamedeveloper.com/game-platforms/how-townscaper-works-a-story-four-games-in-the-making). Flying structures began as a player-found bug that he then supported with hand-made grid patches.
- **Palette.** Bright, abstract, Scandinavian-leaning; he avoids heavy ornament because it clutters when zoomed out [review](https://www.gamedeveloper.com/game-platforms/how-townscaper-works-a-story-four-games-in-the-making).

**Goals.** None. Stålberg and press both call it closer to a toy. **Session.** Open-ended; reviewers report anything from minutes to a few hours.
**Retention.** No data. Review medians around 6 hours; Korean sample 1.6.
**Why people stop.** No motivation after a short time ([fan](steam-dumps-A/townscaper.md) `Mos7`; [fan](https://www.reddit.com/r/CozyGamers/comments/1fofr9z/i_made_seyda_neen_from_morrowind_in_tiny_glade/loprbc8/) reports boredom within minutes and a wish for goals; [fan](https://www.reddit.com/r/BaseBuildingGames/comments/1vbl85k/games_that_allow_for_the_natural_growthaesthetic/p0u7937/) about 3 hours).
**Loved.** Emotional relief (`Top9`), the feel of clicking (`Top6`), using it for tabletop maps (`Top7`), a cheap price.
**Hated.** No people or interaction (Korean `Top5` compares it to an unsold ghost town; Korean `Top2` and English `Top5` ask for passers-by), single-style art (`Top8`, `Top13`), awkward camera and filling large areas one block at a time (Korean `Top9`, `Top28`).

Note: in this sample Korean helpful reviews were noticeably harsher than English ones, 6 of 30 negative against 0 of 50. Small sample, but it fits a recurring Korean complaint that healing mood alone is not content.

### Tiny Glade (Pounce Light, 2024, $14.99, 2 developers plus audio partners)

**One action.** Drag to draw a wall or building, then it assembles and rearranges itself [review](https://80.lv/articles/exclusive-tiny-glade-developers-discuss-bevy-proceduralism-publishers-cozy-games/). The developers describe it as doodling with procedural generation, where the game makes whatever you do look good [official](https://www.youtube.com/watch?v=jusWW2pPnA0). Hidden behaviours emerge with fiddling (`Top4`).

**How the look is achieved** [official](https://www.youtube.com/watch?v=jusWW2pPnA0):

- **Stack.** Custom engine in Rust on Vulkan, using Bevy's ECS for logic rather than Bevy for rendering. Minimum hardware is roughly decade-old machines. Nobody works on rendering full time.
- **Bricks, not meshes.** Generators emit hundreds of thousands of individual bricks, planks and pebbles, up to about a million, handled with GPU culling and draw generation. The farthest brick level of detail is a six-triangle shell whose pixel shader computes bevels, so edges still catch light.
- **Few materials.** A small hand-made set, which makes simple sorting good enough.
- **Shadows.** Filtered shadow maps with temporal stabilisation, plus a few ray-march steps for contact shadows that add perceived detail cheaply.
- **Global illumination.** They tried a top-down light map, probe grids, screen-space probes and ReSTIR, then shipped something simpler: one ray per 16 pixels, ray march first, software ray tracing against crude proxy shapes as fallback, then heavy denoising.
- **Sky.** Hand-tuned colour timelines per level, not an atmosphere model. Clouds are sprites on a cylinder.
- **Water.** Flat. Screen-space reflections with a fallback, cheated refraction, and fake caustics from thresholded wave textures. When the fallback looked wrong they simply used black.
- **Tilt-shift depth of field.** Justified by what they jokingly call squee-driven development: if the tiny view makes people react, it stays. The painterly goal cites Studio Ghibli. Their own colour mapping exists to stop bright colours turning sickly.

The studio is a rendering specialist with a talk-worthy custom engine. That is the point: this is not a template for a web game by one developer plus AI.

**Goals.** None. Asked about failure, they spoke of a calm childhood space and not giving wrong answers [review](https://gigazine.net/gsc_news/en/20241120-tiny-glade-600k-sold-reason). A daily theme acts as a soft prompt [fan](https://news.ycombinator.com/item?id=42190065).
**Session.** A Korean reviewer reports 30 minutes to 3 hours per idea (Korean `Top1`). **Sales.** 616,528 in a month, peak 10,692 concurrent [review](https://gigazine.net/gsc_news/en/20241120-tiny-glade-600k-sold-reason), [review](https://gameworldobserver.com/2024/10/10/tiny-glade-500k-players-bonkers-pounce-light). Wishlist counts differ between reports.
**Why people stop.** Nothing further to do once an idea is out; nothing can be done with the result ([fan](https://www.reddit.com/r/cozygames/comments/1k0diiy/looking_for_cutecozy_games_except_im_a_bit_picky/mnedf1e/), Korean `Top16`, `Top21`; [fan](https://blog.naver.com/yeji9g/224207767529) built one castle and shelved it until updates).
**Loved.** Calm, making mistakes safely (`Top2`), feeling competent without building skill (Game Donga review mirrored on [DCinside](https://gall.dcinside.com/board/view/?id=gamedonga&no=15064), [review], snippet only).
**Hated.** The top-listed review (2,373 votes) jokes that it lacks chickens, and `Top6` repeats the wish. Korean `Top5` asks for residents. Also no copy and paste (`Top8`), no alignment (Korean `Top23`), small map (Korean `Top25`), the system fighting precise intent (`Mos5`, `Mos23`, `Mos36`), price for content (`Mos8`). Critics call it a polished toy [fan](https://news.ycombinator.com/item?id=42190065).

### Town to City (Galaxy Grove, Early Access Sep 2025, 1.0 May 26 2026)

**One action.** Truly gridless: roads, buildings and decor are placed freely, down to pixel-level flower beds, and terrain can be shaped [official](https://store.steampowered.com/app/3115220/).

**Loop.** Lay roads, place homes, some needing nearby greenery or water; put shops near housing and connect them to warehouses; add trees, benches and lamps; attractive surroundings raise happiness; families arrive; research unlocks more; settlement moves through hamlet, village, town and city [review](https://waytoomany.games/2026/06/16/review-town-to-city/). Decor feeds a beauty score [review](https://www.fixgamingchannel.com/town-to-city-review-happiness-loops-in-a-mediterranean-sandbox/). Residents come in classes (Korean `Top4`). No disasters or angry events. Story and sandbox modes, plus several linked towns [official](https://store.steampowered.com/app/3115220/). A Naver blogger valued the three themed towns feeding one another [fan](https://blog.naver.com/nayrik/224428372905).

**Look.** Voxel Mediterranean, warm colours, day and night with lantern shadows, citizens visibly commuting and relaxing [review](https://waytoomany.games/2026/06/16/review-town-to-city/). First-person stroll and photo mode [official](https://store.steampowered.com/app/3115220/); capture mode's automatic blur gives a miniature feel [fan] (dmitory post via Naver snippet, [unverified] URL). **No technical source found** on engine or rendering.

**Goals.** The key case. `Top4` argues it solves the cozy conflict by offering things to do under gentle pressure, without the stress of being pushed. `Top14` happily ignores the economy and just plants trees. Both styles work, because beauty is itself progress.
**Session.** Long: `Top3` reports one house becoming a night-long decorating session.
**Why people stop.** Performance is the top complaint ([fan](steam-dumps-A/town-to-city.md) `Top40`, `Top52`, `Mos12`; Korean `Top3` says many street lamps hurt the frame rate; press notes the same at scale). The urban phase lags the town fantasy, and growth pushes you past the part you liked (`Top6`). A Naver reviewer enjoyed it but did not see it as very long-lived [fan](https://search.naver.com/search.naver?where=blog&query=%ED%83%80%EC%9A%B4%20%ED%88%AC%20%EC%8B%9C%ED%8B%B0%20%EA%B2%8C%EC%9E%84%20%ED%9B%84%EA%B8%B0).
**Loved.** Recovery from burnout (`Top1`), the fine decorating, a fair economy that does not punish mistakes (`Top8`).
**Hated.** No undo (`Top2`), proximity rules that feel like a small Anno (`Top58`), repetitive music (`Top11`), map and terrain limits (`Top5`), workers not visible at work (`Top14`). A voxel sceptic liked it anyway but would pay for a non-voxel version (`Top13`).
Korean `Top1` adds a funny detail: dense, efficient Korean-style blocks wreck happiness until greenery arrives.

### Township (Playrix, 2011, mobile since 2013; Korean name 꿈의마을)

**One tap.** Crops start everything: plant, harvest, turn into goods in timed production buildings, ship goods, get coins and materials, upgrade, expand [review](https://www.deconstructoroffun.com/blog/2020/10/13/how-playrix-township-became-a-billion-dollar-game). Over 250 goods. Almost every action gives experience.

**Order sinks** [review](https://www.deconstructoroffun.com/blog/2020/10/13/how-playrix-township-became-a-billion-dollar-game): helicopter (permanent, instant), trains (from level 5, up to 3, return in up to 5 hours), airport (15-hour order bonus), zoo (new order every 3 hours, 8 a day). Barn capacity is the deliberate bottleneck, raised with materials from trains.

**Important finding.** It is not really a city builder. Layout changes nothing, there are no roads or services, and decorations have no gameplay effect [review](https://www.deconstructoroffun.com/blog/2020/10/13/how-playrix-township-became-a-billion-dollar-game). The town is a progress display on a production puzzle.

**Look.** I found no source on its art. I am leaving this blank rather than guess.

**Goals.** Endless level track, plus events of 7 to 10 days with 2-week gaps. Mini-games of 1 to 2 minutes with an energy meter. Match-3 later became a second core alongside the town [review](https://www.pulse.bot/gaming/news/how-playrix-turned-township-into-a-45mmonth-engine-a-two-a-half-gamers-episode-with-gamerefinery-7916d6ea-6698-47c3-8660-de41964ca510/).
**Session.** Timers imply repeated short check-ins. **Inference**; no measured session length found.
**Retention.** No public figures. Reddit shows tenures of 3, 6 and 10 years ending in quits, an indicator of very long lifetimes for some.
**Revenue.** About $1B lifetime by 2020 [review](https://www.deconstructoroffun.com/blog/2020/10/13/how-playrix-township-became-a-billion-dollar-game); about $45M a month in a podcast summary [unverified](https://www.pulse.bot/gaming/news/how-playrix-turned-township-into-a-45mmonth-engine-a-two-a-half-gamers-episode-with-gamerefinery-7916d6ea-6698-47c3-8660-de41964ca510/).
**Why people stop** (all [fan], r/TownshipGame). Match-3 levels that need paid boosters ([1](https://www.reddit.com/r/TownshipGame/comments/1tpbui6/is_it_worth_coming_back_left_the_game_for_3_years/oorjjod/)), a player who wanted the town and resented match-3 ([2](https://www.reddit.com/r/TownshipGame/comments/1u8cbk4/does_township_deliberately_make_you_lose_your/os74tsx/)), worse rewards ([3](https://www.reddit.com/r/TownshipGame/comments/1uv4xny/is_this_all_the_motivation_we_get_now/oxosdas/)), a sense of losing what was fun after years ([4](https://www.reddit.com/r/TownshipGame/comments/1wifui3/hit_the_10th_anniversary_milestone_and_i_think_im/paa88h3/)), spending regret ([5](https://www.reddit.com/r/TownshipGame/comments/1tm1zdd/should_i_play_township/onkhlht/)).
**Loved.** Attachment to one's own town: one player cannot delete a town after six years ([fan](https://www.reddit.com/r/TownshipGame/comments/1t9wqy0/the_end_of_my_township_road/pcuonfn/)), another named a town after a late parent ([fan](https://www.reddit.com/r/TownshipGame/comments/1wifui3/hit_the_10th_anniversary_milestone_and_i_think_im/paa88h3/)). Invested time in a visible place is the long-term asset.

## 5. Useful titles

### Islanders (Grizzly Games 2019; New Shores 2025)

**One action.** Choose one of two themed building packs, pick a building, and a translucent sphere shows its scoring range and a live points preview. You rotate, then commit. Placement is permanent [wiki](https://en.wikipedia.org/wiki/Islanders_(video_game)). Reach the threshold and move to a new island; run out of buildings or space and the run ends.
**Look.** Low-poly, crisp geometry, calm colours, no people, no fixed era [wiki](https://en.wikipedia.org/wiki/Islanders_(video_game)). **Goals.** Score, with a sandbox added later (Korean `Top6`). **Session.** Short and self-contained by intent; one reviewer logs about an hour for four islands. Team tests each feature by asking if it can be simpler [review](https://gameworldobserver.com/2019/06/14/islanders).
**Stop.** Too thin as a game (`Mos2`, `Mos16`), no units to watch (Korean `Top16`), tight scoring against the Relaxing tag (New Shores Korean `Top8`).
**Loved.** Lightness for tired evenings ([fan](https://www.reddit.com/r/gamesuggestions/comments/18a1udg/hidden_gemmost_underrated_pc_games/kbvfq80/)).
**Warning.** New Shores added roguelite choices. Most liked it (96% of 1,252), but some long-time fans say it lost the calm (`Top27`).

### Dorfromantik (Toukana, 2022)

**One action.** Draw a hex tile, rotate, place. Undo allowed, relocation not [wiki](https://en.wikipedia.org/wiki/Dorfromantik). Perfect edges and finished quests refill the stack.
**Art system** [review](https://80.lv/articles/how-dorfromantik-expands-its-cozy-world-through-minimalist-design): Unity and Blender; simple shapes with strong silhouettes checked from the actual camera; grayscale albedo plus up to five vertex colour channels used as masks; palettes hand-picked per biome; palettes tested in grayscale for value first; one sun with lifted shadow darkness; subtle per-biome fog; mood from colour rather than lighting; night mode is simply another colour set; artists set colours through an inspector tool without code. Tiles are curated modules recombined by rules.
**Feel.** One direct quote, because it is the most useful sentence in this survey: "the interaction the player does the most has to feel as satisfying as possible" [official](https://www.gamedeveloper.com/disciplines/sparking-joy-through-tile-placement-in-idyllic-village-builder-i-dorfromantik-i-). Audio and animation stay subtle so they never break calm.
**Quests.** Appear on the board as demands, such as a deer wanting a forest of a certain size. Counting was chosen because it is instantly understood [official](https://www.gamedeveloper.com/disciplines/sparking-joy-through-tile-placement-in-idyllic-village-builder-i-dorfromantik-i-).
**Goals.** High score, challenges unlocking biomes, tiles and skins. **Session.** Reviewers plan 15 minutes and lose hours; one suggests 20 to 120 minutes.
**Stop.** Unseen random tiles, railway tiles irritating Korean players (`Top23`, `Top30`, `Top15`), and reading an optimal guide spoiling the calm (`Top1`). `Top3` warns it is a hard puzzle under the cozy skin.

### Hay Day (Supercell, 2012)

**One action.** Swipe across plots to harvest; crops never die [official](https://apps.apple.com/de/app/hay-day/id506627515?l=en&uo=2). Silo and barn limit storage. Sell through truck orders, boat orders, visitors and roadside shops [wiki](https://en.wikipedia.org/wiki/Hay_Day).
**Design** [review](https://www.deconstructoroffun.com/blog//2013/01/behind-success-of-hay-day.html): no forced tutorial, no penalty and no single right way; paid speed and convenience, never forced; DAU/MAU about 55% by AppData's 2013 estimate. Timers bring players back through notifications [review](https://www.gamedeveloper.com/business/game-monetization-design-analysis-of-hay-day).
**Why it lasted.** Former staff name retention as the one early metric, habits built on positive reasons to return, a quirky 1950s tone where nothing bad happens, and neighbourhoods and derbies for long-term players [review](http://www.pocketgamer.biz/supercell-looking-back-10-years-of-hay-day-part-one/).
**Stop.** Storage pressure, paid pass regret and feeling chained by money ([fan](https://www.reddit.com/r/HayDay/comments/1mfkain/why_is_hay_day_farm_pass_so_expensive/n6hqars/)). Long-time players leaving ([fan](https://www.reddit.com/r/HayDay/comments/1wvcc2k/am_i_the_only_person_who_feels_like_people_in/pddz043/)). A Korean blogger drifted off after level 42 [fan](https://badaro2001.blogspot.com/) ([unverified], snippet only).
**Worth noting.** A player reports leaving in cycles and getting a free storage upgrade on return [fan, unverified](https://www.reddit.com/r/HayDay/comments/1wbryj8/does_anyone_else_struggle_with_storage/p8sc9du/). Generous returns are the opposite of punishing absence.

### Animal Crossing: New Horizons (Nintendo, 2020)

**One action.** Walk and act in real time; collect, craft, place. Days and seasons follow the real clock. Big changes take a day or two, which creates daily bursts; crafting and terraforming exist so players can still change things at any hour [review](https://gamedeveloper.com/design/why-nintendo-s-new-i-animal-crossing-i-features-allow-instant-change-in-the-real-time-game).
**Art.** Art director Takahashi kept simple shapes and set detail by each object's role. His idea is an imagination gap: leave room so players project their own motives, because too much detail makes them passive and too little tires them [review](https://videogameschronicle.com/news/animal-crossings-developers-say-the-series-must-continue-to-evolve). A roughly 45-degree view shows background activity, and the checkerboard grass was kept for expression [wiki](https://en.wikipedia.org/wiki/Animal_Crossing:_New_Horizons). Shader details were not found.
**Goals.** Island star rating ending the main story at three stars, then self-set [wiki](https://en.wikipedia.org/wiki/Animal_Crossing:_New_Horizons). 50.29 million sold by June 30, 2026 [wiki](https://en.wikipedia.org/wiki/Animal_Crossing:_New_Horizons).
**Stop.** Students describe early obsession, then routine, then near-total disinterest [review](https://dailyfreepress.com/?p=175145). Korean bloggers report tiring of island decoration [fan, unverified](https://search.naver.com/search.naver?where=blog&query=%EB%8F%99%EB%AC%BC%EC%9D%98%20%EC%88%B2%20%EC%A7%88%EB%A6%AC%EB%8A%94%20%EC%9D%B4%EC%9C%A0%20%EC%A0%91%EC%9D%8C). A pandemic effect complicates the numbers ([fan](https://www.reddit.com/r/AnimalCrossing/comments/13gx59o/i_would_deadass_pay_for_an_update_at_this_point/jk38m8v/)).
**Loved.** That residents no longer leave during a break: one fan says older games felt like a job for that reason ([fan](https://www.reddit.com/r/AnimalCrossing/comments/1wb97zn/we_gotta_call_for_a_return_to_form/p8pa9h1/)). This supports the plan's rule against absence punishment.

### Stardew Valley (ConcernedApe, 2016, solo developer)

**One action.** Spend limited stamina on tools inside one in-game day. Day length not verified; the wiki was blocked.
**Goal structure.** The Community Center: 6 rooms, 30 bundles, each room restoring part of the town and unlocking something [review](https://www.playnews.gg/en/guides/stardew-valley-the-complete-community-center-guide-the-30-bundles-the-6-rooms-and-the-140-000g-joja-route). Bundles are shopping lists that repair a visible place. Barone values an open-endedness that makes the game personal [review](https://www.pcgamer.com/games/sim/eric-barone-has-regrets-about-not-fleshing-out-stardew-valleys-characters-more-but-likes-that-its-so-open-ended-since-it-makes-things-more-personal-for-each-player). Over 30 million sold, undated [review](https://gamesradar.com/games/simulation/stardew-valley-creator-wishes-hed-known-how-popular-it-would-be-so-he-could-have-made-my-life-easier-for-making-all-these-updates).
**Look.** Pixel art (Steam tag). **Retention.** Strongest in this set by review hours; `Top1` and `Top3` report thousands of hours, helped by updates. **Stop.** Korean `Top7` describes the mood turning into efficiency grinding, and a Korean poster abandoned about ten farms [fan, unverified](https://search.naver.com/search.naver?where=blog&query=%EC%8A%A4%ED%83%80%EB%93%80%EB%B0%B8%EB%A6%AC%20%EC%A7%88%EB%A6%BC%203%EB%85%84%EC%B0%A8). Economy and fishing complaints exist (`Mos32`) but are rare.

### Neko Atsume (Hit-Point, 2014)

**One action.** Put out food and goods, leave, come back. Cats visit, you see them use your objects, photograph them, and they leave fish and mementos [wiki](https://en.wikipedia.org/wiki/Neko_Atsume). No end state.
**Design.** The developer aimed at children, little skill and little time, and refused cheats or complexity [wiki](https://en.wikipedia.org/wiki/Neko_Atsume). CEDEC 2015 best game design, 10 million downloads by December 2015 [wiki](https://en.wikipedia.org/wiki/Neko_Atsume). He reportedly expected about 50,000 a year [unverified](https://en.wikipedia.org/wiki/Neko_Atsume).
**Stop.** Personal album goals completed ([fan](https://www.reddit.com/r/nekoatsume/comments/1pax660/just_started_playing_again_after_years_and_am/nrnsyev/)). The sequel's decoration wear is the sharpest warning in this survey: a player stopped because of constant repairs ([fan](https://www.reddit.com/r/nekoatsume/comments/1nivuro/so_its_been_a_while_what_does_everyone_think_of/nesb8w6/)). Single comment, but it matches the absence evidence elsewhere.

### Pocket Camp (Nintendo, 2017 to 2024)

**One action.** Trade fruit or bugs to an animal's request, get materials, craft with a wait, raise friendship, invite them [wiki](https://nookipedia.com/wiki/Animal_Crossing:_Pocket_Camp). Paid tickets skip waits. Three subscription plans. Online service ended November 28, 2024; a paid offline version followed in December.
**Stop.** Subscription dislike [fan, unverified](https://www.gonintendo.com/comments/13960). A Korean poster quit after missing one event following years of complete collecting, then lost the three-hourly check-in habit entirely [fan, unverified](https://search.naver.com/search.naver?where=blog&query=%ED%8F%AC%EC%BC%93%EC%BA%A0%ED%94%84%20%EC%A0%91%EC%9D%80%20%EC%9D%B4%EC%9C%A0). This is how timed collecting ends: one miss breaks the whole habit.
**Loved.** A fan found the early chores pointless until routine and collection goals formed ([fan](https://www.reddit.com/r/ACPocketCamp/comments/1qjyd3h/does_anyone_not_have_a_caretaker/o12ic91/)). Animals with personal requests give small tasks meaning.

### Tiny Tower (NimbleBit, 2011)

**One action.** Tap to stock, ride bitizens in the elevator, build a floor. Coins accrue while away; waits are skippable with scarce currency [wiki](https://en.wikipedia.org/wiki/Tiny_Tower). Sending a visitor to a floor under construction shortens it by one minute, which is a neat small action that speeds a wait.
**Numbers.** 10 million downloads by February 2012, 2011 iPhone Game of the Year [wiki](https://en.wikipedia.org/wiki/Tiny_Tower). About 5% paid [review](https://www.engadget.com/2011-12-15-nimblebit-comments-on-popularity-of-tiny-tower-working-on-new-i.html).
**Worth noting.** Press praised the tower as a way to show off progress [unverified](https://mcvuk.com/?p=105324). Coming back to accumulated coins was reported as rewarding [wiki](https://en.wikipedia.org/wiki/Tiny_Tower). Evidence on stopping is thin: one fan recalls needing a spreadsheet to track bitizens [fan](https://www.reddit.com/r/cozygames/comments/1pcmkho/mobile_cozy_games/ns00dy0/). Art style: pixel floors, from memory [unverified].

### Fabledom (Grenaa Games, 2024)

Cute fairy-tale city builder with seasonal labour shifts and growth gated by population ([fan](steam-dumps-A/fabledom.md) `Top3`). 28 of 103 sampled reviews negative. The most-helpful negative (1,050 votes, `Top5`) praises its charm, then says it runs thin quickly. Another says the tech tree is a straight line and six hours shows everything (`Top9`). Starvation bugs late in the game ruined saves (`Top6`, `Top12`). `Top1` wants dogs for the dog houses.
**Lesson.** Cute art buys the first hour only. It is the clearest warning for a charm-led game. No technical art source found.

### Kainga (Erik Rempen, solo, 2022)

Roguelite village builder in 30 to 90 minute runs [official](https://store.steampowered.com/app/1269710/). The solo developer says removing the tech tree in favour of finding categories on the map and choosing one of three created the genre fit and added depth ([fan, developer account](https://www.reddit.com/r/gamedev/comments/1k187vi/whats_the_smallest_change_that_made_the_biggest/mnk8qv8/)).
Reception 74% of 645. Top complaints are bugs, pathfinding, weak unit control and RNG deciding your build (`Top1`, `Top5`, `Top13`, `Top16`).
**Lesson.** A solo developer's ambitious simulation produced bugs players could not forgive. A simple deterministic village is safer than unit AI.

## 6. What fits WILD CROWN

Everything in this section is **inference** from the evidence above, unless linked. Costs are my rough estimates. Nothing has been tested on people.

Current state: 8×8 box tiles on a green circle, `MeshStandardMaterial`, hemisphere plus directional light, perspective camera at FOV 38, four building types, `three` 0.170.

### Graphic direction: a tabletop diorama on water

Think of the chessboard as a small island you can pick up. Keep the 8×8 grid visible in spirit.

| Choice | What to do | Why | Cost |
| :--- | :--- | :--- | :--- |
| Palette first | Move to Dorfromantik's system: shared material, vertex colours or a small palette texture, one colour set per season or kingdom, checked in grayscale | Mood from colour, cheap, and night or winter become data rather than art | Low |
| Lighting | One warm sun, lifted shadows, gentle fog. Avoid heavy post effects by default | Same source. Runs on weak devices. Children's devices likely weak | Low |
| Water around the island | Flat stylised plane with a simple shader; mirrored low-detail silhouette with wobble, wall colours only | Stålberg's cheap trick: no horizon, no background art, instant charm | Low to medium |
| Tile transitions | Use a dual grid for ground: decide corners, not squares. A path-to-grass pair needs 6 shapes with rotation by simple geometry | Interest lives at edges, and this is what lifts the current box tiles most | Medium |
| Detail by role | Bright, chunky buildings; quiet ground; detail where residents act | Takahashi's role rule and Stålberg's restraint | Low |
| Camera | 3/4 view around 45 degrees, limited orbit, focus on the board | ACNH's view shows activity; Townscaper's camera got complaints | Low |
| Photo mode only | Tilt-shift and blur only there or on capable devices | The miniature effect sells the toy. Tiny Glade and Town to City both lean on it | Low |
| Tone mapping | Try `AgXToneMapping` (present in the installed `three`) | Keeps bright colours from going sickly, the problem Stachowiak describes | Trivial |
| Silhouette check | Inspect every asset from game camera | Dorfromantik's rule; this also protects chess role readability | Trivial |

Fit with the pipeline: animals stay TRELLIS models. Buildings and props should be a small hand-kept kit in one style rather than TRELLIS one-offs, or they will not read as one world. Target about 30 to 50 modules at first (estimate).

Keep the existing cute-animal focus. Voxels would clash with the character models, and one Town to City fan disliked voxels despite loving the game (`Top13`).

### Play style: a living board fed by chess

Short phrase: **Neko Atsume's visitors, Dorfromantik's board requests and Stardew's collection boards, with the match as the clock.**

Session shape: a match, then one to three minutes in the village, then the next match.

1. **The walk stays the signature.** The hero retraces the actual match route, and paths appear. Nothing else in this survey derives a builder's input from another game's play.
2. **One perfect action.** Placing an item: pop, squash, a sound, nearby residents turn to look. Tune this first, because it will be repeated more than anything else.
3. **Life over objects.** Residents use what you place: sit, nap, chew, play. The panda eats bamboo you planted. This answers the request seen in Townscaper, Tiny Glade, Town to City, Fabledom and Islanders.
4. **Requests on the board.** A small icon: the panda wants 3 bamboo nearby. Counting only. Never expires, never fails.
5. **Chess-shaped adjacency.** Borrow Islanders' live preview, but the reach follows a chess move. A knight's house likes L-shaped neighbours; a bishop's garden likes diagonals. Teaches movement to children while decorating. This is a hypothesis of mine and has no precedent in the survey. Bonus only, as hearts or decoration, never a threshold.
6. **Collection boards, not consumption.** Like Community Center rooms, but owning a card is enough. Complete a board (say all four pandas) and a town feature is restored. The plan bans forced burning of cards, and this fits it. It also gives cards a use and answers plan risk 4, what happens after the album.
7. **Sharing.** Photo mode with a postcard frame. Plan section 6 already notes that solo players need somewhere to show things.

### Priority

| Step | Item | Evidence strength | Rough size |
| :--- | :--- | :--- | :--- |
| 1 | Palette, sun, water, 3/4 camera on existing tiles | Strong, sourced tech | Days |
| 2 | Placement juice and sound | Strong | Days |
| 3 | Residents using objects | Strong for demand, cost depends on animation reuse | 1 to 2 weeks |
| 4 | Dual-grid paths | Medium | Days to a week |
| 5 | 12 to 20 buildings and props, board requests | Strong | 2 weeks |
| 6 | Collection boards tied to cards | Medium, Stardew plus plan fit | 1 week |
| 7 | Chess-move adjacency | Hypothesis | 1 week, prototype first |
| 8 | Photo postcard | Medium | Days |
| 9 | Second island or season swap after the board fills | Medium | Later |

Do steps 1 to 3 before adding systems. Then run the human logging from plan step 4, otherwise steps 5 onward are guesswork.

### What to avoid

| Avoid | Evidence |
| :--- | :--- |
| Decay, repairs, wilting, residents leaving | Neko Atsume 2 complaint; ACNH praise for no move-outs |
| Real-time timers as the main gate; push notifications | Township and Hay Day use them to monetise; plan bans them. Pocket Camp check-ins broke at first miss |
| Limited-time exclusive collectibles | Pocket Camp, one poster, but plausibly general |
| Storage walls | Township and Hay Day use these deliberately to sell |
| Permanent placement | Town to City players beg for undo; Tiny Glade's no-wrong-answers. Islanders' permanence suits a score game only |
| Failure in the village | Korean reviewers reject score pressure under a relaxing label |
| A pure toy with no goals | Townscaper and Tiny Glade stop signals. Their exceptional art carried them, and we cannot match that art at this budget |
| Bolted-on match-3 or a second core | Township's top quit reasons. Chess is already the second core |
| Roguelite meta in the village | Islanders: New Shores split its fans; Kainga's RNG complaints |
| Unit AI, needs simulation, supply lines | Kainga and Fabledom bugs; Town to City's proximity rules annoy some; solo-developer risk |
| Gridless placement | Loses the chess identity and needs heavy tooling; its rewards come at high decoration depth |
| Townscaper's grid and WFC | 300 to 500 modules and an irregular solver, for an 8×8 board that does not need them. Skewing a regular grid gives limited results, per Stålberg |
| Tiny Glade's renderer | Custom Vulkan path with ray-marched lighting is not a web option at this budget |
| Unbounded density | Town to City's top complaint is late-game performance, and street lamps are named. The 8×8 cap is a feature. Budget lights strictly |
| Thin content behind a cute skin | Fabledom |

### Conflicts with current plans

1. **Timed construction.** The village plan has a one-worker build that finishes with elapsed time. I suggest completion by matches played rather than hours, or instant placement for small items, keeping a wait only for rare big buildings. ACNH added instant paths for the same reason. Decide after measuring.
2. **Buildings as the main spend.** With only four buildings the plan expects to run dry by day three. Small placeable items should come before more large buildings.
3. **Stardust.** Plan step 5 converts spare cards to stardust. It could become the currency for decoration so cards and village share one economy. This needs a design pass and a check that it does not create pressure to convert.

### What would change my mind

- Players skip the village after a match. Then the village must come to them, for instance on the result screen.
- Placement sessions run long and matches drop. Then the village is competing with chess.
- Children cannot read the chess-move preview. Drop adjacency, keep requests.
- Low-end devices stutter with water plus residents. Cut reflection first.

## 7. Gaps

- No first-hand play or screenshot analysis. Palette descriptions come only from sources; Township has no art entry.
- Town to City's engine and rendering are unknown.
- Hay Day GDC economy talk not watched.
- No Korean long-form post bodies read. Inven, X and app store reviews are effectively missing.
- No game in this set runs a builder as a side layer to a skill game. The closest evidence for that pairing is outside this survey, so the match-as-clock idea is unproven.
- Several Korean snippets lack exact post URLs, so they link to the Naver search page and are marked unverified.
