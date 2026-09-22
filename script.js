// ============ 기본 세팅 ============
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// 스무딩을 끄면 도트 그래픽(사각형)엔 영향 없지만, 업로드된 커스텀 이미지(사진/일러스트)를
// 축소해서 그릴 때 계단 현상이 심하게 나타나 "이미지가 깨져 보인다"는 문제가 생긴다.
// 캔버스 자체는 CSS로 확대되지 않으므로(표시 크기 = 실제 해상도) 스무딩을 켜둬도 도트 그림엔 문제없다.
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

const TILE = 40;
const COLS = 20, ROWS = 13;

// ============ 게임 모드 ============
let gameMode = 'normal'; // 'normal' | 'idle'

// ============ 테마 시스템 ============
// 텍스트로 쓰이는 색상(textDim/accent/accent2/good/bad)은 패널/배경(bg/panel/panel2) 위에 놓였을 때
// WCAG AA 기준(일반 텍스트 4.5:1)을 만족하도록 명도를 조정한 값이다. 원래의 파스텔 톤은
// 밝은 테마에서 1.4~3.7:1 수준으로 대비가 부족해 저시력 사용자가 읽기 어려웠다.
// accentFill/goodFill/badFill은 반대로 "고정된 흰색/검정 글자를 올리는 버튼 배경"으로 쓰일 때를 위한
// 별도 색상이다(예: 탭 활성화 배경 + 검정 글자, 버튼 배경 + 흰 글자) - 텍스트용 색과 밝기 방향이 반대라
// 같은 변수를 재사용하면 한쪽이 항상 깨지기 때문에 분리했다.
// 카드(panel)는 대부분의 밝은 테마에서 흰색으로 통일하고, 테마마다 배경 색조와 포인트색만
// 바꾸는 방식(토스 등 최신 앱들의 흔한 테마 구성)이라 테마를 바꿔도 UI 언어가 일관되게 유지된다.
// 다크 테마만 예외로 카드 자체도 어둡다. accent/good/bad는 흰 카드 위에서 4.5:1 이상을 확보한
// 값이고, accentFill/goodFill/badFill은 흰 글자를 얹는 버튼 배경이라 그만큼 더 진하게 잡았다.
const THEMES = {
  white:  { label:'크림', swatch:'#fff1e0', vars: { bg:'#fff8f0', panel:'#ffffff', panel2:'#fff1e0', border:'#f3e6d6', borderStrong:'#ffb88c', text:'#4a3f35', textDim:'#8a7c6c', accent:'#c2410c', accent2:'#ea580c', good:'#15803d', bad:'#dc2626', accentFill:'#ea580c', goodFill:'#16a34a', badFill:'#dc2626', floor1:'#e8ddc8', floor2:'#ddd0b6' } },
  sky:    { label:'하늘색', swatch:'#bfe3f5', vars: { bg:'#eef7fd', panel:'#ffffff', panel2:'#e3f3fc', border:'#d6ecf9', borderStrong:'#7cc5ef', text:'#1e4a63', textDim:'#5c7f92', accent:'#0369a1', accent2:'#0284c7', good:'#15803d', bad:'#dc2626', accentFill:'#0284c7', goodFill:'#16a34a', badFill:'#dc2626', floor1:'#cfeaf6', floor2:'#bfe1f2' } },
  pink:   { label:'분홍색', swatch:'#f6cddc', vars: { bg:'#fef0f6', panel:'#ffffff', panel2:'#fde5ef', border:'#fbd4e6', borderStrong:'#f68fbb', text:'#6b2049', textDim:'#a4677f', accent:'#be185d', accent2:'#db2777', good:'#15803d', bad:'#dc2626', accentFill:'#db2777', goodFill:'#16a34a', badFill:'#dc2626', floor1:'#fbdce7', floor2:'#f6cfdd' } },
  yellow: { label:'노란색', swatch:'#f8e3a0', vars: { bg:'#fefaea', panel:'#ffffff', panel2:'#fdf3d4', border:'#fbe9b8', borderStrong:'#f0c94a', text:'#78350f', textDim:'#92703a', accent:'#b45309', accent2:'#d97706', good:'#15803d', bad:'#dc2626', accentFill:'#d97706', goodFill:'#16a34a', badFill:'#dc2626', floor1:'#f9edc0', floor2:'#f5e5ab' } },
  green:  { label:'연두색', swatch:'#cdeab8', vars: { bg:'#f0faed', panel:'#ffffff', panel2:'#e5f7e0', border:'#d3edca', borderStrong:'#7ecf6a', text:'#166534', textDim:'#4d7a3f', accent:'#15803d', accent2:'#16a34a', good:'#15803d', bad:'#dc2626', accentFill:'#16a34a', goodFill:'#16a34a', badFill:'#dc2626', floor1:'#dcf0cb', floor2:'#cfe9b8' } },
  dark:   { label:'다크', swatch:'#2a2440', vars: { bg:'#1e1b2e', panel:'#282442', panel2:'#332c52', border:'#3d3560', borderStrong:'#5c4f8a', text:'#f5f3fa', textDim:'#b3a9cc', accent:'#ffb088', accent2:'#ffd0ae', good:'#7ee0a8', bad:'#ff8f8f', accentFill:'#ff8b5e', goodFill:'#22c55e', badFill:'#ef4444', floor1:'#5c4a3a', floor2:'#4a3c2e' } },
};
let currentTheme = 'white';

// ============ 가게 이름 / 시작화면 아이콘 커스텀 ============
let gameTitleName = '카페 타이쿤';
const gameTitleIcon = { mode:'emoji', emoji:'☕', img:null }; // mode: 'emoji' | 'image'
const GAME_TITLE_NAME_MAXLEN = 12;

function applyTitleCustom(){
  document.getElementById('titleGameName').textContent = gameTitleName || '카페 타이쿤';
  const preview = document.getElementById('titleIconPreview');
  if (gameTitleIcon.mode==='image' && gameTitleIcon.img) {
    preview.innerHTML = `<img src="${gameTitleIcon.img.src}" alt="">`;
  } else {
    preview.textContent = gameTitleIcon.emoji || '☕';
  }
}

// 테마/가게이름/아이콘은 "게임 진행 슬롯"과 별개로 전역 설정으로 저장한다(모든 슬롯에 공통 적용).
const GLOBAL_SETTINGS_KEY = 'cafeTycoonGlobalSettings_v1';
function saveGlobalSettings(){
  try {
    const data = {
      theme: currentTheme,
      titleName: gameTitleName,
      titleIcon: { mode: gameTitleIcon.mode, emoji: gameTitleIcon.emoji, imgDataUrl: gameTitleIcon.img ? gameTitleIcon.img.src : null },
    };
    localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(data));
  } catch(e) { console.warn('전역 설정 저장 실패:', e); }
}
async function loadGlobalSettings(){
  try {
    const raw = localStorage.getItem(GLOBAL_SETTINGS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.theme) applyTheme(data.theme);
    if (data.titleName) gameTitleName = data.titleName;
    if (data.titleIcon) {
      gameTitleIcon.mode = data.titleIcon.mode || 'emoji';
      gameTitleIcon.emoji = data.titleIcon.emoji || '☕';
      if (data.titleIcon.imgDataUrl) {
        gameTitleIcon.img = await new Promise(res=>{ const img=new Image(); img.onload=()=>res(img); img.onerror=()=>res(null); img.src=data.titleIcon.imgDataUrl; });
      }
    }
    applyTitleCustom();
  } catch(e) { console.warn('전역 설정 불러오기 실패:', e); }
}

function applyTheme(themeId){
  const theme = THEMES[themeId];
  if (!theme) return;
  currentTheme = themeId;
  const root = document.documentElement.style;
  Object.entries(theme.vars).forEach(([k,v]) => root.setProperty('--'+k, v));
  // 캔버스 내부(바닥 타일, 미니게임 UI)는 CSS가 아니라 JS 객체 색상을 직접 쓰므로 함께 갱신
  if (typeof PAL !== 'undefined') {
    PAL.floor1 = theme.vars.floor1;
    PAL.floor2 = theme.vars.floor2;
  }
  if (typeof MG_UI !== 'undefined') {
    // 배경/텍스트/포인터는 테마의 패널·강조색을 그대로 따르고, 목표구간(초록)·위험(빨강)은
    // 의미 전달을 위해 good/bad 색을 유지한다 - 테마색 하나로 전부 물들이지 않고 적당히 섞는다.
    MG_UI.panelBg = theme.vars.panel2;
    MG_UI.panelBorder = theme.vars.borderStrong || theme.vars.border;
    MG_UI.text = theme.vars.text;
    MG_UI.barBg = theme.vars.bg;
    MG_UI.accent = theme.vars.accent;
    MG_UI.good = theme.vars.good;
    MG_UI.bad = theme.vars.bad;
  }
}

// ============ 커스텀 캐릭터 이미지 ============
// 각 캐릭터(player/cook/server)는 두 방식 중 하나로 커스텀 가능:
//  - 'single': 이미지 1장을 어느 방향에서든 그대로 사용
//  - 'directional': 방향별 이미지(front/back/side) + 선택적 걷기 프레임(2장: 정지/걷기)
// mode가 null이면 커스텀 없음(기본 도트 그림 사용).
function makeEmptyCharacterCustom(){
  return {
    mode: null, // null | 'single' | 'directional'
    single: null, // { img: HTMLImageElement, w, h }
    directional: {
      front: null, back: null, side: null, // 각각 { img, w, h } 또는 { img, w, h, walkImg, walkW, walkH } (걷기 프레임 있으면)
    },
  };
}
const characterCustom = {
  player: makeEmptyCharacterCustom(),
  cook: makeEmptyCharacterCustom(),
  server: makeEmptyCharacterCustom(),
};

// ============ 손님 커스텀 ============
// mode: 'none'(기본 도트) | 'unified'(손님 전체가 이미지 하나 공유) | 'perType'(유형별 개별 이미지)
const customerCustom = {
  mode: 'none',
  unified: makeEmptyCharacterCustom(),
  perType: [makeEmptyCharacterCustom(), makeEmptyCharacterCustom(), makeEmptyCharacterCustom(), makeEmptyCharacterCustom()], // customerTypes 인덱스와 매칭
};

// ============ 바닥/가구 커스텀 ============
// 바닥: 단일 타일 이미지를 32x32 격자에 반복 배치(타일링). RPG Maker 스타일 타일셋(여러 컷이 든 시트)을
// 나중에 지원할 걸 대비해 tileCols/tileRows(시트 분할 수)와 tileIndex(그중 몇 번째 칸을 쓸지)를 미리 필드로 마련해둔다.
// 지금은 tileCols=1, tileRows=1(이미지 전체가 곧 한 칸)로 동작한다.
const floorCustom = {
  img: null, // HTMLImageElement
  tileCols: 1, tileRows: 1, tileIndex: 0,
};

// 가구: 스테이션별(espresso/smoothie/dessert/wok), 테이블 각각 개별 이미지로 교체 가능
function makeEmptyDecorSlot(){ return { img: null }; }
const decorCustom = {
  stations: { espresso: makeEmptyDecorSlot(), smoothie: makeEmptyDecorSlot(), dessert: makeEmptyDecorSlot(), wok: makeEmptyDecorSlot() },
  table: makeEmptyDecorSlot(), // 테이블은 전부 동일 이미지 하나로 통일(개별 지정은 과함)
};

// 캐릭터 렌더링 목표 크기(플레이어 기준). 업로드 이미지는 비율을 유지한 채 이 안에 맞춰 축소된다.
// 세로는 확대해 잘 보이게 하되, 가로는 예전 폭에 가깝게 좁혀서 옆으로 넙데데해 보이지 않게 했다.
// 모바일에서 캐릭터가 너무 작아 보인다는 피드백으로 기존(50x71)보다 22% 키웠다 - 충돌
// 히트박스(player.w/h)와는 무관한 순수 렌더링 크기라 이동/충돌 판정에는 영향 없다.
const CHAR_TARGET_W = 61, CHAR_TARGET_H = 87;

// 터치 기기(hover 불가) 여부. 미니게임/튜토리얼 안내 문구에서 "스페이스" 대신 "탭"으로
// 안내하기 위해 파일 전역에서 이 값을 공유한다(기존엔 파일 맨 끝에서만 쓰여 위쪽 코드들이
// 중복 판정을 하거나 아예 안내하지 못했다).
const isTouchDevice = window.matchMedia('(hover: none)').matches;

// 달리기(Shift)가 해금되는 레벨. 이 레벨 미만에서는 Shift를 눌러도 걷기 속도로 이동한다.
const RUN_UNLOCK_LEVEL = 3;

function loadImageFile(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============ 이미지 드롭존 UI 헬퍼 ============
// 클릭하면 파일선택창이 뜨고, 이미지를 드래그해서 놓아도 업로드되는 카드형 버튼을 만든다.
// opts: {
//   label: 안내문구(짧게, 예:'이미지'), sub: 보조문구(선택), previewSrc: 기존 이미지가 있으면 그 dataURL,
//   size: 'normal'|'small'|'wide', onFile: async (file) => {} - 파일이 선택/드롭되면 호출
// }
// 반환값은 바로 DOM에 append할 수 있는 dropzone 엘리먼트(class="dropzone").
function createImageDropzone(opts){
  const zone = document.createElement('div');
  zone.className = 'dropzone' + (opts.size==='small' ? ' small' : opts.size==='wide' ? ' wide' : '');

  function render(){
    zone.innerHTML = '';
    if (opts.previewSrc) {
      const img = document.createElement('img');
      img.className = 'dzPreview';
      img.src = opts.previewSrc;
      img.alt = '';
      zone.appendChild(img);
      const badge = document.createElement('span');
      badge.className = 'dzBadge';
      badge.textContent = '✓';
      badge.setAttribute('aria-hidden', 'true');
      zone.appendChild(badge);
    } else {
      const icon = document.createElement('div');
      icon.className = 'dzIcon';
      icon.textContent = '🖼️';
      icon.setAttribute('aria-hidden', 'true');
      zone.appendChild(icon);
      const text = document.createElement('div');
      text.className = 'dzText';
      text.innerHTML = `<b>${opts.label || '이미지'}</b>${opts.sub || '클릭 또는 드래그'}`;
      zone.appendChild(text);
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('aria-label', `${opts.label || '이미지'} 업로드${opts.previewSrc ? ' (이미지가 등록되어 있음, 다시 선택하면 교체됩니다)' : ''}`);
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) opts.onFile(file);
    });
    zone.appendChild(input);
  }
  render();

  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) opts.onFile(file);
  });

  return zone;
}

// ============ 라디오/체크박스 칩(.radioChip) 강조 폴백 ============
// CSS :has() 셀렉터로 선택된 칩을 자동 강조하지만, 이를 지원하지 않는 구형 브라우저를 위해
// change 이벤트를 위임으로 감지해서 .checkedChip 클래스를 직접 토글해준다.
// (라디오는 같은 name을 가진 다른 칩들도 함께 갱신해야 하므로 그룹 전체를 다시 훑는다)
document.addEventListener('change', (e) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement)) return;
  if (input.type!=='radio' && input.type!=='checkbox') return;
  const chip = input.closest('.radioChip');
  if (!chip) return;
  if (input.type==='checkbox') {
    chip.classList.toggle('checkedChip', input.checked);
  } else {
    // 라디오: 같은 name을 공유하는 모든 칩의 상태를 함께 갱신
    const name = input.name;
    document.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`).forEach(r => {
      const rChip = r.closest('.radioChip');
      if (rChip) rChip.classList.toggle('checkedChip', r.checked);
    });
  }
});
// 칩 목록이 매번 innerHTML로 새로 그려지므로(설정 탭 전환 등), 새로 추가된 칩의 초기 강조 상태도
// change 이벤트 없이 곧바로 맞춰준다. settingsOverlay 안에서만 동작하면 충분하다.
function syncAllChipStates(){
  document.querySelectorAll('#settingsOverlay .radioChip').forEach(chip => {
    const input = chip.querySelector('input[type="radio"],input[type="checkbox"]');
    if (input) chip.classList.toggle('checkedChip', input.checked);
  });
}
new MutationObserver(syncAllChipStates).observe(document.getElementById('settingsOverlay'), { childList:true, subtree:true });

const IDLE_BALANCE = {
  spawnMult: 2.6,          // 방치형은 손님이 훨씬 뜸하게 옴(스폰 간격에 곱함)
  levelNeedMult: 2.2,      // 레벨업에 필요한 서빙 수가 훨씬 많음
  ingredientPriceMult: 1.6,// 재료값 인상
  stationPriceMult: 1.7,   // 설비값 인상
  cookTimeSec: 5,          // 미니게임 대신 이 시간(초)만큼 걸려서 자동 완성
  patienceMult: 1.8,       // 방치형 손님 인내심 배율 (AI 처리시간이 여유롭도록 더 오래 기다려줌)
  aiTickSec: 0.3,          // AI가 다음 행동을 결정하는 주기(너무 잦은 재계산 방지)
  staffPriceMult: 1.8,     // 방치형 알바 고용비/일당 배율 (캐릭터가 이미 자동인데 알바까지 저렴하면 성장이 과해짐)
};

let money = 500; // 시작 자금
let reputation = 70; // 가게 평판 (0~100), 초반부터 손님이 적당히 오도록 넉넉하게 시작
let totalServed = 0; // 전체 누적 서빙 수 (레벨업 기준)
let level = 1;

// 하루 영업 시스템
const DAY_LENGTH_SEC = 300; // 하루 5분 (실시간)
let day = 1;
let dayTimeLeft = DAY_LENGTH_SEC * 60; // 프레임 단위
let dayEarnings = 0; // 오늘 번 돈
let dayServedCount = 0; // 오늘 서빙 수
let dayOpen = true; // 영업 중 여부 (false면 정산화면)

// 15일 누적 목표 (달성 시 엔딩 -> 이후 자유모드)
const CAMPAIGN_DAYS = 15;
const CAMPAIGN_GOAL = 260000;
let cumulativeEarnings = 0; // 전체 누적 매출 (엔딩 판정 기준)
let freeMode = false; // 엔딩 이후 자유모드 여부
let endingShown = false;
let tutorialDone = false; // 튜토리얼을 완료(또는 스킵)했는지 - localStorage에 저장되어 다음 방문부터는 다시 안 뜸
let tutorialActive = false; // 튜토리얼 진행 중 여부 (진행 중엔 실제 손님 스폰/영업시간 정지)
let tutorialStep = 0; // 0=이동안내, 1=손님착석대기, 2=조리안내, 3=서빙안내, 4=완료

// 레벨업: 이틀 정도 착실히 하면 하나씩 오르도록 널널하게 설계 (레벨5까지 총 8일 상당)
const LEVELS = [
  { lv:1, name:'신입 사장', needServed:0 },
  { lv:2, name:'단골 확보', needServed:70 },
  { lv:3, name:'입소문 카페', needServed:165 },
  { lv:4, name:'동네 맛집', needServed:280 },
  { lv:5, name:'핫플레이스', needServed:420 },
];

const moneyEl = document.getElementById('money');
const goalEl = document.getElementById('goal');
const goalWrapEl = document.getElementById('goalWrap');
const repEl = document.getElementById('rep');
const levelEl = document.getElementById('level');
const levelNameEl = document.getElementById('levelName');
const xpfill = document.getElementById('xpfill');
const msgEl = document.getElementById('msg');
const dayLabelEl = document.getElementById('dayLabel');
const dayTimerEl = document.getElementById('dayTimer');
const dayEarningsDispEl = document.getElementById('dayEarningsDisp');
goalEl.textContent = CAMPAIGN_GOAL;

function setMsg(t){ msgEl.textContent = t; }

// 방치형 모드 배율이 적용된 실제 필요 서빙 수 (LEVELS 배열 인덱스 기준)
function neededServedFor(levelIndex){
  const entry = LEVELS[levelIndex];
  if (!entry) return null;
  return Math.round(entry.needServed * (gameMode==='idle' ? IDLE_BALANCE.levelNeedMult : 1));
}

function refreshHUD(){
  moneyEl.textContent = money;
  repEl.textContent = reputation;
  levelEl.textContent = level;
  levelNameEl.textContent = LEVELS[level-1].name;

  if (gameMode==='idle') {
    dayLabelEl.textContent = '방치형 모드';
    dayTimerEl.textContent = '∞';
    dayEarningsDispEl.textContent = cumulativeEarnings + '원';
    goalWrapEl.style.display = 'none';
  } else {
    dayLabelEl.textContent = freeMode ? ('Day ' + day + ' (자유모드)') : ('Day ' + day + ' / ' + CAMPAIGN_DAYS);
    dayEarningsDispEl.textContent = cumulativeEarnings;
    goalEl.textContent = CAMPAIGN_GOAL;
    goalWrapEl.style.display = '';
    const secLeft = Math.max(0, Math.ceil(dayTimeLeft/60));
    const mm = Math.floor(secLeft/60), ss = secLeft%60;
    dayTimerEl.textContent = mm + ':' + String(ss).padStart(2,'0');
  }

  const cur = LEVELS[level-1];
  const next = LEVELS[level] || null;
  if (next) {
    const curNeed = neededServedFor(level-1);
    const nextNeed = neededServedFor(level);
    const ratio = (totalServed - curNeed) / (nextNeed - curNeed);
    xpfill.style.width = Math.min(100, Math.max(0,ratio*100)) + '%';
  } else {
    xpfill.style.width = '100%';
  }

  updateInvSlotsUI();
}

// 캔버스 위쪽 인벤토리 슬롯(2칸) UI를 현재 player.inventory/activeSlot 상태에 맞게 갱신한다.
// (기존에는 캐릭터 머리 위에 반투명 아이콘으로 표시했으나 너무 안 보인다는 피드백에 따라 이 방식으로 교체)
const invSlotEls = [document.getElementById('invSlot0'), document.getElementById('invSlot1')];
function updateInvSlotsUI(){
  player.inventory.forEach((menuId, i) => {
    const el = invSlotEls[i];
    if (!el) return;
    el.classList.toggle('active', player.activeSlot===i);
    let iconHtml = '';
    if (menuId) {
      const m = MENU[menuId];
      if (m.iconType==='image' && m.iconImg) {
        iconHtml = `<img src="${m.iconImg.src}" alt="${m.label}">`;
      } else {
        iconHtml = m.emoji || '';
      }
    }
    el.innerHTML = iconHtml;
    el.title = menuId ? MENU[menuId].label : '빈 칸';
  });
}

function checkLevelUp(){
  const next = LEVELS[level];
  const needServed = neededServedFor(level);
  if (next && totalServed >= needServed) {
    level++;
    setMsg(`🎉 레벨 업! Lv.${level} ${LEVELS[level-1].name} — 상점에서 새 재료를 구매할 수 있어요! (P키)`);
    tryExpandShop();
    refreshHUD();
  }
}

// ============ 평판 시스템 ============
// 평판 0~100. 서빙 성공시 +2, 손님이 지쳐 나가면 -4. 평판이 낮으면 손님 발길이 뜸해짐(스폰 간격 증가).
function adjustReputation(delta){
  reputation = Math.max(0, Math.min(100, reputation+delta));
}
function reputationSpawnMultiplier(){
  // 평판 100일 때 가장 자주 옴(0.6배 간격), 평판 0이면 뜸하게 옴(1.4배 간격)
  // 시작 평판(70)에서도 손님이 너무 뜸하게 오지 않도록 곡선을 완만하게 조정
  return 1.4 - (reputation/100)*0.8;
}

// ============ 팔레트 ============
const PAL = {
  floor1: '#8a6a4a', floor2: '#7c5e40',
  wall: '#4a3728', wallTop: '#5e4632',
  counter: '#6b4a30', counterTop: '#8a6a48',
  skin: '#e8b98a', hairBrown: '#4a3020', pantsBrown: '#3a2818',
  shirtBlue: '#3a6ea5', shirtRed: '#b0453f', shirtGreen: '#4a8a5a', shirtPurple:'#8a5aa5',
  apron: '#e8dcc0', outline: '#221812',
  machineBody: '#c9c9d4', machineDark: '#8a8a9a',
  strawberry: '#d63b4a', mango: '#f0a830',
  coffeeDark:'#4a2f1e', coffeeLight:'#c9a06a',
  tableWood: '#9a7550',
  ovenDark:'#3a2a20', panMetal:'#9a9aa0',
  displayGlass:'rgba(200,220,255,0.25)',
};

// 미니게임 오버레이 UI(진행바 배경/테두리/텍스트 등)는 게임 오브젝트와 달리 "UI"이므로
// 테마를 바꾸면 함께 바뀐다. applyTheme()에서 갱신된다.
const MG_UI = {
  panelBg: 'rgba(20,15,10,0.92)', panelBorder: '#8a6d4f', text: '#f4e9d8',
  barBg: '#3a2b1f', accent: '#e8b04b', good: '#4a8a5a', bad: '#b0453f',
};

// ============ 메뉴 정의 ============
// station: 'espresso' | 'smoothie' | 'dessert' | 'wok' | 'oven'
const MENU = {
  espresso:        { id:'espresso', label:'에스프레소', emoji:'🥃', price:300, station:'espresso', unlockLv:1, ingredient:'coffeeBean', cost:100 },
  americano:        { id:'americano', label:'아메리카노', emoji:'☕', price:350, station:'espresso', unlockLv:1, ingredient:'coffeeBean', cost:100 },
  cafelatte:        { id:'cafelatte', label:'카페라떼', emoji:'🥛', price:450, station:'espresso', unlockLv:2, ingredient:'milk', cost:150 },
  cappuccino:       { id:'cappuccino', label:'카푸치노', emoji:'☁️', price:450, station:'espresso', unlockLv:2, ingredient:'milk', cost:150 },
  vanillalatte:     { id:'vanillalatte', label:'바닐라라떼', emoji:'🍦', price:500, station:'espresso', unlockLv:3, ingredient:'vanillaSyrup', cost:180 },
  cafemocha:        { id:'cafemocha', label:'카페모카', emoji:'🍫', price:520, station:'espresso', unlockLv:3, ingredient:'chocoSyrup', cost:180 },
  caramelmacchiato: { id:'caramelmacchiato', label:'카라멜마끼아또', emoji:'🍮', price:550, station:'espresso', unlockLv:4, ingredient:'caramelSyrup', cost:200 },
  coldbrew:         { id:'coldbrew', label:'콜드브루', emoji:'🧊', price:480, station:'espresso', unlockLv:4, ingredient:'coffeeBean', cost:150 },

  strawberry_smoothie: { id:'strawberry_smoothie', label:'딸기 스무디', emoji:'🍓', price:450, station:'smoothie', unlockLv:1, ingredient:'strawberry', cost:150 },
  mango_smoothie:       { id:'mango_smoothie', label:'망고 스무디', emoji:'🥭', price:500, station:'smoothie', unlockLv:1, ingredient:'mango', cost:170 },

  macaron:   { id:'macaron', label:'마카롱', emoji:'🟣', price:400, station:'dessert', unlockLv:2, ingredient:'macaronBase', cost:180 },
  croissant: { id:'croissant', label:'크루아상', emoji:'🥐', price:380, station:'dessert', unlockLv:2, ingredient:'croissantBase', cost:150 },
  sandwich:  { id:'sandwich', label:'샌드위치', emoji:'🥪', price:600, station:'dessert', unlockLv:3, ingredient:'sandwichBase', cost:250 },
  cakeSlice: { id:'cakeSlice', label:'조각케이크', emoji:'🍰', price:650, station:'dessert', unlockLv:3, ingredient:'cakeBase', cost:280 },

  tteokbokki: { id:'tteokbokki', label:'떡볶이', emoji:'🌶️', price:700, station:'wok', unlockLv:4, ingredient:'tteok', cost:250 },
  bokkeumbap: { id:'bokkeumbap', label:'볶음밥', emoji:'🍚', price:750, station:'wok', unlockLv:5, ingredient:'rice', cost:270 },
};

// 커스텀(가격/레벨/아이콘) 적용 전 기본값 보존 - "기본값으로 초기화" 버튼에서 사용.
// 아이콘 종류: iconType 'emoji'(이모지/텍스트 문자열을 emoji 필드에 그대로 씀) | 'image'(이미지 dataURL, iconImg에 로드된 Image 객체 보관)
const MENU_DEFAULTS = {};
Object.keys(MENU).forEach(id => { MENU_DEFAULTS[id] = { label: MENU[id].label, emoji: MENU[id].emoji, price: MENU[id].price, unlockLv: MENU[id].unlockLv }; });
Object.values(MENU).forEach(m => { m.iconType = 'emoji'; m.iconImg = null; }); // 기본은 전부 이모지 아이콘

const INGREDIENT_LABELS = {
  coffeeBean:'원두', milk:'우유', vanillaSyrup:'바닐라시럽', chocoSyrup:'초코시럽', caramelSyrup:'카라멜시럽',
  strawberry:'딸기', mango:'망고',
  macaronBase:'마카롱 반죽', croissantBase:'크루아상 반죽', sandwichBase:'샌드위치 재료', cakeBase:'케이크 시트',
  tteok:'떡', rice:'밥',
};

// 재료 아이콘 커스텀(이모지/텍스트/이미지). 기본은 빈 문자열(상점에서 라벨 텍스트만 표시되던 기존 모습 유지).
const INGREDIENT_ICON = {};
Object.keys(INGREDIENT_LABELS).forEach(k => { INGREDIENT_ICON[k] = { iconType:'emoji', emoji:'', iconImg:null }; });
const INGREDIENT_LABEL_DEFAULTS = {...INGREDIENT_LABELS};

// 재료 재고 (구매해야 해당 메뉴 판매 가능) - 시작 재료(원두)는 조금 쥐어줌
const stock = {};
Object.keys(INGREDIENT_LABELS).forEach(k => stock[k] = 0);
stock.coffeeBean = 5; // 튜토리얼 진행 가능하도록 시작 재료 지급

// 재료를 한 번이라도 구매했는지 여부 -> 이걸 기준으로 메뉴가 "실제 판매 가능" 상태가 됨.
// 레벨은 "상점에서 이 재료를 살 수 있는지"만 결정하고, 진짜 해금은 첫 구매 시점.
const everBought = {};
Object.keys(INGREDIENT_LABELS).forEach(k => everBought[k] = false);
everBought.coffeeBean = true; // 시작부터 원두는 지급받았으니 해금 상태로 시작

function isMenuUnlocked(menuId){
  const m = MENU[menuId];
  return everBought[m.ingredient] === true;
}

function hasIngredient(menuId){
  const m = MENU[menuId];
  return stock[m.ingredient] > 0;
}
function consumeIngredient(menuId){
  const m = MENU[menuId];
  stock[m.ingredient] = Math.max(0, stock[m.ingredient]-1);
}

// ============ 주방 설비 정의 ============
const STATIONS_DEF = {
  espresso: { id:'espresso', label:'커피머신', unlockLv:1, price:0, owned:true },
  smoothie: { id:'smoothie', label:'스무디 기계', unlockLv:1, price:0, owned:true },
  dessert:  { id:'dessert', label:'디저트 진열대', unlockLv:2, price:900, owned:false },
  wok:      { id:'wok', label:'분식 팬', unlockLv:4, price:1800, owned:false },
};

// ============ 알바 시스템 ============
// 조리 알바: 특정 스테이션에 배정되어 재료가 있으면 자동으로 랜덤 메뉴를 만들어 카운터에 올려둠(플레이어가 집어서 서빙해야 함)
// 서빙 알바: 완성된 음식(조리대 위에 있는 것)을 자동으로 찾아 해당 손님에게 서빙
const STAFF_DEF = {
  cook: { id:'cook', label:'주방 알바', hireCost:3200, dailyWage:1800, unlockLv:2,
          desc:'재료가 있으면 자동으로 조리해요. 급한 손님부터 처리해주지만, 플레이어보다는 확실히 느려요.' },
  server: { id:'server', label:'서빙 알바', hireCost:2800, dailyWage:1600, unlockLv:2,
          desc:'완성된 음식을 손님에게 자동으로 가져다줘요. 인내심이 급한 손님부터 챙기지만, 반응은 다소 느려요.' },
};
const staff = { cook: { hired:false, workTimer:0 }, server: { hired:false, workTimer:0 } };

// 조리대 위에 완성되어 대기 중인 음식들 (알바 조리 결과물, 플레이어나 서빙알바가 집어갈 수 있음)
// { menuId, forTableIdx } - forTableIdx는 아직 정해지지 않고, 서빙알바/플레이어가 대기중인 손님에게 매칭
let readyItems = [];

const COOK_INTERVAL = 480; // 약 8초에 한 번 시도 (밸런스 패치: 알바가 플레이어를 대체하지 않도록 더 느리게)
function updateCookStaff(){
  if (!staff.cook.hired) return;
  staff.cook.workTimer++;
  if (staff.cook.workTimer < COOK_INTERVAL) return;
  staff.cook.workTimer = 0;

  // 대기 중인 주문 중 재료가 있고 아직 안 만들어진 것을 처리.
  // 우선순위: VIP 손님 먼저(놓치면 손해가 크므로), 그 다음 인내심이 급한 순
  const waitingOrders = tables.filter(t=>t.occupied && t.customer.state==='waiting_food');
  waitingOrders.sort((a,b)=>{
    if (a.customer.isVip !== b.customer.isVip) return a.customer.isVip ? -1 : 1;
    return a.customer.patience-b.customer.patience;
  });
  for (const t of waitingOrders) {
    const menuId = t.customer.order;
    const alreadyReady = readyItems.some(r=>r.menuId===menuId);
    if (alreadyReady) continue;
    if (hasIngredient(menuId)) {
      consumeIngredient(menuId);
      readyItems.push({ menuId });
      setMsg(`주방 알바가 ${MENU[menuId].label}을(를) 만들었어요.`);
      return;
    }
  }
}

const SERVE_INTERVAL = 330; // 약 5.5초에 한 번 서빙 시도 (밸런스 패치: 더 느리게)
function updateServerStaff(){
  if (!staff.server.hired) return;
  staff.server.workTimer++;
  if (staff.server.workTimer < SERVE_INTERVAL) return;
  staff.server.workTimer = 0;

  // 완성된 음식이 있는 테이블 중, VIP 손님을 최우선으로, 그다음 인내심이 급한 순으로 서빙
  // -> 서빙 알바의 핵심 가치는 "고가치 손님을 놓치지 않는 안전망" 역할
  const servable = tables.filter(t=>t.occupied && t.customer.state==='waiting_food' && readyItems.some(r=>r.menuId===t.customer.order));
  if (servable.length>0) {
    servable.sort((a,b)=>{
      if (a.customer.isVip !== b.customer.isVip) return a.customer.isVip ? -1 : 1;
      return a.customer.patience-b.customer.patience;
    });
    const t = servable[0];
    const idx = readyItems.findIndex(r=>r.menuId===t.customer.order);
    if (idx>=0) {
      readyItems.splice(idx,1);
      serveCustomer(t);
      return;
    }
  }

  // 서빙할 게 없으면 대신 빈 테이블을 치움 - 그래야 새 손님이 앉을 자리가 계속 생김.
  // 이게 없으면 알바가 서빙을 빨리 처리할수록 오히려 테이블이 금방 다 차서 알바 자신을 무력화시키는 역설이 생긴다.
  const dirty = tables.find(t=>t.needsCleanup);
  if (dirty) dirty.needsCleanup = false;
}

// ============ 맵 & 배치 ============
// 0 바닥, 1 벽, 2 설비, 3 테이블
// 가게는 처음엔 좁게 시작해서 레벨업할 때마다 옆 공간의 벽이 허물어지며 넓어진다.
// (테이블 간 거리가 멀어 손님 인내심 안에 서빙하기 빠듯하다는 피드백 반영 - 초반엔 좁고 밀도 높게)
const map = [];
for (let y=0;y<ROWS;y++){
  const row = [];
  for (let x=0;x<COLS;x++){
    row.push((y===0||y===ROWS-1||x===0||x===COLS-1) ? 1 : 0);
  }
  map.push(row);
}

// 확장 경계선: 가운데를 기준으로 좌우 대칭으로 넓어진다.
// leftX~rightX 범위만 개방되고 그 바깥쪽은 벽(검은 미개방 구역)으로 막힌다.
const MAP_CENTER = Math.floor(COLS/2); // 12
const EXPANSION_STAGES = [
  { atLevel:1, leftX: MAP_CENTER-5, rightX: MAP_CENTER+4 },   // x:7~16, 폭 10 - 좁게 시작
  { atLevel:2, leftX: MAP_CENTER-9, rightX: MAP_CENTER+8 },   // x:3~20
  { atLevel:4, leftX: 1, rightX: COLS-2 },                     // 전체 개방
];
let currentExpansionStage = 0; // EXPANSION_STAGES 인덱스

function applyExpansionWall(){
  // 아직 열리지 않은 좌우 구역을 전부 벽으로 막는다(검은 미개방 구역 = 실제로도 이동 불가능해야 함).
  // 예전엔 경계선 한 줄만 막았는데, 그 안쪽(더 먼 미개방 타일)은 데이터상 빈 바닥이라
  // 화면엔 검게 칠해져 안 보일 뿐 실제로는 걸어갈 수 있는 상태였다. 방치형 AI가 이 "보이지 않는 통로"를
  // 통해 미개방 구역의 비활성 테이블까지 들어가버리는 문제(플레이어가 "테이블에 낀다"고 느끼는 원인)가 있어
  // 이제 미개방 구역 전체를 실제 벽으로 처리한다.
  const { leftX, rightX } = EXPANSION_STAGES[currentExpansionStage];
  if (leftX<=1 && rightX>=COLS-2) return; // 전체 개방된 상태면 벽 세울 필요 없음
  for (let y=1;y<ROWS-1;y++){
    for (let x=1;x<COLS-1;x++){
      if (x<leftX || x>rightX) map[y][x] = 1;
    }
  }
}

function tryExpandShop(){
  // while로 반복 체크 - 한 번에 여러 레벨을 건너뛰어도(치트/디버그 등) 확장 단계를 놓치지 않게
  let expanded = false;
  while (true) {
    const next = EXPANSION_STAGES[currentExpansionStage+1];
    if (next && level >= next.atLevel) {
      currentExpansionStage++;
      expanded = true;
    } else break;
  }
  if (expanded) {
    rebuildMapOpenArea();
    setMsg('🎉 가게가 넓어졌어요! 새로운 공간이 열렸어요.');
  }
}

// 확장 벽 이후 열린 구역의 바닥을 다시 깔고(벽이었던 자리를 0으로), 새 경계에 벽을 세운다
function rebuildMapOpenArea(){
  for (let y=1;y<ROWS-1;y++){
    for (let x=1;x<COLS-1;x++){
      if (map[y][x]===1) map[y][x]=0; // 이전 확장벽 자리를 바닥으로 되돌림(스테이션/테이블은 아래에서 다시 씌움)
    }
  }
  applyExpansionWall();
  // 스테이션/테이블 타일 재적용 (rebuild로 지워졌을 수 있으니). 아직 해금 안 된 테이블은 심지 않는다.
  Object.keys(stationSlots).forEach(k => { if (STATIONS_DEF[k].owned) applyStationTiles(k); });
  activeTables().forEach(t => { map[t.y][t.x] = 3; });
}

// 주방 구역 상단 라인에 스테이션 슬롯 배치 (설비 살 때 여기 등장) - 가운데(MAP_CENTER=12) 기준 좌우 대칭 배치
const stationSlots = {
  espresso: { x:MAP_CENTER-3, y:2, w:2 },  // x:9~10
  smoothie: { x:MAP_CENTER+1, y:2, w:2 },  // x:13~14
  dessert:  { x:MAP_CENTER-8, y:2, w:2 },  // x:4~5 (레벨2에 열리는 구역)
  wok:      { x:MAP_CENTER+6, y:2, w:2 },  // x:18~19 (레벨4에 열리는 구역)
};
function applyStationTiles(id){
  const s = stationSlots[id];
  for (let i=0;i<s.w;i++) map[s.y][s.x+i] = 2;
}
applyStationTiles('espresso');
applyStationTiles('smoothie');

// 테이블 6개. 처음엔 2개만 활성화되고, 가게가 넓어질 때마다 순차적으로 열림. 가운데 기준 좌우 대칭 배치.
// unlockLevel: 이 레벨이 되어야 이 테이블이 손님을 받기 시작함(그 전엔 지도에도 안 그려짐)
const tables = [
  { x: MAP_CENTER-3, y: 6, occupied:false, customer:null, needsCleanup:false, unlockLevel:1 },
  { x: MAP_CENTER+2, y: 6, occupied:false, customer:null, needsCleanup:false, unlockLevel:1 },
  { x: MAP_CENTER-7, y: 6, occupied:false, customer:null, needsCleanup:false, unlockLevel:2 },
  { x: MAP_CENTER+6, y: 6, occupied:false, customer:null, needsCleanup:false, unlockLevel:2 },
  { x: MAP_CENTER-3, y: 10, occupied:false, customer:null, needsCleanup:false, unlockLevel:4 },
  { x: MAP_CENTER+2, y: 10, occupied:false, customer:null, needsCleanup:false, unlockLevel:4 },
];
function activeTables(){
  return tables.filter(t => t.unlockLevel<=level);
}
tables.filter(t=>t.unlockLevel<=level).forEach(t => { map[t.y][t.x] = 3; });
applyExpansionWall();

// P키로만 여는 상점(지도상 오브젝트는 없음. 상점 카운터를 찾아 걸어가는 동선 대신,
// 언제든 P키 한 번으로 접근 가능하게 해서 진행을 방해하지 않도록 했다).
// ============ 플레이어 ============
// 시작 위치는 맵 정가운데 - 좌우 대칭으로 넓어지는 구조에 맞춰 항상 중심에서 시작한다.
const player = {
  x: MAP_CENTER*TILE - 16, y: (ROWS-2)*TILE, w:32, h:40, speed:2.6, runSpeed:4.6,
  dir:'down', moving:false, animFrame:0, animTimer:0, running:false,
  // 아이템 2칸 인벤토리. 각 칸엔 menuId(문자열) 또는 null이 들어간다.
  // activeSlot: 서빙/AI 로직이 참조하는 "현재 손에 든" 칸의 인덱스(0 또는 1). Q키로 전환.
  inventory: [null, null],
  activeSlot: 0,
};

// player.holding과 동등한 의미: "현재 선택된 칸의 아이템"(없으면 null)
function heldItem(){ return player.inventory[player.activeSlot]; }
// 현재 선택된 칸을 비운다
function clearHeldItem(){ player.inventory[player.activeSlot] = null; }
// 인벤토리에 빈 칸이 있는지
function hasFreeInventorySlot(){ return player.inventory.some(s => s===null); }
// 완성된 메뉴를 빈 칸에 넣는다. 활성 슬롯이 비어있으면 그 칸을 우선 사용해서 손에 바로 들리게 한다.
function addToInventory(menuId){
  if (player.inventory[player.activeSlot]===null) { player.inventory[player.activeSlot] = menuId; return true; }
  const freeIdx = player.inventory.findIndex(s => s===null);
  if (freeIdx===-1) return false;
  player.inventory[freeIdx] = menuId;
  return true;
}
// 특정 menuId를 들고 있는 칸의 인덱스를 찾는다(없으면 -1)
function findInventorySlotWith(menuId){ return player.inventory.findIndex(s => s===menuId); }

// Q키: 인벤토리 활성 슬롯을 전환한다(직접 조작 모드에서만 의미 있음).
function switchActiveSlot(){
  if (gameMode==='idle') return; // 방치형은 AI가 인벤토리를 알아서 관리하므로 스위칭 불필요
  if (miniGameActive || menuOpen || shopOpen || dialogueActive) return;
  player.activeSlot = player.activeSlot===0 ? 1 : 0;
  const held = heldItem();
  setMsg(held ? `${MENU[held].label} 선택함` : '빈 칸 선택함');
  updateInvSlotsUI();
  // 화살표를 잠깐 강조해서 "지금 전환됐다"는 걸 시각적으로 확실히 알려준다
  const arrow = document.querySelector('#invSlots .swapArrow');
  if (arrow) {
    arrow.classList.add('pulse');
    setTimeout(() => arrow.classList.remove('pulse'), 200);
  }
}

const keys = {};
window.addEventListener('keydown', e => {
  // 설정창 등의 텍스트 입력(가게 이름/캐릭터 이름/메뉴 이름 등)에 포커스가 있을 땐 게임 단축키를
  // 가로채면 안 된다 - 특히 스페이스바를 그대로 삼켜버리면 이름에 띄어쓰기를 넣을 수 없게 된다.
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag==='INPUT' || tag==='TEXTAREA' || tag==='SELECT') return;
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === ' ') { e.preventDefault(); tryInteract(); }
  if (k === 'p') { toggleShop(); }
  if (k === 'q') { switchActiveSlot(); }
  if (k === 'escape') { closeShop(); closeSettings(); if (menuOpen) { menuOpen=false; closeStationMenuUI(); setMsg('취소했어요.'); } }
  if (k === 'shift' && level < RUN_UNLOCK_LEVEL && !menuOpen && !shopOpen && !dialogueActive) {
    setMsg(`아직 달리기를 할 수 없어요. (Lv.${RUN_UNLOCK_LEVEL}에 해금)`);
  }
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)) touchMoveTarget = null; // 물리 키보드 이동이 우선하도록, 대기 중이던 탭-이동 목표는 취소
  if (menuOpen && !shopOpen) {
    const idx = parseInt(k);
    if (!isNaN(idx) && currentStationMenu[idx-1]) {
      selectMenuItem(currentStationMenu[idx-1].id);
    }
  }
  // 디저트 포장 미니게임: 방향키 시퀀스 입력 처리(터치 방향패드와 handleSequenceDirection을 공유)
  const dirKeyMap = { arrowup:'up', arrowdown:'down', arrowleft:'left', arrowright:'right', w:'up', s:'down', a:'left', d:'right' };
  if (dirKeyMap[k]) handleSequenceDirection(dirKeyMap[k]);
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function tileSolid(tx,ty){
  if (ty<0||ty>=ROWS||tx<0||tx>=COLS) return true;
  const v = map[ty][tx];
  return v===1||v===2||v===3;
}

// 아직 해금되지 않은(벽으로 막힌) 구역이나 설비/테이블 타일 안에 캐릭터가 끼어 어느 방향으로도
// 못 움직이게 되는 경우를 매 프레임 감시해서 안전한 기본 위치로 복구한다. 이런 상태는 정상적인
// 이동 충돌 로직으로는 재현하기 어렵지만(저장 불러오기, 레벨업 순간 등 예외적 타이밍), 한번 걸리면
// 스스로 빠져나올 방법이 없는 완전한 막힘이라 안전망을 둔다.
function recoverPlayerIfStuck(){
  const cx = Math.floor((player.x+player.w/2)/TILE);
  const cy = Math.floor((player.y+player.h-4)/TILE);
  if (!tileSolid(cx,cy)) return;
  player.x = MAP_CENTER*TILE - player.w/2;
  player.y = (ROWS-2)*TILE - (player.h-4);
  touchMoveTarget = null;
  pendingAutoInteract = false;
  setMsg('캐릭터가 갈 수 없는 곳에 있어서 안전한 위치로 옮겼어요.');
}

// ============ 방치형 모드 AI ============
// 상태: idle(대상 탐색) -> movingToStation -> cooking(자동완성 대기) -> movingToTable -> movingToClean
let aiState = 'idle';
let aiTargetMenu = null;
let aiTargetStationKey = null;
let aiTargetTable = null;
let aiTickTimer = 0;
let aiTargetPixel = null; // 상태 진입 시 한 번만 계산해서 고정하는 목표 타일(흔들림 방지)

// 오브젝트(ox,oy 기준 가로 w칸 세로 h칸)에 인접한 상하좌우 타일 중, 실제로 걸어갈 수 있는(벽이 아닌)
// 타일을 플레이어와 가장 가까운 순으로 찾아 반환한다. 하나도 없으면 오브젝트 바로 아래를 기본값으로 반환.
// 오브젝트(ox,oy,w,h) 주변에서 플레이어가 설 수 있는 가장 가까운 빈 타일을 찾는다.
// approach를 넘기면(테이블/스테이션처럼 그림이 타일보다 위로 크게 솟아 있는 오브젝트), 아래쪽에서
// 접근할 때 목표 지점을 타일 중앙보다 살짝 더 오브젝트 반대쪽으로 밀어서, 확대된 캐릭터/오브젝트
// 그림이 서로 겹쳐 "끼어 보이는" 것을 줄인다. 같은 타일 안에서의 픽셀 오프셋이라 상호작용 판정(타일 단위)엔 영향 없다.
function findNearestAdjacentOpenTile(ox, oy, w, h, approach){
  const candidates = [];
  for (let i=0;i<w;i++){
    candidates.push({tx:ox+i, ty:oy-1, side:'top'}); // 위
    candidates.push({tx:ox+i, ty:oy+h, side:'bottom'}); // 아래
  }
  for (let j=0;j<h;j++){
    candidates.push({tx:ox-1, ty:oy+j, side:'left'}); // 왼쪽
    candidates.push({tx:ox+w, ty:oy+j, side:'right'}); // 오른쪽
  }
  const open = candidates.filter(c => !tileSolid(c.tx, c.ty));
  if (open.length===0) return { tx: ox, ty: oy+h, side:'bottom' }; // 폴백(이론상 거의 발생 안 함)

  const curTx = Math.floor((player.x+player.w/2)/TILE);
  const curTy = Math.floor((player.y+player.h/2)/TILE);
  open.sort((a,b)=>{
    const da = Math.abs(a.tx-curTx)+Math.abs(a.ty-curTy);
    const db = Math.abs(b.tx-curTx)+Math.abs(b.ty-curTy);
    return da-db;
  });
  const chosen = open[0];
  if (approach && chosen.side==='bottom') {
    // 오브젝트 아래쪽에서 접근할 때만, 같은 타일 안에서 한 발 더 물러나 서게 만든다
    // (타일 절반(20px)을 넘지 않는 선에서 최대한 밀어야 상호작용 판정(타일 단위)이 유지된다).
    chosen.pixelOffsetY = TILE*0.45;
  }
  return chosen;
}

function aiFindTargetPixel(){
  // 현재 상태에 맞는 목표 지점(타일 좌표)을 반환. 없으면 null.
  // 목표는 상태에 진입할 때(aiDecideNextAction, aiOnArrive) 한 번만 계산해서 aiTargetPixel에 고정해둔다.
  // 매 프레임 다시 계산하면 플레이어가 움직일 때마다 "가장 가까운 인접 타일"이 바뀌어
  // 제자리에서 진동하듯 멈출 수 있기 때문이다.
  return aiTargetPixel;
}

// 방치형 모드는 하루(자정 정산) 개념이 없으므로, 알바 유지비를 일정 시간마다 자동 차감한다.
const IDLE_STAFF_WAGE_INTERVAL_SEC = 60; // 60초마다 유지비 정산
let idleStaffWageTimer = 0;
function updateIdleStaffWage(){
  idleStaffWageTimer++;
  if (idleStaffWageTimer < IDLE_STAFF_WAGE_INTERVAL_SEC*60) return;
  idleStaffWageTimer = 0;
  let total = 0;
  if (staff.cook.hired) total += Math.round(STAFF_DEF.cook.dailyWage*IDLE_BALANCE.staffPriceMult);
  if (staff.server.hired) total += Math.round(STAFF_DEF.server.dailyWage*IDLE_BALANCE.staffPriceMult);
  if (total>0) {
    money -= total;
    refreshHUD();
  }
}

function updateIdleAI(){
  aiTickTimer++;
  const tickInterval = Math.round(IDLE_BALANCE.aiTickSec*60);

  // 이동 목표가 있으면 매 프레임 그쪽으로 이동 시도
  const target = aiFindTargetPixel();
  if (target) {
    const targetPx = target.tx*TILE + TILE/2;
    const targetPy = target.ty*TILE + TILE/2 + (target.pixelOffsetY||0);
    const curPx = player.x + player.w/2;
    const curPy = player.y + player.h/2;
    const dxRaw = targetPx - curPx, dyRaw = targetPy - curPy;
    const dist = Math.hypot(dxRaw, dyRaw);

    if (dist < 4) {
      // 도착 - 다음 단계로
      player.moving = false;
      aiOnArrive();
    } else {
      // x축을 먼저 맞추고 나서 y축으로 이동한다(항상 L자형 경로).
      // 예전엔 매 프레임 "더 큰 차이가 나는 축"을 골라 움직여서 경로가 지그재그로 보였는데,
      // 그 과정에서 테이블/설비 모서리를 스치듯 지나가며 순간적으로 겹쳐 보이는 원인이 되기도 했다.
      let dx = Math.abs(dxRaw) > 2 ? Math.sign(dxRaw) : 0;
      let dy = dx===0 ? Math.sign(dyRaw) : 0;
      if (dx>0) player.dir='right'; else if (dx<0) player.dir='left';
      else if (dy>0) player.dir='down'; else if (dy<0) player.dir='up';
      player.moving = true;
      const spd = player.speed;
      let moved = false;
      if (dx!==0) {
        const tx2 = Math.floor((player.x+dx*spd+player.w/2)/TILE);
        const ty2 = Math.floor((player.y+player.h-4)/TILE);
        if (!tileSolid(tx2,ty2)) { player.x += dx*spd; moved = true; }
      }
      if (dy!==0) {
        const tx3 = Math.floor((player.x+player.w/2)/TILE);
        const ty3 = Math.floor((player.y+dy*spd+player.h-4)/TILE);
        if (!tileSolid(tx3,ty3)) { player.y += dy*spd; moved = true; }
      }
      // x축이 무언가에 막혀 못 움직였다면, 제자리에 고착되지 않도록 y축으로 폴백 시도
      if (!moved && dx!==0) {
        const tx4 = Math.floor((player.x+player.w/2)/TILE);
        const ty4 = Math.floor((player.y+Math.sign(dyRaw)*spd+player.h-4)/TILE);
        if (!tileSolid(tx4,ty4)) player.y += Math.sign(dyRaw)*spd;
      }
      player.animTimer++;
      if (player.animTimer>8) { player.animFrame=(player.animFrame+1)%4; player.animTimer=0; }
    }
    return;
  }
  player.moving = false;
  player.animFrame = 0;

  // 목표가 없는 idle 상태 - 주기적으로 할 일을 찾는다
  if (aiTickTimer < tickInterval) return;
  aiTickTimer = 0;
  aiDecideNextAction();
}

function aiDecideNextAction(){
  if (aiState==='cooking') return; // 조리 중엔 그대로 대기(자동완성 타이머가 알아서 끝냄)

  // 1) 인벤토리(2칸) 중 완성된 걸 들고 있으면 그 손님에게 서빙
  //    (아직 해금 안 된 테이블은 애초에 손님이 안 앉지만, 안전하게 activeTables만 탐색)
  for (const menuId of player.inventory) {
    if (!menuId) continue;
    const t = activeTables().find(tt=>tt.occupied && tt.customer && tt.customer.state==='waiting_food' && tt.customer.order===menuId);
    if (t) {
      aiTargetTable = t; aiState='movingToTable';
      aiTargetPixel = findNearestAdjacentOpenTile(t.x, t.y, 1, 1, 'table');
      return;
    }
  }
  // 서빙할 손님이 없는(놓친) 아이템은 손을 비워 다음 조리에 쓸 자리를 만든다
  for (let i=0;i<player.inventory.length;i++) {
    const menuId = player.inventory[i];
    if (!menuId) continue;
    const stillWaiting = activeTables().some(tt=>tt.occupied && tt.customer && tt.customer.state==='waiting_food' && tt.customer.order===menuId);
    if (!stillWaiting) player.inventory[i] = null;
  }

  // 2) 대기 중인 주문이 있고 재료가 있고 인벤토리에 빈 칸이 있으면 조리하러 이동
  const waiting = activeTables().find(t=>t.occupied && t.customer && t.customer.state==='waiting_food');
  if (waiting && hasFreeInventorySlot()) {
    const m = MENU[waiting.customer.order];
    if (hasIngredient(waiting.customer.order)) {
      aiTargetMenu = waiting.customer.order;
      aiTargetStationKey = m.station;
      aiState = 'movingToStation';
      const s = stationSlots[m.station];
      aiTargetPixel = findNearestAdjacentOpenTile(s.x, s.y, s.w, 1, 'station');
      return;
    }
  }

  // 3) 치울 테이블이 있으면 치우러 이동
  const dirty = activeTables().find(t=>t.needsCleanup);
  if (dirty) {
    aiTargetTable = dirty;
    aiState = 'movingToClean';
    aiTargetPixel = findNearestAdjacentOpenTile(dirty.x, dirty.y, 1, 1, 'table');
    return;
  }

  // 할 일 없음 - 제자리 대기
  aiState = 'idle';
  aiTargetPixel = null;
}

function aiOnArrive(){
  if (aiState==='movingToStation') {
    if (hasIngredient(aiTargetMenu)) {
      startMiniGame(MENU[aiTargetMenu]);
      aiState = 'cooking';
    } else {
      aiState = 'idle'; // 그 사이 재료가 떨어졌으면 포기하고 다시 탐색
    }
    aiTargetPixel = null;
  } else if (aiState==='movingToTable') {
    const t = aiTargetTable;
    if (t && t.occupied && t.customer && t.customer.state==='waiting_food') {
      const slotIdx = findInventorySlotWith(t.customer.order);
      if (slotIdx!==-1) {
        serveCustomer(t);
        player.inventory[slotIdx] = null;
      }
    }
    aiTargetTable = null;
    aiState = 'idle';
    aiTargetPixel = null;
  } else if (aiState==='movingToClean') {
    if (aiTargetTable) cleanupTable(aiTargetTable);
    aiTargetTable = null;
    aiState = 'idle';
    aiTargetPixel = null;
  }
}

// AI가 조리를 마치면(인벤토리에 완성품이 채워지면) 다음 행동(서빙)으로 전환
function aiCheckCookingDone(){
  if (aiState==='cooking' && player.inventory.some(s=>s!==null)) {
    aiState = 'idle'; // idle에서 곧바로 aiDecideNextAction이 서빙 대상을 찾음
  }
}

// ============ 모바일 카메라(확대/추적) + 세로 캔버스 ============
// 세로로 좁은 화면에서는 800x520 맵 전체가 다 보이면 캐릭터/설비가 너무 작아서 터치하기
// 힘들다는 피드백이 있어, 좁고 세로로 긴 화면일 때만 카메라를 확대해 캐릭터 주변만 따라가며
// 보여준다. 여기서 "확대율(zoom)"은 캐릭터/오브젝트가 화면에서 보이는 크기(가로 시야 폭)를
// 결정하고, 이건 그대로 둔 채로 캔버스 자체의 세로 해상도만 최대(맵 전체 높이가 보이는 만큼)로
// 키워서 "안의 확대율은 그대로, 창(틀) 자체만 세로로 길어지는" 효과를 낸다 - 세로로 긴 폰에서
// 프레임 위아래로 남는 빈 공간을 줄이기 위함. 캔버스의 CSS 표시 크기는 항상 width:100%;height:auto로
// 해상도 비율을 그대로 따라가므로, 여기서 canvas.height를 키우면 #wrap도 자동으로 더 길쭉해진다.
const camera = { x:0, y:0, zoom:1 };
const CANVAS_BASE_W = 800, CANVAS_BASE_H = 520; // 맵(월드) 크기 - COLS*TILE, ROWS*TILE과 동일, 해상도와는 별개 개념
function isMobilePortrait(){
  return window.innerWidth < 700 && window.innerWidth < window.innerHeight;
}
function computeCameraZoom(){
  return isMobilePortrait() ? 1.7 : 1;
}
// 세로 좁은 화면일 때만 캔버스 세로 해상도를 "맵 전체 높이가 딱 맞게 보이는" 값까지 늘린다.
// 가로 해상도(CANVAS_BASE_W)는 건드리지 않으므로 좌우 확대율(시야 폭)은 그대로 유지된다.
function resizeCanvasForViewport(){
  const targetH = isMobilePortrait() ? Math.round(CANVAS_BASE_H * computeCameraZoom()) : CANVAS_BASE_H;
  if (canvas.height !== targetH) canvas.height = targetH; // 값이 실제로 바뀔 때만 대입(매 프레임 버퍼 리셋 방지)
  if (canvas.width !== CANVAS_BASE_W) canvas.width = CANVAS_BASE_W;
}
function updateCamera(){
  camera.zoom = computeCameraZoom();
  const viewW = canvas.width/camera.zoom, viewH = canvas.height/camera.zoom;
  const camX = (player.x+player.w/2) - viewW/2;
  const camY = (player.y+player.h/2) - viewH/2;
  camera.x = Math.max(0, Math.min(CANVAS_BASE_W-viewW, camX));
  camera.y = Math.max(0, Math.min(CANVAS_BASE_H-viewH, camY));
}

function updatePlayer(){
  let dx=0,dy=0;
  if (keys['arrowup']||keys['w']) { dy=-1; player.dir='up'; }
  else if (keys['arrowdown']||keys['s']) { dy=1; player.dir='down'; }
  else if (keys['arrowleft']||keys['a']) { dx=-1; player.dir='left'; }
  else if (keys['arrowright']||keys['d']) { dx=1; player.dir='right'; }
  else if (touchMoveTarget) {
    // 탭-이동: 물리 키보드 입력이 없을 때만 적용. 한 축씩(더 먼 축 우선) 이동시켜 기존 4방향
    // 이동 로직과 동일한 방식으로 목표 지점까지 지그재그로 다가가게 한다.
    const cx = player.x+player.w/2, cy = player.y+player.h/2;
    const tdx = touchMoveTarget.x-cx, tdy = touchMoveTarget.y-cy;
    if (Math.hypot(tdx,tdy) < 4) {
      // 도착 판정(4px 이내)만 하고 위치를 보정하지 않으면, 목표 지점이 타일 경계에 가깝게 잡혔을 때
      // 오차만큼 옆 타일로 넘어가버려 상호작용 판정(getAdjacentTiles, 타일 좌표 기준)이 실패할 수 있다.
      // ("기계를 탭해도 가끔 반응이 없다"는 문제의 실제 원인) - 목표 좌표에 정확히 스냅해서 방지한다.
      player.x = touchMoveTarget.x - player.w/2;
      player.y = touchMoveTarget.y - player.h/2;
      touchMoveTarget = null;
      if (pendingAutoInteract) { pendingAutoInteract = false; tryInteract(); }
    } else {
      // 우선 축이 벽/설비에 막혀 있으면 다른 축으로 대신 이동해본다 - 아니면 막힌 방향으로
      // 걷기 애니메이션만 계속 재생되고 실제로는 전혀 움직이지 못하는 "제자리걸음" 버그가 생긴다.
      const testSpd = player.speed;
      const footTy = Math.floor((player.y+player.h-4)/TILE);
      const footTx = Math.floor((player.x+player.w/2)/TILE);
      const canMoveX = tdx!==0 && !tileSolid(Math.floor((player.x+Math.sign(tdx)*testSpd+player.w/2)/TILE), footTy);
      const canMoveY = tdy!==0 && !tileSolid(footTx, Math.floor((player.y+Math.sign(tdy)*testSpd+player.h-4)/TILE));
      const preferX = Math.abs(tdx) >= Math.abs(tdy);
      if (preferX && canMoveX) { dx = Math.sign(tdx); player.dir = dx>0?'right':'left'; }
      else if (!preferX && canMoveY) { dy = Math.sign(tdy); player.dir = dy>0?'down':'up'; }
      else if (canMoveX) { dx = Math.sign(tdx); player.dir = dx>0?'right':'left'; }
      else if (canMoveY) { dy = Math.sign(tdy); player.dir = dy>0?'down':'up'; }

      if (dx!==0 || dy!==0) {
        touchMoveStuckFrames = 0;
      } else {
        // 양쪽 축이 한 프레임 막혔다고 바로 포기하면, 타일 경계에서 순간적으로만 막힌 것처럼
        // 판정되는 경우까지 취소해버려서 "기계를 탭해도 가끔 반응이 없다"는 원인이 됐다.
        // 잠깐(약 0.3초) 재시도하다가 그래도 계속 막히면 그때 진짜로 포기한다(도달 불가능한 지점을 탭한 경우).
        touchMoveStuckFrames++;
        if (touchMoveStuckFrames > 18) {
          touchMoveTarget = null;
          pendingAutoInteract = false;
          touchMoveStuckFrames = 0;
        }
      }
    }
  }

  player.moving = (dx!==0||dy!==0) && !miniGameActive && !menuOpen && !shopOpen && !dialogueActive;
  player.running = player.moving && (keys['shift']===true) && level >= RUN_UNLOCK_LEVEL;
  const spd = player.running ? player.runSpeed : player.speed;

  if (tutorialActive && tutorialStep===0 && player.moving) advanceTutorial();

  if (player.moving) {
    const tx2 = Math.floor((player.x+dx*spd+player.w/2)/TILE);
    const ty2 = Math.floor((player.y+player.h-4)/TILE);
    if (!tileSolid(tx2,ty2)) player.x += dx*spd;

    const tx3 = Math.floor((player.x+player.w/2)/TILE);
    const ty3 = Math.floor((player.y+dy*spd+player.h-4)/TILE);
    if (!tileSolid(tx3,ty3)) player.y += dy*spd;

    player.animTimer++;
    const animSpeedThreshold = player.running ? 5 : 8; // 달릴 때 다리 애니메이션도 더 빠르게
    if (player.animTimer>animSpeedThreshold) { player.animFrame=(player.animFrame+1)%4; player.animTimer=0; }
  } else player.animFrame = 0;

  // clamp는 발밑 히트박스(footY = y+h-4) 기준으로 통일 - 안 그러면 상체가 벽 위쪽으로 파고듦
  const minX = TILE - player.w/2;
  const maxX = (COLS-1)*TILE - player.w/2;
  const minY = TILE - (player.h-4);
  const maxY = (ROWS-1)*TILE - (player.h-4);
  player.x = Math.max(minX, Math.min(maxX, player.x));
  player.y = Math.max(minY, Math.min(maxY, player.y));
}

function getFacingTile(){
  const cx = player.x+player.w/2, cy = player.y+player.h/2;
  let tx = Math.floor(cx/TILE), ty = Math.floor(cy/TILE);
  if (player.dir==='up') ty--;
  if (player.dir==='down') ty++;
  if (player.dir==='left') tx--;
  if (player.dir==='right') tx++;
  return {tx,ty};
}

// 플레이어의 현재 위치를 둘러싼 상하좌우 4칸(방향 무관). 상호작용은 이 중 아무 칸이나 조건에
// 맞으면 성립하게 해서, 어느 방향을 보고 있든 인접한 설비/테이블과 상호작용할 수 있게 한다.
function getAdjacentTiles(){
  const cx = player.x+player.w/2, cy = player.y+player.h/2;
  const tx = Math.floor(cx/TILE), ty = Math.floor(cy/TILE);
  // 상하좌우 + 대각선까지 포함한 3x3 범위. 테이블/스테이션이 시각적으로 여러 칸에 걸쳐 커 보이다 보니,
  // 사용자가 "옆에 붙어 있다"고 느끼는 위치가 정확히 상하좌우가 아니라 대각선인 경우가 많아 이렇게 넓혔다.
  const tiles = [];
  for (let dy=-1; dy<=1; dy++){
    for (let dx=-1; dx<=1; dx++){
      tiles.push({tx: tx+dx, ty: ty+dy});
    }
  }
  return tiles;
}

// ============ 상호작용 ============
let menuOpen = false;
let currentStationMenu = [];
let currentStationId = null;

function tryInteract(){
  if (dialogueActive) { nextDialogueLine(); return; }
  if (miniGameActive) { handleMiniGameInput(); return; }
  if (menuOpen) return;

  const adj = getAdjacentTiles();

  // 상점 카운터 - 인접한 어느 방향에서든 가능
  // 상점 접근은 이제 P키 전용 (지도상 오브젝트 없음)

  // 설비 확인 - 인접한 어느 방향에서든 가능
  for (const key in stationSlots) {
    if (!STATIONS_DEF[key].owned) continue;
    const s = stationSlots[key];
    const hit = adj.some(({tx,ty}) => ty===s.y && tx>=s.x && tx<s.x+s.w);
    if (hit) { openStationMenu(key); return; }
  }

  // 테이블 서빙 & 치우기 - 인접한 어느 방향에서든 가능
  for (const t of tables) {
    const hit = adj.some(({tx,ty}) => tx===t.x && ty===t.y);
    if (hit) {
      if (t.needsCleanup) { cleanupTable(t); return; }
      if (t.occupied && t.customer.state==='waiting_food') {
        const held = heldItem();
        if (held && held===t.customer.order) {
          if (tutorialActive && tutorialStep===3 && t===tables[0]) {
            // 튜토리얼 중엔 실제 매출/레벨업에 영향 없이 완료 처리만
            clearHeldItem();
            finishTutorial();
          } else {
            serveCustomer(t);
            clearHeldItem(); // 플레이어가 "직접" 서빙했을 때만 여기서 현재 칸을 비운다
          }
        }
        else if (held) setMsg('앗, 손님이 주문한 메뉴가 아니에요! (Q로 다른 아이템 확인)');
        else setMsg('먼저 음식을 만들어야 해요.');
        return;
      }
    }
  }
}

function openStationMenu(stationId){
  currentStationId = stationId;
  currentStationMenu = Object.values(MENU).filter(m => m.station===stationId && isMenuUnlocked(m.id));
  if (currentStationMenu.length===0) { setMsg('아직 이 설비에서 만들 수 있는 메뉴가 없어요.'); return; }
  menuOpen = true;
  let txt = '메뉴 선택: ';
  currentStationMenu.forEach((m,i) => {
    const owned = stock[m.ingredient]>0;
    const iconTxt = (m.iconType==='image') ? '' : m.emoji;
    txt += `[${i+1}] ${iconTxt}${m.label}${owned?'':'(재료없음)'}  `;
  });
  txt += '[ESC]취소';
  setMsg(txt);
  renderStationMenuUI();
}

function selectMenuItem(menuId){
  const m = MENU[menuId];
  if (!hasIngredient(menuId)) { setMsg(`${m.label} 재료(${INGREDIENT_LABELS[m.ingredient]})가 없어요! 상점에서 구매하세요.`); return; }
  if (!hasFreeInventorySlot()) { setMsg('손이 꽉 찼어요! 먼저 들고 있는 걸 서빙하세요. (Q로 아이템 전환)'); return; }
  menuOpen = false;
  closeStationMenuUI();
  startMiniGame(m);
}

// ============ 터치/모바일 조작 ============
// 이 섹션의 버튼들은 터치 기기 전용이 아니라 스페이스/Shift/숫자키처럼 물리 키보드에 의존하던
// 조작을 마우스·스위치 등 키보드가 없는 입력으로도 쓸 수 있게 하는 접근성 대체 수단이기도 하다.

// 캔버스를 탭한 위치로 캐릭터가 걸어간다. 대사/미니게임 중엔 이동 대신 스페이스와 동일하게
// 상호작용으로 처리해서, 키보드 없이도 대사 넘기기·미니게임 조작이 가능하게 한다.
// 설비/테이블을 직접 탭하면 그 앞까지 걸어간 뒤 도착하자마자 자동으로 상호작용까지 이어진다
// ("기계를 누르면 작동해야 한다"는 피드백 반영) - 빈 바닥을 탭했을 땐 이동만 한다.
let touchMoveTarget = null; // {x,y} - 캔버스 내부 좌표(0~800, 0~520) 기준
let pendingAutoInteract = false; // 탭으로 지정한 목표에 도착하면 자동으로 tryInteract()를 한 번 호출
let touchMoveStuckFrames = 0; // 목표 지점으로 가는 길이 막혔을 때 바로 포기하지 않고 잠깐 재시도하기 위한 카운터

function canvasPointFromEvent(e){
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const rawX = (e.clientX-rect.left)*scaleX;
  const rawY = (e.clientY-rect.top)*scaleY;
  // 카메라가 확대/이동되어 있으면(모바일) 화면 좌표를 실제 맵(월드) 좌표로 환산해야 한다
  return { x: rawX/camera.zoom + camera.x, y: rawY/camera.zoom + camera.y };
}

// 탭 좌표(px,py)가 설비 또는 테이블의 대략적인 그림 영역 위에 있는지 확인한다.
// 그림이 타일보다 위로 솟아 있는 경우가 많아, 타일 자체보다 위/아래로 넉넉하게 판정 범위를 잡는다.
function findTappedInteractable(px, py){
  for (const key in stationSlots) {
    if (!STATIONS_DEF[key].owned) continue;
    const s = stationSlots[key];
    const x1=s.x*TILE, y1=(s.y-1)*TILE, x2=(s.x+s.w)*TILE, y2=(s.y+2)*TILE;
    if (px>=x1 && px<x2 && py>=y1 && py<y2) return { ox:s.x, oy:s.y, w:s.w, h:1, approach:'station' };
  }
  for (const t of activeTables()) {
    const x1=t.x*TILE, y1=(t.y-1)*TILE, x2=(t.x+1)*TILE, y2=(t.y+1)*TILE;
    if (px>=x1 && px<x2 && py>=y1 && py<y2) return { ox:t.x, oy:t.y, w:1, h:1, approach:'table' };
  }
  return null;
}

canvas.addEventListener('pointerdown', e => {
  if (titleActive || shopOpen || settingsOpen || menuOpen) return; // 이 상태들은 실제 버튼(오버레이/메뉴)으로 조작
  if (dialogueActive || miniGameActive) { e.preventDefault(); tryInteract(); return; }
  e.preventDefault();
  const p = canvasPointFromEvent(e);
  const hit = findTappedInteractable(p.x, p.y);
  touchMoveStuckFrames = 0;
  if (hit) {
    const adj = findNearestAdjacentOpenTile(hit.ox, hit.oy, hit.w, hit.h, hit.approach);
    touchMoveTarget = { x: adj.tx*TILE + TILE/2, y: adj.ty*TILE + TILE/2 + (adj.pixelOffsetY||0) };
    pendingAutoInteract = true;
  } else {
    touchMoveTarget = p;
    pendingAutoInteract = false;
  }
});

// 디저트 포장 미니게임의 방향 입력. 물리 방향키(keydown)와 아래 터치 방향패드가 모두 이 함수를 공유한다.
function handleSequenceDirection(dir){
  if (!(miniGameActive && miniGame && miniGame.type==='sequence')) return;
  const expected = miniGame.sequence[miniGame.progress];
  if (dir === expected) miniGame.progress++;
  else miniGame.mistakeFlash = 12;
}

const touchDirPad = document.getElementById('touchDirPad');
touchDirPad.querySelectorAll('.dirBtn').forEach(btn => {
  const dir = btn.dataset.dir;
  btn.addEventListener('pointerdown', e => { e.preventDefault(); handleSequenceDirection(dir); });
});

const hudShopBtn = document.getElementById('hudShopBtn');
hudShopBtn.addEventListener('click', toggleShop);

const invSlotsBtn = document.getElementById('invSlots');
invSlotsBtn.addEventListener('click', switchActiveSlot);

// 스테이션 메뉴를 캔버스 그림 대신 실제 버튼으로 렌더링(터치로 탭 가능 + 스크린리더로도 읽힘)
const stationMenuOverlayEl = document.getElementById('stationMenuOverlay');
const stationMenuListEl = document.getElementById('stationMenuList');
const stationMenuCancelBtn = document.getElementById('stationMenuCancelBtn');

function renderStationMenuUI(){
  stationMenuListEl.innerHTML = '';
  currentStationMenu.forEach(m => {
    const owned = stock[m.ingredient] > 0;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.disabled = !owned;
    const iconHtml = (m.iconType==='image' && m.iconImg) ? `<img src="${m.iconImg.src}" alt="">` : (m.emoji ? m.emoji+' ' : '');
    btn.innerHTML = `${iconHtml}${m.label}${owned?'':' (재료없음)'}`;
    btn.addEventListener('click', () => selectMenuItem(m.id));
    stationMenuListEl.appendChild(btn);
  });
  stationMenuOverlayEl.classList.add('open');
  const firstBtn = stationMenuListEl.querySelector('button:not(:disabled)') || stationMenuListEl.querySelector('button');
  if (firstBtn) firstBtn.focus();
}
function closeStationMenuUI(){ stationMenuOverlayEl.classList.remove('open'); }
stationMenuCancelBtn.addEventListener('click', () => {
  menuOpen = false;
  closeStationMenuUI();
  setMsg('취소했어요.');
});

// ============ 손님 시스템 ============
// preferredStations: 이 손님 유형이 선호하는 스테이션(있으면 그쪽 메뉴를 더 자주 주문). 완전 랜덤보다 손님 유형에 의미를 부여.
const customerTypes = [
  { name:'단골 손님', shirt: PAL.shirtRed, preferredStations: ['espresso'] },
  { name:'대학생', shirt: PAL.shirtGreen, preferredStations: ['smoothie', 'wok'] },
  { name:'직장인', shirt: PAL.shirtBlue, preferredStations: ['espresso', 'wok'] },
  { name:'관광객', shirt: PAL.shirtPurple, preferredStations: ['dessert', 'smoothie'] },
];

let spawnTimer=700, spawnBaseInterval=750; // 테이블이 6개로 늘어난 만큼 스폰도 조금 빠르게(첫 손님은 5~6초 내)

function availableMenu(){
  return Object.values(MENU).filter(m => isMenuUnlocked(m.id) && STATIONS_DEF[m.station].owned);
}

function trySpawnCustomer(){
  if (tutorialActive) return; // 튜토리얼 중에는 실제 손님이 끼어들지 않게 막는다
  spawnTimer++;
  // 시간이 지날수록(레벨이 오를수록) 손님이 더 자주 온다 - 레벨1 기준 그대로, 레벨5면 약 40% 더 빠르게
  const levelSpeedup = gameMode==='idle' ? 1 : (1 - (level-1)*0.1);
  const interval = spawnBaseInterval * reputationSpawnMultiplier() * (gameMode==='idle' ? IDLE_BALANCE.spawnMult : 1) * levelSpeedup;
  if (spawnTimer<interval) return;
  spawnTimer=0;

  // 치우지 않은 테이블(needsCleanup)에는 새 손님이 앉을 수 없음. 아직 해금 안 된 테이블도 제외.
  const freeTables = activeTables().filter(t=>!t.occupied && !t.needsCleanup);
  if (freeTables.length===0) return;

  const menuPool = availableMenu();
  if (menuPool.length===0) return;

  const table = freeTables[Math.floor(Math.random()*freeTables.length)];
  const type = customerTypes[Math.floor(Math.random()*customerTypes.length)];

  // 손님 유형의 선호 스테이션 메뉴에 가중치를 줘서 뽑음 (선호 메뉴가 있으면 3배 확률)
  const weighted = [];
  menuPool.forEach(m => {
    const weight = type.preferredStations.includes(m.station) ? 3 : 1;
    for (let i=0;i<weight;i++) weighted.push(m);
  });
  const order = weighted[Math.floor(Math.random()*weighted.length)];

  // 레벨5(전체 해금) 이후부터 가끔 VIP 손님 등장 - 후반부에 변주를 주기 위한 장치.
  // VIP는 가격 1.8배, 평판 보너스도 크지만 인내심이 짧아 빠른 대응이 필요함.
  const isVip = level>=5 && Math.random() < 0.07;

  table.occupied = true;
  const basePatience = (isVip?1300:2100) * (gameMode==='idle' ? IDLE_BALANCE.patienceMult : 1);
  table.customer = {
    type, order:order.id, orderLabel:order.label, emoji:order.emoji,
    price: isVip ? Math.round(order.price*1.8) : order.price,
    isVip,
    state:'ordering', patience: basePatience, maxPatience: basePatience, bubbleTimer:60,
  };
}

function updateCustomers(){
  for (const t of tables) {
    if (!t.occupied) continue;
    const c = t.customer;
    if (c.state==='ordering') {
      c.bubbleTimer--;
      if (c.bubbleTimer<=0) {
        c.state='waiting_food';
        if (tutorialActive && tutorialStep===1 && t===tables[0]) {
          tutorialStep = 2;
          setTutorialBanner(isTouchDevice
            ? `손님이 "${c.orderLabel}"를 주문했어요! 커피머신을 탭해보세요.`
            : `손님이 "${c.orderLabel}"를 주문했어요! 커피머신 앞에서 스페이스를 눌러보세요.`);
        }
      }
    } else if (c.state==='waiting_food') {
      c.patience--;
      if (c.patience<=0) {
        // 손님이 지쳐서 화난 채로 떠남 - 테이블은 치우기 전까지 사용 불가, 평판 하락
        t.occupied=false; t.customer=null; t.needsCleanup=true;
        adjustReputation(-4);
        refreshHUD();
        setMsg('😠 손님이 기다리다 지쳐 떠났어요... (평판 하락, 테이블을 치워주세요)');
      }
    }
  }
}

function serveCustomer(table){
  const c = table.customer;
  // 평판 90 이상이면 가게 인기에 손님이 팁을 조금 더 얹어줌 (평판을 계속 관리할 이유를 만듦)
  const tipBonus = reputation>=90 ? Math.round(c.price*0.1) : 0;
  const total = c.price + tipBonus;
  money += total;
  dayEarnings += total;
  cumulativeEarnings += total;
  adjustReputation(c.isVip ? 5 : 2);
  totalServed += 1;
  dayServedCount += 1;
  const tipMsg = tipBonus>0 ? ` (+팁 ${tipBonus}원)` : '';
  setMsg(c.isVip ? `✨ VIP 손님 서빙 완료! +${total}원${tipMsg}` : `${c.orderLabel} 서빙 완료! +${total}원${tipMsg}`);
  // player.inventory는 여기서 건드리지 않는다. 이 함수는 플레이어가 직접 서빙할 때(tryInteract)와
  // 알바가 대신 서빙할 때(updateServerStaff) 모두에서 호출되는데, 여기서 무조건 칸을 비우면
  // 알바가 마침 플레이어와 "같은 메뉴"를 다른 손님에게 서빙하는 순간 플레이어가 방금 완성해서
  // 들고 있던 음식까지 같이 사라지는 심각한 버그가 생긴다. 칸을 비우는 책임은 호출한 쪽에 있다.
  table.occupied=false; table.customer=null; table.needsCleanup=true; // 만족하고 떠났어도 치워야 다음 손님 앉음
  refreshHUD();
  checkLevelUp();
  checkCampaignGoal();
}

function cleanupTable(table){
  table.needsCleanup = false;
  setMsg('테이블을 치웠어요.');
}

// ============ 미니게임 (스테이션별 분기) ============
let miniGameActive=false;
let miniGame=null;

function startMiniGame(menuItem){
  miniGameActive=true;
  const station = menuItem.station;

  if (gameMode==='idle') {
    // 방치형 모드는 미니게임 없이 정해진 시간(IDLE_BALANCE.cookTimeSec)만큼 기다리면 자동 완성
    miniGame = { type:'idleAuto', menuId:menuItem.id, doneTimer:0, totalFrames: Math.round(IDLE_BALANCE.cookTimeSec*60) };
    setMsg('조리 중...');
    return;
  }

  if (station==='smoothie') {
    miniGame = { type:'shake', menuId:menuItem.id, phase:'blending', blendProgress:0, blendTarget:70+Math.random()*30, freezeTimer:0, shakeGauge:0, cyclesLeft: Math.random()<0.2 ? 1 : 0, doneTimer:0 }; // 난이도 추가 완화: 80% 확률로 안 멈추고, 20% 확률로 딱 1번만 멈춤
    setMsg(isTouchDevice ? '갈리는 중... 멈추면 화면을 연타해서 흔들기!' : '갈리는 중... 멈추면 스페이스 연타로 흔들기!');
  } else if (station==='espresso') {
    miniGame = { type:'timing', menuId:menuItem.id, pos:0, dir:1, speed: 2.0, target: 40+Math.random()*20, targetWidth:22, phase:'running', doneTimer:0, attemptsLeft:1 }; // 난이도 하락: 속도 완화, 목표구간 확대
    setMsg(isTouchDevice ? '화면을 탭해서 게이지를 목표 구간에 맞춰 멈추세요!' : '스페이스로 게이지를 목표 구간에 맞춰 멈추세요!');
  } else if (station==='dessert') {
    // 방향키 시퀀스 미니게임: 진열대에서 포장할 방향을 무작위로 2~3개 순서대로 맞추기
    const seqLen = 2 + Math.floor(Math.random()*2); // 2~3개
    const dirs = ['up','down','left','right'];
    const sequence = Array.from({length:seqLen}, ()=>dirs[Math.floor(Math.random()*4)]);
    miniGame = { type:'sequence', menuId:menuItem.id, sequence, progress:0, doneTimer:0, mistakeFlash:0 };
    setMsg('포장 중! 화면에 뜨는 방향키를 순서대로 눌러보세요. (터치는 화면의 방향 버튼)');
    touchDirPad.classList.add('open');
  } else if (station==='wok') {
    miniGame = { type:'stir', menuId:menuItem.id, heat:50, target:[50,90], stirGauge:0, timeLeft:420, phase:'running', doneTimer:0 }; // 난이도 하락: 목표구간 확대, 제한시간 연장
    setMsg(isTouchDevice ? '화면을 연타해서 화력을 목표 구간(초록)에 유지하세요!' : '스페이스를 연타해서 화력을 목표 구간(초록)에 유지하세요!');
  }
}

function handleMiniGameInput(){

  if (!miniGame) return;
  if (miniGame.type==='shake' && miniGame.phase==='frozen') {
    miniGame.shakeGauge = Math.min(100, miniGame.shakeGauge+14);
  } else if (miniGame.type==='timing' && miniGame.phase==='running') {
    miniGame.phase='stopped';
    const hit = Math.abs(miniGame.pos - miniGame.target) <= miniGame.targetWidth/2;
    miniGame.success = hit;
    miniGame.doneTimer=0;
  } else if (miniGame.type==='stir') {
    miniGame.heat = Math.min(100, miniGame.heat+9);
  }
}

function finishMiniGame(menuId){
  consumeIngredient(menuId);
  addToInventory(menuId);
  const label = MENU[menuId].label;
  setMsg(`${label} 완성! 손님에게 가져다주세요.`);
  miniGameActive=false;
  miniGame=null;
  touchDirPad.classList.remove('open');
  if (tutorialActive && tutorialStep===2) {
    tutorialStep = 3;
    setTutorialBanner(isTouchDevice
      ? '완성했어요! 손님 테이블을 탭해서 서빙해보세요.'
      : '완성했어요! 손님 테이블로 가서 스페이스로 서빙해보세요.');
  }
}

function updateMiniGame(){
  if (!miniGameActive||!miniGame) return;
  const g = miniGame;

  if (g.type==='idleAuto') {
    g.doneTimer++;
    if (g.doneTimer >= g.totalFrames) finishMiniGame(g.menuId);
    return;
  }

  if (g.type==='sequence') {
    if (g.mistakeFlash>0) g.mistakeFlash--;
    if (g.progress >= g.sequence.length) {
      g.doneTimer++;
      if (g.doneTimer>25) finishMiniGame(g.menuId);
    }
    return;
  }

  if (g.type==='shake') {
    if (g.phase==='blending') {
      g.blendProgress += 1.2;
      if (g.blendProgress>=g.blendTarget) {
        if (g.cyclesLeft>0) { g.phase='frozen'; g.shakeGauge=0; g.freezeTimer=0; setMsg(isTouchDevice ? '멈췄어요! 화면을 연타해서 흔드세요!' : '멈췄어요! 행동 버튼(스페이스)을 연타해서 흔드세요!'); }
        else { g.phase='done'; g.doneTimer=0; }
      }
    } else if (g.phase==='frozen') {
      // 게이지가 이미 100 이상이면(입력으로 방금 채워졌으면) 감소 적용 전에 먼저 통과시킨다.
      // 그렇지 않으면 "입력으로 100 도달 -> 바로 다음 프레임 감소 -> 다시 100 미만"이 되어
      // 영원히 다음 단계로 못 넘어가는 경합 버그가 생긴다.
      if (g.shakeGauge>=100) {
        g.cyclesLeft--; g.blendProgress=0; g.blendTarget=60+Math.random()*50; g.phase='blending';
      } else {
        g.freezeTimer++;
        g.shakeGauge = Math.max(0, g.shakeGauge-0.6);
        if (g.freezeTimer>240) { g.cyclesLeft--; g.blendProgress=0; g.blendTarget=60+Math.random()*50; g.phase='blending'; }
      }
    } else if (g.phase==='done') {
      g.doneTimer++;
      if (g.doneTimer>35) finishMiniGame(g.menuId);
    }
  }

  else if (g.type==='timing') {
    if (g.phase==='running') {
      g.pos += g.dir*g.speed;
      if (g.pos>=100) { g.pos=100; g.dir=-1; }
      if (g.pos<=0) { g.pos=0; g.dir=1; }
    } else if (g.phase==='stopped') {
      g.doneTimer++;
      if (g.doneTimer===1) {
        setMsg(g.success ? '완벽한 타이밍! ✨' : '아쉽지만 완성은 됐어요.');
      }
      if (g.doneTimer>40) finishMiniGame(g.menuId);
    }
  }

  else if (g.type==='instant') {
    g.doneTimer++;
    if (g.doneTimer>30) finishMiniGame(g.menuId);
  }

  else if (g.type==='stir') {
    if (g.phase==='running') {
      g.timeLeft--;
      g.heat = Math.max(0, g.heat-0.5);
      if (g.heat>=g.target[0] && g.heat<=g.target[1]) g.stirGauge = Math.min(100, g.stirGauge+0.6);
      else g.stirGauge = Math.max(0, g.stirGauge-0.25);

      if (g.stirGauge>=100) { g.phase='done'; g.doneTimer=0; }
      if (g.timeLeft<=0) { g.phase='done'; g.doneTimer=0; } // 시간 끝나도 완성은 시켜줌(진입장벽 낮게)
    } else if (g.phase==='done') {
      g.doneTimer++;
      if (g.doneTimer>35) finishMiniGame(g.menuId);
    }
  }
}

// ============ 상점 ============
let shopOpen = false;
let shopTab = 'ingredients';
const shopOverlay = document.getElementById('shopOverlay');
const shopGrid = document.getElementById('shopGrid');
const shopClose = document.getElementById('shopClose');

const INGREDIENT_SHOP = [
  { key:'coffeeBean', price:100, qty:5 },
  { key:'milk', price:150, qty:5 },
  { key:'vanillaSyrup', price:180, qty:5 },
  { key:'chocoSyrup', price:180, qty:5 },
  { key:'caramelSyrup', price:200, qty:5 },
  { key:'strawberry', price:150, qty:5 },
  { key:'mango', price:170, qty:5 },
  { key:'macaronBase', price:180, qty:5 },
  { key:'croissantBase', price:150, qty:5 },
  { key:'sandwichBase', price:250, qty:5 },
  { key:'cakeBase', price:280, qty:5 },
  { key:'tteok', price:250, qty:5 },
  { key:'rice', price:270, qty:5 },
];

function ingredientUnlockLv(key){
  const menu = Object.values(MENU).find(m=>m.ingredient===key);
  return menu ? menu.unlockLv : 1;
}

function toggleShop(){ shopOpen ? closeShop() : openShop(); }
function openShop(){ shopOpen=true; shopOverlay.classList.add('open'); renderShop(); shopOverlay.focus(); }
function closeShop(){ shopOpen=false; shopOverlay.classList.remove('open'); }
shopClose.addEventListener('click', closeShop);

document.querySelectorAll('#shopTabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('#shopTabs button').forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
    shopTab = btn.dataset.tab;
    renderShop();
  });
});

// 방치형 모드에서는 재료/설비 가격이 더 비싸다 (성장 속도를 늦추기 위함)
function idlePrice(basePrice){
  return gameMode==='idle' ? Math.round(basePrice * IDLE_BALANCE.ingredientPriceMult) : basePrice;
}
function idleStationPrice(basePrice){
  return gameMode==='idle' ? Math.round(basePrice * IDLE_BALANCE.stationPriceMult) : basePrice;
}

function renderShop(){
  shopGrid.innerHTML='';
  if (shopTab==='ingredients') {
    // 정렬: 구매 가능(잠기지 않은) 것 먼저, 그다음 레벨 낮은 순 -> 지금 살 수 있는 게 위로 오게
    const sorted = [...INGREDIENT_SHOP].sort((a,b)=>{
      const lvA = ingredientUnlockLv(a.key), lvB = ingredientUnlockLv(b.key);
      const lockedA = lvA>level, lockedB = lvB>level;
      if (lockedA !== lockedB) return lockedA ? 1 : -1;
      return lvA - lvB;
    });
    // 아직 한참 먼(2레벨 이상 차이) 잠긴 재료는 목록을 어지럽히니 요약 한 줄로만 안내
    const visible = sorted.filter(item => ingredientUnlockLv(item.key) <= level+1);
    const farLocked = sorted.filter(item => ingredientUnlockLv(item.key) > level+1);

    visible.forEach(item=>{
      const lv = ingredientUnlockLv(item.key);
      const locked = lv>level;
      const unlocked = everBought[item.key];
      const price = idlePrice(item.price);
      const iconInfo = INGREDIENT_ICON[item.key];
      const iconHtml = (iconInfo.iconType==='image' && iconInfo.iconImg)
        ? `<img src="${iconInfo.iconImg.src}" alt="" style="width:16px;height:16px;object-fit:contain;vertical-align:-3px;margin-right:4px;">`
        : (iconInfo.emoji ? iconInfo.emoji+' ' : '');
      const div = document.createElement('div');
      div.className = 'shopItem' + (locked?' locked':'') + (unlocked?' owned':'');
      div.innerHTML = `
        <div class="name">${iconHtml}${INGREDIENT_LABELS[item.key]} ${locked?'🔒 Lv.'+lv:(unlocked?'✅ 판매중':'🆕 미해금')}</div>
        <div class="desc">보유: ${stock[item.key]}개 · ${item.qty}개 구매에 ${price}원${unlocked?'':' (처음 구매 시 메뉴 해금!)'}</div>
        <button ${locked||money<price?'disabled':''}>${price}원에 구매</button>
      `;
      if (!locked) {
        div.querySelector('button').addEventListener('click', ()=>{
          if (money>=price) {
            money -= price;
            stock[item.key] += item.qty;
            const firstTime = !everBought[item.key];
            everBought[item.key] = true;
            refreshHUD();
            renderShop();
            if (firstTime) {
              const newMenus = Object.values(MENU).filter(m=>m.ingredient===item.key).map(m=>m.label).join(', ');
              setMsg(`🎉 ${INGREDIENT_LABELS[item.key]} 구매! 신메뉴 해금: ${newMenus}`);
            } else {
              setMsg(`${INGREDIENT_LABELS[item.key]} ${item.qty}개 구매!`);
            }
          }
        });
      }
      shopGrid.appendChild(div);
    });
    if (farLocked.length>0) {
      const summary = document.createElement('div');
      summary.className = 'shopItem locked';
      summary.style.gridColumn = '1 / -1';
      summary.innerHTML = `<div class="desc" style="text-align:center;">🔒 레벨을 더 올리면 ${farLocked.length}개 재료가 추가로 열려요 (다음: Lv.${Math.min(...farLocked.map(i=>ingredientUnlockLv(i.key)))})</div>`;
      shopGrid.appendChild(summary);
    }
  } else if (shopTab==='stations') {
    Object.values(STATIONS_DEF).forEach(s=>{
      const locked = s.unlockLv>level;
      const price = idleStationPrice(s.price);
      const div = document.createElement('div');
      div.className = 'shopItem' + (locked?' locked':'') + (s.owned?' owned':'');
      div.innerHTML = `
        <div class="name">${s.label} ${s.owned?'✅ 보유중':(locked?'🔒 Lv.'+s.unlockLv:'')}</div>
        <div class="desc">${s.owned?'이미 설치되어 있어요.':(locked?'레벨을 올리면 구매할 수 있어요.':'가격: '+price+'원')}</div>
        <button ${s.owned||locked||money<price?'disabled':''}>${s.owned?'보유중':price+'원에 구매'}</button>
      `;
      if (!s.owned && !locked) {
        div.querySelector('button').addEventListener('click', ()=>{
          if (money>=price) {
            money -= price;
            s.owned = true;
            applyStationTiles(s.id);
            refreshHUD();
            renderShop();
            setMsg(`${s.label} 설치 완료! 이제 사용할 수 있어요.`);
          }
        });
      }
      shopGrid.appendChild(div);
    });
  } else if (shopTab==='staff') {
    Object.values(STAFF_DEF).forEach(s=>{
      const info = staff[s.id];
      const locked = s.unlockLv>level;
      const hireCost = gameMode==='idle' ? Math.round(s.hireCost*IDLE_BALANCE.staffPriceMult) : s.hireCost;
      const dailyWage = gameMode==='idle' ? Math.round(s.dailyWage*IDLE_BALANCE.staffPriceMult) : s.dailyWage;
      const wageLabel = gameMode==='idle' ? `유지비 ${dailyWage}원 (일정 시간마다 자동 차감)` : `일당 ${dailyWage}원 (자정에 자동 지급)`;
      const div = document.createElement('div');
      div.className = 'shopItem' + (locked?' locked':'') + (info.hired?' owned':'');
      div.innerHTML = `
        <div class="name">${s.label} ${info.hired?'✅ 고용중':(locked?'🔒 Lv.'+s.unlockLv:'')}</div>
        <div class="desc">${s.desc}<br>${info.hired?wageLabel : ('고용비 '+hireCost+'원 + '+wageLabel)}</div>
        <button ${info.hired||locked||money<hireCost?'disabled':''}>${info.hired?'고용중':hireCost+'원에 고용'}</button>
      `;
      if (!info.hired && !locked) {
        div.querySelector('button').addEventListener('click', ()=>{
          if (money>=hireCost) {
            money -= hireCost;
            info.hired = true;
            info.workTimer = 0;
            refreshHUD();
            renderShop();
            setMsg(`${s.label}를 고용했어요! ${gameMode==='idle' ? '주기적으로 유지비 '+dailyWage+'원이 나가요.' : '매일 자정에 일당 '+dailyWage+'원이 나가요.'}`);
          }
        });
      }
      shopGrid.appendChild(div);
    });
  }
}

// ============ 그리기 ============
function drawFloorAndWalls(){
  const { leftX, rightX } = EXPANSION_STAGES[currentExpansionStage];
  for (let y=0;y<ROWS;y++) for (let x=0;x<COLS;x++){
    const v=map[y][x], px=x*TILE, py=y*TILE;
    const isOuterWall = (y===0||y===ROWS-1||x===0||x===COLS-1);
    // 아직 레벨업으로 열리지 않은 좌우 구역(확장 경계선 바깥)도 이제는 바닥을 그대로 보여주고,
    // 반투명 오버레이(drawUnopenedOverlay)로 "아직 못 들어가는 공간"임을 표현한다.
    // (예전엔 완전히 검게 칠해서 안이 하나도 안 보였는데, 미리보기가 없으니 어색하다는 피드백을 반영)
    const isUnopened = !isOuterWall && (x < leftX || x > rightX);
    if (isUnopened) {
      if (floorCustom.img) drawFloorTile(px, py);
      else { ctx.fillStyle = ((x+y)%2===0)?PAL.floor1:PAL.floor2; ctx.fillRect(px,py,TILE,TILE); }
    } else if (v===1) {
      ctx.fillStyle=PAL.wallTop; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle=PAL.wall; ctx.fillRect(px,py+TILE-6,TILE,6);
    } else if (floorCustom.img) {
      drawFloorTile(px, py);
    } else {
      ctx.fillStyle = ((x+y)%2===0)?PAL.floor1:PAL.floor2;
      ctx.fillRect(px,py,TILE,TILE);
    }
  }
}

// 아직 해금되지 않은 구역: 그 안에 놓일 테이블을 흐릿하게 미리 보여준 다음, 구역 전체에
// 반투명 검은 오버레이를 씌우고 "🔒 Lv.N에 해금" 안내를 표시한다.
function drawUnopenedPreview(){
  const { leftX, rightX } = EXPANSION_STAGES[currentExpansionStage];
  if (leftX<=1 && rightX>=COLS-2) return; // 전체 개방 상태면 그릴 미개방 구역이 없음

  // 아직 해금 안 된(레벨 미달) 테이블들을 흐릿하게 미리보기로 그린다
  tables.filter(t => t.unlockLevel>level).forEach(t => {
    ctx.save();
    ctx.globalAlpha = 0.4;
    drawTable(t);
    ctx.restore();
  });

  // 좌/우 각 미개방 구역에 반투명 검정 오버레이 + 해금 조건 텍스트
  const zones = [];
  if (leftX>1) zones.push({ x0:1, x1:leftX-1 });
  if (rightX<COLS-2) zones.push({ x0:rightX+1, x1:COLS-2 });

  zones.forEach(z => {
    const px0 = z.x0*TILE, px1 = (z.x1+1)*TILE;
    const py0 = TILE, py1 = (ROWS-1)*TILE;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(px0, py0, px1-px0, py1-py0);

    // 이 구역 안에서 가장 먼저 열리는 테이블의 필요 레벨을 안내 문구로 표시
    const tablesInZone = tables.filter(t => t.unlockLevel>level && t.x>=z.x0 && t.x<=z.x1);
    const nextLv = tablesInZone.length ? Math.min(...tablesInZone.map(t=>t.unlockLevel)) : null;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔒', (px0+px1)/2, (py0+py1)/2 - 12);
    if (nextLv) ctx.fillText(`Lv.${nextLv}에 해금`, (px0+px1)/2, (py0+py1)/2 + 10);
  });
}

// 바닥 커스텀 이미지를 한 칸(TILE x TILE)에 그린다. 시트가 여러 칸으로 나뉜 경우(tileCols/tileRows>1)
// tileIndex번째 칸만 잘라서 쓴다 - RPG Maker 타일셋을 나중에 붙일 자리.
function drawFloorTile(px, py){
  const img = floorCustom.img;
  // naturalWidth/Height가 0인(손상되었거나 로드 실패한) 이미지는 매 타일마다 예외를 던져 렌더링을 멈추므로
  // 기본 체크무늬 바닥으로 폴백한다.
  if (!img.naturalWidth || !img.naturalHeight) {
    ctx.fillStyle = ((Math.round(px/TILE)+Math.round(py/TILE))%2===0)?PAL.floor1:PAL.floor2;
    ctx.fillRect(px,py,TILE,TILE);
    return;
  }
  const cellW = img.naturalWidth / floorCustom.tileCols;
  const cellH = img.naturalHeight / floorCustom.tileRows;
  const col = floorCustom.tileIndex % floorCustom.tileCols;
  const row = Math.floor(floorCustom.tileIndex / floorCustom.tileCols);
  ctx.drawImage(img, col*cellW, row*cellH, cellW, cellH, px, py, TILE, TILE);
}

function drawStation(key){
  const def = STATIONS_DEF[key];
  if (!def.owned) return;
  const s = stationSlots[key];
  const px=s.x*TILE, py=s.y*TILE, w=s.w*TILE, h=TILE;

  const customImg = decorCustom.stations[key] && decorCustom.stations[key].img;
  // naturalWidth/Height가 0인(손상되었거나 아직 완전히 로드되지 않은) 이미지는 무시하고 기본 그림으로 폴백
  // - 그대로 두면 scale이 Infinity가 되어 drawImage가 예외를 던지고 이후 프레임 렌더링이 전부 멈춘다.
  const customImgValid = customImg && customImg.naturalWidth>0 && customImg.naturalHeight>0;

  // 예전엔 기계 아래에 카운터(받침대) 사각형을 항상 깔았는데, 모바일에서 그 납작한 갈색 사각형이
  // "기계를 탭했다"는 느낌을 방해하고 시각적으로도 둔해 보인다는 피드백이 있어 제거했다.
  // 그 대신 넣었던 옅은 그림자도 불필요하다는 피드백이 있어 함께 제거했다 - 상호작용 판정 영역
  // (findTappedInteractable)은 이 그림과 무관하게 타일 좌표 기준으로 이미 넉넉하게 잡혀 있다.

  if (customImgValid) {
    // 카운터 위쪽 공간(대략 타일 1.9칸 높이)에 비율을 유지한 채 맞춰 그린다
    const boxW = w, boxH = TILE*1.9;
    const scale = Math.min(boxW/customImg.naturalWidth, boxH/customImg.naturalHeight);
    const dw = customImg.naturalWidth*scale, dh = customImg.naturalHeight*scale;
    ctx.drawImage(customImg, px+w/2-dw/2, py+h-10-dh, dw, dh);
  } else if (key==='espresso') {
    // 기계가 너무 작다는 피드백으로 기존 대비 폭/높이를 한 번 더 키웠다(타일 폭을 살짝 넘어가게)
    ctx.fillStyle=PAL.machineDark; ctx.fillRect(px-2,py-34,w+4,46);
    ctx.fillStyle=PAL.coffeeDark; ctx.fillRect(px+w/2-16,py-14,32,16);
    ctx.fillStyle='#e8b04b'; ctx.fillRect(px,py-31,w,7);
  } else if (key==='smoothie') {
    ctx.fillStyle=PAL.machineBody; ctx.fillRect(px,py-24,w,40);
    ctx.fillStyle=PAL.machineDark; ctx.fillRect(px,py-24,w,7);
    ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(px+w/2-14,py-40,28,22);
    ctx.strokeStyle=PAL.machineDark; ctx.strokeRect(px+w/2-14,py-40,28,22);
  } else if (key==='dessert') {
    ctx.fillStyle=PAL.displayGlass; ctx.fillRect(px-2,py-36,w+4,42);
    ctx.strokeStyle=PAL.machineDark; ctx.strokeRect(px-2,py-36,w+4,42);
    ctx.fillStyle='#f0c96a'; ctx.fillRect(px+3,py-9,w-6,7);
    ctx.font='19px serif'; ctx.textAlign='center';
    ctx.fillText('🍰🥐', px+w/2, py-11);
  } else if (key==='wok') {
    ctx.fillStyle=PAL.ovenDark; ctx.fillRect(px-2,py-27,w+4,32);
    ctx.fillStyle=PAL.panMetal;
    ctx.beginPath(); ctx.ellipse(px+w/2,py-17,w/2+2,11,0,0,Math.PI*2); ctx.fill();
  }

  if (miniGameActive && currentIsStation(key)) {
    // 진행중인 미니게임 색 표시(딸기/망고/타이밍 등은 오버레이에서 별도 표시)
  }
}
function currentIsStation(key){
  if (!miniGame) return false;
  const m = MENU[miniGame.menuId];
  return m && m.station===key;
}

// ============ 알바 캐릭터 그리기 ============
// 주방 알바: 소유한 스테이션 중 하나 앞에 고정으로 서서 조리하는 모션(작업 사이클에 맞춰 살짝 흔들림)
// 서빙 알바: 카운터와 테이블 사이 통로에 고정 배치, 완성품을 옮기는 모션
function drawStaffCharacters(){
  if (staff.cook.hired) {
    const ownedKeys = Object.keys(stationSlots).filter(k=>STATIONS_DEF[k].owned);
    if (ownedKeys.length>0) {
      // 재료가 있는 스테이션 중 아무거나 하나를 "일하는 자리"로 사용 (간단한 고정 배치)
      const key = ownedKeys[0];
      const s = stationSlots[key];
      const px = s.x*TILE + TILE - 6, py = s.y*TILE + TILE + 4; // 스테이션 바로 아래쪽에 배치
      const bob = Math.sin(Date.now()/220)*2;
      drawMiniStaffFigure(px, py+bob, PAL.shirtGreen, '👨‍🍳', 'cook', 'down');
    }
  }
  if (staff.server.hired) {
    // 주방(스테이션 라인)과 테이블 사이 통로 한가운데에 배치 - "서빙하러 오가는 중"처럼 보이도록
    // 왼쪽-오른쪽으로 오가는 모션을 줘서 실제로 테이블 사이를 순회하는 느낌을 준다.
    const t = Date.now()/1000;
    const sway = Math.sin(t*0.6)*140; // 넓은 폭으로 좌우 왕복
    const px = 300 + sway;
    const py = 5.5*TILE;
    const dir = Math.cos(t*0.6) >= 0 ? 'right' : 'left';
    drawMiniStaffFigure(px, py, PAL.shirtPurple, '🧑‍🍳', 'server', dir);
  }
}

function drawMiniStaffFigure(px, py, shirtColor, emoji, charKey, dir){
  // 그림자
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(px+10, py+24, 10, 3, 0, 0, Math.PI*2); ctx.fill();

  const custom = charKey ? characterCustom[charKey] : null;
  // drawCharacterAt은 CHAR_TARGET_W/H 박스 기준으로 이미지를 가운데 정렬하므로, 여기서 넘기는 좌표도
  // 반드시 그 폭을 기준으로 계산해야 한다(이전엔 도트 그림 기준 폭 20으로 계산해서 오른쪽으로 쏠려 보였음).
  // 발밑 기준점은 도트 그림의 발밑(py+24)에 맞춘다.
  const footY = py+24;
  const customDrawn = custom ? drawCharacterAt(ctx, custom, dir||'down', true, px+10-CHAR_TARGET_W/2, footY-CHAR_TARGET_H, 0) : false;

  if (!customDrawn) {
    // 기본 도트 알바도 기존 대비 약 20% 키웠다(발밑 기준점 py+24는 유지)
    ctx.fillStyle=PAL.apron; ctx.fillRect(px, py+10, 19, 14);
    ctx.fillStyle=shirtColor; ctx.fillRect(px, py+5, 19, 7);
    ctx.fillStyle=PAL.skin; ctx.fillRect(px+3, py-6, 14, 14);
    ctx.fillStyle=PAL.hairBrown; ctx.fillRect(px+2, py-10, 16, 6);
  }

  // 알바 표시 이모지(작게, 머리 위)
  ctx.font='11px serif'; ctx.textAlign='center';
  ctx.fillText(emoji, px+10, py-13);
}

// 테이블 하나가 차지하는 시각적 크기(칸 수 기준). 실제 충돌은 여전히 t.x,t.y 한 칸만 막지만,
// 그림은 이보다 크게 그려서 위쪽으로 살짝 넘치게 한다 - 그 넘친 부분은 Y-sorting으로 자연스럽게
// 캐릭터와 겹쳐 보이게 처리한다(플레이어가 테이블 뒤에 서면 가려지고, 앞에 서면 위로 보임).
// 타일 크기(TILE)는 그대로 두고 배수만 키워서 테이블만 도드라져 보이게 확대했다.
const TABLE_VISUAL_W = TILE*1.5, TABLE_VISUAL_H = TILE*1.75;
// 기본(커스텀 이미지 없음) 테이블 상판 높이 - 예전엔 TABLE_VISUAL_H*0.22(얇은 판자 한 줄)라 납작해 보였다.
// 위에서 내려다본 정사각형 테이블처럼 보이도록 가로(TABLE_VISUAL_W)에 가까운 높이로 키웠다.
const TABLE_TOP_H_DEFAULT = TABLE_VISUAL_W*0.68;

function drawTable(t){
  const cx = t.x*TILE + TILE/2, footY = t.y*TILE + TILE; // 발밑(충돌 기준) 좌표는 그대로 유지
  const topY = footY - TABLE_VISUAL_H;
  const customImg = decorCustom.table.img;
  // naturalWidth/Height가 0인(손상되었거나 아직 로드 안 된) 이미지는 무시하고 기본 도트 그림으로 폴백
  // - 방치하면 scale이 Infinity가 되어 drawImage가 예외를 던지고 이후 프레임 렌더링이 전부 멈춘다.
  const customImgValid = customImg && customImg.naturalWidth>0 && customImg.naturalHeight>0;
  // scale은 겹침 계산과 실제 그리기 양쪽에서 쓰이므로 한 번만 계산해둔다
  const imgScale = customImgValid ? Math.min(TABLE_VISUAL_W/customImg.naturalWidth, TABLE_VISUAL_H/customImg.naturalHeight) : 0;

  // 커스텀 테이블 이미지는 크기가 제각각이라, 이미지 전체 높이의 22%만 손님과 겹치게 계산한다
  // (기본 도트 그림의 상판 비율과 동일하게 맞춰서, 큰 이미지를 올려도 손님이 심하게 가려지지 않게 함)
  let overlapH = TABLE_TOP_H_DEFAULT;
  if (customImgValid) {
    overlapH = (customImg.naturalHeight*imgScale)*0.22;
  }

  // 손님이 있으면 테이블보다 먼저 그려서, 테이블 상판이 손님 발밑~다리 정도만 자연스럽게 겹치게 한다
  // (겹치는 비율이 너무 크면 손님 얼굴/몸통이 상판에 가려지므로, 발밑 기준점을 살짝 더 위로 둔다)
  if (t.occupied) drawCustomer(t, cx, footY - overlapH - 8);

  if (customImgValid) {
    const dw = customImg.naturalWidth*imgScale, dh = customImg.naturalHeight*imgScale;
    ctx.drawImage(customImg, cx-dw/2, footY-dh, dw, dh);
  } else {
    // 위에서 내려다본 듯한 정사각형 테이블. 예전엔 얇은 판자 한 줄만 그려서 납작해 보였던 것을,
    // 각진 사각 상판(사용자 피드백: 너무 둥글게 하지 말고 각진 채로) + 짙은 테두리 + 광택으로
    // 바꿔서 "테이블만 위에서 본" 느낌을 준다.
    const topH = TABLE_TOP_H_DEFAULT;
    const legH = 7; // 상판 아래로 살짝 보이는 다리(앞쪽 두께) - 이 부분만 손님 발밑과 겹친다
    const plateTop = footY - topH, plateH = topH - legH;
    ctx.fillStyle='rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(cx, footY-legH*0.6, TABLE_VISUAL_W*0.46, 7, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle=PAL.tableWood;
    ctx.fillRect(cx-TABLE_VISUAL_W/2, plateTop, TABLE_VISUAL_W, plateH);
    ctx.strokeStyle='#6b4a30'; ctx.lineWidth=2.5;
    ctx.strokeRect(cx-TABLE_VISUAL_W/2+1.5, plateTop+1.5, TABLE_VISUAL_W-3, plateH-3);
    // 상판 위 살짝 광택
    ctx.fillStyle='rgba(255,255,255,0.16)';
    ctx.fillRect(cx-TABLE_VISUAL_W/2+7, plateTop+6, TABLE_VISUAL_W-14, 5);
    // 앞쪽 다리 두께(입체감) - 손님 발밑과 자연스럽게 겹치는 부분
    ctx.fillStyle='#6b4a30';
    ctx.fillRect(cx-TABLE_VISUAL_W/2+5, footY-legH, TABLE_VISUAL_W-10, legH);
  }

  if (t.needsCleanup) {
    // 지저분한 그릇 표시 + 청소 안내 아이콘. 예전엔 테이블 맨 위(topY)에 작게 그려서 모바일처럼
    // 화면이 작게 보일 때 잘 안 띈다는 피드백이 있어, 테이블 바로 위로 내리고 흰 배경 원 + 큰
    // 글자로 눈에 확 띄게 했다.
    ctx.fillStyle='#8a8a8a';
    ctx.beginPath(); ctx.ellipse(cx-8, footY-18, 6, 4, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+8, footY-16, 5, 4, 0, 0, Math.PI*2); ctx.fill();
    const iconY = footY - 32;
    ctx.fillStyle='rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(cx, iconY-7, 16, 0, Math.PI*2); ctx.fill();
    ctx.font='26px serif'; ctx.textAlign='center';
    ctx.fillText('🧹', cx, iconY);
  }
}

// 손님 유형(customerTypes 항목)에 맞는 커스텀 이미지 데이터를 반환. 없으면 null(기본 도트 그림 사용).
function getCustomerCustomFor(type){
  if (customerCustom.mode==='unified') return customerCustom.unified.mode ? customerCustom.unified : null;
  if (customerCustom.mode==='perType') {
    const idx = customerTypes.indexOf(type);
    if (idx>=0 && customerCustom.perType[idx].mode) return customerCustom.perType[idx];
  }
  return null;
}

function drawCustomer(t, cx, cy){
  const c=t.customer;
  const px = cx!==undefined ? cx : (t.x*TILE+TILE/2);
  const py = cy!==undefined ? cy : (t.y*TILE+10);

  const custom = getCustomerCustomFor(c.type);
  // drawCharacterAt은 내부적으로 CHAR_TARGET_W/H 박스 기준으로 이미지를 가운데 정렬하므로,
  // 여기서 넘기는 좌표도 반드시 같은 폭(CHAR_TARGET_W)을 기준으로 계산해야 한다.
  // (이전엔 custW=34로 계산해서 실제보다 좁은 박스를 넘기는 바람에 이미지가 오른쪽으로 쏠려 보였음)
  const custH = CHAR_TARGET_H*0.68; // 손님은 플레이어보다 살짝 작게 표시(발밑 기준점 py는 그대로 유지)
  const customDrawn = custom ? drawCharacterAt(ctx, custom, 'down', false, px-CHAR_TARGET_W/2, py-custH+8, 0) : false;

  if (!customDrawn) {
    // 커스텀 이미지가 없을 땐 각지고 못생긴 도트 사람 대신, 귀여운 토끼 이모지로 손님을 표시한다
    // (사용자 피드백: 손님 도트 그림이 못생겨 보임 -> 이미지 없을 때는 그냥 토끼 이모지로).
    ctx.font = Math.round(custH*0.82)+'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('🐰', px, py);
  }

  if (c.isVip) {
    // VIP 표시: 말풍선 박스보다 더 위(바깥)에 그려서 안 가리게
    ctx.font='16px serif'; ctx.textAlign='center';
    ctx.fillText('👑', px, py-custH-14);
  }

  if (c.state==='ordering'||c.state==='waiting_food') {
    const bx=px, by=py-custH+2;
    ctx.fillStyle= c.isVip ? '#fff8e0' : '#fff';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx-18,by-15,36,24,5); else ctx.rect(bx-18,by-15,36,24);
    ctx.fill();
    ctx.strokeStyle= c.isVip ? '#e8b04b' : '#222'; ctx.lineWidth = c.isVip?2:1.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx-4,by+9); ctx.lineTo(bx,by+15); ctx.lineTo(bx+4,by+9); ctx.fill();
    const orderMenu = MENU[c.order];
    drawMenuIcon(ctx, orderMenu || {iconType:'emoji', emoji:c.emoji}, bx, by+1, 17);

    if (c.state==='waiting_food') {
      const ratio=c.patience/c.maxPatience;
      ctx.fillStyle='#2b2117'; ctx.fillRect(bx-18,by-22,36,4);
      ctx.fillStyle = ratio>0.3?'#4a8a5a':'#b0453f';
      ctx.fillRect(bx-18,by-22,36*ratio,4);
    }
  }
}

// 커스텀 이미지가 있으면 그리고, 없으면 false를 반환(호출부가 기본 도트 그림으로 폴백하도록).
// dir: 'up'|'down'|'left'|'right', walking: 애니메이션 프레임 여부, x/y: 좌상단 기준, bob: 위아래 흔들림 보정
// 메뉴/재료 아이콘을 그린다. iconType이 'image'면 이미지를, 아니면 emoji 필드를 텍스트로 그린다.
// cx,cy는 아이콘 중심 좌표, size는 대략적인 목표 크기(px).
function drawMenuIcon(targetCtx, iconHolder, cx, cy, size){
  if (iconHolder.iconType==='image' && iconHolder.iconImg && iconHolder.iconImg.naturalWidth>0 && iconHolder.iconImg.naturalHeight>0) {
    const img = iconHolder.iconImg;
    const scale = Math.min(size/img.naturalWidth, size/img.naturalHeight);
    const dw = img.naturalWidth*scale, dh = img.naturalHeight*scale;
    targetCtx.drawImage(img, cx-dw/2, cy-dh/2, dw, dh);
  } else {
    // 이모지 글리프는 브라우저마다 폰트의 em box보다 아래쪽으로 치우쳐 렌더링되는 경우가 많아,
    // textBaseline='middle'을 줘도 실제 시각적 중심이 cy보다 아래로 내려가 말풍선 밖으로 삐져나와 보인다.
    // 크기를 약간 줄이고 위쪽으로 살짝(size*0.08) 보정해 좁은 말풍선 안에도 안정적으로 들어가게 한다.
    const emojiSize = Math.round(size*0.78);
    targetCtx.font = emojiSize+'px serif';
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.fillText(iconHolder.emoji || '', cx, cy - size*0.08);
    targetCtx.textBaseline = 'alphabetic'; // 다른 그리기 코드에 영향 안 주도록 기본값 복귀
  }
}

function drawCharacterAt(targetCtx, custom, dir, walking, x, y, bob){
  if (!custom || !custom.mode) return false;

  let entry = null;
  let flip = false;
  if (custom.mode==='single') {
    entry = custom.single;
  } else if (custom.mode==='directional') {
    if (dir==='down') entry = custom.directional.front;
    else if (dir==='up') entry = custom.directional.back;
    else { entry = custom.directional.side; flip = (dir==='right'); } // 옆모습 1장을 좌우반전으로 공유(기본은 왼쪽 기준)
    if (!entry) entry = custom.directional.front || custom.directional.back || custom.directional.side;
  }
  if (!entry || !entry.img || !entry.w || !entry.h) return false; // 손상되었거나 0크기인 이미지는 기본 도트 그림으로 폴백

  // 비율을 유지한 채 CHAR_TARGET_W x CHAR_TARGET_H 안에 맞춰 축소
  const scale = Math.min(CHAR_TARGET_W/entry.w, CHAR_TARGET_H/entry.h);
  const dw = entry.w*scale, dh = entry.h*scale;
  const dx = x + (CHAR_TARGET_W-dw)/2;
  const dy = y + (CHAR_TARGET_H-dh) + bob;

  targetCtx.save();
  if (flip) {
    targetCtx.translate(dx+dw, dy);
    targetCtx.scale(-1,1);
    targetCtx.drawImage(entry.img, 0, 0, dw, dh);
  } else {
    targetCtx.drawImage(entry.img, dx, dy, dw, dh);
  }
  targetCtx.restore();
  return true;
}

function drawPlayer(){
  const px=player.x, py=player.y;
  // animFrame(0~3)을 그대로 sin 위상으로 쓰면 3->0으로 넘어가는 순간 값이 급격히 튀어
  // "위아래로 퉁퉁 튀는" 부자연스러운 움직임이 된다. 대신 규칙적인 4단계 바운스 패턴을 써서
  // 0(딛는 순간, 그림자와 딱 맞음) -> 위로 살짝 -> 0 -> 위로 살짝 순으로 순환하게 한다.
  // 그림자는 고정이므로 bob이 0 밑으로(그림자보다 아래로) 내려가지 않게 해서 발이 붕 뜨지 않게 했다.
  const BOB_PATTERN = [0, -1, 0, -1];
  const bob = player.moving ? BOB_PATTERN[player.animFrame] : 0;
  // 기본 도트 그림은 다리가 CHAR_TARGET_H의 88%까지만 그려져(아래 다리 fillRect 참고) 발밑이
  // 박스 맨 아래보다 위에 있는데, 그림자는 항상 박스 맨 아래(py+player.h)에 고정돼 있어서
  // 그림자와 발 사이에 항상 빈 틈이 떠 보이는 문제가 있었다. 커스텀 이미지는 이미지 자체가
  // 박스 맨 아래까지 꽉 차게 그려지므로(drawCharacterAt), 도트 그림일 때만 그만큼 그림자를 올려 붙인다.
  const usesCustomArt = !!(characterCustom.player && characterCustom.player.mode);
  const dotArtFootGap = CHAR_TARGET_H*0.12;
  const shadowY = py+player.h+2 - (usesCustomArt ? 0 : dotArtFootGap);
  ctx.fillStyle='rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(px+player.w/2,shadowY,10,4,0,0,Math.PI*2); ctx.fill();

  // 커스텀 이미지가 있으면 그걸로, 없으면 기본 도트 그림으로
  const customDrawn = drawCharacterAt(ctx, characterCustom.player, player.dir, player.moving, px+player.w/2-CHAR_TARGET_W/2, py+player.h-CHAR_TARGET_H, bob);

  if (!customDrawn) {
    // 기본 도트 그림은 충돌 히트박스(player.w/h)와 무관하게 CHAR_TARGET_W/H 기준으로 커스텀 이미지와
    // 동일한 크기로 그려서, 캐릭터를 이미지로 바꿔도 크기가 훌쩍 달라 보이지 않게 한다.
    // 발밑 기준점(player.x+player.w/2, player.y+player.h)은 그대로 유지해 이동/충돌엔 영향 없음.
    // 세로 배분: 머리 0~26% · 몸통(상의+앞치마) 24~66% · 다리 66~88%(나머지는 발밑 여백).
    // 다리를 길게 잡으면 하체가 늘씬해 보이는 대신 캐릭터가 붕 뜬 듯한 인상을 줘서, 이번엔
    // 다리 비중을 줄이고 그만큼 몸통을 키워 안정감 있고 다부진 실루엣으로 바꿨다.
    const dw = CHAR_TARGET_W, dh = CHAR_TARGET_H;
    const dLeft = px+player.w/2-dw/2, dTop = py+player.h-dh + bob;
    const bodyW = dw*0.68; // 몸통 폭도 키워서 실루엣이 더 다부지게 보이게 한다
    const bodyLeft = dLeft + (dw-bodyW)/2;

    ctx.fillStyle=PAL.skin; ctx.fillRect(dLeft+dw*0.22, dTop+dh*0.24, dw*0.56, dh*0.02); // 목(살짝)
    ctx.fillStyle=PAL.hairBrown; ctx.fillRect(dLeft+dw*0.08, dTop, dw*0.84, dh*0.15); // 머리
    ctx.fillStyle=PAL.skin; ctx.fillRect(dLeft+dw*0.14, dTop+dh*0.11, dw*0.72, dh*0.16); // 얼굴
    ctx.fillStyle=PAL.shirtBlue; ctx.fillRect(bodyLeft, dTop+dh*0.26, bodyW, dh*0.19); // 상의
    ctx.fillStyle=PAL.apron; ctx.fillRect(bodyLeft, dTop+dh*0.43, bodyW, dh*0.23); // 앞치마
    // 걷는 중이면 다리를 번갈아 앞뒤로 살짝 벌려서 걷는 느낌을 준다(animFrame 0~3 순환)
    const legSwing = player.moving ? (player.animFrame%2===0 ? 1 : -1) * dh*0.01 : 0;
    ctx.fillStyle=PAL.pantsBrown; ctx.fillRect(dLeft+dw*0.28, dTop+dh*0.66+legSwing, dw*0.18, dh*0.22); // 왼다리
    ctx.fillStyle=PAL.pantsBrown; ctx.fillRect(dLeft+dw*0.54, dTop+dh*0.66-legSwing, dw*0.18, dh*0.22); // 오른다리

    ctx.fillStyle=PAL.outline;
    const eyeSz = Math.max(2.5, dw*0.06);
    const eyeY = dTop+dh*0.17;
    if (player.dir==='down') { ctx.fillRect(dLeft+dw*0.28,eyeY,eyeSz,eyeSz); ctx.fillRect(dLeft+dw*0.64,eyeY,eyeSz,eyeSz); }
    else if (player.dir==='left') ctx.fillRect(dLeft+dw*0.24,eyeY,eyeSz,eyeSz);
    else if (player.dir==='right') ctx.fillRect(dLeft+dw*0.68,eyeY,eyeSz,eyeSz);
  }

  // 들고 있는 아이템은 더 이상 머리 위에 흐리게 표시하지 않고, 캔버스 위쪽의 인벤토리 슬롯 UI(#invSlots)로 표시한다.
}

// hex 색상 문자열(#rrggbb)에 알파를 입힌 rgba() 문자열로 변환. MG_UI 색상은 테마에 따라 바뀌므로
// 목표구간처럼 반투명하게 겹쳐 그려야 하는 곳에서 이 헬퍼로 매번 변환한다.
function hexToRgba(hex, alpha){
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// 미니게임 UI는 카메라 확대/이동과 무관하게 항상 화면(캔버스) 정중앙에 크게 떠 있어야 한다 -
// 예전엔 화면 상단 근처(고정 800/56 좌표)에 작게 그려서, 모바일 세로 모드에서 상단에 뜨는
// 튜토리얼 배너(DOM, #tutorialBanner)와 완전히 겹쳐 미니게임이 안 보이는 문제가 있었다.
// canvas.width/height를 기준으로 잡아야 모바일 세로 모드(캔버스 세로 해상도가 커짐)에서도
// 항상 화면 한가운데에 오고, 튜토리얼 배너(화면 상단 고정)와 자연스럽게 겹치지 않는다.
const ACTION_TAP = isTouchDevice ? '화면 탭' : '스페이스';
// 둥근 사각형 경로(브라우저가 roundRect를 지원하지 않으면 일반 사각형으로 폴백)
function mgRoundRectPath(x,y,w,h,r){
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }
  else { ctx.beginPath(); ctx.rect(x,y,w,h); }
}
// 알약(캡슐) 모양 진행바 - 트랙과 채워진 부분 모두 완전히 둥근 모서리로 그려서
// 미니게임 UI가 각지고 딱딱해 보인다는 피드백을 반영한 "부드러운" 게이지.
function mgDrawPillBar(x,y,w,h,ratio,fillColor){
  const r = h/2;
  mgRoundRectPath(x,y,w,h,r);
  ctx.fillStyle = MG_UI.barBg; ctx.fill();
  const fw = Math.max(h, w*Math.max(0,Math.min(1,ratio)));
  if (ratio>0.001) {
    mgRoundRectPath(x,y,fw,h,r);
    ctx.fillStyle = fillColor; ctx.fill();
  }
}
// 둥근 마커(공 모양) - 예전엔 얇고 각진 막대였던 타이밍/화력 게이지 표시자를 대신한다.
function mgDrawKnob(cx,cy,r,color){
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.35)'; ctx.shadowBlur=4; ctx.shadowOffsetY=2;
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.fillStyle=color; ctx.fill();
  ctx.restore();
  ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.stroke();
}
// "완성! ✨" 문구를 살짝 통통 튀는 배지 모양으로 - 밋밋한 텍스트 한 줄 대신 존재감을 준다.
function mgDrawDoneBadge(bx,bw,by,bh){
  const bounce = 1 + Math.sin(Date.now()/140)*0.06;
  ctx.save();
  ctx.translate(bx+bw/2, by+bh/2+4);
  ctx.scale(bounce, bounce);
  mgRoundRectPath(-70,-22,140,44,22);
  ctx.fillStyle = hexToRgba(MG_UI.good, 0.16);
  ctx.fill();
  ctx.font='bold 22px "Pretendard", sans-serif'; ctx.fillStyle=MG_UI.good; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('완성! ✨', 0, 2);
  ctx.textBaseline='alphabetic';
  ctx.restore();
}

function drawMiniGameOverlay(){
  if (!miniGameActive||!miniGame) return;
  const g=miniGame;
  const bw = Math.min(canvas.width*0.5, 360), bh = 156;
  const bx = canvas.width/2 - bw/2, by = canvas.height/2 - bh/2;

  // 패널: 각진 사각 테두리 대신 큼직하게 둥근 카드 + 부드러운 그림자로 "게임다운" 인상을 준다.
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.3)'; ctx.shadowBlur=20; ctx.shadowOffsetY=8;
  mgRoundRectPath(bx,by,bw,bh,24);
  ctx.fillStyle=MG_UI.panelBg; ctx.fill();
  ctx.restore();
  ctx.lineWidth=3; ctx.strokeStyle=MG_UI.panelBorder;
  mgRoundRectPath(bx,by,bw,bh,24); ctx.stroke();

  ctx.font='bold 17px "Pretendard", sans-serif'; ctx.fillStyle=MG_UI.text; ctx.textAlign='center';
  const barX=bx+26, barY=by+74, barW=bw-52, barH=24;

  if (g.type==='idleAuto') {
    const label = MENU[g.menuId] ? MENU[g.menuId].label : '';
    ctx.fillText(`${label} 조리 중...`, bx+bw/2, by+40);
    mgDrawPillBar(barX,barY,barW,barH, g.doneTimer/g.totalFrames, MG_UI.good);
    return;
  }

  if (g.type==='sequence') {
    const arrows = { up:'↑', down:'↓', left:'←', right:'→' };
    if (g.progress >= g.sequence.length) {
      mgDrawDoneBadge(bx,bw,by,bh);
    } else {
      ctx.fillStyle = g.mistakeFlash>0 ? MG_UI.bad : MG_UI.text;
      ctx.fillText('방향키를 순서대로 눌러보세요', bx+bw/2, by+38);
      const spacing = 52;
      const startX = bx+bw/2 - (g.sequence.length-1)*spacing/2;
      g.sequence.forEach((dir,i)=>{
        const done = i < g.progress;
        const isCurrent = i===g.progress;
        const cx = startX+i*spacing, cy = by+96;
        const scale = isCurrent ? 1 + Math.sin(Date.now()/160)*0.08 : 1;
        ctx.save();
        ctx.translate(cx,cy); ctx.scale(scale,scale);
        ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2);
        ctx.fillStyle = done ? hexToRgba(MG_UI.good,0.22) : (isCurrent ? hexToRgba(MG_UI.accent,0.22) : MG_UI.barBg);
        ctx.fill();
        ctx.lineWidth=2.5;
        ctx.strokeStyle = done ? MG_UI.good : (isCurrent ? MG_UI.accent : MG_UI.panelBorder);
        ctx.stroke();
        ctx.font='bold 22px "Pretendard", sans-serif';
        ctx.fillStyle = done ? MG_UI.good : (isCurrent ? MG_UI.accent : MG_UI.textDim || MG_UI.text);
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(arrows[dir], 0, 1);
        ctx.textBaseline='alphabetic';
        ctx.restore();
      });
    }
    return;
  }

  if (g.type==='shake') {
    if (g.phase==='blending') {
      ctx.fillText('갈리는 중...', bx+bw/2, by+40);
      mgDrawPillBar(barX,barY,barW,barH, g.blendProgress/g.blendTarget, MG_UI.accent);
    } else if (g.phase==='frozen') {
      ctx.fillStyle=MG_UI.bad; ctx.fillText(`멈췄다! ${ACTION_TAP} 연타!`, bx+bw/2, by+40);
      mgDrawPillBar(barX,barY,barW,barH, g.shakeGauge/100, MG_UI.good);
    } else if (g.phase==='done') { mgDrawDoneBadge(bx,bw,by,bh); }
  }

  else if (g.type==='timing') {
    ctx.fillText(`${ACTION_TAP}로 타이밍 맞추기`, bx+bw/2, by+40);
    mgRoundRectPath(barX,barY,barW,barH,barH/2); ctx.fillStyle=MG_UI.barBg; ctx.fill();
    // 목표 구간(초록)도 둥글게
    mgRoundRectPath(barX + (g.target-g.targetWidth/2)/100*barW, barY, g.targetWidth/100*barW, barH, barH/2);
    ctx.fillStyle=hexToRgba(MG_UI.good, 0.55); ctx.fill();
    const knobColor = g.phase==='stopped' ? (g.success?MG_UI.good:MG_UI.bad) : MG_UI.accent;
    mgDrawKnob(barX + g.pos/100*barW, barY+barH/2, barH/2+4, knobColor);
  }

  else if (g.type==='instant') {
    ctx.fillText('꺼내는 중...', bx+bw/2, by+bh/2+8);
  }

  else if (g.type==='stir') {
    if (g.phase==='running') {
      ctx.fillText('화력 유지! (초록 구간)', bx+bw/2, by+40);
      mgRoundRectPath(barX,barY,barW,barH,barH/2); ctx.fillStyle=MG_UI.barBg; ctx.fill();
      mgRoundRectPath(barX+g.target[0]/100*barW, barY, (g.target[1]-g.target[0])/100*barW, barH, barH/2);
      ctx.fillStyle=hexToRgba(MG_UI.good, 0.55); ctx.fill();
      mgDrawKnob(barX + g.heat/100*barW, barY+barH/2, barH/2+4, MG_UI.accent);
    } else {
      mgDrawDoneBadge(bx,bw,by,bh);
    }
  }
}

// ============ 대사 ============
const dlgBox=document.getElementById('dialogue');
const dlgName=document.getElementById('dlgName');
const dlgText=document.getElementById('dlgText');
let dialogueQueue=[]; let dialogueActive=false; let dialogueOnComplete=null;
function showDialogue(lines, onComplete){ dialogueQueue=lines.slice(); dialogueActive=true; dialogueOnComplete=onComplete||null; nextDialogueLine(); dlgBox.style.display='block'; }
function nextDialogueLine(){
  if (dialogueQueue.length===0) {
    dialogueActive=false; dlgBox.style.display='none';
    if (dialogueOnComplete) { const cb=dialogueOnComplete; dialogueOnComplete=null; cb(); }
    return;
  }
  const l=dialogueQueue.shift(); dlgName.textContent=l.name; dlgText.textContent=l.text;
}

// ============ 목표금액 달성(엔딩) 체크 ============
function checkCampaignGoal(){
  if (gameMode==='idle') return; // 방치형 모드는 엔딩/목표금액 개념이 없음
  if (freeMode || endingShown) return;
  if (cumulativeEarnings >= CAMPAIGN_GOAL) {
    endingShown = true;
    dayOpen = false;
    refreshHUD();
    showEnding();
  }
}

function showEnding(){
  showDialogue([
    { name:'???', text:`${CAMPAIGN_GOAL}원 매출을 달성했어요! 우리 카페가 동네에서 제일 유명한 곳이 됐네요.` },
    { name:'???', text:'여기까지가 오프닝 스토리의 끝이에요. 수고 많으셨어요!' },
    { name:'???', text:'이제부터는 자유모드예요. 기한이나 목표 없이 계속 카페를 운영할 수 있어요.' },
  ], () => {
    freeMode = true;
    dayOpen = true;
    refreshHUD();
  });
}

// ============ 하루 진행 / 정산 ============
const dayEndOverlay = document.getElementById('dayEndOverlay');
const deEarnings = document.getElementById('deEarnings');
const deGoal = document.getElementById('deGoal');
const deServed = document.getElementById('deServed');
const deResult = document.getElementById('deResult');
const deTitle = document.getElementById('dayEndTitle');
const deNextDay = document.getElementById('deNextDay');

function updateDayTimer(){
  if (gameMode==='idle') return; // 방치형 모드는 하루/영업시간 개념이 없음
  if (!dayOpen || tutorialActive) return; // 튜토리얼 중엔 영업시간이 흐르지 않게
  dayTimeLeft--;
  if (dayTimeLeft<=0) endDay();
}

function endDay(){
  dayOpen = false;
  // 알바 일당 지급
  let wageLog = '';
  if (staff.cook.hired) { money -= STAFF_DEF.cook.dailyWage; wageLog += `주방 알바 일당 -${STAFF_DEF.cook.dailyWage}원  `; }
  if (staff.server.hired) { money -= STAFF_DEF.server.dailyWage; wageLog += `서빙 알바 일당 -${STAFF_DEF.server.dailyWage}원`; }

  deTitle.textContent = freeMode ? `Day ${day} 영업 종료 (자유모드)` : `Day ${day} 영업 종료`;
  deEarnings.textContent = dayEarnings + '원';
  deGoal.textContent = freeMode ? '—' : (cumulativeEarnings + ' / ' + CAMPAIGN_GOAL + '원 (누적)');
  deServed.textContent = dayServedCount + '명';
  // dayEndBox 배경은 var(--panel)이라 테마마다 밝기가 바뀐다 - 고정 색상 대신 panel 위에서
  // 대비가 검증된 --accent/--bad를 써야 밝은 테마에서도 글자가 묻히지 않는다.
  deResult.innerHTML = wageLog ? `<div style="color:var(--accent);">${wageLog}</div>` : '';
  if (!freeMode && day>=CAMPAIGN_DAYS && cumulativeEarnings<CAMPAIGN_GOAL) {
    deResult.innerHTML += `<div style="color:var(--bad);margin-top:6px;">목표 기간이 끝났어요. 그래도 계속 운영해볼까요?</div>`;
  }
  refreshHUD();
  dayEndOverlay.classList.add('open');
  dayEndOverlay.focus();
}

deNextDay.addEventListener('click', ()=>{
  dayEndOverlay.classList.remove('open');
  day++;
  dayTimeLeft = DAY_LENGTH_SEC*60;
  dayEarnings = 0;
  dayServedCount = 0;
  dayOpen = true;
  // 하루가 끝나면 아직 앉아있던 손님도 포함해서 모든 테이블을 완전히 정리한다(다음날은 완전히 새로 시작).
  tables.forEach(t=>{ t.needsCleanup=false; t.occupied=false; t.customer=null; });
  readyItems = [];
  refreshHUD();
  setMsg(`Day ${day} 영업을 시작합니다!`);
});

// ============ 저장/불러오기 (IndexedDB, 슬롯 3개) ============
// localStorage는 용량이 작아 캐릭터 커스텀 이미지(base64)를 담기 어려우므로 IndexedDB를 사용한다.
const DB_NAME = 'cafeTycoonDB';
const DB_STORE = 'saveSlots';
const SAVE_SLOT_COUNT = 3;
let dbInstance = null;

function openDB(){
  return new Promise((resolve, reject) => {
    if (dbInstance) { resolve(dbInstance); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: 'slot' });
    };
    req.onsuccess = (e) => { dbInstance = e.target.result; resolve(dbInstance); };
    req.onerror = (e) => reject(e);
  });
}

async function dbGet(slot){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).get(slot);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e);
  });
}

async function dbGetAll(){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e);
  });
}

async function dbPut(record){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(record);
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e);
  });
}

async function dbDelete(slot){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(slot);
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e);
  });
}

// 이미지(HTMLImageElement)를 base64 dataURL로 직렬화 (IndexedDB에 그대로 저장 가능하지만,
// img 객체 자체는 구조화 복제가 애매할 수 있어 dataURL 문자열로 통일해 저장한다)
function serializeCharCustom(custom){
  function entryToData(entry){
    if (!entry || !entry.img) return null;
    const c = document.createElement('canvas');
    c.width = entry.w; c.height = entry.h;
    c.getContext('2d').drawImage(entry.img, 0, 0);
    return { dataUrl: c.toDataURL('image/png'), w: entry.w, h: entry.h };
  }
  return {
    mode: custom.mode,
    single: entryToData(custom.single),
    directional: {
      front: entryToData(custom.directional.front),
      back: entryToData(custom.directional.back),
      side: entryToData(custom.directional.side),
    },
  };
}

function deserializeEntry(data){
  if (!data) return Promise.resolve(null);
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = () => resolve({ img, w: data.w, h: data.h });
    img.onerror = () => resolve(null);
    img.src = data.dataUrl;
  });
}

async function deserializeCharCustom(data){
  if (!data) return makeEmptyCharacterCustom();
  const result = makeEmptyCharacterCustom();
  result.mode = data.mode || null;
  result.single = await deserializeEntry(data.single);
  result.directional.front = await deserializeEntry(data.directional && data.directional.front);
  result.directional.back = await deserializeEntry(data.directional && data.directional.back);
  result.directional.side = await deserializeEntry(data.directional && data.directional.side);
  return result;
}

// 메뉴/재료 커스텀(가격/레벨/아이콘) 직렬화 - 이미지 아이콘은 dataURL로 저장
function serializeMenuCustom(){
  const menuData = {};
  Object.keys(MENU).forEach(id=>{
    const m = MENU[id];
    menuData[id] = {
      label: m.label, price: m.price, unlockLv: m.unlockLv, iconType: m.iconType, emoji: m.emoji,
      iconImgDataUrl: (m.iconType==='image' && m.iconImg) ? m.iconImg.src : null,
    };
  });
  const ingredientData = {};
  Object.keys(INGREDIENT_LABELS).forEach(k=>{
    ingredientData[k] = { label: INGREDIENT_LABELS[k], icon: {...INGREDIENT_ICON[k], iconImgDataUrl: (INGREDIENT_ICON[k].iconType==='image' && INGREDIENT_ICON[k].iconImg) ? INGREDIENT_ICON[k].iconImg.src : null} };
  });
  return { menu: menuData, ingredient: ingredientData };
}

async function deserializeMenuCustom(data){
  if (!data) return;
  if (data.menu) {
    for (const id of Object.keys(data.menu)) {
      if (!MENU[id]) continue;
      const d = data.menu[id];
      MENU[id].label = d.label ?? MENU[id].label;
      MENU[id].price = d.price ?? MENU[id].price;
      MENU[id].unlockLv = d.unlockLv ?? MENU[id].unlockLv;
      MENU[id].iconType = d.iconType || 'emoji';
      MENU[id].emoji = d.emoji ?? MENU[id].emoji;
      if (d.iconImgDataUrl) {
        MENU[id].iconImg = await new Promise(res=>{ const img=new Image(); img.onload=()=>res(img); img.onerror=()=>res(null); img.src=d.iconImgDataUrl; });
      } else {
        MENU[id].iconImg = null;
      }
    }
  }
  if (data.ingredient) {
    for (const k of Object.keys(data.ingredient)) {
      if (!(k in INGREDIENT_LABELS)) continue;
      const d = data.ingredient[k];
      if (d.label) INGREDIENT_LABELS[k] = d.label;
      if (d.icon) {
        INGREDIENT_ICON[k].iconType = d.icon.iconType || 'emoji';
        INGREDIENT_ICON[k].emoji = d.icon.emoji || '';
        if (d.icon.iconImgDataUrl) {
          INGREDIENT_ICON[k].iconImg = await new Promise(res=>{ const img=new Image(); img.onload=()=>res(img); img.onerror=()=>res(null); img.src=d.icon.iconImgDataUrl; });
        } else {
          INGREDIENT_ICON[k].iconImg = null;
        }
      }
    }
  }
}

// 인테리어(바닥/가구) 커스텀 직렬화/역직렬화
function imgToDataUrl(img){
  if (!img) return null;
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext('2d').drawImage(img, 0, 0);
  return c.toDataURL('image/png');
}
function dataUrlToImg(dataUrl){
  if (!dataUrl) return Promise.resolve(null);
  return new Promise(res=>{ const img=new Image(); img.onload=()=>res(img); img.onerror=()=>res(null); img.src=dataUrl; });
}

function serializeDecorCustom(){
  return {
    floor: { dataUrl: imgToDataUrl(floorCustom.img), tileCols: floorCustom.tileCols, tileRows: floorCustom.tileRows, tileIndex: floorCustom.tileIndex },
    stations: Object.fromEntries(Object.keys(decorCustom.stations).map(k=>[k, { dataUrl: imgToDataUrl(decorCustom.stations[k].img), label: STATIONS_DEF[k].label }])),
    table: imgToDataUrl(decorCustom.table.img),
  };
}

async function deserializeDecorCustom(data){
  if (!data) return;
  if (data.floor) {
    floorCustom.img = await dataUrlToImg(data.floor.dataUrl);
    floorCustom.tileCols = data.floor.tileCols || 1;
    floorCustom.tileRows = data.floor.tileRows || 1;
    floorCustom.tileIndex = data.floor.tileIndex || 0;
  }
  if (data.stations) {
    for (const k of Object.keys(data.stations)) {
      const entry = data.stations[k];
      if (decorCustom.stations[k]) decorCustom.stations[k].img = await dataUrlToImg(entry && entry.dataUrl !== undefined ? entry.dataUrl : entry);
      if (entry && entry.label && STATIONS_DEF[k]) STATIONS_DEF[k].label = entry.label;
    }
  }
  decorCustom.table.img = await dataUrlToImg(data.table);
}

// 객체를 JSON 파일로 다운로드한다(저장 슬롯 내보내기/커스텀 내보내기가 공용으로 쓴다)
function downloadJson(obj, filename){
  const blob = new Blob([JSON.stringify(obj)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
// 사용자가 고른 파일을 읽어 JSON으로 파싱한다
function readJsonFile(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = () => { try { resolve(JSON.parse(reader.result)); } catch(e){ reject(e); } };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// 캐릭터/손님/메뉴/인테리어 커스텀만 따로 묶어서 직렬화한다. 저장 슬롯(collectSaveData)과
// 슬롯과 무관한 전역 커스텀 저장(saveGlobalCustom), 커스텀 내보내기 파일이 모두 이 형태를 공유한다.
function collectCustomizationBundle(){
  return {
    charCustom: {
      player: serializeCharCustom(characterCustom.player),
      cook: serializeCharCustom(characterCustom.cook),
      server: serializeCharCustom(characterCustom.server),
    },
    customerCustom: {
      mode: customerCustom.mode,
      unified: serializeCharCustom(customerCustom.unified),
      perType: customerCustom.perType.map(serializeCharCustom),
      typeNames: customerTypes.map(t=>t.name),
      typePrefs: customerTypes.map(t=>t.preferredStations),
    },
    menuCustom: serializeMenuCustom(),
    decorCustom: serializeDecorCustom(),
  };
}

// bundle(collectCustomizationBundle()과 같은 모양)을 현재 상태에 적용한다.
async function applyCustomizationBundle(bundle){
  if (!bundle) return;
  if (bundle.charCustom) {
    characterCustom.player = await deserializeCharCustom(bundle.charCustom.player);
    characterCustom.cook = await deserializeCharCustom(bundle.charCustom.cook);
    characterCustom.server = await deserializeCharCustom(bundle.charCustom.server);
  }
  if (bundle.customerCustom) {
    customerCustom.mode = bundle.customerCustom.mode || 'none';
    customerCustom.unified = await deserializeCharCustom(bundle.customerCustom.unified);
    if (Array.isArray(bundle.customerCustom.perType)) {
      customerCustom.perType = await Promise.all(bundle.customerCustom.perType.map(deserializeCharCustom));
    }
    if (Array.isArray(bundle.customerCustom.typeNames)) {
      bundle.customerCustom.typeNames.forEach((name, i) => { if (customerTypes[i] && name) customerTypes[i].name = name; });
    }
    if (Array.isArray(bundle.customerCustom.typePrefs)) {
      bundle.customerCustom.typePrefs.forEach((prefs, i) => { if (customerTypes[i] && Array.isArray(prefs)) customerTypes[i].preferredStations = prefs; });
    }
  }
  if (bundle.menuCustom) await deserializeMenuCustom(bundle.menuCustom);
  if (bundle.decorCustom) await deserializeDecorCustom(bundle.decorCustom);
}

function collectSaveData(){
  return {
    gameMode,
    money, reputation, totalServed, level, day,
    cumulativeEarnings, freeMode, endingShown, currentExpansionStage,
    stock: {...stock},
    everBought: {...everBought},
    stationsOwned: Object.fromEntries(Object.keys(STATIONS_DEF).map(k=>[k, STATIONS_DEF[k].owned])),
    staffHired: { cook: staff.cook.hired, server: staff.server.hired },
    tutorialDone: tutorialDone,
    ...collectCustomizationBundle(),
  };
}

// 슬롯에 현재 진행상황을 저장 (플레이어가 명시적으로 저장 버튼을 눌렀을 때만 호출됨)
async function saveGameToSlot(slot){
  try {
    const record = {
      slot,
      savedAt: Date.now(),
      gameMode,
      day,
      level,
      data: collectSaveData(),
    };
    await dbPut(record);
    return true;
  } catch(e) {
    console.warn('저장 실패:', e);
    return false;
  }
}

async function loadSlotList(){
  try {
    const all = await dbGetAll();
    const bySlot = {};
    all.forEach(r => { bySlot[r.slot] = r; });
    return bySlot;
  } catch(e) {
    console.warn('슬롯 목록 조회 실패:', e);
    return {};
  }
}

async function loadGameFromSlot(slot){
  try {
    const record = await dbGet(slot);
    if (!record) return null;
    return record.data;
  } catch(e) {
    console.warn('불러오기 실패:', e);
    return null;
  }
}

async function applySaveData(data){
  gameMode = data.gameMode ?? gameMode;
  money = data.money ?? money;
  reputation = data.reputation ?? reputation;
  totalServed = data.totalServed ?? totalServed;
  level = data.level ?? level;
  day = data.day ?? day;
  cumulativeEarnings = data.cumulativeEarnings ?? cumulativeEarnings;
  freeMode = data.freeMode ?? freeMode;
  endingShown = data.endingShown ?? endingShown;
  currentExpansionStage = data.currentExpansionStage ?? currentExpansionStage;
  if (data.stock) Object.keys(data.stock).forEach(k => { if (k in stock) stock[k] = data.stock[k]; });
  if (data.everBought) Object.keys(data.everBought).forEach(k => { if (k in everBought) everBought[k] = data.everBought[k]; });
  if (data.stationsOwned) Object.keys(data.stationsOwned).forEach(k => { if (STATIONS_DEF[k]) STATIONS_DEF[k].owned = data.stationsOwned[k]; });
  if (data.staffHired) { staff.cook.hired = !!data.staffHired.cook; staff.server.hired = !!data.staffHired.server; }
  tutorialDone = data.tutorialDone ?? tutorialDone;

  // 인벤토리(2칸)는 저장 데이터에 포함되지 않는 런타임 전용 상태라, 슬롯을 불러올 때 명시적으로
  // 비워주지 않으면 이전에 열려 있던 다른 슬롯에서 들고 있던 아이템이 그대로 남아있는 문제가 있었다.
  player.inventory = [null, null];
  player.activeSlot = 0;

  await applyCustomizationBundle(data);

  // 맵/스테이션 타일을 불러온 상태에 맞게 재적용
  rebuildMapOpenArea();
}

async function deleteSlot(slot){
  try { await dbDelete(slot); return true; } catch(e) { return false; }
}

// ============ 전역 커스텀 저장 (저장 슬롯과 무관하게 항상 유지) ============
// 캐릭터/손님/메뉴/인테리어 커스텀은 저장 슬롯에도 스냅샷으로 같이 저장되지만, 슬롯을 하나도
// 저장하지 않은 채로 새로고침하면 사라지는 문제가 있었다. 슬롯과 별개로 이 키에도 항상 최신
// 상태를 저장해두면, "저장은 안 해도 커스텀은 남아있으면 좋겠다"는 요구와 내보내기/불러오기가
// 저장 진행도와 독립적으로 동작할 수 있다. IndexedDB의 같은 저장소(slot 값만 문자열로 구분)를 쓴다.
const GLOBAL_CUSTOM_SLOT = 'globalCustom';
async function saveGlobalCustom(){
  try {
    await dbPut({ slot: GLOBAL_CUSTOM_SLOT, ...collectCustomizationBundle() });
  } catch(e) { console.warn('전역 커스텀 저장 실패:', e); }
}
async function loadGlobalCustom(){
  try {
    const record = await dbGet(GLOBAL_CUSTOM_SLOT);
    if (record) await applyCustomizationBundle(record);
  } catch(e) { console.warn('전역 커스텀 불러오기 실패:', e); }
}


// ============ 설정창 (캐릭터 커스텀) ============
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsCloseBtn = document.getElementById('settingsClose');
const shopOpenSettingsBtn = document.getElementById('shopOpenSettings');
const settingsTabsEl = document.getElementById('settingsTabs');
const settingsUploadArea = document.getElementById('settingsUploadArea');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');

let settingsCurrentChar = 'player'; // 'player' | 'cook' | 'server'
const CHAR_LABELS = { player:'플레이어', cook:'주방 알바', server:'서빙 알바' };

let settingsOpen = false;
function openSettings(){
  settingsOpen = true;
  settingsOverlay.classList.add('open');
  renderSettingsBody();
  settingsOverlay.focus();
}
function closeSettings(){
  settingsOpen = false;
  settingsOverlay.classList.remove('open');
  saveGlobalCustom(); // 설정창에서 바꾼 커스텀을 저장 슬롯과 무관하게 항상 남겨둔다
}
settingsCloseBtn.addEventListener('click', closeSettings);
shopOpenSettingsBtn.addEventListener('click', () => { closeShop(); openSettings(); });

settingsTabsEl.querySelectorAll('button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    settingsTabsEl.querySelectorAll('button').forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
    settingsCurrentChar = btn.dataset.char;
    renderSettingsBody();
  });
});

let customerEditTypeIndex = 0; // perType 모드에서 현재 편집 중인 손님 유형 인덱스

function renderSettingsBody(){
  const charModeRow = document.getElementById('charModeRow');
  const customerModeRow = document.getElementById('customerModeRow');
  const customerTypeTabs = document.getElementById('customerTypeTabs');
  const customerTypeEditArea = document.getElementById('customerTypeEditArea');

  if (settingsCurrentChar === 'customer') {
    charModeRow.style.display = 'none';
    customerModeRow.style.display = '';
    renderCustomerSettingsBody();
    return;
  }
  charModeRow.style.display = '';
  customerModeRow.style.display = 'none';
  customerTypeTabs.style.display = 'none';
  customerTypeEditArea.style.display = 'none';

  const custom = characterCustom[settingsCurrentChar];
  const mode = custom.mode || 'none';

  // 라디오 버튼 현재 상태 반영
  document.querySelectorAll('input[name="charMode"]').forEach(r => { r.checked = (r.value===mode); });
  document.querySelectorAll('input[name="charMode"]').forEach(r => {
    r.onchange = () => {
      if (r.checked) {
        custom.mode = (r.value==='none') ? null : r.value;
        renderSettingsBody();
      }
    };
  });

  settingsUploadArea.innerHTML = '';
  if (mode==='single') {
    const row = document.createElement('div');
    row.className = 'uploadRow';
    const label = document.createElement('label');
    label.textContent = '이미지';
    row.appendChild(label);
    row.appendChild(createImageDropzone({
      label: '이미지 올리기',
      sub: '클릭 또는 드래그',
      previewSrc: custom.single ? custom.single.img.src : null,
      onFile: async (file) => {
        const img = await loadImageFile(file);
        custom.single = { img, w: img.naturalWidth, h: img.naturalHeight };
        renderSettingsBody();
      },
    }));
    settingsUploadArea.appendChild(row);
  } else if (mode==='directional') {
    ['front','back','side'].forEach(dirKey=>{
      const dirLabel = dirKey==='front'?'앞모습':(dirKey==='back'?'뒷모습':'옆모습(좌우공용)');
      const row = document.createElement('div');
      row.className = 'uploadRow';
      const has = custom.directional[dirKey];
      const label = document.createElement('label');
      label.textContent = dirLabel;
      row.appendChild(label);
      row.appendChild(createImageDropzone({
        label: dirLabel,
        sub: '클릭 또는 드래그',
        previewSrc: has ? has.img.src : null,
        onFile: async (file) => {
          const img = await loadImageFile(file);
          custom.directional[dirKey] = { img, w: img.naturalWidth, h: img.naturalHeight };
          renderSettingsBody();
        },
      }));
      settingsUploadArea.appendChild(row);
    });
  } else {
    settingsUploadArea.innerHTML = '<div style="color:var(--textDim);">기본 도트 캐릭터를 사용해요.</div>';
  }

  drawSettingsPreview();
}

// 손님 전용 설정 렌더링: 모드(none/unified/perType) + 유형별 이름/선호메뉴 + 이미지 업로드
function renderCustomerSettingsBody(){
  document.querySelectorAll('input[name="customerCustomMode"]').forEach(r => {
    r.checked = (r.value===customerCustom.mode);
    r.onchange = () => {
      if (r.checked) { customerCustom.mode = r.value; renderCustomerSettingsBody(); }
    };
  });

  const typeTabs = document.getElementById('customerTypeTabs');
  const editArea = document.getElementById('customerTypeEditArea');
  settingsUploadArea.innerHTML = '';

  if (customerCustom.mode==='none') {
    typeTabs.style.display = 'none';
    editArea.style.display = 'none';
    settingsUploadArea.innerHTML = '<div style="color:var(--textDim);">모든 손님이 기본 도트 그림으로 나와요.</div>';
    drawCustomerPreview(null);
    return;
  }

  if (customerCustom.mode==='unified') {
    typeTabs.style.display = 'none';
    editArea.style.display = 'none';
    renderCharUploadAreaFor(customerCustom.unified, ()=>{ drawCustomerPreview(customerCustom.unified); renderCustomerSettingsBody(); });
    drawCustomerPreview(customerCustom.unified);
    return;
  }

  // perType 모드: 유형 탭 + 이름/선호메뉴 편집 + 이미지 업로드
  typeTabs.style.display = 'flex';
  editArea.style.display = 'flex';

  typeTabs.innerHTML = '';
  customerTypes.forEach((type, idx)=>{
    const btn = document.createElement('button');
    btn.textContent = type.name;
    btn.className = idx===customerEditTypeIndex ? 'active' : '';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', idx===customerEditTypeIndex ? 'true' : 'false');
    btn.addEventListener('click', ()=>{ customerEditTypeIndex = idx; renderCustomerSettingsBody(); });
    typeTabs.appendChild(btn);
  });

  const type = customerTypes[customerEditTypeIndex];
  const stationLabels = { espresso:'커피', smoothie:'스무디', dessert:'디저트', wok:'분식' };
  editArea.innerHTML = `
    <label>이름 <input type="text" id="customerTypeNameInput" maxlength="8" value="${type.name}"></label>
    <div class="prefStationChecks radioChipGroup">
      ${Object.keys(stationLabels).map(k=>`<label class="radioChip"><input type="checkbox" data-pref="${k}" ${type.preferredStations.includes(k)?'checked':''}> ${stationLabels[k]} 선호</label>`).join('')}
    </div>
  `;
  editArea.querySelector('#customerTypeNameInput').addEventListener('change', (e)=>{
    const v = e.target.value.trim();
    if (v) type.name = v.slice(0,8);
    else e.target.value = type.name;
    renderCustomerSettingsBody();
  });
  editArea.querySelectorAll('input[data-pref]').forEach(cb=>{
    cb.addEventListener('change', ()=>{
      const key = cb.dataset.pref;
      if (cb.checked) { if (!type.preferredStations.includes(key)) type.preferredStations.push(key); }
      else { type.preferredStations = type.preferredStations.filter(k=>k!==key); }
    });
  });

  const custom = customerCustom.perType[customerEditTypeIndex];
  renderCharUploadAreaFor(custom, ()=>{ drawCustomerPreview(custom); renderCustomerSettingsBody(); });
  drawCustomerPreview(custom);
}

// 캐릭터 커스텀(단일/방향별) 업로드 UI를 임의의 custom 객체에 대해 렌더링하는 공용 헬퍼.
// 플레이어/알바 편집 UI와 별개로 손님 편집에서도 재사용한다.
function renderCharUploadAreaFor(custom, onChange){
  const modeRow = document.createElement('div');
  modeRow.className = 'radioChipGroup';
  modeRow.style.marginBottom = '10px';
  modeRow.innerHTML = `
    <label class="radioChip"><input type="radio" name="custTargetMode" value="single" ${custom.mode==='single'?'checked':''}> 단일 이미지</label>
    <label class="radioChip"><input type="radio" name="custTargetMode" value="directional" ${custom.mode==='directional'?'checked':''}> 방향별 이미지</label>
    <label class="radioChip"><input type="radio" name="custTargetMode" value="none" ${!custom.mode?'checked':''}> 커스텀 안 함</label>
  `;
  settingsUploadArea.appendChild(modeRow);
  modeRow.querySelectorAll('input').forEach(r=>{
    r.addEventListener('change', ()=>{ if (r.checked) { custom.mode = r.value==='none'?null:r.value; onChange(); } });
  });

  const uploadWrap = document.createElement('div');
  settingsUploadArea.appendChild(uploadWrap);
  if (custom.mode==='single') {
    const row = document.createElement('div');
    row.className = 'uploadRow';
    const label = document.createElement('label');
    label.textContent = '이미지';
    row.appendChild(label);
    row.appendChild(createImageDropzone({
      label: '이미지 올리기',
      sub: '클릭 또는 드래그',
      previewSrc: custom.single ? custom.single.img.src : null,
      onFile: async (file) => {
        const img = await loadImageFile(file);
        custom.single = { img, w: img.naturalWidth, h: img.naturalHeight };
        onChange();
      },
    }));
    uploadWrap.appendChild(row);
  } else if (custom.mode==='directional') {
    ['front','back','side'].forEach(dirKey=>{
      const dirLabel = dirKey==='front'?'앞모습':(dirKey==='back'?'뒷모습':'옆모습(좌우공용)');
      const row = document.createElement('div');
      row.className = 'uploadRow';
      const has = custom.directional[dirKey];
      const label = document.createElement('label');
      label.textContent = dirLabel;
      row.appendChild(label);
      row.appendChild(createImageDropzone({
        label: dirLabel,
        sub: '클릭 또는 드래그',
        previewSrc: has ? has.img.src : null,
        onFile: async (file) => {
          const img = await loadImageFile(file);
          custom.directional[dirKey] = { img, w: img.naturalWidth, h: img.naturalHeight };
          onChange();
        },
      }));
      uploadWrap.appendChild(row);
    });
  }
}

function drawCustomerPreview(custom){
  previewCtx.clearRect(0,0,previewCanvas.width, previewCanvas.height);
  previewCtx.fillStyle = '#3a2b1f';
  previewCtx.fillRect(0,0,previewCanvas.width, previewCanvas.height);
  if (!custom) return;
  const cx = previewCanvas.width/2, cy = previewCanvas.height/2;
  drawCharacterAt(previewCtx, custom, 'down', false, cx - CHAR_TARGET_W/2, cy - CHAR_TARGET_H/2, 0);
}

function drawSettingsPreview(){
  previewCtx.clearRect(0,0,previewCanvas.width, previewCanvas.height);
  previewCtx.fillStyle = '#3a2b1f';
  previewCtx.fillRect(0,0,previewCanvas.width, previewCanvas.height);
  const custom = characterCustom[settingsCurrentChar];
  const cx = previewCanvas.width/2, cy = previewCanvas.height/2;
  drawCharacterAt(previewCtx, custom, 'down', false, cx - CHAR_TARGET_W/2, cy - CHAR_TARGET_H/2, 0);
}

// ============ 튜토리얼 ============
const tutorialChoiceOverlay = document.getElementById('tutorialChoiceOverlay');
const tutorialBanner = document.getElementById('tutorialBanner');
const tutorialYesBtn = document.getElementById('tutorialYes');
const tutorialNoBtn = document.getElementById('tutorialNo');

let tutorialChoicePending = false; // 튜토리얼 선택지가 떠 있는 동안 게임 진행을 멈추기 위한 플래그
function showTutorialChoice(){
  tutorialChoicePending = true;
  tutorialChoiceOverlay.classList.add('open');
  tutorialChoiceOverlay.focus();
}
function hideTutorialChoice(){
  tutorialChoicePending = false;
  tutorialChoiceOverlay.classList.remove('open');
}

function setTutorialBanner(text){
  tutorialBanner.textContent = text;
  tutorialBanner.classList.add('open');
}
function hideTutorialBanner(){
  tutorialBanner.classList.remove('open');
}

function startTutorial(){
  tutorialActive = true;
  tutorialStep = 0;
  dayOpen = true; // 이동/조리는 가능해야 하니 dayOpen은 true로 두되, 스폰/타이머만 별도로 막아둠(위에서 처리)
  setTutorialBanner(isTouchDevice
    ? '화면을 탭해서 커피머신 쪽으로 가보세요!'
    : '방향키/WASD로 움직여서 커피머신 쪽으로 가보세요!');
}

function advanceTutorial(){
  if (!tutorialActive) return;
  if (tutorialStep === 0) {
    // 플레이어가 처음 한 번이라도 움직이면 다음 단계로
    tutorialStep = 1;
    spawnTutorialCustomer();
  }
}

// 튜토리얼 전용 가상 손님을 tables[0]에 배치 (실제 활성 테이블이 아니어도 강제로 사용)
function spawnTutorialCustomer(){
  const t = tables[0];
  t.occupied = true;
  t.customer = {
    type: customerTypes[0], order:'americano', orderLabel:'아메리카노', emoji: MENU.americano.emoji, price:350,
    isVip:false, state:'ordering', patience:99999, maxPatience:99999, bubbleTimer:60, // 인내심 사실상 무제한(튜토리얼 중 화나서 나가지 않게)
  };
  setTutorialBanner('손님이 자리에 앉았어요! 곧 주문을 말할 거예요.');
}

function finishTutorial(){
  tutorialActive = false;
  hideTutorialBanner();
  tables[0].occupied = false;
  tables[0].customer = null;
  tutorialDone = true;
  setMsg('튜토리얼 완료! 이제 진짜 영업을 시작합니다.');
  showDialogue([
    { name:'???', text:'좋아요, 이제 조작법을 다 익혔네요!' },
    { name:'???', text:'진짜 손님들이 곧 찾아올 거예요. 화이팅!' },
  ]);
}

tutorialYesBtn.addEventListener('click', () => {
  hideTutorialChoice();
  startTutorial();
});
tutorialNoBtn.addEventListener('click', () => {
  hideTutorialChoice();
  tutorialDone = true;
});

// ============ 모드 선택 (새 게임 흐름) ============
const modeChoiceOverlay = document.getElementById('modeChoiceOverlay');
const modeNormalBtn = document.getElementById('modeNormal');
const modeIdleBtn = document.getElementById('modeIdle');

function showModeChoice(){ modeChoiceOverlay.classList.add('open'); modeChoiceOverlay.focus(); }
function hideModeChoice(){ modeChoiceOverlay.classList.remove('open'); }

// 새 게임 시작(초기 상태로 리셋 후 지정한 모드로 진입). 캐릭터 커스텀 이미지는 유지한다(요청사항).
function resetToNewGame(mode){
  gameMode = mode;
  money = 500; reputation = 70; totalServed = 0; level = 1; day = 1;
  dayTimeLeft = DAY_LENGTH_SEC*60; dayEarnings = 0; dayServedCount = 0; dayOpen = true;
  cumulativeEarnings = 0; freeMode = false; endingShown = false;
  currentExpansionStage = 0;
  Object.keys(stock).forEach(k => stock[k] = 0); stock.coffeeBean = 5;
  Object.keys(everBought).forEach(k => everBought[k] = false); everBought.coffeeBean = true;
  Object.keys(STATIONS_DEF).forEach(k => { STATIONS_DEF[k].owned = (k==='espresso'||k==='smoothie'); });
  staff.cook.hired = false; staff.server.hired = false;
  tables.forEach(t => { t.occupied=false; t.customer=null; t.needsCleanup=false; });
  readyItems = [];
  player.x = MAP_CENTER*TILE - 16; player.y = (ROWS-2)*TILE; player.inventory=[null,null]; player.activeSlot=0; player.dir='down';
  aiState='idle'; aiTargetTable=null; aiTargetStationKey=null; aiTargetPixel=null;
  rebuildMapOpenArea();
  refreshHUD();
}

modeNormalBtn.addEventListener('click', () => {
  hideModeChoice();
  resetToNewGame('normal');
  runIntroFlow();
});
modeIdleBtn.addEventListener('click', () => {
  hideModeChoice();
  resetToNewGame('idle');
  tutorialDone = true; // 방치형 모드는 튜토리얼 없이 바로 시작 (캐릭터가 알아서 움직이므로 조작법 안내가 불필요)
  setMsg('방치형 모드 시작! 재료와 설비를 사서 캐릭터를 도와주세요.');
  refreshHUD();
});

function runIntroFlow(){
  showDialogue([
    { name:'???', text:'어서 와요! 여기가 앞으로 당신이 운영할 작은 카페예요.' },
    { name:'???', text:'지금은 에스프레소와 아메리카노, 스무디 정도만 팔 수 있어요.' },
    { name:'???', text:'상점에서 새 재료를 사면 그 자리에서 관련 메뉴가 바로 열려요.' },
    { name:'???', text:`영업일은 하루 ${Math.floor(DAY_LENGTH_SEC/60)}분 정도예요. ${CAMPAIGN_DAYS}일 안에 누적 ${CAMPAIGN_GOAL}원을 벌면 스토리가 끝나요.` },
    { name:'???', text:'손님이 떠난 테이블은 꼭 치워야 다음 손님이 앉을 수 있어요. P키로 상점도 잊지 마세요.' },
  ], () => {
    showTutorialChoice();
  });
}

// ============ 타이틀 화면 ============
const titleOverlay = document.getElementById('titleOverlay');
const titleNewGameBtn = document.getElementById('titleNewGame');
const titleLoadGameBtn = document.getElementById('titleLoadGame');
let titleActive = true;

function hideTitle(){ titleActive = false; titleOverlay.classList.add('hidden'); }
function showTitle(){ titleActive = true; titleOverlay.classList.remove('hidden'); titleOverlay.focus(); }

titleNewGameBtn.addEventListener('click', () => {
  hideTitle();
  showModeChoice();
});
titleLoadGameBtn.addEventListener('click', async () => {
  const bySlot = await loadSlotList();
  const hasAny = Object.keys(bySlot).length>0;
  if (!hasAny) { setMsg('저장된 게임이 없어요.'); return; }
  openSlotOverlay('load', bySlot);
});

// ============ 슬롯 선택 오버레이 (불러오기/저장 공용) ============
const slotOverlay = document.getElementById('slotOverlay');
const slotBoxTitle = document.getElementById('slotBoxTitle');
const slotListEl = document.getElementById('slotList');
const slotBackBtn = document.getElementById('slotBack');

async function openSlotOverlay(purpose, preloadedSlots){
  slotBoxTitle.textContent = purpose==='load' ? '어떤 저장을 불러올까요?' : '어느 슬롯에 저장할까요?';
  const bySlot = preloadedSlots || await loadSlotList();
  slotListEl.innerHTML = '';
  for (let i=1;i<=SAVE_SLOT_COUNT;i++){
    const rec = bySlot[i];
    const row = document.createElement('div');
    row.className = 'saveSlotRow';
    const modeLabel = rec ? (rec.gameMode==='idle' ? '♾️ 방치형' : '🎮 일반') : '';
    const info = rec
      ? `<div class="slotTitle">슬롯 ${i} · ${modeLabel} · Lv.${rec.level}</div><div>${rec.gameMode==='idle' ? '' : 'Day '+rec.day+' · '}${new Date(rec.savedAt).toLocaleString()}</div>`
      : `<div class="slotTitle">슬롯 ${i}</div><div>비어있음</div>`;
    row.innerHTML = `<div class="slotInfo">${info}</div>`;
    const btnWrap = document.createElement('div');
    if (purpose==='load') {
      if (rec) {
        const btn = document.createElement('button');
        btn.textContent = '불러오기';
        btn.addEventListener('click', async ()=>{
          const data = await loadGameFromSlot(i);
          if (data) {
            await applySaveData(data);
            closeSlotOverlay();
            hideTitle();
            tutorialDone = true; // 이어하기는 튜토리얼을 다시 보여주지 않음
            refreshHUD();
            setMsg(`슬롯 ${i} 불러오기 완료! (${gameMode==='idle'?'방치형 모드':'Day '+day})`);
          }
        });
        btnWrap.appendChild(btn);
        const delBtn = document.createElement('button');
        delBtn.textContent = '삭제';
        delBtn.className = 'deleteBtn';
        delBtn.addEventListener('click', async ()=>{
          await deleteSlot(i);
          openSlotOverlay('load');
        });
        btnWrap.appendChild(delBtn);
      }
    } else { // save
      const btn = document.createElement('button');
      btn.textContent = rec ? '덮어쓰기' : '저장';
      btn.addEventListener('click', async ()=>{
        const ok = await saveGameToSlot(i);
        closeSlotOverlay();
        setMsg(ok ? `슬롯 ${i}에 저장했어요.` : '저장에 실패했어요.');
      });
      btnWrap.appendChild(btn);
    }
    row.appendChild(btnWrap);
    slotListEl.appendChild(row);
  }
  slotOverlay.classList.add('open');
  slotOverlay.focus();
}
function closeSlotOverlay(){ slotOverlay.classList.remove('open'); }
slotBackBtn.addEventListener('click', closeSlotOverlay);

// ============ 설정창 - 게임 관리 패널 (모드 변경 / 저장) ============
const settingsMainTabsEl = document.getElementById('settingsMainTabs');
const settingsCharPanel = document.getElementById('settingsCharPanel');
const settingsMenuPanel = document.getElementById('settingsMenuPanel');
const settingsDecorPanel = document.getElementById('settingsDecorPanel');
const settingsGamePanel = document.getElementById('settingsGamePanel');
const currentModeLabelEl = document.getElementById('currentModeLabel');
const settingsChangeModeBtn = document.getElementById('settingsChangeMode');
const saveSlotListEl = document.getElementById('saveSlotList');
const settingsResetCharBtn = document.getElementById('settingsResetChar');

// ============ 커스텀 내보내기/가져오기 (저장 진행도와 무관하게 이미지/테마만 파일로 이동) ============
const customExportBtn = document.getElementById('customExportBtn');
const customImportBtn = document.getElementById('customImportBtn');
const customImportFile = document.getElementById('customImportFile');

customExportBtn.addEventListener('click', ()=>{
  const bundle = {
    kind: 'cafeTycoonCustomExport',
    theme: currentTheme,
    titleName: gameTitleName,
    titleIcon: { mode: gameTitleIcon.mode, emoji: gameTitleIcon.emoji, imgDataUrl: gameTitleIcon.img ? gameTitleIcon.img.src : null },
    ...collectCustomizationBundle(),
  };
  downloadJson(bundle, 'cafe-tycoon-custom.json');
  setMsg('커스텀을 파일로 내보냈어요.');
});

customImportBtn.addEventListener('click', ()=> customImportFile.click());
customImportFile.addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  customImportFile.value = '';
  if (!file) return;
  try {
    const data = await readJsonFile(file);
    if (data.theme) applyTheme(data.theme);
    if (data.titleName) gameTitleName = data.titleName;
    if (data.titleIcon) {
      gameTitleIcon.mode = data.titleIcon.mode || 'emoji';
      gameTitleIcon.emoji = data.titleIcon.emoji || '☕';
      gameTitleIcon.img = data.titleIcon.imgDataUrl ? await dataUrlToImg(data.titleIcon.imgDataUrl) : null;
    }
    applyTitleCustom();
    await applyCustomizationBundle(data);
    saveGlobalSettings();
    await saveGlobalCustom(); // 가져온 커스텀을 슬롯과 무관하게 바로 영구 저장해둔다
    renderSettingsBody();
    renderGamePanel();
    setMsg('커스텀을 가져왔어요.');
  } catch(err) {
    setMsg('커스텀 파일을 읽는 데 실패했어요.');
  }
});

settingsMainTabsEl.querySelectorAll('button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    settingsMainTabsEl.querySelectorAll('button').forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
    const panel = btn.dataset.panel;
    settingsCharPanel.style.display = panel==='character' ? '' : 'none';
    settingsMenuPanel.style.display = panel==='menu' ? '' : 'none';
    settingsDecorPanel.style.display = panel==='decor' ? '' : 'none';
    settingsGamePanel.style.display = panel==='game' ? '' : 'none';
    if (panel==='game') renderGamePanel();
    if (panel==='menu') renderMenuCustomPanel();
    if (panel==='decor') renderDecorPanel();
  });
});

// ============ 설정창 - 인테리어(바닥/가구) 커스텀 패널 ============
const STATION_LABELS_FOR_DECOR = { espresso:'커피머신', smoothie:'스무디 기계', dessert:'디저트 진열대', wok:'분식 팬' };

function renderDecorPanel(){
  // 바닥
  const floorRow = document.getElementById('floorUploadRow');
  floorRow.innerHTML = '';
  floorRow.appendChild(createImageDropzone({
    label: '바닥 타일',
    sub: '클릭 또는 드래그',
    previewSrc: floorCustom.img ? floorCustom.img.src : null,
    onFile: async (file) => {
      const img = await loadImageFile(file);
      floorCustom.img = img; floorCustom.tileCols=1; floorCustom.tileRows=1; floorCustom.tileIndex=0;
      renderDecorPanel();
    },
  }));

  // 스테이션(주방 설비)
  const stationListEl = document.getElementById('decorStationList');
  stationListEl.innerHTML = '';
  Object.keys(STATION_LABELS_FOR_DECOR).forEach(key=>{
    const slot = decorCustom.stations[key];
    const def = STATIONS_DEF[key];
    const row = document.createElement('div');
    row.className = 'menuCustomRow';
    row.appendChild(createImageDropzone({
      size: 'small',
      label: def.label,
      sub: '',
      previewSrc: slot.img ? slot.img.src : null,
      onFile: async (file) => {
        const img = await loadImageFile(file);
        slot.img = img;
        renderDecorPanel();
      },
    }));
    const nameLabel = document.createElement('label');
    nameLabel.innerHTML = `이름 <input type="text" maxlength="10" value="${def.label}" data-field="stationName">`;
    row.appendChild(nameLabel);
    row.querySelector('[data-field="stationName"]').addEventListener('change', (e)=>{
      const v = e.target.value.trim();
      if (v) { def.label = v.slice(0,10); }
      else e.target.value = def.label; // 빈 값이면 되돌림
    });
    stationListEl.appendChild(row);
  });

  // 테이블
  const tableRow = document.getElementById('tableUploadRow');
  tableRow.innerHTML = '';
  tableRow.appendChild(createImageDropzone({
    label: '테이블',
    sub: '클릭 또는 드래그',
    previewSrc: decorCustom.table.img ? decorCustom.table.img.src : null,
    onFile: async (file) => {
      const img = await loadImageFile(file);
      decorCustom.table.img = img;
      renderDecorPanel();
    },
  }));
}

document.getElementById('settingsResetDecor').addEventListener('click', ()=>{
  floorCustom.img = null;
  Object.values(decorCustom.stations).forEach(s => s.img = null);
  decorCustom.table.img = null;
  renderDecorPanel();
  setMsg('인테리어를 기본 모습으로 초기화했어요.');
});

// ============ 설정창 - 메뉴 커스텀 패널 ============
const menuCustomStationTabsEl = document.getElementById('menuCustomStationTabs');
const menuCustomListEl = document.getElementById('menuCustomList');
const settingsResetMenuBtn = document.getElementById('settingsResetMenu');
let menuCustomCurrentStation = 'espresso';

menuCustomStationTabsEl.querySelectorAll('button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    menuCustomStationTabsEl.querySelectorAll('button').forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
    menuCustomCurrentStation = btn.dataset.station;
    renderMenuCustomPanel();
  });
});

function iconPreviewHtml(m){
  if (m.iconType==='image' && m.iconImg) return `<img src="${m.iconImg.src}" alt="">`;
  return m.emoji || '';
}

function renderMenuCustomPanel(){
  menuCustomListEl.innerHTML = '';
  const items = Object.values(MENU).filter(m => m.station===menuCustomCurrentStation);
  items.forEach(m=>{
    const row = document.createElement('div');
    row.className = 'menuCustomRow';
    const uid = 'icontype_'+m.id;
    row.innerHTML = `
      <div class="miIconPreview">${iconPreviewHtml(m)}</div>
      <label>이름 <input type="text" maxlength="12" value="${m.label}" data-field="label" class="miNameInput"></label>
      <label>가격 <input type="number" min="0" step="10" value="${m.price}" data-field="price"></label>
      <label>해금레벨 <select data-field="unlockLv">
        ${[1,2,3,4,5].map(lv=>`<option value="${lv}" ${m.unlockLv===lv?'selected':''}>Lv.${lv}</option>`).join('')}
      </select></label>
      <label class="radioChip"><input type="radio" name="${uid}" value="emoji" ${m.iconType==='emoji'?'checked':''}> 텍스트/이모지</label>
      <input type="text" maxlength="4" value="${m.iconType==='emoji'?m.emoji:''}" data-field="emojiText" placeholder="예: 🍮" ${m.iconType!=='emoji'?'disabled':''}>
      <label class="radioChip"><input type="radio" name="${uid}" value="image" ${m.iconType==='image'?'checked':''}> 이미지 파일</label>
      <span data-field="iconImageSlot"></span>
    `;
    const emojiInput = row.querySelector('[data-field="emojiText"]');
    const imageSlot = row.querySelector('[data-field="iconImageSlot"]');
    function renderImageSlot(){
      imageSlot.innerHTML = '';
      if (m.iconType!=='image') return;
      imageSlot.appendChild(createImageDropzone({
        size: 'small',
        label: '아이콘',
        sub: '',
        previewSrc: m.iconImg ? m.iconImg.src : null,
        onFile: async (file) => {
          const img = await loadImageFile(file);
          m.iconImg = img;
          renderMenuCustomPanel();
        },
      }));
    }
    renderImageSlot();
    row.querySelectorAll(`input[name="${uid}"]`).forEach(radio=>{
      radio.addEventListener('change', ()=>{
        if (radio.value==='emoji') {
          m.iconType = 'emoji';
          emojiInput.disabled = false;
          if (m.emoji) renderMenuCustomPanel();
          else renderImageSlot();
        } else {
          m.iconType = 'image';
          emojiInput.disabled = true;
          if (m.iconImg) renderMenuCustomPanel();
          else renderImageSlot();
        }
      });
    });
    row.querySelector('[data-field="label"]').addEventListener('change', (e)=>{
      const v = e.target.value.trim();
      if (v) { m.label = v; renderMenuCustomPanel(); }
      else e.target.value = m.label; // 빈 값은 무시하고 기존 이름 유지
    });
    row.querySelector('[data-field="price"]').addEventListener('change', (e)=>{
      const v = Math.max(0, parseInt(e.target.value)||0);
      m.price = v;
      e.target.value = v;
    });
    row.querySelector('[data-field="unlockLv"]').addEventListener('change', (e)=>{
      m.unlockLv = parseInt(e.target.value);
    });
    emojiInput.addEventListener('change', (e)=>{
      const v = e.target.value.trim();
      if (v) { m.emoji = v; renderMenuCustomPanel(); }
    });
    menuCustomListEl.appendChild(row);
  });
}

settingsResetMenuBtn.addEventListener('click', ()=>{
  Object.keys(MENU).forEach(id=>{
    const def = MENU_DEFAULTS[id];
    MENU[id].label = def.label;
    MENU[id].price = def.price;
    MENU[id].unlockLv = def.unlockLv;
    MENU[id].emoji = def.emoji;
    MENU[id].iconType = 'emoji';
    MENU[id].iconImg = null;
  });
  renderMenuCustomPanel();
  setMsg('메뉴를 기본값으로 초기화했어요.');
});

function renderGamePanel(){
  currentModeLabelEl.textContent = gameMode==='idle' ? '♾️ 방치형 모드' : '🎮 일반 모드';
  renderSaveSlotListInline();
  renderThemeSwatches();
  renderTitleCustomUI();
}

function renderThemeSwatches(){
  const wrap = document.getElementById('themeSwatches');
  wrap.innerHTML = '';
  Object.entries(THEMES).forEach(([id, theme])=>{
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'themeSwatch' + (currentTheme===id ? ' active' : '');
    sw.style.background = theme.swatch;
    sw.title = theme.label;
    sw.setAttribute('aria-label', `${theme.label} 테마`);
    sw.setAttribute('aria-pressed', currentTheme===id ? 'true' : 'false');
    sw.addEventListener('click', ()=>{
      applyTheme(id);
      renderThemeSwatches();
      saveGlobalSettings();
    });
    wrap.appendChild(sw);
  });
}

function renderTitleCustomUI(){
  const nameInput = document.getElementById('titleNameInput');
  nameInput.value = gameTitleName;
  nameInput.oninput = ()=>{
    gameTitleName = nameInput.value.slice(0, GAME_TITLE_NAME_MAXLEN);
    applyTitleCustom();
    saveGlobalSettings();
  };

  const emojiRadio = document.querySelector('input[name="titleIconMode"][value="emoji"]');
  const imageRadio = document.querySelector('input[name="titleIconMode"][value="image"]');
  const emojiInput = document.getElementById('titleIconTextInput');
  const imageSlot = document.getElementById('titleIconImageSlot');
  emojiRadio.checked = gameTitleIcon.mode==='emoji';
  imageRadio.checked = gameTitleIcon.mode==='image';
  emojiInput.value = gameTitleIcon.mode==='emoji' ? gameTitleIcon.emoji : '';

  imageSlot.innerHTML = '';
  imageSlot.appendChild(createImageDropzone({
    size: 'small',
    label: '로고',
    sub: '',
    previewSrc: gameTitleIcon.img ? gameTitleIcon.img.src : null,
    onFile: async (file) => {
      const img = await loadImageFile(file);
      gameTitleIcon.mode='image'; gameTitleIcon.img=img;
      applyTitleCustom();
      saveGlobalSettings();
      renderTitleCustomUI();
    },
  }));

  emojiRadio.onchange = ()=>{ gameTitleIcon.mode='emoji'; applyTitleCustom(); saveGlobalSettings(); };
  imageRadio.onchange = ()=>{ if (gameTitleIcon.img) { gameTitleIcon.mode='image'; applyTitleCustom(); saveGlobalSettings(); } };
  emojiInput.oninput = ()=>{
    const v = emojiInput.value.trim();
    if (v) { gameTitleIcon.mode='emoji'; gameTitleIcon.emoji=v; emojiRadio.checked=true; applyTitleCustom(); saveGlobalSettings(); }
  };
}

async function renderSaveSlotListInline(){
  const bySlot = await loadSlotList();
  saveSlotListEl.innerHTML = '';
  for (let i=1;i<=SAVE_SLOT_COUNT;i++){
    const rec = bySlot[i];
    const row = document.createElement('div');
    row.className = 'saveSlotRow';
    const modeLabel = rec ? (rec.gameMode==='idle' ? '♾️ 방치형' : '🎮 일반') : '';
    const info = rec
      ? `<div class="slotTitle">슬롯 ${i} · ${modeLabel} · Lv.${rec.level}</div><div>${rec.gameMode==='idle' ? '' : 'Day '+rec.day+' · '}${new Date(rec.savedAt).toLocaleString()}</div>`
      : `<div class="slotTitle">슬롯 ${i}</div><div>비어있음</div>`;
    row.innerHTML = `<div class="slotInfo">${info}</div>`;

    const btn = document.createElement('button');
    btn.textContent = rec ? '덮어쓰기' : '저장';
    btn.addEventListener('click', async ()=>{
      const ok = await saveGameToSlot(i);
      setMsg(ok ? `슬롯 ${i}에 저장했어요.` : '저장에 실패했어요.');
      renderSaveSlotListInline();
    });
    row.appendChild(btn);

    if (rec) {
      const exportBtn = document.createElement('button');
      exportBtn.textContent = '내보내기';
      exportBtn.addEventListener('click', ()=>{
        downloadJson(rec, `cafe-tycoon-save-slot${i}.json`);
        setMsg(`슬롯 ${i} 저장 파일을 내보냈어요.`);
      });
      row.appendChild(exportBtn);
    }

    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = 'application/json';
    importInput.style.display = 'none';
    importInput.addEventListener('change', async (e)=>{
      const file = e.target.files[0];
      importInput.value = '';
      if (!file) return;
      try {
        const parsed = await readJsonFile(file);
        if (!parsed || typeof parsed.data !== 'object') { setMsg('올바른 저장 파일이 아니에요.'); return; }
        await dbPut({ ...parsed, slot: i }); // 어느 슬롯 번호로 내보냈든 지금 고른 슬롯 번호로 덮어쓴다
        setMsg(`슬롯 ${i}에 파일을 가져왔어요.`);
        renderSaveSlotListInline();
      } catch(err) {
        setMsg('저장 파일을 읽는 데 실패했어요.');
      }
    });
    const importBtn = document.createElement('button');
    importBtn.textContent = rec ? '파일로 덮어쓰기' : '가져오기';
    importBtn.className = 'deleteBtn'; // 기존 스타일 중 눈에 덜 띄는 톤을 재사용(주요 동작인 저장/내보내기와는 구분)
    importBtn.addEventListener('click', ()=> importInput.click());
    row.appendChild(importBtn);
    row.appendChild(importInput);

    saveSlotListEl.appendChild(row);
  }
}

settingsResetCharBtn.addEventListener('click', ()=>{
  characterCustom.player = makeEmptyCharacterCustom();
  characterCustom.cook = makeEmptyCharacterCustom();
  characterCustom.server = makeEmptyCharacterCustom();
  customerCustom.mode = 'none';
  customerCustom.unified = makeEmptyCharacterCustom();
  customerCustom.perType = customerTypes.map(()=>makeEmptyCharacterCustom());
  renderSettingsBody();
  setMsg('캐릭터 커스텀을 초기화했어요.');
});

// ============ 모드 변경 확인 ============
const modeChangeConfirmOverlay = document.getElementById('modeChangeConfirmOverlay');
const modeChangeConfirmYesBtn = document.getElementById('modeChangeConfirmYes');
const modeChangeConfirmNoBtn = document.getElementById('modeChangeConfirmNo');

settingsChangeModeBtn.addEventListener('click', ()=>{
  modeChangeConfirmOverlay.classList.add('open');
  modeChangeConfirmOverlay.focus();
});
modeChangeConfirmNoBtn.addEventListener('click', ()=>{
  modeChangeConfirmOverlay.classList.remove('open');
});
modeChangeConfirmYesBtn.addEventListener('click', ()=>{
  modeChangeConfirmOverlay.classList.remove('open');
  closeSettings();
  showModeChoice();
});

// ============ 메인 루프 ============
function gameLoop(){
  if (!titleActive && !dialogueActive && !shopOpen && !settingsOpen && !tutorialChoicePending && !slotOverlay.classList.contains('open') && !modeChoiceOverlay.classList.contains('open') && !modeChangeConfirmOverlay.classList.contains('open') && dayOpen) {
    if (gameMode==='idle') {
      updateIdleAI();
      aiCheckCookingDone();
      updateIdleStaffWage();
    } else {
      updatePlayer();
    }
    recoverPlayerIfStuck();
    trySpawnCustomer();
    updateCustomers();
    updateMiniGame();
    updateCookStaff();
    updateServerStaff();
    updateDayTimer();
  }

  resizeCanvasForViewport();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  updateCamera();
  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);
  drawFloorAndWalls();
  Object.keys(stationSlots).forEach(drawStation);
  // 상점은 지도상 오브젝트 없이 P키로만 접근
  activeTables().forEach(drawTable);
  drawStaffCharacters();
  drawPlayer();
  drawUnopenedPreview(); // 미개방 구역 오버레이는 캐릭터/스테이션 위에 그려서 확실히 덮는다
  ctx.restore();
  drawMiniGameOverlay(); // 카메라 확대/이동과 무관하게 항상 화면 중앙에 고정되는 UI라 transform 밖에서 그린다

  if (dayOpen) refreshHUD(); // 타이머 표시를 매 프레임 갱신

  requestAnimationFrame(gameLoop);
}

refreshHUD();
// 터치 기기(hover 없음)에서는 키보드 안내 대신 화면 조작법을 안내한다
document.getElementById('msg').textContent = isTouchDevice
  ? `설비·테이블을 터치하면 걸어가서 바로 조작 · 빈 곳 터치는 이동 · 아이템칸 터치로 전환 · 🛒 버튼으로 상점 열기`
  : `방향키/WASD 이동(Shift로 달리기, Lv.${RUN_UNLOCK_LEVEL}부터) · 설비 근처에서 스페이스로 조작 · Q키로 아이템 전환 · P키로 상점 열기`;

// ============ 게임 시작 흐름 ============
// 자동 불러오기는 하지 않는다. 항상 타이틀 화면에서 "새 게임" 또는 "이어하기"를 선택하게 한다.
// 다만 테마/가게이름/아이콘 같은 전역 설정과 캐릭터/메뉴/인테리어 커스텀은 슬롯과 무관하게
// 항상 자동으로 불러온다(저장 슬롯을 하나도 저장하지 않았어도 커스텀은 남아있어야 하므로).
loadGlobalSettings();
loadGlobalCustom();
showTitle();

// ============ PWA 서비스워커 등록 ============
// 정적 리소스를 캐싱해 오프라인/홈화면 설치 실행을 지원한다.
// localStorage/IndexedDB 저장 데이터에는 관여하지 않는다.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch((err) => {
      console.warn('서비스워커 등록 실패:', err);
    });
  });
}

gameLoop();
