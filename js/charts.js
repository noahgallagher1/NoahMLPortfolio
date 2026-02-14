// ============================================================
// ChurnSense AI - Chart Rendering (Plotly.js)
// ============================================================

const CHART_THEME = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 12 },
    margin: { t: 30, r: 20, b: 50, l: 60 },
    colorway: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f472b6'],
    xaxis: { gridcolor: 'rgba(51,65,85,0.3)', zerolinecolor: 'rgba(51,65,85,0.5)' },
    yaxis: { gridcolor: 'rgba(51,65,85,0.3)', zerolinecolor: 'rgba(51,65,85,0.5)' }
};

const CHART_CONFIG = { responsive: true, displayModeBar: false };

// --- Confusion Matrix ---
function renderConfusionMatrix() {
    const cm = DATA.confusionMatrix;
    const z = [[cm.values[1][1], cm.values[1][0]], [cm.values[0][1], cm.values[0][0]]];
    const annotations = [];
    const labels = ['Churned', 'Not Churned'];
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            annotations.push({
                x: j, y: i, text: String(z[i][j]),
                font: { size: 22, color: '#f1f5f9', family: 'Space Grotesk' },
                showarrow: false
            });
        }
    }
    const trace = {
        z: z, x: ['Predicted Churn', 'Predicted No Churn'],
        y: ['Actual Churn', 'Actual No Churn'],
        type: 'heatmap', colorscale: [[0, '#1e293b'], [0.5, '#3b82f6'], [1, '#8b5cf6']],
        showscale: false, hoverongaps: false
    };
    const layout = {
        ...CHART_THEME, annotations,
        margin: { t: 20, r: 20, b: 60, l: 100 },
        xaxis: { ...CHART_THEME.xaxis, side: 'bottom' },
        yaxis: { ...CHART_THEME.yaxis, autorange: 'reversed' }
    };
    Plotly.newPlot('confusionMatrix', [trace], layout, CHART_CONFIG);
}

// --- ROC & PR Curves ---
let currentCurve = 'roc';
function renderCurve(type) {
    currentCurve = type;
    const el = document.getElementById('rocPrCurve');
    if (!el) return;

    if (type === 'roc') {
        const trace = {
            x: DATA.rocCurve.fpr, y: DATA.rocCurve.tpr,
            type: 'scatter', mode: 'lines', fill: 'tozeroy',
            fillcolor: 'rgba(59,130,246,0.1)', line: { color: '#3b82f6', width: 3 },
            name: `ROC (AUC = ${DATA.rocCurve.auc})`
        };
        const diagonal = {
            x: [0, 1], y: [0, 1], type: 'scatter', mode: 'lines',
            line: { color: '#475569', width: 1, dash: 'dash' }, name: 'Random', showlegend: false
        };
        const layout = {
            ...CHART_THEME,
            xaxis: { ...CHART_THEME.xaxis, title: 'False Positive Rate', range: [0, 1] },
            yaxis: { ...CHART_THEME.yaxis, title: 'True Positive Rate', range: [0, 1] },
            legend: { x: 0.55, y: 0.1, bgcolor: 'rgba(0,0,0,0)', font: { color: '#94a3b8' } },
            annotations: [{
                x: 0.5, y: 0.5, text: `AUC = ${DATA.rocCurve.auc}`,
                font: { size: 18, color: '#3b82f6', family: 'Space Grotesk' },
                showarrow: false, bgcolor: 'rgba(26,31,53,0.9)', borderpad: 8,
                bordercolor: '#3b82f6', borderwidth: 1
            }]
        };
        Plotly.newPlot('rocPrCurve', [diagonal, trace], layout, CHART_CONFIG);
    } else {
        const trace = {
            x: DATA.prCurve.recall, y: DATA.prCurve.precision,
            type: 'scatter', mode: 'lines', fill: 'tozeroy',
            fillcolor: 'rgba(139,92,246,0.1)', line: { color: '#8b5cf6', width: 3 },
            name: 'Precision-Recall'
        };
        const layout = {
            ...CHART_THEME,
            xaxis: { ...CHART_THEME.xaxis, title: 'Recall', range: [0, 1] },
            yaxis: { ...CHART_THEME.yaxis, title: 'Precision', range: [0, 1] },
            legend: { x: 0.05, y: 0.1, bgcolor: 'rgba(0,0,0,0)', font: { color: '#94a3b8' } }
        };
        Plotly.newPlot('rocPrCurve', [trace], layout, CHART_CONFIG);
    }
}

// --- Model Comparison ---
function renderModelComparison() {
    const models = DATA.baselineComparison;
    const metrics = ['recall', 'f1', 'precision', 'roc_auc'];
    const metricLabels = ['Recall', 'F1 Score', 'Precision', 'ROC-AUC'];
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
    const traces = metrics.map((m, i) => ({
        x: models.map(d => d.model),
        y: models.map(d => d[m] || 0),
        type: 'bar', name: metricLabels[i],
        marker: {
            color: models.map(d => d.isOurs ? colors[i] : colors[i] + '66'),
            line: { color: colors[i], width: 1 }
        }
    }));
    const layout = {
        ...CHART_THEME, barmode: 'group',
        margin: { t: 20, r: 20, b: 80, l: 50 },
        xaxis: { ...CHART_THEME.xaxis, tickangle: 0 },
        yaxis: { ...CHART_THEME.yaxis, title: 'Score', range: [0, 1.1] },
        legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center', font: { color: '#94a3b8' } }
    };
    Plotly.newPlot('modelComparison', traces, layout, CHART_CONFIG);
}

// --- ROI Sensitivity ---
function renderROISensitivity() {
    const s = DATA.roiSensitivity;
    const traces = [
        {
            x: s.clv.map(d => '$' + d.x), y: s.clv.map(d => d.roi),
            type: 'scatter', mode: 'lines+markers',
            line: { color: '#3b82f6', width: 3 },
            marker: { size: 8, color: '#3b82f6' },
            name: 'Vary CLV'
        },
        {
            x: s.successRate.map(d => (d.x * 100) + '%'), y: s.successRate.map(d => d.roi),
            type: 'scatter', mode: 'lines+markers',
            line: { color: '#10b981', width: 3 },
            marker: { size: 8, color: '#10b981' },
            name: 'Vary Success Rate'
        },
        {
            x: s.campaignCost.map(d => '$' + d.x), y: s.campaignCost.map(d => d.roi),
            type: 'scatter', mode: 'lines+markers',
            line: { color: '#f59e0b', width: 3 },
            marker: { size: 8, color: '#f59e0b' },
            name: 'Vary Campaign Cost'
        }
    ];
    const layout = {
        ...CHART_THEME,
        margin: { t: 20, r: 20, b: 50, l: 60 },
        xaxis: { ...CHART_THEME.xaxis, title: 'Parameter Value', type: 'category' },
        yaxis: { ...CHART_THEME.yaxis, title: 'ROI (%)' },
        legend: { orientation: 'h', y: -0.25, x: 0.5, xanchor: 'center', font: { color: '#94a3b8' } },
        shapes: [{
            type: 'line', y0: 431.6, y1: 431.6, x0: 0, x1: 1, xref: 'paper',
            line: { color: '#475569', dash: 'dash', width: 1 }
        }]
    };
    Plotly.newPlot('roiSensitivity', traces, layout, CHART_CONFIG);
}

// --- Confidence Intervals ---
function renderConfidenceIntervals() {
    const m = DATA.metrics;
    const names = ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'ROC-AUC'];
    const keys = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc'];
    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'];

    const trace = {
        x: names,
        y: keys.map(k => m[k].mean),
        error_y: {
            type: 'data', symmetric: false,
            array: keys.map(k => m[k].ci_upper - m[k].mean),
            arrayminus: keys.map(k => m[k].mean - m[k].ci_lower),
            color: '#94a3b8', thickness: 2, width: 8
        },
        type: 'bar',
        marker: {
            color: colors,
            line: { color: colors.map(c => c + 'cc'), width: 1 }
        },
        text: keys.map(k => (m[k].mean * 100).toFixed(1) + '%'),
        textposition: 'outside',
        textfont: { color: '#f1f5f9', family: 'Space Grotesk', size: 14 }
    };
    const layout = {
        ...CHART_THEME,
        margin: { t: 40, r: 20, b: 50, l: 50 },
        yaxis: { ...CHART_THEME.yaxis, title: 'Score', range: [0, 1.1] },
        showlegend: false
    };
    Plotly.newPlot('confidenceIntervals', [trace], layout, CHART_CONFIG);
}

// --- Feature Importance ---
let currentFI = 'shap';
function renderFeatureImportance(type) {
    currentFI = type || currentFI;
    const data = currentFI === 'shap' ? DATA.shapImportance : DATA.modelImportance;
    const topN = data.slice(0, 15).reverse();

    const trace = {
        y: topN.map(d => d.feature),
        x: topN.map(d => d.value),
        type: 'bar', orientation: 'h',
        marker: {
            color: topN.map((_, i) => {
                const t = i / (topN.length - 1);
                return `rgba(${Math.round(102 + t * 16)}, ${Math.round(126 - t * 51)}, ${Math.round(234 - t * 72)}, 0.85)`;
            }),
            line: { width: 0 }
        },
        text: topN.map(d => d.value.toFixed(4)),
        textposition: 'outside',
        textfont: { color: '#94a3b8', size: 11, family: 'JetBrains Mono' }
    };
    const layout = {
        ...CHART_THEME,
        margin: { t: 10, r: 80, b: 50, l: 180 },
        xaxis: { ...CHART_THEME.xaxis, title: currentFI === 'shap' ? 'Mean |SHAP Value|' : 'Feature Importance' },
        yaxis: { ...CHART_THEME.yaxis, automargin: true }
    };
    Plotly.newPlot('featureImportance', [trace], layout, CHART_CONFIG);
}

// --- Segment Charts ---
function renderSegmentCharts(segmentType) {
    const data = DATA.segments[segmentType];
    if (!data) return;

    // Churn Rate
    const churnTrace = {
        x: data.map(d => d.segment),
        y: data.map(d => d.churnRate * 100),
        type: 'bar',
        marker: {
            color: data.map(d => d.churnRate > 0.3 ? '#ef4444' : d.churnRate > 0.15 ? '#f59e0b' : '#10b981'),
            line: { width: 0 }
        },
        text: data.map(d => (d.churnRate * 100).toFixed(1) + '%'),
        textposition: 'outside',
        textfont: { color: '#f1f5f9', family: 'Space Grotesk', size: 13 }
    };
    Plotly.newPlot('segmentChurnRate', [churnTrace], {
        ...CHART_THEME,
        margin: { t: 30, r: 20, b: 80, l: 50 },
        xaxis: { ...CHART_THEME.xaxis, tickangle: -30 },
        yaxis: { ...CHART_THEME.yaxis, title: 'Churn Rate (%)', range: [0, Math.max(...data.map(d => d.churnRate * 100)) * 1.3] },
        showlegend: false
    }, CHART_CONFIG);

    // F1 Score
    const f1Trace = {
        x: data.map(d => d.segment),
        y: data.map(d => d.f1),
        type: 'bar',
        marker: {
            color: data.map(d => d.f1 > 0.5 ? '#3b82f6' : d.f1 > 0.3 ? '#8b5cf6' : '#475569'),
            line: { width: 0 }
        },
        text: data.map(d => d.f1.toFixed(3)),
        textposition: 'outside',
        textfont: { color: '#f1f5f9', family: 'Space Grotesk', size: 13 }
    };
    Plotly.newPlot('segmentF1', [f1Trace], {
        ...CHART_THEME,
        margin: { t: 30, r: 20, b: 80, l: 50 },
        xaxis: { ...CHART_THEME.xaxis, tickangle: -30 },
        yaxis: { ...CHART_THEME.yaxis, title: 'F1 Score', range: [0, 1] },
        showlegend: false
    }, CHART_CONFIG);

    // Table
    const tbody = document.getElementById('segmentTableBody');
    if (tbody) {
        tbody.innerHTML = data.map(d => `
            <tr>
                <td><strong>${d.segment}</strong></td>
                <td>${d.n}</td>
                <td>${(d.churnRate * 100).toFixed(1)}%</td>
                <td>${(d.precision * 100).toFixed(1)}%</td>
                <td>${(d.recall * 100).toFixed(1)}%</td>
                <td>${d.f1.toFixed(3)}</td>
                <td>${(d.fpr * 100).toFixed(1)}%</td>
            </tr>
        `).join('');
    }
}

// --- Initialize All Charts ---
function initCharts() {
    renderConfusionMatrix();
    renderCurve('roc');
    renderModelComparison();
    renderROISensitivity();
    renderConfidenceIntervals();
    renderFeatureImportance('shap');
    renderSegmentCharts('contract');
}

// --- Window Resize ---
window.addEventListener('resize', () => {
    document.querySelectorAll('.chart-container').forEach(el => {
        if (el.data) Plotly.Plots.resize(el);
    });
});
