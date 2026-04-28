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
const uiModeSurface = document.querySelector("#uiModeSurface");
const uiModeTitle = document.querySelector("#uiModeTitle");
const uiModeCallout = document.querySelector("#uiModeCallout");
const uiModePreview = document.querySelector("#uiModePreview");
const reasonReadout = document.querySelector("#reasonReadout");
const weightReadout = document.querySelector("#weightReadout");
const nodeDetail = document.querySelector("#nodeDetail");
const whyYouReadout = document.querySelector("#whyYouReadout");
const whySolistReadout = document.querySelector("#whySolistReadout");

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
const uiModes = {
  cui: {
    title: "CUI / DOS",
    callout: "これがCUI！",
    html: `
      <div class="terminal-preview" data-sim-mode="cui">
        <div class="terminal-lines" id="terminalLines">
          <span>IIWAKE&gt; set action "締切前だけど休憩する"</span>
          <span>IIWAKE&gt; add reason "疲れている"</span>
          <strong>READY. type command or press a preset.</strong>
        </div>
        <label class="cui-command">
          <span>IIWAKE&gt;</span>
          <input id="cuiInput" value="negotiate --minutes 10" autocomplete="off" />
          <button type="button" data-cui-run>RUN</button>
        </label>
        <div class="cui-presets">
          <button type="button" data-command="status">status</button>
          <button type="button" data-command="appeal --reason tired">appeal --reason tired</button>
          <button type="button" data-command="negotiate --minutes 10">negotiate --minutes 10</button>
        </div>
      </div>
    `,
  },
  gui: {
    title: "GUI",
    callout: "これがGUI！",
    html: `
      <div class="window-preview" data-sim-mode="gui">
        <div class="window-box">
          <span class="window-title">Action Card</span>
          <p>締切前だけど休憩する</p>
          <div class="window-buttons">
            <button type="button" data-gui-action="select">選択</button>
            <button type="button" data-gui-action="cancel">取消</button>
          </div>
        </div>
        <div class="window-box">
          <span class="window-title">Reason Dialog</span>
          <p>疲れている / もう少しで戻る</p>
          <div class="window-buttons">
            <button type="button" data-gui-action="submit">申請</button>
            <button type="button" data-gui-action="edit">編集</button>
          </div>
        </div>
        <div class="gui-status" id="guiStatus">ボタンを押すとダイアログ状態が変わる。</div>
      </div>
    `,
  },
  zero: {
    title: "Zero UI",
    callout: "これがZero UI！",
    html: `
      <div class="zero-preview" data-sim-mode="zero">
        <button class="zero-surface" type="button" data-zero-sense>
          <strong>...</strong>
          <p id="zeroStatus">表面を押す。UIは見えないが、環境が反応する。</p>
        </button>
      </div>
    `,
  },
  negotiable: {
    title: "Negotiable UI",
    callout: "これがNegotiable UI！",
    html: `
      <div class="negotiable-preview" data-sim-mode="negotiable">
        <button class="mini-card active" type="button" data-mini-reason="tired">
          <span>REASON CARD</span>
          <strong>疲れている</strong>
          <p>+24g</p>
        </button>
        <button class="mini-card" type="button" data-mini-reason="return">
          <span>REASON CARD</span>
          <strong>もう少しで戻る</strong>
          <p>+18g</p>
        </button>
        <div class="mini-gate">
          <div class="mini-gate-bars"><span></span><span></span></div>
          <p id="miniNegotiationStatus">黄：条件付き許可 / 42g</p>
        </div>
      </div>
    `,
  },
};

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

function setUiMode(mode) {
  const nextMode = uiModes[mode] ? mode : "negotiable";
  document.body.classList.remove("ui-cui", "ui-gui", "ui-zero", "ui-negotiable");
  document.body.classList.add(`ui-${nextMode}`);
  if (uiModeSurface) {
    uiModeSurface.className = `ui-mode-surface mode-${nextMode}`;
  }
  if (uiModeTitle) uiModeTitle.textContent = uiModes[nextMode].title;
  if (uiModeCallout) {
    uiModeCallout.textContent = uiModes[nextMode].callout;
    stamp(uiModeCallout);
  }
  if (uiModePreview) uiModePreview.innerHTML = uiModes[nextMode].html;
}

function runCuiCommand(command) {
  const terminalLines = document.querySelector("#terminalLines");
  if (!terminalLines || !command.trim()) return;
  const normalized = command.trim();
  let response = "RESULT: UNKNOWN COMMAND";
  if (normalized === "status") {
    response = "STATUS: ACTION=休憩 / REASON=疲労 / GATE=CLOSED";
  } else if (normalized.startsWith("appeal")) {
    response = "APPEAL ACCEPTED: REASON WEIGHT +9g";
  } else if (normalized.startsWith("negotiate")) {
    response = "RESULT: YELLOW / 10 MINUTES / GATE HALF OPEN";
  } else if (normalized.startsWith("set")) {
    response = "OK: ACTION UPDATED";
  }
  terminalLines.insertAdjacentHTML(
    "beforeend",
    `<span>IIWAKE&gt; ${escapeHtml(normalized)}</span><strong>${escapeHtml(response)}</strong>`,
  );
  terminalLines.scrollTop = terminalLines.scrollHeight;
}

function updateMiniNegotiation() {
  const activeCards = [...document.querySelectorAll("[data-mini-reason].active")];
  const score = activeCards.reduce((sum, card) => {
    return sum + (card.dataset.miniReason === "tired" ? 24 : 18);
  }, 0);
  const status = document.querySelector("#miniNegotiationStatus");
  const gateBars = document.querySelector(".mini-gate-bars");
  if (!status || !gateBars) return;
  let text = `赤：理由が足りません / ${score}g`;
  gateBars.className = "mini-gate-bars closed";
  if (score >= 42) {
    text = `黄：条件付き許可 / ${score}g`;
    gateBars.className = "mini-gate-bars half";
  }
  if (score >= 58) {
    text = `青：通ってよい / ${score}g`;
    gateBars.className = "mini-gate-bars open";
  }
  status.textContent = text;
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

uiModePreview?.addEventListener("click", (event) => {
  const commandButton = event.target.closest("[data-command]");
  if (commandButton) {
    const input = document.querySelector("#cuiInput");
    if (input) input.value = commandButton.dataset.command;
    runCuiCommand(commandButton.dataset.command);
    resetAutoTimer();
    return;
  }

  if (event.target.closest("[data-cui-run]")) {
    const input = document.querySelector("#cuiInput");
    runCuiCommand(input?.value || "");
    resetAutoTimer();
    return;
  }

  const guiButton = event.target.closest("[data-gui-action]");
  if (guiButton) {
    const status = document.querySelector("#guiStatus");
    const labels = {
      select: "Action Card を選択。次に Reason Dialog が開く。",
      cancel: "選択を取消。状態は未確定に戻る。",
      submit: "理由を申請。判定は 黄：条件付き許可。",
      edit: "理由を編集。ユーザーが判断へ介入している。",
    };
    if (status) status.textContent = labels[guiButton.dataset.guiAction];
    stamp(guiButton);
    resetAutoTimer();
    return;
  }

  if (event.target.closest("[data-zero-sense]")) {
    const status = document.querySelector("#zeroStatus");
    if (status) {
      status.textContent =
        status.textContent.includes("反応する")
          ? "通知だけが返る。訂正の入口はまだ見えにくい。"
          : "表面を押す。UIは見えないが、環境が反応する。";
    }
    resetAutoTimer();
    return;
  }

  const miniCard = event.target.closest("[data-mini-reason]");
  if (miniCard) {
    miniCard.classList.toggle("active");
    updateMiniNegotiation();
    stamp(miniCard);
    resetAutoTimer();
  }
});

uiModePreview?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.target.id !== "cuiInput") return;
  event.preventDefault();
  runCuiCommand(event.target.value);
  resetAutoTimer();
});

document.querySelectorAll(".timeline-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".timeline-card").forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    if (lineageReadout) lineageReadout.textContent = card.dataset.lineage;
    setUiMode(card.dataset.uiMode);
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

document.querySelectorAll("[data-why-you]").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll("[data-why-you]").forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    if (whyYouReadout) whyYouReadout.textContent = card.dataset.whyYou;
    stamp(card);
    resetAutoTimer();
  });
});

document.querySelectorAll("[data-why-solist]").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll("[data-why-solist]").forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    if (whySolistReadout) whySolistReadout.textContent = card.dataset.whySolist;
    stamp(card);
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
