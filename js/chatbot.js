// ============================================================
// ChurnSense AI - Gemini Chatbot Integration
// ============================================================

const Chatbot = {
    history: [],
    messageCount: 0,
    maxMessages: 30,
    isOpen: false,
    isLoading: false,

    init() {
        const toggleBtn = document.getElementById('chatToggle');
        const closeBtn = document.getElementById('chatbotClose');
        const form = document.getElementById('chatForm');
        const panel = document.getElementById('chatbotPanel');

        if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggle());
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
        if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Suggestion buttons
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

    toggle() {
        this.isOpen ? this.close() : this.open();
    },

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
                    history: this.history.slice(-10), // Last 10 messages for context
                    projectContext: DATA.projectContext
                })
            });

            this.hideTyping();

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `API error (${response.status})`);
            }

            const data = await response.json();
            const reply = data.response || 'I apologize, but I could not generate a response. Please try again.';

            this.history.push({ role: 'assistant', content: reply });
            this.addMessage('bot', reply);
        } catch (error) {
            this.hideTyping();
            console.error('Chatbot error:', error);

            // Fallback to local responses if API is unavailable
            const fallback = this.getLocalResponse(message);
            this.addMessage('bot', fallback);
        }

        this.isLoading = false;
    },

    addMessage(type, text) {
        const body = document.getElementById('chatbotBody');
        const div = document.createElement('div');
        div.className = `chat-message ${type}`;
        const icon = type === 'bot' ? 'fa-robot' : 'fa-user';

        // Simple markdown-like formatting
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
    },

    // Fallback responses when API is unavailable
    getLocalResponse(question) {
        const q = question.toLowerCase();

        if (q.includes('model') && (q.includes('what') || q.includes('which') || q.includes('use'))) {
            return '**XGBoost** was selected as the best model from 4 candidates (Logistic Regression, Random Forest, XGBoost, LightGBM). It achieved **93% recall** with an ROC-AUC of **0.838**. It was optimized for recall because missing an at-risk customer costs $1,500 vs $100 for a false alarm.\n\n*Note: The AI assistant is currently offline. This is a pre-loaded response.*';
        }
        if (q.includes('churn') && (q.includes('driver') || q.includes('cause') || q.includes('why') || q.includes('factor') || q.includes('top'))) {
            return 'The **top churn drivers** identified by SHAP analysis are:\n\n1. **Contract Type** - Month-to-month contracts have 42% churn vs 3% for 2-year\n2. **Internet Service** - Fiber optic users churn more\n3. **Tenure** - New customers (<12mo) churn at 48%\n4. **Payment Method** - Electronic check = 45% churn\n5. **Paperless Billing** - Correlates with higher churn\n\n*Note: The AI assistant is currently offline. This is a pre-loaded response.*';
        }
        if (q.includes('roi') || q.includes('business') || q.includes('saving') || q.includes('impact')) {
            return 'The model generates an estimated **$367,300 in annual net savings** with a **431.6% ROI**. This assumes:\n- CLV of $2,000\n- $100 per retention campaign\n- 65% success rate\n\nThe model correctly identifies **348 true positives** with **503 false positives**. Even with the high FP rate, the asymmetric cost structure makes targeted campaigns highly profitable.\n\n*Note: The AI assistant is currently offline. This is a pre-loaded response.*';
        }
        if (q.includes('data') || q.includes('dataset')) {
            return 'The project uses the **IBM Telco Customer Churn** dataset with **7,043 customers** and **21 features** covering demographics, account info, and services. Features were engineered to 36 total (tenure bins, risk scores, charge ratios, service counts). The dataset has a **26.5% churn rate**, handled with SMOTE oversampling.\n\n*Note: The AI assistant is currently offline. This is a pre-loaded response.*';
        }
        if (q.includes('shap') || q.includes('explain') || q.includes('interpret')) {
            return 'The model uses **SHAP (SHapley Additive exPlanations)** with TreeExplainer for XGBoost. This provides:\n\n- **Global explanations**: Which features matter most across all predictions\n- **Local explanations**: Why a specific customer was flagged as at-risk\n- **Feature dependence**: How feature values relate to churn risk\n\nContract type (Two Year) has the highest SHAP importance at **0.446**.\n\n*Note: The AI assistant is currently offline. This is a pre-loaded response.*';
        }
        if (q.includes('limit') || q.includes('weakness') || q.includes('improve')) {
            return 'Key **limitations**:\n\n1. **Static dataset** - No temporal validation (snapshot, not time-series)\n2. **High false positive rate** (~50%) - Many unnecessary campaigns\n3. **Segment performance varies** - F1 drops to 0.29 for loyal customers >48 months\n4. **IBM sample data** - Not production-validated\n5. **No causal inference** - Correlations, not causation\n\nFuture work: temporal validation, uplift modeling, neural networks (TabNet), real-time scoring API.\n\n*Note: The AI assistant is currently offline. This is a pre-loaded response.*';
        }

        return 'I can answer questions about the **Customer Churn Prediction** project, including the model (XGBoost), methodology, data, SHAP explainability, ROI analysis, and business impact. Try asking about specific aspects!\n\n*Note: The AI assistant is currently running in offline mode with limited responses. When the Gemini API is configured, I\'ll provide detailed, contextual answers.*';
    }
};
