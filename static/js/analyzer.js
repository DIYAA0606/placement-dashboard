"use strict";

const ANALYSIS_HISTORY_KEY = "placeprep_resume_history";

let latestAnalysisData = null;

/* =========================================
   HISTORY STORAGE
========================================= */

function getAnalysisHistory() {

  return Storage.get(
    ANALYSIS_HISTORY_KEY,
    []
  );
}

function saveAnalysisHistory(history) {

  Storage.set(
    ANALYSIS_HISTORY_KEY,
    history
  );
}

/* =========================================
   ANALYZE RESUME
========================================= */

async function analyzeResume() {

  const fileInput =
    getEl("resumeFile");

  const jdInput =
    getEl("jobDescription");

  if (!fileInput || !jdInput) return;

  const file =
    fileInput.files[0];

  const jd =
    jdInput.value.trim();

  // ---------- VALIDATION ----------

  if (!file) {

    toast(
      "Please upload a PDF resume",
      "error"
    );

    return;
  }

  if (!jd) {

    toast(
      "Please paste a job description",
      "error"
    );

    return;
  }

  // ---------- FORM DATA ----------

  const formData = new FormData();

  formData.append(
    "resume",
    file
  );

  formData.append(
    "job_description",
    jd
  );

  try {

    const analyzeBtn =
      getEl("analyzeBtn");

    if (analyzeBtn) {

      analyzeBtn.disabled = true;

      analyzeBtn.textContent =
        "Analyzing...";
    }
    getEl("resultsEmpty")
?.classList.add("hidden");

getEl("resultsLoading")
?.classList.remove("hidden");

getEl("resultsContent")
?.classList.add("hidden");
    // ---------- API CALL ----------

    const response =
      await fetch("/analyze", {

        method: "POST",

        body: formData
      });

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Analysis failed"
      );
    }

    // ---------- STORE LATEST ----------

    latestAnalysisData = {

      ...data,

      filename: file.name,

      date:
        new Date().toLocaleString()
    };

    // ---------- UI ----------

    renderAnalysisResults(
      latestAnalysisData
    );

    saveAnalysisToHistory(
      latestAnalysisData
    );

    renderAnalysisHistory();

    if (typeof refreshDashboard === "function") refreshDashboard();
if (typeof recordActivity === "function") recordActivity();

    toast(
      "Resume analyzed successfully",
      "success"
    );

  }

  catch (err) {

    console.error(err);

    toast(
      err.message ||
      "Something went wrong",
      "error"
    );
    if (typeof logEvent === "function" && latestAnalysisData) {
  logEvent("resume", `Resume scored ${latestAnalysisData.percentage}% — ${latestAnalysisData.filename}`);
}
  }

  finally {

  getEl("resultsLoading")
    ?.classList.add("hidden");

  const analyzeBtn =
    getEl("analyzeBtn");

  if (analyzeBtn) {

    analyzeBtn.disabled = false;

    analyzeBtn.textContent =
      "Analyze Resume";
  }
}
}

/* =========================================
   RENDER RESULTS
========================================= */


/* =========================================
   SAVE HISTORY
========================================= */

function saveAnalysisToHistory(data) {

  const history =
    getAnalysisHistory();

  history.unshift({

    id: Date.now(),

    percentage:
      data.percentage,

    filename:
      data.filename,

    date:
      data.date,

    found_skills:
      data.found_skills,

    missing_skills:
      data.missing_skills,

    suggestions:
      data.suggestions
  });

  // ---------- KEEP ONLY LAST 10 ----------

  const trimmed =
    history.slice(0, 10);

  saveAnalysisHistory(
    trimmed
  );
}

/* =========================================
   RENDER HISTORY
========================================= */

function renderAnalysisResults(data) {

  const emptyState =
    getEl("resultsEmpty");

  const loadingState =
    getEl("resultsLoading");

  const contentState =
    getEl("resultsContent");

  // ---------- STATES ----------

  emptyState?.classList.add("hidden");

  loadingState?.classList.add("hidden");

  contentState?.classList.remove("hidden");

  // ---------- SCORE ----------

  const ringPct =
    getEl("ringPct");

  const ringFill =
    getEl("ringFill");

  if (ringPct) {

    ringPct.textContent =
      `${data.percentage}%`;
  }

  if (ringFill) {

    const circumference =
      351.86;

    const offset =
      circumference -
      (
        data.percentage / 100
      ) * circumference;

    ringFill.style.strokeDashoffset =
      offset;
  }

  // ---------- FOUND SKILLS ----------

  const foundSkills =
    getEl("foundSkills");

  if (foundSkills) {

    foundSkills.innerHTML =
      data.found_skills
      .map(skill => `
        <span class="skill-chip found">
          ${skill}
        </span>
      `)
      .join("");
  }

  // ---------- MISSING SKILLS ----------

  const missingSkills =
    getEl("missingSkills");

  if (missingSkills) {

    missingSkills.innerHTML =
      data.missing_skills
      .map(skill => `
        <span class="skill-chip missing">
          ${skill}
        </span>
      `)
      .join("");
  }

  // ---------- SUGGESTIONS ----------

  const suggestionsList =
    getEl("suggestionsList");

  if (suggestionsList) {

    suggestionsList.innerHTML =
      data.suggestions
      .map(item => `
        <li>${item}</li>
      `)
      .join("");
  }

  // ---------- SHOW EXPORT BUTTON ----------

  const exportBtn =
    getEl("exportReportBtn");

  exportBtn?.classList.remove(
    "hidden"
  );
}

/* =========================================
   EXPORT PDF REPORT
========================================= */

function exportReport() {

  if (!latestAnalysisData) {

    toast(
      "No analysis available",
      "error"
    );

    return;
  }

  const { jsPDF } =
    window.jspdf;

  const doc =
    new jsPDF();

  let y = 20;

  doc.setFontSize(18);

  doc.text(
    "PlacePrep Resume Analysis",
    20,
    y
  );

  y += 15;

  doc.setFontSize(12);

  doc.text(
    `Score: ${latestAnalysisData.percentage}%`,
    20,
    y
  );

  y += 10;

  doc.text(
    `File: ${latestAnalysisData.filename}`,
    20,
    y
  );

  y += 15;

  doc.text(
    "Matched Skills:",
    20,
    y
  );

  y += 10;

  latestAnalysisData
    .found_skills
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

  latestAnalysisData
    .missing_skills
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
    "Suggestions:",
    20,
    y
  );

  y += 10;

  latestAnalysisData
    .suggestions
    .forEach(item => {

      doc.text(
        `• ${item}`,
        25,
        y
      );

      y += 8;
    });

  doc.save(
    "placeprep-report.pdf"
  );

  toast(
    "Report downloaded",
    "success"
  );
}
function renderAnalysisHistory() {

  const container = getEl("analysisHistory");
  if (!container) return;

  const history = getAnalysisHistory();

  if (!history.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="history-header">Past Analyses</div>
    ${history.map(item => `
      <div class="history-card">
        <div class="history-card-left">
          <span class="history-icon">◎</span>
          <div class="history-info">
            <div class="history-filename">${item.filename}</div>
            <div class="history-date">${item.date}</div>
          </div>
        </div>
        <span class="history-badge ${item.percentage >= 70 ? "badge-green" : item.percentage >= 40 ? "badge-amber" : "badge-red"}">
          ${item.percentage}%
        </span>
      </div>
    `).join("")}
  `;
}
/* =========================================
   EVENT LISTENERS
========================================= */

const analyzeBtn =
  getEl("analyzeBtn");

if (analyzeBtn) {

  analyzeBtn.addEventListener(
    "click",
    analyzeResume
  );
}

const exportBtn =
  getEl("exportReportBtn");

if (exportBtn) {

  exportBtn.addEventListener(
    "click",
    exportReport
  );
}

// document.addEventListener(
//   "DOMContentLoaded",
//   renderAnalysisHistory
// );
// DROP ZONE CLICK
const dropZone = getEl("dropZone");
const resumeFile = getEl("resumeFile");

if (dropZone && resumeFile) {

  dropZone.addEventListener("click", () => {
    resumeFile.click();
  });

  resumeFile.addEventListener("change", () => {
    const file = resumeFile.files[0];
    const status = getEl("fileStatus");
    if (status && file) {
      status.textContent = `✓ ${file.name}`;
    }
  });

  // Drag and drop
  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      // Assign to the hidden input via DataTransfer
      const dt = new DataTransfer();
      dt.items.add(file);
      resumeFile.files = dt.files;
      const status = getEl("fileStatus");
      if (status) status.textContent = `✓ ${file.name}`;
    } else {
      toast("Please drop a PDF file", "error");
    }
  });
}