import { LEXICON_WORDS, LexiconWord } from './lexiconData';
import { lexiconTTS } from './lexiconTTS';
import { arcaneAudio } from './arcaneAudio';

export interface DuelContext {
  title?: string;
  subtitle?: string;
  attackerName?: string;
  defenderName?: string;
  onComplete?: (success: boolean) => void;
}

export interface LexiconState {
  isDuelActive: boolean;
  currentWord: LexiconWord | null;
  shuffledOptions: string[];
  selectedOption: string | null;
  isAnswered: boolean;
  isCorrect: boolean;
  streak: number;
  totalMastered: number;
  learnedSessionWordIds: string[];
  isGrimoireOpen: boolean;
  ttsEnabled: boolean;
}

type LexiconListener = (state: LexiconState) => void;

class LexiconEngine {
  public isDuelActive: boolean = false;
  public currentWord: LexiconWord | null = null;
  public shuffledOptions: string[] = [];
  public selectedOption: string | null = null;
  public isAnswered: boolean = false;
  public isCorrect: boolean = false;
  public streak: number = 0;
  public masteredWordIds: Set<string> = new Set();
  public learnedSessionWordIds: string[] = [];
  public isGrimoireOpen: boolean = false;

  private currentContext: DuelContext | null = null;
  private listeners: LexiconListener[] = [];

  constructor() {
    this.loadMastery();
  }

  private loadMastery() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('lexicon_chess_mastery');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.mastered)) {
            this.masteredWordIds = new Set(parsed.mastered);
          }
          if (typeof parsed.streak === 'number') {
            this.streak = parsed.streak;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load lexicon mastery:', e);
    }
  }

  private saveMastery() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const payload = {
          mastered: Array.from(this.masteredWordIds),
          streak: this.streak
        };
        localStorage.setItem('lexicon_chess_mastery', JSON.stringify(payload));
      }
    } catch (e) {
      console.warn('Failed to save lexicon mastery:', e);
    }
  }

  public subscribe(fn: LexiconListener): () => void {
    this.listeners.push(fn);
    this.notify();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    const st = this.getState();
    for (const l of this.listeners) l(st);
  }

  public getState(): LexiconState {
    return {
      isDuelActive: this.isDuelActive,
      currentWord: this.currentWord,
      shuffledOptions: [...this.shuffledOptions],
      selectedOption: this.selectedOption,
      isAnswered: this.isAnswered,
      isCorrect: this.isCorrect,
      streak: this.streak,
      totalMastered: this.masteredWordIds.size,
      learnedSessionWordIds: [...this.learnedSessionWordIds],
      isGrimoireOpen: this.isGrimoireOpen,
      ttsEnabled: lexiconTTS.isEnabled()
    };
  }

  public toggleGrimoire(force?: boolean) {
    this.isGrimoireOpen = force !== undefined ? force : !this.isGrimoireOpen;
    this.notify();
  }

  public toggleTTS(): boolean {
    const enabled = lexiconTTS.toggleTTS();
    this.notify();
    return enabled;
  }

  // Trigger a Word Duel with an educational question
  public triggerDuel(context: DuelContext = {}, targetWordId?: string) {
    let word: LexiconWord;
    if (targetWordId) {
      word = LEXICON_WORDS.find((w) => w.id === targetWordId) || LEXICON_WORDS[0];
    } else {
      // Prioritize unmastered words or pick random
      const unmastered = LEXICON_WORDS.filter((w) => !this.masteredWordIds.has(w.id));
      const pool = unmastered.length > 0 ? unmastered : LEXICON_WORDS;
      word = pool[Math.floor(Math.random() * pool.length)];
    }

    this.currentWord = word;
    this.currentContext = context;
    this.isDuelActive = true;
    this.selectedOption = null;
    this.isAnswered = false;
    this.isCorrect = false;

    // Shuffle multiple choice options
    this.shuffledOptions = [...word.options].sort(() => Math.random() - 0.5);

    // Track word in session
    if (!this.learnedSessionWordIds.includes(word.id)) {
      this.learnedSessionWordIds.push(word.id);
    }

    // Pronounce the word via Web Speech API
    lexiconTTS.speak(word.word);

    this.notify();
  }

  public answerDuel(option: string) {
    if (!this.currentWord || this.isAnswered) return;

    this.selectedOption = option;
    this.isAnswered = true;
    const correct = option === this.currentWord.meaningKo;
    this.isCorrect = correct;

    if (correct) {
      this.streak += 1;
      this.masteredWordIds.add(this.currentWord.id);
      this.saveMastery();

      // Audio & Mana reward
      arcaneAudio.playAscend();
      const win = window as any;
      if (win.__arcaneEngine) {
        win.__arcaneEngine.currentMana = Math.min(
          win.__arcaneEngine.maxMana,
          win.__arcaneEngine.currentMana + 1
        );
        win.__arcaneEngine.bannerMessage = `✦ 어휘 해독 성공! (+1 마나 획득 / ${this.streak}연속 정답)`;
        win.__arcaneEngine.notify?.();
      }
    } else {
      this.streak = 0;
      this.saveMastery();
    }

    this.notify();

    // Auto-resolve duel after brief review of etymology breakdown
    setTimeout(() => {
      this.closeDuel();
    }, 1800);
  }

  public closeDuel() {
    const success = this.isCorrect;
    const cb = this.currentContext?.onComplete;
    this.isDuelActive = false;
    this.currentWord = null;
    this.currentContext = null;
    this.notify();

    if (cb) {
      cb(success);
    }
  }

  public replayWordAudio(wordText?: string) {
    const text = wordText || this.currentWord?.word;
    if (text) {
      lexiconTTS.speak(text);
    }
  }
}

export const lexiconEngine = new LexiconEngine();
(window as any).__lexiconEngine = lexiconEngine;
