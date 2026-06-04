const TASKS = ["单词", "阅读", "写作", "听力", "复盘"];
const STORE_KEY = "ielts-gogogo-v1";
const ASSETS = {
  sounds: {
    readyCheck: "assets/sounds/ready-check.mp3",
    start: "assets/sounds/start.mp3",
    clear: "assets/sounds/clear.mp3",
    combo: "assets/sounds/combo.mp3",
    victory: "assets/sounds/victory.mp3",
  },
  animations: {
    clearGif: "assets/animations/clear.gif",
    flowerGif: "assets/animations/flower.gif",
    coinGif: "assets/animations/coin.gif",
    victoryGif: "assets/animations/victory.gif",
  },
};

const els = {
  views: {
    home: document.querySelector("#homeView"),
    prep: document.querySelector("#prepView"),
    focus: document.querySelector("#focusView"),
    clear: document.querySelector("#clearView"),
    summary: document.querySelector("#summaryView"),
  },
  comboMini: document.querySelector("#comboMini"),
  petPanel: document.querySelector("#petPanel"),
  petAvatar: document.querySelector("#petAvatar"),
  petStatus: document.querySelector("#petStatus"),
  taskList: document.querySelector("#taskList"),
  newTaskInput: document.querySelector("#newTaskInput"),
  addTaskBtn: document.querySelector("#addTaskBtn"),
  editHint: document.querySelector("#editHint"),
  soundToggle: document.querySelector("#soundToggle"),
  soundLabel: document.querySelector("#soundLabel"),
  startBtn: document.querySelector("#startBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  dayGrid: document.querySelector("#dayGrid"),
  streakText: document.querySelector("#streakText"),
  prepTaskName: document.querySelector("#prepTaskName"),
  prepChecklist: document.querySelector("#prepChecklist"),
  prepChecks: [...document.querySelectorAll("#prepChecklist input")],
  prepBackBtn: document.querySelector("#prepBackBtn"),
  prepGoBtn: document.querySelector("#prepGoBtn"),
  readyMessage: document.querySelector("#readyMessage"),
  currentTaskName: document.querySelector("#currentTaskName"),
  timerDisplay: document.querySelector("#timerDisplay"),
  focusStatus: document.querySelector("#focusStatus"),
  pauseBtn: document.querySelector("#pauseBtn"),
  completeBtn: document.querySelector("#completeBtn"),
  comboText: document.querySelector("#comboText"),
  clearSubtext: document.querySelector("#clearSubtext"),
  nextBtn: document.querySelector("#nextBtn"),
  doneCount: document.querySelector("#doneCount"),
  totalTime: document.querySelector("#totalTime"),
  summaryCombo: document.querySelector("#summaryCombo"),
  victoryGrade: document.querySelector("#victoryGrade"),
  summaryList: document.querySelector("#summaryList"),
  encourageText: document.querySelector("#encourageText"),
  backHomeBtn: document.querySelector("#backHomeBtn"),
  dropLayer: document.querySelector("#dropLayer"),
  assetOverlay: document.querySelector("#assetOverlay"),
  assetBurst: document.querySelector("#assetBurst"),
  assetGif: document.querySelector("#assetGif"),
  assetFallback: document.querySelector("#assetFallback"),
};

let appState = normalizeState(loadState());
let ticker = null;
let pendingTaskIndex = null;
let dragTaskIndex = null;

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDayRecord() {
  return {
    started: false,
    tasks: TASKS.map(createTask),
    current: null,
  };
}

function createTask(name) {
  return { name, done: false, duration: 0 };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved && saved.records) {
      return saved;
    }
  } catch {
    localStorage.removeItem(STORE_KEY);
  }

  return { records: {} };
}

function normalizeState(state) {
  const nextState = state && typeof state === "object" ? state : { records: {} };
  nextState.records = nextState.records || {};
  nextState.settings = nextState.settings || {};

  if (typeof nextState.settings.soundOn !== "boolean") {
    nextState.settings.soundOn = true;
  }

  Object.values(nextState.records).forEach((record) => {
    record.started = Boolean(record.started);
    record.current = record.current || null;

    if (!Array.isArray(record.tasks) || record.tasks.length === 0) {
      record.tasks = TASKS.map(createTask);
    } else {
      record.tasks = record.tasks
        .map((task) => ({
          name: String(task?.name || "").trim(),
          done: Boolean(task?.done),
          duration: Number(task?.duration) || 0,
        }))
        .filter((task) => task.name);
    }

    if (record.tasks.length === 0) {
      record.tasks = TASKS.map(createTask);
    }

    if (record.current && !record.tasks[record.current.index]) {
      record.current = null;
    }
  });

  return nextState;
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(appState));
}

function getToday() {
  const key = todayKey();
  if (!appState.records[key]) {
    appState.records[key] = createDayRecord();
    saveState();
  }
  return appState.records[key];
}

function showView(name) {
  Object.entries(els.views).forEach(([viewName, node]) => {
    node.classList.toggle("is-active", viewName === name);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setPetState(state, text) {
  const labels = {
    home: "待命中",
    ready: "准备开打",
    focus: "盯住计时",
    happy: "漂亮 CLEAR!",
    victory: "全场欢呼!"
  };
  const faces = {
    home: "GO",
    ready: "OK",
    focus: "UP",
    happy: "!!",
    victory: "WIN"
  };

  els.petPanel.dataset.state = state;
  els.petAvatar.textContent = faces[state] || "GO";
  els.petStatus.textContent = text || labels[state] || "待命中";
}

function completedCount(record = getToday()) {
  return record.tasks.filter((task) => task.done).length;
}

function firstOpenTaskIndex(record = getToday()) {
  return record.tasks.findIndex((task) => !task.done);
}

function canEditTasks(record = getToday()) {
  return !record.current && record.tasks.every((task) => !task.done && task.duration === 0);
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function currentElapsed(record = getToday()) {
  if (!record.current) {
    return 0;
  }

  const liveTime = record.current.running ? Date.now() - record.current.startedAt : 0;
  return record.current.elapsed + liveTime;
}

function render() {
  const record = getToday();
  const combo = completedCount(record);
  const editable = canEditTasks(record);

  els.comboMini.textContent = `x${combo}`;
  els.soundToggle.checked = appState.settings.soundOn;
  els.soundLabel.textContent = appState.settings.soundOn ? "Sound On" : "Sound Off";
  els.newTaskInput.disabled = !editable;
  els.addTaskBtn.disabled = !editable;
  els.editHint.textContent = editable
    ? "开始计时前可调整顺序、添加或删除。也可以拖动任务卡排序。"
    : "任务链已开始，今日顺序已锁定。";
  els.startBtn.disabled = record.tasks.length === 0;

  renderTasks(record);
  renderDayGrid();

  if (record.tasks.length > 0 && record.tasks.every((task) => task.done)) {
    els.startBtn.textContent = "查看结算";
  } else if (record.current) {
    els.startBtn.textContent = "继续任务";
  } else if (combo > 0) {
    els.startBtn.textContent = "继续 GOGOGO";
  } else {
    els.startBtn.textContent = "开始任务";
  }
}

function renderTasks(record) {
  els.taskList.innerHTML = "";
  const editable = canEditTasks(record);

  record.tasks.forEach((task, index) => {
    const item = document.createElement("article");
    item.className = `task-item${task.done ? " is-done" : ""}${editable ? " is-editable" : ""}`;
    item.dataset.index = String(index);
    item.draggable = editable;

    const indexNode = document.createElement("div");
    indexNode.className = "task-index";
    indexNode.textContent = String(index + 1).padStart(2, "0");

    const main = document.createElement("div");
    main.className = "task-main";
    const title = document.createElement("strong");
    title.textContent = task.name;
    const meta = document.createElement("span");
    meta.textContent = task.done ? `用时 ${formatTime(task.duration)}` : "等待通关";
    main.append(title, meta);

    const state = document.createElement("div");
    state.className = "task-state";
    state.textContent = task.done ? "CLEAR" : "READY";

    item.append(indexNode, main, state);

    if (editable) {
      const controls = document.createElement("div");
      controls.className = "task-controls";

      const up = document.createElement("button");
      up.className = "mini-btn";
      up.type = "button";
      up.dataset.action = "up";
      up.dataset.index = String(index);
      up.disabled = index === 0;
      up.textContent = "上移";

      const down = document.createElement("button");
      down.className = "mini-btn";
      down.type = "button";
      down.dataset.action = "down";
      down.dataset.index = String(index);
      down.disabled = index === record.tasks.length - 1;
      down.textContent = "下移";

      const remove = document.createElement("button");
      remove.className = "mini-btn mini-btn-danger";
      remove.type = "button";
      remove.dataset.action = "delete";
      remove.dataset.index = String(index);
      remove.disabled = record.tasks.length === 1;
      remove.textContent = "删除";

      controls.append(up, down, remove);
      item.append(controls);
    }

    els.taskList.append(item);
  });
}

function addTask() {
  const record = getToday();
  if (!canEditTasks(record)) {
    return;
  }

  const name = els.newTaskInput.value.trim();
  if (!name) {
    els.newTaskInput.focus();
    return;
  }

  record.tasks.push(createTask(name));
  els.newTaskInput.value = "";
  saveState();
  render();
}

function moveTask(fromIndex, toIndex) {
  const record = getToday();
  if (!canEditTasks(record) || fromIndex === toIndex) {
    return;
  }

  if (!record.tasks[fromIndex] || !record.tasks[toIndex]) {
    return;
  }

  const [task] = record.tasks.splice(fromIndex, 1);
  record.tasks.splice(toIndex, 0, task);
  saveState();
  render();
}

function deleteTask(index) {
  const record = getToday();
  if (!canEditTasks(record) || record.tasks.length <= 1 || !record.tasks[index]) {
    return;
  }

  record.tasks.splice(index, 1);
  saveState();
  render();
}

function renderDayGrid() {
  els.dayGrid.innerHTML = "";
  const today = new Date();
  let litCount = 0;

  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    const record = appState.records[key];
    const isLit = Boolean(record?.started);
    if (isLit) {
      litCount += 1;
    }

    const cell = document.createElement("div");
    cell.className = `day-cell${isLit ? " is-lit" : ""}${key === todayKey() ? " is-today" : ""}`;
    cell.title = `${key} ${isLit ? "已点亮" : "未点亮"}`;
    els.dayGrid.append(cell);
  }

  els.streakText.textContent = `${litCount} 天点亮`;
}

function showPrep(index = firstOpenTaskIndex()) {
  const record = getToday();
  if (index < 0) {
    showSummary();
    return;
  }

  record.started = true;
  saveState();
  render();
  pendingTaskIndex = index;
  els.prepTaskName.textContent = record.tasks[index].name;
  els.readyMessage.textContent = "";
  els.prepChecks.forEach((check) => {
    check.checked = false;
  });
  updatePrepButton();
  setPetState("ready", `${record.tasks[index].name} 准备中`);
  showView("prep");
}

function updatePrepButton() {
  const isReady = els.prepChecks.every((check) => check.checked);
  els.prepGoBtn.disabled = !isReady;
  els.readyMessage.textContent = isReady ? "READY! GOGOGO!" : "";
}

function handlePrepChange(event) {
  const wasReady = !els.prepGoBtn.disabled;
  updatePrepButton();
  const isReady = !els.prepGoBtn.disabled;

  if (event.target.matches("input") && event.target.checked) {
    playSound("readyCheck");
  }

  if (!wasReady && isReady) {
    playSound("start");
  }
}

function startTask(index = pendingTaskIndex ?? firstOpenTaskIndex()) {
  const record = getToday();
  if (index < 0) {
    showSummary();
    return;
  }

  record.started = true;
  record.current = {
    index,
    elapsed: 0,
    startedAt: Date.now(),
    running: true,
  };
  pendingTaskIndex = null;
  saveState();
  render();
  showFocus();
  playSound("start");
}

function showFocus() {
  const record = getToday();
  if (!record.current) {
    showPrep();
    return;
  }

  const task = record.tasks[record.current.index];
  els.currentTaskName.textContent = task.name;
  els.focusStatus.textContent = record.current.running ? "计时中" : "已暂停";
  els.pauseBtn.textContent = record.current.running ? "暂停" : "继续";
  setPetState("focus", record.current.running ? "盯住计时" : "暂停蓄力");
  showView("focus");
  startTicker();
}

function startTicker() {
  stopTicker();
  updateTimer();
  ticker = setInterval(updateTimer, 200);
}

function stopTicker() {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

function updateTimer() {
  els.timerDisplay.textContent = formatTime(currentElapsed());
}

function togglePause() {
  const record = getToday();
  if (!record.current) {
    return;
  }

  if (record.current.running) {
    record.current.elapsed = currentElapsed(record);
    record.current.running = false;
    record.current.startedAt = null;
  } else {
    record.current.running = true;
    record.current.startedAt = Date.now();
  }

  saveState();
  showFocus();
}

function completeTask() {
  const record = getToday();
  if (!record.current) {
    return;
  }

  const task = record.tasks[record.current.index];
  task.duration += currentElapsed(record);
  task.done = true;
  record.current = null;
  saveState();
  stopTicker();
  showClear(task.name);
}

function showClear(taskName) {
  const record = getToday();
  const combo = completedCount(record);
  els.comboMini.textContent = `x${combo}`;
  els.comboText.textContent = `Combo x${combo}`;
  els.clearSubtext.textContent = `${taskName} CLEAR`;
  els.nextBtn.textContent = firstOpenTaskIndex(record) === -1 ? "看今日结算" : "GOGOGO 下一个任务";
  setPetState("happy", `${taskName} CLEAR!`);
  showView("clear");
  playSound("clear");
  playSound("combo");
  playAssetAnimation("clear", 2200);
  createDrops("clear");
}

function showSummary() {
  const record = getToday();
  stopTicker();
  record.current = null;
  saveState();
  renderSummary(record);
  setPetState("victory", "全场欢呼!");
  showView("summary");
  playSound("victory");
  playAssetAnimation("victory", 3600);
  createDrops("victory");
}

function renderSummary(record) {
  const done = completedCount(record);
  const total = record.tasks.reduce((sum, task) => sum + task.duration, 0);
  const grade = getVictoryGrade(done, record.tasks.length, total);

  els.doneCount.textContent = `${done}/${record.tasks.length}`;
  els.totalTime.textContent = formatTime(total);
  els.summaryCombo.textContent = `x${done}`;
  els.victoryGrade.textContent = grade;
  els.summaryList.innerHTML = "";
  els.views.summary.querySelector(".settlement").classList.remove("is-playing");
  window.requestAnimationFrame(() => {
    els.views.summary.querySelector(".settlement").classList.add("is-playing");
  });

  record.tasks.forEach((task) => {
    const row = document.createElement("div");
    row.className = "summary-row";
    const name = document.createElement("span");
    name.textContent = task.name;
    const time = document.createElement("strong");
    time.textContent = task.done ? formatTime(task.duration) : "未完成";
    row.append(name, time);
    els.summaryList.append(row);
  });

  els.encourageText.textContent =
    done === record.tasks.length
      ? "你今天不是想了想，你是真的上场了！"
      : "只要启动，就已经赢了第一步！";
}

function getVictoryGrade(done, totalTasks, totalTime) {
  if (done === totalTasks && totalTasks >= 5) {
    return totalTime <= 30 * 60 * 1000 ? "SS" : "S";
  }
  if (done === totalTasks) {
    return "A";
  }
  return done > 0 ? "B" : "C";
}

function createDrops(mode = "clear") {
  els.dropLayer.innerHTML = "";
  const count = mode === "victory" ? 78 : 28;

  for (let i = 0; i < count; i += 1) {
    const drop = document.createElement("span");
    const kind = mode === "victory" && i % 4 === 0 ? "star" : i % 3 === 0 ? "flower" : "coin";
    drop.className = `drop ${kind}`;
    drop.style.left = `${Math.random() * 96}%`;
    drop.style.animationDuration = `${2 + Math.random() * 2.8}s`;
    drop.style.animationDelay = `${Math.random() * 1.2}s`;
    drop.style.transform = `rotate(${Math.random() * 180}deg)`;
    els.dropLayer.append(drop);
  }

  window.setTimeout(() => {
    els.dropLayer.innerHTML = "";
  }, mode === "victory" ? 7600 : 4600);
}

function playSound(name) {
  const src = ASSETS.sounds[name];
  if (!src || !appState.settings.soundOn) {
    return;
  }

  const audio = new Audio(src);
  audio.volume = name === "victory" ? 0.9 : 0.72;
  audio.play().catch(() => {
    // Placeholder mp3 files are intentionally silent until replaced by real assets.
  });
}

function playAssetAnimation(name, duration = 2400) {
  const gifSrc = ASSETS.animations[`${name}Gif`];
  els.assetOverlay.className = `asset-overlay is-active asset-${name}`;
  els.assetGif.removeAttribute("src");
  els.assetGif.hidden = true;
  els.assetFallback.hidden = false;

  if (gifSrc) {
    els.assetGif.onload = () => {
      els.assetGif.hidden = false;
      els.assetFallback.hidden = true;
    };
    els.assetGif.onerror = () => {
      els.assetGif.hidden = true;
      els.assetFallback.hidden = false;
    };
    els.assetGif.src = `${gifSrc}?t=${Date.now()}`;
  }

  window.clearTimeout(window.__assetOverlayTimer);
  window.__assetOverlayTimer = window.setTimeout(() => {
    els.assetOverlay.className = "asset-overlay";
    els.assetGif.removeAttribute("src");
  }, duration);
}

els.startBtn.addEventListener("click", () => {
  const record = getToday();

  if (record.tasks.length === 0) {
    return;
  }

  if (record.tasks.every((task) => task.done)) {
    showSummary();
    return;
  }

  if (record.current) {
    showFocus();
    return;
  }

  playSound("start");
  showPrep();
});

els.resetBtn.addEventListener("click", () => {
  appState.records[todayKey()] = createDayRecord();
  saveState();
  stopTicker();
  setPetState("home");
  render();
  showView("home");
});

els.addTaskBtn.addEventListener("click", addTask);
els.newTaskInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addTask();
  }
});

els.soundToggle.addEventListener("change", () => {
  appState.settings.soundOn = els.soundToggle.checked;
  els.soundLabel.textContent = appState.settings.soundOn ? "Sound On" : "Sound Off";
  saveState();
  if (appState.settings.soundOn) {
    playSound("readyCheck");
  }
});

els.taskList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const index = Number(button.dataset.index);
  if (button.dataset.action === "up") {
    moveTask(index, index - 1);
  }
  if (button.dataset.action === "down") {
    moveTask(index, index + 1);
  }
  if (button.dataset.action === "delete") {
    deleteTask(index);
  }
});

els.taskList.addEventListener("dragstart", (event) => {
  const item = event.target.closest(".task-item");
  if (!item || !canEditTasks()) {
    return;
  }

  dragTaskIndex = Number(item.dataset.index);
  item.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
});

els.taskList.addEventListener("dragover", (event) => {
  if (dragTaskIndex !== null && canEditTasks()) {
    event.preventDefault();
  }
});

els.taskList.addEventListener("drop", (event) => {
  event.preventDefault();
  const item = event.target.closest(".task-item");
  if (!item || dragTaskIndex === null) {
    return;
  }

  moveTask(dragTaskIndex, Number(item.dataset.index));
  dragTaskIndex = null;
});

els.taskList.addEventListener("dragend", () => {
  dragTaskIndex = null;
  document.querySelectorAll(".task-item.is-dragging").forEach((item) => {
    item.classList.remove("is-dragging");
  });
});

els.pauseBtn.addEventListener("click", togglePause);
els.completeBtn.addEventListener("click", completeTask);
els.prepChecklist.addEventListener("change", handlePrepChange);
els.prepBackBtn.addEventListener("click", () => {
  pendingTaskIndex = null;
  setPetState("home");
  render();
  showView("home");
});
els.prepGoBtn.addEventListener("click", () => {
  if (!els.prepGoBtn.disabled) {
    startTask();
  }
});

els.nextBtn.addEventListener("click", () => {
  const nextIndex = firstOpenTaskIndex();
  if (nextIndex === -1) {
    showSummary();
  } else {
    playSound("start");
    showPrep(nextIndex);
  }
});

els.backHomeBtn.addEventListener("click", () => {
  setPetState("home");
  render();
  showView("home");
});

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const register = () => {
    navigator.serviceWorker.register("service-worker.js", { scope: "./" }).catch(() => {
      // PWA still works as a normal web page if registration is blocked locally.
    });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}

render();
setPetState("home");
registerServiceWorker();
showView("home");
