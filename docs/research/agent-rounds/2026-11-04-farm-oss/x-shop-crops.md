# 추출 B — SNKRX 매대, Space Station 14 작물 (보조 에이전트 원문, 통합자 대조 전)

## 1. SNKRX: 상점(매대)

**칸 수와 칸 채우기**
- 매대는 3칸이고 x 위치가 고정돼 있다: `SNKRX/buy_screen.lua:363 «x = 60, y = 75»`, `SNKRX/buy_screen.lua:365 «x = 220, y = 75»`.
- 상점 레벨로 가중치 줄을 고른다: `SNKRX/buy_screen.lua:351 «level_to_shop_odds[shop_level]»`.
- 칸마다 따로 굴린다. 먼저 등급(tier)을 가중치로 뽑고, 그 등급 목록에서 균등하게 한 명을 고른다: `SNKRX/buy_screen.lua:353 «random:table(tier_to_characters[random:weighted_pick(unpack(tier_weights))])»`.
- 세 칸이 모두 비공격 캐릭터면 다시 뽑는다: `SNKRX/buy_screen.lua:357 «until not table.all(all_units»`.
- 가중치 뽑기 구현은 가중치 합 안에서 실수 하나를 뽑고 누적 비교한다: `SNKRX/engine/math/random.lua:74 «self:float(0, total_weight)»`.

**확률표 원문** (정의 위치 `SNKRX/main.lua:1631 «level_to_shop_odds = {»`, 열 순서는 tier 1/2/3/4)
- `SNKRX/main.lua:1632 «[1] = {70, 20, 10, 0},»`
- `SNKRX/main.lua:1633 «[2] = {50, 30, 15, 5},»`
- `SNKRX/main.lua:1634 «[3] = {25, 45, 20, 10},»`
- `SNKRX/main.lua:1635 «[4] = {10, 25, 45, 20},»`
- `SNKRX/main.lua:1636 «[5] = {5, 15, 30, 50},»`
- 등급 목록 정의: `SNKRX/main.lua:1012 «tier_to_characters = {»`. 1등급은 8명이다: `SNKRX/main.lua:1013 «'vagrant', 'swordsman', 'magician'»`.
- 가격은 등급 숫자와 같다: `SNKRX/buy_screen.lua:1591 «self.cost = character_tiers[self.unit]»`.

**상점 레벨과 경험치**
- 필요 경험치는 레벨 1→3, 2→4, 3→5, 4→6이고, 5가 최대다: `SNKRX/arena.lua:982 «if self.shop_level == 1 then max_xp = 3»`, `SNKRX/arena.lua:985 «elseif self.shop_level == 4 then max_xp = 6»`, `SNKRX/arena.lua:991 «if self.shop_level > 5 then self.shop_level = 5 end»`.
- 경험치는 저절로 쌓인다. 짝수 라운드를 마칠 때 +1: `SNKRX/arena.lua:979 «if self.level % 2 == 0 and self.shop_level < 5 then»`, `SNKRX/arena.lua:980 «self.shop_xp = self.shop_xp + 1»`.
- 경험치가 차면 0으로 돌리고 레벨을 올린다: `SNKRX/arena.lua:988 «self.shop_xp = 0»`, `SNKRX/arena.lua:989 «self.shop_level = self.shop_level + 1»`.
- 돈으로도 경험치를 산다. 버튼 한 번에 골드 5를 내고 +1: `SNKRX/buy_screen.lua:820 «if gold < 5 then»`, `SNKRX/buy_screen.lua:834 «self.shop_xp = self.shop_xp + 1»`, `SNKRX/buy_screen.lua:844 «gold = gold - 5»`.
- 레벨을 내리는 데는 골드 10이 든다: `SNKRX/buy_screen.lua:868 «self.parent.shop_level = self.parent.shop_level - 1»`, `SNKRX/buy_screen.lua:874 «gold = gold - 10»`.

**다시 굴리기(reroll)**
- 상점에서 한 번 굴릴 때 골드 2: `SNKRX/buy_screen.lua:994 «if gold < 2 then»`, `SNKRX/buy_screen.lua:1008 «self.parent:set_cards(self.parent.shop_level, true)»`, `SNKRX/buy_screen.lua:1011 «gold = gold - 2»`.
- 아레나의 패시브 다시 굴리기는 골드 5이고, 조건이 맞으면 무료다: `SNKRX/buy_screen.lua:1033 «if not self.free_reroll then gold = gold - 5 end»`.

**잠금(locked_state)이 다음 라운드로 이어지는 방식**
- 잠그면 세 칸의 유닛 ID를 전역 변수에 담고 바로 저장한다: `SNKRX/buy_screen.lua:765 «locked_state = {locked = true, cards = »`, `SNKRX/buy_screen.lua:766 «system.save_run(»`. 잠금을 풀면 nil이 된다: `SNKRX/buy_screen.lua:763 «if not self.parent.locked then locked_state = nil end»`.
- 하나를 사면 그 칸만 nil로 다시 기록한다: `SNKRX/buy_screen.lua:1622 «self.parent.cards[self.i] = nil»`, `SNKRX/buy_screen.lua:1625 «locked_state = {locked = self.parent.locked»`.
- 전투가 끝날 때 잠겨 있지 않으면 지운다: `SNKRX/arena.lua:976 «if not self.lock then locked_state = nil end»`.
- 다음 상점에 처음 들어올 때만 잠긴 카드를 복원한다: `SNKRX/buy_screen.lua:358 «if first_call and locked_state then»`, `SNKRX/buy_screen.lua:61 «self.locked = locked_state and locked_state.locked»`.

**저장**
- `SNKRX/engine/system.lua:141 «shop_level = shop_level, shop_xp = shop_xp»`, `SNKRX/engine/system.lua:144 «love.filesystem.write("run_v4.txt", str)»`
- 불러올 때는 기본값을 채운다: `SNKRX/mainmenu.lua:109 «run.shop_level or 1, run.shop_xp or 0»`.

## 2. Space Station 14: 작물

**시드 데이터 필드** (`PlantComponent`)
- `space-station-14/Content.Shared/Botany/Components/PlantComponent.cs:30 «public int Yield;»`
- `…/PlantComponent.cs:36 «public float Lifespan;»`, `…/PlantComponent.cs:42 «OldAgeDamage = 4f»`
- `…/PlantComponent.cs:48 «public float Maturation;»`
- `…/PlantComponent.cs:54 «public float Production;»`
- `…/PlantComponent.cs:60 «public int GrowthStages = 6;»`
- `space-station-14/Content.Shared/Botany/Components/PlantHarvestComponent.cs:18 «HarvestRepeat = HarvestType.NoRepeat»`: `…/PlantHarvestComponent.cs:30 «NoRepeat,»`, `…/PlantHarvestComponent.cs:35 «Repeat,»`, `…/PlantHarvestComponent.cs:40 «SelfHarvest»`.
- `space-station-14/Resources/Prototypes/Hydroponics/plants.yml:60 «mutationPrototypes: [ MeatWheatPlants ]»`.

**예시 1: 밀** `plants.yml:50 «id: WheatPlants»`, `plants.yml:58 «packetPrototype: WheatSeeds»`, `plants.yml:59 «productPrototypes: [ WheatBushel ]»`, `plants.yml:62 «lifespan: 25»`, `plants.yml:63 «maturation: 6»`, `plants.yml:64 «production: 3»`, `plants.yml:65 «yield: 3»`.

**예시 2: 웃음콩** `plants.yml:251 «id: LaughinPeaPlants»`, `plants.yml:261 «mutationPrototypes: [ WorldPeaPlants ]»`, `plants.yml:264 «growthStages: 3»`, `plants.yml:265 «maturation: 7»`, `plants.yml:266 «production: 5»`, `plants.yml:270 «harvestRepeat: Repeat»`.

**성장: 실시간**
- `space-station-14/Content.Shared/Botany/Components/PlantHolderComponent.cs:87 «CycleDelay = TimeSpan.FromSeconds(15f)»`, `space-station-14/Content.Shared/Botany/Systems/PlantSystem.cs:132 «curTime < ent.Comp.LastCycle + ent.Comp.CycleDelay»`.
- `space-station-14/Content.Shared/Botany/Systems/PlantGrowthSystem.cs:55 «random.Prob(0.8f)»`, `…/PlantGrowthSystem.cs:56 «AdjustsAge((plantUid, holder), 1)»`.
- `…/PlantSystem.cs:299 «growthStage = (int)(plantHolder.Age * ent.Comp.GrowthStages / ent.Comp.Maturation)»`.
- `…/PlantHarvestSystem.cs:43 «timeLastHarvest > plant.Production»`, `…/PlantHarvestSystem.cs:137 «_plant.RemovePlant(ent.Owner)»`.

**자판기 재고** `seeds.yml:3 «startingInventory:»`, `seeds.yml:39 «WheatSeeds: 5»`, `seeds.yml:4 «AloeSeeds: 3»`, `seeds.yml:41 «contrabandInventory:»`, `seeds.yml:44 «FlyAmanitaSeeds: 1»`.

**재입고** `SharedVendingMachineSystem.Eject.cs:168 «entry.Amount--;»`, `SharedVendingMachineSystem.Eject.cs:153 «if (entry.Amount <= 0)»`, `VendingMachineRestockComponent.cs:16 «RestockDelay = TimeSpan.FromSeconds(5.0f)»`, `SharedVendingMachineSystem.Restock.cs:79 «TryRestockInventory(ent, ent.Comp);»`, `SharedVendingMachineSystem.cs:219 «Math.Min(entry.Amount + amount, 3 * restock)»`, `SharedVendingMachineSystem.cs:204 «var chanceOfMissingStock = 1 - restockQuality;»`.

## 우리에게 옮길 것 (보조 에이전트 제안)
- 매대 3칸, 칸마다 두 단계 뽑기(희귀도 가중치 → 그 희귀도 안에서 균등). 확률표는 `매대레벨 → [흔함, 고급, 희귀, 전설]`.
- 매대 레벨은 판 수로만 오른다(SNKRX 자동 경험치 규칙만).
- 재고 `품목ID: 수량`, 0이면 "다음 판 뒤 입고", 입고는 판 종료 이벤트.
- 잠금: 칸 ID 배열, 다음 판 첫 진입 때만 복원, 산 칸은 null.
- 작물: `growthStages, maturation, production, lifespan, yield, harvestRepeat, mutations[]`, 틱 → 판.

## 옮기면 안 되는 것
- 골드로 다시 굴리기·경험치 사기·레벨 내리기(뽑기 확률에 돈이 닿는다).
- 실시간 15초 사이클과 80% 확률 성장.
- 재입고 품질에 따른 무작위 결손.
- SS14 고유 콘텐츠·에셋(에셋 라이선스 미확인).
