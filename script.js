// script.js — The Sarcastic Political Test
// Data lives in questions.js, ideology_summaries.js and ideology_ideal_points.js.

(() => {
    'use strict';

    // ------------------------------------------------------------------
    // Data checks
    // ------------------------------------------------------------------
    const fail = (msg) => {
        document.querySelector('main').innerHTML = `<p class="fatal">Error: ${msg}</p>`;
    };
    if (typeof questions === 'undefined' || !Array.isArray(questions) || !questions.length) return fail('questions.js not loaded or empty.');
    if (typeof ideologySummaries === 'undefined') return fail('ideology_summaries.js not loaded.');
    if (typeof ideologyIdealPoints === 'undefined') return fail('ideology_ideal_points.js not loaded.');

    const AXES = ['c', 'm', 'p'];
    const AXIS_INFO = {
        c: { name: 'Centralism', blurb: 'Someone official will sort it out. Please fill in this form.' },
        m: { name: 'Communalism', blurb: "We'll all decide together. The meeting starts at 7, and 9, and 11." },
        p: { name: 'Privatism', blurb: 'The market will sort it out. Terms and conditions apply.' },
    };
    const IDEOLOGIES = Object.entries(ideologyIdealPoints).map(([name, pt]) => ({ name, ...pt }));
    const BROAD_ORDER = [...new Set(IDEOLOGIES.map(i => i.broad))];
    const broadIndex = (b) => BROAD_ORDER.indexOf(b);

    const params = new URLSearchParams(location.search);
    const isDevMode = params.get('dev') === 'true';
    const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isDevMode) {
        const missing = IDEOLOGIES.filter(i => !ideologySummaries[i.name]).map(i => i.name);
        if (missing.length) console.warn('Ideologies with no summary:', missing);
        IDEOLOGIES.forEach(i => { if (Math.abs(i.c + i.m + i.p - 100) > 0.01) console.warn('Ideal point does not sum to 100:', i.name); });
    }

    // ------------------------------------------------------------------
    // Scoring
    // ------------------------------------------------------------------
    // Triangle: every answer is a point in the triangle (see questions.js); your position is
    // the average of your points. Order: the average of your agree-scale answers (-2..+2),
    // rescaled to 0 (all liberty) .. 100 (all order).
    const ORDER_WEIGHT = 0.6;   // how much Order counts when matching ideologies (tools/calibrate.js uses the same)
    const isScale = (q) => q.type === 'agreeScale';

    // Replays answers from scratch. answers[i] = original option index for questions[order[i]].
    // Because it always rebuilds, going Back can never leave the totals in a half-undone state.
    function computeRaw(order, answers) {
        const total = { c: 0, m: 0, p: 0, a: 0 };
        let nTri = 0, nA = 0;
        answers.forEach((optIndex, i) => {
            if (optIndex == null) return;
            const q = questions[order[i]];
            const s = q.options[optIndex].scores;
            if (isScale(q)) { total.a += Number(s.a) || 0; nA++; }
            else { for (const ax of AXES) total[ax] += Number(s[ax]) || 0; nTri++; }
        });
        return { total, nTri, nA };
    }

    function normalise({ total, nTri, nA }) {
        const pos = nTri
            ? { c: total.c / nTri * 100, m: total.m / nTri * 100, p: total.p / nTri * 100 }
            : { c: 100 / 3, m: 100 / 3, p: 100 / 3 };
        const sum = pos.c + pos.m + pos.p || 1;   // guard against rounding in hand-edited scores
        for (const ax of AXES) pos[ax] = pos[ax] / sum * 100;
        pos.a = nA ? Math.max(0, Math.min(100, (total.a / nA + 2) / 4 * 100)) : 50;
        return pos;
    }

    const triDist = (a, b) => Math.hypot(a.c - b.c, a.m - b.m, a.p - b.p);
    const dist = (a, b) => Math.hypot(triDist(a, b), ORDER_WEIGHT * ((a.a ?? 50) - (b.a ?? 50)));

    function rankIdeologies(pos) {
        return IDEOLOGIES.map(i => ({ ...i, d: dist(pos, i) })).sort((a, b) => a.d - b.d);
    }

    // How strongly you lean: distance from the centre of the triangle, as a share of centre-to-corner.
    const CENTRE = { c: 100 / 3, m: 100 / 3, p: 100 / 3, a: 50 };
    const CORNER_DIST = triDist(CENTRE, { c: 100, m: 0, p: 0 });
    const extremity = (pos) => Math.min(100, triDist(pos, CENTRE) / CORNER_DIST * 100);
    const WEAK_LEAN = 12; // below this, the result says the match is loose

    // ------------------------------------------------------------------
    // Triangle geometry (C top, M bottom-left, P bottom-right)
    // ------------------------------------------------------------------
    const SIDE = 330, H = SIDE * Math.sqrt(3) / 2;
    const V = { c: [200, 26], m: [200 - SIDE / 2, 26 + H], p: [200 + SIDE / 2, 26 + H] };
    const toXY = (pt) => {
        const s = (pt.c + pt.m + pt.p) || 100;
        return [
            (pt.c * V.c[0] + pt.m * V.m[0] + pt.p * V.p[0]) / s,
            (pt.c * V.c[1] + pt.m * V.m[1] + pt.p * V.p[1]) / s,
        ];
    };
    function fromXY(x, y) {
        // barycentric coordinates, clamped into the triangle
        const [x1, y1] = V.c, [x2, y2] = V.m, [x3, y3] = V.p;
        const det = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
        let c = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / det;
        let m = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / det;
        c = Math.max(0, c); m = Math.max(0, m);
        let p = Math.max(0, 1 - c - m);
        const s = c + m + p;
        return { c: c / s * 100, m: m / s * 100, p: p / s * 100 };
    }

    const SVGNS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs = {}, parent) => {
        const e = document.createElementNS(SVGNS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    };

    function drawTriangleBase(svg, { grid = true, labels = true, idPrefix = 't' } = {}) {
        svg.innerHTML = '';
        const defs = el('defs', {}, svg);
        const grad = el('linearGradient', { id: `${idPrefix}-fill`, x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
        el('stop', { offset: '0', 'stop-color': 'var(--c)', 'stop-opacity': '0.16' }, grad);
        el('stop', { offset: '1', 'stop-color': 'var(--surface-2)', 'stop-opacity': '0.0' }, grad);
        const gradL = el('linearGradient', { id: `${idPrefix}-fill2`, x1: '0', y1: '0', x2: '1', y2: '0' }, defs);
        el('stop', { offset: '0', 'stop-color': 'var(--m)', 'stop-opacity': '0.16' }, gradL);
        el('stop', { offset: '1', 'stop-color': 'var(--p)', 'stop-opacity': '0.16' }, gradL);

        const pts = [V.c, V.m, V.p].map(v => v.join(',')).join(' ');
        el('polygon', { points: pts, fill: `url(#${idPrefix}-fill2)`, class: 'tri-face' }, svg);
        el('polygon', { points: pts, fill: `url(#${idPrefix}-fill)`, class: 'tri-face' }, svg);

        if (grid) {
            const g = el('g', { class: 'tri-grid' }, svg);
            for (let k = 20; k < 100; k += 20) {
                // lines of constant c, m, p
                const lines = [
                    [{ c: k, m: 100 - k, p: 0 }, { c: k, m: 0, p: 100 - k }],
                    [{ m: k, c: 100 - k, p: 0 }, { m: k, c: 0, p: 100 - k }],
                    [{ p: k, c: 100 - k, m: 0 }, { p: k, c: 0, m: 100 - k }],
                ];
                lines.forEach(([a, b]) => {
                    const [x1, y1] = toXY(a), [x2, y2] = toXY(b);
                    el('line', { x1, y1, x2, y2 }, g);
                });
            }
        }
        el('polygon', { points: pts, class: 'tri-edge' }, svg);

        if (labels) {
            const lab = (txt, x, y, cls, anchor) => {
                const t = el('text', { x, y, class: `tri-label ${cls}`, 'text-anchor': anchor }, svg);
                t.textContent = txt;
            };
            lab('Centralism', V.c[0], V.c[1] - 10, 'lab-c', 'middle');
            lab('Communalism', V.m[0] - 2, V.m[1] + 24, 'lab-m', 'start');
            lab('Privatism', V.p[0] + 2, V.p[1] + 24, 'lab-p', 'end');
        }
        return svg;
    }

    // ------------------------------------------------------------------
    // DOM
    // ------------------------------------------------------------------
    const $ = (id) => document.getElementById(id);
    const screens = { intro: $('screen-intro'), quiz: $('screen-quiz'), results: $('screen-results') };
    const optionsContainer = $('options-container');
    const questionText = $('question-text');
    const questionCard = $('question-card');

    function show(name) {
        for (const k in screens) screens[k].hidden = k !== name;
        document.body.dataset.screen = name;
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    // Moves the background colour blobs towards the current position
    function tintBackground(pos) {
        const r = document.documentElement.style;
        r.setProperty('--wc', (0.25 + pos.c / 100 * 1.1).toFixed(3));
        r.setProperty('--wm', (0.25 + pos.m / 100 * 1.1).toFixed(3));
        r.setProperty('--wp', (0.25 + pos.p / 100 * 1.1).toFixed(3));
    }

    // ------------------------------------------------------------------
    // Theme
    // ------------------------------------------------------------------
    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
    }
    const savedTheme = localStorage.getItem('theme');
    applyTheme(savedTheme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
    $('theme-toggle').addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('theme', next);
    });

    // ------------------------------------------------------------------
    // Intro art: all ideologies twinkling inside the triangle
    // ------------------------------------------------------------------
    function drawIntroArt() {
        const svg = drawTriangleBase($('intro-triangle'), { idPrefix: 'intro' });
        const g = el('g', {}, svg);
        IDEOLOGIES.forEach((i, k) => {
            const [x, y] = toXY(i);
            const dot = el('circle', { cx: x, cy: y, r: 4.5, class: `ideo-dot b${broadIndex(i.broad)} twinkle` }, g);
            dot.style.animationDelay = `${(k * 0.37) % 4}s`;
        });
        const [cx, cy] = toXY(CENTRE);
        el('circle', { cx, cy, r: 18, class: 'you-ring pulse' }, svg);
        el('circle', { cx, cy, r: 8, class: 'you-dot' }, svg);
        const t = el('text', { x: cx, y: cy + 34, class: 'you-label', 'text-anchor': 'middle' }, svg);
        t.textContent = 'you?';
    }

    // ------------------------------------------------------------------
    // Quiz state
    // ------------------------------------------------------------------
    let order = [];        // question indices in the order asked
    let optionOrders = []; // shuffled option order per question, fixed for the run
    let answers = [];      // chosen original option index per position
    let current = 0;
    let advancing = false;
    let miniDot = null;

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function startQuiz() {
        order = [...questions.keys()]; // file order: the Order statements are already spread through it
        optionOrders = order.map(qi => {
            const q = questions[qi];
            const keys = [...q.options.keys()];
            return isScale(q) ? keys : shuffle(keys); // scales stay in order; everything else is shuffled
        });
        answers = new Array(order.length).fill(null);
        current = 0;
        history.replaceState(null, '', location.pathname + location.search);
        show('quiz');
        drawMini();
        renderQuestion('none');
    }

    function drawMini() {
        const svg = drawTriangleBase($('mini-triangle'), { grid: false, labels: false, idPrefix: 'mini' });
        const [x, y] = toXY(CENTRE);
        miniDot = el('circle', { cx: x, cy: y, r: 22, class: 'you-dot mini-dot' }, svg);
    }

    function livePosition() {
        const answered = answers.slice(0, current).some(a => a != null);
        if (!answered) return CENTRE;
        return normalise(computeRaw(order, answers.slice(0, current)));
    }

    function updateLive() {
        const pos = livePosition();
        const [x, y] = toXY(pos);
        if (miniDot) { miniDot.setAttribute('cx', x); miniDot.setAttribute('cy', y); }
        tintBackground(pos);
    }

    // Strip the wrapping quote marks some questions carry, and render *emphasis*.
    function formatText(s) {
        const safe = s.replace(/^"(.*)"$/s, '$1')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return safe.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }

    function renderQuestion(direction) {
        const q = questions[order[current]];
        const total = order.length;
        $('progress-label').textContent = `${current + 1} / ${total}`;
        $('progress').setAttribute('aria-valuenow', current + 1);
        $('progress-fill').style.width = `${(current / total) * 100}%`;
        $('question-kicker').textContent = isScale(q) ? 'Liberty or order?' : `Question ${current + 1}`;
        optionsContainer.classList.toggle('scale', isScale(q));
        $('back-button').disabled = current === 0;

        questionText.innerHTML = formatText(q.text.replace(/^Statement:\s*/, ''));
        optionsContainer.innerHTML = '';
        optionOrders[current].forEach((origIdx, displayIdx) => {
            const o = q.options[origIdx];
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'option';
            b.setAttribute('role', 'radio');
            b.setAttribute('aria-checked', answers[current] === origIdx ? 'true' : 'false');
            if (answers[current] === origIdx) b.classList.add('selected');
            b.dataset.orig = origIdx;
            const quip = o.quip ? `<small class="opt-quip">${formatText(o.quip)}</small>` : '';
            b.innerHTML = `<span class="key">${displayIdx + 1}</span><span class="opt-text">${o.quip ? `<b>${formatText(o.text)}</b>` : formatText(o.text)}${quip}</span>`;
            b.addEventListener('click', () => choose(origIdx, b));
            optionsContainer.appendChild(b);
        });

        if (direction !== 'none' && !reduceMotion) {
            questionCard.classList.remove('enter-fwd', 'enter-back');
            void questionCard.offsetWidth;
            questionCard.classList.add(direction === 'back' ? 'enter-back' : 'enter-fwd');
        }
        updateLive();
    }

    function choose(origIdx, button) {
        if (advancing) return;
        advancing = true;
        answers[current] = origIdx;
        optionsContainer.querySelectorAll('.option').forEach(o => {
            const on = o === button;
            o.classList.toggle('selected', on);
            o.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        setTimeout(() => {
            advancing = false;
            if (current + 1 >= order.length) {
                finishQuiz();
            } else {
                current++;
                renderQuestion('fwd');
            }
        }, reduceMotion ? 80 : 320);
    }

    function goBack() {
        if (advancing || current === 0) return;
        current--;
        renderQuestion('back');
    }

    function finishQuiz() {
        $('progress-fill').style.width = '100%';
        const raw = computeRaw(order, answers);
        const pos = normalise(raw);
        history.replaceState(null, '', `${location.pathname}${location.search}#r=${encodePos(pos)}`);
        try { sessionStorage.setItem('ownResult', encodePos(pos)); } catch (e) { /* private mode */ }
        showResults(pos, { raw, shared: false });
    }

    // ------------------------------------------------------------------
    // Results
    // ------------------------------------------------------------------
    // #r=c,m,p,order  (older 3-number links still work and get Order 50)
    const encodePos = (pos) => [...AXES, 'a'].map(a => pos[a].toFixed(1)).join(',');
    function decodePos(str) {
        const parts = (str || '').split(',').map(Number);
        if ((parts.length !== 3 && parts.length !== 4) || parts.some(n => !isFinite(n) || n < 0)) return null;
        const s = parts[0] + parts[1] + parts[2];
        if (s <= 0) return null;
        const a = parts.length === 4 ? Math.min(100, parts[3]) : 50;
        return { c: parts[0] / s * 100, m: parts[1] / s * 100, p: parts[2] / s * 100, a };
    }

    let resultState = null;

    function orderQuip(a) {
        if (a < 20) return "Don't tread on anyone, ever.";
        if (a < 40) return 'Live and let live, mostly.';
        if (a < 60) return 'Rules are fine. Some rules.';
        if (a < 80) return 'A firm hand, for everyone else.';
        return 'Papers, please.';
    }

    function extremityQuip(x) {
        if (x < 15) return 'Aggressively moderate. You probably own a beige fleece.';
        if (x < 35) return 'Opinions, yes. Pitchforks, not yet.';
        if (x < 60) return 'Strong views, lightly held. Mostly strong.';
        if (x < 80) return 'You have a manifesto. It has footnotes.';
        return 'You are the corner. The corner is you.';
    }

    function showResults(pos, { raw = null, shared = false } = {}) {
        show('results');
        $('shared-note').hidden = !shared;
        $('results-eyebrow').textContent = shared ? 'Their gloriously flawed result' : 'Your gloriously flawed result';
        $('dev-panel').hidden = !isDevMode;
        $('map-hint').textContent = isDevMode ? 'Dev mode: click or drag to move the dot.' : 'Tap any dot to read about that ideology.';

        const svg = drawTriangleBase($('result-triangle'), { idPrefix: 'res' });
        const linkLayer = el('g', { class: 'links' }, svg);
        const dotLayer = el('g', {}, svg);
        const labelLayer = el('g', { class: 'dot-labels' }, svg);
        const youLayer = el('g', { class: 'you' }, svg);

        const dots = new Map();
        IDEOLOGIES.forEach(i => {
            const [x, y] = toXY(i);
            const g = el('g', { class: 'ideo', tabindex: '0', role: 'button', 'aria-label': i.name }, dotLayer);
            el('circle', { cx: x, cy: y, r: 13, class: 'hit' }, g);
            const c = el('circle', { cx: x, cy: y, r: 5, class: `ideo-dot b${broadIndex(i.broad)}` }, g);
            const title = el('title', {}, g); title.textContent = i.name;
            g.addEventListener('click', () => focusIdeology(i.name));
            g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focusIdeology(i.name); } });
            dots.set(i.name, { g, c, x, y });
        });

        const [cx0, cy0] = toXY(CENTRE);
        const ring = el('circle', { cx: cx0, cy: cy0, r: 16, class: 'you-ring pulse' }, youLayer);
        const you = el('circle', { cx: cx0, cy: cy0, r: 8, class: 'you-dot' }, youLayer);

        resultState = { pos, raw, svg, dots, linkLayer, labelLayer, ring, you, focused: null };

        drawLegend();
        updateResultsView(pos, { animate: !reduceMotion && !isDevMode, firstReveal: true });

        if (isDevMode) {
            enableDrag(svg);
            const slider = $('dev-order');
            slider.value = pos.a;
            slider.oninput = () => {
                updateResultsView({ ...resultState.pos, a: Number(slider.value) });
                history.replaceState(null, '', `${location.pathname}${location.search}#r=${encodePos(resultState.pos)}`);
            };
        }
    }

    function updateResultsView(pos, { animate = false, firstReveal = false } = {}) {
        const st = resultState;
        st.pos = pos;
        const ranked = rankIdeologies(pos);
        const top = ranked.slice(0, 3);
        st.top = top;

        // Headline
        $('result-name').textContent = top[0].name;
        $('result-broad').textContent = top[0].broad;
        const ex = extremity(pos);
        $('lean-note').hidden = ex >= WEAK_LEAN;
        $('lean-note').textContent = `Your lean is weak (${ex.toFixed(0)}% from the dead centre), so treat this label as a loose fit: several centrist labels are about equally close.`;
        if (firstReveal && !reduceMotion) {
            $('result-name').classList.remove('reveal'); void $('result-name').offsetWidth; $('result-name').classList.add('reveal');
        }

        // Dot position
        const [x, y] = toXY(pos);
        const move = () => {
            st.you.setAttribute('cx', x); st.you.setAttribute('cy', y);
            st.ring.setAttribute('cx', x); st.ring.setAttribute('cy', y);
        };
        if (animate) {
            st.svg.classList.add('animating');
            requestAnimationFrame(() => requestAnimationFrame(move));
            setTimeout(() => st.svg.classList.remove('animating'), 1400);
        } else move();

        // Highlight top three with links and labels
        st.linkLayer.innerHTML = '';
        st.labelLayer.innerHTML = '';
        st.dots.forEach(d => d.g.classList.remove('top', 'top1'));
        top.forEach((t, k) => {
            const d = st.dots.get(t.name);
            d.g.classList.add('top');
            if (k === 0) d.g.classList.add('top1');
            const line = el('line', { x1: x, y1: y, x2: d.x, y2: d.y, class: `link link${k}` }, st.linkLayer);
            if (animate) line.style.animationDelay = `${1.0 + k * 0.15}s`;
        });
        const d0 = st.dots.get(top[0].name);
        // put the label on the far side of the match dot from "you", so they never overlap
        let ux = d0.x - x, uy = d0.y - y;
        const len = Math.hypot(ux, uy);
        if (len < 1) { ux = 0; uy = -1; } else { ux /= len; uy /= len; }
        let lx = d0.x + ux * 16, ly = d0.y + uy * 16 + (uy > 0.3 ? 10 : uy < -0.3 ? -2 : 4);
        let anchor = Math.abs(ux) < 0.35 ? labelAnchor(d0.x) : (ux > 0 ? 'start' : 'end');
        if (ly > V.m[1] - 8) {
            // would collide with the base edge and corner labels: go sideways instead
            const side = ux >= 0 ? 1 : -1;
            lx = d0.x + side * 14; ly = d0.y - 10; anchor = side > 0 ? 'start' : 'end';
        }
        const lab = el('text', { x: lx, y: ly, class: 'dot-label', 'text-anchor': anchor }, st.labelLayer);
        lab.textContent = shortName(top[0].name);

        // Closest three list
        const list = $('match-list');
        list.innerHTML = '';
        const maxD = Math.max(...top.map(t => t.d), 1);
        top.forEach((t, k) => {
            const li = document.createElement('li');
            const closeness = Math.max(6, 100 - (t.d / Math.max(maxD * 1.6, 25)) * 100);
            li.innerHTML = `<button type="button" class="match"><span class="match-name"><i class="sw b${broadIndex(t.broad)}"></i>${t.name}</span><span class="match-d">${t.d.toFixed(1)} pts away</span><span class="bar"><span style="width:${closeness.toFixed(0)}%"></span></span></button>`;
            li.querySelector('button').addEventListener('click', () => focusIdeology(t.name));
            if (k === 0) li.classList.add('first');
            list.appendChild(li);
        });

        // Mix bars
        const mix = $('mix-bars');
        mix.innerHTML = '';
        AXES.forEach(a => {
            const row = document.createElement('div');
            row.className = `mix-row mix-${a}`;
            row.innerHTML = `<div class="mix-top"><span><b>${AXIS_INFO[a].name}</b> <small>${AXIS_INFO[a].blurb}</small></span><b>${pos[a].toFixed(0)}%</b></div><div class="meter"><div class="meter-fill" style="width:${pos[a].toFixed(1)}%"></div></div>`;
            mix.appendChild(row);
        });

        // Liberty vs Order scale, with your marker and your top match's marker
        $('order-scale').innerHTML = `<div class="mix-top"><span><b>Liberty or order?</b> <small>${orderQuip(pos.a)}</small></span><b>${pos.a.toFixed(0)}</b></div>
            <div class="order-track"><span class="order-mark match-mark" style="left:${top[0].a}%" title="${top[0].name}"></span><span class="order-mark you-mark" style="left:${pos.a.toFixed(1)}%" title="You"></span></div>
            <div class="order-ends"><span>Liberty</span><span class="order-legend"><i class="you-key"></i>You <i class="match-key"></i>${shortName(top[0].name)}</span><span>Order</span></div>`;
        $('extremity-value').textContent = `${ex.toFixed(0)}%`;
        $('extremity-fill').style.width = `${ex.toFixed(1)}%`;
        $('extremity-quip').textContent = extremityQuip(ex);

        tintBackground(pos);
        focusIdeology(null);

        if (isDevMode) {
            const r = st.raw;
            $('dev-readout').textContent =
                `C ${pos.c.toFixed(2)}  M ${pos.m.toFixed(2)}  P ${pos.p.toFixed(2)}  Order ${pos.a.toFixed(1)}\n` +
                (r ? `raw C ${r.total.c.toFixed(2)}  M ${r.total.m.toFixed(2)}  P ${r.total.p.toFixed(2)} over ${r.nTri}; order ${r.total.a} over ${r.nA}\n` : '') +
                ranked.slice(0, 5).map(t => `${t.d.toFixed(2).padStart(6)}  ${t.name}`).join('\n');
        }
    }

    const shortName = (n) => n.split(/ \(| \//)[0];
    const labelAnchor = (x) => (x < 120 ? 'start' : x > 280 ? 'end' : 'middle');

    function focusIdeology(name) {
        const st = resultState;
        const target = name ? IDEOLOGIES.find(i => i.name === name) : st.top[0];
        const isOwn = !name || name === st.top[0].name;
        const d = dist(st.pos, target);
        const rank = rankIdeologies(st.pos).findIndex(i => i.name === target.name) + 1;
        $('focus-label').textContent = isOwn ? 'Your closest match' : `Your #${rank} closest of ${IDEOLOGIES.length}`;
        $('focus-name').textContent = target.name;
        $('focus-meta').innerHTML = `<i class="sw b${broadIndex(target.broad)}"></i>${target.broad} &middot; ${d.toFixed(1)} pts from you &middot; C ${target.c} / M ${target.m} / P ${target.p} &middot; Order ${target.a}`;
        $('focus-summary').innerHTML = formatText(ideologySummaries[target.name] || ideologySummaries[target.broad] || 'No summary written yet.');
        $('focus-reset').hidden = isOwn;
        st.dots.forEach((dd, n) => dd.g.classList.toggle('focused', !isOwn && n === target.name));
        const card = $('focus-card');
        card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
        if (name && matchMedia('(max-width: 860px)').matches) card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    }

    function drawLegend() {
        const lg = $('legend');
        lg.innerHTML = '';
        BROAD_ORDER.forEach((b, k) => {
            const s = document.createElement('span');
            s.innerHTML = `<i class="sw b${k}"></i>${b}`;
            lg.appendChild(s);
        });
    }

    function enableDrag(svg) {
        let dragging = false;
        const at = (e) => {
            const pt = svg.createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const p = pt.matrixTransform(svg.getScreenCTM().inverse());
            resultState.raw = null;
            updateResultsView({ ...fromXY(p.x, p.y), a: resultState.pos.a });
            history.replaceState(null, '', `${location.pathname}${location.search}#r=${encodePos(resultState.pos)}`);
        };
        svg.addEventListener('pointerdown', (e) => { dragging = true; svg.setPointerCapture(e.pointerId); at(e); });
        svg.addEventListener('pointermove', (e) => { if (dragging) at(e); });
        svg.addEventListener('pointerup', () => { dragging = false; });
        svg.style.touchAction = 'none';
        svg.style.cursor = 'crosshair';
    }

    // ------------------------------------------------------------------
    // Sharing
    // ------------------------------------------------------------------
    const baseUrl = () => location.href.split(/[?#]/)[0];

    async function copy(text, okMsg) {
        try {
            await navigator.clipboard.writeText(text);
            toast(okMsg);
        } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            const ok = document.execCommand && document.execCommand('copy');
            ta.remove();
            toast(ok ? okMsg : 'Copy failed. Your browser said no.');
        }
    }

    let toastTimer;
    function toast(msg) {
        const t = $('toast');
        t.textContent = msg;
        t.hidden = false;
        t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
    }

    $('copy-link-button').addEventListener('click', () => {
        copy(`${baseUrl()}#r=${encodePos(resultState.pos)}`, 'Share link copied. Spread the despair.');
    });
    $('copy-text-button').addEventListener('click', () => {
        const { pos, top } = resultState;
        const lines = [
            'My Sarcastic Political Test result:',
            `${top[0].name} (${top[0].broad})`,
            `Centralism ${pos.c.toFixed(0)}% / Communalism ${pos.m.toFixed(0)}% / Privatism ${pos.p.toFixed(0)}%`,
            `Liberty or order: ${pos.a.toFixed(0)} (0 = all liberty, 100 = all order)`,
            `Also close to: ${top[1].name}, ${top[2].name}`,
            '',
            `See it: ${baseUrl()}#r=${encodePos(pos)}`,
        ];
        copy(lines.join('\n'), 'Result copied as text.');
    });

    // ------------------------------------------------------------------
    // Wiring
    // ------------------------------------------------------------------
    $('start-button').addEventListener('click', startQuiz);
    $('restart-button').addEventListener('click', startQuiz);
    $('back-button').addEventListener('click', goBack);
    $('focus-reset').addEventListener('click', () => focusIdeology(null));
    $('home-button').addEventListener('click', () => {
        if (!screens.quiz.hidden && answers.some(a => a != null) && !confirm('Abandon this test and go back to the start?')) return;
        history.replaceState(null, '', location.pathname + location.search);
        tintBackground(CENTRE);
        show('intro');
    });

    document.addEventListener('keydown', (e) => {
        if (screens.quiz.hidden || e.altKey || e.ctrlKey || e.metaKey) return;
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 5) {
            const btn = optionsContainer.querySelectorAll('.option')[n - 1];
            if (btn) { e.preventDefault(); btn.click(); btn.focus(); }
        } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
            e.preventDefault(); goBack();
        }
    });

    window.addEventListener('beforeunload', (e) => {
        if (!screens.quiz.hidden && answers.some(a => a != null)) { e.preventDefault(); e.returnValue = ''; }
    });

    // ------------------------------------------------------------------
    // Boot
    // ------------------------------------------------------------------
    drawIntroArt();
    const hashStr = (location.hash.match(/r=([^&]+)/) || [])[1];
    const hashPos = decodePos(hashStr);
    let ownResult = null;
    try { ownResult = sessionStorage.getItem('ownResult'); } catch (e) { /* private mode */ }
    if (hashPos) {
        showResults(hashPos, { shared: !isDevMode && hashStr !== ownResult });
    } else if (isDevMode) {
        showResults({ ...CENTRE });
    } else {
        tintBackground(CENTRE);
        show('intro');
    }
})();
