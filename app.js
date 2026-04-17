
const MAP = {"Α":"Μ","Β":"Π","Γ":"Τ","Δ":"Ρ","Ε":"Σ","Ζ":"Λ","Η":"Κ","Θ":"Δ","Ι":"Φ","Κ":"Χ","Λ":"Ξ","Μ":"Α","Ν":"Β","Ξ":"Ζ","Ο":"Η","Π":"Ι","Ρ":"Ο","Σ":"Ν","Τ":"Γ","Υ":"Ω","Φ":"Ε","Χ":"Θ","Ψ":"Υ","Ω":"Ψ"};
let puzzles = [];
let currentPuzzle = null;
let usedIds = new Set();



function normalizeText(s){
  return (s||"").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[ς]/g,"Σ").replace(/[^A-ZΑ-Ω0-9 ]/g," ").replace(/\s+/g," ").trim();
}
function cipherGreek(text){ return [...text.toUpperCase()].map(ch => MAP[ch] || ch).join(""); }
function chapterIcon(chapter){
  return {
    "Αγροτική οικονομία και αστικοποίηση":"🌾",
    "Πολιτικά κόμματα":"🏛️",
    "Προσφυγικό ζήτημα":"🧳",
    "Κρητικό ζήτημα":"🛡️",
    "Παρευξείνιος Ελληνισμός":"🌊"
  }[chapter] || "📘";
}
function loadStats(){ try{return JSON.parse(localStorage.getItem("ik_stats")||'{"solved":0,"correct":0,"wrong":0,"reveals":0}');}catch(e){return {solved:0,correct:0,wrong:0,reveals:0};}}
function saveStats(stats){ localStorage.setItem("ik_stats", JSON.stringify(stats)); }
function updateStatsUI(){
  const stats = loadStats();
  if(!document.getElementById("stat-solved")) return;
  document.getElementById("stat-solved").textContent = stats.solved;
  document.getElementById("stat-correct").textContent = stats.correct;
  document.getElementById("stat-wrong").textContent = stats.wrong;
  const total = stats.correct + stats.wrong;
  document.getElementById("stat-acc").textContent = total ? Math.round(stats.correct*100/total)+"%" : "—";
}
function populateFilters(){
  const chapterSel = document.getElementById("chapterFilter");
  const sectionSel = document.getElementById("sectionFilter");
  const typeSel = document.getElementById("typeFilter");
  if(!chapterSel) return;
  const chapters = [...new Set(puzzles.map(p=>p.chapter))];
  const sections = [...new Set(puzzles.map(p=>p.section))];
  const types = [...new Set(puzzles.map(p=>p.type))];
  chapterSel.innerHTML = '<option value="">Όλα τα κεφάλαια</option>' + chapters.map(v=>`<option>${v}</option>`).join("");
  sectionSel.innerHTML = '<option value="">Όλες οι υποενότητες</option>' + sections.map(v=>`<option>${v}</option>`).join("");
  typeSel.innerHTML = '<option value="">Όλοι οι τύποι</option>' + types.map(v=>`<option>${v}</option>`).join("");
}
function currentFilters(){
  return {
    chapter: document.getElementById("chapterFilter")?.value || "",
    section: document.getElementById("sectionFilter")?.value || "",
    type: document.getElementById("typeFilter")?.value || "",
    difficulty: document.getElementById("difficultyFilter")?.value || "",
    reviewedOnly: document.getElementById("reviewedOnly")?.checked ?? true
  };
}
function filteredPuzzles(){
  const f = currentFilters();
  return puzzles.filter(p =>
    (!f.chapter || p.chapter===f.chapter) &&
    (!f.section || p.section===f.section) &&
    (!f.type || p.type===f.type) &&
    (!f.difficulty || p.difficulty===f.difficulty)
  );
}
function renderEmpty(){
  document.getElementById("cipherText").textContent = "—";
  document.getElementById("meta").innerHTML = "";
  document.getElementById("answerInput").value = "";
  document.getElementById("feedback").innerHTML = '<div class="feedback">Δεν υπάρχουν κρυπτογραφήματα με αυτά τα φίλτρα. Δοκίμασε ευρύτερη επιλογή.</div>';
}
function renderPuzzle(){
  if(!currentPuzzle) return;
  document.getElementById("chapterIcon").textContent = chapterIcon(currentPuzzle.chapter);
  document.getElementById("cipherText").textContent = cipherGreek(currentPuzzle.answer);
  document.getElementById("meta").innerHTML = `
    <span class="badge">${currentPuzzle.chapter}</span>
    <span class="badge">${currentPuzzle.section}</span>
    <span class="badge">${currentPuzzle.type}</span>
    <span class="badge">Δυσκολία: ${currentPuzzle.difficulty}</span>
    <span class="badge">Ελεγμένο: ${currentPuzzle.reviewed ? "ναι" : "όχι"}</span>`;
  document.getElementById("answerInput").value = "";
  document.getElementById("feedback").innerHTML = "";
}
function pickPuzzle(){
  const pool = filteredPuzzles();
  const notice = document.getElementById("no-results");
  if(notice) notice.style.display = pool.length ? "none" : "block";
  if(!pool.length){ currentPuzzle = null; renderEmpty(); return; }
  let available = pool.filter(p => !usedIds.has(p.id));
  if(!available.length){ usedIds = new Set(); available = pool; }
  currentPuzzle = available[Math.floor(Math.random()*available.length)];
  usedIds.add(currentPuzzle.id);
  renderPuzzle();
}
function checkAnswer(){
  if(!currentPuzzle) return;
  const stats = loadStats();
  const user = normalizeText(document.getElementById("answerInput").value);
  const correct = normalizeText(currentPuzzle.answer);
  if(user && user === correct){
    stats.solved += 1; stats.correct += 1;
    stats.chapterSolved[currentPuzzle.chapter] = (stats.chapterSolved[currentPuzzle.chapter] || 0) + 1;
    saveStats(stats); updateStatsUI();
    document.getElementById("feedback").innerHTML = `<div class="feedback ok"><strong>Σωστά.</strong> Η λύση είναι: <b>${currentPuzzle.answer}</b>.<br><br>${currentPuzzle.explanation}</div>`;
  } else {
    stats.wrong += 1; saveStats(stats); updateStatsUI();
    document.getElementById("feedback").innerHTML = `<div class="feedback err"><strong>Όχι ακόμη.</strong> Δοκίμασε ξανά ή πάτησε μία υπόδειξη.</div>`;
  }
}
function showHint(level){
  if(!currentPuzzle) return;
  const text = level===1 ? currentPuzzle.hint1 : currentPuzzle.hint2;
  document.getElementById("feedback").innerHTML = `<div class="feedback"><strong>Υπόδειξη ${level}:</strong> ${text}</div>`;
}
function revealLetter(){
  if(!currentPuzzle) return;
  const answer = currentPuzzle.answer;
  const input = document.getElementById("answerInput");
  const cur = input.value || "";
  let i=0;
  while(i<answer.length && normalizeText(cur.slice(0,i+1))===normalizeText(answer.slice(0,i+1))) i++;
  input.value = answer.slice(0, Math.min(i+1, answer.length));
  const stats = loadStats(); stats.reveals += 1; saveStats(stats);
}
function resetProgress(){
  localStorage.removeItem("ik_stats");
  updateStatsUI();
  document.getElementById("feedback").innerHTML = `<div class="feedback">Η πρόοδος μηδενίστηκε.</div>`;
}
function applyQuickFilter(chapter){
  const c = document.getElementById("chapterFilter");
  if(c) c.value = chapter || "";
  pickPuzzle();
  document.getElementById("game")?.scrollIntoView({behavior:"smooth", block:"start"});
}
function dailyPuzzle(){
  const now = new Date();
  const start = new Date(now.getFullYear(),0,0);
  const day = Math.floor((now-start)/(1000*60*60*24));
  currentPuzzle = puzzles[day % puzzles.length];
  renderPuzzle();
  document.getElementById("game")?.scrollIntoView({behavior:"smooth", block:"start"});
}
async function init(){
  const res = await fetch("data/puzzles.json");
  puzzles = await res.json();
  populateFilters();
  updateStatsUI();
  pickPuzzle();
  ["chapterFilter","sectionFilter","typeFilter","difficultyFilter"].forEach(id => document.getElementById(id)?.addEventListener("change", pickPuzzle));
  document.getElementById("newPuzzleBtn")?.addEventListener("click", pickPuzzle);
  document.getElementById("checkBtn")?.addEventListener("click", checkAnswer);
  document.getElementById("hint1Btn")?.addEventListener("click", ()=>showHint(1));
  document.getElementById("hint2Btn")?.addEventListener("click", ()=>showHint(2));
  document.getElementById("revealBtn")?.addEventListener("click", revealLetter);
  document.getElementById("dailyBtn")?.addEventListener("click", dailyPuzzle);
  document.getElementById("resetBtn")?.addEventListener("click", resetProgress);
  document.getElementById("answerInput")?.addEventListener("keydown", e=>{ if(e.key==="Enter") checkAnswer(); });
  document.querySelectorAll("[data-chapter]").forEach(el => el.addEventListener("click", ()=>applyQuickFilter(el.dataset.chapter)));
}
document.addEventListener("DOMContentLoaded", init);
