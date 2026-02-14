// ============================================================
// ChurnSense AI - What-If Simulator
// Client-side churn probability estimation using SHAP-derived weights
// ============================================================

const Simulator = {
    currentState: { ...DATA.scenarios['new-subscriber'] },

    init() {
        this.bindScenarioPills();
        this.bindInputs();
        this.loadScenario('new-subscriber');
    },

    bindScenarioPills() {
        document.querySelectorAll('.scenario-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.scenario-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.loadScenario(pill.dataset.scenario);
            });
        });
    },

    bindInputs() {
        // Radio groups
        document.querySelectorAll('.sim-radio-group').forEach(group => {
            group.querySelectorAll('.sim-radio').forEach(btn => {
                btn.addEventListener('click', () => {
                    group.querySelectorAll('.sim-radio').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const field = group.dataset.field;
                    this.currentState[field] = btn.dataset.value;
                    this.setCustom();
                    this.recalculate();
                });
            });
        });

        // Sliders
        const tenureSlider = document.getElementById('tenureSlider');
        const chargesSlider = document.getElementById('chargesSlider');
        if (tenureSlider) {
            tenureSlider.addEventListener('input', () => {
                const v = parseInt(tenureSlider.value);
                document.getElementById('tenureValue').textContent = v + ' months';
                this.currentState.tenure = v;
                this.setCustom();
                this.recalculate();
            });
        }
        if (chargesSlider) {
            chargesSlider.addEventListener('input', () => {
                const v = parseFloat(chargesSlider.value);
                document.getElementById('chargesValue').textContent = '$' + v.toFixed(2);
                this.currentState.monthlyCharges = v;
                this.setCustom();
                this.recalculate();
            });
        }

        // Select
        document.querySelectorAll('.sim-select').forEach(sel => {
            sel.addEventListener('change', () => {
                this.currentState[sel.dataset.field] = sel.value;
                this.setCustom();
                this.recalculate();
            });
        });

        // Toggle switches
        document.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
                const isActive = toggle.classList.contains('active');
                toggle.dataset.value = isActive ? 'Yes' : 'No';
                this.currentState[toggle.dataset.field] = isActive ? 'Yes' : 'No';
                this.setCustom();
                this.recalculate();
            });
        });
    },

    setCustom() {
        // Auto-select the custom pill when user manually changes inputs
        document.querySelectorAll('.scenario-pill').forEach(p => p.classList.remove('active'));
        document.querySelector('.scenario-pill[data-scenario="custom"]').classList.add('active');
    },

    loadScenario(name) {
        const scenario = DATA.scenarios[name];
        if (!scenario) return;
        this.currentState = { ...scenario };

        // Update radio groups
        document.querySelectorAll('.sim-radio-group').forEach(group => {
            const field = group.dataset.field;
            const val = scenario[field];
            if (val !== undefined) {
                group.querySelectorAll('.sim-radio').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === val);
                });
            }
        });

        // Update sliders
        const tenureSlider = document.getElementById('tenureSlider');
        const chargesSlider = document.getElementById('chargesSlider');
        if (tenureSlider) {
            tenureSlider.value = scenario.tenure;
            document.getElementById('tenureValue').textContent = scenario.tenure + ' months';
        }
        if (chargesSlider) {
            chargesSlider.value = scenario.monthlyCharges;
            document.getElementById('chargesValue').textContent = '$' + scenario.monthlyCharges.toFixed(2);
        }

        // Update select
        const paymentSelect = document.querySelector('.sim-select[data-field="paymentMethod"]');
        if (paymentSelect) paymentSelect.value = scenario.paymentMethod;

        // Update toggles
        document.querySelectorAll('.toggle-switch').forEach(toggle => {
            const field = toggle.dataset.field;
            const val = scenario[field];
            if (val !== undefined) {
                toggle.classList.toggle('active', val === 'Yes');
                toggle.dataset.value = val;
            }
        });

        this.recalculate();
    },

    calculateChurnProbability() {
        const w = DATA.simulatorWeights;
        const s = this.currentState;
        let logit = 0;

        // Base rate (logit space)
        logit += Math.log(w.baseChurnRate / (1 - w.baseChurnRate));

        // Contract
        logit += (w.features.contract[s.contract] || 0) * 3;

        // Internet
        logit += (w.features.internet[s.internet] || 0) * 2.5;

        // Tenure (non-linear: steep drop in first 12 months)
        const tenureEffect = s.tenure < 12
            ? w.features.tenure.intercept - (s.tenure / 12) * 0.15
            : w.features.tenure.intercept + w.features.tenure.slope * s.tenure;
        logit += tenureEffect * 2;

        // Monthly charges
        const chargesEffect = w.features.monthlyCharges.intercept + w.features.monthlyCharges.slope * s.monthlyCharges;
        logit += chargesEffect * 1.5;

        // Payment method
        logit += (w.features.paymentMethod[s.paymentMethod] || 0) * 2;

        // Binary features
        logit += (w.features.onlineSecurity[s.onlineSecurity] || 0) * 1.5;
        logit += (w.features.techSupport[s.techSupport] || 0) * 1.5;
        logit += (w.features.paperlessBilling[s.paperlessBilling] || 0) * 1.5;
        logit += (w.features.seniorCitizen[s.seniorCitizen] || 0) * 1.5;

        // Sigmoid
        const prob = 1 / (1 + Math.exp(-logit));
        return Math.max(0.02, Math.min(0.98, prob));
    },

    getContributions() {
        const w = DATA.simulatorWeights;
        const s = this.currentState;
        const contributions = [];

        const add = (name, value) => { if (Math.abs(value) > 0.01) contributions.push({ name, value }); };

        add('Contract: ' + s.contract, (w.features.contract[s.contract] || 0) * 3);
        add('Internet: ' + s.internet, (w.features.internet[s.internet] || 0) * 2.5);

        const tenureEffect = s.tenure < 12
            ? w.features.tenure.intercept - (s.tenure / 12) * 0.15
            : w.features.tenure.intercept + w.features.tenure.slope * s.tenure;
        add('Tenure: ' + s.tenure + 'mo', tenureEffect * 2);

        const chargesEffect = w.features.monthlyCharges.intercept + w.features.monthlyCharges.slope * s.monthlyCharges;
        add('Monthly: $' + s.monthlyCharges, chargesEffect * 1.5);
        add('Payment: ' + s.paymentMethod.split(' ')[0], (w.features.paymentMethod[s.paymentMethod] || 0) * 2);
        add('Online Security', (w.features.onlineSecurity[s.onlineSecurity] || 0) * 1.5);
        add('Tech Support', (w.features.techSupport[s.techSupport] || 0) * 1.5);
        add('Paperless Billing', (w.features.paperlessBilling[s.paperlessBilling] || 0) * 1.5);
        add('Senior Citizen', (w.features.seniorCitizen[s.seniorCitizen] || 0) * 1.5);

        contributions.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
        return contributions.slice(0, 6);
    },

    recalculate() {
        const prob = this.calculateChurnProbability();
        this.renderGauge(prob);
        this.renderFactors();
        this.updateRiskLabel(prob);
        this.updateRecommendation(prob);
    },

    renderGauge(prob) {
        const pct = prob * 100;
        let color;
        if (pct > 65) color = '#ef4444';
        else if (pct > 35) color = '#f59e0b';
        else color = '#10b981';

        const trace = {
            type: 'indicator', mode: 'gauge+number',
            value: pct,
            number: { suffix: '%', font: { size: 42, family: 'Space Grotesk', color: color } },
            gauge: {
                axis: { range: [0, 100], tickwidth: 1, tickcolor: '#475569', dtick: 25,
                    tickfont: { color: '#64748b', size: 11 } },
                bar: { color: color, thickness: 0.3 },
                bgcolor: 'rgba(0,0,0,0)',
                borderwidth: 0,
                steps: [
                    { range: [0, 35], color: 'rgba(16,185,129,0.08)' },
                    { range: [35, 65], color: 'rgba(245,158,11,0.08)' },
                    { range: [65, 100], color: 'rgba(239,68,68,0.08)' }
                ],
                threshold: {
                    line: { color: '#f1f5f9', width: 3 },
                    thickness: 0.8, value: pct
                }
            }
        };
        Plotly.newPlot('simGauge', [trace], {
            ...CHART_THEME, margin: { t: 30, r: 30, b: 10, l: 30 },
            height: 240
        }, CHART_CONFIG);
    },

    renderFactors() {
        const factors = this.getContributions();
        const trace = {
            y: factors.map(f => f.name).reverse(),
            x: factors.map(f => f.value).reverse(),
            type: 'bar', orientation: 'h',
            marker: {
                color: factors.map(f => f.value > 0 ? '#ef4444' : '#10b981').reverse(),
                line: { width: 0 }
            },
            text: factors.map(f => (f.value > 0 ? '+' : '') + f.value.toFixed(2)).reverse(),
            textposition: 'outside',
            textfont: { color: '#94a3b8', size: 11, family: 'JetBrains Mono' }
        };
        Plotly.newPlot('simFactors', [trace], {
            ...CHART_THEME,
            margin: { t: 5, r: 60, b: 30, l: 150 },
            xaxis: { ...CHART_THEME.xaxis, title: 'Contribution to Churn Risk', zeroline: true, zerolinecolor: '#475569' },
            yaxis: { ...CHART_THEME.yaxis },
            height: 200, showlegend: false
        }, CHART_CONFIG);
    },

    updateRiskLabel(prob) {
        const el = document.getElementById('simRiskLabel');
        if (!el) return;
        const pct = prob * 100;
        let cls, text;
        if (pct > 65) { cls = 'high'; text = 'HIGH RISK'; }
        else if (pct > 35) { cls = 'medium'; text = 'MEDIUM RISK'; }
        else { cls = 'low'; text = 'LOW RISK'; }
        el.innerHTML = `<span class="risk-badge ${cls}">${text}</span>`;
    },

    updateRecommendation(prob) {
        const el = document.getElementById('simRecommendation');
        if (!el) return;
        const pct = prob * 100;
        const s = this.currentState;
        let rec = '';

        if (pct > 65) {
            if (s.contract === 'Month-to-month') {
                rec = 'Immediate action: Offer a discounted annual contract. Month-to-month contracts are the #1 churn driver. Pair with online security if not subscribed.';
            } else {
                rec = 'High priority: Schedule a proactive check-in call. Review service satisfaction and offer loyalty perks before the next renewal window.';
            }
        } else if (pct > 35) {
            if (s.onlineSecurity === 'No' || s.techSupport === 'No') {
                rec = 'Moderate risk: Promote tech support and online security add-ons with a free trial period. These services strongly correlate with retention.';
            } else {
                rec = 'Monitor closely: This customer shows moderate risk. Consider automated engagement emails and periodic satisfaction surveys.';
            }
        } else {
            rec = 'Low risk: This customer profile indicates strong retention likelihood. Continue standard engagement and consider them for loyalty program benefits.';
        }

        el.querySelector('.rec-text').textContent = rec;
    }
};
