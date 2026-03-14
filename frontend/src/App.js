import React, { useState, useEffect } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:5000/api";

// Feature metadata
const FEATURE_METADATA = {
  Age: {
    label: "Age (years)",
    type: "number",
    min: 18,
    max: 100,
    placeholder: "45",
  },
  Sex: {
    label: "Sex",
    type: "select",
    options: [
      { value: 1, label: "Male" },
      { value: 0, label: "Female" },
    ],
    placeholder: "Select",
  },
  ChestPainType: {
    label: "Chest Pain Type",
    type: "select",
    options: [
      { value: 0, label: "Typical Angina" },
      { value: 1, label: "Atypical Angina" },
      { value: 2, label: "Non-anginal Pain" },
      { value: 3, label: "Asymptomatic" },
    ],
    placeholder: "Select type",
  },
  RestingBP: {
    label: "Resting Blood Pressure (mmHg)",
    type: "number",
    min: 60,
    max: 200,
    placeholder: "130",
  },
  Cholesterol: {
    label: "Cholesterol (mg/dL)",
    type: "number",
    min: 0,
    max: 400,
    placeholder: "250",
  },
  FastingBS: {
    label: "Fasting Blood Sugar > 120?",
    type: "select",
    options: [
      { value: 0, label: "No" },
      { value: 1, label: "Yes" },
    ],
    placeholder: "Select",
  },
  RestingECG: {
    label: "Resting ECG Result",
    type: "select",
    options: [
      { value: 0, label: "Normal" },
      { value: 1, label: "ST-T Abnormality" },
      { value: 2, label: "LV Hypertrophy" },
    ],
    placeholder: "Select",
  },
  MaxHR: {
    label: "Max Heart Rate Achieved (bpm)",
    type: "number",
    min: 60,
    max: 220,
    placeholder: "150",
  },
  ExerciseAngina: {
    label: "Exercise-Induced Angina?",
    type: "select",
    options: [
      { value: 0, label: "No" },
      { value: 1, label: "Yes" },
    ],
    placeholder: "Select",
  },
  Oldpeak: {
    label: "ST Depression (Oldpeak)",
    type: "number",
    min: 0,
    max: 10,
    step: 0.1,
    placeholder: "1.0",
  },
  ST_Slope: {
    label: "ST Slope",
    type: "select",
    options: [
      { value: 0, label: "Upsloping" },
      { value: 1, label: "Flat" },
      { value: 2, label: "Downsloping" },
    ],
    placeholder: "Select",
  },
};

function App() {
  const [formData, setFormData] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imputed, setImputed] = useState([]);

  useEffect(() => {
    // Load feature metadata from backend
    fetch(`${API_BASE_URL}/feature-info`).catch((err) =>
      console.log("Feature info not available:", err),
    );
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        value === "" ? null
        : (
          name === "Sex" ||
          name === "FastingBS" ||
          name === "ExerciseAngina" ||
          name === "RestingECG" ||
          name === "ChestPainType" ||
          name === "ST_Slope"
        ) ?
          parseInt(value)
        : parseFloat(value),
    }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPrediction(null);

    try {
      // Send only non-empty fields; backend will impute missing ones
      const payload = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== null && v !== ""),
      );

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Prediction failed");

      const result = await response.json();
      setPrediction(result);
      setImputed(result.imputed_fields || []);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({});
    setPrediction(null);
    setError("");
    setImputed([]);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>❤️ Heart Disease Risk Predictor</h1>
        <p>AI-Powered Personalized Health Assessment</p>
      </header>

      <div className="container">
        <div className="form-section">
          <div className="form-card">
            <h2>📋 Enter Your Health Metrics</h2>
            <p className="subtitle">
              Fill in what you know. We'll estimate the rest.
            </p>

            <form onSubmit={handlePredict}>
              <div className="form-grid">
                {Object.entries(FEATURE_METADATA).map(([fieldName, config]) => (
                  <div key={fieldName} className="form-group">
                    <label htmlFor={fieldName}>{config.label}</label>
                    {config.type === "select" ?
                      <select
                        id={fieldName}
                        name={fieldName}
                        value={formData[fieldName] ?? ""}
                        onChange={handleInputChange}
                        className="form-input"
                      >
                        <option value="">{config.placeholder}</option>
                        {config.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    : <input
                        type={config.type}
                        id={fieldName}
                        name={fieldName}
                        value={formData[fieldName] ?? ""}
                        onChange={handleInputChange}
                        placeholder={config.placeholder}
                        min={config.min}
                        max={config.max}
                        step={config.step || 1}
                        className="form-input"
                      />
                    }
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "🔄 Analyzing..." : "🚀 Get Prediction"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary"
                >
                  Clear Form
                </button>
              </div>
            </form>

            {error && <div className="error-box">⚠️ {error}</div>}

            {imputed.length > 0 && (
              <div className="info-box">
                📊 <strong>Auto-filled fields:</strong> {imputed.join(", ")}{" "}
                (using statistical averages)
              </div>
            )}
          </div>
        </div>

        {prediction && (
          <div className="results-section">
            <div
              className="risk-card"
              style={{ borderLeft: `5px solid ${prediction.color}` }}
            >
              <div className="risk-header">
                <h2>
                  {prediction.emoji} {prediction.risk_level}
                </h2>
                <div className="risk-percentage">
                  {(prediction.probability * 100).toFixed(1)}%
                </div>
              </div>

              <div className="risk-gauge">
                <div className="gauge-bar">
                  <div
                    className="gauge-fill"
                    style={{
                      width: `${prediction.probability * 100}%`,
                      backgroundColor: prediction.color,
                    }}
                  />
                </div>
                <div className="gauge-labels">
                  <span>Low Risk</span>
                  <span>Moderate</span>
                  <span>High Risk</span>
                </div>
              </div>

              <div className="prediction-text">
                <p>
                  Your predicted heart disease probability is{" "}
                  <strong>{(prediction.probability * 100).toFixed(1)}%</strong>
                </p>
              </div>
            </div>

            <div className="recommendation-card">
              <h3>💡 AI-Generated Personalized Recommendation</h3>
              <div className="recommendation-text">
                {prediction.recommendation}
              </div>
            </div>

            <div className="metadata">
              <small>
                ✅ Prediction generated at{" "}
                {new Date(prediction.timestamp).toLocaleTimeString()}
              </small>
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>
          ⚠️ <strong>Disclaimer:</strong> This tool provides AI-powered
          predictions for educational purposes only. Always consult with a
          qualified healthcare professional for medical advice and diagnosis.
        </p>
      </footer>
    </div>
  );
}

export default App;
