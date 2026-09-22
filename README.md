# Credit Risk Assessment Using SHAP

A modern, AI-powered credit risk analysis tool built with XGBoost, FastAPI, and SHAP (SHapley Additive exPlanations) for model explainability. This application predicts the probability of loan default based on applicant data and provides a calibrated risk classification.

## 🚀 Features

* **Machine Learning Model**: Calibrated XGBoost classifier optimized for F1-score with a custom decision threshold.
* **Explainability (SHAP)**: Uses SHAP values to explain the impact of individual features on the model's predictions (implemented in the training notebook).
* **API Backend**: High-performance REST API built with FastAPI.
* **Premium UI**: Dark-themed, glassmorphic web interface with an interactive gauge chart for risk visualization.

## 🛠️ Tech Stack

* **Data Science & ML**: Pandas, Scikit-learn, XGBoost, SHAP, Joblib
* **Backend API**: Python, FastAPI, Uvicorn, Pydantic
* **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (Vanilla)

## 📂 Project Structure

```text
├── Credit_risk_model.ipynb    # Jupyter notebook containing data exploration, model training, and SHAP analysis
├── main.py                    # Standalone python script version of the training pipeline
├── api.py                     # FastAPI server handling predictions and serving the UI
├── requirements.txt           # Project dependencies
├── credit_risk_model.pkl      # Trained and calibrated XGBoost model
├── best_threshold.pkl         # Optimal decision threshold for classification
├── credit_risk_dataset.csv    # Training dataset (features and labels)
└── static/
    ├── index.html             # Main frontend interface
    ├── style.css              # Styling for the web app
    └── script.js              # Frontend logic and API integration
```

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Md-Shahzaib-Raza/Credit-Risk-Assessment-Using-SHAP.git
   cd Credit-Risk-Assessment-Using-SHAP
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   
   # Windows:
   .\venv\Scripts\Activate.ps1
   # macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **(Optional) Retrain the model:**
   If you want to regenerate the `.pkl` files from scratch on your local machine:
   ```bash
   python main.py
   ```

## 🖥️ Running the Application

1. **Start the FastAPI server:**
   ```bash
   uvicorn api:app --reload
   ```

2. **Access the application:**
   Open your browser and navigate to: `http://127.0.0.1:8000`

## 📊 Dataset Features

The model expects the following inputs to assess risk:
* **person_age**: Applicant's age
* **person_income**: Annual income
* **person_home_ownership**: Rent, Own, Mortgage, or Other
* **person_emp_length**: Employment length in years
* **loan_intent**: Purpose of the loan (Education, Medical, Venture, Personal, etc.)
* **loan_grade**: Categorical grade (A to G)
* **loan_amnt**: Requested loan amount
* **loan_int_rate**: Interest rate
* **loan_percent_income**: Loan amount divided by annual income
* **cb_person_default_on_file**: Historical default (Y/N)
* **cb_person_cred_hist_length**: Credit history length in years

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
