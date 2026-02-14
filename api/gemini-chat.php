<?php
// ============================================================
// ChurnSense AI - Gemini Chatbot PHP Proxy
// Replaces Netlify serverless function for Hostinger hosting
// ============================================================

require_once __DIR__ . '/config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$apiKey = GEMINI_API_KEY;
if (!$apiKey || $apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    http_response_code(500);
    echo json_encode(['error' => 'Gemini API key not configured. Update api/config.php with your key.']);
    exit;
}

$SYSTEM_PROMPT = <<<'PROMPT'
You are ChurnSense AI, an intelligent assistant for a Customer Churn Prediction ML portfolio project built by Noah Gallagher.

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

BUSINESS IMPACT:
- Annual net savings: $367,300
- ROI: 431.6%
- Customers saved: 226 (out of 348 correctly identified, at 65% success rate)
- Revenue saved: $452,400
- Campaign cost: $85,100 (851 campaigns at $100 each)

TOP CHURN DRIVERS (SHAP):
1. Contract Type (Two Year): importance 0.446
2. Contract Type (One Year): importance 0.242
3. Internet Service (Fiber Optic): importance 0.174
4. Tenure: importance 0.098
5. Payment Method (Electronic Check): importance 0.080
6. Paperless Billing: importance 0.078
7. Contract-Tenure Ratio: importance 0.060

STATISTICAL VALIDATION:
- XGBoost vs Logistic Regression: p < 0.001, significantly better
- XGBoost vs Random Forest: p = 0.044, significantly better
- XGBoost vs LightGBM: p = 0.181, no significant difference
- 95% bootstrap CIs from 1000 iterations

RECOMMENDATIONS:
1. Focus retention on month-to-month contract customers
2. Early engagement programs for new customers (<6 months)
3. Incentivize contract upgrades
4. Promote tech support and online security add-ons
5. Encourage automatic payment methods

LIMITATIONS:
- Static dataset (no temporal validation)
- IBM sample data, not production-validated
- High false positive rate (~50%)
- Correlation-based, not causal inference

Keep responses concise (2-4 paragraphs max), use markdown formatting, and include specific numbers/metrics when relevant. Be professional but conversational.
PROMPT;

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || empty($input['message']) || !is_string($input['message'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Message is required']);
        exit;
    }

    $message = mb_substr($input['message'], 0, 1000);
    $history = isset($input['history']) ? array_slice($input['history'], -10) : [];

    // Build conversation for Gemini
    $contents = [];

    // System context
    $contents[] = [
        'role' => 'user',
        'parts' => [['text' => $SYSTEM_PROMPT . "\n\nPlease acknowledge you understand your role and are ready to answer questions about the project."]]
    ];
    $contents[] = [
        'role' => 'model',
        'parts' => [['text' => "I understand. I'm ChurnSense AI, ready to answer questions about the Customer Churn Prediction project. I have full context on the model, data, methodology, results, and business impact. How can I help?"]]
    ];

    // Conversation history
    foreach ($history as $msg) {
        if ($msg['role'] === 'user') {
            $contents[] = ['role' => 'user', 'parts' => [['text' => $msg['content']]]];
        } elseif ($msg['role'] === 'assistant') {
            $contents[] = ['role' => 'model', 'parts' => [['text' => $msg['content']]]];
        }
    }

    // Current message
    $lastMsg = end($history);
    if (!$lastMsg || $lastMsg['content'] !== $message) {
        $contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];
    }

    // Call Gemini API
    $geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $apiKey;

    $payload = json_encode([
        'contents' => $contents,
        'generationConfig' => [
            'temperature' => 0.7,
            'topP' => 0.9,
            'topK' => 40,
            'maxOutputTokens' => 800
        ],
        'safetySettings' => [
            ['category' => 'HARM_CATEGORY_HARASSMENT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
            ['category' => 'HARM_CATEGORY_HATE_SPEECH', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
            ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
            ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE']
        ]
    ]);

    $ch = curl_init($geminiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT => 30
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        http_response_code(502);
        echo json_encode(['error' => 'Failed to connect to Gemini API']);
        exit;
    }

    if ($httpCode !== 200) {
        http_response_code(502);
        echo json_encode(['error' => 'Gemini API returned an error']);
        exit;
    }

    $data = json_decode($response, true);
    $responseText = $data['candidates'][0]['content']['parts'][0]['text']
        ?? 'I apologize, but I could not generate a response. Please try again.';

    echo json_encode(['response' => $responseText]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
