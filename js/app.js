/* ============================================
   APP — router, sidebar, dashboard, module view
   ============================================ */

const app = {
    currentModule: null,
    currentTab: 'learn',

    init() {
        this.renderSidebar();
        window.addEventListener('hashchange', () => this.route());
        this.route();
    },

    route() {
        const hash = window.location.hash;
        const match = hash.match(/^#\/module\/(.+)$/);
        if (match && MODULES.find(m => m.id === match[1])) {
            this.showModule(match[1]);
        } else {
            this.showDashboard();
        }
        document.getElementById('sidebar').classList.remove('open');
    },

    goHome() { window.location.hash = ''; },
    open(moduleId) { window.location.hash = '#/module/' + moduleId; },

    /* ---------- sidebar ---------- */
    renderSidebar() {
        const nav = document.getElementById('moduleNav');
        nav.innerHTML = `
            <div class="nav-item ${!this.currentModule ? 'active' : ''}" onclick="app.goHome()">
                <span class="nav-icon">🏠</span><span class="nav-title">Dashboard</span>
            </div>` +
            MODULES.map((m, i) => {
                const st = ProgressManager.getModuleStatus(m.id);
                const dot = st.completed ? 'done' : (st.labStarted || st.quizScore ? 'started' : '');
                return `
                <div class="nav-item ${this.currentModule === m.id ? 'active' : ''}" onclick="app.open('${m.id}')">
                    <span class="nav-icon">${m.icon}</span>
                    <span class="nav-title">${m.shortTitle}</span>
                    <span class="nav-num">${String(i + 1).padStart(2, '0')}</span>
                    <span class="nav-status ${dot}"></span>
                </div>`;
            }).join('');
        this.updateProgress();
    },

    updateProgress() {
        const done = MODULES.filter(m => ProgressManager.getModuleStatus(m.id).completed).length;
        const pct = Math.round((done / MODULES.length) * 100);
        document.getElementById('overallFill').style.width = pct + '%';
        document.getElementById('overallLabel').textContent = pct + '%';
    },

    /* ---------- dashboard ---------- */
    showDashboard() {
        this.currentModule = null;
        this.renderSidebar();
        const stats = ProgressManager.getStats();
        const progress = ProgressManager.getProgress();
        document.getElementById('main').innerHTML = `
            <div class="fade-in">
                <div class="dash-hero">
                    <h1>🛠️ AI Builder Academy</h1>
                    <p>Seven portfolio-grade AI engineering builds. Each one teaches a production concept —
                       protocols, orchestration, evals, security, observability, training, and graphs —
                       through a hands-on lab with acceptance criteria. Progress saves in your browser.</p>
                </div>
                <div class="stats-row">
                    <div class="stat-card"><div class="stat-value">${stats.modulesCompleted}/${MODULES.length}</div><div class="stat-label">Builds complete</div></div>
                    <div class="stat-card"><div class="stat-value">${stats.labsCompleted}</div><div class="stat-label">Labs finished</div></div>
                    <div class="stat-card"><div class="stat-value">${stats.quizzesPassed}</div><div class="stat-label">Quizzes passed</div></div>
                    <div class="stat-card"><div class="stat-value">${stats.streak}🔥</div><div class="stat-label">Day streak</div></div>
                </div>
                ${progress.lastVisited && MODULES.find(m => m.id === progress.lastVisited) ? `
                <button class="btn-primary" style="margin-bottom:22px" onclick="app.open('${progress.lastVisited}')">
                    ▶ Continue: ${MODULES.find(m => m.id === progress.lastVisited).shortTitle}
                </button>` : ''}
                <div class="module-grid">
                    ${MODULES.map((m, i) => {
                        const st = ProgressManager.getModuleStatus(m.id);
                        return `
                        <div class="module-card" onclick="app.open('${m.id}')">
                            <span class="mc-status">${st.completed ? '✅' : (st.labStarted || st.quizScore ? '🟡' : '')}</span>
                            <div class="mc-icon">${m.icon}</div>
                            <h3>${String(i + 1).padStart(2, '0')} · ${m.title}</h3>
                            <p>${m.tagline}</p>
                            <div class="mc-meta">
                                <span class="chip">${m.difficulty}</span>
                                <span class="chip">${m.time}</span>
                                ${st.labCompleted ? '<span class="chip done">Lab ✓</span>' : ''}
                                ${st.quizScore && (st.quizScore.score / st.quizScore.total) >= 0.7 ? '<span class="chip done">Quiz ✓</span>' : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
    },

    /* ---------- module view ---------- */
    showModule(moduleId) {
        this.currentModule = moduleId;
        ProgressManager.setLastVisited(moduleId);
        this.renderSidebar();
        const m = MODULES.find(x => x.id === moduleId);
        const st = ProgressManager.getModuleStatus(moduleId);
        document.getElementById('main').innerHTML = `
            <div class="fade-in">
                <div class="module-header">
                    <div class="mh-top">
                        <span class="mh-icon">${m.icon}</span>
                        <h1>${m.title}</h1>
                    </div>
                    <p class="tagline">${m.tagline}</p>
                    <div class="mh-badges">
                        <span class="chip">📊 ${m.difficulty}</span>
                        <span class="chip">⏱ ${m.time}</span>
                        <span class="chip">🧠 ${m.concept}</span>
                    </div>
                </div>
                <div class="tabs">
                    <button class="tab-btn active" id="tabbtn-learn" onclick="app.switchTab('learn')">📖 Learn</button>
                    <button class="tab-btn" id="tabbtn-lab" onclick="app.switchTab('lab')">🧪 Build Lab</button>
                    <button class="tab-btn" id="tabbtn-quiz" onclick="app.switchTab('quiz')">❓ Quiz</button>
                </div>
                <div class="tab-content active" id="tab-learn">${m.learn}</div>
                <div class="tab-content" id="tab-lab"></div>
                <div class="tab-content" id="tab-quiz"></div>
                <div class="module-footer">
                    ${st.completed ?
                        `<button class="btn-secondary" onclick="app.toggleComplete('${m.id}', false)">✅ Completed — click to un-mark</button>` :
                        `<button class="btn-primary" onclick="app.toggleComplete('${m.id}', true)">Mark build complete</button>`}
                    <span style="font-size:13px;color:var(--text-secondary)">Tip: finish the lab checklist and pass the quiz (70%+) first.</span>
                </div>
            </div>`;
        LabEngine.init(m.id, m.lab);
        QuizEngine.init(m.id, m.quiz);
        this.switchTab('learn');
        window.scrollTo(0, 0);
    },

    switchTab(tab) {
        this.currentTab = tab;
        ['learn', 'lab', 'quiz'].forEach(t => {
            const btn = document.getElementById('tabbtn-' + t);
            const panel = document.getElementById('tab-' + t);
            if (btn) btn.classList.toggle('active', t === tab);
            if (panel) panel.classList.toggle('active', t === tab);
        });
    },

    toggleComplete(moduleId, complete) {
        if (complete) {
            ProgressManager.completeModule(moduleId);
            this.showToast('Build marked complete! 🎉', 'success');
        } else {
            ProgressManager.uncompleteModule(moduleId);
        }
        this.showModule(moduleId);
    },

    /* ---------- progress utils ---------- */
    importFile(input) {
        if (!input.files || !input.files[0]) return;
        ProgressManager.importProgress(input.files[0])
            .then(() => { this.showToast('Progress imported ✓', 'success'); this.route(); this.renderSidebar(); })
            .catch(() => this.showToast('Invalid progress file', ''));
        input.value = '';
    },

    resetProgress() {
        if (!confirm('Reset all progress? Export first if you want a backup.')) return;
        ProgressManager.resetAll();
        this.route();
        this.renderSidebar();
        this.showToast('Progress reset');
    },

    showToast(msg, type) {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.className = 'toast show ' + (type || '');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => { t.className = 'toast'; }, 2600);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
