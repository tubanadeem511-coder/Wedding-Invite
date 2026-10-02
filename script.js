/* =====================================================
   CONFIG — edit these values to customise the invitation
   ===================================================== */
const CONFIG = {
  BRIDE_NAME: "Areeba Hassan",
  GROOM_NAME: "Rayyan Ahmed",
  BRIDE_FATHER: "Imran Hassan",
  GROOM_FATHER: "Farooq Ahmed",

  BARAAT_DATE: "2026-11-13",       // YYYY-MM-DD
  BARAAT_TIME: "20:00",            // 24h start (used by countdown)
  BARAAT_END: "23:30",
  WALIMA_DATE: "2026-11-14",
  WALIMA_TIME: "19:30",
  WALIMA_END: "23:30",

  VENUE_NAME: "The Palace Banquet",
  GOOGLE_MAPS_LINK: "GOOGLE_MAPS_LINK_HERE",   // replace with a full https:// link
  WHATSAPP_NUMBER: "WHATSAPP_NUMBER_HERE",     // digits only, with country code e.g. 923001234567
  MUSIC_FILE: "assets/wedding-music.mp3"
};
/* ================== END CONFIG ================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Date helpers ---------- */
const at = (d, t) => new Date(`${d}T${t}:00`);          // local time
const fmtDate = d => at(d, "12:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const fmt12 = t => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
const fmtRange = (a, b) => `${fmt12(a)} – ${fmt12(b)}`;

/* ---------- Bind content ---------- */
const first = n => n.split(" ")[0];
const bind = {
  bride: CONFIG.BRIDE_NAME, groom: CONFIG.GROOM_NAME,
  brideFirst: first(CONFIG.BRIDE_NAME), groomFirst: first(CONFIG.GROOM_NAME),
  brideFather: CONFIG.BRIDE_FATHER, groomFather: CONFIG.GROOM_FATHER,
  venue: CONFIG.VENUE_NAME,
  baraatDate: fmtDate(CONFIG.BARAAT_DATE), baraatTime: fmtRange(CONFIG.BARAAT_TIME, CONFIG.BARAAT_END),
  walimaDate: fmtDate(CONFIG.WALIMA_DATE), walimaTime: fmtRange(CONFIG.WALIMA_TIME, CONFIG.WALIMA_END)
};
$$("[data-bind]").forEach(el => { el.textContent = bind[el.dataset.bind] ?? ""; });

/* ---------- Optional asset detection (graceful fallbacks) ---------- */
const probe = (src, cb) => { const i = new Image(); i.onload = cb; i.src = src; };
probe("assets/envelope.png", () => document.body.classList.add("has-env"));
/* envelope.png is layered on the envelope front; hero-garden.jpg is loaded by CSS and the gradient shows until it exists */

/* ---------- Countdown ---------- */
const cd = { D: $("#cdD"), H: $("#cdH"), M: $("#cdM"), S: $("#cdS") };
const events = [
  { label: "Until the Baraat", start: at(CONFIG.BARAAT_DATE, CONFIG.BARAAT_TIME), text: `Friday, ${bind.baraatDate} · ${fmt12(CONFIG.BARAAT_TIME)}` },
  { label: "Until the Walima Reception", start: at(CONFIG.WALIMA_DATE, CONFIG.WALIMA_TIME), text: `Saturday, ${bind.walimaDate} · ${fmt12(CONFIG.WALIMA_TIME)}` }
];
const set = (el, v) => {
  const s = String(v).padStart(2, "0");
  if (el.textContent === s) return;
  if (reduced) { el.textContent = s; return; }
  el.classList.add("tick");
  setTimeout(() => { el.textContent = s; el.classList.remove("tick"); }, 180);
};
function tickCountdown() {
  const now = Date.now();
  const ev = events.find(e => e.start - now > 0);
  if (!ev) {
    Object.values(cd).forEach(el => (el.textContent = "00"));
    $("#cdLabel").textContent = "With Gratitude";
    $("#cdDate").textContent = "";
    $("#cdEnd").hidden = false;
    return clearInterval(timer);
  }
  $("#cdLabel").textContent = ev.label;
  $("#cdDate").textContent = ev.text;
  let s = Math.floor((ev.start - now) / 1000);
  set(cd.D, Math.floor(s / 86400)); s %= 86400;
  set(cd.H, Math.floor(s / 3600));  s %= 3600;
  set(cd.M, Math.floor(s / 60));
  set(cd.S, s % 60);
}
const timer = setInterval(tickCountdown, 1000);
tickCountdown();

/* ---------- Map button ---------- */
const mapBtn = $("#mapBtn");
const mapOK = /^https?:\/\//i.test(CONFIG.GOOGLE_MAPS_LINK);
mapBtn.href = mapOK ? CONFIG.GOOGLE_MAPS_LINK : "#";
if (!mapOK) mapBtn.addEventListener("click", e => { e.preventDefault(); $(".note").textContent = "Location link coming soon."; });
else $(".note").remove();

/* ---------- RSVP ---------- */
const form = $("#rsvpForm"), msg = $("#formMsg");
const say = (t, err) => { msg.textContent = t; msg.classList.toggle("err", !!err); };
function rsvpData() {
  const f = new FormData(form);
  return { name: (f.get("name") || "").trim(), guests: f.get("guests"), att: f.get("att"), meal: f.get("meal"), message: (f.get("message") || "").trim() };
}
form.addEventListener("submit", e => {
  e.preventDefault();
  const d = rsvpData();
  if (!d.name) { say("Please enter your name.", true); $("#fName").focus(); return; }
  const joy = d.att === "Joyfully Accept";
  say(joy ? `Thank you, ${d.name}. We look forward to celebrating with you.` : `Thank you, ${d.name}. You will be missed.`);
  // No backend: reply is kept on this page. Use the WhatsApp button to send it to the family.
});
$("#waBtn").addEventListener("click", () => {
  const d = rsvpData();
  if (!d.name) { say("Please enter your name first.", true); $("#fName").focus(); return; }
  const num = CONFIG.WHATSAPP_NUMBER.replace(/\D/g, "");
  if (!num) { say("WhatsApp number has not been added yet.", true); return; }
  const text = [`Assalamu Alaikum, this is ${d.name}.`, `${d.att} the wedding of ${CONFIG.BRIDE_NAME} & ${CONFIG.GROOM_NAME}.`,
    d.att === "Joyfully Accept" ? `Guests: ${d.guests}` : "", d.meal ? `Meal: ${d.meal}` : "", d.message ? `Message: ${d.message}` : ""].filter(Boolean).join("\n");
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
});

/* ---------- Music ---------- */
const audio = new Audio(); audio.loop = true; audio.preload = "none"; audio.volume = .55; audio.src = CONFIG.MUSIC_FILE;
const mBtn = $("#musicBtn");
const setMusic = on => { mBtn.classList.toggle("on", on); mBtn.setAttribute("aria-pressed", on); mBtn.setAttribute("aria-label", on ? "Music on — tap to turn off" : "Music off — tap to turn on"); $("span", mBtn).textContent = on ? "♫" : "♪"; };
const play = () => audio.play().then(() => setMusic(true)).catch(() => setMusic(false));
mBtn.addEventListener("click", () => { audio.paused ? play() : (audio.pause(), setMusic(false)); });
audio.addEventListener("error", () => { mBtn.hidden = true; }); // file not added yet

/* ---------- Opening sequence ---------- */
const env = $("#openBtn"), intro = $("#intro");
let opened = false;
env.addEventListener("click", () => {
  if (opened) return; opened = true;
  env.classList.add("open");
  mBtn.hidden = false; setMusic(false); play();
  const t = reduced ? 200 : 3200;
  setTimeout(() => {
    intro.classList.add("gone");
    document.body.classList.remove("locked");
    scrollTo(0, 0);
    $$("#hero .rv").forEach((el, i) => { el.style.setProperty("--d", `${i * .35}s`); el.classList.add("in"); });
    setTimeout(() => (intro.hidden = true), 1500);
  }, t);
});

/* ---------- Scroll reveal ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .18 });
$$(".rv").forEach(el => { if (!el.closest("#hero")) io.observe(el); });

/* ---------- Progress, back-to-top, parallax ---------- */
const bar = $("#bar"), topBtn = $("#topBtn"), hero = $("#heroBg");
let ticking = false;
addEventListener("scroll", () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    topBtn.classList.toggle("show", y > innerHeight * .8);
    if (!reduced && y < innerHeight * 1.2) hero.style.translate = `0 ${y * .18}px`;
    ticking = false;
  });
}, { passive: true });

/* ---------- Petals & gold dust ---------- */
if (!reduced) {
  const layer = document.createDocumentFragment();
  const n = innerWidth < 600 ? 9 : 16;
  for (let i = 0; i < n; i++) {
    const p = document.createElement("i"); p.className = "petal"; p.setAttribute("aria-hidden", "true");
    p.style.cssText = `left:${Math.random() * 100}vw;animation-duration:${16 + Math.random() * 14}s;animation-delay:${-Math.random() * 25}s;--dx:${(Math.random() - .5) * 160}px;scale:${.6 + Math.random() * .8}`;
    layer.appendChild(p);
  }
  for (let i = 0; i < 12; i++) {
    const d = document.createElement("i"); d.className = "dust"; d.setAttribute("aria-hidden", "true");
    d.style.cssText = `left:${Math.random() * 100}vw;animation-duration:${10 + Math.random() * 10}s;animation-delay:${-Math.random() * 15}s`;
    layer.appendChild(d);
  }
  document.body.appendChild(layer);
}
