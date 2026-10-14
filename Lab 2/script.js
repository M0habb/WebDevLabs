"use strict";

const display = document.querySelector("#display");
const history = document.querySelector("#history");
const keys    = document.querySelector("#keys");

const OPS = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => a / b,
};
const SYMBOLS = { "+": "+", "-": "−", "*": "×", "/": "÷" };
const MAX_DIGITS = 12;

const initialState = () => ({
  current: "0",
  previous: null,
  operator: null,
  overwrite: false,
  error: false,
});
let state = initialState();

const clean = (n) => String(parseFloat(n.toPrecision(12)));

function compute(a, op, b) {
  const result = OPS[op](parseFloat(a), parseFloat(b));
  return Number.isFinite(result) ? clean(result) : null; // null = divide by zero
}

function setError() {
  state = { ...initialState(), current: "Error", error: true, overwrite: true };
}

function inputDigit(d) {
  if (state.overwrite) {
    state.current = d;
    state.overwrite = false;
  } else if (state.current.replace(/\D/g, "").length < MAX_DIGITS) {
    state.current = state.current === "0" ? d : state.current + d;
  }
}

function inputDot() {
  if (state.overwrite) {
    state.current = "0.";
    state.overwrite = false;
  } else if (!state.current.includes(".")) {
    state.current += ".";
  }
}

function chooseOperator(op) {
  // Chain: 2 + 3 + … evaluates 2 + 3 first
  if (state.operator && !state.overwrite) {
    const result = compute(state.previous, state.operator, state.current);
    if (result === null) return setError();
    state.current = result;
  }
  state.previous = state.current;
  state.operator = op;
  state.overwrite = true;
  history.textContent = `${format(state.previous)} ${SYMBOLS[op]}`;
}

function equals() {
  if (!state.operator) return;
  const expression = `${format(state.previous)} ${SYMBOLS[state.operator]} ${format(state.current)} =`;
  const result = compute(state.previous, state.operator, state.current);
  if (result === null) return setError();
  state = { ...initialState(), current: result, overwrite: true };
  history.textContent = expression;
}

function backspace() {
  if (state.overwrite) return;
  state.current = state.current.length > 1 && state.current !== "-0"
    ? state.current.slice(0, -1)
    : "0";
  if (state.current === "-") state.current = "0";
}

function percent() {
  state.current = clean(parseFloat(state.current) / 100);
  state.overwrite = true;
}

function toggleSign() {
  if (state.current !== "0") {
    state.current = state.current.startsWith("-")
      ? state.current.slice(1)
      : "-" + state.current;
  }
}

function clearAll() {
  state = initialState();
  history.textContent = "";
}

function format(value) {
  const [int, dec] = String(value).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec === undefined ? grouped : `${grouped}.${dec}`;
}

function render() {
  const text = state.error ? state.current : format(state.current);
  display.textContent = text;
  display.dataset.error = state.error;
  display.dataset.size = text.length > 13 ? "sm" : text.length > 9 ? "md" : "lg";

  keys.querySelectorAll("[data-op]").forEach((btn) => {
    btn.setAttribute(
      "aria-pressed",
      String(btn.dataset.op === state.operator && state.overwrite)
    );
  });
}

const ACTIONS = {
  clear: clearAll,
  backspace,
  percent,
  sign: toggleSign,
  dot: inputDot,
  equals,
};

function handleInput({ num, op, action }) {
  if (state.error) clearAll();
  if (num !== undefined) inputDigit(num);
  else if (op) chooseOperator(op);
  else if (action) ACTIONS[action]();
  render();
}

keys.addEventListener("click", (e) => {
  const btn = e.target.closest(".key");
  if (btn) handleInput(btn.dataset);
});

const KEY_MAP = {
  Enter: { action: "equals" },
  "=": { action: "equals" },
  Escape: { action: "clear" },
  Delete: { action: "clear" },
  Backspace: { action: "backspace" },
  "%": { action: "percent" },
  ".": { action: "dot" },
  ",": { action: "dot" },
  "+": { op: "+" },
  "-": { op: "-" },
  "*": { op: "*" },
  "/": { op: "/" },
};

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const input = /^\d$/.test(e.key) ? { num: e.key } : KEY_MAP[e.key];
  if (!input) return;

  e.preventDefault(); 
  handleInput(input);

  const selector = input.num !== undefined ? `[data-num="${input.num}"]`
    : input.op ? `[data-op="${CSS.escape(input.op)}"]`
    : `[data-action="${input.action}"]`;
  const btn = keys.querySelector(selector);
  if (btn) {
    btn.classList.add("is-pressed");
    setTimeout(() => btn.classList.remove("is-pressed"), 110);
  }
});

render();