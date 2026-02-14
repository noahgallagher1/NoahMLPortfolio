// ============================================================
// ChurnSense AI - Gemini Chatbot with Comprehensive Knowledge Base
// ============================================================

const Chatbot = {
    history: [],
    messageCount: 0,
    maxMessages: 30,
    isOpen: false,
    isLoading: false,

    // ── Comprehensive Knowledge Base ──────────────────────────
    // Every entry: { patterns: [...], answer: '...', followUps: [...] }
    // followUps are { label, question } objects shown as clickable chips
    kb: [
        // ═══════════════════════════════════════════════════════
        // 1. MODEL SELECTION & TRAINING
        // ═══════════════════════════════════════════════════════
        {
            id: 'model_choice',
            patterns: ['what model', 'which model', 'model did you use', 'model was used', 'why xgboost', 'chose xgboost', 'choose xgboost', 'algorithm'],
            answer: '**XGBoost** (Extreme Gradient Boosting) was selected as the production model after evaluating 4 candidates:\n\n1. **Logistic Regression** — simple baseline\n2. **Random Forest** — ensemble of decision trees\n3. **XGBoost** — gradient-boosted trees (selected)\n4. **LightGBM** — fast gradient boosting\n\nXGBoost was chosen because it achieved the **highest recall (93.1%)** on the test set while maintaining a strong **ROC-AUC of 0.838**. Statistical testing confirmed it significantly outperforms Logistic Regression (p < 0.001) and Random Forest (p = 0.044). Its performance was comparable to LightGBM (p = 0.181), but XGBoost\'s wider ecosystem support gave it the edge.',
            followUps: [
                { label: 'How was it tuned?', question: 'How were the hyperparameters tuned?' },
                { label: 'Why not deep learning?', question: 'Why not use deep learning or neural networks?' },
                { label: 'Model comparison stats', question: 'Show me the statistical model comparison results' },
                { label: 'What is XGBoost?', question: 'What is XGBoost and how does it work?' }
            ]
        },
        {
            id: 'hyperparameter_tuning',
            patterns: ['hyperparameter', 'tuning', 'tuned', 'parameter search', 'grid search', 'random search'],
            answer: 'Hyperparameter tuning was performed using **RandomizedSearchCV** with:\n\n- **20 random parameter combinations** sampled from the search space\n- **5-fold stratified cross-validation** to preserve class ratios\n- **Recall as the scoring metric** (cost-sensitive optimization)\n\nThe search space included:\n- `n_estimators`: [100, 200, 300]\n- `max_depth`: [3, 5, 7, 9]\n- `learning_rate`: [0.01, 0.05, 0.1]\n- `subsample`: [0.8, 0.9, 1.0]\n- `colsample_bytree`: [0.8, 0.9, 1.0]\n- `scale_pos_weight`: [1, 2, 3]\n\nRandomizedSearchCV was preferred over exhaustive GridSearchCV because the full grid would require 2,916 fits — impractical for iterative development.',
            followUps: [
                { label: 'What is cross-validation?', question: 'What is cross-validation and why use 5-fold stratified?' },
                { label: 'Why optimize recall?', question: 'Why was recall chosen as the optimization metric?' },
                { label: 'Model performance', question: 'What are the final model performance metrics?' }
            ]
        },
        {
            id: 'why_not_deep_learning',
            patterns: ['deep learning', 'neural network', 'tabnet', 'why not neural', 'why not deep'],
            answer: 'Deep learning was **not used** in this version for several practical reasons:\n\n1. **Tabular data** — Tree-based models (XGBoost, LightGBM) consistently outperform neural networks on structured/tabular data in most benchmarks\n2. **Dataset size** — 7,043 samples is relatively small for deep learning to show an advantage\n3. **Interpretability** — SHAP\'s TreeExplainer gives exact, fast explanations for tree models. Neural network explanations are approximate and slower\n4. **Training time** — XGBoost trains in seconds vs. minutes/hours for neural networks\n\nThat said, **TabNet** and **MLP classifiers** are listed as future enhancements in the project roadmap.',
            followUps: [
                { label: 'What is SHAP?', question: 'What is SHAP and how does it work?' },
                { label: 'Future improvements', question: 'What future improvements are planned?' },
                { label: 'Model performance', question: 'What are the model performance metrics?' }
            ]
        },
        {
            id: 'what_is_xgboost',
            patterns: ['what is xgboost', 'how does xgboost work', 'explain xgboost', 'xgboost algorithm'],
            answer: '**XGBoost** (Extreme Gradient Boosting) is an optimized gradient boosting algorithm that builds an ensemble of decision trees sequentially.\n\n**How it works:**\n1. Starts with a simple prediction (e.g., the average churn rate)\n2. Builds a decision tree to predict the *errors* of the current model\n3. Adds that tree to the ensemble, weighted by a learning rate\n4. Repeats, each new tree correcting remaining errors\n\n**Why it\'s powerful for churn:**\n- Handles **mixed feature types** (categorical + numerical) well\n- Built-in **regularization** prevents overfitting\n- `scale_pos_weight` parameter handles **class imbalance** natively\n- Fast, parallelized training\n- Works well with the **36 engineered features** in this dataset',
            followUps: [
                { label: 'Feature engineering', question: 'What feature engineering was done?' },
                { label: 'Class imbalance', question: 'How was class imbalance handled?' },
                { label: 'What is SHAP?', question: 'What is SHAP and how does it work?' }
            ]
        },

        // ═══════════════════════════════════════════════════════
        // 2. DATA & FEATURES
        // ═══════════════════════════════════════════════════════
        {
            id: 'dataset',
            patterns: ['dataset', 'data source', 'where.*data', 'ibm telco', 'how many customers', 'how many features', 'data used', 'what data'],
            answer: 'The project uses the **IBM Telco Customer Churn** dataset:\n\n- **Source:** IBM Sample Datasets (GitHub)\n- **Size:** 7,043 customers\n- **Features:** 21 raw columns\n- **Target:** Binary — Churn (Yes/No)\n- **Class Distribution:** 73.5% retained, **26.5% churned** (imbalanced)\n\n**Feature categories:**\n- **Demographics (4):** gender, SeniorCitizen, Partner, Dependents\n- **Account Info (6):** tenure, Contract, PaperlessBilling, PaymentMethod, MonthlyCharges, TotalCharges\n- **Services (7):** PhoneService, MultipleLines, InternetService, OnlineSecurity, OnlineBackup, DeviceProtection, TechSupport, StreamingTV, StreamingMovies\n\nOne data quality issue was found: `TotalCharges` had 11 blank values (new customers with tenure=0), converted to numeric and handled.',
            followUps: [
                { label: 'Feature engineering', question: 'What feature engineering was done?' },
                { label: 'Class imbalance', question: 'How was class imbalance handled?' },
                { label: 'Train/test split', question: 'How was the data split for training and testing?' },
                { label: 'Churn rate breakdown', question: 'What is the churn rate by segment?' }
            ]
        },
        {
            id: 'feature_engineering',
            patterns: ['feature engineering', 'engineered features', 'features.*created', 'what features', '36 features', '21.*36'],
            answer: 'The original 21 features were expanded to **36 through feature engineering**:\n\n**Tenure-based:**\n- `tenure_group` — Binned into 6 groups: 0-1yr, 1-2yr, 2-3yr, 3-4yr, 4-5yr, 5-6yr\n\n**Revenue metrics:**\n- `charges_per_tenure` — MonthlyCharges / tenure (spending intensity)\n- `contract_tenure_ratio` — Captures how long into a contract a customer is\n\n**Service aggregation:**\n- `total_services` — Count of all subscribed services\n- `has_premium_services` — Flag for security/backup/support add-ons\n\n**Risk scoring:**\n- `payment_risk_score` — Based on payment method churn correlations\n- `monthly_charges_category` — Bucketed into Low/Medium/High/Very High\n\n**Encoding:**\n- One-hot encoding for categorical variables\n- StandardScaler normalization for numerical features\n\nAll transformations are applied consistently through a scikit-learn preprocessing pipeline saved as `preprocessor.joblib`.',
            followUps: [
                { label: 'Top churn drivers', question: 'What are the top churn drivers?' },
                { label: 'SHAP importance', question: 'How does SHAP measure feature importance?' },
                { label: 'What is the dataset?', question: 'Tell me about the dataset used' }
            ]
        },
        {
            id: 'class_imbalance',
            patterns: ['class imbalance', 'imbalance', 'smote', 'oversampling', 'undersampling', 'unbalanced'],
            answer: 'The dataset has a **26.5% churn rate** — a moderate class imbalance. This was addressed using **SMOTE** (Synthetic Minority Over-sampling Technique):\n\n- **Method:** SMOTE generates synthetic samples for the minority class (churners) by interpolating between existing minority samples and their k nearest neighbors\n- **Configuration:** `k_neighbors=5`, `sampling_strategy=\'auto\'` (equalizes classes)\n- **Applied only to training data** — the test set remains untouched to ensure honest evaluation\n\n**Why SMOTE over alternatives:**\n- Simple undersampling would discard 47% of the majority class data\n- Class weights alone don\'t always prevent the model from ignoring the minority class\n- SMOTE creates realistic synthetic examples rather than exact duplicates (unlike random oversampling)',
            followUps: [
                { label: 'What is SMOTE?', question: 'What is SMOTE exactly?' },
                { label: 'Model performance', question: 'What are the model performance metrics?' },
                { label: 'Why optimize recall?', question: 'Why was recall chosen over accuracy?' }
            ]
        },
        {
            id: 'train_test_split',
            patterns: ['train.*test.*split', 'split.*data', 'how.*split', '80.*20', 'test set', 'training set'],
            answer: 'The data was split using an **80/20 stratified split**:\n\n- **Training set:** 5,634 customers (80%)\n- **Test set:** 1,409 customers (20%)\n- **Stratification:** Preserves the 26.5% churn ratio in both sets\n- **Random state:** 42 (for full reproducibility)\n\nSMOTE oversampling is applied **only to the training set** after splitting. The test set is never touched during training — all reported metrics are on this held-out test set.\n\nAdditionally, **5-fold stratified cross-validation** is used during hyperparameter tuning to get robust performance estimates within the training data.',
            followUps: [
                { label: 'Cross-validation', question: 'What is cross-validation and why 5-fold stratified?' },
                { label: 'Confidence intervals', question: 'How were confidence intervals calculated?' },
                { label: 'Reproducibility', question: 'How is reproducibility ensured?' }
            ]
        },
        {
            id: 'churn_rate',
            patterns: ['churn rate', 'how many churn', 'percentage churn', 'base rate', '26.5'],
            answer: 'The overall **churn rate is 26.5%** (1,869 out of 7,043 customers).\n\n**Churn rate by key segments:**\n- Month-to-month contracts: **42.6%**\n- One-year contracts: **12.0%**\n- Two-year contracts: **2.7%**\n- Tenure < 12 months: **48.2%**\n- Tenure > 48 months: **7.8%**\n- Electronic check payment: **~45%**\n- Senior citizens: **44.1%**\n- Fiber optic internet: **~38%**\n\nThe stark differences across segments are what make the model valuable — it can identify *which* month-to-month customers are most likely to churn, enabling targeted rather than blanket retention campaigns.',
            followUps: [
                { label: 'Segment performance', question: 'How does the model perform by segment?' },
                { label: 'Top churn drivers', question: 'What are the top churn drivers?' },
                { label: 'Recommendations', question: 'What retention strategies are recommended?' }
            ]
        },

        // ═══════════════════════════════════════════════════════
        // 3. PERFORMANCE METRICS
        // ═══════════════════════════════════════════════════════
        {
            id: 'performance_metrics',
            patterns: ['performance', 'metric', 'how.*perform', 'accuracy', 'results', 'how good', 'how well'],
            answer: '**Model Performance (XGBoost on test set, n=1,409):**\n\n| Metric | Value | 95% CI |\n|--------|-------|--------|\n| **Recall** | **93.1%** | [90.3%, 95.6%] |\n| Precision | 40.9% | [37.6%, 44.3%] |\n| F1 Score | 56.8% | [53.5%, 60.2%] |\n| ROC-AUC | 0.838 | [0.818, 0.860] |\n| Accuracy | 62.5% | [60.0%, 64.9%] |\n\n**Confusion Matrix:** TP=348, FP=503, FN=26, TN=532\n\nThe model catches **348 out of 374 actual churners** (93.1%) while flagging 503 non-churners as false alarms. This trade-off is intentional — see why recall is prioritized.',
            followUps: [
                { label: 'Why low accuracy?', question: 'Why is accuracy only 62.5%?' },
                { label: 'Why optimize recall?', question: 'Why was recall chosen over accuracy?' },
                { label: 'Confusion matrix', question: 'Explain the confusion matrix' },
                { label: 'Confidence intervals', question: 'How were confidence intervals calculated?' }
            ]
        },
        {
            id: 'why_recall',
            patterns: ['why recall', 'why not accuracy', 'recall.*metric', 'optimize.*recall', 'cost.*sensitive', 'recall over', 'why low accuracy', 'accuracy.*low', 'accuracy.*62', 'only 62'],
            answer: 'The model was deliberately **optimized for recall over accuracy**. Here\'s the business reasoning:\n\n**Cost of errors:**\n- **False Negative** (missed churner): Costs **$1,500** in lost Customer Lifetime Value\n- **False Positive** (false alarm): Costs only **$100** for an unnecessary retention offer\n\nThat\'s a **15:1 cost ratio**, making it far better to over-flag than to miss churners.\n\n**Why 62.5% accuracy is actually fine:**\n- A naive "predict no one churns" model gets 73.5% accuracy but catches **zero** churners\n- Our model catches **93.1%** of churners while maintaining an ROC-AUC of 0.838\n- The 503 false positives cost $50,300, but the 348 true positives save $452,400\n- **Net ROI: 431.6%**\n\nAccuracy is a misleading metric for imbalanced classification. The real measure of value is the **net business impact**.',
            followUps: [
                { label: 'ROI breakdown', question: 'Explain the ROI analysis in detail' },
                { label: 'False positives', question: 'How are false positives handled?' },
                { label: 'What is ROC-AUC?', question: 'What is ROC-AUC and what does 0.838 mean?' }
            ]
        },
        {
            id: 'confusion_matrix',
            patterns: ['confusion matrix', 'tp.*fp', 'true positive', 'false positive', 'false negative', 'true negative'],
            answer: '**Confusion Matrix (test set, n=1,409):**\n\n```\n                Predicted No  |  Predicted Churn\nActual No:          532 (TN)  |     503 (FP)\nActual Churn:        26 (FN)  |     348 (TP)\n```\n\n**Reading the numbers:**\n- **348 True Positives (TP):** Correctly identified churners — these get retention offers\n- **532 True Negatives (TN):** Correctly identified loyal customers — no action needed\n- **503 False Positives (FP):** Loyal customers flagged as at-risk — they get an unnecessary offer ($100 each = $50,300 wasted)\n- **26 False Negatives (FN):** Missed churners — these leave without intervention ($1,500 each = $39,000 lost)\n\nThe high FP count is the cost of 93% recall. But at $100 per false alarm vs $1,500 per missed churner, the math strongly favors this trade-off.',
            followUps: [
                { label: 'ROI analysis', question: 'Explain the ROI analysis in detail' },
                { label: 'Why optimize recall?', question: 'Why was recall chosen over accuracy?' },
                { label: 'Baseline comparison', question: 'How does this compare to baseline models?' }
            ]
        },
        {
            id: 'roc_auc',
            patterns: ['roc', 'auc', 'roc-auc', 'roc auc', 'what.*roc', 'what.*auc', '0.838'],
            answer: '**ROC-AUC = 0.838** (95% CI: [0.818, 0.860])\n\n**What it means:**\n- The ROC curve plots True Positive Rate vs. False Positive Rate at every classification threshold\n- AUC (Area Under the Curve) summarizes this into a single number\n- **0.838 means:** if you pick a random churner and a random non-churner, the model correctly ranks the churner as higher risk **83.8% of the time**\n\n**How to interpret the scale:**\n- 0.5 = random guessing (coin flip)\n- 0.7–0.8 = acceptable\n- **0.8–0.9 = excellent (our model)**\n- 0.9+ = outstanding\n\nThe 95% confidence interval [0.818, 0.860] shows this metric is stable and not due to lucky sampling.',
            followUps: [
                { label: 'Precision-Recall curve', question: 'What about the Precision-Recall curve?' },
                { label: 'Confidence intervals', question: 'How were confidence intervals calculated?' },
                { label: 'Model comparison', question: 'How does XGBoost compare to other models?' }
            ]
        },
        {
            id: 'pr_curve',
            patterns: ['precision.*recall.*curve', 'pr curve', 'pr-curve'],
            answer: 'The **Precision-Recall curve** is especially important for imbalanced datasets like ours (26.5% churn).\n\nUnlike ROC which can look optimistic with class imbalance, the PR curve directly shows the trade-off between:\n- **Precision:** Of those flagged as churners, how many actually are?\n- **Recall:** Of all actual churners, how many did we catch?\n\nAt our chosen threshold:\n- Precision = 40.9% (about 4 in 10 flags are real churners)\n- Recall = 93.1% (we catch 93 out of 100 actual churners)\n\nMoving the threshold higher would increase precision but lower recall. The current threshold was chosen based on the **15:1 cost ratio** ($1,500 per missed churner vs. $100 per false alarm).',
            followUps: [
                { label: 'What is ROC-AUC?', question: 'What is ROC-AUC and what does 0.838 mean?' },
                { label: 'Why optimize recall?', question: 'Why was recall chosen over accuracy?' },
                { label: 'ROI analysis', question: 'Explain the ROI analysis in detail' }
            ]
        },
        {
            id: 'confidence_intervals',
            patterns: ['confidence interval', 'bootstrap', 'ci ', 'how confident', 'how reliable', 'statistical.*reliable'],
            answer: '**95% Bootstrap Confidence Intervals** (1,000 iterations):\n\n| Metric | Mean | Lower | Upper | Width |\n|--------|------|-------|-------|-------|\n| Recall | 93.1% | 90.3% | 95.6% | 5.3% |\n| Precision | 40.9% | 37.6% | 44.3% | 6.7% |\n| F1 | 56.8% | 53.5% | 60.2% | 6.7% |\n| ROC-AUC | 0.838 | 0.818 | 0.860 | 0.043 |\n| Accuracy | 62.5% | 60.0% | 64.9% | 4.9% |\n\n**How bootstrap works:** We resample the test set with replacement 1,000 times, compute metrics on each sample, and take the 2.5th and 97.5th percentiles.\n\nThe **narrow intervals** (especially for recall: 90.3%–95.6%) indicate the model\'s performance is stable and not an artifact of a particular test split.',
            followUps: [
                { label: 'Statistical validation', question: 'Tell me about the statistical model comparison' },
                { label: 'Model performance', question: 'What are the model performance metrics?' }
            ]
        },
        {
            id: 'model_comparison',
            patterns: ['model comparison', 'compare.*model', 'baseline', 'vs.*logistic', 'vs.*random forest', 'vs.*lightgbm', 'other model', 'statistical.*comparison', 'statistical.*valid', 't-test'],
            answer: '**Model Comparison (Paired t-tests on 5-fold CV ROC-AUC):**\n\n| Comparison | Mean Diff | p-value | Significant? |\n|------------|-----------|---------|-------------|\n| XGBoost vs Logistic Regression | 0.345 | < 0.001 | Yes |\n| XGBoost vs Random Forest | 0.002 | 0.044 | Yes |\n| XGBoost vs LightGBM | 0.002 | 0.181 | No |\n\n**Baseline comparisons:**\n- **Naive majority class:** 73.5% accuracy but 0% recall — catches no churners\n- **Stratified random:** 29.1% recall, 0.516 AUC — barely better than guessing\n- **Rule-based** (month-to-month + <12mo tenure): 100% recall but only 26.5% precision — flags everyone\n\nXGBoost significantly outperforms all baselines and simpler models. Its performance is statistically indistinguishable from LightGBM, but both dramatically outperform Logistic Regression.',
            followUps: [
                { label: 'What is p-value?', question: 'What does the p-value mean here?' },
                { label: 'Hyperparameter tuning', question: 'How were the hyperparameters tuned?' },
                { label: 'Why XGBoost?', question: 'Why was XGBoost chosen as the final model?' }
            ]
        },

        // ═══════════════════════════════════════════════════════
        // 4. SHAP & EXPLAINABILITY
        // ═══════════════════════════════════════════════════════
        {
            id: 'shap',
            patterns: ['shap', 'shapley', 'explain.*model', 'interpret', 'explainab', 'how.*explain', 'feature.*explain'],
            answer: '**SHAP (SHapley Additive exPlanations)** is used for model interpretability:\n\n**How it works:**\nSHAP is based on Shapley values from game theory. For each prediction, it calculates how much each feature **contributed** to pushing the prediction above or below the average.\n\n**What Noah implemented:**\n1. **Global explanations** — Mean |SHAP value| across all customers shows which features matter most overall\n2. **Local explanations** — Per-customer waterfall plots showing exactly why a specific customer was flagged\n3. **Feature dependence** — How feature values relate to their SHAP contribution\n\n**Key tool:** `shap.TreeExplainer` — specifically designed for tree-based models like XGBoost, giving **exact** (not approximate) SHAP values in polynomial time.\n\nTop SHAP feature: **Contract Type (Two Year)** with importance of 0.446.',
            followUps: [
                { label: 'Top features by SHAP', question: 'What are the top features by SHAP value?' },
                { label: 'Individual explanations', question: 'How are individual predictions explained?' },
                { label: 'SHAP vs feature importance', question: 'What is the difference between SHAP and model feature importance?' }
            ]
        },
        {
            id: 'shap_vs_importance',
            patterns: ['shap.*vs.*importance', 'difference.*shap.*importance', 'shap.*feature importance', 'model importance.*shap'],
            answer: '**SHAP values vs. native feature importance — key differences:**\n\n**XGBoost native importance** measures how often a feature is used in tree splits, weighted by the improvement in the objective function. It\'s fast but can be biased toward high-cardinality features.\n\n**SHAP importance** measures the average magnitude of each feature\'s impact on individual predictions. It\'s:\n- **Consistent** — if a feature\'s real effect increases, its SHAP value always increases\n- **Locally accurate** — SHAP values for a prediction sum to the difference between the prediction and the average\n- **Fair** — based on Shapley values, the only method satisfying all fairness axioms\n\n**In this project, both largely agree:** Contract type, Internet service, and Tenure are top 5 in both. But SHAP gives Tenure and Payment Method more credit because it captures non-linear interaction effects that split-count misses.',
            followUps: [
                { label: 'What is SHAP?', question: 'What is SHAP and how does it work?' },
                { label: 'Top SHAP features', question: 'What are the top features by SHAP value?' }
            ]
        },
        {
            id: 'individual_explanations',
            patterns: ['individual.*explain', 'single.*customer', 'waterfall', 'per.*prediction', 'local.*explain', 'why.*flagged'],
            answer: '**Individual prediction explanations** use SHAP waterfall plots:\n\nFor each customer, the model produces:\n1. A **churn probability** (e.g., 78%)\n2. A **ranked list of feature contributions** showing exactly how each feature pushed the risk up or down from the population average\n\n**Example for a high-risk customer:**\n- Base rate: 26.5%\n- Contract: Month-to-month → +22%\n- Internet: Fiber optic → +8%\n- Tenure: 3 months → +12%\n- Payment: Electronic check → +6%\n- Online Security: No → +4%\n- **Final prediction: 78% churn risk**\n\nThis transparency is critical for stakeholder trust — a CSR can explain to a manager exactly *why* the model flagged a particular account.',
            followUps: [
                { label: 'Try the simulator', question: 'How does the What-If simulator work?' },
                { label: 'What is SHAP?', question: 'What is SHAP and how does it work?' },
                { label: 'Recommendations', question: 'What retention strategies are recommended?' }
            ]
        },

        // ═══════════════════════════════════════════════════════
        // 5. CHURN DRIVERS & INSIGHTS
        // ═══════════════════════════════════════════════════════
        {
            id: 'top_drivers',
            patterns: ['top.*driver', 'top.*feature', 'churn driver', 'what drives', 'what causes', 'why.*churn', 'most important', 'biggest factor', 'main.*factor'],
            answer: 'The **top churn drivers** identified by SHAP analysis (mean |SHAP value|):\n\n1. **Contract Type — Two Year** (0.446) — 2-year contracts have just 3% churn vs. 42% for month-to-month\n2. **Contract Type — One Year** (0.242) — also protective but less so\n3. **Internet Service — Fiber Optic** (0.174) — fiber users churn more, likely due to higher pricing and expectations\n4. **Tenure** (0.098) — new customers (<12mo) churn at 48%; after 4+ years it drops to 8%\n5. **Payment Method — Electronic Check** (0.080) — 45% churn rate, suggesting lower engagement\n6. **Paperless Billing** (0.078) — correlated with digital-first users who compare and switch more easily\n7. **Contract-Tenure Ratio** (0.060) — engineered feature capturing how deep into a contract cycle a customer is\n\n**Key insight:** Contract type alone explains more churn variance than all other features combined.',
            followUps: [
                { label: 'Contract type detail', question: 'Why does contract type matter so much?' },
                { label: 'Tenure impact', question: 'How does tenure affect churn risk?' },
                { label: 'Payment method', question: 'Why do electronic check users churn more?' },
                { label: 'Recommendations', question: 'What retention strategies are recommended?' }
            ]
        },
        {
            id: 'contract_type',
            patterns: ['contract type', 'month.*month', 'two year', 'one year', 'annual contract', 'why.*contract'],
            answer: '**Contract type is the #1 churn predictor:**\n\n| Contract | Churn Rate | Model F1 |\n|----------|-----------|----------|\n| Month-to-month | **42.6%** | 0.611 |\n| One year | 12.0% | 0.286 |\n| Two year | 2.7% | 0.154 |\n\n**Why it matters so much:**\n- Month-to-month customers face **zero switching cost** — they can leave any time\n- Annual/two-year contracts create a **commitment barrier** and often come with discounts\n- The model performs best on month-to-month (F1=0.611) because there\'s enough churn signal to learn from\n\n**Business implication:** The single most impactful retention action is **incentivizing contract upgrades**. Even moving a customer from month-to-month to one-year cuts churn risk by 72%.',
            followUps: [
                { label: 'Retention strategies', question: 'What retention strategies are recommended?' },
                { label: 'Segment performance', question: 'How does the model perform by segment?' },
                { label: 'Top churn drivers', question: 'What are the top churn drivers?' }
            ]
        },
        {
            id: 'tenure_impact',
            patterns: ['tenure', 'how long.*customer', 'new customer', 'loyal customer', 'customer age', 'months.*customer'],
            answer: '**Customer tenure has a dramatic effect on churn:**\n\n| Tenure | Churn Rate | Model F1 |\n|--------|-----------|----------|\n| <12 months | **48.2%** | **0.683** |\n| 12–24 months | 29.1% | 0.530 |\n| 24–36 months | 24.5% | 0.567 |\n| 36–48 months | 17.0% | 0.409 |\n| >48 months | 7.8% | 0.286 |\n\n**Key insights:**\n- Nearly **half** of customers under 1 year churn — the onboarding period is critical\n- After 4+ years, churn drops to under 8% — these are committed customers\n- The model performs best on new customers (F1=0.683) where intervention has the highest ROI\n\n**Implication:** Early engagement programs in the first 3–6 months can have outsized impact on retention.',
            followUps: [
                { label: 'Early engagement', question: 'What early engagement strategies work?' },
                { label: 'Contract type', question: 'How does contract type affect churn?' },
                { label: 'Monthly charges', question: 'How do monthly charges relate to churn?' }
            ]
        },
        {
            id: 'payment_method',
            patterns: ['payment method', 'electronic check', 'automatic payment', 'credit card', 'bank transfer', 'mailed check'],
            answer: '**Payment method is a strong churn signal:**\n\n- **Electronic check:** ~45% churn rate — highest risk\n- **Mailed check:** ~35% churn rate\n- **Bank transfer (automatic):** ~15% churn rate\n- **Credit card (automatic):** ~15% churn rate\n\n**Why electronic check = high risk:**\n- Requires manual action each month — less "sticky"\n- Often chosen by customers who are less committed or comparing options\n- No automatic renewal barrier\n\n**Automatic payments** (bank/credit card) create friction against cancellation and signal higher customer engagement.\n\nSHAP importance for electronic check: **0.080** (5th most important feature).',
            followUps: [
                { label: 'Top churn drivers', question: 'What are the top churn drivers?' },
                { label: 'Recommendations', question: 'What retention strategies are recommended?' }
            ]
        },

        // ═══════════════════════════════════════════════════════
        // 6. BUSINESS IMPACT & ROI
        // ═══════════════════════════════════════════════════════
        {
            id: 'roi_analysis',
            patterns: ['roi', 'return on investment', 'business impact', 'saving', 'net benefit', 'cost.*benefit', 'how much.*save', 'business value', '431', '367'],
            answer: '**ROI Analysis — Full Cost-Benefit Breakdown:**\n\n**Assumptions:**\n- Customer Lifetime Value (CLV): $2,000\n- Retention campaign cost: $100/customer\n- Campaign success rate: 65%\n- Churn cost: $1,500 per lost customer\n\n**Results:**\n- **True Positives:** 348 correctly flagged churners\n- **Campaigns sent:** 851 (348 TP + 503 FP)\n- **Campaign cost:** $85,100 (851 x $100)\n- **Customers saved:** 226 (348 x 65%)\n- **Revenue saved:** $452,400 (226 x $2,000)\n- **Net benefit:** $367,300 ($452,400 - $85,100)\n- **ROI:** 431.6%\n\n**vs. No-model baseline:**\n- Without model: $748,000 in churn losses\n- With model: $380,700 in losses\n- **49.1% improvement**',
            followUps: [
                { label: 'Sensitivity analysis', question: 'What happens under different ROI assumptions?' },
                { label: 'What is CLV?', question: 'What is Customer Lifetime Value?' },
                { label: 'False positive cost', question: 'How are false positives handled?' }
            ]
        },
        {
            id: 'roi_sensitivity',
            patterns: ['sensitivity', 'pessimistic', 'optimistic', 'what if.*clv', 'different assumption', 'how robust.*roi', 'vary'],
            answer: '**ROI Sensitivity Analysis — How robust are the results?**\n\n**Varying CLV ($1,000–$3,000):**\n- CLV $1,000: ROI = 165.8%, Net = $141K\n- CLV $1,500: ROI = 298.7%, Net = $254K\n- **CLV $2,000: ROI = 431.6%, Net = $367K** (base case)\n- CLV $2,500: ROI = 564.5%, Net = $480K\n- CLV $3,000: ROI = 697.4%, Net = $594K\n\n**Varying campaign cost ($25–$150):**\n- $25/campaign: ROI = 2,026%\n- **$100/campaign: ROI = 431.6%** (base case)\n- $150/campaign: ROI = 254.4%\n\n**Varying success rate (40%–85%):**\n- 40% success: ROI = 227.1%\n- **65% success: ROI = 431.6%** (base case)\n- 85% success: ROI = 595.2%\n\n**Even in the most pessimistic scenario** (CLV=$1,000, $150/campaign, 40% success), ROI remains strongly positive.',
            followUps: [
                { label: 'ROI breakdown', question: 'Explain the ROI analysis in detail' },
                { label: 'False positives', question: 'How are false positives handled?' }
            ]
        },
        {
            id: 'clv',
            patterns: ['clv', 'customer lifetime value', 'lifetime value', '\\$2,?000'],
            answer: '**Customer Lifetime Value (CLV)** is the total revenue a business can expect from a single customer over the entire relationship.\n\nIn this project:\n- **CLV = $2,000** (industry standard for telecom)\n- **Churn cost = $1,500** (CLV minus re-acquisition cost of $500)\n- **Retention campaign cost = $100** per customer contacted\n\nThese are standard telecom industry assumptions. The sensitivity analysis tests CLV from $1,000 to $3,000 to ensure the ROI conclusion is robust across different business contexts.',
            followUps: [
                { label: 'ROI analysis', question: 'Explain the ROI analysis in detail' },
                { label: 'Sensitivity analysis', question: 'What happens under different ROI assumptions?' }
            ]
        },
        {
            id: 'false_positives',
            patterns: ['false positive', 'unnecessary campaign', 'flagged wrong', 'over.*flag', 'too many flag', '503'],
            answer: '**Addressing the 503 false positives:**\n\nYes, the model flags 503 non-churners incorrectly. But this is a **deliberate design choice:**\n\n**Cost math:**\n- 503 false positives x $100/campaign = **$50,300 wasted**\n- 26 false negatives x $1,500/lost customer = **$39,000 lost**\n- 348 true positives x $2,000 CLV x 65% saved = **$452,400 saved**\n\nThe $50,300 in wasted campaigns is a **small insurance premium** for capturing $452,400 in at-risk revenue.\n\n**Moreover,** false positive campaigns aren\'t truly wasted — sending a loyalty offer to a satisfied customer can:\n- Strengthen the relationship\n- Increase NPS\n- Drive upsells\n\nThe real cost of a false positive is closer to $50–75 when accounting for goodwill benefits.',
            followUps: [
                { label: 'Why optimize recall?', question: 'Why was recall chosen over accuracy?' },
                { label: 'ROI breakdown', question: 'Explain the ROI analysis in detail' }
            ]
        },

        // ═══════════════════════════════════════════════════════
        // 7. SEGMENTS
        // ═══════════════════════════════════════════════════════
        {
            id: 'segment_performance',
            patterns: ['segment', 'performance by', 'how.*model.*perform.*by', 'where.*struggle', 'where.*best', 'where.*worst'],
            answer: '**Model performance varies significantly by segment:**\n\n**Best performance (high-churn segments):**\n- Senior Citizens: F1 = **0.688**, churn rate 44.1%\n- <12 months tenure: F1 = **0.683**, churn rate 48.2%\n- High charges ($70-90): F1 = **0.675**, churn rate 38.9%\n- Month-to-month: F1 = **0.611**, churn rate 42.6%\n\n**Worst performance (low-churn segments):**\n- Two-year contracts: F1 = **0.154**, churn rate 2.7%\n- >48 months tenure: F1 = **0.286**, churn rate 7.8%\n- One-year contracts: F1 = **0.286**, churn rate 12.0%\n\n**Pattern:** The model excels where it matters most — high-churn segments where intervention has the greatest business value. It struggles with low-churn segments because there are too few positive examples to learn from.',
            followUps: [
                { label: 'Contract segments', question: 'How does contract type affect churn?' },
                { label: 'Tenure segments', question: 'How does tenure affect churn risk?' },
                { label: 'Demographic bias?', question: 'Is there gender or age bias in the model?' }
            ]
        },
        {
            id: 'demographic_bias',
            patterns: ['bias', 'gender', 'age', 'senior', 'fairness', 'discriminat'],
            answer: '**Demographic analysis:**\n\n**Gender:**\n- Male: F1=0.546, churn rate 25.1%\n- Female: F1=0.590, churn rate 28.1%\n- The model performs comparably across genders with a slight difference in base rates\n\n**Age (Senior Citizen):**\n- Non-senior: F1=0.532, churn rate 23.3%\n- Senior: F1=0.688, churn rate **44.1%**\n- Senior citizens have significantly higher churn and the model captures this well\n\n**Important caveat:** The higher flagging rate for seniors reflects a genuine actuarial difference in churn behavior, not a bias in the model. However, care should be taken that retention actions don\'t inadvertently discriminate — offers should be equally attractive regardless of age.',
            followUps: [
                { label: 'Limitations', question: 'What are the project limitations?' },
                { label: 'Segment performance', question: 'How does the model perform by segment?' }
            ]
        },

        // ═══════════════════════════════════════════════════════
        // 8. RECOMMENDATIONS
        // ═══════════════════════════════════════════════════════
        {
            id: 'recommendations',
            patterns: ['recommend', 'retention', 'what.*do', 'action', 'strategy', 'how.*reduce', 'intervention', 'prevent churn'],
            answer: '**Data-driven retention recommendations:**\n\n1. **Incentivize contract upgrades** — Offer discounts for month-to-month customers to switch to annual plans. This alone could reduce churn from 42% to 12%.\n\n2. **Early engagement programs** — Launch targeted onboarding for customers in months 1–6. New customers (<12mo) churn at 48%; a welcome series, check-in calls, and early value demonstration can build habits.\n\n3. **Promote protective add-ons** — Online Security and Tech Support subscribers churn significantly less. Free trials of these services can increase stickiness.\n\n4. **Payment method migration** — Encourage electronic check users (~45% churn) to switch to automatic payments (~15% churn). Offer a small discount for autopay enrollment.\n\n5. **Fiber optic satisfaction** — Investigate why fiber users churn more. Possible causes: pricing expectations, service quality, or competition.',
            followUps: [
                { label: 'A/B testing plan', question: 'How would you validate these recommendations?' },
                { label: 'ROI of interventions', question: 'Explain the ROI analysis in detail' },
                { label: 'Top churn drivers', question: 'What are the top churn drivers?' }
            ]
        },
        {
            id: 'ab_testing',
            patterns: ['a/b test', 'ab test', 'experiment', 'validate.*recommend', 'how.*test', 'prove.*works'],
            answer: '**A/B Test Plan** (included in the project documentation):\n\n**Design:**\n- **Sample size:** 2,700 high-risk customers (power analysis: 80% power, alpha=0.05)\n- **Control group:** Standard treatment (no intervention)\n- **Treatment group:** Model-recommended retention offers\n- **Randomization:** Stratified by contract type and tenure\n\n**Primary metric:** 30-day churn rate\n**Secondary metrics:** 90-day retention, NPS change, upsell rate\n\n**Expected outcome:** Based on industry benchmarks, a well-targeted retention campaign should reduce churn by 15–25% in the treatment group.\n\n**Duration:** 3–6 months to capture full contract renewal cycles.',
            followUps: [
                { label: 'Recommendations', question: 'What retention strategies are recommended?' },
                { label: 'Limitations', question: 'What are the project limitations?' }
            ]
        },

        // ═══════════════════════════════════════════════════════
        // 9. LIMITATIONS & FUTURE WORK
        // ═══════════════════════════════════════════════════════
        {
            id: 'limitations',
            patterns: ['limitation', 'weakness', 'shortcoming', 'caveat', 'what.*wrong', 'problem.*model', 'issue', 'concern'],
            answer: '**Known limitations (documented transparently):**\n\n1. **No temporal validation** — The dataset is a static snapshot, not time-series. We can\'t validate that patterns hold over changing business conditions.\n\n2. **High false positive rate (~50%)** — 503 of 851 flagged customers are non-churners. Acceptable given cost ratios, but room to improve precision.\n\n3. **Segment performance gaps** — F1 drops to 0.15–0.29 for long-tenure, low-churn segments. The model is less useful for loyal customers.\n\n4. **IBM sample data** — Not production-validated. Real-world deployment would require retraining on actual company data.\n\n5. **No causal inference** — All findings are correlational. Contract type *correlates* with low churn but we can\'t prove it *causes* retention without an experiment.\n\n6. **Missing features** — No customer interaction data (calls, complaints, app usage) which could significantly improve predictions.',
            followUps: [
                { label: 'Future improvements', question: 'What future improvements are planned?' },
                { label: 'A/B testing', question: 'How would you validate the recommendations?' },
                { label: 'False positives', question: 'How are false positives handled?' }
            ]
        },
        {
            id: 'future_work',
            patterns: ['future', 'improve', 'next step', 'roadmap', 'what.*next', 'enhance', 'version 2'],
            answer: '**Planned improvements and future work:**\n\n**Modeling:**\n- **TabNet / MLP classifiers** — explore neural architectures for tabular data\n- **Uplift modeling** — predict who will respond to retention offers (not just who will churn)\n- **Online learning** — continuously update the model with new data\n\n**Data:**\n- **Temporal validation** — time-based train/test splits once time-series data is available\n- **Additional features** — call center interactions, app usage, complaint history, NPS scores\n- **Causal inference** — instrumental variables or propensity score matching for treatment effects\n\n**Engineering:**\n- **REST API** — real-time prediction endpoint (FastAPI)\n- **Docker containerization** — reproducible deployment\n- **CI/CD pipeline** — automated retraining and evaluation\n- **Model monitoring** — detect concept drift in production\n\n**UX:**\n- **Email alerting** — automated notifications for newly flagged high-risk customers',
            followUps: [
                { label: 'Limitations', question: 'What are the current limitations?' },
                { label: 'Tech stack', question: 'What technology stack was used?' }
            ]
        },

        // ═══════════════════════════════════════════════════════
        // 10. TECHNICAL IMPLEMENTATION
        // ═══════════════════════════════════════════════════════
        {
            id: 'tech_stack',
            patterns: ['tech stack', 'technology', 'tools used', 'libraries', 'framework', 'built with', 'what.*tech', 'stack'],
            answer: '**Technology stack:**\n\n**Data Science:**\n- Python 3.10+\n- Pandas & NumPy — data manipulation\n- scikit-learn — preprocessing, model evaluation, CV\n- XGBoost — gradient boosting classifier\n- LightGBM — alternative model\n- imbalanced-learn — SMOTE\n- SHAP — model explainability\n\n**Visualization:**\n- Plotly — interactive charts\n- Matplotlib & Seaborn — static figures\n\n**Web / Deployment:**\n- HTML, CSS, JavaScript — portfolio front-end\n- Plotly.js — interactive browser charts\n- Netlify — static hosting (free tier)\n- Netlify Functions — serverless API for Gemini chatbot\n- Google Gemini API — AI assistant\n\n**Code Quality:**\n- Type hints throughout\n- Google-style docstrings\n- Logging (not print statements)\n- joblib — model serialization',
            followUps: [
                { label: 'Code organization', question: 'How is the code organized?' },
                { label: 'Reproducibility', question: 'How is reproducibility ensured?' },
                { label: 'Deployment', question: 'How was this deployed?' }
            ]
        },
        {
            id: 'code_organization',
            patterns: ['code.*organiz', 'project structure', 'file structure', 'modules', 'pipeline', 'architecture', 'src/'],
            answer: '**Project structure (modular Python pipeline):**\n\n```\nsrc/\n├── config.py          — Centralized configuration & constants\n├── download_data.py   — Data acquisition from IBM GitHub\n├── data_processing.py — Feature engineering & preprocessing\n├── model_training.py  — Multi-model training + tuning\n├── model_evaluation.py — Metrics, baselines, ROI analysis\n├── explainability.py  — SHAP analysis & visualization\nmodels/                — Saved model artifacts (.joblib)\noutputs/reports/       — CSV/TXT evaluation reports\noutputs/figures/       — SHAP visualization PNGs\nnotebooks/             — EDA and threshold analysis\nrun_pipeline.py        — Main orchestrator\napp.py                 — Original Streamlit dashboard\n```\n\n**Design principles:**\n- Each module has a single responsibility\n- All paths managed via `config.py` (no hardcoded paths)\n- Pipeline steps can run independently via CLI flags\n- Comprehensive error handling and logging',
            followUps: [
                { label: 'Tech stack', question: 'What technology stack was used?' },
                { label: 'Reproducibility', question: 'How is reproducibility ensured?' }
            ]
        },
        {
            id: 'reproducibility',
            patterns: ['reproduc', 'replicate', 'random.*seed', 'deterministic'],
            answer: '**Reproducibility measures:**\n\n- **Random seed = 42** set globally for NumPy, scikit-learn, XGBoost, and data splitting\n- **Fixed stratified 80/20 split** ensures same train/test sets\n- **Saved artifacts:** model (`best_model.joblib`), preprocessor, feature names, SHAP objects — all serialized with joblib\n- **Pinned dependencies** in `requirements.txt` with minimum versions\n- **Documented pipeline** — `run_pipeline.py` executes all steps in order\n- **Git version control** with full commit history\n\n**To reproduce from scratch:**\n```bash\ngit clone <repo>\npip install -r requirements.txt\npython run_pipeline.py\n```\n\nExpected runtime: 15–30 minutes (including hyperparameter tuning).',
            followUps: [
                { label: 'Code organization', question: 'How is the code organized?' },
                { label: 'Tech stack', question: 'What technology stack was used?' }
            ]
        },
        {
            id: 'deployment',
            patterns: ['deploy', 'how.*hosted', 'netlify', 'how.*serve', 'production'],
            answer: '**Deployment architecture:**\n\n**Original:** Streamlit dashboard — great for prototyping but requires a running Python server\n\n**Current (this site):** Static portfolio site on **Netlify** (free tier)\n- All ML results pre-computed and embedded as JavaScript data\n- Interactive charts rendered client-side with Plotly.js\n- What-If simulator uses SHAP-derived weights (no server needed)\n- AI chatbot proxied through Netlify Functions → Google Gemini API\n\n**Why static over Streamlit for a portfolio:**\n- Free hosting (no server costs)\n- Instant load times (no Python boot-up)\n- Custom design (not limited to Streamlit\'s layout)\n- Always available (no cold starts)',
            followUps: [
                { label: 'What-If simulator', question: 'How does the What-If simulator work?' },
                { label: 'Tech stack', question: 'What technology stack was used?' }
            ]
        },
        {
            id: 'simulator_how',
            patterns: ['simulator.*work', 'what.*if.*work', 'how.*simulator', 'client.*side.*model', 'how.*predict.*browser'],
            answer: '**How the What-If Simulator works:**\n\nSince the full XGBoost model can\'t run in a browser, the simulator uses a **SHAP-derived weight approximation:**\n\n1. **Feature weights** were extracted from the SHAP importance values and calibrated against known segment churn rates\n2. **Each feature value** has an assigned contribution (e.g., Month-to-month = +0.30, Two year = -0.35)\n3. Contributions are combined in **logit space** and passed through a sigmoid function\n4. The result approximates the XGBoost prediction for common feature combinations\n\n**Scenario presets** let you instantly see typical profiles:\n- **New Subscriber** — high risk (month-to-month, fiber, 3 months tenure)\n- **Loyal Customer** — low risk (two-year, DSL, 60 months tenure)\n- **At-Risk User** — very high risk (month-to-month, fiber, electronic check, senior)\n\nThe contributing factors chart shows which features drive the prediction up or down.',
            followUps: [
                { label: 'Top churn drivers', question: 'What are the top churn drivers?' },
                { label: 'Individual explanations', question: 'How are individual predictions explained?' }
            ]
        },

        // ═══════════════════════════════════════════════════════
        // 11. DEFINITIONS / GLOSSARY
        // ═══════════════════════════════════════════════════════
        {
            id: 'def_churn',
            patterns: ['what is churn', 'define churn', 'churn mean', 'churn definition'],
            answer: '**Customer churn** (also called attrition) is when a customer stops doing business with a company — in telecom, this means canceling their service.\n\nIn this dataset, churn is a **binary variable:** Yes (customer left) or No (customer stayed). The overall churn rate is **26.5%**, meaning about 1 in 4 customers left during the observation period.\n\nChurn is costly because acquiring a new customer costs 5–7x more than retaining an existing one. That\'s why predicting churn early enables targeted retention before the customer decides to leave.',
            followUps: [
                { label: 'Churn rate by segment', question: 'What is the churn rate by segment?' },
                { label: 'Why does churn matter?', question: 'Explain the ROI analysis in detail' }
            ]
        },
        {
            id: 'def_recall_precision',
            patterns: ['what is recall', 'what is precision', 'define recall', 'define precision', 'recall.*mean', 'precision.*mean', 'what is f1', 'f1.*mean'],
            answer: '**Key classification metrics explained:**\n\n**Recall** (Sensitivity/TPR) = TP / (TP + FN)\n*Of all actual churners, what % did we catch?*\nOurs: **93.1%** — we catch 348 out of 374 churners\n\n**Precision** (PPV) = TP / (TP + FP)\n*Of those we flagged as churners, what % actually are?*\nOurs: **40.9%** — about 4 in 10 flags are real\n\n**F1 Score** = harmonic mean of Precision and Recall\n*Balanced summary of both*\nOurs: **56.8%**\n\n**The trade-off:** Increasing recall (catching more churners) inevitably decreases precision (more false alarms). The right balance depends on the **cost ratio** — here, 15:1 favoring recall.',
            followUps: [
                { label: 'Why optimize recall?', question: 'Why was recall chosen over accuracy?' },
                { label: 'What is ROC-AUC?', question: 'What is ROC-AUC and what does 0.838 mean?' },
                { label: 'Confusion matrix', question: 'Explain the confusion matrix' }
            ]
        },
        {
            id: 'def_smote',
            patterns: ['what is smote', 'smote mean', 'define smote', 'smote work'],
            answer: '**SMOTE** (Synthetic Minority Over-sampling Technique) is a method for handling class imbalance:\n\n**The problem:** With only 26.5% churners, models tend to predict "no churn" for everyone because it\'s right 73.5% of the time.\n\n**How SMOTE works:**\n1. Pick a minority class sample (a churner)\n2. Find its k nearest minority neighbors (k=5 in our case)\n3. Pick one neighbor at random\n4. Create a **synthetic sample** at a random point between the two\n5. Repeat until classes are balanced\n\n**Key detail:** SMOTE is applied **only to the training set** after the train/test split. The test set stays untouched to give honest performance estimates.\n\nThis is better than simple duplication (which causes overfitting) or undersampling (which throws away data).',
            followUps: [
                { label: 'Class imbalance', question: 'How was class imbalance handled?' },
                { label: 'Model performance', question: 'What are the model performance metrics?' }
            ]
        },
        {
            id: 'def_cross_validation',
            patterns: ['what is cross.*valid', 'cross.*valid.*mean', 'k.*fold', '5.*fold', 'stratified.*fold'],
            answer: '**5-Fold Stratified Cross-Validation:**\n\n**What it does:**\n1. Splits the training data into 5 equal parts (folds)\n2. Trains the model on 4 folds, evaluates on the 5th\n3. Repeats 5 times, each fold serving as the test set once\n4. Reports the **average** performance across all 5 runs\n\n**Why "stratified":** Each fold preserves the same churn ratio (26.5%) as the full dataset. Without stratification, some folds might have very few churners by chance.\n\n**Why it matters:**\n- Reduces variance in performance estimates\n- Every data point gets used for both training and evaluation\n- More reliable than a single train/test split\n- Used during hyperparameter tuning to pick the best model configuration',
            followUps: [
                { label: 'Hyperparameter tuning', question: 'How were the hyperparameters tuned?' },
                { label: 'Confidence intervals', question: 'How were confidence intervals calculated?' }
            ]
        },
        {
            id: 'def_p_value',
            patterns: ['what.*p.*value', 'p.*value.*mean', 'define.*p.*value', 'significance', 'statistic.*signif'],
            answer: '**P-value** in the context of this project\'s model comparison:\n\nA p-value answers: *"If the two models were actually equal, how likely would we see a difference this large by chance?"*\n\n- **p < 0.05:** The difference is **statistically significant** — unlikely due to random variation\n- **p > 0.05:** The difference is **not significant** — could be random noise\n\n**Our results:**\n- XGBoost vs LogReg: p < 0.001 → **Definitely better**\n- XGBoost vs Random Forest: p = 0.044 → **Significantly better** (barely)\n- XGBoost vs LightGBM: p = 0.181 → **Not significantly different**\n\nWe used **paired t-tests** on 5-fold CV scores, which is more powerful than comparing single test scores because it controls for fold-to-fold variance.',
            followUps: [
                { label: 'Model comparison', question: 'Show me the statistical model comparison results' },
                { label: 'Confidence intervals', question: 'How were confidence intervals calculated?' }
            ]
        },

        // ═══════════════════════════════════════════════════════
        // 12. ABOUT THE CREATOR
        // ═══════════════════════════════════════════════════════
        {
            id: 'about_noah',
            patterns: ['who built', 'who made', 'who created', 'about.*noah', 'about.*author', 'about.*creator', 'your.*creator', 'who are you', 'noah gallagher'],
            answer: 'This project was designed and built by **Noah Gallagher**, a Data Scientist.\n\nThe project demonstrates end-to-end ML skills: data acquisition, feature engineering, multi-model training with hyperparameter tuning, SHAP explainability, business impact quantification, and interactive deployment.\n\n**Connect with Noah:**\n- GitHub: github.com/noahgallagher1\n- LinkedIn: linkedin.com/in/noahgallagher\n- Email: noahgallagher1@gmail.com\n- Portfolio: noahgallagher1.github.io/MySite',
            followUps: [
                { label: 'Project overview', question: 'Give me an overview of this project' },
                { label: 'Tech stack', question: 'What technology stack was used?' }
            ]
        },
        {
            id: 'project_overview',
            patterns: ['overview', 'summary', 'tell me about', 'what is this', 'what.*project', 'describe.*project', 'explain.*project'],
            answer: '**Customer Churn Prediction & Explainability Dashboard**\n\nThis is an end-to-end machine learning project by **Noah Gallagher** that predicts which telecom customers are likely to cancel their service.\n\n**Key highlights:**\n- **93% recall** — catches nearly all at-risk customers\n- **$367K estimated annual savings** from targeted retention\n- **431.6% ROI** on retention campaigns\n- **SHAP explainability** for every single prediction\n- **4 models compared** with statistical validation\n- **36 engineered features** from 21 raw inputs\n- **Interactive What-If simulator** for exploring scenarios\n\nThe project goes beyond just building a model — it quantifies **business value**, provides **actionable recommendations**, and presents findings through a modern interactive dashboard.',
            followUps: [
                { label: 'What model was used?', question: 'What model was used and why?' },
                { label: 'Top churn drivers', question: 'What are the top churn drivers?' },
                { label: 'ROI analysis', question: 'Explain the ROI analysis in detail' },
                { label: 'About the creator', question: 'Who built this project?' }
            ]
        },
        {
            id: 'early_engagement',
            patterns: ['early engagement', 'onboarding', 'new customer.*retain', 'first.*month'],
            answer: '**Early engagement strategies for new customers (<6 months):**\n\nNew customers churn at nearly **50%**, making the onboarding period critical.\n\n**Recommended interventions:**\n1. **Welcome series** — automated emails/calls in weeks 1, 2, and 4 to ensure setup completion and value realization\n2. **Usage monitoring** — flag customers with declining usage patterns in months 2–3\n3. **Proactive support** — offer free tech support during the first 90 days\n4. **Value demonstration** — personalized usage reports showing cost savings or features used\n5. **Contract incentive** — after month 3, offer a discounted annual plan upgrade\n\n**Expected impact:** Industry data suggests structured onboarding can reduce early-tenure churn by 20–30%.',
            followUps: [
                { label: 'Tenure impact', question: 'How does tenure affect churn risk?' },
                { label: 'All recommendations', question: 'What retention strategies are recommended?' }
            ]
        },
        {
            id: 'monthly_charges',
            patterns: ['monthly charge', 'price', 'pricing', 'how much.*pay', 'cost.*customer', 'charge.*churn'],
            answer: '**Monthly charges and churn:**\n\n| Charges | N | Churn Rate | Model F1 |\n|---------|---|-----------|----------|\n| Low (<$35) | 349 | 12.0% | 0.476 |\n| Medium ($35-70) | 362 | 24.3% | 0.517 |\n| High ($70-90) | 365 | **38.9%** | **0.675** |\n| Very High (>$90) | 333 | 30.6% | 0.535 |\n\n**Insights:**\n- Higher charges correlate with higher churn — these customers expect more for their money\n- The model performs best on the high-charges segment (F1=0.675) where intervention has the most revenue impact\n- Interestingly, "Very High" (>$90) has lower churn than "High" ($70-90), possibly because premium customers have more services that create stickiness\n\nThe engineered feature `charges_per_tenure` helps the model distinguish between expensive new customers (high risk) and long-term premium subscribers (lower risk).',
            followUps: [
                { label: 'Feature engineering', question: 'What feature engineering was done?' },
                { label: 'Internet service', question: 'Why do fiber optic users churn more?' },
                { label: 'Segment performance', question: 'How does the model perform by segment?' }
            ]
        },
        {
            id: 'internet_service',
            patterns: ['internet service', 'fiber optic', 'dsl', 'why fiber', 'fiber.*churn'],
            answer: '**Internet service type and churn:**\n\n- **No internet service:** Lowest churn (~7%) — phone-only customers are less price-sensitive\n- **DSL:** Moderate churn (~20%) — established technology, reasonable pricing\n- **Fiber optic:** Highest churn (~38%) — premium service with premium expectations\n\n**Why fiber optic users churn more:**\n1. **Higher monthly charges** — fiber is the most expensive tier\n2. **Higher expectations** — customers paying premium expect premium service quality\n3. **More competitive market** — fiber-eligible areas typically have more ISP options\n4. **Tech-savvy customers** — more likely to comparison shop online\n\nSHAP importance for fiber optic: **0.174** (3rd most important feature). This is an engineered insight — the raw variable "InternetService" is one-hot encoded into separate binary features.',
            followUps: [
                { label: 'Top churn drivers', question: 'What are the top churn drivers?' },
                { label: 'Monthly charges', question: 'How do monthly charges relate to churn?' }
            ]
        }
    ],

    // ── Initialization ───────────────────────────────────────
    init() {
        const toggleBtn = document.getElementById('chatToggle');
        const closeBtn = document.getElementById('chatbotClose');
        const form = document.getElementById('chatForm');

        if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggle());
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
        if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Initial topic category buttons
        document.querySelectorAll('.chat-suggestion').forEach(btn => {
            btn.addEventListener('click', () => {
                const q = btn.dataset.q;
                if (q) this.sendMessage(q);
            });
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
    },

    toggle() { this.isOpen ? this.close() : this.open(); },

    open() {
        this.isOpen = true;
        document.getElementById('chatbotPanel').classList.add('open');
        document.getElementById('chatInput').focus();
    },

    close() {
        this.isOpen = false;
        document.getElementById('chatbotPanel').classList.remove('open');
    },

    async handleSubmit(e) {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const msg = input.value.trim();
        if (!msg || this.isLoading) return;
        input.value = '';
        this.sendMessage(msg);
    },

    async sendMessage(message) {
        if (this.isLoading || this.messageCount >= this.maxMessages) {
            if (this.messageCount >= this.maxMessages) {
                this.addMessage('bot', 'You\'ve reached the message limit for this session. Please refresh the page to start a new conversation.');
            }
            return;
        }

        this.messageCount++;
        this.addMessage('user', message);
        this.showTyping();
        this.isLoading = true;

        try {
            this.history.push({ role: 'user', content: message });

            const response = await fetch('/api/gemini-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    history: this.history.slice(-10),
                    projectContext: DATA.projectContext
                })
            });

            this.hideTyping();

            if (!response.ok) {
                throw new Error(`API error (${response.status})`);
            }

            const data = await response.json();
            const reply = data.response || 'Sorry, I could not generate a response. Please try again.';
            this.history.push({ role: 'assistant', content: reply });
            this.addMessage('bot', reply);
            // Show generic follow-ups for API responses
            this.showFollowUps([
                { label: 'Project overview', question: 'Give me an overview of this project' },
                { label: 'Top churn drivers', question: 'What are the top churn drivers?' },
                { label: 'Model details', question: 'What model was used and why?' }
            ]);
        } catch (error) {
            this.hideTyping();
            // Fall back to local knowledge base
            const match = this.matchKB(message);
            this.addMessage('bot', match.answer);
            this.showFollowUps(match.followUps);
        }

        this.isLoading = false;
    },

    // ── Knowledge Base Matching ──────────────────────────────
    matchKB(question) {
        const q = question.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;

        for (const entry of this.kb) {
            let score = 0;
            for (const pattern of entry.patterns) {
                // Support regex patterns (those with special chars)
                if (pattern.includes('\\') || pattern.includes('.*') || pattern.includes('|')) {
                    try {
                        if (new RegExp(pattern, 'i').test(q)) score += 3;
                    } catch { /* ignore bad regex */ }
                } else if (q.includes(pattern.toLowerCase())) {
                    score += pattern.split(' ').length + 1;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestMatch = entry;
            }
        }

        if (bestMatch && bestScore >= 1) {
            return { answer: bestMatch.answer, followUps: bestMatch.followUps || [] };
        }

        // Default fallback
        return {
            answer: 'I can answer detailed questions about this **Customer Churn Prediction** project built by **Noah Gallagher**. Try asking about:\n\n- The model (XGBoost) and why it was chosen\n- Data, features, and feature engineering\n- Performance metrics and what they mean\n- SHAP explainability and churn drivers\n- Business impact and ROI analysis\n- Segment analysis and demographics\n- Retention recommendations\n- Limitations and future work\n- Technical stack and architecture\n\nOr pick a topic from the suggestions below!',
            followUps: [
                { label: 'Project overview', question: 'Give me an overview of this project' },
                { label: 'What model?', question: 'What model was used and why?' },
                { label: 'Top drivers', question: 'What are the top churn drivers?' },
                { label: 'ROI analysis', question: 'Explain the ROI analysis in detail' }
            ]
        };
    },

    // ── Follow-up Suggestion Chips ───────────────────────────
    showFollowUps(followUps) {
        if (!followUps || followUps.length === 0) return;
        const body = document.getElementById('chatbotBody');
        const div = document.createElement('div');
        div.className = 'chat-followups';
        div.innerHTML = followUps.map(f =>
            `<button class="chat-followup-btn" data-q="${f.question.replace(/"/g, '&quot;')}">${f.label}</button>`
        ).join('');
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;

        div.querySelectorAll('.chat-followup-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove this follow-up set
                div.remove();
                this.sendMessage(btn.dataset.q);
            });
        });
    },

    // ── Message Rendering ────────────────────────────────────
    addMessage(type, text) {
        const body = document.getElementById('chatbotBody');
        // Remove any existing follow-up chips when new message arrives
        body.querySelectorAll('.chat-followups').forEach(el => el.remove());

        const div = document.createElement('div');
        div.className = `chat-message ${type}`;
        const icon = type === 'bot' ? 'fa-robot' : 'fa-user';

        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background:rgba(59,130,246,0.15);padding:2px 6px;border-radius:4px;font-family:JetBrains Mono,monospace;font-size:0.82em">$1</code>')
            .replace(/\n/g, '<br>');

        div.innerHTML = `
            <div class="chat-avatar"><i class="fas ${icon}"></i></div>
            <div class="chat-bubble">${formattedText}</div>
        `;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    },

    showTyping() {
        const body = document.getElementById('chatbotBody');
        const div = document.createElement('div');
        div.className = 'chat-message bot';
        div.id = 'typingIndicator';
        div.innerHTML = `
            <div class="chat-avatar"><i class="fas fa-robot"></i></div>
            <div class="chat-bubble">
                <div class="chat-typing"><span></span><span></span><span></span></div>
            </div>
        `;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    },

    hideTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }
};
