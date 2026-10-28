// Native Web Speech API Text-to-Speech Synthesizer for Lexicon Chess
// Provides authentic American/British English pronunciation with zero external audio assets.

class LexiconTTS {
  private enabled: boolean = true;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isSpeaking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoice();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoice();
      };
    }
  }

  private initVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer English voices (en-US, en-GB)
    this.selectedVoice =
      voices.find((v) => v.lang.startsWith('en-US') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('Samantha'))) ||
      voices.find((v) => v.lang.startsWith('en-US')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null;
  }

  public toggleTTS(): boolean {
    this.enabled = !this.enabled;
    if (!this.enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return this.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public speak(word: string, rate: number = 0.9, pitch: number = 1.0) {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const cleanWord = word.replace(/[^a-zA-Z\s]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanWord);
      utterance.lang = 'en-US';
      utterance.rate = rate; // Slightly deliberate for clear learning
      utterance.pitch = pitch;

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      this.isSpeaking = true;
      utterance.onend = () => {
        this.isSpeaking = false;
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  }
}

export const lexiconTTS = new LexiconTTS();
