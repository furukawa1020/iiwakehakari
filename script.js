const deck = document.querySelector(".deck");
const progressBar = document.querySelector(".progress span");
const autoProgressBar = document.querySelector(".auto-progress span");
const slideNumber = document.querySelector("#slideNumber");
const slideTotal = document.querySelector("#slideTotal");
const slides = [...document.querySelectorAll(".slide")];
const dots = document.querySelector("#slideDots");
const prevSlide = document.querySelector("#prevSlide");
const nextSlide = document.querySelector("#nextSlide");
const autoToggle = document.querySelector("#autoToggle");

const signalCaption = document.querySelector("#signalCaption");
const lineageReadout = document.querySelector("#lineageReadout");
const reasonReadout = document.querySelector("#reasonReadout");
const weightReadout = document.querySelector("#weightReadout");
const nodeDetail = document.querySelector("#nodeDetail");

const actionButtons = [...document.querySelectorAll("[data-action]")];
const reasonButtons = [...document.querySelectorAll("[data-reason]")];
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const minutesRange = document.querySelector("#minutesRange");
const minutesLabel = document.querySelector("#minutesLabel");
const appealButton = document.querySelector("#appealButton");
const reMeasureButton = document.querySelector("#reMeasureButton");
const demoStatus = document.querySelector("#demoStatus");
const demoWeight = document.querySelector("#demoWeight");
const demoNeedle = document.querySelector("#demoNeedle");
const demoGate = document.querySelector("#demoGate");
const demoLeds = document.querySelector("#demoLeds");
const demoLog = document.querySelector("#demoLog");
const baseMeter = document.querySelector("#baseMeter");
const reasonMeter = document.querySelector("#reasonMeter");
const timeMeter = document.querySelector("#timeMeter");
const appealMeter = document.querySelector("#appealMeter");

let currentSlideIndex = 0;
let autoplay = true;
let autoStartedAt = performance.now();
let selectedAction = "break";
let selectedMode = "balanced";
let appealCount = 0;
let remeasureCount = 0;

const autoDelay = 11500;

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

const modes = {
  strict: { label: "厳しめ", bonus: -10 },
  balanced: { label: "通常", bonus: 0 },
  lenient: { label: "寛容", bonus: 10 },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stamp(element) {
  if (!element) return;
  element.classList.remove("is-stamped");
  window.requestAnimationFrame(() => {
    element.classList.add("is-stamped");
  });
}

function resetAutoTimer() {
  autoStartedAt = performance.now();
}

function setAutoplay(nextValue) {
  autoplay = nextValue;
  autoToggle?.setAttribute("aria-pressed", String(autoplay));
  if (autoToggle) {
    autoToggle.textContent = autoplay ? "AUTO" : "PAUSE";
  }
  resetAutoTimer();
}

function goToSlide(index, userInitiated = false) {
  const nextIndex = Math.min(slides.length - 1, Math.max(0, index));
  deck?.scrollTo({
    left: slides[nextIndex].offsetLeft,
    behavior: "smooth",
  });
  currentSlideIndex = nextIndex;
  updateSlideIndicators();
  if (userInitiated) resetAutoTimer();
}

function updateSlideIndicators() {
  if (!deck) return;
  const max = deck.scrollWidth - deck.clientWidth;
  const ratio = max > 0 ? deck.scrollLeft / max : 0;
  if (progressBar) {
    progressBar.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  }

  const center = deck.scrollLeft + deck.clientWidth * 0.5;
  const nextIndex = slides.reduce(
    (nearest, slide, index) => {
      const distance = Math.abs(slide.offsetLeft + slide.clientWidth * 0.5 - center);
      return distance < nearest.distance ? { index, distance } : nearest;
    },
    { index: 0, distance: Infinity },
  ).index;

  currentSlideIndex = nextIndex;
  if (slideNumber) {
    slideNumber.textContent = String(nextIndex + 1).padStart(2, "0");
  }

  document.querySelectorAll(".dot").forEach((dot, index) => {
    dot.classList.toggle("active", index === nextIndex);
    dot.setAttribute("aria-current", index === nextIndex ? "true" : "false");
  });

  document.querySelectorAll(".nav a").forEach((link) => {
    const id = link.getAttribute("href")?.slice(1);
    const active = slides[nextIndex]?.id === id;
    link.classList.toggle("active", active);
  });
}

function buildDots() {
  if (!dots) return;
  dots.innerHTML = slides
    .map((slide, index) => {
      const label = slide.dataset.slideTitle || String(index + 1);
      return `<button class="dot" type="button" data-go="${index}" aria-label="${escapeHtml(
        label,
      )}へ">${String(index + 1).padStart(2, "0")}</button>`;
    })
    .join("");
  dots.querySelectorAll(".dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      goToSlide(Number(dot.dataset.go), true);
    });
  });
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
  const base = actions[selectedAction].base;
  const reasonWeight = activeReasonIds.reduce((sum, id) => sum + reasons[id].weight, 0);
  const timePenalty = Math.max(0, minutes - 10) * 1.4;
  const appealBonus = Math.min(appealCount, 2) * 9;
  const calibration = remeasureCount % 3 === 0 ? 0 : remeasureCount % 3 === 1 ? 4 : -3;
  const rawScore =
    base + reasonWeight - timePenalty + modes[selectedMode].bonus + appealBonus + calibration;
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

  if (baseMeter) baseMeter.textContent = base;
  if (reasonMeter) reasonMeter.textContent = reasonWeight;
  if (timeMeter) timeMeter.textContent = Math.round(timePenalty);
  if (appealMeter) appealMeter.textContent = appealBonus + calibration + modes[selectedMode].bonus;

  const reasonLabels = activeReasonIds.length
    ? activeReasonIds.map((id) => `「${reasons[id].label}」`).join(" ")
    : "なし";
  const resultName = result === "red" ? "赤" : result === "amber" ? "黄" : "青";
  const lines = [
    `LOG 01: 行動「${actions[selectedAction].label}」`,
    `LOG 02: 初期判定 ${actions[selectedAction].initial} / 審査 ${modes[selectedMode].label}`,
    `LOG 03: 理由 ${reasonLabels}`,
    `LOG 04: 猶予申請 ${minutes}分 / 推定 ${score}g / 異議 ${appealCount}回`,
    `LOG 05: 結果 ${resultName} / ゲート${gateText}`,
  ];
  demoLog.innerHTML = lines.map((line) => `<span>${escapeHtml(line)}</span>`).join("");
  stamp(demoStatus);
}

document.querySelectorAll(".signal").forEach((button) => {
  button.addEventListener("click", () => {
    if (signalCaption) signalCaption.textContent = `${button.dataset.signal}。ただし、ここから理由を返せる。`;
    stamp(button);
    resetAutoTimer();
  });
});

document.querySelectorAll(".timeline-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".timeline-card").forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    if (lineageReadout) lineageReadout.textContent = card.dataset.lineage;
    stamp(card);
    resetAutoTimer();
  });
});

document.querySelectorAll(".reason-note").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".reason-note").forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    if (reasonReadout) reasonReadout.textContent = card.dataset.preview;
    stamp(card);
    resetAutoTimer();
  });
});

document.querySelectorAll(".beam").forEach((card) => {
  card.addEventListener("click", () => {
    if (weightReadout) weightReadout.textContent = card.dataset.preview;
    stamp(card);
    resetAutoTimer();
  });
});

document.querySelectorAll(".node").forEach((node) => {
  node.addEventListener("click", () => {
    if (nodeDetail) nodeDetail.textContent = node.dataset.node;
    stamp(node);
    resetAutoTimer();
  });
});

actionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedAction = button.dataset.action;
    actionButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    updateDemo();
    resetAutoTimer();
  });
});

reasonButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const active = !button.classList.contains("active");
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    updateDemo();
    resetAutoTimer();
  });
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedMode = button.dataset.mode;
    modeButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    updateDemo();
    resetAutoTimer();
  });
});

minutesRange?.addEventListener("input", () => {
  updateDemo();
  resetAutoTimer();
});

appealButton?.addEventListener("click", () => {
  appealCount = Math.min(appealCount + 1, 2);
  updateDemo();
  stamp(appealButton);
  resetAutoTimer();
});

reMeasureButton?.addEventListener("click", () => {
  remeasureCount += 1;
  updateDemo();
  stamp(reMeasureButton);
  resetAutoTimer();
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href").slice(1);
    const target = id === "top" ? slides[0] : document.getElementById(id);
    const index = slides.indexOf(target);
    if (index >= 0) {
      event.preventDefault();
      goToSlide(index, true);
    }
  });
});

prevSlide?.addEventListener("click", () => goToSlide(currentSlideIndex - 1, true));
nextSlide?.addEventListener("click", () => goToSlide(currentSlideIndex + 1, true));
autoToggle?.addEventListener("click", () => setAutoplay(!autoplay));

deck?.addEventListener("scroll", updateSlideIndicators, { passive: true });
deck?.addEventListener(
  "wheel",
  (event) => {
    if (event.target.closest(".interactive-demo")) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    const slide = event.target.closest(".slide");
    if (slide && slide.scrollHeight > slide.clientHeight) {
      const canScrollDown = event.deltaY > 0 && slide.scrollTop + slide.clientHeight < slide.scrollHeight - 2;
      const canScrollUp = event.deltaY < 0 && slide.scrollTop > 2;
      if (canScrollDown || canScrollUp) return;
    }
    event.preventDefault();
    deck.scrollBy({ left: event.deltaY, behavior: "auto" });
    resetAutoTimer();
  },
  { passive: false },
);

window.addEventListener("resize", updateSlideIndicators);
window.addEventListener("keydown", (event) => {
  const target = event.target;
  const typing = target.matches?.("input, textarea, select");
  if (typing) return;

  if (event.key === " ") {
    if (target.tagName === "BUTTON" || target.tagName === "A") return;
    event.preventDefault();
    setAutoplay(!autoplay);
    return;
  }

  const keys = ["ArrowDown", "PageDown", "ArrowRight", "ArrowUp", "PageUp", "ArrowLeft", "Home", "End"];
  if (!keys.includes(event.key)) return;

  event.preventDefault();
  if (event.key === "Home") {
    goToSlide(0, true);
    return;
  }
  if (event.key === "End") {
    goToSlide(slides.length - 1, true);
    return;
  }

  const direction = ["ArrowDown", "PageDown", "ArrowRight"].includes(event.key) ? 1 : -1;
  goToSlide(currentSlideIndex + direction, true);
});

document.addEventListener("visibilitychange", () => {
  resetAutoTimer();
});

function tick(now) {
  if (autoplay && !document.hidden) {
    const elapsed = now - autoStartedAt;
    const ratio = Math.min(1, elapsed / autoDelay);
    if (autoProgressBar) autoProgressBar.style.width = `${ratio * 100}%`;
    if (elapsed >= autoDelay) {
      goToSlide((currentSlideIndex + 1) % slides.length);
      resetAutoTimer();
    }
  } else if (autoProgressBar) {
    autoProgressBar.style.width = "0%";
  }
  requestAnimationFrame(tick);
}

if (slideTotal) slideTotal.textContent = String(slides.length).padStart(2, "0");
buildDots();
updateSlideIndicators();
updateDemo();
setAutoplay(true);
requestAnimationFrame(tick);
