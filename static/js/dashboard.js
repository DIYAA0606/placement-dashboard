"use strict";

function getReadinessLimiters(resumeScore, dsaScore, taskScore) {
  const limiters = [];
  if (resumeScore < 50) limiters.push("low Resume match score");
  if (dsaScore < 40)    limiters.push("low DSA coverage");
  if (taskScore < 30)   limiters.push("inconsistent Planner usage");
  return limiters;
}

function renderRecommendations(dsaTopics, resumeScore, streak) {
  const box = getEl("recommendationBox");
  if (!box) return;

  const recs = [];

  // DSA weak topic detection
  if (dsaTopics && dsaTopics.length) {
    const weak = dsaTopics
      .map(t => {
        const total  = t.problems.length;
        const solved = t.problems.filter(p => p.completed).length;
        return { title: t.title, pct: total ? Math.round((solved / total) * 100) : 0 };
      })
      .filter(t => t.pct < 30)
      .sort((a, b) => a.pct - b.pct);

    if (weak.length) {
      recs.push(`⚠ You're weak in <strong>${weak[0].title}</strong> (${weak[0].pct}% done) — prioritize this topic next.`);
    }
  }

  // Resume ATS
  if (resumeScore === 0) {
    recs.push(`◎ No resume analyzed yet — upload your resume to get an ATS match score.`);
  } else if (resumeScore < 50) {
    recs.push(`◎ ATS score is ${resumeScore}% — add missing skills to your resume to improve match.`);
  }

  // Streak / consistency
  if (streak === 0) {
    recs.push(`◷ Streak broken — log at least one activity today to restart your streak.`);
  } else if (streak >= 7) {
    recs.push(`🔥 ${streak}-day streak! Keep the momentum going.`);
  }

  if (!recs.length) {
    recs.push(`✓ Looking good! Keep solving problems and checking off tasks.`);
  }

  box.innerHTML = recs
    .map(r => `<div class="rec-item">${r}</div>`)
    .join("");
}

function renderTargetCompanies() {
  const profile = typeof getProfile === "function" ? getProfile() : {};
  const row = getEl("targetCompaniesRow");
  if (!row) return;
  const companies = (profile.targetCompanies || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  if (!companies.length) { row.innerHTML = ""; return; }
  row.innerHTML = companies
    .map(c => `<span class="company-chip">${c}</span>`)
    .join("");
}
function getReadinessTier(score) {
  if (score >= 85) return { label: "Strong",     color: "var(--green)"  };
  if (score >= 65) return { label: "Ready",       color: "var(--blue)"   };
  if (score >= 40) return { label: "Building",    color: "var(--amber)"  };
  return               { label: "Exploring",    color: "var(--red)"    };
}
function animateCount(el, toVal, suffix = "", duration = 600) {
  if (!el) return;
  const from    = parseFloat(el.dataset.current || 0);
  const start   = performance.now();
  el.dataset.current = toVal;

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const val      = Math.round(from + (toVal - from) * ease);
    el.textContent = `${val}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function refreshDashboard() {
  // Greeting
  const profile = typeof getProfile === "function" ? getProfile() : {};
  const name = profile.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetEl = getEl("dashGreeting");
  if (greetEl) greetEl.textContent = `${greeting}, ${name} 👋`;

  // Streak
  // Streak
const streak = typeof calculateStreak === "function"
  ? calculateStreak()
  : 0;

const streakEl = getEl("statStreak");

if (streakEl) {
  animateCount(streakEl, streak, " days");
}

  // DSA stats
  // DSA stats
let dsaScore = 0;
let dsaTopics = null;

if (typeof getDSAProgress === "function") {

  const dsa = getDSAProgress();

  dsaScore = dsa.percentage;

  const dsaEl = getEl("statDSA");

  if (dsaEl) {
    dsaEl.textContent =
      `${dsa.solved} / ${dsa.total}`;
  }

  const dsaPctEl =
    getEl("dsaOverallPct");

  if (dsaPctEl) {
    animateCount(
      dsaPctEl,
      dsa.percentage,
      "%"
    );
  }
}
  if (typeof getDSAState === "function") dsaTopics = getDSAState();

  // Planner stats
  let taskScore = 0;
  if (typeof getPlannerStats === "function") {
    const planner = getPlannerStats();
    taskScore = planner.percentage;
    const tasksEl = getEl("statTasks");
    if (tasksEl) tasksEl.textContent = `${planner.completed} / ${planner.total}`;
    const pctEl = getEl("plannerPct");
    if (pctEl) pctEl.textContent = `${planner.completed} / ${planner.total} tasks done`;
    const fillEl = getEl("plannerFill");
    if (fillEl) fillEl.style.width = `${planner.percentage}%`;
  }

  // Resume score
  const resumeHistory = typeof getAnalysisHistory === "function" ? getAnalysisHistory() : [];
  const resumeScore = resumeHistory.length ? resumeHistory[0].percentage : 0;
const resumeEl =
  getEl("statResumeScore");

if (resumeEl) {

  if (resumeHistory.length) {

    animateCount(
      resumeEl,
      resumeScore,
      "%"
    );

  } else {

    resumeEl.textContent = "—";
  }
}
  const resumeBar = getEl("statResumeBar");
  if (resumeBar) resumeBar.style.width = `${resumeScore}%`;

  // Readiness
  const readiness = (resumeScore || dsaScore || taskScore)
    ? Math.round(resumeScore * 0.4 + dsaScore * 0.35 + taskScore * 0.25)
    : 0;
  const readinessStr = readiness ? `${readiness}%` : "—";

  const r1   = getEl("readinessScore");
  const r2   = getEl("readinessCardScore");
  const rBar = getEl("readinessBarFill");
 if (r1 && readiness) {

  animateCount(
    r1,
    readiness,
    "%"
  );

} else if (r1) {

  r1.textContent = "—";
}

if (r2 && readiness) {

  animateCount(
    r2,
    readiness,
    "%"
  );

} else if (r2) {

  r2.textContent = "—";
}
  if (rBar) rBar.style.width = `${readiness}%`;

  // Tier
  const tier = getReadinessTier(readiness);
  const tierEl = getEl("readinessTier");
  if (tierEl) {
    tierEl.textContent = readiness ? tier.label : "";
    tierEl.style.color = tier.color;
  }
  if (rBar) rBar.style.background = tier.color;

  // Breakdown
  const setBreakdown = (barId, valId, score) => {
    const bar = getEl(barId);
    const val = getEl(valId);
    if (bar) bar.style.width  = `${score}%`;
    if (val) val.textContent  = score ? `${score}%` : "—";
  };
  setBreakdown("breakdownResume", "breakdownResumeVal", resumeScore);
  setBreakdown("breakdownDSA",    "breakdownDSAVal",    dsaScore);
  setBreakdown("breakdownTasks",  "breakdownTasksVal",  taskScore);

  // Limiters
  const limiterEl = getEl("readinessLimiters");
  if (limiterEl) {
    const limiters = getReadinessLimiters(resumeScore, dsaScore, taskScore);
    limiterEl.textContent = limiters.length
      ? `Limited by: ${limiters.join(", ")}`
      : readiness >= 70 ? "Strong readiness — keep it up!" : "";
  }

  renderCompanyReadinessNote();
  renderTargetCompanies();
  renderRecommendations(dsaTopics, resumeScore, streak);
  if (typeof renderWeeklyProgress === "function") renderWeeklyProgress();
  renderActivityFeed();
}

const ACTIVITY_TYPE_META = {
  dsa:    { dot: "blue",   icon: "◷" },
  task:   { dot: "purple", icon: "◫" },
  resume: { dot: "green",  icon: "◎" },
};

function renderActivityFeed() {
  const list = getEl("activityList");
  if (!list) return;

  const log = typeof getActivityLog === "function" ? getActivityLog() : [];

  if (!log.length) {
    list.innerHTML = `<li class="activity-item activity-empty">No activity yet — start solving problems or adding tasks.</li>`;
    return;
  }

  list.innerHTML = log.slice(0, 6).map(entry => {
    const meta = ACTIVITY_TYPE_META[entry.type] || { dot: "amber", icon: "◦" };
    return `
      <li class="activity-item">
        <span class="activity-dot ${meta.dot}"></span>
        <span class="activity-label">${entry.label}</span>
        <span class="activity-time">${timeAgo(entry.time)}</span>
      </li>`;
  }).join("");
}
const COMPANY_READINESS_NOTES = {
  google:    "For Google: DSA weight is critical — Graphs, Trees, and DP are heavily tested.",
  amazon:    "For Amazon: Leadership fit + DSA arrays/strings dominate screening.",
  microsoft: "For Microsoft: Balanced DSA + CS Core (OS, DBMS) expected.",
  tcs:       "For TCS: Aptitude + basic DSA + communication matter most.",
  general:   "",
};

function renderCompanyReadinessNote() {
  const el   = getEl("readinessCompanyNote");
  if (!el) return;
  const mode = Storage.get("placeprep_prep_mode", "general");
  const note = COMPANY_READINESS_NOTES[mode] || "";
  el.textContent  = note;
  el.style.display = note ? "block" : "none";
}