"use strict";

/*
 * Claude Cost Visualizer
 * Pure static, no dependencies. All numbers are list-price estimates.
 */

// ---- Model list price, US dollars per MILLION tokens ----
// Edit these as Anthropic pricing changes.
const MODELS = [
  { id: "opus",   name: "Claude Opus 4.8",   inputPerM: 15, outputPerM: 75 },
  { id: "sonnet", name: "Claude Sonnet 4.6", inputPerM: 3,  outputPerM: 15 },
  { id: "haiku",  name: "Claude Haiku 4.5",  inputPerM: 1,  outputPerM: 5  },
];

// ---- Comparison units, measured in tokens ----
// These are rough order-of-magnitude estimates meant to be relatable,
// not precise token counts.
const UNITS = [
  {
    id: "kernel",
    label: "Linux kernels",
    singular: "Linux kernel",
    tokens: 1.5e9,
    detail: "The full Linux kernel source tree (~36M lines) ≈ 1.5 billion tokens.",
  },
  {
    id: "wikipedia",
    label: "English Wikipedias",
    singular: "English Wikipedia",
    tokens: 6e9,
    detail: "All of English Wikipedia's article text ≈ 6 billion tokens.",
  },
  {
    id: "potter",
    label: "Harry Potter series",
    singular: "Harry Potter series",
    tokens: 1.5e6,
    detail: "All seven Harry Potter books (~1.1M words) ≈ 1.5 million tokens.",
  },
  {
    id: "bible",
    label: "Bibles",
    singular: "Bible",
    tokens: 1.0e6,
    detail: "The King James Bible (~785k words) ≈ 1 million tokens.",
  },
  {
    id: "shakespeare",
    label: "complete Shakespeares",
    singular: "complete works of Shakespeare",
    tokens: 1.2e6,
    detail: "The complete works of Shakespeare (~900k words) ≈ 1.2 million tokens.",
  },
];

// ---------- DOM refs ----------
const $ = (id) => document.getElementById(id);
const els = {
  budget: $("budget"),
  budgetWords: $("budget-words"),
  model: $("model"),
  modelPricing: $("model-pricing"),
  outputSplit: $("output-split"),
  outputSplitValue: $("output-split-value"),
  inputSplitValue: $("input-split-value"),
  unit: $("unit"),
  unitDetail: $("unit-detail"),
  totalTokens: $("total-tokens"),
  inputTokens: $("input-tokens"),
  outputTokens: $("output-tokens"),
  unitCount: $("unit-count"),
  unitLabel: $("unit-label"),
  comparisonSub: $("comparison-sub"),
  developers: $("developers"),
  months: $("months"),
  devTokens: $("dev-tokens"),
  devUnits: $("dev-units"),
  devUnitsPerMonth: $("dev-units-per-month"),
  devSentence: $("dev-sentence"),
};

// ---------- formatting helpers ----------
const nfFull = new Intl.NumberFormat("en-US");

// Big "human" number: 1.2 trillion, 340 billion, etc.
function humanNumber(n) {
  if (!isFinite(n) || n <= 0) return "0";
  const abs = Math.abs(n);
  const scales = [
    [1e12, "trillion"],
    [1e9, "billion"],
    [1e6, "million"],
    [1e3, "thousand"],
  ];
  for (const [value, name] of scales) {
    if (abs >= value) {
      const v = n / value;
      const digits = v >= 100 ? 0 : v >= 10 ? 1 : 2;
      return `${trimZeros(v.toFixed(digits))} ${name}`;
    }
  }
  return nfFull.format(Math.round(n));
}

// Count for comparison units: keep it readable.
function humanCount(n) {
  if (!isFinite(n) || n <= 0) return "0";
  if (n >= 1e6) return humanNumber(n);
  if (n >= 100) return nfFull.format(Math.round(n));
  if (n >= 10) return n.toFixed(1).replace(/\.0$/, "");
  if (n >= 1) return n.toFixed(1).replace(/\.0$/, "");
  return n.toFixed(2);
}

function trimZeros(s) {
  return s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function parseBudget(raw) {
  const n = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
  return isFinite(n) ? n : 0;
}

// Rough words for the budget, for a friendly echo under the input.
function budgetWords(n) {
  if (n <= 0) return "nothing";
  if (n >= 1e9) return `${trimZeros((n / 1e9).toFixed(2))} billion dollars`;
  if (n >= 1e6) return `${trimZeros((n / 1e6).toFixed(2))} million dollars`;
  if (n >= 1e3) return `${trimZeros((n / 1e3).toFixed(1))} thousand dollars`;
  return `${nfFull.format(Math.round(n))} dollars`;
}

// ---------- populate selects ----------
function buildSelects() {
  els.model.innerHTML = MODELS.map(
    (m) => `<option value="${m.id}">${m.name}</option>`
  ).join("");
  els.unit.innerHTML = UNITS.map(
    (u) => `<option value="${u.id}">${u.singular[0].toUpperCase() + u.singular.slice(1)}</option>`
  ).join("");
}

function currentModel() {
  return MODELS.find((m) => m.id === els.model.value) || MODELS[0];
}
function currentUnit() {
  return UNITS.find((u) => u.id === els.unit.value) || UNITS[0];
}

// ---------- core calculation ----------
function recalc() {
  const budget = parseBudget(els.budget.value);
  const model = currentModel();
  const unit = currentUnit();

  const outPct = Number(els.outputSplit.value) / 100;
  const inPct = 1 - outPct;

  els.outputSplitValue.textContent = els.outputSplit.value;
  els.inputSplitValue.textContent = Math.round(inPct * 100);
  els.budgetWords.textContent = budgetWords(budget);
  els.modelPricing.textContent =
    `$${model.inputPerM} / 1M input tokens · $${model.outputPerM} / 1M output tokens`;
  els.unitDetail.textContent = unit.detail;

  // Blended price per token (dollars).
  const blendedPerM = inPct * model.inputPerM + outPct * model.outputPerM;
  const totalTokens = blendedPerM > 0 ? (budget / blendedPerM) * 1e6 : 0;
  const inputTokens = totalTokens * inPct;
  const outputTokens = totalTokens * outPct;

  els.totalTokens.textContent = humanNumber(totalTokens);
  els.inputTokens.textContent = humanNumber(inputTokens);
  els.outputTokens.textContent = humanNumber(outputTokens);

  // Keep every ".unit-label" span (headline + dev section) in sync first,
  // then refine the headline one for singular/plural below.
  document.querySelectorAll(".unit-label").forEach((node) => {
    node.textContent = unit.label;
  });

  // Comparison.
  const unitCount = totalTokens / unit.tokens;
  els.unitCount.textContent = humanCount(unitCount);
  els.unitLabel.textContent = unitCount >= 2 || unitCount < 1 ? unit.label : unit.singular;
  els.comparisonSub.textContent = unit.detail;

  recalcDevs(totalTokens, unit);
}

function recalcDevs(totalTokens, unit) {
  const devs = Math.max(1, Math.floor(Number(els.developers.value) || 1));
  const months = Math.max(1, Math.floor(Number(els.months.value) || 1));

  const perDevTokens = totalTokens / devs;
  const perDevUnits = perDevTokens / unit.tokens;
  const perDevUnitsPerMonth = perDevUnits / months;

  els.devTokens.textContent = humanNumber(perDevTokens);
  els.devUnits.textContent = humanCount(perDevUnits);
  els.devUnitsPerMonth.textContent = humanCount(perDevUnitsPerMonth);

  els.devSentence.textContent =
    `${nfFull.format(devs)} developers would each work through about ` +
    `${humanCount(perDevUnits)} ${unit.label} — roughly ` +
    `${humanCount(perDevUnitsPerMonth)} ${perDevUnitsPerMonth >= 2 || perDevUnitsPerMonth < 1 ? unit.label : unit.singular} ` +
    `per month over ${nfFull.format(months)} ${months === 1 ? "month" : "months"}.`;
}

// ---------- budget input: format with commas as you type ----------
function formatBudgetInput() {
  const caretFromEnd = els.budget.value.length - els.budget.selectionStart;
  const n = parseBudget(els.budget.value);
  if (n > 0) {
    els.budget.value = nfFull.format(n);
  }
  // best-effort caret restore
  const pos = Math.max(0, els.budget.value.length - caretFromEnd);
  els.budget.setSelectionRange(pos, pos);
}

// ---------- wire up ----------
buildSelects();
els.model.value = "opus"; // default that makes the $500M ≈ 10k kernels story land

[els.model, els.unit, els.outputSplit, els.developers, els.months].forEach((el) =>
  el.addEventListener("input", recalc)
);

els.budget.addEventListener("input", recalc);
els.budget.addEventListener("blur", () => {
  formatBudgetInput();
  recalc();
});

recalc();
