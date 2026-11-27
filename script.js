// script.js — The Sarcastic Political Test
// Data lives in questions.js, ideology_summaries.js, ideology_summaries_classroom.js and ideology_ideal_points.js.
// Two tones: 'sarcastic' (the default) and 'classroom' (plain, neutral wording). Scoring is identical in both.

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
    const classroomSummaries = typeof ideologySummariesClassroom !== 'undefined' ? ideologySummariesClassroom : {};

    // ------------------------------------------------------------------
    // Tone: every piece of interface text, in both versions
    // ------------------------------------------------------------------
    const COPY = {
        sarcastic: {
            title: 'The Sarcastic Political Test',
            brand: 'Sarcastic Political Test',
            introEyebrow: 'Very accurate. Not remotely scientific.',
            introTitle: 'Which <em>least-worst</em> caricature are you?',
            introLede: 'Forget left and right. This test drops you somewhere inside a triangle with three corners:',
            lede2: 'Plus a few blunt statements on a separate question: how much <b>liberty</b> would you trade for <b>order</b>?',
            youLabel: 'you?',
            eyebrowOwn: 'Your gloriously flawed result',
            eyebrowShared: 'Their gloriously flawed result',
            sharedNote: 'Someone shared their result with you. <a href="./">Take the test yourself &rarr;</a>',
            outro: "Consider your life choices. Or don't. We're not your dad.",
            toastLink: 'Share link copied. Spread the despair.',
            toastText: 'Result copied as text.',
            toastFail: 'Copy failed. Your browser said no.',
            shareHeader: 'My Sarcastic Political Test result:',
            leanNote: (ex) => `Your lean is weak (${ex}% from the dead centre), so treat this label as a loose fit: several centrist labels are about equally close.`,
            order: (a) => a < 20 ? "Don't tread on anyone, ever." : a < 40 ? 'Live and let live, mostly.' : a < 60 ? 'Rules are fine. Some rules.' : a < 80 ? 'A firm hand, for everyone else.' : 'Papers, please.',
            extremity: (x) => x < 15 ? 'Aggressively moderate. You probably own a beige fleece.' : x < 35 ? 'Opinions, yes. Pitchforks, not yet.' : x < 60 ? 'Strong views, lightly held. Mostly strong.' : x < 80 ? 'You have a manifesto. It has footnotes.' : 'You are the corner. The corner is you.',
            tbScales: {
                change: ['Reform or revolution?', 'Gentle tweaks', 'Bring a hammer'],
                scale: ['How big should decisions be?', 'Over the fence', 'The whole planet'],
                trad: ['Tradition?', 'Keep the hymns out', 'Sunday roast, non-negotiable'],
                nation: ['Nation or world?', 'Humanity', 'Anthem goosebumps'],
            },
            axes: {
                c: 'Someone official will sort it out. Please fill in this form.',
                m: "We'll all decide together. The meeting starts at 7, and 9, and 11.",
                p: 'The market will sort it out. Terms and conditions apply.',
            },
        },
        classroom: {
            title: 'The Political Triangle: classroom edition',
            brand: 'Political Triangle · Classroom',
            introEyebrow: 'Classroom edition',
            introTitle: 'Where do you sit in the <em>political triangle</em>?',
            introLede: 'Instead of a single left-right line, this test places you inside a triangle. Each corner is a different answer to the question: who should organise society?',
            lede2: 'A separate set of statements measures a second question: how much <b>personal liberty</b> would you trade for <b>order and security</b>?',
            youLabel: 'you',
            eyebrowOwn: 'Your result',
            eyebrowShared: 'A shared result',
            sharedNote: 'Someone shared their result with you. <a href="./?tone=classroom">Take the test yourself &rarr;</a>',
            outro: 'No test can capture a person\'s politics completely. Use this result as a starting point for discussion, not a label.',
            toastLink: 'Share link copied.',
            toastText: 'Result copied as text.',
            toastFail: 'Copying failed. Your browser blocked it.',
            shareHeader: 'My Political Triangle result:',
            leanNote: (ex) => `Your answers do not lean strongly in any direction (${ex}% from the centre), so several centrist positions fit about equally well.`,
            order: (a) => a < 20 ? 'Strongly favours personal liberty.' : a < 40 ? 'Leans towards personal liberty.' : a < 60 ? 'Balances liberty and order.' : a < 80 ? 'Leans towards order and authority.' : 'Strongly favours order and authority.',
            extremity: (x) => x < 15 ? 'Your answers are close to the centre: you mixed approaches or chose the middle option often.' : x < 35 ? 'A moderate lean in one direction.' : x < 60 ? 'A clear lean in one direction.' : x < 80 ? 'A strong lean in one direction.' : 'A very strong, consistent lean towards one corner.',
            tbScales: {
                change: ['How change should happen', 'Gradual reform', 'Revolution'],
                scale: ['Level of decision-making', 'Local', 'National or global'],
                trad: ['Religion and tradition', 'Secular', 'Traditional'],
                nation: ['National loyalty', 'Humanity', 'Nation first'],
            },
            axes: {
                c: 'The state organises society, through law, planning and public services.',
                m: 'Communities organise society, through shared ownership and collective decisions.',
                p: 'Private owners organise society, through property and markets.',
            },
        },
    };
    const TONES = Object.keys(COPY);
    const params0 = new URLSearchParams(location.search);
    let tone = TONES.includes(params0.get('tone')) ? params0.get('tone')
        : (TONES.includes(localStorage.getItem('tone-mode')) ? localStorage.getItem('tone-mode') : 'sarcastic');
    const T = (key) => COPY[tone][key];
    const say = (item) => (tone === 'classroom' && item.classroom) || item.text;   // question or option text
    const summaryFor = (i) => tone === 'classroom'
        ? (classroomSummaries[i.name] || ideologySummaries[i.name] || '')
        : (ideologySummaries[i.name] || ideologySummaries[i.broad] || 'No summary written yet.');

    const AXES = ['c', 'm', 'p'];
    const AXIS_NAMES = { c: 'Centralism', m: 'Communalism', p: 'Privatism' };
    const IDEOLOGIES = Object.entries(ideologyIdealPoints).map(([name, pt]) => ({ name, ...pt }));
    // Each family keeps a fixed colour (b0..b9 in style.css), whatever order the file lists them in.
    const BROAD_COLOUR = {
        'Libertarian Socialism / Social Anarchism': 0, 'Propertarianism / Individualist Libertarianism': 1,
        'Individualist Anarchism': 2, 'Statism': 3, 'Authoritarian Socialism / State Collectivism': 4,
        'Classical Liberalism / Constitutionalism': 5, 'Democratic Socialism': 6, 'Centrism / Mixed Economy Ideologies': 7,
        'Christian Democracy / Communitarianism': 8, 'Green Politics': 9,
    };
    const BROAD_ORDER = [...new Set(IDEOLOGIES.map(i => i.broad))];
    const broadIndex = (b) => (b in BROAD_COLOUR ? BROAD_COLOUR[b] : BROAD_ORDER.indexOf(b) % 10);

    const params = new URLSearchParams(location.search);
    const isDevMode = params.get('dev') === 'true';
    const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isDevMode) {
        const missing = IDEOLOGIES.filter(i => !ideologySummaries[i.name]).map(i => i.name);
        if (missing.length) console.warn('Ideologies with no summary:', missing);
        IDEOLOGIES.forEach(i => { if (Math.abs(i.c + i.m + i.p - 100) > 0.01) console.warn('Ideal point does not sum to 100:', i.name); });
    }

    // ------------------------------------------------------------------
    // Scoring: all the maths lives in scoring.js, shared with tools/calibrate.js
    // ------------------------------------------------------------------
    if (typeof Scoring === 'undefined') return fail('scoring.js not loaded.');
    const TIEBREAKERS = typeof tiebreakers !== 'undefined' ? tiebreakers : [];
    const isScale = Scoring.isScale;
    const triDist = Scoring.triDist;
    const dist = Scoring.distance;
    const rankIdeologies = (pos) => Scoring.rank(pos, IDEOLOGIES);
    const CENTRE = Scoring.CENTRE;
    const extremity = Scoring.lean;
    const WEAK_LEAN = 12; // below this, the result says the match is loose

    // Main-test position from the answers given so far. `order[i]` is a question index, `ans[i]` its answer.
    function computeRaw(ord, ans) {
        return { qs: ord.map(i => questions[i]), ans: ans.slice(0, ord.length) };
    }
    function normalise(raw) { return Scoring.position(raw.qs, raw.ans); }

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
        t.textContent = T('youLabel');
        t.id = 'intro-you-label';
    }

    // ------------------------------------------------------------------
    // Quiz state
    // ------------------------------------------------------------------
    let order = [];        // question indices in the order asked
    let optionOrders = []; // shuffled option order per question, fixed for the run
    let answers = [];      // chosen original option index per position (main test)
    let tbList = [];       // tie-breaker questions chosen for this person (asked after the main test)
    let tbAnswers = {};    // tie-breaker answers by question id; kept if you go back and come forward again
    let current = 0;       // 0..order.length-1 = main test, then order.length.. = tie-breakers
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
        tbList = [];
        tbAnswers = {};
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
        const upTo = Math.min(current, order.length);
        const answered = answers.slice(0, upTo).some(a => a != null);
        if (!answered) return CENTRE;
        return normalise(computeRaw(order, answers.slice(0, upTo)));
    }

    // The question at a step, whether main test or tie-breaker
    const inTiebreak = (step) => step >= order.length;
    const stepQuestion = (step) => inTiebreak(step) ? tbList[step - order.length] : questions[order[step]];
    const stepAnswer = (step) => inTiebreak(step) ? tbAnswers[stepQuestion(step).id] : answers[step];
    const stepOptionOrder = (step) => inTiebreak(step) ? [...stepQuestion(step).options.keys()] : optionOrders[step];
    const TB_KICKER = {
        sarcastic: { change: 'Tie-breaker: reform or revolution?', scale: 'Tie-breaker: how big?', trad: 'Tie-breaker: tradition', nation: 'Tie-breaker: nation or world?' },
        classroom: { change: 'Tie-breaker: how change happens', scale: 'Tie-breaker: level of decision-making', trad: 'Tie-breaker: religion and tradition', nation: 'Tie-breaker: national loyalty' },
    };

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
        const q = stepQuestion(current);
        const total = order.length;
        const tb = inTiebreak(current);
        const tbNum = current - order.length + 1;
        $('progress-label').textContent = tb ? `+${tbNum} / ${tbList.length}` : `${current + 1} / ${total}`;
        $('progress').setAttribute('aria-valuenow', Math.min(current + 1, total));
        $('progress-fill').style.width = `${tb ? 100 : (current / total) * 100}%`;
        $('question-kicker').textContent = tb ? TB_KICKER[tone][q.dim] : isScale(q) ? 'Liberty or order?' : `Question ${current + 1}`;
        optionsContainer.classList.toggle('scale', isScale(q));
        optionsContainer.classList.toggle('tiebreak', tb);
        $('back-button').disabled = current === 0;

        questionText.innerHTML = formatText(say(q).replace(/^Statement:\s*/, ''));
        optionsContainer.innerHTML = '';
        const chosen = stepAnswer(current);
        stepOptionOrder(current).forEach((origIdx, displayIdx) => {
            const o = q.options[origIdx];
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'option';
            b.setAttribute('role', 'radio');
            b.setAttribute('aria-checked', chosen === origIdx ? 'true' : 'false');
            if (chosen === origIdx) b.classList.add('selected');
            b.dataset.orig = origIdx;
            b.innerHTML = `<span class="key">${displayIdx + 1}</span><span class="opt-text">${formatText(say(o))}</span>`;
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
        if (inTiebreak(current)) tbAnswers[stepQuestion(current).id] = origIdx;
        else answers[current] = origIdx;
        optionsContainer.querySelectorAll('.option').forEach(o => {
            const on = o === button;
            o.classList.toggle('selected', on);
            o.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        setTimeout(() => {
            advancing = false;
            if (current === order.length - 1) {
                // end of the main test: pick tie-breakers for whoever this person is closest to
                const pos = normalise(computeRaw(order, answers));
                const ids = Scoring.chooseTiebreakers(pos, IDEOLOGIES, TIEBREAKERS);
                tbList = ids.map(id => TIEBREAKERS.find(t => t.id === id));
            }
            if (current + 1 >= order.length + tbList.length) {
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
        const asked = {};
        tbList.forEach(q => { if (tbAnswers[q.id] != null) asked[q.id] = tbAnswers[q.id]; });
        const pos = Scoring.withTiebreaks(normalise(raw), TIEBREAKERS, asked);
        history.replaceState(null, '', `${location.pathname}${location.search}#r=${encodePos(pos)}`);
        try { sessionStorage.setItem('ownResult', encodePos(pos)); } catch (e) { /* private mode */ }
        showResults(pos, { raw, shared: false });
    }

    // ------------------------------------------------------------------
    // Results
    // ------------------------------------------------------------------
    // #r=c,m,p,order[,change,scale,trad,nation]  ('-' = not asked). Older 3- and 4-number links still work.
    const encodePos = (pos) => {
        const base = [...AXES, 'a'].map(a => pos[a].toFixed(1));
        const tb = Scoring.TB_DIMS.map(d => pos[d] == null ? '-' : Math.round(pos[d]));
        return (tb.some(v => v !== '-') ? base.concat(tb) : base).join(',');
    };
    function decodePos(str) {
        const raw = (str || '').split(',');
        const parts = raw.slice(0, 4).map(Number);
        if ((raw.length !== 3 && raw.length !== 4 && raw.length !== 8) || parts.some(n => !isFinite(n) || n < 0)) return null;
        const s = parts[0] + parts[1] + parts[2];
        if (s <= 0) return null;
        const a = parts.length === 4 ? Math.min(100, parts[3]) : 50;
        const pos = { c: parts[0] / s * 100, m: parts[1] / s * 100, p: parts[2] / s * 100, a };
        if (raw.length === 8) Scoring.TB_DIMS.forEach((d, i) => {
            const v = Number(raw[4 + i]);
            if (raw[4 + i] !== '-' && isFinite(v)) pos[d] = Math.max(0, Math.min(100, v));
        });
        return pos;
    }

    let resultState = null;

    const orderQuip = (a) => T('order')(a);
    const extremityQuip = (x) => T('extremity')(x);

    function showResults(pos, { raw = null, shared = false } = {}) {
        show('results');
        $('shared-note').hidden = !shared;
        $('results-eyebrow').textContent = shared ? T('eyebrowShared') : T('eyebrowOwn');
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

        resultState = { pos, raw, shared, svg, dots, linkLayer, labelLayer, ring, you, focused: null };

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
        $('lean-note').textContent = T('leanNote')(ex.toFixed(0));
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
            row.innerHTML = `<div class="mix-top"><span><b>${AXIS_NAMES[a]}</b> <small>${T('axes')[a]}</small></span><b>${pos[a].toFixed(0)}%</b></div><div class="meter"><div class="meter-fill" style="width:${pos[a].toFixed(1)}%"></div></div>`;
            mix.appendChild(row);
        });

        // Liberty vs Order scale, with your marker and your top match's marker
        $('order-scale').innerHTML = `<div class="mix-top"><span><b>Liberty or order?</b> <small>${orderQuip(pos.a)}</small></span><b>${pos.a.toFixed(0)}</b></div>
            <div class="order-track"><span class="order-mark match-mark" style="left:${top[0].a}%" title="${top[0].name}"></span><span class="order-mark you-mark" style="left:${pos.a.toFixed(1)}%" title="You"></span></div>
            <div class="order-ends"><span>Liberty</span><span class="order-legend"><i class="you-key"></i>You <i class="match-key"></i>${shortName(top[0].name)}</span><span>Order</span></div>`;
        // Tie-break measures, if any were asked
        const TBL = T('tbScales');
        $('tb-scales').innerHTML = Scoring.TB_DIMS.filter(d => pos[d] != null).map(d => {
            const m = top[0][d] == null ? 50 : top[0][d];
            return `<div class="tb-row"><div class="mix-top"><span><b>${TBL[d][0]}</b></span></div>
                <div class="order-track tb-track"><span class="order-mark match-mark" style="left:${m}%" title="${top[0].name}"></span><span class="order-mark you-mark" style="left:${pos[d].toFixed(1)}%" title="You"></span></div>
                <div class="order-ends"><span>${TBL[d][1]}</span><span>${TBL[d][2]}</span></div></div>`;
        }).join('');
        $('tb-scales').hidden = !Scoring.TB_DIMS.some(d => pos[d] != null);
        $('extremity-value').textContent = `${ex.toFixed(0)}%`;
        $('extremity-fill').style.width = `${ex.toFixed(1)}%`;
        $('extremity-quip').textContent = extremityQuip(ex);

        tintBackground(pos);
        focusIdeology(null);

        if (isDevMode) {
            const r = st.raw;
            $('dev-readout').textContent =
                `C ${pos.c.toFixed(2)}  M ${pos.m.toFixed(2)}  P ${pos.p.toFixed(2)}  Order ${pos.a.toFixed(1)}` +
                Scoring.TB_DIMS.filter(d => pos[d] != null).map(d => `  ${d} ${pos[d].toFixed(0)}`).join('') + '\n' +
                (r ? `answered ${r.ans.filter(x => x != null).length} main questions; tie-breakers asked: ${tbList.map(q => q.id).join(', ') || 'none'}\n` : '') +
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
        $('focus-summary').innerHTML = formatText(summaryFor(target));
        $('focus-reset').hidden = isOwn;
        st.dots.forEach((dd, n) => dd.g.classList.toggle('focused', !isOwn && n === target.name));
        const card = $('focus-card');
        card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
        if (name && matchMedia('(max-width: 860px)').matches) card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    }

    function drawLegend() {
        const lg = $('legend');
        lg.innerHTML = '';
        BROAD_ORDER.forEach((b) => {
            const s = document.createElement('span');
            s.innerHTML = `<i class="sw b${broadIndex(b)}"></i>${b}`;
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
            const keep = {}; ['a', ...Scoring.TB_DIMS].forEach(k => { if (resultState.pos[k] != null) keep[k] = resultState.pos[k]; });
            updateResultsView({ ...fromXY(p.x, p.y), ...keep });
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
    // Share links keep the classroom tone, so a class all sees the same version.
    const baseUrl = () => location.href.split(/[?#]/)[0] + (tone === 'classroom' ? '?tone=classroom' : '');

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
            toast(ok ? okMsg : T('toastFail'));
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
        copy(`${baseUrl()}#r=${encodePos(resultState.pos)}`, T('toastLink'));
    });
    $('copy-text-button').addEventListener('click', () => {
        const { pos, top } = resultState;
        const lines = [
            T('shareHeader'),
            `${top[0].name} (${top[0].broad})`,
            `Centralism ${pos.c.toFixed(0)}% / Communalism ${pos.m.toFixed(0)}% / Privatism ${pos.p.toFixed(0)}%`,
            `Liberty or order: ${pos.a.toFixed(0)} (0 = all liberty, 100 = all order)`,
            ...Scoring.TB_DIMS.filter(d => pos[d] != null).map(d => `${T('tbScales')[d][0]}: ${Math.round(pos[d])} (0 = ${T('tbScales')[d][1].toLowerCase()}, 100 = ${T('tbScales')[d][2].toLowerCase()})`),
            `Also close to: ${top[1].name}, ${top[2].name}`,
            '',
            `See it: ${baseUrl()}#r=${encodePos(pos)}`,
        ];
        copy(lines.join('\n'), T('toastText'));
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
    // Tone switching
    // ------------------------------------------------------------------
    function applyTone(next, { remember = true } = {}) {
        tone = next;
        document.documentElement.dataset.tone = tone;
        document.title = T('title');
        document.querySelectorAll('[data-copy]').forEach(node => {
            const v = T(node.dataset.copy);
            if (typeof v === 'string') node.innerHTML = v;
        });
        document.querySelectorAll('[data-copy-axis]').forEach(node => { node.textContent = T('axes')[node.dataset.copyAxis]; });
        const you = document.getElementById('intro-you-label');
        if (you) you.textContent = T('youLabel');
        document.querySelectorAll('.tone-switch button').forEach(b => b.setAttribute('aria-pressed', b.dataset.tone === tone ? 'true' : 'false'));
        if (remember) {
            localStorage.setItem('tone-mode', tone);
            // keep the address in step, so a teacher can copy it straight from the address bar
            const u = new URL(location.href);
            if (tone === 'classroom') u.searchParams.set('tone', 'classroom'); else u.searchParams.delete('tone');
            history.replaceState(null, '', u.pathname + u.search + u.hash);
        }
        // re-render whatever is on screen
        if (!screens.quiz.hidden && order.length) renderQuestion('none');
        if (!screens.results.hidden && resultState) {
            $('results-eyebrow').textContent = resultState.shared ? T('eyebrowShared') : T('eyebrowOwn');
            updateResultsView(resultState.pos);
        }
    }
    document.querySelectorAll('.tone-switch button').forEach(b => b.addEventListener('click', () => applyTone(b.dataset.tone)));

    // ------------------------------------------------------------------
    // Boot
    // ------------------------------------------------------------------
    applyTone(tone, { remember: params0.has('tone') });
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
