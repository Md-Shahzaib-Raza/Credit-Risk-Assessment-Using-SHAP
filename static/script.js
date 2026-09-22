// ---------------------------------------------------------------
// Config
// ---------------------------------------------------------------
// Same-origin deployment (FastAPI serving these static files) needs
// no change. If the frontend is hosted separately from the API,
// set this to the API's base URL, e.g. "https://your-api.onrender.com"
const API_BASE = "";

// ---------------------------------------------------------------
// Elements
// ---------------------------------------------------------------
const form = document.getElementById("risk-form");
const submitBtn = document.getElementById("submit-btn");
const formError = document.getElementById("form-error");
const modelStatus = document.getElementById("model-status");

const incomeInput = document.getElementById("person_income");
const amountInput = document.getElementById("loan_amnt");
const ratioInput = document.getElementById("loan_percent_income");

const defaultToggle = document.getElementById("default-toggle");
const defaultHidden = document.getElementById("cb_person_default_on_file");

const verdictEmpty = document.getElementById("verdict-empty");
const verdictResult = document.getElementById("verdict-result");
const gaugeFill = document.getElementById("gauge-fill");
const gaugeNeedle = document.getElementById("gauge-needle");
const gaugeThreshold = document.getElementById("gauge-threshold");
const probabilityFigure = document.getElementById("probability-figure");
const verdictBadge = document.getElementById("verdict-badge");
const verdictText = document.getElementById("verdict-text");
const detailThreshold = document.getElementById("detail-threshold");
const detailMargin = document.getElementById("detail-margin");

const GAUGE_CIRCUMFERENCE = 314; // matches stroke-dasharray in CSS

// ---------------------------------------------------------------
// Loan / income ratio — live computed field
// ---------------------------------------------------------------
function updateRatio() {
  const income = parseFloat(incomeInput.value);
  const amount = parseFloat(amountInput.value);
  if (income > 0 && amount >= 0) {
    ratioInput.value = (amount / income).toFixed(4);
  } else {
    ratioInput.value = "";
  }
}
incomeInput.addEventListener("input", updateRatio);
amountInput.addEventListener("input", updateRatio);
updateRatio();

// ---------------------------------------------------------------
// Prior default toggle
// ---------------------------------------------------------------
defaultToggle.addEventListener("click", (e) => {
  const btn = e.target.closest(".toggle__option");
  if (!btn) return;
  defaultToggle.querySelectorAll(".toggle__option").forEach((b) => b.classList.remove("is-active"));
  btn.classList.add("is-active");
  defaultHidden.value = btn.dataset.value;
});

// ---------------------------------------------------------------
// Model status check
// ---------------------------------------------------------------
async function checkModelStatus() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error("unreachable");
    const data = await res.json();
    if (data.model_loaded) {
      modelStatus.textContent = "Model ready";
      modelStatus.className = "status status--ready";
    } else {
      modelStatus.textContent = "Model not loaded";
      modelStatus.className = "status status--error";
    }
  } catch (err) {
    // No /health route, or API unreachable at this origin — not fatal,
    // the form will still work if /predict responds.
    modelStatus.textContent = "Status unknown";
    modelStatus.className = "status status--pending";
  }
}
checkModelStatus();

// ---------------------------------------------------------------
// Submit
// ---------------------------------------------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();

  if (!form.reportValidity()) return;

  const payload = {
    person_age: parseInt(document.getElementById("person_age").value, 10),
    person_income: parseFloat(incomeInput.value),
    person_home_ownership: document.getElementById("person_home_ownership").value,
    person_emp_length: parseFloat(document.getElementById("person_emp_length").value),
    loan_intent: document.getElementById("loan_intent").value,
    loan_grade: document.getElementById("loan_grade").value,
    loan_amnt: parseFloat(amountInput.value),
    loan_int_rate: parseFloat(document.getElementById("loan_int_rate").value),
    loan_percent_income: parseFloat(ratioInput.value) || 0,
    cb_person_default_on_file: defaultHidden.value,
    cb_person_cred_hist_length: parseInt(document.getElementById("cb_person_cred_hist_length").value, 10),
  };

  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await safeErrorDetail(res);
      throw new Error(detail || `Request failed (${res.status})`);
    }

    const result = await res.json();
    renderResult(result);
  } catch (err) {
    showError(err.message || "Could not reach the scoring API.");
  } finally {
    setLoading(false);
  }
});

async function safeErrorDetail(res) {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    return JSON.stringify(body.detail);
  } catch {
    return null;
  }
}

function setLoading(isLoading) {
  submitBtn.classList.toggle("is-loading", isLoading);
  submitBtn.disabled = isLoading;
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function hideError() {
  formError.hidden = true;
  formError.textContent = "";
}

// ---------------------------------------------------------------
// Render result — gauge, needle, badge, details
// ---------------------------------------------------------------
function renderResult(result) {
  const probability = result.default_probability;
  const threshold = result.threshold;
  const isHighRisk = result.default_prediction === 1;

  verdictEmpty.hidden = true;
  verdictResult.hidden = false;
  verdictResult.classList.remove("is-revealing");
  void verdictResult.offsetWidth; // restart animation
  verdictResult.classList.add("is-revealing");

  // Tier by probability, independent of the binary cutoff, for gauge color
  let tier = "low";
  if (probability >= threshold) tier = "high";
  else if (probability >= threshold * 0.6) tier = "medium";

  const tierColor = { low: "var(--green)", medium: "var(--gold)", high: "var(--rust)" }[tier];

  // Gauge fill (0 -> probability, over the half-circle arc)
  const offset = GAUGE_CIRCUMFERENCE * (1 - probability);
  gaugeFill.style.stroke = tierColor;
  gaugeFill.style.strokeDashoffset = GAUGE_CIRCUMFERENCE; // reset
  requestAnimationFrame(() => {
    gaugeFill.style.strokeDashoffset = offset;
  });

  // Needle sweep: 0 -> -90deg, 1 -> +90deg
  const needleAngle = probability * 180 - 90;
  gaugeNeedle.style.transform = `rotate(${needleAngle}deg)`;

  // Threshold tick mark position on the arc
  const thresholdAngle = threshold * 180 - 90;
  gaugeThreshold.style.transform = `rotate(${thresholdAngle}deg)`;

  probabilityFigure.textContent = probability.toFixed(4);

  verdictBadge.className = `verdict__badge tier-${tier}`;
  verdictText.textContent = result.result || (isHighRisk ? "High Risk" : "Low Risk");

  detailThreshold.textContent = threshold.toFixed(4);
  const margin = probability - threshold;
  detailMargin.textContent = `${margin >= 0 ? "+" : ""}${margin.toFixed(4)}`;
  detailMargin.style.color = margin >= 0 ? "var(--rust)" : "var(--green)";
}
