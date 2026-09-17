class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private isEnabled: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.isEnabled = true;
    }
  }

  public speak(text: string, onEnd?: () => void, onError?: () => void): boolean {
    if (!this.isEnabled || !this.synth) {
      console.warn('SpeechSynthesis bu tarayıcıda desteklenmiyor.');
      return false;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.95; // Slightly slower for 5th graders to comprehend clearly
    utterance.pitch = 1.0;

    // Pick best Turkish voice if available
    const voices = this.synth.getVoices();
    const turkishVoice = voices.find(v => v.lang.startsWith('tr') || v.lang === 'tr_TR');
    if (turkishVoice) {
      utterance.voice = turkishVoice;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Seslendirme hatası:', e);
      if (onError) onError();
    };

    this.synth.speak(utterance);
    return true;
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking);
  }
}

export const speechService = new SpeechService();
