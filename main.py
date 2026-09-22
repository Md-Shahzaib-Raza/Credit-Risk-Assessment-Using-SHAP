import logging

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Credit Risk API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ml_model = {}


@app.on_event("startup")
def load_model():
    try:
        ml_model["model"] = joblib.load("credit_risk_model.pkl")
        ml_model["threshold"] = joblib.load("best_threshold.pkl")
        logger.info(f"Model loaded OK. Threshold = {ml_model['threshold']:.4f}")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        # Don't crash the whole app on Render if the model fails to load —
        # /health and the UI will still come up, and /predict will report 503.
        ml_model.clear()


@app.on_event("shutdown")
def unload_model():
    ml_model.clear()


class LoanApplication(BaseModel):
    person_age: int
    person_income: float
    person_home_ownership: str
    person_emp_length: float
    loan_intent: str
    loan_grade: str
    loan_amnt: float
    loan_int_rate: float
    loan_percent_income: float
    cb_person_default_on_file: str
    cb_person_cred_hist_length: int


@app.get("/health")
def health():
    """Used by the frontend on load to show whether the model is ready."""
    return {
        "model_loaded": "model" in ml_model,
        "threshold": ml_model.get("threshold"),
    }


@app.post("/predict")
def predict(data: LoanApplication):
    if "model" not in ml_model:
        raise HTTPException(status_code=503, detail="Model not loaded. Check server logs.")

    input_df = pd.DataFrame([data.dict()])
    probability = float(ml_model["model"].predict_proba(input_df)[:, 1][0])
    prediction = int(probability >= ml_model["threshold"])

    return {
        "default_probability": round(probability, 4),
        "default_prediction": prediction,
        "threshold": round(float(ml_model["threshold"]), 4),
        "result": "High Risk" if prediction == 1 else "Low Risk",
    }


# Serve the frontend (index.html, style.css, script.js) from the same service.
# Put those three files in a "static" folder next to this file.
# Mounted last, and at "/", so it doesn't shadow the API routes above.
app.mount("/", StaticFiles(directory="static", html=True), name="static")
