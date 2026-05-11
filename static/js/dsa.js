"use strict";

const DSA_KEY = "placeprep_dsa";
let activeDiffFilter = "all";
/* =========================================
   DEFAULT TOPIC + PROBLEM DATA
========================================= */
function applyDiffFilter() {
  qsa(".dsa-card").forEach(card => {
    const tIdx  = Number(card.dataset.index);
    const topic = getDSAState()[tIdx];
    const show  = activeDiffFilter === "all" || topic.difficulty === activeDiffFilter;
    card.style.display = show ? "" : "none";
  });
}
const DSA_TOPICS = [
  {
    title: "Arrays",
    difficulty: "Easy",
    platform: "LeetCode",
    expanded: false,
    problems: [
      { name: "Two Sum",                          url: "https://leetcode.com/problems/two-sum/",                              completed: false },
      { name: "Best Time to Buy and Sell Stock",  url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",     completed: false },
      { name: "Contains Duplicate",               url: "https://leetcode.com/problems/contains-duplicate/",                  completed: false },
      { name: "Product of Array Except Self",     url: "https://leetcode.com/problems/product-of-array-except-self/",        completed: false },
      { name: "Maximum Subarray",                 url: "https://leetcode.com/problems/maximum-subarray/",                    completed: false },
      { name: "Maximum Product Subarray",         url: "https://leetcode.com/problems/maximum-product-subarray/",            completed: false },
      { name: "Find Minimum in Rotated Array",    url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",completed: false },
      { name: "Search in Rotated Sorted Array",   url: "https://leetcode.com/problems/search-in-rotated-sorted-array/",      completed: false },
      { name: "3Sum",                             url: "https://leetcode.com/problems/3sum/",                                 completed: false },
      { name: "Container With Most Water",        url: "https://leetcode.com/problems/container-with-most-water/",           completed: false }
    ]
  },
  {
    title: "Strings",
    difficulty: "Easy",
    platform: "LeetCode",
    expanded: false,
    problems: [
      { name: "Valid Anagram",                    url: "https://leetcode.com/problems/valid-anagram/",                       completed: false },
      { name: "Valid Palindrome",                 url: "https://leetcode.com/problems/valid-palindrome/",                    completed: false },
      { name: "Longest Substring Without Repeating", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", completed: false },
      { name: "Longest Repeating Character Replacement", url: "https://leetcode.com/problems/longest-repeating-character-replacement/", completed: false },
      { name: "Group Anagrams",                   url: "https://leetcode.com/problems/group-anagrams/",                     completed: false },
      { name: "Encode and Decode Strings",        url: "https://leetcode.com/problems/encode-and-decode-strings/",          completed: false },
      { name: "Minimum Window Substring",         url: "https://leetcode.com/problems/minimum-window-substring/",           completed: false },
      { name: "Palindromic Substrings",           url: "https://leetcode.com/problems/palindromic-substrings/",             completed: false }
    ]
  },
  {
    title: "Linked List",
    difficulty: "Medium",
    platform: "LeetCode",
    expanded: false,
    problems: [
      { name: "Reverse a Linked List",            url: "https://leetcode.com/problems/reverse-linked-list/",                completed: false },
      { name: "Detect Cycle in Linked List",      url: "https://leetcode.com/problems/linked-list-cycle/",                  completed: false },
      { name: "Merge Two Sorted Lists",           url: "https://leetcode.com/problems/merge-two-sorted-lists/",             completed: false },
      { name: "Merge K Sorted Lists",             url: "https://leetcode.com/problems/merge-k-sorted-lists/",              completed: false },
      { name: "Remove Nth Node From End",         url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/",  completed: false },
      { name: "Reorder List",                     url: "https://leetcode.com/problems/reorder-list/",                      completed: false },
      { name: "Find the Duplicate Number",        url: "https://leetcode.com/problems/find-the-duplicate-number/",         completed: false }
    ]
  },
  {
    title: "Trees",
    difficulty: "Medium",
    platform: "LeetCode",
    expanded: false,
    problems: [
      { name: "Invert Binary Tree",               url: "https://leetcode.com/problems/invert-binary-tree/",                completed: false },
      { name: "Maximum Depth of Binary Tree",     url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",     completed: false },
      { name: "Same Tree",                        url: "https://leetcode.com/problems/same-tree/",                         completed: false },
      { name: "Subtree of Another Tree",          url: "https://leetcode.com/problems/subtree-of-another-tree/",          completed: false },
      { name: "Lowest Common Ancestor of BST",    url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", completed: false },
      { name: "Binary Tree Level Order Traversal",url: "https://leetcode.com/problems/binary-tree-level-order-traversal/",completed: false },
      { name: "Validate Binary Search Tree",      url: "https://leetcode.com/problems/validate-binary-search-tree/",      completed: false },
      { name: "Kth Smallest in BST",              url: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/",    completed: false },
      { name: "Construct Tree from Pre/Inorder",  url: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/", completed: false },
      { name: "Binary Tree Maximum Path Sum",     url: "https://leetcode.com/problems/binary-tree-maximum-path-sum/",     completed: false },
      { name: "Serialize and Deserialize Tree",   url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", completed: false },
      { name: "Word Search II",                   url: "https://leetcode.com/problems/word-search-ii/",                   completed: false }
    ]
  },
  {
    title: "Graphs",
    difficulty: "Hard",
    platform: "LeetCode",
    expanded: false,
    problems: [
      { name: "Number of Islands",                url: "https://leetcode.com/problems/number-of-islands/",                 completed: false },
      { name: "Clone Graph",                      url: "https://leetcode.com/problems/clone-graph/",                       completed: false },
      { name: "Pacific Atlantic Water Flow",      url: "https://leetcode.com/problems/pacific-atlantic-water-flow/",       completed: false },
      { name: "Course Schedule",                  url: "https://leetcode.com/problems/course-schedule/",                   completed: false },
      { name: "Course Schedule II",               url: "https://leetcode.com/problems/course-schedule-ii/",               completed: false },
      { name: "Number of Connected Components",   url: "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/", completed: false },
      { name: "Graph Valid Tree",                 url: "https://leetcode.com/problems/graph-valid-tree/",                  completed: false },
      { name: "Longest Consecutive Sequence",     url: "https://leetcode.com/problems/longest-consecutive-sequence/",     completed: false },
      { name: "Word Ladder",                      url: "https://leetcode.com/problems/word-ladder/",                       completed: false },
      { name: "Alien Dictionary",                 url: "https://leetcode.com/problems/alien-dictionary/",                  completed: false }
    ]
  }
];

/* =========================================
   STORAGE
========================================= */

function getDSAState() {

  const saved = Storage.get(DSA_KEY, null);

  // ---------- MIGRATION: old format had solved/total numbers ----------
  if (saved && Array.isArray(saved)) {

    // If first item has no problems array → old format, discard and use defaults
    if (saved.length && !saved[0].problems) {
      return DSA_TOPICS;
    }

    return saved;
  }

  return DSA_TOPICS;
}

function saveDSAState(data) {
  Storage.set(DSA_KEY, data);
}

/* =========================================
   DERIVED PROGRESS PER TOPIC
========================================= */

function topicProgress(topic) {
  const total     = topic.problems.length;
  const solved    = topic.problems.filter(p => p.completed).length;
  const pct       = total ? Math.round((solved / total) * 100) : 0;
  return { total, solved, pct };
}

/* =========================================
   DIFFICULTY BADGE
========================================= */

const DIFF_CLASS = {
  "Easy":   "diff-easy",
  "Medium": "diff-medium",
  "Hard":   "diff-hard"
};

/* =========================================
   RENDER GRID
========================================= */

function renderDSAGrid() {

  const container = getEl("dsaGrid");
  if (!container) return;

  const topics = getDSAState();
  container.innerHTML = "";

  topics.forEach((topic, tIdx) => {

    const { total, solved, pct } = topicProgress(topic);
     const lastSolved = topic.problems
    .filter(p => p.completed && p.solvedAt)
    .sort((a, b) => b.solvedAt - a.solvedAt)[0];

  const lastSolvedStr = lastSolved
    ? `Last solved ${timeAgo(new Date(lastSolved.solvedAt).toISOString())}`
    : "";
    const card = document.createElement("div");
    card.className = "dsa-card" + (topic.expanded ? " expanded" : "");
    card.dataset.index = tIdx;

    card.innerHTML = `
      <div class="dsa-card-top" data-toggle="${tIdx}">

        <div class="dsa-card-top-left">
          <div class="dsa-title">
  ${topic.title}
  ${getRecommendedTopics().includes(topic.title)
    ? '<span class="dsa-rec-badge">★ Recommended</span>'
    : ""}
  ${pct < 30 && total > 0
    ? '<span class="dsa-weak-badge">⚠ Weak</span>'
    : ""}
</div>
          <div class="dsa-meta">
            <span class="dsa-platform">${topic.platform}</span>
            <span class="dsa-diff-badge ${DIFF_CLASS[topic.difficulty] || ""}">${topic.difficulty}</span>
          </div>
        </div>

        <div class="dsa-card-top-right">
          <div class="dsa-score">
            <span class="dsa-score-done">${solved}</span>
            <span class="dsa-score-sep">/</span>
            <span class="dsa-score-total">${total}</span>
          </div>
          <span class="dsa-chevron">${topic.expanded ? "▲" : "▼"}</span>
        </div>

      </div>

      <div class="dsa-progress-track">
        <div class="dsa-progress-fill" style="width:${pct}%"></div>
      </div>
      ${lastSolvedStr ? `<div class="dsa-last-solved">${lastSolvedStr}</div>` : ""}
    
      <div class="dsa-problem-list ${topic.expanded ? "open" : ""}">
        ${topic.problems.map((problem, pIdx) => `
          <div class="dsa-problem-row ${problem.completed ? "prob-done" : ""}" data-topic="${tIdx}" data-problem="${pIdx}">

            <label class="dsa-prob-check-wrap">
              <input
                type="checkbox"
                class="dsa-prob-checkbox visually-hidden"
                data-topic="${tIdx}"
                data-problem="${pIdx}"
                ${problem.completed ? "checked" : ""}
              />
              <span class="dsa-prob-check-box">${problem.completed ? "✓" : ""}</span>
            </label>

            <a
              href="${problem.url}"
              target="_blank"
              rel="noopener noreferrer"
              class="dsa-prob-name"
              title="Open on ${topic.platform}"
            >${problem.name}</a>

            <span class="dsa-prob-arrow">↗</span>

          </div>
        `).join("")}
      </div>
    `;
    // Get last solved date for this topic

    container.appendChild(card);
  });

  attachDSAEvents();
  applyDiffFilter();
  if (typeof refreshDashboard === "function") refreshDashboard();
}

/* =========================================
   ATTACH EVENTS
========================================= */

function attachDSAEvents() {

  // ---------- EXPAND / COLLAPSE ----------
  qsa(".dsa-card-top").forEach(header => {
  header.addEventListener("click", () => {
    const tIdx   = Number(header.dataset.toggle);
    const topics = getDSAState();
    topics[tIdx].expanded = !topics[tIdx].expanded;
    saveDSAState(topics);

    // Toggle in-place — no full re-render
    const card    = header.closest(".dsa-card");
    const list    = card?.querySelector(".dsa-problem-list");
    const chevron = card?.querySelector(".dsa-chevron");
    const isOpen  = topics[tIdx].expanded;

    card?.classList.toggle("expanded", isOpen);
    list?.classList.toggle("open", isOpen);
    if (chevron) chevron.textContent = isOpen ? "▲" : "▼";
  });
});

  // ---------- PROBLEM CHECKBOXES ----------
  qsa(".dsa-prob-checkbox").forEach(box => {

    box.addEventListener("change", () => {

      const tIdx   = Number(box.dataset.topic);
      const pIdx   = Number(box.dataset.problem);
      const topics = getDSAState();

      ttopics[tIdx].problems[pIdx].completed = box.checked;
if (box.checked) topics[tIdx].problems[pIdx].solvedAt = Date.now();
else             delete topics[tIdx].problems[pIdx].solvedAt;

      saveDSAState(topics);

      if (box.checked){ recordActivity();
        logEvent("dsa", `Solved: ${topics[tIdx].problems[pIdx].name}`);}

      // Instant visual feedback — update card in-place without full re-render
      const row      = box.closest(".dsa-problem-row");
      const checkBox = box.closest(".dsa-prob-check-wrap")?.querySelector(".dsa-prob-check-box");

      if (row) row.classList.toggle("prob-done", box.checked);
      if (checkBox) checkBox.textContent = box.checked ? "✓" : "";

      // Update score + progress bar on the card
      const card   = box.closest(".dsa-card");
      const { total, solved, pct } = topicProgress(topics[tIdx]);
      

      const scoreEl = card?.querySelector(".dsa-score-done");
      const barEl   = card?.querySelector(".dsa-progress-fill");

      if (scoreEl) scoreEl.textContent = solved;
      if (barEl)   barEl.style.width   = `${pct}%`;

      if (typeof refreshDashboard === "function") refreshDashboard();
    });
  });
}

/* =========================================
   getDSAProgress — used by dashboard.js
========================================= */

function getDSAProgress() {

  const topics = getDSAState();

  let solved = 0;
  let total  = 0;

  topics.forEach(topic => {
    const p  = topicProgress(topic);
    solved  += p.solved;
    total   += p.total;
  });

  return {
    solved,
    total,
    percentage: total ? Math.round((solved / total) * 100) : 0
  };
}
qsa(".dsa-filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    qsa(".dsa-filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeDiffFilter = btn.dataset.filter;
    applyDiffFilter();
  });
});
const COMPANY_DSA_FOCUS = {
  google:    ["Graphs", "Trees", "Dynamic Programming"],
  amazon:    ["Arrays", "Strings", "Trees"],
  microsoft: ["Linked List", "Trees", "Strings"],
  tcs:       ["Arrays", "Strings"],
  general:   [],
};

function getRecommendedTopics() {
  const mode = Storage.get("placeprep_prep_mode", "general");
  return COMPANY_DSA_FOCUS[mode] || [];
}