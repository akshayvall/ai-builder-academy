/* ============================================
   BUILDER ACADEMY DIAGRAM ENGINE
   Interactive, animated SVG visualisations.
   Same public API as the AI/Networking Academy engines:
     DiagramEngine.render(diagrams)   // array from module.diagrams
     DiagramEngine.play(id) / reset(id) / stepThrough(id)

   Diagram object: { id, type, title, description?, steps?, legend?, data }
   All builders are config-driven — content lives in modules.js.
   Dark-theme palette matched to css/style.css.
   ============================================ */

const DiagramEngine = {

    C: {  // palette
        purple: '#8b7cf6', blue: '#38bdf8', green: '#34d399', amber: '#fbbf24',
        red: '#f87171', pink: '#f472b6', text: '#e8eaf2', sub: '#9aa1b5',
        node: '#1b1f2e', nodeBorder: '#2a3044', canvas: '#10131c'
    },

    /* ── render API ── */
    render(diagrams) {
        const container = document.getElementById('tab-diagrams');
        if (!container) return;
        if (!diagrams || diagrams.length === 0) {
            container.innerHTML = '<p style="color:var(--text-secondary)">No diagrams for this module yet.</p>';
            return;
        }
        container.innerHTML = diagrams.map(d => this.renderShell(d)).join('');
        diagrams.forEach(d => this.initDiagram(d));
    },

    renderShell(d) {
        return `
        <div class="visual-diagram fade-in" id="diagram-${d.id}">
            <div class="diagram-title-bar">
                <h3>${d.title}</h3>
                <div class="diagram-controls">
                    ${d.steps ? `<button class="diag-btn" onclick="DiagramEngine.stepThrough('${d.id}')">⏭ Step</button>` : ''}
                    <button class="diag-btn" onclick="DiagramEngine.play('${d.id}')">▶ Animate</button>
                    <button class="diag-btn" onclick="DiagramEngine.reset('${d.id}')">↺ Reset</button>
                </div>
            </div>
            ${d.description ? `<p class="diagram-description">${d.description}</p>` : ''}
            <div class="diagram-canvas" id="canvas-${d.id}" data-step="0"></div>
            ${d.steps ? `
            <div class="diagram-step-info">
                <span class="step-counter">Step <span id="stepcnt-${d.id}">0</span>/${d.steps.length}</span>
                <span class="step-text" id="steptxt-${d.id}">Click ⏭ Step to walk through, or ▶ Animate for flow.</span>
            </div>` : ''}
            ${d.legend ? `<div class="diagram-legend">${d.legend.map(l =>
                `<span class="legend-item"><span class="legend-dot" style="background:${l.color}"></span>${l.label}</span>`).join('')}</div>` : ''}
        </div>`;
    },

    initDiagram(d) {
        const canvas = document.getElementById(`canvas-${d.id}`);
        if (!canvas) return;
        const builder = this.builders[d.type] || this.builders._fallback;
        canvas.innerHTML = builder.call(this, d);
    },

    play(id) {
        const canvas = document.getElementById(`canvas-${id}`);
        if (!canvas) return;
        canvas.classList.remove('animating'); void canvas.offsetWidth;
        canvas.classList.add('animating');
    },

    reset(id) {
        const canvas = document.getElementById(`canvas-${id}`);
        if (!canvas) return;
        canvas.classList.remove('animating');
        canvas.dataset.step = '0';
        canvas.querySelectorAll('.step-highlight').forEach(el => el.classList.remove('active'));
        const cnt = document.getElementById(`stepcnt-${id}`), txt = document.getElementById(`steptxt-${id}`);
        if (cnt) cnt.textContent = '0';
        if (txt) txt.textContent = 'Click ⏭ Step to walk through, or ▶ Animate for flow.';
    },

    stepThrough(id) {
        const canvas = document.getElementById(`canvas-${id}`);
        const m = MODULES.find(mod => (mod.diagrams || []).some(x => x.id === id));
        const d = m && m.diagrams.find(x => x.id === id);
        if (!canvas || !d || !d.steps) return;
        let step = (parseInt(canvas.dataset.step, 10) || 0) + 1;
        if (step > d.steps.length) step = 0;
        canvas.dataset.step = step;
        canvas.querySelectorAll('.step-highlight').forEach(el => el.classList.remove('active'));
        if (step > 0) canvas.querySelectorAll(`[data-step="${step}"]`).forEach(el => el.classList.add('active'));
        const cnt = document.getElementById(`stepcnt-${id}`), txt = document.getElementById(`steptxt-${id}`);
        if (cnt) cnt.textContent = step;
        if (txt) txt.textContent = step === 0 ? 'Click ⏭ Step to walk through, or ▶ Animate for flow.' : d.steps[step - 1];
    },

    /* ── shared SVG helpers ── */
    arrow(color) {
        const id = 'ah-' + color.replace('#', '');
        return `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,1 L10,5 L0,9 Z" fill="${color}"/></marker>`;
    },

    nodeBox(n, defaults) {
        const c = n.color || defaults;
        const lines = (n.sub || '').split('\n');
        return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10"
                 fill="${this.C.node}" stroke="${c}" stroke-width="2"/>
            ${n.icon ? `<text x="${n.x + n.w / 2}" y="${n.y + 24}" text-anchor="middle" font-size="18">${n.icon}</text>` : ''}
            <text x="${n.x + n.w / 2}" y="${n.y + (n.icon ? 44 : 24)}" text-anchor="middle" fill="${this.C.text}" font-size="13" font-weight="700">${n.label}</text>
            ${lines.map((s, i) => `<text x="${n.x + n.w / 2}" y="${n.y + (n.icon ? 60 : 40) + i * 14}" text-anchor="middle" fill="${this.C.sub}" font-size="10.5">${s}</text>`).join('')}`;
    },

    edgePath(a, b) {
        // horizontal-ish: exit right of a, enter left of b (or reverse); vertical if stacked
        const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 }, bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
        if (Math.abs(ac.y - bc.y) < 10) {                       // same row
            const x1 = ac.x < bc.x ? a.x + a.w : a.x, x2 = ac.x < bc.x ? b.x : b.x + b.w;
            return `M ${x1} ${ac.y} L ${x2} ${bc.y}`;
        }
        if (Math.abs(ac.x - bc.x) < 10) {                       // same column
            const y1 = ac.y < bc.y ? a.y + a.h : a.y, y2 = ac.y < bc.y ? b.y : b.y + b.h;
            return `M ${ac.x} ${y1} L ${bc.x} ${y2}`;
        }
        // L-shaped: out of a's side toward b
        const x1 = ac.x < bc.x ? a.x + a.w : a.x;
        const y2 = ac.y < bc.y ? b.y : b.y + b.h;
        return `M ${x1} ${ac.y} L ${bc.x} ${ac.y} L ${bc.x} ${y2}`;
    },

    /* ──────────────────────────────────────────
       BUILDERS
       ────────────────────────────────────────── */
    builders: {

        /* Generic node/edge flow with animated dots.
           data: { viewBox, nodes:[{id,x,y,w,h,label,sub,icon,color,step}],
                   edges:[{from,to,label,color,dashed,step,dot}] } */
        pipeline(d) {
            const { nodes, edges, viewBox = '0 0 860 420' } = d.data;
            const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
            const colors = [...new Set(edges.map(e => e.color || this.C.purple))];
            const edgeSvg = edges.map(e => {
                const p = this.edgePath(byId[e.from], byId[e.to]);
                const c = e.color || this.C.purple;
                const mid = byId[e.from].x + byId[e.from].w / 2 < byId[e.to].x + byId[e.to].w / 2;
                return `<g ${e.step ? `data-step="${e.step}" class="step-highlight"` : ''}>
                    <path d="${p}" fill="none" stroke="${c}" stroke-width="2" ${e.dashed ? 'stroke-dasharray="6 5"' : ''} marker-end="url(#ah-${c.replace('#','')})"/>
                    ${e.label ? `<text x="${(byId[e.from].x + byId[e.from].w / 2 + byId[e.to].x + byId[e.to].w / 2) / 2}" y="${(byId[e.from].y + byId[e.from].h / 2 + byId[e.to].y + byId[e.to].h / 2) / 2 - 8}" text-anchor="middle" fill="${this.C.sub}" font-size="10.5" font-style="italic">${e.label}</text>` : ''}
                    ${e.dot !== false ? `<circle r="4.5" fill="${c}" class="flow-dot"><animateMotion dur="${e.dur || 2.2}s" repeatCount="indefinite" path="${p}"/></circle>` : ''}
                </g>`;
            }).join('');
            const nodeSvg = nodes.map(n =>
                `<g ${n.step ? `data-step="${n.step}" class="step-highlight"` : ''}>${this.nodeBox(n, this.C.purple)}</g>`).join('');
            return `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">
                <defs>${colors.map(c => this.arrow(c)).join('')}</defs>${edgeSvg}${nodeSvg}</svg>`;
        },

        /* Stacked horizontal layers (defense-in-depth, LoRA stack).
           data: { viewBox, title, layers:[{label,sub,color,step,blocked?}] } */
        layers(d) {
            const { layers, viewBox = '0 0 860 400' } = d.data;
            const w = 640, x = 110, h = Math.min(58, 320 / layers.length - 10);
            const rows = layers.map((l, i) => {
                const y = 40 + i * (h + 14);
                return `<g ${l.step ? `data-step="${l.step}" class="step-highlight"` : ''}>
                    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${this.C.node}" stroke="${l.color}" stroke-width="2"/>
                    <text x="${x + 18}" y="${y + h / 2 - 4}" fill="${this.C.text}" font-size="13.5" font-weight="700">${l.label}</text>
                    <text x="${x + 18}" y="${y + h / 2 + 14}" fill="${this.C.sub}" font-size="11">${l.sub || ''}</text>
                    ${l.tag ? `<text x="${x + w - 16}" y="${y + h / 2 + 5}" text-anchor="end" fill="${l.color}" font-size="11.5" font-weight="700">${l.tag}</text>` : ''}
                </g>
                ${i < layers.length - 1 ? `<line x1="${x + w / 2}" y1="${y + h}" x2="${x + w / 2}" y2="${y + h + 14}" stroke="${this.C.nodeBorder}" stroke-width="2"/>` : ''}`;
            }).join('');
            return `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">${rows}</svg>`;
        },

        /* Horizontal bars, optional pairs (base vs tuned, scores).
           data: { viewBox, unit, bars:[{label, value(0-1), display, color, step, value2?, color2?}], series?:[nameA,nameB] } */
        bars(d) {
            const { bars, series, viewBox = '0 0 860 420' } = d.data;
            const x0 = 250, wMax = 480, rowH = series ? 52 : 42;
            const rows = bars.map((b, i) => {
                const y = 70 + i * rowH;
                const w1 = b.value * wMax;
                let out = `<g ${b.step ? `data-step="${b.step}" class="step-highlight"` : ''}>
                    <text x="${x0 - 14}" y="${y + 15}" text-anchor="end" fill="${this.C.text}" font-size="12.5" font-weight="600">${b.label}</text>
                    <rect x="${x0}" y="${y}" width="${wMax}" height="18" rx="4" fill="${this.C.node}"/>
                    <rect x="${x0}" y="${y}" width="${w1}" height="18" rx="4" fill="${b.color || this.C.purple}" class="bar-fill"/>
                    <text x="${x0 + w1 + 10}" y="${y + 14}" fill="${b.color || this.C.purple}" font-size="12" font-weight="700">${b.display}</text>`;
                if (series && b.value2 !== undefined) {
                    const w2 = b.value2 * wMax;
                    out += `<rect x="${x0}" y="${y + 22}" width="${wMax}" height="18" rx="4" fill="${this.C.node}"/>
                    <rect x="${x0}" y="${y + 22}" width="${w2}" height="18" rx="4" fill="${b.color2 || this.C.blue}" class="bar-fill"/>
                    <text x="${x0 + w2 + 10}" y="${y + 36}" fill="${b.color2 || this.C.blue}" font-size="12" font-weight="700">${b.display2}</text>`;
                }
                return out + '</g>';
            }).join('');
            const legend = series ? `
                <rect x="${x0}" y="30" width="14" height="14" rx="3" fill="${this.C.purple}"/><text x="${x0 + 20}" y="42" fill="${this.C.sub}" font-size="12">${series[0]}</text>
                <rect x="${x0 + 130}" y="30" width="14" height="14" rx="3" fill="${this.C.blue}"/><text x="${x0 + 150}" y="42" fill="${this.C.sub}" font-size="12">${series[1]}</text>` : '';
            return `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">${legend}${rows}</svg>`;
        },

        /* Line curves (training loss shapes).
           data: { viewBox, xLabel, yLabel, curves:[{label,color,points:[[x,y]..0-1 space],step}] } */
        curves(d) {
            const { curves, xLabel, yLabel, viewBox = '0 0 860 420' } = d.data;
            const ox = 90, oy = 340, w = 660, h = 260;
            const toX = v => ox + v * w, toY = v => oy - v * h;
            const paths = curves.map(c => {
                const pts = c.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p[0])} ${toY(p[1])}`).join(' ');
                const last = c.points[c.points.length - 1];
                return `<g ${c.step ? `data-step="${c.step}" class="step-highlight"` : ''}>
                    <path d="${pts}" fill="none" stroke="${c.color}" stroke-width="2.5" class="curve-path"/>
                    <text x="${toX(last[0]) + 8}" y="${toY(last[1]) + 4}" fill="${c.color}" font-size="12" font-weight="700">${c.label}</text>
                </g>`;
            }).join('');
            return `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">
                <line x1="${ox}" y1="${oy}" x2="${ox + w}" y2="${oy}" stroke="${this.C.nodeBorder}" stroke-width="2"/>
                <line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy - h}" stroke="${this.C.nodeBorder}" stroke-width="2"/>
                <text x="${ox + w / 2}" y="${oy + 34}" text-anchor="middle" fill="${this.C.sub}" font-size="12">${xLabel}</text>
                <text x="${ox - 40}" y="${oy - h / 2}" text-anchor="middle" fill="${this.C.sub}" font-size="12" transform="rotate(-90 ${ox - 40} ${oy - h / 2})">${yLabel}</text>
                ${paths}</svg>`;
        },

        /* Force-style knowledge graph (pre-positioned).
           data: { viewBox, nodes:[{id,x,y,label,type,color,step}], links:[{from,to,label,step,hop?}] } */
        graph(d) {
            const { nodes, links, viewBox = '0 0 860 440' } = d.data;
            const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
            const linkSvg = links.map(l => {
                const a = byId[l.from], b = byId[l.to];
                const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                return `<g ${l.step ? `data-step="${l.step}" class="step-highlight"` : ''}>
                    <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${l.hop ? this.C.amber : this.C.nodeBorder}" stroke-width="${l.hop ? 3 : 1.5}" class="${l.hop ? 'hop-edge' : ''}"/>
                    <text x="${mx}" y="${my - 6}" text-anchor="middle" fill="${l.hop ? this.C.amber : this.C.sub}" font-size="9.5" font-style="italic">${l.label}</text>
                </g>`;
            }).join('');
            const nodeSvg = nodes.map(n => `
                <g ${n.step ? `data-step="${n.step}" class="step-highlight"` : ''}>
                    <circle cx="${n.x}" cy="${n.y}" r="26" fill="${this.C.node}" stroke="${n.color}" stroke-width="2.5" class="graph-node"/>
                    <text x="${n.x}" y="${n.y - 2}" text-anchor="middle" fill="${this.C.text}" font-size="10.5" font-weight="700">${n.label}</text>
                    <text x="${n.x}" y="${n.y + 11}" text-anchor="middle" fill="${n.color}" font-size="8.5">${n.type}</text>
                </g>`).join('');
            return `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">${linkSvg}${nodeSvg}</svg>`;
        },

        /* Vertical event timeline (audit trace).
           data: { viewBox, events:[{kind,actor,text,color,step}] } */
        timeline(d) {
            const { events, viewBox = '0 0 860 480' } = d.data;
            const x = 150, rowH = Math.min(62, 420 / events.length);
            const rows = events.map((e, i) => {
                const y = 36 + i * rowH;
                return `<g ${e.step ? `data-step="${e.step}" class="step-highlight"` : ''}>
                    <circle cx="${x}" cy="${y}" r="7" fill="${e.color}" class="timeline-dot"/>
                    ${i < events.length - 1 ? `<line x1="${x}" y1="${y + 8}" x2="${x}" y2="${y + rowH - 8}" stroke="${this.C.nodeBorder}" stroke-width="2"/>` : ''}
                    <text x="${x - 20}" y="${y + 4}" text-anchor="end" fill="${e.color}" font-size="11.5" font-weight="700" font-family="ui-monospace,Consolas,monospace">${e.kind}</text>
                    <rect x="${x + 22}" y="${y - 15}" width="600" height="32" rx="8" fill="${this.C.node}" stroke="${this.C.nodeBorder}"/>
                    <text x="${x + 36}" y="${y - 1}" fill="${this.C.text}" font-size="11">${e.text}</text>
                    <text x="${x + 36}" y="${y + 12}" fill="${this.C.sub}" font-size="9.5">actor: ${e.actor}</text>
                </g>`;
            }).join('');
            return `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">${rows}</svg>`;
        },

        _fallback(d) {
            return `<svg viewBox="0 0 860 120"><text x="430" y="60" text-anchor="middle" fill="${this.C.sub}">Diagram type "${d.type}" not found</text></svg>`;
        }
    }
};
