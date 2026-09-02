const moods = {
  happy: {
    name: "Happy", emoji: "😊",
    text: "Ada hal baik yang sedang kamu rasakan hari ini.",
    care: ["🎧 Dengarkan musik favorit", "📸 Simpan momen kecil", "💬 Ceritakan kabar baik ke orang terdekat"]
  },
  calm: {
    name: "Calm", emoji: "😌",
    text: "Kamu terlihat sedang menikmati suasana yang tenang.",
    care: ["📖 Baca beberapa halaman", "🌿 Nikmati udara segar", "🫖 Buat minuman hangat"]
  },
  excited: {
    name: "Excited", emoji: "🤩",
    text: "Energi positifmu lagi tinggi! Nikmati momennya.",
    care: ["🎨 Coba aktivitas kreatif", "📋 Tulis hal yang ingin dilakukan", "🎶 Putar playlist favorit"]
  },
  neutral: {
    name: "Neutral", emoji: "😐",
    text: "Hari biasa juga tetap berarti.",
    care: ["🚶 Jalan santai", "🧹 Rapikan satu sudut kamar", "🧩 Kerjakan hal kecil yang menyenangkan"]
  },
  tired: {
    name: "Tired", emoji: "😴",
    text: "Mungkin tubuh dan pikiranmu butuh jeda.",
    care: ["🛌 Istirahat sejenak", "💧 Minum air", "📵 Kurangi screen time sebentar"]
  },
  sad: {
    name: "Sad", emoji: "😔",
    text: "Nggak apa-apa punya hari yang terasa berat.",
    care: ["📝 Tulis apa yang kamu rasakan", "🤝 Cari teman/orang dewasa yang kamu percaya", "🌤️ Cari tempat yang terasa nyaman"]
  },
  anxious: {
    name: "Anxious", emoji: "😟",
    text: "Coba pelan-pelan dan fokus pada hal yang bisa kamu lakukan sekarang.",
    care: ["🌬️ Tarik napas perlahan", "🧸 Lakukan aktivitas yang familiar", "🗒️ Pecah tugas besar jadi langkah kecil"]
  }
};

const fallback = {
  entries: [],
  journal: [
    {
      title: "A tiny good moment",
      date: "Contoh",
      icon: "🌷",
      text: "Hari ini aku menyadari bahwa momen kecil juga bisa membuat hari terasa lebih baik."
    },
    {
      title: "A quiet afternoon",
      date: "Contoh",
      icon: "☁️",
      text: "Simpan cerita sederhana di sini. Kamu bisa menulis apa pun yang ingin kamu ingat."
    }
  ],
  quotes: [
    "You don't have to have it all figured out today.",
    "Small progress is still progress.",
    "Take it one moment at a time.",
    "Your feelings are worth listening to.",
    "A soft day is still a good day."
  ],
  selfcare: []
};

let data = structuredClone(fallback);
let selectedMood = null;
let calendarDate = new Date();

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function todayKey(date = new Date()) {
  // Local date, so the app doesn't shift the date because of UTC.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeData(value) {
  if (!value || typeof value !== "object") return structuredClone(fallback);
  return {
    entries: Array.isArray(value.entries) ? value.entries : [],
    journal: Array.isArray(value.journal) ? value.journal : [],
    quotes: Array.isArray(value.quotes) && value.quotes.length ? value.quotes : fallback.quotes,
    selfcare: Array.isArray(value.selfcare) ? value.selfcare : []
  };
}

async function init() {
  try {
    const response = await fetch("data.json", { cache: "no-store" });
    if (response.ok) data = normalizeData(await response.json());
  } catch (error) {
    data = structuredClone(fallback);
  }

  const saved = localStorage.getItem("moodify");
  if (saved) {
    try {
      data = normalizeData(JSON.parse(saved));
    } catch (error) {
      localStorage.removeItem("moodify");
    }
  }

  applySavedTheme();
  bindEvents();
  renderAll();
  updateTodayDate();
}

function bindEvents() {
  // One click handler for all dynamically rendered buttons.
  document.addEventListener("click", handleClick);

  const intensity = $("#intensity");
  if (intensity) {
    intensity.addEventListener("input", () => {
      const value = $("#intensityValue");
      if (value) value.textContent = `${intensity.value} / 5`;
    });
  }

  const themeBtn = $("#themeBtn");
  const topTheme = $("#topTheme");
  const menuBtn = $("#menuBtn");

  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);
  if (topTheme) topTheme.addEventListener("click", toggleTheme);
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const sidebar = $("#sidebar");
      if (sidebar) sidebar.classList.toggle("open");
    });
  }
}

function handleClick(event) {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    event.preventDefault();
    showPage(pageButton.dataset.page);
    return;
  }

  const moodButton = event.target.closest("[data-mood]");
  if (moodButton) {
    event.preventDefault();
    selectedMood = moodButton.dataset.mood;
    renderMoodOptions();
    return;
  }

  if (event.target.closest("#saveMood")) {
    event.preventDefault();
    saveMood();
    return;
  }

  if (event.target.closest("#newJournal")) {
    event.preventDefault();
    openJournal();
    return;
  }

  if (event.target.closest("#closeModal") || event.target.id === "modal") {
    closeModal();
    return;
  }

  if (event.target.closest("#prevMonth")) {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
    return;
  }

  if (event.target.closest("#nextMonth")) {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
    return;
  }
}

function renderAll() {
  renderHome();
  renderMoodCheckin();
  renderStats();
  renderJournal();
  renderSelfcare();
  renderCalendar();
}

function renderHome() {
  const entry = data.entries.find((x) => x.date === todayKey());

  const homeMood = $("#homeMood");
  const homeMoodName = $("#homeMoodName");
  const homeMoodText = $("#homeMoodText");
  const quote = $("#quote");
  const weekMoods = $("#weekMoods");

  if (homeMood) homeMood.textContent = entry && moods[entry.mood] ? moods[entry.mood].emoji : "—";
  if (homeMoodName) homeMoodName.textContent = entry && moods[entry.mood] ? moods[entry.mood].name : "Not checked in yet";
  if (homeMoodText) homeMoodText.textContent =
    entry && moods[entry.mood] ? (entry.note || moods[entry.mood].text) : "Yuk pilih mood kamu hari ini.";

  if (quote) {
    const quotes = data.quotes.length ? data.quotes : fallback.quotes;
    quote.textContent = quotes[new Date().getDate() % quotes.length];
  }

  if (weekMoods) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const e = data.entries.find((x) => x.date === todayKey(d));
      days.push(`
        <div class="week-day">
          <small>${d.toLocaleDateString("en-US", { weekday: "short" })}</small>
          <div>${e && moods[e.mood] ? moods[e.mood].emoji : "·"}</div>
        </div>
      `);
    }
    weekMoods.innerHTML = days.join("");
  }
}

function updateTodayDate() {
  const el = $("#todayDate");
  if (el) {
    el.textContent = new Date().toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    });
  }
}

function renderMoodCheckin() {
  const existing = data.entries.find((x) => x.date === todayKey());

  if (!selectedMood && existing) {
    selectedMood = existing.mood;
  }

  const note = $("#checkNote");
  const intensity = $("#intensity");

  if (existing) {
    if (note && document.activeElement !== note) note.value = existing.note || "";
    if (intensity && document.activeElement !== intensity) intensity.value = existing.intensity || 3;
  }

  renderMoodOptions();
  updateIntensityLabel();
}

function renderMoodOptions() {
  const grid = $("#moodGrid");
  if (!grid) return;

  grid.innerHTML = Object.entries(moods).map(([key, mood]) => `
    <button type="button"
      class="mood-option ${selectedMood === key ? "selected" : ""}"
      data-mood="${key}">
      <span class="emoji">${mood.emoji}</span>
      <small>${mood.name}</small>
    </button>
  `).join("");
}

function updateIntensityLabel() {
  const intensity = $("#intensity");
  const label = $("#intensityValue");
  if (intensity && label) label.textContent = `${intensity.value} / 5`;
}

function saveMood() {
  if (!selectedMood || !moods[selectedMood]) {
    toast("Pilih mood dulu ya ♡");
    return;
  }

  const intensity = $("#intensity");
  const note = $("#checkNote");

  const entry = {
    date: todayKey(),
    mood: selectedMood,
    intensity: intensity ? Number(intensity.value) : 3,
    note: note ? note.value.trim() : ""
  };

  const index = data.entries.findIndex((x) => x.date === entry.date);
  if (index >= 0) data.entries[index] = entry;
  else data.entries.push(entry);

  persist();
  toast("Today's mood saved ✨");
  showPage("home");
}

function renderStats() {
  const entries = data.entries || [];
  const count = {};

  entries.forEach((entry) => {
    if (entry.mood) count[entry.mood] = (count[entry.mood] || 0) + 1;
  });

  const avg = entries.length
    ? (entries.reduce((sum, x) => sum + (Number(x.intensity) || 0), 0) / entries.length).toFixed(1)
    : "0";

  const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];

  const checkins = $("#checkinsCount");
  const average = $("#avgIntensity");
  const dominantEmoji = $("#dominantEmoji");
  const dominantName = $("#dominantName");
  const dominantText = $("#dominantText");
  const moodBars = $("#moodBars");

  if (checkins) checkins.textContent = entries.length;
  if (average) average.textContent = `${avg}/5`;
  if (dominantEmoji) dominantEmoji.textContent = top && moods[top[0]] ? moods[top[0]].emoji : "—";
  if (dominantName) dominantName.textContent = top && moods[top[0]] ? moods[top[0]].name : "No data yet";
  if (dominantText) dominantText.textContent = top
    ? `${top[1]} check-in${top[1] > 1 ? "s" : ""} — mood yang paling sering muncul.`
    : "Mulai check-in untuk melihat statistik.";

  if (moodBars) {
    const max = Math.max(1, ...Object.values(count));
    moodBars.innerHTML = Object.entries(moods).map(([key, mood]) => {
      const n = count[key] || 0;
      return `
        <div class="bar-row">
          <div class="bar-top"><span>${mood.emoji} ${mood.name}</span><b>${n}</b></div>
          <div class="bar-track"><span style="width:${(n / max) * 100}%"></span></div>
        </div>
      `;
    }).join("");
  }
}

function renderCalendar() {
  const grid = $("#calendarGrid");
  const monthName = $("#monthName");
  const legend = $("#legend");
  if (!grid) return;

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  if (monthName) {
    monthName.textContent = first.toLocaleDateString("en-US", {
      month: "long", year: "numeric"
    });
  }

  const cells = [];
  for (let i = 0; i < first.getDay(); i++) {
    cells.push(`<div class="cal-day muted"></div>`);
  }

  for (let day = 1; day <= last.getDate(); day++) {
    const date = new Date(year, month, day);
    const key = todayKey(date);
    const entry = data.entries.find((x) => x.date === key);
    const isToday = key === todayKey();

    cells.push(`
      <div class="cal-day ${isToday ? "today" : ""}">
        <div class="num">${day}</div>
        <div class="mood">${entry && moods[entry.mood] ? moods[entry.mood].emoji : ""}</div>
      </div>
    `);
  }

  grid.innerHTML = cells.join("");

  if (legend) {
    legend.innerHTML = Object.values(moods)
      .map((mood) => `<span>${mood.emoji} ${mood.name}</span>`)
      .join("");
  }
}

function renderJournal() {
  const grid = $("#journalGrid");
  if (!grid) return;

  const arr = data.journal || [];
  grid.innerHTML = arr.map((entry) => `
    <article class="journal-card">
      <div class="journal-icon">${escapeHTML(entry.icon || "🌷")}</div>
      <h3>${escapeHTML(entry.title || "Untitled")}</h3>
      <p>${escapeHTML(entry.text || "")}</p>
      <small>${escapeHTML(entry.date || "")}</small>
    </article>
  `).join("");
}

function renderSelfcare() {
  const grid = $("#selfcareGrid");
  if (!grid) return;

  const all = [];
  Object.values(moods).forEach((mood) => {
    mood.care.forEach((item) => {
      all.push({
        icon: item.slice(0, 2),
        text: item.slice(2).trim(),
        mood: mood.name
      });
    });
  });

  grid.innerHTML = all.slice(0, 9).map((item) => `
    <article class="care-card">
      <div class="care-icon">${item.icon}</div>
      <h3>${escapeHTML(item.text)}</h3>
      <p>Suggested for ${escapeHTML(item.mood)} days.</p>
    </article>
  `).join("");
}

function showPage(id) {
  const page = document.getElementById(id);
  if (!page) return;

  $$(".page").forEach((item) => item.classList.toggle("active", item.id === id));
  $$(".nav").forEach((item) => item.classList.toggle("active", item.dataset.page === id));

  const titles = {
    home: "Home",
    checkin: "Mood Check-in",
    calendar: "Mood Calendar",
    stats: "Statistics",
    journal: "Journal",
    selfcare: "Self-care"
  };

  const title = $("#pageTitle");
  if (title) title.textContent = titles[id] || "Moodify";

  const sidebar = $("#sidebar");
  if (sidebar) sidebar.classList.remove("open");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openJournal() {
  const modalContent = $("#modalContent");
  const modal = $("#modal");
  if (!modalContent || !modal) return;

  modalContent.innerHTML = `
    <h2>New Journal Entry ✎</h2>
    <form class="form" id="journalForm">
      <input name="title" placeholder="Judul cerita..." required>
      <input name="icon" value="🌷" aria-label="Icon">
      <textarea name="text" placeholder="Ceritakan sedikit tentang hari kamu..." required></textarea>
      <button type="submit" class="primary">Save memory</button>
    </form>
  `;

  modal.classList.add("show");

  const form = $("#journalForm");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      data.journal.unshift({
        title: formData.get("title"),
        date: new Date().toLocaleDateString("id-ID", {
          day: "numeric", month: "long", year: "numeric"
        }),
        icon: formData.get("icon") || "🌷",
        text: formData.get("text")
      });

      persist();
      closeModal();
      showPage("journal");
      toast("Memory saved ✨");
    }, { once: true });
  }
}

function closeModal() {
  const modal = $("#modal");
  if (modal) modal.classList.remove("show");
}

function persist() {
  localStorage.setItem("moodify", JSON.stringify(data));
  renderAll();
}

function toast(message) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.__moodifyToast);
  window.__moodifyToast = setTimeout(() => el.classList.remove("show"), 1700);
}

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem(
    "moodifyTheme",
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
}

function applySavedTheme() {
  if (localStorage.getItem("moodifyTheme") === "dark") {
    document.documentElement.classList.add("dark");
  }
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", init);
