const progressBar = document.querySelector(".progress span");
const slideNumber = document.querySelector("#slideNumber");
const slides = [...document.querySelectorAll(".slide")];
const actionButtons = [...document.querySelectorAll("[data-action]")];
const reasonButtons = [...document.querySelectorAll("[data-reason]")];
const minutesRange = document.querySelector("#minutesRange");
const minutesLabel = document.querySelector("#minutesLabel");
const demoStatus = document.querySelector("#demoStatus");
const demoWeight = document.querySelector("#demoWeight");
const demoNeedle = document.querySelector("#demoNeedle");
const demoGate = document.querySelector("#demoGate");
const demoLeds = document.querySelector("#demoLeds");
const demoLog = document.querySelector("#demoLog");
let currentSlideIndex = 0;
let selectedAction = "break";

const actions = {
  break: {
    label: "締切前だけど休憩する",
    base: 16,
    initial: "赤",
  },
  sns: {
    label: "あと5分だけSNSを見る",
    base: 10,
    initial: "赤",
  },
  skip: {
    label: "今日はサボる",
    base: -2,
    initial: "赤",
  },
};

const reasons = {
  tired: { label: "疲れている", weight: 24 },
  return: { label: "もう少しで戻る", weight: 18 },
  research: { label: "研究に必要", weight: 32 },
  today: { label: "今日だけ", weight: 12 },
  task: { label: "タスクが大きすぎる", weight: 28 },
};

function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;

  const center = window.scrollY + window.innerHeight * 0.45;
  const nextIndex = slides.reduce(
    (nearest, slide, index) => {
      const distance = Math.abs(slide.offsetTop - center);
      return distance < nearest.distance ? { index, distance } : nearest;
    },
    { index: 0, distance: Infinity },
  ).index;

  currentSlideIndex = nextIndex;
  if (slideNumber) {
    slideNumber.textContent = String(nextIndex + 1).padStart(2, "0");
  }
}

function selectedReasons() {
  return reasonButtons
    .filter((button) => button.classList.contains("active"))
    .map((button) => button.dataset.reason);
}

function setLed(result) {
  if (!demoLeds) return;
  demoLeds.querySelectorAll(".led").forEach((led) => led.classList.remove("active"));
  demoLeds.querySelector(`.${result}`)?.classList.add("active");
}

function updateDemo() {
  if (!minutesRange || !demoStatus || !demoWeight || !demoNeedle || !demoGate || !demoLog) {
    return;
  }

  const minutes = Number(minutesRange.value);
  const activeReasonIds = selectedReasons();
  const reasonWeight = activeReasonIds.reduce((sum, id) => sum + reasons[id].weight, 0);
  const timePenalty = Math.max(0, minutes - 10) * 1.4;
  const rawScore = actions[selectedAction].base + reasonWeight - timePenalty;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let result = "red";
  let label = "赤：理由が足りません";
  let gateClass = "closed";
  let gateText = "閉";
  if (score >= 72) {
    result = "blue";
    label = "青：通ってよい";
    gateClass = "open";
    gateText = "開";
  } else if (score >= 45) {
    result = "amber";
    label = `黄：${minutes}分だけ条件付き許可`;
    gateClass = "half";
    gateText = "半開き";
  }

  minutesLabel.textContent = `${minutes}分`;
  demoStatus.textContent = label;
  demoStatus.className = `status-stamp ${result}`;
  demoWeight.textContent = `${score}g`;
  demoNeedle.style.transform = `rotate(${-46 + score * 0.92}deg)`;
  demoGate.className = `gate ${gateClass}`;
  setLed(result);

  const reasonLabels = activeReasonIds.length
    ? activeReasonIds.map((id) => `「${reasons[id].label}」`).join(" ")
    : "なし";
  const resultName = result === "red" ? "赤" : result === "amber" ? "黄" : "青";
  demoLog.innerHTML = [
    `LOG 01: 行動「${actions[selectedAction].label}」`,
    `LOG 02: 初期判定 ${actions[selectedAction].initial}`,
    `LOG 03: 理由 ${reasonLabels}`,
    `LOG 04: 猶予申請 ${minutes}分 / 推定 ${score}g`,
    `LOG 05: 結果 ${resultName} / ゲート${gateText}`,
  ]
    .map((line) => `<span>${line}</span>`)
    .join("");
}

actionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedAction = button.dataset.action;
    actionButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    updateDemo();
  });
});

reasonButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const active = !button.classList.contains("active");
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    updateDemo();
  });
});

minutesRange?.addEventListener("input", updateDemo);

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
window.addEventListener("keydown", (event) => {
  const keys = ["ArrowDown", "PageDown", "ArrowRight", "ArrowUp", "PageUp", "ArrowLeft"];
  if (!keys.includes(event.key)) return;
  const direction = ["ArrowDown", "PageDown", "ArrowRight"].includes(event.key) ? 1 : -1;
  const targetIndex = Math.min(slides.length - 1, Math.max(0, currentSlideIndex + direction));
  event.preventDefault();
  slides[targetIndex]?.scrollIntoView({ behavior: "smooth", block: "start" });
});

updateProgress();
updateDemo();
