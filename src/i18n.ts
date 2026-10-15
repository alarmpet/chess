export type Language = 'ko' | 'en';

export interface Translations {
  brandTitle: string;
  turnWhite: string;
  turnBlack: string;
  checkSuffix: string;
  aiThinkingSuffix: string;
  stalemate: string;
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
  whiteColor: string;
  blackColor: string;
  langSwitchLabel: string;
}

const translations: Record<Language, Translations> = {
  ko: {
    brandTitle: '위저드 체스 3D',
    turnWhite: '백 차례',
    turnBlack: '흑 차례',
    checkSuffix: '(체크!)',
    aiThinkingSuffix: '(AI 생각 중...)',
    stalemate: '스테일메이트 — 무승부',
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
    camWide: '성당 전경',
    displayAndGestures: '화면 및 제스처',
    hideUi: 'UI 숨기기 [H]',
    showUi: 'UI 보이기 [H]',
    showUiMobile: 'UI 표시',
    desktopHint: '조작법: 말을 클릭하여 이동 • 좌클릭 드래그: 회전 • 우클릭 드래그: 이동 • 마우스 휠: 줌 • WASD+R/F: 비행 카메라 • H: UI 숨김',
    mobileHint: '터치 조작: 말 터치 이동 • 한 손가락: 회전 • 두 손가락: 화면 이동 • 핀치: 줌 확대/축소',
    judgment: '✦   성소의 심판   ✦',
    checkmateTitle: '체크메이트',
    whiteTriumphs: '백의 승리 • 흑의 킹이 쓰러졌습니다',
    blackTriumphs: '흑의 승리 • 백의 킹이 쓰러졌습니다',
    replayFall: '킹 쓰러짐 다시보기',
    dismiss: '닫기',
    loadingTitle: '위저드 체스 3D',
    loadingSub: '성당 성소 건축물과 조각상을 소환하는 중...',
    loadingCathedral: '성당 건축물 로드 완료...',
    loadingPiece: (piece: string) => `${piece} 석상 소환 완료...`,
    whiteColor: '백',
    blackColor: '흑',
    langSwitchLabel: 'English',
  },
  en: {
    brandTitle: 'Wizard Chess',
    turnWhite: 'White to Move',
    turnBlack: 'Black to Move',
    checkSuffix: '(Check!)',
    aiThinkingSuffix: '(AI)...',
    stalemate: 'Stalemate — Draw',
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
    camWide: 'Cathedral',
    displayAndGestures: 'Display & Gestures',
    hideUi: 'Hide UI [H]',
    showUi: 'Show UI [H]',
    showUiMobile: 'Show UI',
    desktopHint: 'Controls: Click Piece to Move • Left-Drag: Orbit • Right-Drag: Pan • Scroll: Zoom • WASD + R/F: Fly Cam • H: Hide UI',
    mobileHint: 'Touch: Tap Piece to Move • 1-Finger Drag: Orbit • 2-Finger Drag: Pan • Pinch: Zoom',
    judgment: '✦   Sanctum Judgment   ✦',
    checkmateTitle: 'Checkmate',
    whiteTriumphs: 'White Triumphs • The Black King Has Fallen',
    blackTriumphs: 'Black Triumphs • The White King Has Fallen',
    replayFall: 'Replay King Fall',
    dismiss: 'Dismiss',
    loadingTitle: 'Wizard Chess',
    loadingSub: 'Summoning Sanctum Architecture & Sculpted Pieces...',
    loadingCathedral: 'Cathedral Architecture Loaded...',
    loadingPiece: (piece: string) => `Summoned ${piece} Statue...`,
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
