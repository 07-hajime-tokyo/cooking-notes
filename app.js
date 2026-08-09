/* 料理メモ：タブ切替・検索・フィルタ・開閉状態の復元 */

const STORE_KEY = "kitchen-notes.v1";

const defaultState = {
  tab: "recipes",
  query: "",
  genre: "all",
  tool: "all",
  category: "all",
  foodState: "all",
  open: { "shoyu-koji": true },
  details: {},
};

const state = loadState();

const el = {
  tabs: [...document.querySelectorAll('[role="tab"]')],
  panels: [...document.querySelectorAll("[data-panel]")],
  search: document.querySelector("#searchInput"),
  genreChips: document.querySelector("#genreChips"),
  recipeList: document.querySelector("#recipeList"),
  expandAll: document.querySelector("#expandAll"),
  toolFilter: document.querySelector("#toolFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  stateFilter: document.querySelector("#stateFilter"),
  foodGrid: document.querySelector("#foodGrid"),
  foodTemplate: document.querySelector("#foodCardTemplate"),
};

/* --- 保存 -------------------------------------------------------- */

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...defaultState };
    const saved = JSON.parse(raw);
    return {
      ...defaultState,
      ...saved,
      open: { ...defaultState.open, ...(saved.open || {}) },
      details: { ...(saved.details || {}) },
    };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* プライベートモード等では保存しない */
  }
}

/* --- 文字列 ------------------------------------------------------ */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCount(n, unit = "件") {
  return `${n}${unit}`;
}

function haystack(parts) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

/* --- 絞り込み ---------------------------------------------------- */

function recipeText(recipe) {
  return haystack([
    recipe.name,
    recipe.reading,
    recipe.genre,
    recipe.tool,
    recipe.lead,
    recipe.uses,
    recipe.doneCheck,
    recipe.source?.label,
    recipe.source?.via,
    ...recipe.specs.map((s) => `${s.label} ${s.value}`),
    ...recipe.ingredients.map((i) => `${i.item} ${i.amount} ${i.note ?? ""}`),
    ...recipe.steps.map((s) => `${s.title} ${s.body} ${s.meta ?? ""}`),
    ...(recipe.points ?? []).map((p) => `${p.title} ${p.body}`),
    ...(recipe.variants ?? []).map((v) => `${v.title} ${v.body}`),
  ]);
}

function foodText(food) {
  return haystack([
    food.name,
    food.tool,
    food.category,
    food.state,
    food.temp,
    food.time,
    food.turn,
    food.finish,
    food.tip,
  ]);
}

function query() {
  return state.query.trim().toLowerCase();
}

function filteredRecipes() {
  const q = query();
  return recipes.filter((recipe) => {
    if (state.genre !== "all" && recipe.genre !== state.genre) return false;
    return !q || recipeText(recipe).includes(q);
  });
}

function filteredFoods() {
  const q = query();
  return quickTable.filter((food) => {
    if (state.tool !== "all" && food.tool !== state.tool) return false;
    if (state.category !== "all" && food.category !== state.category) return false;
    if (state.foodState !== "all" && food.state !== state.foodState) return false;
    return !q || foodText(food).includes(q);
  });
}

/* --- レシピ描画 --------------------------------------------------- */

function recipeCard(recipe) {
  const specs = recipe.specs
    .map(
      (spec) => `
        <div class="spec">
          <span>${escapeHtml(spec.label)}</span>
          <strong>${escapeHtml(spec.value)}</strong>
        </div>`,
    )
    .join("");

  const digest = recipe.specs.map((spec) => spec.value).join(" / ");

  const ingredients = recipe.ingredients
    .map(
      (row) => `
        <li>
          <span class="ing-name">${escapeHtml(row.item)}</span>
          <span class="ing-amount">${escapeHtml(row.amount)}</span>
          ${row.note ? `<span class="ing-note">${escapeHtml(row.note)}</span>` : ""}
        </li>`,
    )
    .join("");

  const steps = recipe.steps
    .map(
      (step, index) => `
        <li>
          <div class="step-head">
            <span class="step-no">${index + 1}</span>
            <h4>${escapeHtml(step.title)}</h4>
            ${step.meta ? `<span class="step-meta">${escapeHtml(step.meta)}</span>` : ""}
          </div>
          <p>${escapeHtml(step.body)}</p>
        </li>`,
    )
    .join("");

  const points = (recipe.points ?? [])
    .map(
      (point) => `
        <li>
          <strong>${escapeHtml(point.title)}</strong>
          <span>${escapeHtml(point.body)}</span>
        </li>`,
    )
    .join("");

  const variants = (recipe.variants ?? [])
    .map(
      (variant) => `
        <li>
          <strong>${escapeHtml(variant.title)}</strong>
          <span>${escapeHtml(variant.body)}</span>
        </li>`,
    )
    .join("");

  const source = sourceLine(recipe.source);

  return `
    <details class="recipe" data-recipe="${escapeHtml(recipe.id)}"${state.open[recipe.id] ? " open" : ""}>
      <summary>
        <div class="recipe-title">
          <p class="card-kicker">${escapeHtml(recipe.genre)} ・ ${escapeHtml(recipe.tool)}</p>
          <h3>${escapeHtml(recipe.name)}</h3>
          <p class="recipe-lead">${escapeHtml(recipe.lead)}</p>
        </div>
        <div class="recipe-digest">
          <span class="digest">${escapeHtml(digest)}</span>
          <span class="digest">材料${formatCount(recipe.ingredients.length, "点")} ・ ${formatCount(
            recipe.steps.length,
            "手順",
          )}</span>
        </div>
      </summary>

      <div class="recipe-body">
        <div class="spec-row">${specs}</div>

        <div class="recipe-cols">
          <div class="col-side">
            <section class="block">
              <h4 class="block-title">材料</h4>
              <ul class="ingredients">${ingredients}</ul>
              ${recipe.ingredientNote ? `<p class="note-line">${escapeHtml(recipe.ingredientNote)}</p>` : ""}
            </section>

            ${
              recipe.uses
                ? `<section class="block">
                     <h4 class="block-title">使い道</h4>
                     <p class="block-text">${escapeHtml(recipe.uses)}</p>
                   </section>`
                : ""
            }
          </div>

          <div class="col-main">
            <section class="block">
              <h4 class="block-title">手順</h4>
              <ol class="steps">${steps}</ol>
              ${
                recipe.doneCheck
                  ? `<p class="done-check"><strong>完成の目安</strong>${escapeHtml(recipe.doneCheck)}</p>`
                  : ""
              }
            </section>

            ${
              points
                ? `<section class="block">
                     <h4 class="block-title">押さえるポイント</h4>
                     <ul class="bullets">${points}</ul>
                   </section>`
                : ""
            }

            ${
              variants
                ? `<section class="block">
                     <h4 class="block-title">別のやり方</h4>
                     <ul class="bullets soft">${variants}</ul>
                   </section>`
                : ""
            }
          </div>
        </div>

        ${source}
      </div>
    </details>`;
}

/* 出典。http/https以外のURLはリンクにしない。 */
function sourceLine(source) {
  if (!source?.label) return "";

  const safe = /^https?:\/\//i.test(source.url ?? "") ? source.url : "";
  const label = escapeHtml(source.label);
  const body = safe
    ? `<a href="${escapeHtml(safe)}" target="_blank" rel="noreferrer">${label}</a>`
    : label;
  const via = source.via ? ` ／ ${escapeHtml(source.via)}` : "";

  return `<p class="source-line"><span>出典</span>${body}${via}</p>`;
}

function renderRecipes() {
  const list = filteredRecipes();
  el.recipeList.innerHTML = list.map(recipeCard).join("");

  el.recipeList.querySelectorAll("[data-recipe]").forEach((node) => {
    node.addEventListener("toggle", () => {
      state.open[node.dataset.recipe] = node.open;
      saveState();
      syncExpandLabel();
    });
  });

  setCount("recipes", list.length);
  setEmpty("recipes", list.length === 0);
  syncExpandLabel();
}

function renderGenreChips() {
  const genres = ["all", ...new Set(recipes.map((recipe) => recipe.genre))];
  el.genreChips.innerHTML = genres
    .map((genre) => {
      const label = genre === "all" ? "すべて" : genre;
      const active = state.genre === genre ? " is-active" : "";
      return `<button type="button" class="chip${active}" data-genre="${escapeHtml(genre)}" aria-pressed="${
        state.genre === genre
      }">${escapeHtml(label)}</button>`;
    })
    .join("");

  el.genreChips.querySelectorAll("[data-genre]").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.genre = chip.dataset.genre;
      saveState();
      renderGenreChips();
      renderRecipes();
    });
  });
}

function syncExpandLabel() {
  const cards = [...el.recipeList.querySelectorAll("details.recipe")];
  const allOpen = cards.length > 0 && cards.every((card) => card.open);
  el.expandAll.textContent = allOpen ? "全部閉じる" : "全部開く";
  el.expandAll.disabled = cards.length === 0;
}

function toggleAllRecipes() {
  const cards = [...el.recipeList.querySelectorAll("details.recipe")];
  if (cards.length === 0) return;
  const open = !cards.every((card) => card.open);
  cards.forEach((card) => {
    card.open = open;
    state.open[card.dataset.recipe] = open;
  });
  saveState();
  syncExpandLabel();
}

/* --- 早見表描画 --------------------------------------------------- */

function renderTable() {
  const list = filteredFoods();
  el.foodGrid.replaceChildren();

  list.forEach((food) => {
    const node = el.foodTemplate.content.cloneNode(true);
    node.querySelector(".card-kicker").textContent = `${food.tool} ・ ${food.category}`;
    node.querySelector("h3").textContent = food.name;

    const statePill = node.querySelector(".state-pill");
    statePill.textContent = food.state;
    if (food.state === "冷凍") statePill.classList.add("frozen");

    node.querySelector(".temp").textContent = food.temp;
    node.querySelector(".time").textContent = food.time;
    node.querySelector(".turn").textContent = food.turn;
    node.querySelector(".finish").textContent = food.finish;
    node.querySelector(".tip").textContent = food.tip;
    el.foodGrid.appendChild(node);
  });

  setCount("table", list.length);
  setEmpty("table", list.length === 0);
}

function fillSelect(select, values, prefix, current) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = `${prefix}${value}`;
    select.appendChild(option);
  });
  select.value = [...select.options].some((option) => option.value === current) ? current : "all";
}

/* --- 共通表示 ---------------------------------------------------- */

function setCount(tab, count) {
  document.querySelector(`[data-count="${tab}"]`).textContent = count;
  document.querySelector(`[data-result="${tab}"]`).textContent = formatCount(count);
}

function setEmpty(tab, isEmpty) {
  const node = document.querySelector(`[data-empty="${tab}"]`);
  node.hidden = !isEmpty;
  if (!isEmpty) return;

  const other = tab === "recipes" ? "table" : "recipes";
  const otherCount = other === "recipes" ? filteredRecipes().length : filteredFoods().length;
  const otherLabel = other === "recipes" ? "レシピ" : "加熱早見表";
  node.textContent =
    otherCount > 0
      ? `該当なし。${otherLabel}に${formatCount(otherCount)}あります。`
      : "該当なし。検索語やフィルタを緩めてください。";
}

function setTab(tab) {
  state.tab = tab;
  saveState();

  el.tabs.forEach((button) => {
    button.setAttribute("aria-selected", String(button.dataset.tab === tab));
  });
  el.panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== tab;
  });
}

function renderAll() {
  renderRecipes();
  renderTable();
}

/* --- details の開閉保存 ------------------------------------------- */

function wireStoredDetails() {
  document.querySelectorAll("details[data-store]").forEach((node) => {
    const key = node.dataset.store;
    if (state.details[key]) node.open = true;
    node.addEventListener("toggle", () => {
      state.details[key] = node.open;
      saveState();
    });
  });
}

/* --- キーボード --------------------------------------------------- */

function isTyping(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function onKeydown(event) {
  if (event.key === "Escape" && event.target === el.search) {
    el.search.value = "";
    state.query = "";
    saveState();
    renderAll();
    el.search.blur();
    return;
  }

  if (isTyping(event.target)) return;

  if ((event.metaKey || event.ctrlKey) && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
    event.preventDefault();
    setTab(state.tab === "recipes" ? "table" : "recipes");
    return;
  }

  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (event.key === "/") {
    event.preventDefault();
    el.search.focus();
    el.search.select();
  } else if (event.key === "1") {
    setTab("recipes");
  } else if (event.key === "2") {
    setTab("table");
  } else if (event.key === "e" && state.tab === "recipes") {
    toggleAllRecipes();
  }
}

/* --- 起動 -------------------------------------------------------- */

function init() {
  fillSelect(
    el.toolFilter,
    [...new Set(quickTable.map((food) => food.tool))].sort(),
    "器具：",
    state.tool,
  );
  fillSelect(
    el.categoryFilter,
    [...new Set(quickTable.map((food) => food.category))].sort(),
    "種類：",
    state.category,
  );
  el.stateFilter.value = state.foodState;
  el.search.value = state.query;

  el.toolFilter.addEventListener("change", () => {
    state.tool = el.toolFilter.value;
    saveState();
    renderTable();
  });
  el.categoryFilter.addEventListener("change", () => {
    state.category = el.categoryFilter.value;
    saveState();
    renderTable();
  });
  el.stateFilter.addEventListener("change", () => {
    state.foodState = el.stateFilter.value;
    saveState();
    renderTable();
  });
  el.search.addEventListener("input", () => {
    state.query = el.search.value;
    saveState();
    renderAll();
  });
  el.expandAll.addEventListener("click", toggleAllRecipes);
  el.tabs.forEach((button) => {
    button.addEventListener("click", () => setTab(button.dataset.tab));
  });
  document.addEventListener("keydown", onKeydown);

  wireStoredDetails();
  renderGenreChips();
  renderAll();
  setTab(state.tab === "table" ? "table" : "recipes");
}

init();
