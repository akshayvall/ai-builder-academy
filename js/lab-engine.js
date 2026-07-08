/* ============================================
   LAB ENGINE v2 — Rich structured step-by-step labs
   (ported from AI Mastery Academy lab-engine.js;
    adds per-step persistence via ProgressManager.labSteps)

   Step schema:
   {
     title: 'Step title',
     subtitle: 'One-line description',
     duration: '5 min',
     instructions: [
       'Plain text instruction',
       { type: 'command', cmd: 'mkdir project' },
       { type: 'code', language: 'python', code: '...' },
       { type: 'tip', text: '...' },
       { type: 'warning', text: '...' },
       { type: 'verify', text: '...' },
       { type: 'heading', text: '...' },
       { type: 'list', items: ['...'] }
     ]
   }
   ============================================ */

const LabEngine = {
    currentLab: null,
    stepResults: [],

    init(moduleId, lab) {
        if (!lab) {
            document.getElementById('tab-lab').innerHTML = '<p>No lab available yet.</p>';
            return;
        }
        this.currentLab = moduleId;
        this.lab = lab;
        this.stepResults = ProgressManager.getLabSteps(moduleId, lab.steps.length);
        this.render();
    },

    render() {
        const container = document.getElementById('tab-lab');
        const lab = this.lab;
        const done = this.stepResults.filter(r => r === true).length;
        const total = lab.steps.length;
        const pct = Math.round((done / total) * 100);

        container.innerHTML = `
            <div class="lab-container fade-in">
                <div class="lab-hero">
                    <div class="lab-hero-icon">🧪</div>
                    <div class="lab-hero-text">
                        <h2>${lab.title}</h2>
                        <p>${lab.scenario || ''}</p>
                        <div class="lab-badges">
                            ${lab.duration ? `<span class="lab-badge lab-badge-time">⏱ ${lab.duration}</span>` : ''}
                            ${lab.cost ? `<span class="lab-badge lab-badge-cost">💰 ${lab.cost}</span>` : ''}
                            ${lab.difficulty ? `<span class="lab-badge lab-badge-diff">📊 ${lab.difficulty}</span>` : ''}
                        </div>
                    </div>
                </div>

                ${lab.prerequisites ? `
                <div class="lab-prereqs">
                    <h4>📋 Prerequisites</h4>
                    <ul>${lab.prerequisites.map(p => `<li>${p}</li>`).join('')}</ul>
                </div>` : ''}

                <div class="lab-progress-bar">
                    <div class="lab-progress-fill" style="width:${pct}%"></div>
                </div>
                <p style="text-align:center;font-size:13px;color:var(--text-secondary);margin:8px 0 24px">${done} / ${total} steps complete (${pct}%)</p>

                ${lab.steps.map((step, i) => this.renderStep(step, i)).join('')}

                ${done === total ? `
                <div class="lab-complete-banner">
                    <h3>🎉 Build Complete!</h3>
                    <p>Push it to GitHub for your portfolio, then take the quiz.</p>
                </div>` : ''}
            </div>`;
    },

    renderStep(step, index) {
        const isCompleted = this.stepResults[index] === true;
        const instructionsHtml = step.instructions.map(instr => {
            if (typeof instr === 'string') {
                return `<p class="lab-instr-text">${instr}</p>`;
            }
            switch (instr.type) {
                case 'heading':
                    return `<h5 class="lab-instr-heading">${instr.text}</h5>`;
                case 'command':
                    return `<div class="lab-cmd"><code>${this.escapeHtml(instr.cmd)}</code></div>`;
                case 'code':
                    return `<div class="lab-code-block"><div class="lab-code-lang">${instr.language || ''}</div><pre>${this.escapeHtml(instr.code)}</pre></div>`;
                case 'tip':
                    return `<div class="lab-tip">💡 <strong>Tip:</strong> ${instr.text}</div>`;
                case 'warning':
                    return `<div class="lab-warning">⚠️ <strong>Warning:</strong> ${instr.text}</div>`;
                case 'verify':
                    return `<div class="lab-verify">✅ <strong>Verify Your Work</strong><br>${instr.text}</div>`;
                case 'prompt':
                    return `<div class="lab-prompt"><div class="lab-prompt-header">💬 Paste this into Claude Code:</div><pre>${this.escapeHtml(instr.text)}</pre></div>`;
                case 'list':
                    return `<ul class="lab-list">${instr.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
                default:
                    return `<p>${instr.text || ''}</p>`;
            }
        }).join('');

        return `
            <div class="lab-step ${isCompleted ? 'lab-step-done' : ''}" id="lab-step-${index}">
                <div class="lab-step-header" onclick="LabEngine.toggleStep(${index})">
                    <div class="lab-step-num ${isCompleted ? 'lab-step-num-done' : ''}">${isCompleted ? '✓' : index + 1}</div>
                    <div class="lab-step-title-area">
                        <h4>${step.title}</h4>
                        ${step.subtitle ? `<p class="lab-step-subtitle">${step.subtitle}</p>` : ''}
                    </div>
                    ${step.duration ? `<span class="lab-step-time">⏱ ${step.duration}</span>` : ''}
                    <span class="lab-step-chevron">▼</span>
                </div>
                <div class="lab-step-body ${isCompleted ? 'lab-step-body-collapsed' : ''}" id="lab-step-body-${index}">
                    ${instructionsHtml}
                    ${!isCompleted ? `
                    <button class="lab-done-btn" onclick="LabEngine.markDone(${index})">
                        ✅ I've completed this step
                    </button>` : `
                    <button class="lab-done-btn" onclick="LabEngine.markUndone(${index})" style="border-color:var(--border);color:var(--text-secondary)">
                        ↺ Mark as not done
                    </button>`}
                </div>
            </div>`;
    },

    toggleStep(index) {
        const body = document.getElementById(`lab-step-body-${index}`);
        if (body) body.classList.toggle('lab-step-body-collapsed');
    },

    markDone(index) {
        this.stepResults[index] = true;
        ProgressManager.saveLabSteps(this.currentLab, this.stepResults);
        if (this.stepResults.every(r => r === true)) {
            ProgressManager.completeLab(this.currentLab);
            app.updateProgress();
            app.showToast('Build completed! 🎉', 'success');
        }
        this.render();
        const next = document.getElementById(`lab-step-${index + 1}`);
        if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    markUndone(index) {
        this.stepResults[index] = null;
        ProgressManager.saveLabSteps(this.currentLab, this.stepResults);
        this.render();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
