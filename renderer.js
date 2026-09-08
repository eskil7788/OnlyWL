const startupEl = document.getElementById('startup');
const browserEl = document.getElementById('browser');
const surfBtn = document.getElementById('surf');
const urlsEl = document.getElementById('urls');
const tabsEl = document.getElementById('tabs');
const contentEl = document.getElementById('content');
const backBtn = document.getElementById('back');
const forwardBtn = document.getElementById('forward');
const reloadBtn = document.getElementById('reload');
const exitBtn = document.getElementById('exit');

let allowedHosts = new Set();
let webviews = [];
let activeIndex = 0;

function normalizeLines(text){
  return text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
}

function setActiveTab(i) {
    if (i < 0 || i >= webviews.length) return;

    webviews.forEach((wv, idx) => {
        const tab = tabsEl.children[idx];

        if (idx === i) {
            wv.classList.add('active');
            tab.classList.add('active');

            if (wv.setAudioMuted) {
                wv.setAudioMuted(false);
            }
        } else {
            wv.classList.remove('active');
            tab.classList.remove('active');

            if (wv.setAudioMuted) {
                wv.setAudioMuted(true);
            }
        }
    });

    activeIndex = i;
}

function hostFromUrl(url){
  try{ return new URL(url).hostname }catch(e){return ''}
}

function makeWebview(src){
  const wv = document.createElement('webview');
  wv.setAttribute('src', src);
  wv.setAttribute('partition','onlyw');
  wv.setAttribute('preload','');
  wv.setAttribute('disableblinkfeatures','Auxclick');
  wv.setAttribute('webpreferences','contextIsolation');

  // Disable context menu on webview
  wv.addEventListener('dom-ready', () => {
    wv.executeJavaScript(`document.addEventListener('contextmenu', e=>e.preventDefault());`, false);
  });

  return wv;
}

surfBtn.addEventListener('click', async () => {
  const lines = normalizeLines(urlsEl.value);
  const data = await window.onlyw.setWhitelist(lines);
  // use the reply to ensure normalization
  allowedHosts = new Set(data.hosts || []);

  // build tabs and webviews
  tabsEl.innerHTML = '';
  contentEl.innerHTML = '';
  webviews = [];

  data.urls.forEach((u, idx)=>{
    const tab = document.createElement('div');
    tab.className = 'tab';
    const host = hostFromUrl(u);
    const coreName = host.split('.')[0]; // extract core domain name (e.g., "trafiko" from "trafiko.se")
    tab.textContent = coreName;
    tab.addEventListener('click', ()=>setActiveTab(idx));
    tabsEl.appendChild(tab);

    const wv = makeWebview(u);
    contentEl.appendChild(wv);
    webviews.push(wv);
  });

  // switch UI
  startupEl.classList.add('hidden');
  browserEl.classList.remove('hidden');
  if (webviews.length) setActiveTab(0);
});

backBtn.addEventListener('click', ()=>{
  const wv = webviews[activeIndex];
  if (wv && wv.canGoBack && wv.canGoBack()) wv.goBack();
});
forwardBtn.addEventListener('click', ()=>{
  const wv = webviews[activeIndex];
  if (wv && wv.canGoForward && wv.canGoForward()) wv.goForward();
});
reloadBtn.addEventListener('click', ()=>{
  const wv = webviews[activeIndex];
  if (wv) wv.reload();
});
exitBtn.addEventListener('click', ()=>window.onlyw.exitApp());

// Menu functionality
const menuBtn = document.getElementById('menu-btn');
const dropdown = document.getElementById('dropdown');
const maximizeBtn = document.getElementById('maximize-btn');
const minimizeBtn = document.getElementById('minimize-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');

let isFullscreenMode = false;

menuBtn.addEventListener('click', () => {
  dropdown.classList.toggle('hidden');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#menu-container')) {
    dropdown.classList.add('hidden');
  }
});

maximizeBtn.addEventListener('click', async () => {
  await window.onlyw.windowMaximize();
  dropdown.classList.add('hidden');
});

minimizeBtn.addEventListener('click', async () => {
  await window.onlyw.windowMinimize();
  dropdown.classList.add('hidden');
});

fullscreenBtn.addEventListener('click', async () => {
  isFullscreenMode = !isFullscreenMode;
  await window.onlyw.windowFullscreen(isFullscreenMode);
  browserEl.classList.toggle('fullscreen-mode', isFullscreenMode);
  dropdown.classList.add('hidden');
});

// ESC to exit fullscreen
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isFullscreenMode) {
    isFullscreenMode = false;
    window.onlyw.windowFullscreen(false);
    browserEl.classList.remove('fullscreen-mode');
  }
});

// Pomodoro Timer
const pomodoroBtn = document.getElementById('pomodoro-btn');
let pomodoroTabOpen = false;
let pomodoroState = {
  workTime: 25,
  breakTime: 5,
  currentTime: 25,
  isRunning: false,
  isWorkSession: true,
  interval: null,
  selectedInput: 'work'
};

function playPomodoroSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  
  // "ding ding ding" - three short beeps
  for (let i = 0; i < 3; i++) {
    oscillator.frequency.setValueAtTime(800 + i * 200, now + i * 0.1);
    gain.gain.setValueAtTime(0.3, now + i * 0.1);
    gain.gain.setValueAtTime(0, now + i * 0.1 + 0.08);
  }
  
  oscillator.start(now);
  oscillator.stop(now + 0.35);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updatePomodoroDisplay() {
  const timeEl = document.getElementById('pomodoro-time');
  if (timeEl) {
    timeEl.textContent = formatTime(pomodoroState.currentTime);
  }
}

function createPomodoroTab() {
  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.id = 'pomodoro-tab-label';
  
  // Time display
  const timeEl = document.createElement('span');
  timeEl.id = 'pomodoro-time';
  timeEl.textContent = formatTime(pomodoroState.currentTime);
  timeEl.style.marginRight = '8px';
  
  // Play/Pause button
  const playPauseBtn = document.createElement('button');
  playPauseBtn.className = 'pomodoro-btn';
  playPauseBtn.id = 'pomodoro-play-pause';
  playPauseBtn.textContent = '▶';
  
  // Settings button
  const settingsWrapper = document.createElement('div');
  settingsWrapper.className = 'pomodoro-settings-wrapper';
  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'pomodoro-btn';
  settingsBtn.id = 'pomodoro-settings-btn';
  settingsBtn.textContent = '✎';
  settingsWrapper.appendChild(settingsBtn);
  
  // Reset button (hidden by default)
  const resetBtn = document.createElement('button');
  resetBtn.className = 'pomodoro-btn hidden';
  resetBtn.id = 'pomodoro-reset-btn';
  resetBtn.textContent = '↻';
  
  // Add elements to tab
  tab.appendChild(timeEl);
  tab.appendChild(playPauseBtn);
  tab.appendChild(settingsWrapper);
  tab.appendChild(resetBtn);
  
  tabsEl.appendChild(tab);
  
  // Settings panel (positioned outside tab)
  const settingsPanel = document.createElement('div');
  settingsPanel.id = 'pomodoro-settings';
  settingsPanel.className = 'hidden';
  settingsPanel.innerHTML = `
    <div class="settings-row">
      <input type="text" class="time-input selected" id="work-time-input" value="${pomodoroState.workTime}" readonly>
      <div class="divider"></div>
      <input type="text" class="time-input" id="break-time-input" value="${pomodoroState.breakTime}" readonly>
    </div>
    <div class="controls-row">
      <button id="minus-btn">−</button>
      <button id="plus-btn">+</button>
    </div>
    <button id="pomodoro-start">Start</button>
  `;
  settingsWrapper.appendChild(settingsPanel);
  
  // Setup event listeners
  const workInput = settingsPanel.querySelector('#work-time-input');
  const breakInput = settingsPanel.querySelector('#break-time-input');
  const minusBtn = settingsPanel.querySelector('#minus-btn');
  const plusBtn = settingsPanel.querySelector('#plus-btn');
  const startBtn = settingsPanel.querySelector('#pomodoro-start');
  
  workInput.addEventListener('click', () => {
    pomodoroState.selectedInput = 'work';
    workInput.classList.add('selected');
    breakInput.classList.remove('selected');
  });
  
  breakInput.addEventListener('click', () => {
    pomodoroState.selectedInput = 'break';
    breakInput.classList.add('selected');
    workInput.classList.remove('selected');
  });
  
  minusBtn.addEventListener('click', () => {
    if (pomodoroState.selectedInput === 'work') {
      if (pomodoroState.workTime > 1) pomodoroState.workTime--;
    } else {
      if (pomodoroState.breakTime > 1) pomodoroState.breakTime--;
    }
    workInput.value = pomodoroState.workTime;
    breakInput.value = pomodoroState.breakTime;
  });
  
  plusBtn.addEventListener('click', () => {
    if (pomodoroState.selectedInput === 'work') {
      if (pomodoroState.workTime < 99) pomodoroState.workTime++;
    } else {
      if (pomodoroState.breakTime < 99) pomodoroState.breakTime++;
    }
    workInput.value = pomodoroState.workTime;
    breakInput.value = pomodoroState.breakTime;
  });
  
  startBtn.addEventListener('click', () => {
    pomodoroState.currentTime = pomodoroState.isWorkSession ? pomodoroState.workTime * 60 : pomodoroState.breakTime * 60;
    pomodoroState.isRunning = true;
    playPauseBtn.textContent = '⏸';
    settingsBtn.classList.add('hidden');
    resetBtn.classList.remove('hidden');
    settingsPanel.classList.add('hidden');
    updatePomodoroDisplay();
    startPomodoroTimer();
  });
  
  resetBtn.addEventListener('click', () => {
    clearInterval(pomodoroState.interval);
    pomodoroState.isRunning = false;
    pomodoroState.isWorkSession = true;
    pomodoroState.currentTime = pomodoroState.workTime * 60;
    playPauseBtn.textContent = '▶';
    settingsBtn.classList.remove('hidden');
    resetBtn.classList.add('hidden');
    updatePomodoroDisplay();
  });
  
  playPauseBtn.addEventListener('click', () => {
    if (!pomodoroState.isRunning) {
      pomodoroState.isRunning = true;
      playPauseBtn.textContent = '⏸';
      startPomodoroTimer();
    } else {
      clearInterval(pomodoroState.interval);
      pomodoroState.isRunning = false;
      playPauseBtn.textContent = '▶';
    }
  });
  
  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });
}

function startPomodoroTimer() {
  if (pomodoroState.interval) clearInterval(pomodoroState.interval);
  
  pomodoroState.interval = setInterval(() => {
    pomodoroState.currentTime--;
    updatePomodoroDisplay();
    
    if (pomodoroState.currentTime <= 0) {
      playPomodoroSound();
      setTimeout(() => {
        pomodoroState.isWorkSession = !pomodoroState.isWorkSession;
        pomodoroState.currentTime = pomodoroState.isWorkSession ? pomodoroState.workTime * 60 : pomodoroState.breakTime * 60;
        updatePomodoroDisplay();
      }, 1000);
    }
  }, 1000);
}

pomodoroBtn.addEventListener('click', () => {
  dropdown.classList.add('hidden');
  
  if (pomodoroTabOpen) {
    // Remove Pomodoro tab
    const pomodoroLabel = document.getElementById('pomodoro-tab-label');
    if (pomodoroLabel) pomodoroLabel.remove();
    clearInterval(pomodoroState.interval);
    pomodoroState.isRunning = false;
    pomodoroTabOpen = false;
  } else {
    // Create Pomodoro tab
    pomodoroState = {
      workTime: 25,
      breakTime: 5,
      currentTime: 25 * 60,
      isRunning: false,
      isWorkSession: true,
      interval: null,
      selectedInput: 'work'
    };
    createPomodoroTab();
    pomodoroTabOpen = true;
  }
});

// Disable right-click on the main UI
document.addEventListener('contextmenu', e=>e.preventDefault());
