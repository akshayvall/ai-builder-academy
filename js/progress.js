/* ============================================
   PROGRESS TRACKING — localStorage based
   (adapted from AI Mastery Academy progress.js;
    adds per-step lab persistence)
   ============================================ */

const ProgressManager = {
    STORAGE_KEY: 'ai-builder-academy-progress',

    getProgress() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : this.defaultProgress();
        } catch { return this.defaultProgress(); }
    },

    defaultProgress() {
        return {
            completedModules: [],
            quizScores: {},
            completedLabs: [],
            labSteps: {},          // { moduleId: [true, null, ...] } — per-step save
            lastVisited: null,
            streak: { count: 0, lastDate: null },
            startDate: new Date().toISOString()
        };
    },

    saveProgress(progress) {
        try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress)); }
        catch (e) { console.error('Failed to save progress:', e); }
    },

    completeModule(moduleId) {
        const progress = this.getProgress();
        if (!progress.completedModules.includes(moduleId)) progress.completedModules.push(moduleId);
        this.updateStreak(progress);
        this.saveProgress(progress);
        return progress;
    },

    uncompleteModule(moduleId) {
        const progress = this.getProgress();
        progress.completedModules = progress.completedModules.filter(id => id !== moduleId);
        this.saveProgress(progress);
        return progress;
    },

    saveQuizScore(moduleId, score, total) {
        const progress = this.getProgress();
        progress.quizScores[moduleId] = { score, total, date: new Date().toISOString() };
        this.updateStreak(progress);
        this.saveProgress(progress);
        return progress;
    },

    completeLab(moduleId) {
        const progress = this.getProgress();
        if (!progress.completedLabs.includes(moduleId)) progress.completedLabs.push(moduleId);
        this.updateStreak(progress);
        this.saveProgress(progress);
        return progress;
    },

    // ─── per-step lab persistence ────────────
    getLabSteps(moduleId, total) {
        const progress = this.getProgress();
        const saved = (progress.labSteps && progress.labSteps[moduleId]) || [];
        const arr = new Array(total).fill(null);
        saved.forEach((v, i) => { if (i < total) arr[i] = v; });
        return arr;
    },

    saveLabSteps(moduleId, stepResults) {
        const progress = this.getProgress();
        if (!progress.labSteps) progress.labSteps = {};
        progress.labSteps[moduleId] = stepResults;
        this.saveProgress(progress);
    },

    setLastVisited(moduleId) {
        const progress = this.getProgress();
        progress.lastVisited = moduleId;
        this.saveProgress(progress);
    },

    updateStreak(progress) {
        const today = new Date().toISOString().split('T')[0];
        if (progress.streak.lastDate === today) return;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (progress.streak.lastDate === yesterday) { progress.streak.count++; }
        else { progress.streak.count = 1; }
        progress.streak.lastDate = today;
    },

    getStats() {
        const progress = this.getProgress();
        return {
            modulesCompleted: progress.completedModules.length,
            quizzesPassed: Object.values(progress.quizScores).filter(q => (q.score / q.total) >= 0.7).length,
            labsCompleted: progress.completedLabs.length,
            streak: progress.streak.count
        };
    },

    getModuleStatus(moduleId) {
        const progress = this.getProgress();
        const steps = (progress.labSteps && progress.labSteps[moduleId]) || [];
        return {
            completed: progress.completedModules.includes(moduleId),
            quizScore: progress.quizScores[moduleId] || null,
            labCompleted: progress.completedLabs.includes(moduleId),
            labStarted: steps.some(s => s === true)
        };
    },

    resetAll() { localStorage.removeItem(this.STORAGE_KEY); },

    exportProgress() {
        const progress = this.getProgress();
        const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-builder-academy-progress-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    importProgress(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.completedModules && data.quizScores) { this.saveProgress(data); resolve(data); }
                    else { reject(new Error('Invalid progress file format')); }
                } catch (err) { reject(err); }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
};
