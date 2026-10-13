
"use strict";

/* ==========================================
   NEXORA AI — WEBSITE INTERACTIONS
   ========================================== */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const STORAGE = {
  name: "nexora_assistant_name",
  language: "nexora_language",
  sound: "nexora_sound",
  motion: "nexora_motion",
  history: "nexora_history"
};

const appLinks = {
  instagram: {
    name: "Instagram",
    url: "https://www.instagram.com/",
    package: "com.instagram.android"
  },
  youtube: {
    name: "YouTube",
    url: "https://www.youtube.com/",
    package: "com.google.android.youtube"
  },
  snapchat: {
    name: "Snapchat",
    url: "https://www.snapchat.com/",
    package: "com.snapchat.android"
  },
  chrome: {
    name: "Chrome",
    url: "https://www.google.com/",
    package: "com.android.chrome"
  },
  google: {
    name: "Google",
    url: "https://www.google.com/",
    package: ""
  }
};

let currentPage = "home";
let toastTimeout = null;
let recognition = null;
let isListening = false;
let historyItems = readHistory();

function readHistory() {
  try {
    const stored = localStorage.getItem(STORAGE.history);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 100) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE.history, JSON.stringify(historyItems));
  } catch {
    showToast("Browser storage is unavailable.");
  }
}

function addHistory(title, type = "Activity") {
  historyItems.unshift({
    id: Date.now() + Math.random(),
    title: String(title).slice(0, 180),
    type,
    time: new Date().toISOString()
  });

  historyItems = historyItems.slice(0, 100);
  saveHistory();
  renderHistory();
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("visible");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("visible");
  }, 3200);
}

function navigate(page) {
  const target = document.getElementById(`page-${page}`);
  if (!target) return;

  currentPage = page;

  $$(".page").forEach((section) => {
    section.classList.toggle("active", section === target);
  });

  $$(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const pageTitles = {
    home: "Home",
    chat: "AI Chat",
    voice: "Voice Assistant",
    actions: "App Actions",
    history: "History",
    settings: "Settings"
  };

  $("#pageTitle").textContent = pageTitles[page] || "Home";

  $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (page === "history") renderHistory();
}

function startNewChat() {
  $("#chatMessages").innerHTML = `
    <div class="welcome-chat">
      <div class="mini-orb">N</div>
      <h2>What can I help you with?</h2>
      <p>Send a message to begin your conversation.</p>
    </div>
  `;

  $("#chatInput").value = "";
  navigate("chat");
  $("#chatInput").focus();
}

function addChatMessage(message, type) {
  const container = $("#chatMessages");
  const welcome = container.querySelector(".welcome-chat");
  if (welcome) welcome.remove();

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${type}`;
  bubble.textContent = message;

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

function processMessage(rawMessage) {
  const message = rawMessage.trim();
  if (!message) return;

  addChatMessage(message, "user");
  addHistory(message, "Chat message");

  $("#chatInput").value = "";
  $("#homeInput").value = "";

  const normalized = message.toLowerCase();

  const match = normalized.match(
    /\b(?:open|launch|start)\s+(instagram|youtube|snapchat|chrome|google)\b/
  );

  if (match) {
    const appKey = match[1];
    const app = appLinks[appKey];

    const reply = addChatMessage(
      `You asked to open ${app.name}. Tap the button below to try launching it on your device. Your browser may open its website instead.`,
      "assistant"
    );

    const button = document.createElement("button");
    button.className = "primary-button";
    button.style.marginTop = "12px";
    button.textContent = `Try opening ${app.name}`;

    button.addEventListener("click", () => launchApp(appKey));

    reply.appendChild(document.createElement("br"));
    reply.appendChild(button);
    return;
  }

  if (/\b(time|date)\b/.test(normalized)) {
    const now = new Date();
    const response = /\btime\b/.test(normalized)
      ? `The time on your device is ${now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })}.`
      : `The date on your device is ${now.toLocaleDateString([], {
          day: "numeric",
          month: "long",
          year: "numeric"
        })}.`;

    addChatMessage(response, "assistant");
    speak(response);
    return;
  }

  if (/\b(hello|hi|hey)\b/.test(normalized)) {
    const response = `Hello! I'm ${getAssistantName()}. My website interface is ready, but my AI service still needs to be connected securely. You can try App Actions or Voice Assistant in the meantime.`;
    addChatMessage(response, "assistant");
    speak(response);
    return;
  }

  addChatMessage(
    "Your message was received by the website, but an AI service is not connected yet. To answer general questions, we need to connect an AI provider through a secure setup. Do not put your API key in this public JavaScript file.",
    "assistant"
  );
}

function getAssistantName() {
  try {
    return localStorage.getItem(STORAGE.name) || "NEXORA AI";
  } catch {
    return "NEXORA AI";
  }
}

/* APP LAUNCHING */

function launchApp(appKey) {
  const app = appLinks[appKey];
  if (!app) {
    showToast("That app shortcut is not supported.");
    return;
  }

  addHistory(`Tried to open ${app.name}`, "App action");

  if (appKey === "google") {
    window.location.href = app.url;
    return;
  }

  /*
   * Android Chrome intent URLs may open the installed app.
   * The browser or device can block the attempt or use the fallback.
   */
  const fallback = encodeURIComponent(app.url);
  const intentUrl =
    `intent://open/#Intent;scheme=nexora-${appKey};` +
    `package=${app.package};` +
    `S.browser_fallback_url=${fallback};end`;

  showToast(`Trying to open ${app.name}…`);

  try {
    window.location.href = intentUrl;
  } catch {
    window.location.href = app.url;
  }
}

$$("[data-app]").forEach((button) => {
  button.addEventListener("click", () => {
    launchApp(button.dataset.app);
  });
});

/* NAVIGATION */

$$("[data-page]").forEach((button) => {
  button.addEventListener("click", () => {
    navigate(button.dataset.page);
  });
});

$("#menuButton").addEventListener("click", () => {
  $("#sidebar").classList.toggle("open");
});

$("#profileButton").addEventListener("click", () => navigate("settings"));
$("#newChatButton").addEventListener("click", startNewChat);

/* CHAT INPUTS */

$("#homeSendButton").addEventListener("click", () => {
  const message = $("#homeInput").value;
  navigate("chat");
  processMessage(message);
});

$("#homeInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    $("#homeSendButton").click();
  }
});

$("#chatSendButton").addEventListener("click", () => {
  processMessage($("#chatInput").value);
});

$("#chatInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    processMessage($("#chatInput").value);
  }
});

/* APP COMMAND BOX */

$("#commandForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const command = $("#commandInput").value.trim();
  if (!command) {
    showToast("Enter a command first.");
    return;
  }

  const normalized = command.toLowerCase();

  const match = normalized.match(
    /\b(?:open|launch|start)\s+(instagram|youtube|snapchat|chrome|google)\b/
  );

  if (!match) {
    $("#commandResult").textContent =
      "Try: Open Instagram, Open YouTube, Open Snapchat, Open Chrome, or Open Google.";
    return;
  }

  $("#commandResult").textContent =
    `Command recognized: Open ${appLinks[match[1]].name}.`;

  launchApp(match[1]);
});

/* VOICE RECOGNITION */

function setupSpeechRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    recognition = null;
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = getSpeechLanguage();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    $("#voiceTitle").textContent = "Listening…";
    $("#voiceDescription").textContent = "Speak now.";
    $("#voiceButton").innerHTML = "<span>■</span> Stop listening";
    $(".voice-card").classList.add("listening");
    $("#assistantStatus").textContent = "Listening to your voice";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    $("#voiceTranscript").textContent = transcript;
    addHistory(transcript, "Voice command");

    const normalized = transcript.toLowerCase();
    const appMatch = normalized.match(
      /\b(?:open|launch|start)\s+(instagram|youtube|snapchat|chrome|google)\b/
    );

    if (appMatch) {
      const app = appLinks[appMatch[1]];
      $("#voiceDescription").textContent =
        `You requested ${app.name}. Tap the button to try opening it.`;

      const launchButton = document.createElement("button");
      launchButton.className = "primary-button";
      launchButton.style.marginTop = "10px";
      launchButton.textContent = `Try opening ${app.name}`;
      launchButton.addEventListener("click", () => launchApp(appMatch[1]));

      const oldButton = $("#voiceLaunchButton");
      if (oldButton) oldButton.remove();

      launchButton.id = "voiceLaunchButton";
      $("#voiceButton").insertAdjacentElement("afterend", launchButton);
    } else {
      $("#voiceDescription").textContent =
        "Speech recognized. AI answers need a secure AI connection.";
    }

    speak(`I heard: ${transcript}`);
  };

  recognition.onerror = (event) => {
    const messages = {
      "not-allowed": "Microphone permission was denied. Check browser permissions.",
      "service-not-allowed": "Speech recognition is not permitted by this browser.",
      "no-speech": "No speech detected. Please try again.",
      "network": "Speech recognition needs a working network connection."
    };

    $("#voiceDescription").textContent =
      messages[event.error] || `Voice recognition error: ${event.error}`;
  };

  recognition.onend = () => {
    isListening = false;
    $("#voiceTitle").textContent = "Ready to listen";
    $("#voiceButton").innerHTML = "<span>♫</span> Start listening";
    $(".voice-card").classList.remove("listening");
    $("#assistantStatus").textContent = "Ready when you are";
  };
}

function getSpeechLanguage() {
  const language = getSetting(STORAGE.language, "en");

  if (language === "te") return "te-IN";
  if (language === "hi") return "hi-IN";
  return "en-IN";
}

function getSetting(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function startListening() {
  if (!recognition) {
    showToast("Speech recognition is not supported in this browser. Try Chrome.");
    return;
  }

  recognition.lang = getSpeechLanguage();

  if (isListening) {
    recognition.stop();
  } else {
    try {
      recognition.start();
    } catch {
      showToast("Voice recognition is busy. Please try again.");
    }
  }
}

$("#voiceButton").addEventListener("click", startListening);
$("#chatMicButton").addEventListener("click", () => {
  navigate("voice");
  startListening();
});

/* SPEECH OUTPUT */

function speak(message) {
  if (getSetting(STORAGE.sound, "true") !== "true") return;
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = getSpeechLanguage();
  utterance.rate = 1;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
}

/* HISTORY */

function renderHistory() {
  const list = $("#historyList");
  list.replaceChildren();

  $("#historyCount").textContent =
    `${historyItems.length} ${historyItems.length === 1 ? "activity" : "activities"}`;

  if (historyItems.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = "<span>◷</span><h3>No activity yet</h3><p>Your website activity will appear here.</p>";
    list.appendChild(empty);
    return;
  }

  historyItems.forEach((item) => {
    const entry = document.createElement("div");
    entry.className = "history-entry";

    const icon = document.createElement("span");
    icon.className = "history-entry-icon";
    icon.textContent = item.type === "App action" ? "⌘" :
      item.type === "Voice command" ? "♫" : "◷";

    const copy = document.createElement("div");
    copy.className = "history-entry-copy";

    const title = document.createElement("strong");
    title.textContent = item.title;

    const time = document.createElement("small");
    const date = new Date(item.time);
    time.textContent = `${item.type} · ${
      Number.isNaN(date.getTime()) ? "Earlier" : date.toLocaleString()
    }`;

    copy.append(title, time);
    entry.append(icon, copy);
    list.appendChild(entry);
  });
}

$("#clearHistoryButton").addEventListener("click", () => {
  historyItems = [];
  saveHistory();
  renderHistory();
  showToast("Website activity history cleared.");
});

/* SETTINGS */

function loadSettings() {
  $("#assistantName").value = getSetting(STORAGE.name, "NEXORA AI");
  $("#languageSelect").value = getSetting(STORAGE.language, "en");
  $("#soundToggle").checked = getSetting(STORAGE.sound, "true") === "true";
  $("#motionToggle").checked = getSetting(STORAGE.motion, "true") === "true";

  applyMotionPreference();
}

function applyMotionPreference() {
  const reduceMotion = getSetting(STORAGE.motion, "true") !== "true";
  document.body.classList.toggle("reduce-motion", reduceMotion);
}

$("#saveSettingsButton").addEventListener("click", () => {
  const name = $("#assistantName").value.trim() || "NEXORA AI";
  const language = $("#languageSelect").value;
  const sound = $("#soundToggle").checked;
  const motion = $("#motionToggle").checked;

  try {
    localStorage.setItem(STORAGE.name, name);
    localStorage.setItem(STORAGE.language, language);
    localStorage.setItem(STORAGE.sound, String(sound));
    localStorage.setItem(STORAGE.motion, String(motion));
  } catch {
    showToast("Could not save preferences in this browser.");
    return;
  }

  applyMotionPreference();
  setupSpeechRecognition();

  $("#settingsMessage").textContent = "Preferences saved on this device.";
  showToast("NEXORA AI preferences saved.");
});

$("#assistantName").addEventListener("change", () => {
  $("#assistantStatus").textContent =
    `${$("#assistantName").value.trim() || "NEXORA AI"} is ready when you are`;
});

/* STARTUP */

function initializeNexora() {
  loadSettings();
  setupSpeechRecognition();
  renderHistory();

  // Make the interface usable even when browser storage is restricted.
  $("#assistantStatus").textContent = "Ready when you are";
}

initializeNexora();
