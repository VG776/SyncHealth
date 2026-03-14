import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

// Feature metadata with descriptions
const FEATURE_METADATA = {
  'Age': { 
    label: 'Age (years)', 
    type: 'number', 
    min: 18, 
    max: 100, 
    placeholder: '45',
    description: 'Your age in years. Heart disease risk increases with age.'
  },
  'Sex': { 
    label: 'Sex', 
    type: 'select', 
    options: [{ value: 1, label: 'Male' }, { value: 0, label: 'Female' }], 
    placeholder: 'Select',
    description: 'Biological sex. Men typically have higher risk at younger ages.'
  },
  'ChestPainType': { 
    label: 'Chest Pain Type', 
    type: 'select', 
    options: [
      { value: 0, label: 'Typical Angina' },
      { value: 1, label: 'Atypical Angina' },
      { value: 2, label: 'Non-anginal Pain' },
      { value: 3, label: 'Asymptomatic' }
    ], 
    placeholder: 'Select type',
    description: 'Type of chest pain experienced. Typical angina is most concerning.'
  },
  'RestingBP': { 
    label: 'Resting Blood Pressure (mmHg)', 
    type: 'number', 
    min: 60, 
    max: 200, 
    placeholder: '130',
    description: 'Blood pressure at rest. Normal is <120. Elevated is 120-139.'
  },
  'Cholesterol': { 
    label: 'Cholesterol (mg/dL)', 
    type: 'number', 
    min: 0, 
    max: 400, 
    placeholder: '250',
    description: 'Total cholesterol level. <200 is desirable. Higher increases risk.'
  },
  'FastingBS': { 
    label: 'Fasting Blood Sugar > 120?', 
    type: 'select', 
    options: [
      { value: 0, label: 'No - Normal' },
      { value: 1, label: 'Yes - High' }
    ], 
    placeholder: 'Select',
    description: 'Indicates blood sugar control. High sugar increases heart disease risk.'
  },
  'RestingECG': { 
    label: 'Resting ECG Result', 
    type: 'select', 
    options: [
      { value: 0, label: 'Normal' },
      { value: 1, label: 'ST-T Abnormality' },
      { value: 2, label: 'LV Hypertrophy' }
    ], 
    placeholder: 'Select',
    description: 'Electrical activity of heart at rest. Abnormalities suggest problems.'
  },
  'MaxHR': { 
    label: 'Max Heart Rate Achieved (bpm)', 
    type: 'number', 
    min: 60, 
    max: 220, 
    placeholder: '150',
    description: 'Highest HR during stress test. Lower values indicate poor fitness.'
  },
  'ExerciseAngina': { 
    label: 'Exercise-Induced Angina?', 
    type: 'select', 
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes - Chest Pain' }
    ], 
    placeholder: 'Select',
    description: 'Chest pain during exercise is a serious warning sign.'
  },
  'Oldpeak': { 
    label: 'ST Depression (Oldpeak)', 
    type: 'number', 
    min: 0, 
    max: 10, 
    step: 0.1, 
    placeholder: '1.0',
    description: 'ST segment depression on ECG. Higher values = more concerning.'
  },
  'ST_Slope': { 
    label: 'ST Slope', 
    type: 'select', 
    options: [
      { value: 0, label: 'Upsloping' },
      { value: 1, label: 'Flat' },
      { value: 2, label: 'Downsloping' }
    ], 
    placeholder: 'Select',
    description: 'How ST segment changes during stress. Downsloping is most concerning.'
  }
};

// Quick presets for demo
const PRESETS = {
  'healthy': {
    label: '💚 Healthy Person',
    data: { Age: 35, Sex: 1, ChestPainType: 3, RestingBP: 110, Cholesterol: 180, FastingBS: 0, RestingECG: 0, MaxHR: 180, ExerciseAngina: 0, Oldpeak: 0, ST_Slope: 0 }
  },
  'moderate': {
    label: '🟡 Moderate Risk',
    data: { Age: 55, Sex: 1, ChestPainType: 1, RestingBP: 135, Cholesterol: 250, FastingBS: 1, RestingECG: 1, MaxHR: 130, ExerciseAngina: 0, Oldpeak: 0.5, ST_Slope: 1 }
  },
  'high': {
    label: '🔴 High Risk',
    data: { Age: 65, Sex: 0, ChestPainType: 0, RestingBP: 150, Cholesterol: 300, FastingBS: 1, RestingECG: 2, MaxHR: 100, ExerciseAngina: 1, Oldpeak: 2.0, ST_Slope: 2 }
  }
};

// Health tips carousel
const HEALTH_TIPS = [
  { icon: '🏃', title: 'Regular Exercise', text: 'Aim for 150 mins of moderate activity per week' },
  { icon: '🥗', title: 'Eat Heart-Healthy', text: 'Mediterranean diet with fruits, veggies, and fish' },
  { icon: '🧂', title: 'Reduce Sodium', text: 'Keep daily sodium intake below 2,300mg' },
  { icon: '😴', title: 'Quality Sleep', text: 'Aim for 7-9 hours of sleep per night' },
  { icon: '🧘', title: 'Stress Management', text: 'Practice meditation, yoga, or breathing exercises' },
  { icon: '⚖️', title: 'Healthy Weight', text: 'Maintain BMI between 18.5 and 24.9' },
  { icon: '🚭', title: 'Quit Smoking', text: 'Smoking dramatically increases heart disease risk' },
  { icon: '📊', title: 'Monitor Vitals', text: 'Check BP and cholesterol regularly' }
];

function App() {
  const [activeTab, setActiveTab] = useState('predict');
  const [formData, setFormData] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imputed, setImputed] = useState([]);
  const [history, setHistory] = useState([]);
  const [showTooltip, setShowTooltip] = useState({});
  const [tipIndex, setTipIndex] = useState(0);
  const [whatIfData, setWhatIfData] = useState(null);
  const [whatIfResult, setWhatIfResult] = useState(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('predictions');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Rotate health tips
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % HEALTH_TIPS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : (name === 'Sex' || name === 'FastingBS' || name === 'ExerciseAngina' || name === 'RestingECG' || name === 'ChestPainType' || name === 'ST_Slope' 
        ? parseInt(value) 
        : parseFloat(value))
    }));
  };

  const applyPreset = (presetKey) => {
    setFormData(PRESETS[presetKey].data);
    setWhatIfData(null);
    setWhatIfResult(null);
  };

  const handlePredict = async (e, dataToUse = null) => {
    e?.preventDefault?.();
    setLoading(true);
    setError('');
    setPrediction(null);

    try {
      const payload = Object.fromEntries(
        Object.entries(dataToUse || formData).filter(([_, v]) => v !== null && v !== '')
      );

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Prediction failed');
      
      const result = await response.json();
      setPrediction(result);
      setImputed(result.imputed_fields || []);

      // Save to history
      const newHistory = [{
        ...result,
        inputData: payload,
        timestamp: new Date().toISOString()
      }, ...history.slice(0, 9)];
      setHistory(newHistory);
      localStorage.setItem('predictions', JSON.stringify(newHistory));
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatIf = async () => {
    if (!whatIfData) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whatIfData)
      });

      if (!response.ok) throw new Error('Prediction failed');
      const result = await response.json();
      setWhatIfResult(result);
    } catch (err) {
      setError('What-if analysis failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({});
    setPrediction(null);
    setError('');
    setImputed([]);
    setWhatIfData(null);
    setWhatIfResult(null);
  };

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-logo">
            <span className="logo-icon">❤️</span>
            <span className="logo-text">CardioCheck</span>
          </div>
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeTab === 'predict' ? 'active' : ''}`}
              onClick={() => setActiveTab('predict')}
            >
              🔍 Predictor
            </button>
            <button 
              className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              📊 History ({history.length})
            </button>
            <button 
              className={`nav-tab ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => setActiveTab('resources')}
            >
              📚 Learn
            </button>
          </div>
        </div>
      </nav>

      {/* Header with tip */}
      <header className="header">
        <div className="header-main">
          <h1>❤️ Heart Disease Risk Predictor</h1>
          <p>AI-Powered Personalized Health Assessment</p>
        </div>
        <div className="health-tip">
          <div className="tip-content">
            <span className="tip-icon">{HEALTH_TIPS[tipIndex].icon}</span>
            <div>
              <strong>{HEALTH_TIPS[tipIndex].title}:</strong> {HEALTH_TIPS[tipIndex].text}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container">
        {/* PREDICTOR TAB */}
        {activeTab === 'predict' && (
          <div className="tab-content">
            <div className="form-section">
              <div className="form-card">
                <h2>📋 Health Assessment</h2>
                <p className="subtitle">Fill in what you know. We'll estimate the rest.</p>

                {/* Preset Buttons */}
                <div className="presets-section">
                  <p className="presets-label">Quick Presets (for testing):</p>
                  <div className="presets-grid">
                    {Object.entries(PRESETS).map(([key, preset]) => (
                      <button 
                        key={key}
                        className="preset-btn"
                        onClick={() => applyPreset(key)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handlePredict}>
                  <div className="form-sections">
                    {/* Cardiovascular Metrics */}
                    <div className="form-section-group">
                      <h3>💓 Cardiovascular Metrics</h3>
                      <div className="form-grid">
                        {['Age', 'Sex', 'RestingBP', 'Cholesterol', 'MaxHR'].map(fieldName => {
                          const config = FEATURE_METADATA[fieldName];
                          return (
                            <div key={fieldName} className="form-group">
                              <div className="label-row">
                                <label htmlFor={fieldName}>{config.label}</label>
                                <span 
                                  className="info-icon"
                                  onMouseEnter={() => setShowTooltip({ ...showTooltip, [fieldName]: true })}
                                  onMouseLeave={() => setShowTooltip({ ...showTooltip, [fieldName]: false })}
                                >
                                  ℹ️
                                </span>
                              </div>
                              {showTooltip[fieldName] && (
                                <div className="tooltip">{config.description}</div>
                              )}
                              {config.type === 'select' ? (
                                <select
                                  id={fieldName}
                                  name={fieldName}
                                  value={formData[fieldName] ?? ''}
                                  onChange={handleInputChange}
                                  className="form-input"
                                >
                                  <option value="">{config.placeholder}</option>
                                  {config.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={config.type}
                                  id={fieldName}
                                  name={fieldName}
                                  value={formData[fieldName] ?? ''}
                                  onChange={handleInputChange}
                                  placeholder={config.placeholder}
                                  min={config.min}
                                  max={config.max}
                                  step={config.step || 1}
                                  className="form-input"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Symptom Assessment */}
                    <div className="form-section-group">
                      <h3>⚠️ Symptoms & Assessment</h3>
                      <div className="form-grid">
                        {['ChestPainType', 'ExerciseAngina', 'FastingBS', 'RestingECG', 'Oldpeak', 'ST_Slope'].map(fieldName => {
                          const config = FEATURE_METADATA[fieldName];
                          return (
                            <div key={fieldName} className="form-group">
                              <div className="label-row">
                                <label htmlFor={fieldName}>{config.label}</label>
                                <span 
                                  className="info-icon"
                                  onMouseEnter={() => setShowTooltip({ ...showTooltip, [fieldName]: true })}
                                  onMouseLeave={() => setShowTooltip({ ...showTooltip, [fieldName]: false })}
                                >
                                  ℹ️
                                </span>
                              </div>
                              {showTooltip[fieldName] && (
                                <div className="tooltip">{config.description}</div>
                              )}
                              {config.type === 'select' ? (
                                <select
                                  id={fieldName}
                                  name={fieldName}
                                  value={formData[fieldName] ?? ''}
                                  onChange={handleInputChange}
                                  className="form-input"
                                >
                                  <option value="">{config.placeholder}</option>
                                  {config.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={config.type}
                                  id={fieldName}
                                  name={fieldName}
                                  value={formData[fieldName] ?? ''}
                                  onChange={handleInputChange}
                                  placeholder={config.placeholder}
                                  min={config.min}
                                  max={config.max}
                                  step={config.step || 1}
                                  className="form-input"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" disabled={loading} className="btn-primary">
                      {loading ? '🔄 Analyzing...' : '🚀 Get Prediction'}
                    </button>
                    <button type="button" onClick={handleReset} className="btn-secondary">
                      🔄 Clear Form
                    </button>
                  </div>
                </form>

                {error && <div className="error-box">⚠️ {error}</div>}
                {imputed.length > 0 && (
                  <div className="info-box">
                    📊 <strong>Auto-filled:</strong> {imputed.join(', ')} (using statistical averages)
                  </div>
                )}
              </div>
            </div>

            {/* Results Section */}
            {prediction && (
              <div className="results-section">
                <div className="risk-card" style={{ borderLeft: `5px solid ${prediction.color}` }}>
                  <div className="risk-header">
                    <h2>{prediction.emoji} {prediction.risk_level}</h2>
                    <div className="risk-percentage">{(prediction.probability * 100).toFixed(1)}%</div>
                  </div>

                  <div className="risk-gauge">
                    <div className="gauge-bar">
                      <div 
                        className="gauge-fill" 
                        style={{ 
                          width: `${prediction.probability * 100}%`,
                          backgroundColor: prediction.color
                        }}
                      />
                    </div>
                    <div className="gauge-labels">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="prediction-text">
                    <p>Predicted heart disease probability: <strong>{(prediction.probability * 100).toFixed(1)}%</strong></p>
                  </div>
                </div>

                <div className="recommendation-card">
                  <h3>💡 AI-Generated Recommendation</h3>
                  <div className="recommendation-text">
                    {prediction.recommendation}
                  </div>
                </div>

                {/* What-If Simulator */}
                <div className="whatif-card">
                  <h3>🎯 What If... Simulator</h3>
                  <p className="whatif-subtitle">Adjust one metric to see how it affects your risk</p>
                  <div className="whatif-controls">
                    <select 
                      className="whatif-select"
                      onChange={(e) => {
                        const field = e.target.value;
                        if (field) {
                          setWhatIfData({
                            ...formData,
                            [field]: formData[field] ? formData[field] * 1.1 : 50
                          });
                        }
                      }}
                    >
                      <option value="">Select metric to adjust...</option>
                      <option value="Age">Age (+5 years)</option>
                      <option value="RestingBP">Blood Pressure (+10 mmHg)</option>
                      <option value="Cholesterol">Cholesterol (+20 mg/dL)</option>
                      <option value="MaxHR">Max Heart Rate (+10 bpm)</option>
                    </select>
                    {whatIfData && (
                      <button 
                        className="btn-whatif"
                        onClick={handleWhatIf}
                        disabled={loading}
                      >
                        {loading ? '⏳ Analyzing...' : '🔮 See Impact'}
                      </button>
                    )}
                  </div>
                  {whatIfResult && (
                    <div className="whatif-result">
                      <div className="whatif-comparison">
                        <div className="whatif-item">
                          <span>Current</span>
                          <span className="whatif-value">{(prediction.probability * 100).toFixed(1)}%</span>
                        </div>
                        <div className="whatif-arrow">→</div>
                        <div className="whatif-item">
                          <span>If Adjusted</span>
                          <span className="whatif-value" style={{color: whatIfResult.probability > prediction.probability ? '#e74c3c' : '#2ecc71'}}>
                            {(whatIfResult.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <p className="whatif-insight">
                        {whatIfResult.probability > prediction.probability 
                          ? '📈 Risk would increase!'
                          : whatIfResult.probability < prediction.probability
                          ? '📉 Risk would decrease!'
                          : '➡️ No significant change'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="metadata">
                  <small>✅ Prediction generated at {new Date(prediction.timestamp).toLocaleTimeString()}</small>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="tab-content">
            <div className="history-section">
              <h2>📊 Prediction History</h2>
              {history.length === 0 ? (
                <div className="empty-state">
                  <p>No predictions yet. Make your first prediction to see history!</p>
                </div>
              ) : (
                <div className="history-grid">
                  {history.map((item, idx) => (
                    <div key={idx} className="history-card">
                      <div className="history-header">
                        <span className="history-emoji">{item.emoji}</span>
                        <span className="history-level">{item.risk_level}</span>
                        <span className="history-prob">{(item.probability * 100).toFixed(1)}%</span>
                      </div>
                      <p className="history-time">{new Date(item.timestamp).toLocaleString()}</p>
                      <div className="history-metrics">
                        {item.inputData.Age && <span>Age: {item.inputData.Age}</span>}
                        {item.inputData.RestingBP && <span>BP: {item.inputData.RestingBP}</span>}
                        {item.inputData.Cholesterol && <span>Chol: {item.inputData.Cholesterol}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div className="tab-content">
            <div className="resources-section">
              <h2>📚 Heart Health Resources</h2>
              
              <div className="resources-grid">
                <div className="resource-card">
                  <h3>❓ What is Heart Disease?</h3>
                  <p>Heart disease refers to several types of conditions affecting the heart, including:</p>
                  <ul>
                    <li><strong>Coronary Artery Disease:</strong> Plaque buildup in arteries</li>
                    <li><strong>Heart Attack:</strong> Blockage of blood flow to the heart</li>
                    <li><strong>Arrhythmia:</strong> Irregular heartbeat</li>
                    <li><strong>Heart Failure:</strong> Heart's reduced ability to pump</li>
                  </ul>
                </div>

                <div className="resource-card">
                  <h3>🚨 Warning Signs</h3>
                  <p>Seek immediate medical attention if you experience:</p>
                  <ul>
                    <li>Chest pain or pressure</li>
                    <li>Shortness of breath</li>
                    <li>Pain radiating to arm, neck, or jaw</li>
                    <li>Sudden dizziness or fainting</li>
                    <li>Nausea or cold sweats</li>
                  </ul>
                </div>

                <div className="resource-card">
                  <h3>✅ Prevention Tips</h3>
                  <p>Reduce your heart disease risk:</p>
                  <ul>
                    <li>Exercise 150 mins per week</li>
                    <li>Eat heart-healthy diet (Mediterranean diet)</li>
                    <li>Maintain healthy weight</li>
                    <li>Don't smoke</li>
                    <li>Manage stress and get quality sleep</li>
                    <li>Keep BP and cholesterol in check</li>
                  </ul>
                </div>

                <div className="resource-card">
                  <h3>🏥 When to See a Doctor</h3>
                  <p>Schedule checkups if you have:</p>
                  <ul>
                    <li>Family history of heart disease</li>
                    <li>High blood pressure or cholesterol</li>
                    <li>Diabetes</li>
                    <li>Overweight or obesity</li>
                    <li>Sedentary lifestyle</li>
                    <li>Any chest pain or discomfort</li>
                  </ul>
                </div>

                <div className="resource-card">
                  <h3>📊 Target Metrics</h3>
                  <p>Aim for these healthy ranges:</p>
                  <ul>
                    <li><strong>Blood Pressure:</strong> &lt;120/80 mmHg</li>
                    <li><strong>Cholesterol:</strong> &lt;200 mg/dL</li>
                    <li><strong>BMI:</strong> 18.5-24.9</li>
                    <li><strong>Heart Rate:</strong> 60-100 bpm at rest</li>
                    <li><strong>Blood Sugar:</strong> &lt;100 mg/dL (fasting)</li>
                  </ul>
                </div>

                <div className="resource-card">
                  <h3>🔗 Useful Links</h3>
                  <ul>
                    <li><a href="https://www.cdc.gov/heartdisease/" target="_blank" rel="noopener noreferrer">CDC - Heart Disease Info</a></li>
                    <li><a href="https://www.heart.org/" target="_blank" rel="noopener noreferrer">American Heart Association</a></li>
                    <li><a href="https://www.nhlbi.nih.gov/" target="_blank" rel="noopener noreferrer">National Heart, Lung & Blood Institute</a></li>
                  </ul>
                </div>
              </div>

              <div className="tips-carousel">
                <h3>💡 Health Tips Carousel</h3>
                <div className="tips-display">
                  {HEALTH_TIPS.map((tip, idx) => (
                    <div 
                      key={idx} 
                      className={`tip-card ${idx === tipIndex ? 'active' : ''}`}
                    >
                      <div className="tip-icon-large">{tip.icon}</div>
                      <h4>{tip.title}</h4>
                      <p>{tip.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>⚠️ <strong>Disclaimer:</strong> This tool provides AI-powered predictions for educational purposes only. 
           Always consult with a qualified healthcare professional for medical advice and diagnosis.</p>
        <p><strong>CardioCheck</strong> © 2024 | Built with ❤️ for Health</p>
      </footer>
    </div>
  );
}

export default App;
