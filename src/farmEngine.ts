import { CROPS, CropDef, FACILITIES, FacilityDef, CHESS_LOOT } from './farmData';
import { farmAudio } from './farmAudio';

export interface FarmPlot {
  id: number;
  cropId: string | null;
  stage: 0 | 1 | 2 | 3; // 0: seed, 1: sprout, 2: growing, 3: harvestable
  growthProgress: number; // 0 to 100
  isWatered: boolean;
  plantedAt: number;
}

export interface FarmState {
  gold: number;
  gems: number;
  plots: FarmPlot[];
  seeds: Record<string, number>;
  harvested: Record<string, number>;
  facilities: Record<string, boolean>;
  activeBuffs: {
    manaBonus: number;
    goldMultiplier: number;
    kingRevive: boolean;
    meteorCross: boolean;
  };
  isGardenView: boolean;
  isShopOpen: boolean;
  isBarnOpen: boolean;
  selectedSeedId: string | null;
  lootNotification: string | null;
}

type FarmListener = (state: FarmState) => void;

class FarmEngine {
  public gold: number = 120;
  public gems: number = 5;
  public plots: FarmPlot[] = [];
  public seeds: Record<string, number> = {
    mana_grape: 2,
    golden_wheat: 4,
    flame_pepper: 1,
    sacred_herb: 1
  };
  public harvested: Record<string, number> = {};
  public facilities: Record<string, boolean> = {
    fountain: false,
    apiary: false,
    scarecrow: false
  };
  public activeBuffs = {
    manaBonus: 0,
    goldMultiplier: 1.0,
    kingRevive: false,
    meteorCross: false
  };
  public isGardenView: boolean = false;
  public isShopOpen: boolean = false;
  public isBarnOpen: boolean = false;
  public selectedSeedId: string | null = 'golden_wheat';
  public lootNotification: string | null = null;

  private listeners: FarmListener[] = [];
  private tickTimer: any = null;

  constructor() {
    this.initPlots();
    this.loadState();
    this.startGrowthLoop();
  }

  private initPlots() {
    this.plots = Array.from({ length: 9 }, (_, i) => ({
      id: i,
      cropId: null,
      stage: 0,
      growthProgress: 0,
      isWatered: false,
      plantedAt: 0
    }));
  }

  private loadState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('sanctuary_farm_save');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.gold === 'number') this.gold = parsed.gold;
          if (typeof parsed.gems === 'number') this.gems = parsed.gems;
          if (Array.isArray(parsed.plots)) this.plots = parsed.plots;
          if (parsed.seeds) this.seeds = { ...this.seeds, ...parsed.seeds };
          if (parsed.harvested) this.harvested = parsed.harvested;
          if (parsed.facilities) this.facilities = { ...this.facilities, ...parsed.facilities };
          if (parsed.activeBuffs) this.activeBuffs = { ...this.activeBuffs, ...parsed.activeBuffs };
        }
      }
    } catch (e) {
      console.warn('Failed to load farm save:', e);
    }
  }

  public saveState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const payload = {
          gold: this.gold,
          gems: this.gems,
          plots: this.plots,
          seeds: this.seeds,
          harvested: this.harvested,
          facilities: this.facilities,
          activeBuffs: this.activeBuffs
        };
        localStorage.setItem('sanctuary_farm_save', JSON.stringify(payload));
      }
    } catch (e) {
      console.warn('Failed to save farm:', e);
    }
  }

  public subscribe(fn: FarmListener): () => void {
    this.listeners.push(fn);
    this.notify();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public notify() {
    const st = this.getState();
    for (const l of this.listeners) l(st);
  }

  public getState(): FarmState {
    return {
      gold: this.gold,
      gems: this.gems,
      plots: this.plots.map((p) => ({ ...p })),
      seeds: { ...this.seeds },
      harvested: { ...this.harvested },
      facilities: { ...this.facilities },
      activeBuffs: { ...this.activeBuffs },
      isGardenView: this.isGardenView,
      isShopOpen: this.isShopOpen,
      isBarnOpen: this.isBarnOpen,
      selectedSeedId: this.selectedSeedId,
      lootNotification: this.lootNotification
    };
  }

  public toggleGardenView(force?: boolean) {
    this.isGardenView = force !== undefined ? force : !this.isGardenView;
    this.notify();

    // Trigger Three.js camera transition via window hook if available
    const win = window as any;
    if (win.__toggleGardenCamera) {
      win.__toggleGardenCamera(this.isGardenView);
    }
  }

  public toggleShop(open?: boolean) {
    this.isShopOpen = open !== undefined ? open : !this.isShopOpen;
    this.notify();
  }

  public toggleBarn(open?: boolean) {
    this.isBarnOpen = open !== undefined ? open : !this.isBarnOpen;
    this.notify();
  }

  public selectSeed(seedId: string) {
    this.selectedSeedId = seedId;
    this.notify();
  }

  // --- Real-Time Growth & Chess Integration Loop ---

  private startGrowthLoop() {
    if (typeof window === 'undefined') return;
    this.tickTimer = setInterval(() => {
      let changed = false;
      const speedMultiplier = this.facilities.apiary ? 1.5 : 1.0;

      for (const plot of this.plots) {
        if (!plot.cropId || plot.stage === 3) continue;

        // Golden Fountain auto-waters
        if (this.facilities.fountain && !plot.isWatered) {
          plot.isWatered = true;
          changed = true;
        }

        if (plot.isWatered) {
          const crop = CROPS[plot.cropId];
          if (crop) {
            const growthRate = (100 / crop.growthTimeSeconds) * speedMultiplier;
            plot.growthProgress = Math.min(100, plot.growthProgress + growthRate);

            const oldStage = plot.stage;
            if (plot.growthProgress >= 100) {
              plot.stage = 3; // Harvestable!
            } else if (plot.growthProgress >= 60) {
              plot.stage = 2; // Growing
            } else if (plot.growthProgress >= 25) {
              plot.stage = 1; // Sprout
            }

            if (oldStage !== plot.stage) {
              changed = true;
            }
          }
        }
      }

      if (changed) {
        this.saveState();
        this.notify();
      }
    }, 1000);
  }

  // Every chess move made in the game advances all crops instantly!
  public onChessMoveAdvance() {
    let changed = false;
    for (const plot of this.plots) {
      if (!plot.cropId || plot.stage === 3) continue;
      const crop = CROPS[plot.cropId];
      if (crop) {
        const bonus = crop.growthPerChessMove * (this.facilities.apiary ? 1.4 : 1.0);
        plot.growthProgress = Math.min(100, plot.growthProgress + bonus);

        if (plot.growthProgress >= 100) plot.stage = 3;
        else if (plot.growthProgress >= 60) plot.stage = 2;
        else if (plot.growthProgress >= 25) plot.stage = 1;
        changed = true;
      }
    }
    if (changed) {
      this.saveState();
      this.notify();
    }
  }

  // --- Plot Actions ---

  public plantSeed(plotIdx: number, seedId: string): boolean {
    const plot = this.plots[plotIdx];
    if (!plot || plot.cropId) return false;

    const count = this.seeds[seedId] || 0;
    if (count <= 0) return false;

    this.seeds[seedId] = count - 1;
    plot.cropId = seedId;
    plot.stage = 0;
    plot.growthProgress = 0;
    plot.isWatered = this.facilities.fountain ? true : false;
    plot.plantedAt = Date.now();

    farmAudio.playPlant();
    this.saveState();
    this.notify();

    // Notify 3D mesh renderer
    const win = window as any;
    win.__updatePlotMesh?.(plotIdx, plot);
    return true;
  }

  public waterPlot(plotIdx: number): boolean {
    const plot = this.plots[plotIdx];
    if (!plot || !plot.cropId || plot.isWatered) return false;

    plot.isWatered = true;
    farmAudio.playWater();
    this.saveState();
    this.notify();

    const win = window as any;
    win.__updatePlotMesh?.(plotIdx, plot);
    return true;
  }

  public harvestPlot(plotIdx: number): boolean {
    const plot = this.plots[plotIdx];
    if (!plot || !plot.cropId || plot.stage !== 3) return false;

    const cropId = plot.cropId;
    const crop = CROPS[cropId];
    if (!crop) return false;

    // Check Scarecrow 25% double yield perk
    let yieldAmount = 1;
    if (this.facilities.scarecrow && Math.random() < 0.25) {
      yieldAmount = 2;
    }

    this.harvested[cropId] = (this.harvested[cropId] || 0) + yieldAmount;

    // Reset plot
    plot.cropId = null;
    plot.stage = 0;
    plot.growthProgress = 0;
    plot.isWatered = false;

    farmAudio.playHarvest();

    // Trigger crop buff application
    this.applyCropBuff(cropId);

    this.saveState();
    this.notify();

    // Notify 3D mesh renderer & trigger particle sparkle
    const win = window as any;
    win.__updatePlotMesh?.(plotIdx, plot);
    win.__triggerHarvestParticles?.(plotIdx);
    return true;
  }

  private applyCropBuff(cropId: string) {
    if (cropId === 'mana_grape') {
      this.activeBuffs.manaBonus = Math.min(2, this.activeBuffs.manaBonus + 1);
      // Upgrade Arcane max mana
      const win = window as any;
      if (win.__arcaneEngine) {
        win.__arcaneEngine.maxMana = 3 + this.activeBuffs.manaBonus;
        win.__arcaneEngine.currentMana = win.__arcaneEngine.maxMana;
        win.__arcaneEngine.notify?.();
      }
      this.showLootNotification(`🍇 아케인 마나 포도 수확! 체스 최대 마나가 +1 증가했습니다! (현재 ${3 + this.activeBuffs.manaBonus})`);
    } else if (cropId === 'golden_wheat') {
      this.activeBuffs.goldMultiplier = 1.5;
      this.showLootNotification('🌾 황금 밀 수확! 다음 대국에서 코인 획득량이 1.5배 증가합니다!');
    } else if (cropId === 'flame_pepper') {
      this.activeBuffs.meteorCross = true;
      this.showLootNotification('🌶️ 화로 불꽃 고추 수확! 메테오 마법의 폭발 범위가 십자형으로 확대되었습니다!');
    } else if (cropId === 'sacred_herb') {
      this.activeBuffs.kingRevive = true;
      this.showLootNotification('🌿 성스러운 생명초 수확! 킹이 1회 치명상을 막아내는 부활의 영약을 획득했습니다!');
    } else if (cropId === 'amethyst_gourd') {
      this.gold += 160;
      this.showLootNotification('🎃 자수정 보석 호박 판매 완료! +160 Gold 획득!');
    }
  }

  // --- Shop & Purchases ---

  public buySeed(seedId: string): boolean {
    const crop = CROPS[seedId];
    if (!crop || this.gold < crop.seedCost) return false;

    this.gold -= crop.seedCost;
    this.seeds[seedId] = (this.seeds[seedId] || 0) + 1;

    farmAudio.playBuy();
    this.saveState();
    this.notify();
    return true;
  }

  public buyFacility(facilityId: string): boolean {
    const fac = FACILITIES[facilityId];
    if (!fac || this.facilities[facilityId] || this.gold < fac.cost) return false;

    this.gold -= fac.cost;
    this.facilities[facilityId] = true;

    farmAudio.playBuy();
    this.saveState();
    this.notify();

    const win = window as any;
    win.__updateFacility3D?.(facilityId);
    return true;
  }

  public sellHarvested(cropId: string, count: number = 1): boolean {
    const crop = CROPS[cropId];
    const owned = this.harvested[cropId] || 0;
    if (!crop || owned < count) return false;

    this.harvested[cropId] = owned - count;
    this.gold += crop.sellPrice * count;

    farmAudio.playCoin();
    this.saveState();
    this.notify();
    return true;
  }

  // --- Chess Rewards Integration ---

  public awardChessPieceCapture(pieceType: string) {
    const baseGold = (CHESS_LOOT as any)[pieceType] || 20;
    const finalGold = Math.round(baseGold * this.activeBuffs.goldMultiplier);
    this.gold += finalGold;

    farmAudio.playCoin();
    this.onChessMoveAdvance(); // Crops grow on capture!

    this.showLootNotification(`+${finalGold} Gold 획득! (${pieceType.toUpperCase()} 처치) | 🌱 작물 성장 가속!`);
    this.saveState();
    this.notify();
  }

  public awardCheckmateVictory() {
    const winGold = Math.round(CHESS_LOOT.checkmateWin * this.activeBuffs.goldMultiplier);
    this.gold += winGold;
    this.gems += CHESS_LOOT.checkmateGems;

    // Award bonus seed
    const seedKeys = Object.keys(CROPS);
    const bonusSeed = seedKeys[Math.floor(Math.random() * seedKeys.length)];
    this.seeds[bonusSeed] = (this.seeds[bonusSeed] || 0) + 1;

    farmAudio.playBuy();
    this.showLootNotification(`✦ 체크메이트 대승리! +${winGold} Gold, +3 Gems, [${CROPS[bonusSeed].name}] 획득!`);
    this.saveState();
    this.notify();
  }

  public showLootNotification(msg: string) {
    this.lootNotification = msg;
    this.notify();
    setTimeout(() => {
      if (this.lootNotification === msg) {
        this.lootNotification = null;
        this.notify();
      }
    }, 3200);
  }
}

export const farmEngine = new FarmEngine();
(window as any).__farmEngine = farmEngine;
