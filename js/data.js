// ============================================================
// ChurnSense AI - Pre-computed Data
// All data extracted from the ML pipeline outputs
// ============================================================

const DATA = {
    // --- Model Metrics ---
    metrics: {
        accuracy: { mean: 0.6246, ci_lower: 0.6004, ci_upper: 0.6494 },
        precision: { mean: 0.4092, ci_lower: 0.3756, ci_upper: 0.4426 },
        recall: { mean: 0.9308, ci_lower: 0.9032, ci_upper: 0.9558 },
        f1: { mean: 0.5678, ci_lower: 0.5349, ci_upper: 0.6018 },
        roc_auc: { mean: 0.8384, ci_lower: 0.8176, ci_upper: 0.8603 }
    },

    // --- Confusion Matrix ---
    confusionMatrix: {
        labels: ['Not Churned', 'Churned'],
        values: [[532, 503], [26, 348]],
        // TP=348, FP=503, FN=26, TN=532
    },

    // --- ROC Curve (approximated from known AUC=0.838) ---
    rocCurve: {
        fpr: [0, 0.01, 0.03, 0.05, 0.08, 0.12, 0.18, 0.25, 0.33, 0.42, 0.48, 0.55, 0.65, 0.75, 0.85, 0.93, 1.0],
        tpr: [0, 0.15, 0.32, 0.48, 0.60, 0.72, 0.80, 0.85, 0.88, 0.91, 0.93, 0.95, 0.97, 0.98, 0.99, 0.995, 1.0],
        auc: 0.838
    },

    // --- PR Curve (approximated from known metrics) ---
    prCurve: {
        recall: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.90, 0.93, 0.95, 1.0],
        precision: [1.0, 0.92, 0.85, 0.78, 0.72, 0.65, 0.58, 0.52, 0.47, 0.44, 0.42, 0.41, 0.39, 0.27]
    },

    // --- Feature Importance (SHAP) ---
    shapImportance: [
        { feature: 'Contract (Two Year)', value: 0.4458 },
        { feature: 'Contract (One Year)', value: 0.2424 },
        { feature: 'Internet: Fiber Optic', value: 0.1737 },
        { feature: 'Tenure', value: 0.0980 },
        { feature: 'Payment: E-Check', value: 0.0801 },
        { feature: 'Paperless Billing', value: 0.0776 },
        { feature: 'Contract-Tenure Ratio', value: 0.0601 },
        { feature: 'Streaming Movies', value: 0.0510 },
        { feature: 'Charges per Tenure', value: 0.0421 },
        { feature: 'Online Security', value: 0.0418 },
        { feature: 'Monthly Charges', value: 0.0278 },
        { feature: 'Total Charges', value: 0.0267 },
        { feature: 'Internet: None', value: 0.0251 },
        { feature: 'Dependents', value: 0.0174 },
        { feature: 'Online Backup', value: 0.0130 }
    ],

    // --- Model Importance (XGBoost native) ---
    modelImportance: [
        { feature: 'Contract (Two Year)', value: 0.3262 },
        { feature: 'Contract (One Year)', value: 0.1666 },
        { feature: 'Internet: Fiber Optic', value: 0.0702 },
        { feature: 'Streaming Movies', value: 0.0419 },
        { feature: 'Internet: None', value: 0.0325 },
        { feature: 'Tenure', value: 0.0291 },
        { feature: 'Contract-Tenure Ratio', value: 0.0264 },
        { feature: 'Charges Cat: Medium', value: 0.0257 },
        { feature: 'Charges Cat: Very High', value: 0.0250 },
        { feature: 'Payment: E-Check', value: 0.0241 },
        { feature: 'Paperless Billing', value: 0.0236 },
        { feature: 'Tenure Group: 2-3yr', value: 0.0198 },
        { feature: 'Online Security', value: 0.0166 },
        { feature: 'Device Protection', value: 0.0147 },
        { feature: 'Payment: Mailed Check', value: 0.0125 }
    ],

    // --- Baseline Comparison ---
    baselineComparison: [
        { model: 'XGBoost (Ours)', accuracy: 0.625, precision: 0.409, recall: 0.931, f1: 0.568, roc_auc: 0.838, isOurs: true },
        { model: 'Naive Majority', accuracy: 0.735, precision: 0, recall: 0, f1: 0, roc_auc: 0.5, isOurs: false },
        { model: 'Stratified Random', accuracy: 0.622, precision: 0.289, recall: 0.291, f1: 0.290, roc_auc: 0.516, isOurs: false },
        { model: 'Rule-Based', accuracy: 0.265, precision: 0.265, recall: 1.0, f1: 0.420, roc_auc: null, isOurs: false }
    ],

    // --- ROI Analysis ---
    roi: {
        tp: 348, fp: 503, fn: 26, tn: 532,
        totalCampaigns: 851,
        campaignCost: 85100,
        successRate: 0.65,
        customersSaved: 226,
        revenueSaved: 452400,
        netBenefit: 367300,
        roiPercent: 431.6,
        baselineLoss: 748000,
        modelLoss: 380700,
        improvement: 49.1
    },

    // --- ROI Sensitivity ---
    roiSensitivity: {
        clv: [
            { x: 1000, roi: 165.8, benefit: 141100 },
            { x: 1500, roi: 298.7, benefit: 254200 },
            { x: 2000, roi: 431.6, benefit: 367300 },
            { x: 2500, roi: 564.5, benefit: 480400 },
            { x: 3000, roi: 697.4, benefit: 593500 }
        ],
        campaignCost: [
            { x: 25, roi: 2026.4, benefit: 431125 },
            { x: 50, roi: 963.2, benefit: 409850 },
            { x: 75, roi: 608.8, benefit: 388575 },
            { x: 100, roi: 431.6, benefit: 367300 },
            { x: 150, roi: 254.4, benefit: 324750 }
        ],
        successRate: [
            { x: 0.4, roi: 227.1, benefit: 193300 },
            { x: 0.5, roi: 308.9, benefit: 262900 },
            { x: 0.65, roi: 431.6, benefit: 367300 },
            { x: 0.75, roi: 513.4, benefit: 436900 },
            { x: 0.85, roi: 595.2, benefit: 506500 }
        ]
    },

    // --- Segment Data ---
    segments: {
        contract: [
            { segment: 'Month-to-month', n: 773, churnRate: 0.4256, precision: 0.4409, recall: 0.9970, f1: 0.6114, fpr: 0.9369 },
            { segment: 'One year', n: 300, churnRate: 0.1200, precision: 0.2000, recall: 0.5000, f1: 0.2857, fpr: 0.2727 },
            { segment: 'Two year', n: 336, churnRate: 0.0268, precision: 0.1176, recall: 0.2222, f1: 0.1538, fpr: 0.0459 }
        ],
        tenure: [
            { segment: '<12 months', n: 446, churnRate: 0.4821, precision: 0.5236, recall: 0.9814, f1: 0.6828, fpr: 0.8312 },
            { segment: '12-24 months', n: 206, churnRate: 0.2913, precision: 0.3648, recall: 0.9667, f1: 0.5297, fpr: 0.6918 },
            { segment: '24-36 months', n: 163, churnRate: 0.2454, precision: 0.4138, recall: 0.9000, f1: 0.5669, fpr: 0.4146 },
            { segment: '36-48 months', n: 141, churnRate: 0.1702, precision: 0.2754, recall: 0.7917, f1: 0.4086, fpr: 0.4274 },
            { segment: '>48 months', n: 450, churnRate: 0.0778, precision: 0.1805, recall: 0.6857, f1: 0.2857, fpr: 0.2627 }
        ],
        charges: [
            { segment: 'Low (<$35)', n: 349, churnRate: 0.1203, precision: 0.3197, recall: 0.9286, f1: 0.4756, fpr: 0.2704 },
            { segment: 'Medium ($35-70)', n: 362, churnRate: 0.2431, precision: 0.3581, recall: 0.9318, f1: 0.5174, fpr: 0.5365 },
            { segment: 'High ($70-90)', n: 365, churnRate: 0.3890, precision: 0.5233, recall: 0.9507, f1: 0.6750, fpr: 0.5516 },
            { segment: 'Very High (>$90)', n: 333, churnRate: 0.3063, precision: 0.3802, recall: 0.9020, f1: 0.5349, fpr: 0.6494 }
        ],
        demographics: [
            { segment: 'Male', n: 722, churnRate: 0.2507, precision: 0.3871, recall: 0.9282, f1: 0.5463, fpr: 0.4917 },
            { segment: 'Female', n: 687, churnRate: 0.2809, precision: 0.4317, recall: 0.9326, f1: 0.5902, fpr: 0.4798 },
            { segment: 'Non-Senior', n: 1187, churnRate: 0.2325, precision: 0.3763, recall: 0.9094, f1: 0.5323, fpr: 0.4566 },
            { segment: 'Senior Citizen', n: 222, churnRate: 0.4414, precision: 0.5272, recall: 0.9898, f1: 0.6879, fpr: 0.7016 }
        ]
    },

    // --- What-If Simulator Weights (derived from SHAP importance) ---
    // These weights approximate the XGBoost model's feature contributions
    simulatorWeights: {
        baseChurnRate: 0.265, // population base rate
        features: {
            contract: {
                'Month-to-month': 0.30,
                'One year': -0.10,
                'Two year': -0.35
            },
            internet: {
                'No': -0.18,
                'DSL': -0.02,
                'Fiber optic': 0.12
            },
            tenure: { // per-month contribution (negative = less churn)
                slope: -0.005,
                intercept: 0.20
            },
            monthlyCharges: {
                slope: 0.002,
                intercept: -0.08
            },
            paymentMethod: {
                'Electronic check': 0.10,
                'Mailed check': 0.02,
                'Bank transfer (automatic)': -0.06,
                'Credit card (automatic)': -0.06
            },
            onlineSecurity: { 'Yes': -0.08, 'No': 0.04 },
            techSupport: { 'Yes': -0.06, 'No': 0.03 },
            paperlessBilling: { 'Yes': 0.06, 'No': -0.04 },
            seniorCitizen: { 'Yes': 0.08, 'No': -0.02 }
        }
    },

    // --- Scenarios for What-If ---
    scenarios: {
        'new-subscriber': {
            contract: 'Month-to-month', internet: 'Fiber optic',
            tenure: 3, monthlyCharges: 70,
            paymentMethod: 'Electronic check',
            onlineSecurity: 'No', techSupport: 'No',
            paperlessBilling: 'Yes', seniorCitizen: 'No'
        },
        'loyal-customer': {
            contract: 'Two year', internet: 'DSL',
            tenure: 60, monthlyCharges: 55,
            paymentMethod: 'Bank transfer (automatic)',
            onlineSecurity: 'Yes', techSupport: 'Yes',
            paperlessBilling: 'No', seniorCitizen: 'No'
        },
        'at-risk': {
            contract: 'Month-to-month', internet: 'Fiber optic',
            tenure: 8, monthlyCharges: 95,
            paymentMethod: 'Electronic check',
            onlineSecurity: 'No', techSupport: 'No',
            paperlessBilling: 'Yes', seniorCitizen: 'Yes'
        },
        'custom': {
            contract: 'Month-to-month', internet: 'Fiber optic',
            tenure: 12, monthlyCharges: 65,
            paymentMethod: 'Mailed check',
            onlineSecurity: 'No', techSupport: 'No',
            paperlessBilling: 'Yes', seniorCitizen: 'No'
        }
    },

    // --- Project Context (for chatbot) ---
    projectContext: `
PROJECT: Customer Churn Prediction & Explainability Dashboard
AUTHOR: Noah Gallagher
DATASET: IBM Telco Customer Churn (7,043 customers, 21 features)
MODEL: XGBoost classifier selected from 4 candidates (LogReg, RF, XGBoost, LightGBM)
OPTIMIZATION: Recall-optimized (cost-sensitive: missing a churner costs $1,500 vs $100 for false alarm)
KEY METRICS: Recall=93.1%, Precision=40.9%, F1=56.8%, ROC-AUC=0.838, Accuracy=62.5%
CONFUSION MATRIX: TP=348, FP=503, FN=26, TN=532 (test set of 1,409 customers)
BUSINESS IMPACT: $367,300 annual net savings, 431.6% ROI on retention campaigns
FEATURE ENGINEERING: 21 raw features expanded to 36 (tenure bins, charges per tenure, risk scores, service counts)
HANDLING IMBALANCE: SMOTE oversampling with k=5 neighbors
HYPERPARAMETER TUNING: RandomizedSearchCV, 20 iterations, 5-fold stratified CV
EXPLAINABILITY: SHAP TreeExplainer for global and per-prediction explanations
TOP CHURN DRIVERS: (1) Contract type - month-to-month=42% churn vs 3% for 2-year (2) Internet service - fiber optic users churn more (3) Tenure - new customers <12mo churn at 48% (4) Payment method - electronic check=45% churn (5) Paperless billing correlates with higher churn
LOW-RISK: 2-year contracts (3% churn), 60+ months tenure (7%), automatic payment (15%), multiple services (18%)
STATISTICAL VALIDATION: XGBoost significantly outperforms LogReg (p<0.001) and RF (p=0.044). No significant difference vs LightGBM (p=0.181).
CONFIDENCE INTERVALS (95% bootstrap, 1000 iterations): Recall [90.3%, 95.6%], ROC-AUC [0.818, 0.860]
ROI SENSITIVITY: Pessimistic scenario ROI=165.8% (CLV=$1000), Optimistic=697.4% (CLV=$3000)
SEGMENT PERFORMANCE: Best on new customers <12mo (F1=0.68), worst on loyal >48mo (F1=0.29). Best on month-to-month contracts (F1=0.61).
LIMITATIONS: Static dataset (no temporal validation), IBM sample data (not real production), high FPR for long-tenure segments, 50% false positive rate overall.
RECOMMENDATIONS: (1) Focus retention on month-to-month customers (2) Early engagement for <6mo tenure (3) Incentivize contract upgrades (4) Promote tech support/security add-ons (5) Encourage automatic payment
TECH STACK: Python, XGBoost, scikit-learn, SHAP, Pandas, Plotly, SMOTE/imbalanced-learn
DEPLOYMENT: Static portfolio site on Netlify with Gemini AI chatbot
`
};
