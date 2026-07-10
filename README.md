# 🛠️ AI Builder Academy

> **📌 Frozen showcase.** This site is a portfolio snapshot of the seven builds and is no
> longer independently maintained. The living, maintained version — same content plus the
> full curriculum around it — is the **Builder Track (Level 400)** in
> [AI Mastery Academy](https://akshayvall.github.io/ai-mastery-academy/)
> ([repo](https://github.com/akshayvall/ai-mastery-academy)). Content source of truth:
> `AI_Engineer_Builds/site/js/modules.js`, exported via `tools/export-academy.js`.


An interactive, self-paced site for seven portfolio-grade AI engineering builds — MCP
assistants, multi-agent orchestration, eval pipelines, RAG security guardrails, audit
logs, fine-tuning, and knowledge graphs.

Each build has three tabs:
- **📖 Learn** — the core concept + architecture diagram
- **🧪 Build Lab** — phased, step-by-step instructions with runnable code
- **❓ Quiz** — 5–6 questions, 70% to pass

**Progress saves in your browser** (localStorage): lab steps, quiz scores, module
completion, and a day streak — with JSON export / import and reset.

## Run locally

Pure HTML/CSS/JS — no build step, no dependencies.

```bash
python -m http.server 8231
# open http://localhost:8231
```

## Live site

Deployed via GitHub Pages. See repository Settings → Pages.

## Structure

```
index.html          # shell
css/style.css       # dark theme
js/modules.js       # the 7 builds (content)
js/progress.js      # localStorage progress + per-step lab save
js/quiz-engine.js   # quiz rendering & scoring
js/lab-engine.js    # step-by-step lab engine
js/app.js           # router, sidebar, dashboard
```

Engine architecture adapted from the AI Mastery Academy sibling project. Build content
is derived from the guides in the `AI_Engineer_Builds` project.
