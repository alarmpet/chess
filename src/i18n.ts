export type Language = 'ko' | 'en';

export interface Translations {
  brandTitle: string;
  turnWhite: string;
  turnBlack: string;
  checkSuffix: string;
  aiThinkingSuffix: string;
  stalemate: string;
  drawBy: (reason: string) => string;
  checkmateWin: (winner: string) => string;
  playingAsWhite: string;
  playingAsBlack: string;
  playAsWhite: string;
  playAsBlack: string;
  aiMove: string;
  newGame: string;
  controls: string;
  close: string;
  gameActions: string;
  cameraViews: string;
  cameraSub: string;
  camPlayer: string;
  camTop: string;
  camSide: string;
  camWide: string;
  displayAndGestures: string;
  hideUi: string;
  showUi: string;
  showUiMobile: string;
  desktopHint: string;
  mobileHint: string;
  judgment: string;
  checkmateTitle: string;
  whiteTriumphs: string;
  blackTriumphs: string;
  replayFall: string;
  dismiss: string;
  loadingTitle: string;
  loadingSub: string;
  loadingCathedral: string;
  loadingPiece: (piece: string) => string;
  drawTitle: string;
  whiteColor: string;
  blackColor: string;
  langSwitchLabel: string;
}

const translations: Record<Language, Translations> = {
  ko: {
    brandTitle: 'WILD CROWN',
    turnWhite: '백 차례',
    turnBlack: '흑 차례',
    checkSuffix: '(체크!)',
    aiThinkingSuffix: '(AI 생각 중...)',
    stalemate: '스테일메이트 — 무승부',
    drawBy: (reason: string) =>
      reason === 'threefold' ? '3회 반복 — 무승부' : reason === 'insufficient' ? '기물 부족 — 무승부' : reason === 'fifty' ? '50수 규칙 — 무승부' : '무승부',
    checkmateWin: (winner: string) => `체크메이트 — ${winner} 승리`,
    playingAsWhite: '백으로 플레이 중',
    playingAsBlack: '흑으로 플레이 중',
    playAsWhite: '백으로 플레이',
    playAsBlack: '흑으로 플레이',
    aiMove: 'AI 수 두기',
    newGame: '새 게임',
    controls: '컨트롤',
    close: '닫기 ✕',
    gameActions: '게임 기능',
    cameraViews: '카메라 시점',
    cameraSub: '현재 시점 다시 누르면 반전',
    camPlayer: '플레이어 시점',
    camTop: '수직 시점',
    camSide: '측면 시점',
    camWide: '전체 보기',
    displayAndGestures: '화면 및 제스처',
    hideUi: 'UI 숨기기 [H]',
    showUi: 'UI 보이기 [H]',
    showUiMobile: 'UI 표시',
    desktopHint: '조작법: 말을 클릭하여 이동 • 좌클릭 드래그: 회전 • 우클릭 드래그: 이동 • 마우스 휠: 줌 • WASD+R/F: 비행 카메라 • H: UI 숨김',
    mobileHint: '터치 조작: 말 터치 이동 • 한 손가락: 회전 • 두 손가락: 화면 이동 • 핀치: 줌 확대/축소',
    judgment: '왕관 승부 끝!',
    checkmateTitle: '체크메이트',
    whiteTriumphs: '백 승리! 흑의 사자가 항복했어요',
    blackTriumphs: '흑 승리! 백의 사자가 항복했어요',
    replayFall: '항복 장면 다시보기',
    dismiss: '닫기',
    loadingTitle: 'WILD CROWN',
    loadingSub: '동물 친구들을 깨우는 중...',
    loadingCathedral: '숲 준비 완료...',
    loadingPiece: () => '동물 친구가 일어났어요...',
    drawTitle: '무승부',
    whiteColor: '백',
    blackColor: '흑',
    langSwitchLabel: 'English',
  },
  en: {
    brandTitle: 'WILD CROWN',
    turnWhite: 'White to Move',
    turnBlack: 'Black to Move',
    checkSuffix: '(Check!)',
    aiThinkingSuffix: '(AI)...',
    stalemate: 'Stalemate — Draw',
    drawBy: (reason: string) =>
      reason === 'threefold' ? 'Threefold repetition — Draw' : reason === 'insufficient' ? 'Insufficient material — Draw' : reason === 'fifty' ? 'Fifty-move rule — Draw' : 'Draw',
    checkmateWin: (winner: string) => `Checkmate — ${winner} Wins`,
    playingAsWhite: 'Playing as White',
    playingAsBlack: 'Playing as Black',
    playAsWhite: 'Play as White',
    playAsBlack: 'Play as Black',
    aiMove: 'AI Move',
    newGame: 'New Game',
    controls: 'Controls',
    close: 'Close ✕',
    gameActions: 'Game Actions',
    cameraViews: 'Camera Views',
    cameraSub: 'Tap active view to flip',
    camPlayer: 'Player Cam',
    camTop: 'Overhead',
    camSide: 'Side',
    camWide: 'Full View',
    displayAndGestures: 'Display & Gestures',
    hideUi: 'Hide UI [H]',
    showUi: 'Show UI [H]',
    showUiMobile: 'Show UI',
    desktopHint: 'Controls: Click Piece to Move • Left-Drag: Orbit • Right-Drag: Pan • Scroll: Zoom • WASD + R/F: Fly Cam • H: Hide UI',
    mobileHint: 'Touch: Tap Piece to Move • 1-Finger Drag: Orbit • 2-Finger Drag: Pan • Pinch: Zoom',
    judgment: 'Crown match over!',
    checkmateTitle: 'Checkmate',
    whiteTriumphs: 'White wins! The black lion gives up',
    blackTriumphs: 'Black wins! The white lion gives up',
    replayFall: 'Replay the finish',
    dismiss: 'Dismiss',
    loadingTitle: 'WILD CROWN',
    loadingSub: 'Waking the animals...',
    loadingCathedral: 'The forest is ready...',
    loadingPiece: () => 'An animal woke up...',
    drawTitle: 'Draw',
    whiteColor: 'White',
    blackColor: 'Black',
    langSwitchLabel: '한국어',
  },
};

const STORAGE_KEY = 'wizard_chess_lang';

export function getInitialLanguage(): Language {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (saved === 'ko' || saved === 'en') return saved;
  // Default is Korean as requested
  return 'ko';
}

let currentLang: Language = getInitialLanguage();
const listeners = new Set<(lang: Language) => void>();

export function getCurrentLang(): Language {
  return currentLang;
}

export function getTranslations(lang: Language = currentLang): Translations {
  return translations[lang];
}

export function setAppLanguage(lang: Language): void {
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Ignore storage errors in restricted iframes
  }
  listeners.forEach((cb) => {
    try {
      cb(lang);
    } catch (e) {
      console.error(e);
    }
  });

  // Notify window engine if active
  const win = window as unknown as { wizardChess?: { onLanguageChanged?: (lang: Language) => void } };
  if (win.wizardChess?.onLanguageChanged) {
    win.wizardChess.onLanguageChanged(lang);
  }
}

export function subscribeLanguage(cb: (lang: Language) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
