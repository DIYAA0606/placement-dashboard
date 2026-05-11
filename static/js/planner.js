"use strict";

const PLANNER_KEY = "placeprep_planner";

const CATEGORY_ICONS = {
  "DSA": "◷",
  "CS Core": "◈",
  "Resume": "◎",
  "Mock": "◫",
  "Mock Interview": "◫",
  "Other": "◦"
};

/* =========================================
   STORAGE
========================================= */

function getPlannerTasks() {
  return Storage.get(PLANNER_KEY, []);
}

function savePlannerTasks(tasks) {
  Storage.set(PLANNER_KEY, tasks);
}

/* =========================================
   RENDER TASKS
========================================= */

function renderPlannerTasks() {

  const taskList = getEl("plannerTaskList");
  if (!taskList) return;

  const raw = getPlannerTasks();
  const TODAY = new Date().toISOString().split("T")[0];

  // ---------- MIGRATION + CARRY-FORWARD ----------
  const tasks = raw.map(t => {
    const bucket     = t.bucket ?? "someday";
    const createdDay = t.createdAt
      ? new Date(t.createdAt).toISOString().split("T")[0]
      : TODAY;
    const carriedBucket =
      bucket === "today" && !t.completed && createdDay < TODAY
        ? "week"
        : bucket;
    return {
      title:     t.title     ?? t.text ?? "Untitled Task",
      category:  t.category  ?? "Other",
      bucket:    carriedBucket,
      completed: t.completed ?? t.done ?? false,
      createdAt: t.createdAt ?? Date.now()
    };
  });

  // Persist any migrations/carry-forwards
  savePlannerTasks(tasks);

  taskList.innerHTML = "";

  const emptyEl = getEl("plannerEmpty");

  if (tasks.length === 0) {
    emptyEl?.classList.remove("hidden");
   if (typeof refreshDashboard === "function") refreshDashboard();
    return;
  }

  emptyEl?.classList.add("hidden");

  const BUCKETS = [
    { key: "today",   label: "Today",     icon: "◉" },
    { key: "week",    label: "This Week", icon: "◈" },
    { key: "someday", label: "Someday",   icon: "◦" },
  ];

  BUCKETS.forEach(({ key, label, icon }) => {
    const group = tasks.filter(t => t.bucket === key);
    if (!group.length) return;

    const header = document.createElement("div");
    header.className = "planner-bucket-header";
    header.innerHTML = `
      <span class="bucket-icon">${icon}</span>
      ${label}
      <span class="bucket-count">${group.filter(t => t.completed).length}/${group.length}</span>
    `;
    taskList.appendChild(header);

    group.forEach(task => {
      const index    = tasks.indexOf(task);
      const catIcon  = CATEGORY_ICONS[task.category] || "◦";

      const taskEl = document.createElement("div");
      taskEl.className = `planner-task ${task.completed ? "completed" : ""}`;
      taskEl.innerHTML = `
        <label class="planner-task-check-wrap" title="${task.completed ? "Mark incomplete" : "Mark complete"}">
          <input
            type="checkbox"
            class="planner-checkbox visually-hidden"
            data-index="${index}"
            ${task.completed ? "checked" : ""}
          />
          <span class="planner-check-box">${task.completed ? "✓" : ""}</span>
        </label>
        <div class="planner-task-body">
          <div class="planner-task-title">${task.title}</div>
          <span class="planner-cat-pill cat-${task.category.replace(/\s+/g, "-").toLowerCase()}">
            ${catIcon} ${task.category}
          </span>
        </div>
        <button
          class="planner-delete-btn"
          data-index="${index}"
          title="Delete task"
          aria-label="Delete task"
        >✕</button>
      `;
      taskList.appendChild(taskEl);
    });
  });

  attachPlannerEvents();
 if (typeof refreshDashboard === "function") refreshDashboard();
}

/* =========================================
   ADD TASK
========================================= */

function addPlannerTask() {
  const input    = getEl("plannerInput");
  const category = getEl("plannerCategory");

  if (!input || !category) return;

  const title = input.value.trim();

  if (!title) {
    toast("Please enter a task", "error");
    return;
  }

  const tasks = getPlannerTasks();

  tasks.unshift({
    title,
    category:  category.value,
    bucket:    getEl("plannerBucket")?.value || "today",
    completed: false,
    createdAt: Date.now()
  });

  savePlannerTasks(tasks);
  input.value = "";
  toast("Task added", "success");
  renderPlannerTasks();
}

/* =========================================
   ATTACH EVENTS
========================================= */

function attachPlannerEvents() {

  const checkboxes = qsa(".planner-checkbox");
  const deleteBtns = qsa(".planner-delete-btn");

  checkboxes.forEach(box => {

    box.addEventListener("change", () => {

      const index = Number(box.dataset.index);
      const tasks = getPlannerTasks();
      tasks[index].completed = box.checked;
      savePlannerTasks(tasks);

      // Instant visual feedback on the custom check-box span
      const checkBox = box.closest(".planner-task")?.querySelector(".planner-check-box");
      if (checkBox) checkBox.textContent = box.checked ? "✓" : "";

      if (box.checked){
    recordActivity();
    logEvent("task", `Completed: ${tasks[index].title}`);

      }

      renderPlannerTasks();
    });
  });

  deleteBtns.forEach(btn => {

    btn.addEventListener("click", () => {

      const index = Number(btn.dataset.index);
      const tasks = getPlannerTasks();
      tasks.splice(index, 1);
      savePlannerTasks(tasks);
      toast("Task deleted", "success");
      renderPlannerTasks();
    });
  });
}

/* =========================================
   STATS (used by dashboard.js)
========================================= */

function getPlannerStats() {
  const tasks     = getPlannerTasks().filter(t => t.bucket !== "someday");
  const completed = tasks.filter(t => t.completed).length;
  return {
    completed,
    total:      tasks.length,
    percentage: tasks.length ? Math.round((completed / tasks.length) * 100) : 0
  };
}

/* =========================================
   EVENT LISTENERS
========================================= */

const plannerAddBtn = getEl("plannerAddBtn");

if (plannerAddBtn) {
  plannerAddBtn.addEventListener("click", addPlannerTask);
}

// Allow Enter key to add task
const plannerInput = getEl("plannerInput");

if (plannerInput) {
  plannerInput.addEventListener("keydown", e => {
    if (e.key === "Enter") addPlannerTask();
  });
}
const resetPlannerBtn = getEl("resetPlanner");
if (resetPlannerBtn) {
  resetPlannerBtn.addEventListener("click", () => {
  const tasks = getPlannerTasks().map(t => ({
    ...t,
    completed: t.bucket === "today" ? false : t.completed
  }));
  savePlannerTasks(tasks);
  toast("Today's tasks reset", "success");
  renderPlannerTasks();
});
}