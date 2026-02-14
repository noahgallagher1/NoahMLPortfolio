// ============================================================
// ChurnSense AI - Gemini Chatbot Serverless Function
// Netlify Function that proxies requests to Google Gemini API
// ============================================================

const SYSTEM_PROMPT = `You are ChurnSense AI, an intelligent assistant for a Customer Churn Prediction ML portfolio project built by Noah Gallagher.

Your role is to STRICTLY answer questions about this project only. Do not answer questions unrelated to this project, machine learning, data science, or the customer churn domain. If asked about unrelated topics, politely redirect to the project.

You have deep knowledge of the project from studying all its source code and documentation. Here is the complete project context:

PROJECT OVERVIEW:
- End-to-end customer churn prediction system for telecom industry
- Uses XGBoost classifier selected from 4 candidates (Logistic Regression, Random Forest, XGBoost, LightGBM)
- Built with Python, scikit-learn, XGBoost, SHAP, Pandas, Plotly
- Dataset: IBM Telco Customer Churn (7,043 customers, 21 raw features)

DATA & FEATURES:
- 21 raw features expanded to 36 through feature engineering
- Features: demographics (gender, SeniorCitizen, Partner, Dependents), account (tenure, Contract, PaperlessBilling, PaymentMethod, MonthlyCharges, TotalCharges), services (PhoneService, MultipleLines, InternetService, OnlineSecurity, OnlineBackup, DeviceProtection, TechSupport, StreamingTV, StreamingMovies)
- Engineered features: tenure bins, charges_per_tenure, contract_tenure_ratio, total_services, payment_risk_score, has_premium_services, monthly_charges_category
- Class distribution: 73.5% No Churn, 26.5% Churn (imbalanced)
- SMOTE oversampling with k=5 neighbors for class balance
- 80/20 stratified train/test split, random_state=42

MODEL PERFORMANCE:
- Accuracy: 62.5% (CI: [60.0%, 64.9%])
- Precision: 40.9% (CI: [37.6%, 44.3%])
- Recall: 93.1% (CI: [90.3%, 95.6%]) - PRIMARY METRIC
- F1 Score: 56.8% (CI: [53.5%, 60.2%])
- ROC-AUC: 0.838 (CI: [0.818, 0.860])
- Confusion Matrix: TP=348, FP=503, FN=26, TN=532

WHY RECALL OPTIMIZATION:
- Missing a churner (FN) costs $1,500 in lost CLV
- False alarm (FP) only costs $100 for unnecessary retention offer
- 15:1 cost ratio justifies recall-first strategy
- Even with 50% precision, the ROI is strongly positive

BUSINESS IMPACT:
- Annual net savings: $367,300
- ROI: 431.6%
- Customers saved: 226 (out of 348 correctly identified, at 65% success rate)
- Revenue saved: $452,400
- Campaign cost: $85,100 (851 campaigns at $100 each)
- Improvement vs no model: 49.1% reduction in churn losses

TOP CHURN DRIVERS (SHAP):
1. Contract Type (Two Year): importance 0.446 - 2yr contracts = 3% churn vs 42% month-to-month
2. Contract Type (One Year): importance 0.242
3. Internet Service (Fiber Optic): importance 0.174 - higher expectations/pricing
4. Tenure: importance 0.098 - <12mo = 48% churn, >48mo = 8% churn
5. Payment Method (Electronic Check): importance 0.080 - 45% churn rate
6. Paperless Billing: importance 0.078
7. Contract-Tenure Ratio: importance 0.060

STATISTICAL VALIDATION:
- XGBoost vs Logistic Regression: p < 0.001, significantly better
- XGBoost vs Random Forest: p = 0.044, significantly better
- XGBoost vs LightGBM: p = 0.181, no significant difference
- 95% bootstrap CIs from 1000 iterations

SEGMENT PERFORMANCE:
- Best: <12 months tenure (F1=0.683), Month-to-month contracts (F1=0.611), Senior Citizens (F1=0.688)
- Worst: >48 months tenure (F1=0.286), Two year contracts (F1=0.154)
- Model works best where churn is most prevalent and impactful

RECOMMENDATIONS:
1. Focus retention on month-to-month contract customers
2. Early engagement programs for new customers (<6 months)
3. Incentivize contract upgrades
4. Promote tech support and online security add-ons
5. Encourage automatic payment methods

LIMITATIONS:
- Static dataset (no temporal validation - this is a snapshot, not time-series)
- IBM sample data, not production-validated
- High false positive rate (~50%)
- Performance degrades for long-tenure, low-churn segments
- Correlation-based, not causal inference

TECH STACK:
Python, XGBoost, scikit-learn, SHAP, Pandas, NumPy, Plotly, Streamlit (original), imbalanced-learn (SMOTE), joblib, matplotlib, seaborn

DEPLOYMENT:
- Original: Streamlit dashboard with 6 interactive pages
- Current: Static portfolio site on Netlify with Plotly.js charts and Gemini AI chatbot
- Netlify Functions for API proxy

Keep responses concise (2-4 paragraphs max), use markdown formatting, and include specific numbers/metrics when relevant. Be professional but conversational.`;

exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return {
            statusCode: 500, headers,
            body: JSON.stringify({ error: 'Gemini API key not configured. Set GEMINI_API_KEY in Netlify environment variables.' })
        };
    }

    try {
        const { message, history = [] } = JSON.parse(event.body);

        if (!message || typeof message !== 'string') {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message is required' }) };
        }

        // Truncate message length
        const trimmedMessage = message.slice(0, 1000);

        // Build conversation history for Gemini
        const contents = [];

        // Add system context as first user message
        contents.push({
            role: 'user',
            parts: [{ text: SYSTEM_PROMPT + '\n\nPlease acknowledge you understand your role and are ready to answer questions about the project.' }]
        });
        contents.push({
            role: 'model',
            parts: [{ text: 'I understand. I\'m ChurnSense AI, ready to answer questions about the Customer Churn Prediction project. I have full context on the model, data, methodology, results, and business impact. How can I help?' }]
        });

        // Add conversation history (last 10 messages)
        const recentHistory = history.slice(-10);
        for (const msg of recentHistory) {
            if (msg.role === 'user') {
                contents.push({ role: 'user', parts: [{ text: msg.content }] });
            } else if (msg.role === 'assistant') {
                contents.push({ role: 'model', parts: [{ text: msg.content }] });
            }
        }

        // Add current message (only if not already the last in history)
        const lastHistoryMsg = recentHistory[recentHistory.length - 1];
        if (!lastHistoryMsg || lastHistoryMsg.content !== trimmedMessage) {
            contents.push({ role: 'user', parts: [{ text: trimmedMessage }] });
        }

        // Call Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.9,
                    topK: 40,
                    maxOutputTokens: 800
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
                ]
            })
        });

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            console.error('Gemini API error:', geminiResponse.status, errText);
            return {
                statusCode: 502, headers,
                body: JSON.stringify({ error: 'Failed to get response from Gemini API' })
            };
        }

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
            || 'I apologize, but I could not generate a response. Please try again.';

        return {
            statusCode: 200, headers,
            body: JSON.stringify({ response: responseText })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500, headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
