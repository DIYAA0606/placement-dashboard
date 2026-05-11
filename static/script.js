/* ====================================================
   PlacePrep — script.js
   Vanilla JS: navigation, resume analyzer, DSA tracker,
   study planner, localStorage persistence
==================================================== */

"use strict";

/* ====================================================
   NAVIGATION
==================================================== */
const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".section");
const qaButtons = document.querySelectorAll(".qa-btn");
const sidebar   = document.getElementById("sidebar");
const menuBtn   = document.getElementById("menuBtn");
const overlay   = document.getElementById("sidebarOverlay");

/**
 * Show a named section and update nav active state.
 * @param {string} name - section identifier
 */
function showSection(name) {
  sections.forEach(s => s.classList.remove("active"));
  navItems.forEach(n => n.classList.remove("active"));

  const target = document.getElementById("section-" + name);
  if (target) target.classList.add("active");

  navItems.forEach(n => {
    if (n.dataset.section === name) n.classList.add("active");
  });
}

navItems.forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault();
    showSection(item.dataset.section);
    closeSidebar();
  });
});

// Quick action buttons on dashboard
qaButtons.forEach(btn => {
  btn.addEventListener("click", () => showSection(btn.dataset.section));
});

// Mobile sidebar toggle
menuBtn.addEventListener("click", () => {
  const isOpen = sidebar.classList.contains("mobile-open");
  isOpen ? closeSidebar() : openSidebar();
});

overlay.addEventListener("click", closeSidebar);
document.addEventListener(
  "keydown",
  e => {

    if(
      e.key === "Escape"
    ){

      closeSidebar();

    }

  }
);

function openSidebar() {
  sidebar.classList.add("mobile-open");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  sidebar.classList.remove("mobile-open");
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

/* ====================================================
   DASHBOARD — Date
==================================================== */
(function setDate() {
  const el = document.getElementById("headerDate");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
})();

/* ====================================================
   RESUME ANALYZER
   Works in two modes:
   1. With Flask running → sends PDF to /analyze API
   2. Without Flask (file:// or no backend) → client-side
      text extraction via FileReader + JS skill matching
==================================================== */

// All element references are looked up lazily inside functions
// so they're never null even if the section hasn't been shown yet.

function getEl(id) { return document.getElementById(id); }

let selectedFile = null;
let latestAnalysis = null;
const RING_CIRCUMFERENCE = 351.86; // 2 * π * 56

// ── Skill taxonomy for client-side matching ────────────────────────
const SKILL_MAP = {
  "python":"Python","java":"Java","javascript":"JavaScript",
  "typescript":"TypeScript","c++":"C++","c#":"C#","golang":"Go",
  "go":"Go","rust":"Rust","kotlin":"Kotlin","swift":"Swift",
  "ruby":"Ruby","php":"PHP","scala":"Scala","html":"HTML","css":"CSS",
  "react":"React","vue":"Vue.js","angular":"Angular","next.js":"Next.js",
  "redux":"Redux","graphql":"GraphQL","rest api":"REST APIs",
  "restful":"REST APIs","rest":"REST APIs","bootstrap":"Bootstrap",
  "tailwind":"Tailwind CSS","flask":"Flask","django":"Django",
  "fastapi":"FastAPI","spring":"Spring Boot","express":"Express.js",
  "node.js":"Node.js","nodejs":"Node.js","node":"Node.js",
  "laravel":"Laravel","sql":"SQL","mysql":"MySQL",
  "postgresql":"PostgreSQL","postgres":"PostgreSQL","mongodb":"MongoDB",
  "redis":"Redis","sqlite":"SQLite","firebase":"Firebase",
  "dynamodb":"DynamoDB","aws":"AWS","azure":"Azure","gcp":"GCP",
  "docker":"Docker","kubernetes":"Kubernetes","terraform":"Terraform",
  "ci/cd":"CI/CD","jenkins":"Jenkins","linux":"Linux","bash":"Bash",
  "machine learning":"Machine Learning","deep learning":"Deep Learning",
  "tensorflow":"TensorFlow","pytorch":"PyTorch","keras":"Keras",
  "scikit-learn":"Scikit-learn","pandas":"Pandas","numpy":"NumPy",
  "nlp":"NLP","data structures":"Data Structures",
  "algorithms":"Algorithms","operating systems":"Operating Systems",
  "dbms":"DBMS","computer networks":"Computer Networks",
  "object oriented":"OOP","oop":"OOP","oops":"OOP",
  "system design":"System Design","git":"Git","github":"GitHub",
  "agile":"Agile","scrum":"Scrum","jira":"Jira",
  "communication":"Communication","leadership":"Leadership",
  "problem solving":"Problem Solving","teamwork":"Teamwork",
};

function extractSkillsFromText(text) {
  const norm = text.toLowerCase().replace(/\s+/g," ");
  const found = new Set();
  // Sort keys longest-first to match multi-word phrases before single words
  Object.keys(SKILL_MAP).sort((a,b) => b.length - a.length).forEach(key => {
    const pattern = new RegExp("(?<![a-z0-9])" + key.replace(/[.*+?^${}()|[\]\\]/g,"\\$&") + "(?![a-z0-9])", "i");
    if (pattern.test(norm)) found.add(SKILL_MAP[key]);
  });
  return found;
}

function buildClientSuggestions(missing, pct) {
  const s = [];
  if (pct < 40) s.push("Your resume covers less than 40% of the required skills. Consider a significant revision to align it with this role.");
  else if (pct < 65) s.push("You match several key skills but there are meaningful gaps. Prioritize bridging the missing skills with projects or certifications.");
  else s.push("Strong match! Focus on quantifying your existing experience and tailoring your bullet points to mirror the JD language.");
  if (missing.has("System Design")) s.push("System Design is required — study scalable architecture patterns (load balancing, caching, sharding). Practice on Excalidraw.");
  if (missing.has("Docker") || missing.has("Kubernetes")) s.push("Containerisation skills (Docker/Kubernetes) are expected. Add a Dockerized project to your GitHub.");
  if (["Machine Learning","Deep Learning","TensorFlow","PyTorch"].some(x => missing.has(x))) s.push("ML/AI skills are listed in the JD. Even a Kaggle project or mini-ML pipeline on GitHub would help.");
  if (["SQL","PostgreSQL","MySQL"].some(x => missing.has(x))) s.push("SQL proficiency is expected. Practice on SQLZoo or LeetCode DB and mention database experience in your resume.");
  if (["AWS","GCP","Azure"].some(x => missing.has(x))) s.push("Cloud experience is required. A free-tier AWS or GCP deployment project demonstrates cloud familiarity.");
  if (s.length < 3) s.push("Tailor your resume bullet points to mirror the exact language used in the job description for better ATS pass-through.");
  return s.slice(0, 5);
}

/** Client-side analysis using FileReader to read PDF as text */
function analyzeClientSide(file, jdText) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      // FileReader gives us the raw bytes; extract visible ASCII text
      // This works for text-based PDFs (not scanned)
      const raw = e.target.result;
      // Decode as latin-1 to grab ASCII spans from the PDF binary
      let decoded = "";
      if (typeof raw === "string") {
        decoded = raw;
      } else {
        const bytes = new Uint8Array(raw);
        for (let i = 0; i < bytes.length; i++) {
          const c = bytes[i];
          if ((c >= 32 && c < 127) || c === 10 || c === 13) {
            decoded += String.fromCharCode(c);
          }
        }
      }

      const resumeSkills = extractSkillsFromText(decoded);
      const jdSkills     = extractSkillsFromText(jdText);

      const found   = new Set([...resumeSkills].filter(x => jdSkills.has(x)));
      const missing = new Set([...jdSkills].filter(x => !resumeSkills.has(x)));

      const pct = jdSkills.size > 0
        ? Math.round((found.size / jdSkills.size) * 100)
        : 0;

      resolve({
        percentage:    pct,
        found_skills:  [...found].sort(),
        missing_skills:[...missing].sort(),
        suggestions:   buildClientSuggestions(missing, pct),
        client_mode:   true,
      });
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });
}

/* --- Wire up drop zone (deferred so elements always exist) --- */
document.addEventListener("DOMContentLoaded", function() {
  const dropZone   = getEl("dropZone");
  const resumeFile = getEl("resumeFile");
  const fileStatus = getEl("fileStatus");
  const analyzeBtn = getEl("analyzeBtn");

  if (!dropZone || !analyzeBtn) return; // elements not in DOM

  dropZone.addEventListener("click", () => resumeFile.click());

  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  });
  resumeFile.addEventListener("change", () => {
    if (resumeFile.files[0]) handleFileSelect(resumeFile.files[0]);
  });

  // ── Analyze button ──────────────────────────────────────────────
  analyzeBtn.addEventListener("click", async () => {
    const jdEl = getEl("jobDesc");
    clearError();

    if (!selectedFile) { toast("Please upload your resume PDF first.", "error"); return; }
    if (!jdEl || !jdEl.value.trim()) {  toast("Please paste a job description.", "error"); return; }

    const jdText = jdEl.value.trim();
    setLoading(true);

    // Try Flask backend first; fall back to client-side on any network error
    let data = null;
    let usedClientFallback = false;

    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);
      formData.append("job_description", jdText);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const res = await fetch("/analyze", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        data = await res.json();
      } else {
        let errMsg = "Server error.";
        try { const e = await res.json(); if (e.error) errMsg = e.error; } catch(_) {}
        // Don't throw — fall through to client-side
        console.warn("Flask error:", errMsg);
      }
    } catch (err) {
      // Network error or timeout → use client-side mode
      console.info("Flask not available, using client-side analysis.");
    }

    // Client-side fallback if Flask didn't return data
    if (!data) {
      usedClientFallback = true;
      data = await analyzeClientSide(selectedFile, jdText);
    }

    setLoading(false);

    if (!data) {
      showError("Could not analyze this PDF. It may be image-based (scanned). Try a text-based PDF.");
      return;
    }

    renderResults(data, usedClientFallback,jdText);
    saveAnalysisToHistory(
        

    data,

    selectedFile.name,

    jdText

);
recordActivity();

refreshDashboard();
  });
});

/** Validate and store selected file; update UI */
function handleFileSelect(file) {
  const dropZone  = getEl("dropZone");
  const fileStatus = getEl("fileStatus");

  if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    showError("Only PDF files are supported. Please upload a .pdf file.");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showError("File too large. Please upload a PDF under 5MB.");
    return;
  }
  selectedFile = file;
  clearError();
  if (dropZone) {
    dropZone.classList.add("has-file");
    const icon  = dropZone.querySelector(".drop-icon");
    const title = dropZone.querySelector(".drop-title");
    const sub   = dropZone.querySelector(".drop-sub");
    if (icon)  icon.textContent  = "✓";
    if (title) title.textContent = file.name;
    if (sub)   sub.textContent   = (file.size / 1024).toFixed(0) + " KB · PDF";
  }
  if (fileStatus) fileStatus.textContent = "Resume ready for analysis";
}

/** Toggle loading state on/off */
function setLoading(on) {
  const analyzeBtn     = getEl("analyzeBtn");
  const analyzeBtnText = getEl("analyzeBtnText");
  const resultsEmpty   = getEl("resultsEmpty");
  const resultsLoading = getEl("resultsLoading");
  const resultsContent = getEl("resultsContent");

  if (analyzeBtn)     analyzeBtn.disabled = on;
  if (analyzeBtnText) analyzeBtnText.textContent = on ? "Analyzing…" : "Analyze Match";
  if (resultsEmpty)   resultsEmpty.classList.add("hidden");
  if (resultsContent) resultsContent.classList.add("hidden");
  if (resultsLoading) {
    on ? resultsLoading.classList.remove("hidden")
       : resultsLoading.classList.add("hidden");
  }
}

/** Render analysis results */
function renderResults(data, clientMode,jdText) {
    latestAnalysis = data;
  const ringFillEl      = getEl("ringFill");
  const ringPctEl       = getEl("ringPct");
  const foundSkillsEl   = getEl("foundSkills");
  const missingSkillsEl = getEl("missingSkills");
  const suggestionsEl   = getEl("suggestionsList");
  const resultsContent  = getEl("resultsContent");

  const pct = Math.round(data.percentage || 0);

  // Animate SVG ring
  if (ringFillEl) {
    const offset = RING_CIRCUMFERENCE - (pct / 100) * RING_CIRCUMFERENCE;
    ringFillEl.style.strokeDashoffset = offset;
    if (pct >= 70)      ringFillEl.style.stroke = "var(--green)";
    else if (pct >= 45) ringFillEl.style.stroke = "var(--amber)";
    else                ringFillEl.style.stroke = "var(--red)";
  }

  if (ringPctEl) animateCounter(ringPctEl, 0, pct, 900);

  // Skill chips
  if (foundSkillsEl) {
    foundSkillsEl.innerHTML = "";
    (data.found_skills || []).forEach(skill => {
      const chip = document.createElement("span");
      chip.className = "skill-chip chip-found";
      chip.textContent = skill;
      foundSkillsEl.appendChild(chip);
    });
    if (!data.found_skills || data.found_skills.length === 0) {
      foundSkillsEl.innerHTML = '<span style="color:var(--text3);font-size:0.8rem">None detected</span>';
    }
  }

  if (missingSkillsEl) {
    missingSkillsEl.innerHTML = "";
    (data.missing_skills || []).forEach(skill => {
      const chip = document.createElement("span");
      chip.className = "skill-chip chip-missing";
      chip.textContent = skill;
      missingSkillsEl.appendChild(chip);
    });
    if (!data.missing_skills || data.missing_skills.length === 0) {
      missingSkillsEl.innerHTML = '<span style="color:var(--green);font-size:0.8rem">✓ No missing skills!</span>';
    }
  }

  if (suggestionsEl) {
    suggestionsEl.innerHTML = "";
    (data.suggestions || []).forEach(s => {
      const li = document.createElement("li");
      li.textContent = s;
      suggestionsEl.appendChild(li);
    });
  }

  // Show a subtle note if client-side mode was used
  if (clientMode) {
    const note = document.createElement("p");
    note.style.cssText = "font-size:0.72rem;color:var(--text3);margin-top:14px;border-top:1px solid var(--border);padding-top:10px;";
    note.textContent = "ℹ Analyzed client-side (Flask not detected). For full PDF text extraction, run app.py and open via localhost:5000.";
    if (suggestionsEl) suggestionsEl.parentNode.appendChild(note);
  }

  if (resultsContent) resultsContent.classList.remove("hidden");
  const downloadBtn =
getEl("downloadReportBtn");

if(downloadBtn){

    downloadBtn.classList.remove(
        "hidden"
    );

}
}

/** Animate a number counter from start→end in duration ms */
function animateCounter(el, start, end, duration) {
  const startTime = performance.now();
  function step(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (end - start) * eased) + "%";
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function showError(msg) {
  const el = getEl("analyzerError");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearError() {
  const el = getEl("analyzerError");
  if (el) { el.textContent = ""; el.classList.add("hidden"); }
}

/* ====================================================
   DSA TRACKER
==================================================== */

/**
 * DSA data structure:
 * Each topic has a name, color theme, icon, and array of problems.
 * Completion state is stored/loaded from localStorage.
 */
const DSA_TOPICS = [
  {
    id: "arrays",
    name: "Arrays & Hashing",
    icon: "[ ]",
    color: "blue",
    problems: [
      { id: "a1", name: "Two Sum", diff: "easy" },
      { id: "a2", name: "Contains Duplicate", diff: "easy" },
      { id: "a3", name: "Product of Array Except Self", diff: "medium" },
      { id: "a4", name: "Top K Frequent Elements", diff: "medium" },
      { id: "a5", name: "Longest Consecutive Sequence", diff: "medium" },
    ]
  },
  {
    id: "sliding",
    name: "Sliding Window",
    icon: "⟷",
    color: "green",
    problems: [
      { id: "sw1", name: "Best Time to Buy and Sell Stock", diff: "easy" },
      { id: "sw2", name: "Longest Substring Without Repeating", diff: "medium" },
      { id: "sw3", name: "Longest Repeating Character Replacement", diff: "medium" },
      { id: "sw4", name: "Minimum Window Substring", diff: "hard" },
    ]
  },
  {
    id: "linkedlist",
    name: "Linked Lists",
    icon: "→",
    color: "purple",
    problems: [
      { id: "ll1", name: "Reverse a Linked List", diff: "easy" },
      { id: "ll2", name: "Merge Two Sorted Lists", diff: "easy" },
      { id: "ll3", name: "Reorder List", diff: "medium" },
      { id: "ll4", name: "Remove Nth Node From End", diff: "medium" },
      { id: "ll5", name: "Detect Cycle in Linked List", diff: "easy" },
      { id: "ll6", name: "Merge K Sorted Lists", diff: "hard" },
    ]
  },
  {
    id: "trees",
    name: "Trees & BST",
    icon: "⊤",
    color: "amber",
    problems: [
      { id: "t1", name: "Invert Binary Tree", diff: "easy" },
      { id: "t2", name: "Maximum Depth of Binary Tree", diff: "easy" },
      { id: "t3", name: "Validate BST", diff: "medium" },
      { id: "t4", name: "Lowest Common Ancestor of BST", diff: "medium" },
      { id: "t5", name: "Binary Tree Level Order Traversal", diff: "medium" },
      { id: "t6", name: "Serialize and Deserialize Binary Tree", diff: "hard" },
    ]
  },
  {
    id: "graphs",
    name: "Graphs",
    icon: "⬡",
    color: "red",
    problems: [
      { id: "g1", name: "Number of Islands", diff: "medium" },
      { id: "g2", name: "Clone Graph", diff: "medium" },
      { id: "g3", name: "Pacific Atlantic Water Flow", diff: "medium" },
      { id: "g4", name: "Course Schedule (Topo Sort)", diff: "medium" },
      { id: "g5", name: "Surrounded Regions", diff: "medium" },
      { id: "g6", name: "Word Ladder", diff: "hard" },
    ]
  },
  {
    id: "dp",
    name: "Dynamic Programming",
    icon: "◈",
    color: "purple",
    problems: [
      { id: "dp1", name: "Climbing Stairs", diff: "easy" },
      { id: "dp2", name: "House Robber", diff: "medium" },
      { id: "dp3", name: "Longest Palindromic Substring", diff: "medium" },
      { id: "dp4", name: "Coin Change", diff: "medium" },
      { id: "dp5", name: "Longest Increasing Subsequence", diff: "medium" },
      { id: "dp6", name: "Edit Distance", diff: "hard" },
      { id: "dp7", name: "Burst Balloons", diff: "hard" },
    ]
  },
  {
    id: "binary",
    name: "Binary Search",
    icon: "÷",
    color: "blue",
    problems: [
      { id: "bs1", name: "Binary Search", diff: "easy" },
      { id: "bs2", name: "Search a 2D Matrix", diff: "medium" },
      { id: "bs3", name: "Find Minimum in Rotated Sorted Array", diff: "medium" },
      { id: "bs4", name: "Search in Rotated Sorted Array", diff: "medium" },
      { id: "bs5", name: "Median of Two Sorted Arrays", diff: "hard" },
    ]
  },
  {
    id: "heap",
    name: "Heap / Priority Queue",
    icon: "△",
    color: "amber",
    problems: [
      { id: "h1", name: "Kth Largest Element in Array", diff: "medium" },
      { id: "h2", name: "Task Scheduler", diff: "medium" },
      { id: "h3", name: "Find Median from Data Stream", diff: "hard" },
    ]
  }
];

/** Load DSA completion state from localStorage */
function loadDSAState() {
  try {
    return JSON.parse(localStorage.getItem("placeprep_dsa") || "{}");
  } catch (_) {
    return {};
  }
}

/** Save DSA completion state to localStorage */
function saveDSAState(state) {
  localStorage.setItem("placeprep_dsa", JSON.stringify(state));
}

let dsaState = loadDSAState();

/** Build and render the DSA grid */
function renderDSAGrid() {
  const grid = document.getElementById("dsaGrid");
  grid.innerHTML = "";

  let totalProblems = 0;
  let totalDone = 0;

  DSA_TOPICS.forEach(topic => {
    const doneProblemIds = topic.problems.filter(p => dsaState[p.id]).length;
    const total = topic.problems.length;
    const pct = total > 0 ? Math.round((doneProblemIds / total) * 100) : 0;

    totalProblems += total;
    totalDone += doneProblemIds;

    // Card
    const card = document.createElement("div");
    card.className = "dsa-topic-card";
    card.dataset.topicId = topic.id;

    // Header
    const header = document.createElement("div");
    header.className = "dsa-card-header";
    header.innerHTML = `
      <div class="dsa-topic-left">
        <div class="dsa-topic-icon topic-icon-${topic.color}">${topic.icon}</div>
        <div>
          <div class="dsa-topic-name">${topic.name}</div>
          <div class="dsa-topic-count">${doneProblemIds} / ${total} problems</div>
        </div>
      </div>
      <div class="dsa-card-right">
        <span class="dsa-pct-badge">${pct}%</span>
        <span class="dsa-chevron">▼</span>
      </div>
    `;

    // Progress bar
    const barWrap = document.createElement("div");
    barWrap.className = "dsa-card-bar";
    const barFill = document.createElement("div");
    barFill.className = `dsa-card-bar-fill fill-${topic.color}`;
    barFill.style.width = pct + "%";
    barWrap.appendChild(barFill);

    // Problem list
    const problemList = document.createElement("div");
    problemList.className = "dsa-problem-list";

    topic.problems.forEach(problem => {
      const item = document.createElement("div");
      item.setAttribute(
  "tabindex",
  "0"
);
      item.className = "dsa-problem-item" + (dsaState[problem.id] ? " checked" : "");
      item.dataset.problemId = problem.id;

      const checkEl = document.createElement("div");
      checkEl.className = "dsa-checkbox";
      if (dsaState[problem.id]) checkEl.textContent = "✓";

      const nameEl = document.createElement("span");
      nameEl.className = "dsa-problem-name";
      nameEl.textContent = problem.name;

      const diffEl = document.createElement("span");
      diffEl.className = `diff-badge diff-${problem.diff}`;
      diffEl.textContent = problem.diff;

      item.appendChild(checkEl);
      item.appendChild(nameEl);
      item.appendChild(diffEl);

      // Toggle problem completion
      item.addEventListener("click", () => {
        const id = item.dataset.problemId;
        dsaState[id] = !dsaState[id];
        saveDSAState(dsaState);
        recordActivity();
        renderDSAGrid(); // Re-render to update all counts & badges
        refreshDashboard();
        

        // Re-open this card after re-render
        const updatedCard = document.querySelector(`.dsa-topic-card[data-topic-id="${topic.id}"]`);
        if (updatedCard) updatedCard.classList.add("open");
      });
      item.addEventListener(
  "keydown",
  e => {

    if(
      e.key === "Enter"
    ){

      item.click();

    }

  } 
);

      problemList.appendChild(item);
    });

    // Toggle card open/close
    header.addEventListener("click", () => {
      card.classList.toggle("open");
    });

    card.appendChild(header);
    card.appendChild(barWrap);
    card.appendChild(problemList);
    grid.appendChild(card);
  });

  // Update overall badge
  const overallPct = totalProblems > 0 ? Math.round((totalDone / totalProblems) * 100) : 0;
  document.getElementById("dsaOverallPct").textContent = overallPct + "%";
}

renderDSAGrid();

/* ====================================================
   STUDY PLANNER
==================================================== */

const DEFAULT_TASKS = [
  { id: "d1", text: "Revise OS concepts — Process scheduling", cat: "CS Core", done: false },
  { id: "d2", text: "Solve 3 DP problems on LeetCode", cat: "DSA", done: false },
  { id: "d3", text: "Update resume with latest project", cat: "Resume", done: false },
  { id: "d4", text: "Mock interview — 30 min behavioral round", cat: "Mock", done: false },
  { id: "d5", text: "Study DBMS — Normalization (1NF to 3NF)", cat: "CS Core", done: false },
  { id: "d6", text: "Review OOPS concepts in Java", cat: "CS Core", done: false },
];

/** Load tasks from localStorage, or return defaults */
function loadPlannerTasks() {
  try {
    const raw = localStorage.getItem("placeprep_planner");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return DEFAULT_TASKS.map(t => ({ ...t }));
}

/** Save tasks to localStorage */
function savePlannerTasks() {
  localStorage.setItem("placeprep_planner", JSON.stringify(plannerTasks));
}

let plannerTasks = loadPlannerTasks();

const taskList    = document.getElementById("taskList");
const plannerPct  = document.getElementById("plannerPct");
const plannerFill = document.getElementById("plannerFill");
const plannerEmpty = document.getElementById("plannerEmpty");
const newTaskInput = document.getElementById("newTaskInput");
const newTaskCategory = document.getElementById("newTaskCategory");
const addTaskBtn  = document.getElementById("addTaskBtn");
const resetPlanner = document.getElementById("resetPlanner");

/** Render the task list and update progress */
function renderPlanner() {
  taskList.innerHTML = "";

  const done  = plannerTasks.filter(t => t.done).length;
  const total = plannerTasks.length;

  plannerPct.textContent = `${done} / ${total} tasks done`;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  plannerFill.style.width = pct + "%";

  if (total === 0) {
    plannerEmpty.classList.remove("hidden");
    return;
  }
  plannerEmpty.classList.add("hidden");

  plannerTasks.forEach(task => {
    const item = document.createElement("div");
    item.className = "task-item" + (task.done ? " done" : "");
    item.dataset.taskId = task.id;

    const check = document.createElement("div");
    check.className = "task-check";
    if (task.done) check.textContent = "✓";

    const textEl = document.createElement("span");
    textEl.className = "task-text";
    textEl.textContent = task.text;

    const catEl = document.createElement("span");
    catEl.className = "task-cat";
    catEl.textContent = task.cat;

    const delBtn = document.createElement("button");
    delBtn.className = "task-delete";
    delBtn.title = "Delete task";
    delBtn.textContent = "×";
    delBtn.addEventListener("click", e => {
      e.stopPropagation(); // Don't toggle done when deleting
      plannerTasks = plannerTasks.filter(t => t.id !== task.id);
      savePlannerTasks();
      renderPlanner();
      refreshDashboard();
    });

    item.appendChild(check);
    item.appendChild(textEl);
    item.appendChild(catEl);
    item.appendChild(delBtn);

    // Toggle done state
    item.addEventListener("click", () => {
      task.done = !task.done;
      savePlannerTasks();
      recordActivity();
      renderPlanner();
      refreshDashboard();
    });

    taskList.appendChild(item);
  });
}

/** Add a new task from the input */
addTaskBtn.addEventListener("click", addNewTask);

newTaskInput.addEventListener("keydown", e => {
  if (e.key === "Enter") addNewTask();
});

function addNewTask() {
  const text = newTaskInput.value.trim();
  if (!text) return;

  const newTask = {
    id: "task_" + Date.now(),
    text: text,
    cat: newTaskCategory.value,
    done: false
  };

  plannerTasks.push(newTask);
  savePlannerTasks();
  renderPlanner();
  refreshDashboard();

  newTaskInput.value = "";
  newTaskInput.focus();
}

/** Reset planner — mark all tasks as not done */
resetPlanner.addEventListener("click", () => {
  plannerTasks.forEach(t => t.done = false);
  savePlannerTasks();
  renderPlanner();
  refreshDashboard();
});

renderPlanner();
refreshDashboard();

/* ====================================================
   INITIALIZATION
==================================================== */
// Start on dashboard
/* ====================================================
   LIVE DASHBOARD
==================================================== */

function refreshDashboard(){

    const resumeCard =
    document.getElementById("statResumeScore");

    const dsaCard =
    document.getElementById("statDSA");

    const taskCard =
    document.getElementById("statTasks");

    const streakCard =
    document.getElementById("statStreak");


    // ---------- DSA DATA ----------

    const dsaData = loadDSAState();

    const solved =
    Object.values(dsaData)
    .filter(value => value === true)
    .length;

    let totalDSA = 0;

    DSA_TOPICS.forEach(topic => {

        totalDSA += topic.problems.length;

    });

    if(dsaCard){

        dsaCard.textContent =
        `${solved} / ${totalDSA}`;

    }


    // ---------- PLANNER DATA ----------

    const completedTasks =
    plannerTasks.filter(task => task.done).length;

    const totalTasks =
    plannerTasks.length;

    if(taskCard){

        taskCard.textContent =
        `${completedTasks} / ${totalTasks}`;

    }


    // ---------- RESUME SCORE ----------

    const history =
    JSON.parse(
        localStorage.getItem(
            "placeprep_resume_history"
        ) || "[]"
    );

    if(history.length > 0){

        const latest =
        history[0];
        if(resumeCard){

            resumeCard.textContent =
            latest.percentage + "%";

        }

    }

    else{

        if(resumeCard){

            resumeCard.textContent =
            "--";

        }

    }


    // ---------- STREAK ----------

    const activityLog =
JSON.parse(

    localStorage.getItem(
        "placeprep_activity"
    ) || "[]"

);

const streak =
calculateStreak(activityLog);

streakCard.textContent =
`🔥 ${streak} days`;

// Re-compute readiness score whenever dashboard data changes
// Guard: updateReadinessUI is defined later in the file — safe to call
// because refreshDashboard is only invoked after full script parse.
if (typeof updateReadinessUI === "function") updateReadinessUI();

}
/* ====================================================
   RESUME HISTORY
==================================================== */

function saveAnalysisToHistory(
    data,
    filename,
    jdText
){

    const history =
    JSON.parse(

        localStorage.getItem(
            "placeprep_resume_history"
        ) || "[]"

    );


    const entry = {

        id: Date.now(),

        date:
        new Date()
        .toLocaleDateString(),

        filename: filename,

        jd_snippet:
        jdText.slice(0, 60),

        percentage:
        data.percentage,

        found_skills:
        data.found_skills || [],

        missing_skills:
        data.missing_skills || []

    };


    history.unshift(entry);


    const limitedHistory =
    history.slice(0, 10);


    localStorage.setItem(

        "placeprep_resume_history",

        JSON.stringify(limitedHistory)

    );

}
/* ====================================================
   ACTIVITY TRACKING
==================================================== */

function recordActivity(){

    const today =
    new Date()
    .toISOString()
    .split("T")[0];


    const log =
    JSON.parse(

        localStorage.getItem(
            "placeprep_activity"
        ) || "[]"

    );


    if(!log.includes(today)){

        log.push(today);

    }


    localStorage.setItem(

        "placeprep_activity",

        JSON.stringify(log)

    );

}
function calculateStreak(log){

    if(log.length === 0){

        return 0;

    }

    const dates =
    log.sort().reverse();

    let streak = 0;

    const today =
    new Date();

    for(let i = 0; i < dates.length; i++){

        const checkDate =
        new Date(dates[i]);

        const diff =
        Math.floor(

            (
                today - checkDate
            )

            /

            (1000 * 60 * 60 * 24)

        );

        if(diff === streak){

            streak++;

        }

        else{

            break;

        }

    }

    return streak;

}
showSection("dashboard");
refreshDashboard();
/* ====================================================
   PHASE 1 — USER PROFILE SYSTEM
   localStorage key: placeprep_profile
   Stores: name, branch, year, role, companies, level, college
   Exposes: getProfile(), saveProfile()
   Drives: dashboard greeting, sidebar, readiness score
==================================================== */

/* ---- Profile helpers ---- */

const PROFILE_KEY = "placeprep_profile";

const DEFAULT_PROFILE = {
  name:      "Aryan Kumar",
  branch:    "Computer Science",
  year:      "2026",
  role:      "SWE",
  companies: "Google, Amazon, Flipkart",
  level:     "intermediate",
  college:   "",
};

function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (_) {}
  return { ...DEFAULT_PROFILE };
}

function saveProfile(data) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

/* Derive initials from full name (up to 2 chars) */
function getInitials(name) {
  if (!name || !name.trim()) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ---- Greeting text based on time of day ---- */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ---- Apply profile to sidebar & dashboard ---- */
function applyProfile() {
  const p = getProfile();
  const initials = getInitials(p.name);
  const firstName = p.name.trim().split(/\s+/)[0] || "there";

  // Sidebar
  const sidebarAvatar = document.getElementById("sidebarAvatar");
  const sidebarName   = document.getElementById("sidebarName");
  const sidebarTag    = document.getElementById("sidebarTag");

  if (sidebarAvatar) sidebarAvatar.textContent = initials;
  if (sidebarName)   sidebarName.textContent   = p.name || "Student";
  if (sidebarTag)    sidebarTag.textContent     =
    `${p.year ? "Class of " + p.year : ""}${p.branch ? " · " + p.branch : ""}`.replace(/^· /, "");

  // Dashboard greeting
  const greetingEl  = document.getElementById("dashGreeting");
  const subtitleEl  = document.getElementById("dashSubtitle");

  if (greetingEl) {
    greetingEl.textContent = `${getGreeting()}, ${firstName} 👋`;
  }

  if (subtitleEl) {
    const roleMap = {
      SWE: "Software Engineer", SDE: "SDE (Product)",
      ML: "ML / AI Engineer", DS: "Data Scientist",
      DevOps: "DevOps / Cloud", "Full Stack": "Full Stack Developer", Other: "Engineer"
    };
    const roleLabel = roleMap[p.role] || "Engineer";
    subtitleEl.innerHTML = `Preparing for <strong>${roleLabel}</strong> roles.
      Here's where you stand today.`;
  }

  // Target companies chips
  const row = document.getElementById("targetCompaniesRow");
  if (row) {
    row.innerHTML = "";
    if (p.companies && p.companies.trim()) {
      const companies = p.companies.split(",").map(c => c.trim()).filter(Boolean);
      if (companies.length > 0) {
        const label = document.createElement("span");
        label.style.cssText = "font-size:0.68rem;color:var(--text3);margin-right:4px;align-self:center;white-space:nowrap;";
        label.textContent = "Targeting:";
        row.appendChild(label);
        companies.slice(0, 5).forEach(co => {
          const chip = document.createElement("span");
          chip.className = "company-chip";
          chip.textContent = co;
          row.appendChild(chip);
        });
        if (companies.length > 5) {
          const more = document.createElement("span");
          more.className = "company-chip";
          more.style.opacity = "0.6";
          more.textContent = `+${companies.length - 5} more`;
          row.appendChild(more);
        }
      }
    }
  }
}

/* ====================================================
   PLACEMENT READINESS SCORE
   Combines: DSA %, latest resume score, planner %, streak
   Weighted formula:
     DSA:     35%
     Resume:  30%
     Planner: 20%
     Streak:  15%
==================================================== */
function computeReadinessScore() {
  // DSA component
  const dsaData = loadDSAState();
  let totalDSA = 0;
  DSA_TOPICS.forEach(t => totalDSA += t.problems.length);
  const solvedDSA = Object.values(dsaData).filter(v => v === true).length;
  const dsaPct = totalDSA > 0 ? (solvedDSA / totalDSA) * 100 : 0;

  // Resume component (latest score from history)
  let resumePct = 0;
  try {
    const history = JSON.parse(localStorage.getItem("placeprep_resume_history") || "[]");
    if (history.length > 0) resumePct = history[0].percentage || 0;
  } catch (_) {}

  // Planner component (tasks completed today)
  const completedTasks = plannerTasks.filter(t => t.done).length;
  const totalTasks = plannerTasks.length;
  const plannerPctVal = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Streak component (cap at 14 days = 100%)
  const activityLog = (() => {
    try { return JSON.parse(localStorage.getItem("placeprep_activity") || "[]"); } catch (_) { return []; }
  })();
  const streak = calculateStreak(activityLog);
  const streakPct = Math.min((streak / 14) * 100, 100);

  // Weighted score
  const score = Math.round(
    dsaPct      * 0.35 +
    resumePct   * 0.30 +
    plannerPctVal * 0.20 +
    streakPct   * 0.15
  );

  return Math.min(score, 100);
}

function updateReadinessUI() {
  const score = computeReadinessScore();
  const pct   = score + "%";

  // Header badge
  const badgeScore = document.getElementById("readinessScore");
  if (badgeScore) badgeScore.textContent = pct;

  // Progress card score + bar
  const cardScore = document.getElementById("readinessCardScore");
  const barFill   = document.getElementById("readinessBarFill");
  if (cardScore) cardScore.textContent = pct;
  if (barFill)   barFill.style.width   = pct;

  return score;
}

/* ====================================================
   PROFILE MODAL — Open / Save / Cancel
==================================================== */
(function initProfileModal() {
  const backdrop     = document.getElementById("profileModalBackdrop");
  const openBtn      = document.getElementById("openProfile");
  const closeBtn     = document.getElementById("closeProfileModal");
  const cancelBtn    = document.getElementById("cancelProfileModal");
  const saveBtn      = document.getElementById("saveProfileModal");
  const modalAvatar  = document.getElementById("modalAvatar");

  // Form fields
  const fields = {
    name:      document.getElementById("profileName"),
    branch:    document.getElementById("profileBranch"),
    year:      document.getElementById("profileYear"),
    role:      document.getElementById("profileRole"),
    companies: document.getElementById("profileCompanies"),
    level:     document.getElementById("profileLevel"),
    college:   document.getElementById("profileCollege"),
  };

  function openModal() {
    const p = getProfile();
    // Populate form with current values
    Object.keys(fields).forEach(key => {
      if (fields[key] && p[key] !== undefined) {
        fields[key].value = p[key];
      }
    });
    // Update avatar preview as name changes
    if (fields.name) {
      fields.name.addEventListener("input", updateModalAvatar);
    }
    updateModalAvatar();
    if (backdrop) backdrop.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    // Focus first field for accessibility
    if (fields.name) fields.name.focus();
  }

  function updateModalAvatar() {
    if (modalAvatar && fields.name) {
      modalAvatar.textContent = getInitials(fields.name.value);
    }
  }

  function closeModal() {
    if (backdrop) backdrop.classList.add("hidden");
    document.body.style.overflow = "";
    // Remove live-update listener to avoid stacking
    if (fields.name) fields.name.removeEventListener("input", updateModalAvatar);
  }

  function saveAndClose() {
    const newProfile = {};
    Object.keys(fields).forEach(key => {
      if (fields[key]) newProfile[key] = fields[key].value.trim();
    });

    // Basic validation: name required
    if (!newProfile.name) {
      toast("Please enter your name to save the profile.", "error");
      if (fields.name) fields.name.focus();
      return;
    }

    saveProfile(newProfile);
    applyProfile();
    updateReadinessUI();
    closeModal();
    toast("Profile saved successfully!", "success");
  }

  if (openBtn)   openBtn.addEventListener("click",  openModal);
  if (openBtn)   openBtn.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(); } });
  if (closeBtn)  closeBtn.addEventListener("click",  closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  if (saveBtn)   saveBtn.addEventListener("click",   saveAndClose);

  // Close on backdrop click (outside modal box)
  if (backdrop) {
    backdrop.addEventListener("click", e => {
      if (e.target === backdrop) closeModal();
    });
  }

  // Close on Escape
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && backdrop && !backdrop.classList.contains("hidden")) {
      closeModal();
    }
  });
})();

/* ====================================================
   DARK MODE SYSTEM
   Stores theme in localStorage under "placeprep_theme"
   Applies data-theme="light" to <html> for light mode.
   Dark mode is the default (no attribute needed).
==================================================== */
(function initTheme() {
  const THEME_KEY  = "placeprep_theme";
  const toggleBtn  = document.getElementById("themeToggle");
  const themeIcon  = document.getElementById("themeIcon");
  const themeLabel = document.getElementById("themeLabel");

  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      if (themeIcon)  themeIcon.textContent  = "☾";
      if (themeLabel) themeLabel.textContent  = "Dark Mode";
    } else {
      document.documentElement.removeAttribute("data-theme");
      if (themeIcon)  themeIcon.textContent  = "☀";
      if (themeLabel) themeLabel.textContent  = "Light Mode";
    }
  }

  function toggleTheme() {
    const current  = localStorage.getItem(THEME_KEY) || "dark";
    const next     = current === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    toast(next === "light" ? "Switched to Light Mode" : "Switched to Dark Mode", "info");
  }

  // Boot: restore persisted theme
  const saved = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(saved);

  if (toggleBtn) toggleBtn.addEventListener("click", toggleTheme);
})();

/* ====================================================
   BOOT: apply profile + readiness after all systems init
==================================================== */
applyProfile();
updateReadinessUI();
/* ====================================================
   TOAST SYSTEM
==================================================== */

function toast(
    message,
    type = "info"
){

    const container =
    document.getElementById(
        "toast-container"
    );

    if(!container) return;


    // ---------- LIMIT TOAST COUNT ----------

    if(container.children.length >= 3){

        container.firstChild.remove();

    }


    const el =
    document.createElement("div");

    el.className =
    `toast ${type}`;

    el.textContent =
    message;


    container.appendChild(el);


    setTimeout(() => {

        el.remove();

    }, 3000);

}
/* ====================================================
   PDF EXPORT
==================================================== */

function exportReport(){

    if(!latestAnalysis) return;

    const { jsPDF } =
    window.jspdf;

    const doc =
    new jsPDF();

    doc.setFontSize(20);

    doc.text(
        "PlacePrep Resume Analysis",
        20,
        20
    );

    doc.setFontSize(12);

    doc.text(
        `Match Score: ${latestAnalysis.percentage}%`,
        20,
        40
    );

    doc.text(
        "Matched Skills:",
        20,
        60
    );

    let y = 70;

    latestAnalysis.found_skills
    .forEach(skill => {

        doc.text(
            `• ${skill}`,
            25,
            y
        );

        y += 8;

    });

    y += 10;

    doc.text(
        "Missing Skills:",
        20,
        y
    );

    y += 10;

    latestAnalysis.missing_skills
    .forEach(skill => {

        doc.text(
            `• ${skill}`,
            25,
            y
        );

        y += 8;

    });

    doc.save(
        "placeprep-report.pdf"
    );

}
const downloadBtn =
getEl("downloadReportBtn");

if(downloadBtn){

    downloadBtn.addEventListener(
        "click",
        exportReport
    );

}