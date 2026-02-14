// ============================================================
// ChurnSense AI - Main Application Controller
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- Animated Number Counting ---
    function animateCounters() {
        document.querySelectorAll('.kpi-value[data-count]').forEach(el => {
            const target = parseInt(el.dataset.count);
            const prefix = el.dataset.prefix || '';
            const suffix = el.dataset.suffix || '';
            const useSep = el.dataset.separator === 'true';
            const duration = 2000;
            const start = performance.now();

            function update(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(eased * target);
                const formatted = useSep ? current.toLocaleString() : current;
                el.textContent = prefix + formatted + suffix;
                if (progress < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
        });
    }

    // --- Scroll Animations ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Trigger counter animation when hero KPIs come into view
                if (entry.target.closest && entry.target.closest('.kpi-grid')) {
                    animateCounters();
                }
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('[data-animate], .section').forEach(el => observer.observe(el));

    // --- Nav Scroll Effect ---
    const nav = document.getElementById('mainNav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
    });

    // --- Active Nav Link ---
    const sections = document.querySelectorAll('.section[id]');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');

    function updateActiveNav() {
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 150;
            if (window.scrollY >= top) current = section.id;
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === current);
        });
    }
    window.addEventListener('scroll', updateActiveNav);

    // --- Hamburger Menu ---
    const hamburger = document.getElementById('navHamburger');
    const navLinksContainer = document.getElementById('navLinks');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinksContainer.classList.toggle('open');
        });
        // Close on link click
        navLinksContainer.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => navLinksContainer.classList.remove('open'));
        });
    }

    // --- Chart Toggle: ROC/PR ---
    document.querySelectorAll('.chart-toggle .toggle-btn[data-curve]').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.parentElement.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCurve(btn.dataset.curve);
        });
    });

    // --- Chart Toggle: Feature Importance ---
    document.querySelectorAll('.chart-toggle .toggle-btn[data-fi]').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.parentElement.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFeatureImportance(btn.dataset.fi);
        });
    });

    // --- Segment Tabs ---
    document.querySelectorAll('.segment-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.segment-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderSegmentCharts(tab.dataset.segment);
        });
    });

    // --- Smooth Scroll for Nav Links ---
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // --- Initialize Charts (deferred until Plotly loads) ---
    function waitForPlotly() {
        if (typeof Plotly !== 'undefined') {
            initCharts();
            Simulator.init();
        } else {
            setTimeout(waitForPlotly, 100);
        }
    }
    waitForPlotly();

    // --- Initialize Chatbot ---
    Chatbot.init();

    // --- Stagger KPI card animations ---
    document.querySelectorAll('.kpi-card').forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.1}s`;
    });

    // --- Insight bar fill animation ---
    const barObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.width = entry.target.style.width;
            }
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('.insight-bar-fill').forEach(bar => barObserver.observe(bar));
});
