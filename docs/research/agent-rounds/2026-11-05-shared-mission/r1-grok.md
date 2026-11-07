설계 답은 원문 인용으로만 받치겠습니다. 이 폴더의 미션·경제·카메라·바다 셰이더와 두 화면 캡처를 먼저 읽습니다.보장 카운터와 `pay()`가 미션 카드에 어떻게 닿는지, 발췌에 없는 부분만 저장소에서 확인합니다. 인용은 파일에 있는 문장만 쓰겠습니다.원문과 저장소가 맞습니다. 경주는 이미 판 위에서 갈리고, 카드 보장 카운터는 판 수가 아니라 카드마다 움직입니다. 그 기준으로 설계를 정리합니다.# 흑백 공유 미션 · 판 배치 · 바다 파도

게임 시스템 설계(밸런스·공정성). 수치는 시작값이다. 미션 달성률, 판의 평균 수, 어린이가 미션 글을 읽는지는 재지 않았다.

## A. 공유 미션

### A1. 판당 1개, 아무도 고르지 않는다

**무엇.** 5판이 지난 뒤부터, 판마다 경주 미션 하나를 양쪽 색에 같은 것으로 붙인다. 「미션을 골라요」 창과 건너뛰기는 없앤다. 무시해도 벌이 없다. 마을 의뢰가 있으면 그 한 줄이 미션 자리를 그대로 차지한다.

**왜.** `missions.js` 의 `missionChoices` 주석은 「Three different missions, picked by one seeded roll.」 이다. 고르는 사람은 한 명이다. `CardLayer.tsx` 에 버튼 문구 `미션을 골라요` 와 `건너뛰기` 가 있다. 고르면 자기가 잡기 쉬운 쪽을 집게 되어, 양쪽이 같이 받는 경주가 아니다. 같은 결과는 `economy.js` 의 「The same game, kind and move always give the same roll, so card rolls never disturb the AI's random numbers.」 인 `seededRoll` 로 만든다. 첫 5판은 `UNLOCK_GAMES = 5` 와 그 주석 「the first games show only capturing and merging」 그대로 비운다. 의뢰는 `CardLayer.tsx` 주석 「Once a village resident is asking, its request replaces the card mission.」 이라 자리를 하나 더 만들지 않는다. 목표를 한 줄로 모으는 이유는 `dynamic-plan-excerpt.md` 의 「같은 날 둘 다 보이면 시끄러우니 판 시작 화면에 한 줄로 합친다」. 무시해도 깎이지 않는 이유는 `dark-pattern-rules.md` 의 「한 판을 끝내면 이득이 보이고, 쉬면 그대로 있다. 오지 않았다고 깎이지 않는다.」

**틀릴 수 있는 곳.** 고르기 창이 아이들에게 재미의 본체일 수 있다. 그 재미는 재지 않았다.

### A2. 경쟁은 평가 함수를 고치지 않아도 생긴다

**무엇.** 혼자 판에서 AI 는 미션을 쫓지 않는다. `evaluate()` 가산은 0이다. 탐색 깊이 1·2·3 과 slip 0.3·0.1·0 은 판 중에 바꾸지 않는다. 경주는 그 기물을 먼저 잡은 쪽이 이긴다. AI 가 먼저 잡으면 그 색의 이름으로 알리고, AI 의 세기와 카드는 올리지 않는다. 그때 칩을 `.mission-chip.lost` 처럼 흐리게 두지 않는다. 두 사람 판도 같은 문장, 같은 승자다. 시드는 각 기기의 `Date.now()` 가 아니라, 방이 이미 공유하는 `roomCode` 와 `resetCount` 의 함수로 한다.

**왜.** `missions.js` 첫 줄: 「Start-of-game missions. The AI does not chase them: a race is decided by what happens on the board anyway.」 경주 결말은 이미 `return capture.byPlayer ? 'done' : 'lost'` 이다. AI 가 그 기물을 잡는 이유는 미션이 아니라 기물 값이다. `src/rules/ai.js` 의 `const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }` 에서 판다(비숍)는 330, 캥거루(나이트)는 320, 코뿔소(룩)는 500 이다. 같은 파일: 「Piece-square bonuses from white's side (rank 8 first), small enough that material always wins.」 그 잡기는 재료가 오르는 수라 탐색이 이미 고른다. 미션 가산은 더 나쁜 잡기를 일부러 고르게 할 때만 필요하고, 그건 수를 비트는 쪽이다. 깊이표는 `easy: { depth: 1, slip: 0.3 }`, `normal: { depth: 2, slip: 0.1 }`, `hard: { depth: 3, slip: 0 }`. slip 주석: 「A slip is the second or third choice, never a free gift of a queen.」 판 중에 이 표를 점수에 맞춰 바꾸는 것이 고무줄이다. 칩이 실패처럼 보이는 이유: `styles.css` 의 `.mission-chip.lost { opacity: 0.7; }`. 두 사람 시드: `wizardChessEngine.js` 에 `let gameId = Date.now() >>> 0;  // changes with every new game; cards use it to seed their rolls` 라서 기기마다 다르다. 같은 파일의 방 리셋은 `stRoom.resetCount = (stRoom.resetCount || 0) + 1` 이고 `roomCode` 는 양쪽에 있다.

**수를 비트는 상한.** 이번의 가산은 0이다. 나중에 넣는다면 상한은 +40 으로, `VALUE.p` 인 100 보다 작고, 말 위치 보너스가 「material always wins」 인 그 밴드 안에 둔다. 판 내내 상수이고, 지고 있다고 키우지 않으며, 양쪽 색에 같은 크기다. 깊이, slip, `score + (rand() - 0.5) * 12` 노이즈는 그대로다. +40 도 이번 구현에는 넣지 않는다. 사람 쪽 유혹은 보상 크기에서 막는다. A3.

**틀릴 수 있는 곳.** 가산이 0이면 아이는 AI 도 이 문장을 노린다고 느끼지 못할 수 있다. 그 느낌은 봇 승률로 재지지 않는다. `resetCount` 가 미션을 그리는 시점보다 늦게 도착하면 두 화면의 문장이 갈라진다.

### A3. 보상은 도토리만, 카드 카운터는 그대로

**무엇.** 먼저 잡은 색만, 그 판 정산 때 도토리 +4 (시작값). 다른 색은 0이고, 가진 카드를 빼지 않는다. 미션으로 `awardCard` / `pay()` 를 한 번 더 부르지 않는다. `floor: 1` 과 실패 시 `boost` 는 이 경주에 쓰지 않는다. 체스 결과의 도토리(패 15, 무 20, 승 30)는 그대로다. 미션 도토리는 `settleGame` 안에서 그 `gameId` 에 한 번만 준다. 기권은 지금처럼 그 판의 정산으로 끝내고, 이미 잡아서 주머니에 있는 카드는 유지된다.

**왜.** 지금 성공은 `pay(reward, seededRoll(g.id, 'mission', 0), 50, 30, { floor: 1 })` 이고, 같은 잡기에서 그 뒤에 `pay(d.type, seededRoll(d.gameId, 'capture', d.ply), d.x, d.y, { boost: g.boost })` 가 또 나간다. 한 수에 카드가 두 장이다. `economy.js` 주석: 「`floor` is the lowest rarity allowed; `boost` raises this card one step, but never into a hero.」 구현은 `if (boost && rarity < RARE) rarity += 1` 다음에 `rarity = Math.max(rarity, floor)` 이다. `floor` 1 은 `RARITIES` 의 uncommon 이다. 비숍 표 `bishop: [50, 40, 9.5, 0.5]` 의 커먼 50% 가 언커먼이 된다. 공개된 드롭표와 다른 숨은 표다. `dark-pattern-rules.md`: 「무작위는 공개한다: 드롭표와 보장」. 실패는 `g.boost = true` 와 「미션은 놓쳤어요. 다음 카드가 좋아져요.」 boost 는 언커먼을 희귀로 올릴 수 있고, `col.sinceRare = card.rarity >= RARE ? 0 : col.sinceRare + 1` 이라 그 희귀 카드가 보장 진행을 0으로 되돌린다. 10 과 60 은 판 수가 아니다. `RARE_GUARANTEE = 10`, `HERO_GUARANTEE = 60` 이고, `if (col.sinceRare + 1 >= RARE_GUARANTEE) rarity = Math.max(rarity, RARE)`, `col.sinceHero = card.rarity === HERO ? 0 : col.sinceHero + 1` 이라 카드마다 걷는다. 미션 카드를 더하면 잡기 외에 한 번 더 걷고, 3단 사다리면 세 번 걷는다. 도토리는 이 함수를 타지 않는다. `dynamic-plan-excerpt.md`: 「왜 도토리인가: 체스 실력과 무관한 재화(섬 꾸미기)라 「빨리 두면 체스가 는다」는 거짓 신호가 안 생긴다. 카드·하트에는 닿지 않는다.」 `village/economy.js`: `export const COINS = { win: 30, draw: 20, loss: 15 }`, 「Losing never takes anything away.」, 「Pay out one finished game.」 +4 는 승과 패의 차이 15보다 작아서, 미션을 하고 지는 쪽(15+4)이 미션 없이 이기는 쪽(30)보다 도토리가 적다. 기권 문구는 `wizardChessEngine.js` 의 「기권했어요. 이번 판 카드는 받았어요.」 `COINS` 위의 주석: 「Every number here is a prototype guess, not a measured balance.」

**틀릴 수 있는 곳.** +4 가 지금 uncommon 바닥 카드보다 시시해서 경주가 안 느껴질 수 있다. 아이가 도토리 차이를 계산하고 두는지는 모른다. 기권은 `reportGameEnd('loss')` 까지 봤고, 그 함수 본문이 `settleGame` 에 도토리를 넣는 줄은 따라가지 않았다.

### A4. 목록은 경주 3개만

**무엇.** 공유 풀은 지금 문장 그대로 이 셋이다. 「판다를 먼저 잡기」, 「캥거루를 먼저 잡기」, 「코뿔소를 먼저 잡기」. `with_*` 세 개와 「호랑이를 지키며 15수 버티기」 는 공유 풀에서 뺀다. 사자 잡기, N수 승리, 체크 미션은 넣지 않는다.

**왜.** 경주 셋은 `kind: 'race'` 이고 상대의 잡기가 `'lost'` 가 된다. `with_*` 는 `return capture.byPlayer && capture.attackerType === mission.attacker ? 'done' : null` 이라 상대가 해도 닫히지 않고 `'lost'` 가 없다. 「미어캣으로 말 잡기」 는 값 100인 폰으로 잡게 해서, 320·330·500 짜리 잡기보다 나쁜 수를 부른다. `safe` 는 `plies: 30`, 문장은 「호랑이를 지키며 15수 버티기」, 결말은 「if (capture && !capture.byPlayer && capture.type === mission.piece) return 'lost'」 이다. 상대가 호랑이를 잘 잡으면 내가 실패하고, 양쪽이 각자 지키는 목표라 “먼저” 가 아니다. 사자는 `CardLayer.tsx` 주석 「The first check the player gives pays the lion common, once per game」 으로 이미 나오고, `DROP_TABLE` 주석 「The king cannot be captured, so checkmate pays the lion card.」 시간으로 재촉하는 미션은 `dark-pattern-rules.md` 의 「실시간 타이머, 작물 썩음, 시간 제한 주문」 과 겹친다.

**틀릴 수 있는 곳.** 룩·비숍·나이트가 판이 끝나기 전에 거의 안 잡히면 미션이 늘 열려 있다. 그 비율은 재지 않았다. 흰 색이 먼저 두는 이점으로 세 경주 모두 흰 쪽이 많이 이길 수 있다.

### A5. 측정 하나

**무엇.** `chooseMove` 로 봇 대 봇. 경주 3종 × 깊이 3종(1, 2, 3) 각각 200판 (시작값). 미션 가산은 0. 기록은 둘이다. 그 기물이 한 번이라도 잡혀 경주가 닫힌 비율. 닫힌 판 가운데 흰 쪽이 먼저인 비율. 시작 기준: 닫힌 비율이 40% 미만이면 그 문장을 풀에서 뺀다. 한 색이 70% 이상이면 공정한 공유로 보지 않고, AI 가산으로 고치지 않는다. 문장을 바꾸거나 풀에서 뺀다. `logGame` 에 이미 `mission` 과 `missionState` 가 있으니, 봇 기준을 넘긴 뒤 사람 기보를 같은 70% 선에 댈 수 있다. 이번 측정의 본체는 봇 200판이다.

**왜.** 공정성은 “누가 먼저 잡나” 이고, 그 사건은 `advanceMission` 의 `capture.byPlayer` 한 줄이다. 가산 0이면 봇은 평범한 탐색이다. 로그 필드: `mission: g.mission?.id || null, missionState: g.missionState`.

**틀릴 수 있는 곳.** 200판은 70% 선을 가리기엔 적을 수 있다. 봇은 아이처럼 문장을 읽고 그 기물을 쫓지 않는다. 아이가 느끼는 경쟁은 이 측정 밖에 있다.

## B. 판 배치와 작은 HUD

### B1. 휴대폰 세로: 카메라 상한만 내리고, 칩은 아래로

**무엇.** `defaultCameraFor` 의 상한만 내린다. 가로가 세로보다 짧을 때 상한을 2.35 에서 1.85 (시작값)로 한다. 하한 1 과 `1.25 / aspect` 는 그대로다. 목표점 `zSign * 0.06` 은 이번엔 그대로 둔다. 미션 칩은 `top: 176px` 에서 빼서, `#hud-bottom` 위쪽에 한 줄로 둔다. 글자 0.74rem (시작값). 기물을 가리면 줄을 줄이고, 판을 더 당기지 않는다.

**왜.** `camera.js.txt`:

```
const fit = THREE.MathUtils.clamp(1.25 / aspect, 1, 2.35);
const target = new THREE.Vector3(0, 0.72, zSign * 0.06);
return { target, pos: new THREE.Vector3(0, 2.28 * fit, zSign * 3.04 * fit).add(target) };
```

Flip5 로 적힌 360×744 이면 aspect ≈ 0.484, `1.25/0.484 ≈ 2.58` 이라 상한 2.35에 붙는다. 거리 `2.28 * fit`, `3.04 * fit` 가 최대라 위쪽 바다가 넓다. 통합자 확인: 휴대폰 세로에서 판 위쪽 바다·하늘이 화면 위 절반 가까이다. 1024×768 은 aspect ≈ 1.333, `1.25/1.333 ≈ 0.94` 라 하한 1이라, 상한만 내리면 데스크톱 카메라는 그대로다. 칩은 `styles.css` 의 `.mission-chip` 이 `top: 176px`, `font-size: 0.84rem`, `max-width: 240px` 이다. 판을 키우면 이 위치가 상대 기물과 겹친다. 휴대폰은 `#controls-hint { display: none }`, `#hud-bottom` 은 `bottom: 12px`, `#hud-top` 은 `top: 12px` 에 `flex-wrap: nowrap` 이다. 맨 위 흰 띠는 주소창이라는 통합자 확인이 있어, 위 줄에 문장을 더하지 않는다. `zSign` 은 `color === 'b' ? -1 : 1` 이라 흑과 백의 구도가 같다. 목표 z 를 이번에 안 움직이는 이유는, 상한과 z 를 동시에 바꾸면 잘림의 원인을 가릴 수 없기 때문이다.

**틀릴 수 있는 곳.** 1.85 에서 앞줄 미어캣이나 사자 갈기가 잘릴 수 있다. 잘리면 상한을 2.05 로 되돌린다. 시야각은 `defaultCameraFor` 에 없다.

### B2. 데스크톱 가로: 카메라는 그대로, 차례 알약 안에 한 줄

**무엇.** `fit` 하한 1은 그대로 둔다. 미션은 `.status-pill` (글자 `0.86rem`) 안에, `.hud-divider` 다음에 0.75rem 으로 붙인다. 길면 말줄임. 새 줄, 새 패널, 기본 판의 카운트다운은 없다.

**왜.** 데스크톱은 위 식에서 이미 `fit = 1` 이라 판이 화면을 채운다. 캡처에서도 바다는 위 띠이고 판이 대부분이다. `#hud-top` 은 `flex-wrap: wrap` 이라 가로 240px 칩을 더하면 다음 줄이 기물 위를 덮을 수 있다. 타이머를 기본으로 안 넣는 이유: `dark-pattern-rules.md` 의 「실시간 타이머」. 번개 판의 모래시계는 `dynamic-plan-excerpt.md` 의 「시간이 끝나면 보너스만 없고 수는 자유」 인 선택 모드에만 둔다.

**틀릴 수 있는 곳.** 1024 폭에서 브랜드, 차례, 미션, 단추가 한 줄에 안 들어가면 줄이 바뀐다. 그때는 미션만 말줄임하고 카메라는 그대로 둔다.

## C. 바다 파도

**무엇.** 물 메시는 쿼드 하나로 둔다. `swell` 의 `noise` 호출은 3번 그대로 두고, 첫 겹의 주기를 길게, 높은 겹의 가중을 낮춘다. `main` 의 법선 차분 간격을 0.05 에서 0.28 로, 기울기 배수를 1.1 에서 2.6 으로 올린다 (시작값). `wave` 는 해안에서 지금 식을 쓰고, 섬에서 멀어지면 긴 사인으로 섞는다. `foam` 의 해안 창은 유지하고, `swell` 이 해안선을 미는 계수만 0.05 에서 0.18 로 올린다. 먼 바다의 마루는 흰 거품이 아니라 `uShallow` 와 `uFoam` 을 섞은 옅은 띠로, 혼합 0.28 (시작값).

**왜.** `openSea.js`: 「so there is no depth pass and the water still costs one quad.」 생성은 `new THREE.PlaneGeometry(160, 160)` 하나다. 정점 셰이더 `WORLD_VERT` 는 위치를 그대로 투영만 한다.

```
vec4 w = modelMatrix * vec4(position, 1.0);
vWorld = w.xyz;
gl_Position = projectionMatrix * viewMatrix * w;
```

`swell` 은 정점을 안 민다. 분할을 올리면 쿼드 하나라는 전제가 깨진다. 통합자 실측은 Intel UHD, 체스 장면 19ms 라서 `noise` 호출을 더하지 않는다.

`swell` 원문:

```
return noise(p * 2.3 + t * vec2(0.22, 0.13)) + 0.6 * noise(p * 5.1 - t * vec2(0.3, 0.2)) + 0.25 * noise(p * 11.0 + t * vec2(0.1, -0.45));
```

시작값으로 같은 세 호출을 이렇게 바꾼다.

```
noise(p * 1.15 + t * vec2(0.16, 0.09)) + 0.45 * noise(p * 5.1 - t * vec2(0.3, 0.2)) + 0.12 * noise(p * 11.0 + t * vec2(0.1, -0.45))
```

법선 원문:

```
vec3 N = normalize(vec3((h - swell(p + vec2(0.05, 0.0), t)) * 1.1, 1.0, (h - swell(p + vec2(0.0, 0.05), t)) * 1.1));
```

Y 가 1 이고 차분 간격이 0.05 라, 주기 약 0.09 인 11.0 겹만 법선에 남고 2.3 겹의 긴 기울기는 거의 안 보인다. 간격을 0.28 로 넓히면 높은 겹은 평균으로 죽고 긴 겹이 남는다. `swell` 호출은 그대로 3번이다.

`wave` 와 `foam` 은 함수가 아니라 `main` 안의 float 이다.

```
float wave = sin(e * 15.0 - t * 1.15 + h * 3.0) * 0.5 + 0.5;
float foam = smoothstep(0.84, 0.98, wave) * smoothstep(0.42, 0.14, e) * smoothstep(0.3, 0.62, noise(p * 7.0 + t * 0.2));
foam = max(foam, smoothstep(0.17, 0.12, e + (h - 0.9) * 0.05));
```

`islandEdge` 쪽 주석: 「Depth below the waterline at `e` world units past the shore; negative is dry beach.」 `smoothstep(0.42, 0.14, e)` 는 해안에서만 산다. 휴대폰 위쪽 물은 섬에서 먼 큰 `e` 라 `foam` 이 꺼지고, `wave` 는 계산만 하고 버려진다. 시작 식:

```
float shore = sin(e * 15.0 - t * 1.15 + h * 3.0);
float rolling = sin(dot(p, vec2(0.45, 0.18)) - t * 0.85 + h);
float wave = mix(shore, rolling, smoothstep(0.2, 0.9, e)) * 0.5 + 0.5;
```

해안 `foam` 의 첫 줄은 유지한다. 둘째 줄의 `(h - 0.9) * 0.05` 만 `* 0.18` 로 바꿔 해안 흰 띠가 `swell` 을 따라 움직이게 한다. 먼 바다는 `foam` 을 넓히지 않고 다음만 더한다.

```
float crest = smoothstep(0.62, 0.92, wave) * smoothstep(0.35, 1.1, e);
col = mix(col, mix(uShallow, uFoam, 0.4), crest * 0.28);
```

`noise()` 추가는 0회이다. `pow(..., 260.0)` 인 `glint` 는 법선이 눕으면 잔섬광이 된다. 바다가 반짝임으로 덮이면 `glint` 에 0.65 를 곱한다. 그것도 시작값이다.

**틀릴 수 있는 곳.** 사인 하나짜리 `rolling` 은 골판지처럼 보일 수 있다. 그러면 혼합 0.28 을 0.12 로 내리고, 옥타브를 추가하지 않는다. `tick` 은 `shared.uTime.value = t` 만 하고, t 의 단위는 이 파일에 없다.

## 가장 약한 결정

미션 성공의 보상을 카드가 아닌 도토리 +4 로 둔 것. `sinceRare` 와 `sinceHero` 는 `awardCard` 를 안 타서 그대로다. 다만 지금 성공 보상은 `floor: 1` 카드라, +4 는 경주처럼 안 느껴질 수 있다. `COINS` 는 측정된 균형이 아니고, 아이가 미션 문장 때문에 수를 버리는지는 봇의 색 비율 측정에 안 잡힌다.

## 하지 않을 것

1. 판당 미션 3개와 1·2·3단 사다리, 미션 `pay()` 의 `floor: 1`, 실패 때 `boost` 로 다음 카드를 희귀 쪽으로 올리는 것.
2. 판 중에 `LEVELS` 의 깊이나 slip 을 바꾸거나, `evaluate()` 에 폰 값 100 이상인 미션 가산을 넣는 것. +40 상한도 이번엔 넣지 않는다.
3. 기본 판의 실시간 타이머, 물 `PlaneGeometry` 분할을 올리거나 쿼드를 하나 더 그리는 파도.
