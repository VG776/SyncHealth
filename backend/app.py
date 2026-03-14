"""
Heart Disease Prediction Backend API
Handles model predictions, LLM-based lifestyle recommendations, and missing data imputation
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import numpy as np
import pandas as pd
import os
from datetime import datetime
import requests

app = Flask(__name__)
CORS(app)

# Load model and feature info
MODEL_PATH = '../xgb_model.pkl'
FEATURE_INFO_PATH = '../feature_info.json'

try:
    model = joblib.load(MODEL_PATH)
    with open(FEATURE_INFO_PATH, 'r') as f:
        feature_info = json.load(f)
    print("✅ Model and feature info loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None
    feature_info = None

# LLM Configuration
# Supports multiple LLM providers
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')  # Set via environment variable
LLM_MODEL = os.getenv('LLM_MODEL', 'gpt-3.5-turbo')
LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'openai')  # 'openai', 'anthropic', 'cohere'

def impute_missing_data(user_data):
    """
    Impute missing values in user data using feature statistics
    """
    imputed_data = user_data.copy()
    stats = feature_info['feature_statistics']
    
    for feature in feature_info['feature_names']:
        if feature not in imputed_data or imputed_data[feature] is None:
            # Use median for numeric features
            imputed_data[feature] = stats['median'].get(feature, 0)
    
    return imputed_data

def get_risk_level(probability):
    """Classify risk level based on probability"""
    if probability < 0.3:
        return {"level": "Low Risk", "color": "#2ecc71", "emoji": "🟢"}
    elif probability < 0.5:
        return {"level": "Moderate Risk", "color": "#f39c12", "emoji": "🟡"}
    elif probability < 0.7:
        return {"level": "High Risk", "color": "#e74c3c", "emoji": "🔴"}
    else:
        return {"level": "Critical Risk", "color": "#c0392b", "emoji": "🔴🔴"}

def generate_lifestyle_recommendations_llm(user_data, risk_prob, risk_level):
    """
    Generate personalized lifestyle recommendations using LLM
    """
    
    # Prepare context for LLM
    risk_factors = []
    if user_data.get('RestingBP', 0) > 120:
        risk_factors.append(f"High Blood Pressure ({user_data['RestingBP']} mmHg)")
    if user_data.get('Cholesterol', 0) > 200:
        risk_factors.append(f"High Cholesterol ({user_data['Cholesterol']} mg/dL)")
    if user_data.get('MaxHR', 0) < 100:
        risk_factors.append(f"Low Cardiovascular Fitness (Max HR: {user_data['MaxHR']} bpm)")
    if user_data.get('Oldpeak', 0) > 1.0:
        risk_factors.append(f"Exercise-Induced ST Depression ({user_data['Oldpeak']} mm)")
    if user_data.get('ExerciseAngina', 0) == 1:
        risk_factors.append("Exercise-Induced Angina Present")
    
    prompt = f"""You are a compassionate health coach providing personalized heart disease prevention advice.

Patient Profile:
- Age: {user_data.get('Age', 'Unknown')} years
- Sex: {"Male" if user_data.get('Sex', 1) == 1 else "Female"}
- Heart Disease Risk: {risk_prob*100:.1f}% ({risk_level['level']})
- Risk Factors: {', '.join(risk_factors) if risk_factors else 'Minimal identified'}

Generate a BRIEF, personalized, and ACTIONABLE health recommendation (2-3 sentences max) that:
1. Acknowledges their specific risk factors
2. Provides 1-2 specific, measurable actions they can take TODAY
3. Includes motivation and hope

Format as friendly advice, not medical jargon. Be specific: e.g., "Walk 30 minutes daily" not "exercise more"."""

    try:
        if LLM_PROVIDER == 'openai' and OPENAI_API_KEY:
            return generate_with_openai(prompt)
        else:
            return generate_fallback_recommendation(user_data, risk_prob)
    except Exception as e:
        print(f"LLM Error: {e}")
        return generate_fallback_recommendation(user_data, risk_prob)

def generate_with_openai(prompt):
    """Call OpenAI API for recommendations"""
    headers = {
        'Authorization': f'Bearer {OPENAI_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'model': LLM_MODEL,
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.7,
        'max_tokens': 150
    }
    
    response = requests.post(
        'https://api.openai.com/v1/chat/completions',
        headers=headers,
        json=data,
        timeout=10
    )
    
    if response.status_code == 200:
        return response.json()['choices'][0]['message']['content']
    else:
        raise Exception(f"OpenAI API Error: {response.status_code}")

def generate_fallback_recommendation(user_data, prob):
    """Fallback recommendation when LLM is unavailable"""
    if prob > 0.7:
        if user_data.get('ExerciseAngina') == 1:
            return "⚠️ Chest pain during exercise is serious. Please schedule a cardiology appointment immediately and avoid strenuous activity until cleared by your doctor."
        return "🔴 Your risk is elevated. Focus on three things: (1) Reduce sodium intake below 2,300mg/day, (2) Start 30-minute daily walks, (3) Schedule a cardiology checkup within 2 weeks."
    elif prob > 0.5:
        return "🟡 Moderate risk detected. Start with lifestyle improvements: (1) Reduce processed foods, (2) Exercise 150 min/week, (3) Monitor blood pressure weekly at home."
    elif prob > 0.3:
        return "🟢 Low-moderate risk. Maintain health: (1) Continue regular exercise, (2) Keep cholesterol monitored, (3) Visit doctor annually for checkups."
    else:
        return "🟢 Good news! Your heart disease risk is low. Keep up healthy habits: maintain exercise, balanced diet, and annual health checkups."

@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Main prediction endpoint
    Expects JSON: { 'Age': 45, 'Sex': 1, 'ChestPainType': 2, ... }
    """
    try:
        user_data = request.json
        
        # Validate input
        if not user_data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Impute missing values
        imputed_data = impute_missing_data(user_data)
        
        # Create feature vector in correct order
        feature_vector = [imputed_data.get(feat, 0) for feat in feature_info['feature_names']]
        X = np.array([feature_vector])
        
        # Make prediction
        prediction = model.predict(X)[0]
        probability = model.predict_proba(X)[0][1]
        
        # Get risk level
        risk_info = get_risk_level(probability)
        
        # Generate LLM recommendations
        llm_recommendation = generate_lifestyle_recommendations_llm(
            user_data, probability, risk_info
        )
        
        return jsonify({
            'status': 'success',
            'prediction': int(prediction),
            'probability': float(probability),
            'risk_level': risk_info['level'],
            'emoji': risk_info['emoji'],
            'color': risk_info['color'],
            'recommendation': llm_recommendation,
            'timestamp': datetime.now().isoformat(),
            'imputed_fields': [k for k in feature_info['feature_names'] if k not in user_data]
        })
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'llm_configured': bool(OPENAI_API_KEY),
        'features': feature_info['feature_names'] if feature_info else []
    })

@app.route('/api/feature-info', methods=['GET'])
def get_feature_info():
    """Get feature information for frontend"""
    return jsonify(feature_info)

@app.route('/api/batch-predict', methods=['POST'])
def batch_predict():
    """
    Batch prediction endpoint
    Expects JSON: { 'patients': [{ 'Age': 45, ... }, { 'Age': 50, ... }] }
    """
    try:
        data = request.json
        patients = data.get('patients', [])
        
        results = []
        for patient_data in patients:
            imputed_data = impute_missing_data(patient_data)
            feature_vector = [imputed_data.get(feat, 0) for feat in feature_info['feature_names']]
            X = np.array([feature_vector])
            
            prediction = model.predict(X)[0]
            probability = model.predict_proba(X)[0][1]
            
            results.append({
                'patient_input': patient_data,
                'prediction': int(prediction),
                'probability': float(probability),
                'risk_level': get_risk_level(probability)['level']
            })
        
        return jsonify({
            'status': 'success',
            'count': len(results),
            'results': results
        })
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Heart Disease Prediction API...")
    print(f"📊 Model: XGBoost")
    print(f"🤖 LLM Provider: {LLM_PROVIDER}")
    print(f"💾 Features: {len(feature_info['feature_names']) if feature_info else 0}")
    app.run(debug=True, port=5000)
