"use strict";

const WEEKLY_KEY = "placeprep_weekly_goal";

const WEEKLY_DEFAULTS = {
  dsaTarget:    10,
  atsTarget:    60,
  tasksTarget:  15,
};

function getWeeklyGoal() {
  return Storage.get(WEEKLY_KEY, WEEKLY_DEFAULTS);
}

function renderWeeklyProgress() {
  const el = getEl("weeklyGoalBlock");
  if (!el) return;

  const goals  = getWeeklyGoal();
  const dsa    = typeof getDSAProgress   === "function" ? getDSAProgress()   : { solved: 0 };
  const resume = typeof getAnalysisHistory === "function" ? getAnalysisHistory() : [];
  const tasks  = typeof getPlannerStats  === "function" ? getPlannerStats()  : { completed: 0 };
    // Add at top of renderWeeklyProgress after goals/dsa/resume/tasks are computed:
const hasAnyData = dsa.solved > 0 || tasks.completed > 0 || atsPct > 0;

if (!hasAnyData) {
  el.innerHTML = `
    <div class="weekly-header">
      <span class="weekly-title">Weekly Goals</span>
    </div>
    <div class="weekly-empty">Complete tasks, solve DSA problems, or analyze your resume to see progress here.</div>
  `;
  return;
}
  const atsPct   = resume.length ? resume[0].percentage : 0;
  const dsaPct   = Math.min(100, Math.round((dsa.solved   / goals.dsaTarget)  * 100));
  const taskPct  = Math.min(100, Math.round((tasks.completed / goals.tasksTarget) * 100));
  const resumePct = Math.min(100, Math.round((atsPct / goals.atsTarget) * 100));

  el.innerHTML = `
    <div class="weekly-header">
      <span class="weekly-title">Weekly Goals</span>
      <span class="weekly-sub">Reset every Monday</span>
    </div>
    <div class="weekly-row">
      <span class="weekly-label">DSA Problems</span>
      <div class="weekly-track"><div class="weekly-fill blue" style="width:${dsaPct}%"></div></div>
      <span class="weekly-val">${dsa.solved} / ${goals.dsaTarget}</span>
    </div>
    <div class="weekly-row">
      <span class="weekly-label">ATS Score Target</span>
      <div class="weekly-track"><div class="weekly-fill green" style="width:${resumePct}%"></div></div>
      <span class="weekly-val">${atsPct}% / ${goals.atsTarget}%</span>
    </div>
    <div class="weekly-row">
      <span class="weekly-label">Tasks Completed</span>
      <div class="weekly-track"><div class="weekly-fill purple" style="width:${taskPct}%"></div></div>
      <span class="weekly-val">${tasks.completed} / ${goals.tasksTarget}</span>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", renderWeeklyProgress);