let currentStage  = "intro";   
let choiceHistory = [];        
let bond          = 0;         
let energy        = 0;         
let curiosity     = 0;         


const TOTAL_STEPS = 4;

const CHOICES = {
  cuddle:   { step: 0, log: "Cuddled together in bed",     effects: { bond: 2 } },
  box:      { step: 0, log: "Made a cozy box",             effects: { bond: 1, curiosity: 1 } },
  explore:  { step: 0, log: "Let Num roam and explore",    effects: { curiosity: 2 } },

  wand:     { step: 1, log: "Feather-wand chase",          effects: { energy: 2 } },
  puzzle:   { step: 1, log: "Puzzle feeder",               effects: { curiosity: 2 } },
  lap:      { step: 1, log: "Lap nap",                     effects: { bond: 2 } },

  sitter:   { step: 2, log: "Hired a playful sitter",      effects: { bond: 1, energy: 1 } },
  toys:     { step: 2, log: "Left extra toys and food",    effects: { curiosity: 1, bond: -1 } },
  along:    { step: 2, log: "Brought Num along",           effects: { bond: 1, curiosity: 1 } },

  perch:    { step: 3, log: "Built a window perch",        effects: { curiosity: 2 } },
  walk:     { step: 3, log: "Went on a harness walk",      effects: { energy: 2, curiosity: 1 } },
  curtains: { step: 3, log: "Curtains closed, cuddles",    effects: { bond: 2 } },
};

const OUTCOMES = {
  explorer: {
    badge: "🧭 Fearless Explorer",
    title: "Num the Fearless Explorer",
    text:  "Num has never met a closed door they didn't want to open. They know every corner of the " +
           "apartment, greet strangers first, and would happily come on a hike if you let them.",
  },
  lapcat: {
    badge: "💗 Devoted Lap Cat",
    title: "Num the Devoted Lap Cat",
    text:  "Wherever you sit, Num arrives within thirty seconds. They follow you room to room, purr " +
           "on command, and consider your lap their personal property.",
  },
  zoomies: {
    badge: "⚡ Zoomies Champion",
    title: "Num the Zoomies Champion",
    text:  "3 a.m.? Perfect time for laps around the living room. Num is pure speed and springs, " +
           "never tired of a chase, and has knocked something off every shelf at least once.",
  },
  philosopher: {
    badge: "🌙 Independent Philosopher",
    title: "Num the Independent Philosopher",
    text:  "Num keeps their own schedule and their own counsel. They'll sit near you, not on you, " +
           "and gaze out the window as if thinking about something you wouldn't understand.",
  },
};

function computeStats(history) {
  const stats = { bond: 0, energy: 0, curiosity: 0 };
  for (const id of history) {
    for (const [stat, amount] of Object.entries(CHOICES[id].effects)) {
      stats[stat] += amount;
    }
  }
  return stats;
}

function computeStatMax() {
  const max = { bond: 0, energy: 0, curiosity: 0 };
  for (let step = 0; step < TOTAL_STEPS; step++) {
    const stepChoices = Object.values(CHOICES).filter(choice => choice.step === step);
    for (const stat of Object.keys(max)) {
      max[stat] += Math.max(0, ...stepChoices.map(choice => choice.effects[stat] ?? 0));
    }
  }
  return max;
}

const STAT_MAX = computeStatMax();  

function getStepIndex() {
  return choiceHistory.length;
}

function evaluateOutcome() {
  return "philosopher";
}

function getActiveScreenId() {
  if (currentStage === "intro")   return "screen-intro";
  if (currentStage === "outcome") return "screen-outcome";
  return `screen-step-${getStepIndex()}`;
}

const el = {
  screens:    document.querySelectorAll(".screen"),
  stageLabel: document.getElementById("stage-label"),
  progress:   document.getElementById("progress"),
  srStatus:   document.getElementById("sr-status"),
  log:        document.getElementById("journey-log"),
  outcome:    document.getElementById("screen-outcome"),
  badge:      document.getElementById("outcome-badge"),
  title:      document.getElementById("outcome-title"),
  text:       document.getElementById("outcome-text"),
  backBtn:    document.getElementById("back-btn"),
  meters: {
    bond:      document.getElementById("meter-bond"),
    energy:    document.getElementById("meter-energy"),
    curiosity: document.getElementById("meter-curiosity"),
  },
};

let lastScreenId  = null;
let lastLogLength = 0;

function render() {
  const screenId = getActiveScreenId();
  const outcome  = currentStage === "outcome" ? evaluateOutcome() : null;

  renderScreens(screenId);
  renderStatus(outcome);
  renderLog();
  renderOutcome(outcome);
  el.backBtn.disabled = currentStage === "intro";
  el.backBtn.hidden   = currentStage === "outcome";  
  moveFocus(screenId);
}

function renderScreens(screenId) {
  el.screens.forEach(screen => {
    const isActive = screen.id === screenId;
    screen.classList.toggle("is-active", isActive);
    screen.inert = !isActive;  
  });
}

function renderStatus(outcome) {
  const step = getStepIndex();

  if (currentStage === "intro") {
    el.stageLabel.textContent = "Ready to bring Num home";
  } else if (currentStage === "decision") {
    el.stageLabel.textContent = `Decision ${step + 1} of ${TOTAL_STEPS}`;
  } else {
    el.stageLabel.textContent = "All grown up!";
  }

  el.progress.querySelector(".fill").style.width = `${(step / TOTAL_STEPS) * 100}%`;
  el.progress.setAttribute("aria-valuenow", step);

  const stats = { bond, energy, curiosity };
  for (const [name, value] of Object.entries(stats)) {
    const meter   = el.meters[name];
    const clamped = Math.min(Math.max(value, 0), STAT_MAX[name]);  
    meter.querySelector(".fill").style.width = `${(clamped / STAT_MAX[name]) * 100}%`;
    meter.querySelector(".meter-value").textContent = value;
  }

  el.srStatus.textContent = outcome
    ? `Outcome: ${OUTCOMES[outcome].title}.`
    : `${el.stageLabel.textContent}. Bond ${bond}, Energy ${energy}, Curiosity ${curiosity}.`;
}

function renderLog() {
  const items = choiceHistory.map((id, i) => {
    const li = document.createElement("li");
    li.textContent = CHOICES[id].log;
    if (i === choiceHistory.length - 1 && choiceHistory.length > lastLogLength) {
      li.classList.add("is-new");
    }
    return li;
  });

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No choices yet.";
    items.push(empty);
  }

  el.log.replaceChildren(...items);
  lastLogLength = choiceHistory.length;
}

function renderOutcome(outcome) {
  if (outcome) {
    document.body.dataset.theme = outcome;
  } else {
    delete document.body.dataset.theme;
    return;  
  }

  el.outcome.dataset.layout = outcome;
  el.badge.textContent = OUTCOMES[outcome].badge;
  el.title.textContent = OUTCOMES[outcome].title;
  el.text.textContent  = OUTCOMES[outcome].text;
}

function moveFocus(screenId) {
  if (lastScreenId !== null && screenId !== lastScreenId) {
    document.querySelector(`#${screenId} h2`).focus({ preventScroll: true });
  }
  lastScreenId = screenId;
}


function setHistory(history) {
  choiceHistory = history;
  ({ bond, energy, curiosity } = computeStats(history));
}

function handleStart() {
  if (currentStage !== "intro") return;
  currentStage = "decision";
  render();
}

function handleChoice(id) {
  const choice = CHOICES[id];
  if (!choice || currentStage !== "decision" || choice.step !== getStepIndex()) return;

  setHistory([...choiceHistory, id]);
  currentStage = choiceHistory.length === TOTAL_STEPS ? "outcome" : "decision";
  render();
}

function handleBack() {
  if (currentStage === "intro" || currentStage === "outcome") return;

  if (choiceHistory.length === 0) {
    currentStage = "intro";
  } else {
    setHistory(choiceHistory.slice(0, -1));
    currentStage = "decision";
  }
  render();
}

function handleReset() {
  setHistory([]);
  currentStage = "intro";
  render();
}

document.getElementById("start-btn").addEventListener("click", handleStart);
document.getElementById("back-btn").addEventListener("click", handleBack);
document.getElementById("reset-btn").addEventListener("click", handleReset);
document.getElementById("again-btn").addEventListener("click", handleReset);

document.getElementById("stage").addEventListener("click", event => {
  const button = event.target.closest("button[data-choice]");
  if (button) handleChoice(button.dataset.choice);
});

render();
