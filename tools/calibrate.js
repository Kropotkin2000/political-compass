// tools/calibrate.js
//
// Calibration and health checks for the test. Run with:
//     node tools/calibrate.js            checks everything, exits 1 on problems
//     node tools/calibrate.js --suggest  prints where each ideology's typical answers land, in
//                                        ideology_ideal_points.js format, for pasting in
//
// HOW CALIBRATION WORKS
// Each ideology has a "persona" below: a written-out guess at how a typical holder of that view
// would answer every question. An ideology's position should be where its persona lands. If you
// think an ideology is in the wrong place, argue with its persona's answers, fix them, then run
// --suggest and copy the new numbers across.
//
// The checks:
//   1. every persona lands on its own ideology (with the tie-break round the real test would ask);
//   2. how often it still does when 20% of its answers are changed at random ("retake stability");
//   3. which ideologies sit closest together;
//   4. how much of the space each ideology covers, and whether there are big empty regions;
//   5. every ideology has a summary in both tones, and every question has classroom wording.

const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(['scoring.js', 'questions.js', 'ideology_summaries.js', 'ideology_summaries_classroom.js', 'ideology_ideal_points.js']
    .map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n;\n') +
    '\n;this.S=Scoring;this.Q=questions;this.TB=tiebreakers;this.SUM=ideologySummaries;this.SC=ideologySummariesClassroom;this.IP=ideologyIdealPoints;', ctx);
const { S: Scoring, Q, TB, SUM, SC, IP } = ctx;
const IDEOS = Object.entries(IP).map(([name, p]) => Object.assign({ name }, p));

// ---------------------------------------------------------------------------------------------
// Personas
// picks (16 "pick a corner / pick a blend" questions, in this order):
//   q1 own  q2 health  q3 housing  q6 business  q7 schools  q10 carbon  q11 tech  q14 welfare
//   q15 banks  q18 arts  q19 town  q22 breakthroughs  q23 transport  q26 old age  q28 news  q30 organised
//   corner questions take C / M / P / X; blend questions (q2 q3 q6 q15) take CM / CP / MP / X; X = muddle
// villains (8 "pick a villain" questions): q5 worries q9 inequality q13 project q17 power q21 freedom
//   q25 common good q27 crisis q29 monopoly; take rC / rM / rP (the corner being criticised) or X
// order (6 statements): q4 stop-search q8 offensive speech q12 national identity q16 private life
//   q20 emergency powers q24 disruptive protest; -2..+2 where + ALWAYS means more order
// tie-breaks: [change, scale, trad, nation], each 0..3 = which of the four ordered options they'd pick
// ---------------------------------------------------------------------------------------------
const PICK_IDS = ['q1', 'q2', 'q3', 'q6', 'q7', 'q10', 'q11', 'q14', 'q15', 'q18', 'q19', 'q22', 'q23', 'q26', 'q28', 'q30'];
const VILLAIN_IDS = ['q5', 'q9', 'q13', 'q17', 'q21', 'q25', 'q27', 'q29'];
const ORDER_IDS = ['q4', 'q8', 'q12', 'q16', 'q20', 'q24'];
const persona = (picks, villains, order, tb) => ({ picks: picks.trim().split(/\s+/), villains: villains.trim().split(/\s+/), order, tb });
const all = (x, n) => Array(n).fill(x).join(' ');

const personas = {
    //                                                       own he  ho  bu  sc ca te we ba  ar to br tr ol ne or
    'Anarcho-Communism':                  persona('M CM CM CM M M M M X  M M M M M M M', 'rC rP rP rC rC rC rP rC', [-2, -1, -2, -2, -2, -2], [3, 0, 0, 0]),
    'Left Communism (General)':           persona('C CM CM CM M C M C CM M M M C C M M', 'rP rP rP rP rP rC rP rP', [-2, 0, -2, -1, 0, -2], [3, 3, 0, 0]),
    'Anarcho-Syndicalism / Collectivist Anarchism':
                                          persona('M CM CM CM M M M M CM M M M M M M M', 'rP rP rP rP rP rC rP rC', [-2, -1, -2, -2, -2, -2], [3, 1, 0, 0]),
    'Democratic Confederalism / Libertarian Municipalism':
                                          persona('M CM CM CM M M M M CM M M M M M M M', 'rC rP rC rC rC rC rP rC', [-1, -1, -2, -2, -1, -2], [2, 0, 0, 0]),
    'Guild Socialism':                    persona('M CM CM CM M C M C CM M M C M C M M', all('rP', 8), [0, -1, 0, -1, 0, -1], [1, 2, 1, 1]),
    'De Leonism':                         persona('M CM CM CM C M M C CM C M C M C M M', all('rP', 8), [-1, 0, -1, -1, 0, -1], [2, 2, 0, 0]),
    'Mutualism':                          persona('M MP MP MP M P M M MP M M M M M M P', all('rC', 8), [-2, -2, -2, -2, -2, -1], [2, 1, 0, 0]),
    'Communal Individualism / Egoism':    persona('P MP MP MP P X P M MP M P M M P P P', 'rC rC rC rM rM rC rC rM', [-2, -2, -2, -2, -2, -2], [2, 0, 0, 0]),
    'Free Market Anti-Capitalism':        persona('M MP MP MP P P M M MP P P M P M P P', all('rC', 8), [-2, -2, -2, -2, -2, -1], [2, 1, 0, 0]),
    'Voluntaryism':                       persona('P MP MP MP P P P P MP P P P P P P P', all('rC', 8), [-2, -2, -2, -2, -2, 0], [1, 1, 1, 0]),
    'Anarcho-Capitalism':                 persona('P MP MP MP P P P P MP P P P P P P P', all('rC', 8), [-1, -2, -1, -2, -2, 1], [2, 1, 1, 0]),
    'Agorism / Counter-Economics':        persona('P MP MP MP P P M M MP P P M P P M P', all('rC', 8), [-2, -2, -2, -2, -2, -2], [3, 1, 0, 0]),
    'Radical Propertarianism / Hoppeanism':
                                          persona('P MP MP CP P P P P MP P P P P P P P', all('rC', 8), [1, 1, 2, 1, -1, 2], [2, 0, 3, 2]),
    'Geolibertarianism':                  persona('X CP CP CP P P P X CP P X X P P P P', 'rC rP rC rC rC rC rC rP', [-1, -2, -1, -2, -1, 0], [1, 2, 1, 0]),
    'Minarchism / Night-Watchman State':  persona('X MP CP CP P P P P CP P P P P X P P', 'rC rC rC rC rC rC rC X', [0, -2, 0, -2, -1, 1], [1, 2, 1, 1]),
    'Conservative Libertarianism':        persona('P MP CP CP P P P M CP P P P P M P P', 'rC rC rC rC rC rM rC rC', [1, 0, 1, 0, 0, 2], [1, 2, 2, 2]),
    'Classical Liberalism (Lockean/Smithian)':
                                          persona('X CP CP CP C P P P CP P P C P P P P', 'rC rC rC rC X rC X rP', [-1, -2, 0, -2, 0, 1], [0, 2, 1, 1]),
    'Constitutional Republicanism / Conservative Liberalism':
                                          persona('X CP CP CP C P C X CP X C C X X C C', 'rM rC rC rM X rM X rP', [1, 0, 1, 0, 1, 1], [0, 2, 2, 2]),
    'Market-Oriented Liberalism / Third Way':
                                          persona('X CP CP CP P P C C CP X C X X X C X', 'X X rC X X X X X', [0, -1, 0, -1, 1, 1], [0, 2, 1, 1]),
    'Technocratic / Managerial Liberalism':
                                          persona('X CP CP CP C P C C CP X C C C X C C', 'rM rM rM rM X rM rM rP', [1, 0, 0, -1, 1, 1], [0, 3, 0, 1]),
    'Social Liberalism / Progressive Liberalism':
                                          persona('X CP CM CP C P C C CP C X C C C C X', 'rP rP X rP X rP X rP', [-2, -2, -1, -2, 0, -1], [1, 2, 0, 1]),
    'Radical Centrism / Syncretic Politics':
                                          persona(all('X', 16), all('X', 8), [0, 0, 0, 0, 0, 0], [1, 2, 1, 1]),
    'Social Democracy':                   persona('C CM CM CP C P C C CP C C C C C C X', 'rP rP rP rP rP rP X rP', [-1, 0, 0, -1, 1, 0], [0, 2, 1, 1]),
    'Democratic Socialism':               persona('C CM CM CM M C C C CM C M C C C M M', all('rP', 8), [-2, -1, -2, -2, 0, -2], [1, 2, 0, 0]),
    'Market Socialism':                   persona('M MP MP MP C P M C MP C M C C C M P', 'rP rP rP rP rP rP X rP', [-1, -1, -1, -2, 0, -1], [1, 1, 0, 1]),
    'Green Politics':                     persona('M CM CM MP M C C C MP C M M M C M M', 'rP rP rP rP rP rP X rP', [-1, -1, -2, -2, 0, -2], [2, 1, 0, 0]),
    'State Socialism (Centralised Planning Focus)':
                                          persona('C CM CM CM C C C C CM C C C C C C C', all('rP', 8), [1, 1, 1, 0, 1, 1], [2, 2, 0, 1]),
    'State Collectivism':                 persona('C CM CM CM C C C M CM M M C C M C M', all('rP', 8), [1, 1, 2, 1, 1, 1], [2, 2, 1, 2]),
    'National Syndicalism (Non-Fascist)': persona('M CM CM CM C C C M CM C M C C M C M', all('rP', 8), [1, 1, 2, 0, 1, 1], [2, 2, 2, 3]),
    'Christian Democracy':                persona('X CP CM CP M X C M CP M M X X M C X', 'rP X rC rP rP X X rP', [0, 0, 1, 1, 0, 1], [0, 1, 2, 1]),
    'Communitarianism':                   persona('M CM CM MP M M X M MP M M X M M M M', 'rP rP X rP X rP X rP', [1, 1, 1, 1, 1, 1], [1, 1, 2, 2]),
    'Distributism':                       persona('M MP MP MP M M M M MP M M P X M M P', 'rC rP rC rP rP rP X rP', [1, 0, 1, 1, 0, 1], [1, 0, 3, 1]),
    'Social Market Economy':              persona('X CP CP CP C P X C CP X C X X C C X', 'X rP rC X X rP X rP', [0, -1, 0, -1, 1, 1], [0, 2, 1, 1]),
    'Paternalistic Conservatism':         persona('X CM CP CP C X C C CP C C C X C C C', 'rM X X rM rM rM X rP', [1, 0, 2, 1, 1, 1], [0, 2, 2, 2]),
    'Traditionalist Conservatism':        persona('X MP MP CP M X X M MP M M X X M C X', 'rC rC rC rC X rM X rC', [2, 1, 2, 2, 1, 2], [0, 1, 3, 2]),
    'National Conservatism':              persona('X CP CP CP C X C M CP C C C X M C C', 'rM rC rC rC rC rM rC rP', [2, 0, 2, 1, 1, 2], [1, 2, 2, 3]),
    'Authoritarian Conservatism':         persona('C CM CP CP C C C C CP C C C C M C C', 'rM rM rM rM rM rM rP rM', [2, 2, 2, 2, 2, 2], [1, 2, 3, 2]),
    'Authoritarian Capitalism (Fascist Economic Type)':
                                          persona('P CP CP CP C C C P CP P C C P P C C', all('rM', 8), [2, 2, 2, 2, 2, 2], [1, 2, 2, 3]),
    'Nationalist Corporatism (Fascist/Falangist Type)':
                                          persona('C CM CM CP C C C C CP C C C C M C C', 'rM rP rM rM rM rM rP rP', [2, 2, 2, 2, 2, 2], [2, 2, 2, 3]),
    'Nationalist Collectivism (Strasserite/NazBol Type)':
                                          persona('C CM CM CM C C C M CM C M C C M C M', all('rP', 8), [2, 2, 2, 2, 2, 2], [3, 2, 1, 3]),
    'State Communism / Marxism-Leninism': persona('C CM CM CM C C C C CM C C C C C C C', all('rP', 8), [2, 2, 1, 0, 2, 2], [3, 2, 0, 1]),
    'Totalitarianism / Absolutism':       persona('C CM CM CM C C C C CM C C C C C C C', 'rM rP rM rM rM rM rM rM', [2, 2, 2, 2, 2, 2], [2, 3, 2, 2]),
};

// ---------------------------------------------------------------------------------------------
// Turning a persona into answers, and running it through the real scoring
// ---------------------------------------------------------------------------------------------
const CORNER = { C: { c: 1, m: 0, p: 0 }, M: { c: 0, m: 1, p: 0 }, P: { c: 0, m: 0, p: 1 } };
const same = (a, b) => ['c', 'm', 'p'].every(k => Math.abs((a[k] || 0) - (b[k] || 0)) < 1e-9);
function targetScores(code) {
    if (code === 'X') return { c: 1 / 3, m: 1 / 3, p: 1 / 3 };
    if (CORNER[code]) return CORNER[code];
    if (code[0] === 'r') { const t = { c: 0.5, m: 0.5, p: 0.5 }; t[code[1].toLowerCase()] = 0; return t; }
    const t = { c: 0, m: 0, p: 0 }; for (const ch of code) t[ch.toLowerCase()] = 0.5; return t;   // CM / CP / MP
}
function answersFor(pz) {
    const ans = Q.map(q => {
        const i = PICK_IDS.indexOf(q.id), j = VILLAIN_IDS.indexOf(q.id), k = ORDER_IDS.indexOf(q.id);
        if (k >= 0) return q.options.findIndex(o => o.scores.a === pz.order[k] || (pz.order[k] === 0 && !o.scores.a));
        const code = i >= 0 ? pz.picks[i] : pz.villains[j];
        if (code === undefined) throw new Error(`persona has no answer for ${q.id}`);
        const idx = q.options.findIndex(o => same(o.scores, targetScores(code)));
        if (idx < 0) throw new Error(`answer ${code} is not an option on ${q.id}`);
        return idx;
    });
    return ans;
}
// noise: probability each answer is replaced by a random one (order answers move one step instead)
function run(pz, noise = 0) {
    const ans = answersFor(pz).map((idx, n) => {
        if (Math.random() >= noise) return idx;
        const q = Q[n];
        if (Scoring.isScale(q)) return Math.max(0, Math.min(4, idx + (Math.random() < 0.5 ? -1 : 1)));
        return Math.random() * q.options.length | 0;
    });
    const pos = Scoring.position(Q, ans);
    const ask = Scoring.chooseTiebreakers(pos, IDEOS, TB);
    const tbAns = {};
    for (const id of ask) {
        const q = TB.find(t => t.id === id);
        let pick = pz.tb[Scoring.TB_DIMS.indexOf(q.dim)];
        if (Math.random() < noise) pick = Math.max(0, Math.min(3, pick + (Math.random() < 0.5 ? -1 : 1)));
        tbAns[id] = pick;
    }
    const full = Scoring.withTiebreaks(pos, TB, tbAns);
    return { pos, full, asked: ask, ranked: Scoring.rank(full, IDEOS) };
}

const short = (s) => s.split(' (')[0].split(' /')[0];
let problems = 0;

// --suggest: print positions from personas
if (process.argv.includes('--suggest')) {
    for (const [name, pz] of Object.entries(personas)) {
        const p = Scoring.position(Q, answersFor(pz));
        const r = { c: Math.round(p.c), m: Math.round(p.m), p: Math.round(p.p) };
        const big = ['c', 'm', 'p'].sort((x, y) => r[y] - r[x])[0];
        r[big] += 100 - r.c - r.m - r.p;   // keep the sum at exactly 100
        const c = r.c, m = r.m, pp = r.p;
        const tb = Scoring.TB_DIMS.map((d, i) => `${d}: ${[0, 33, 67, 100][pz.tb[i]]}`).join(', ');
        console.log(`    ${JSON.stringify(name)}: { c: ${c}, m: ${m}, p: ${pp}, a: ${Math.round(p.a)}, ${tb}, broad: ${JSON.stringify((IP[name] || {}).broad || '?')} },`);
    }
    process.exit(0);
}

// 1 + 2. fit and stability
const names = Object.keys(IP);
const noPersona = names.filter(n => !personas[n]);
const strayPersona = Object.keys(personas).filter(n => !IP[n]);
if (noPersona.length) { console.log('Ideologies with no persona:', noPersona); problems++; }
if (strayPersona.length) { console.log('Personas with no ideology:', strayPersona); problems++; }

const RUNS = Number(process.env.RUNS || 400);
const rows = [];
for (const [name, pz] of Object.entries(personas)) {
    if (!IP[name]) continue;
    const r = run(pz);
    const posn = r.ranked.findIndex(x => x.name === name) + 1;
    let hold = 0;
    for (let i = 0; i < RUNS; i++) if (run(pz, 0.2).ranked[0].name === name) hold++;
    rows.push({ name, posn, top: r.ranked[0], next: r.ranked[1], asked: r.asked.length, stab: hold / RUNS, pos: r.pos });
}
const fits = rows.filter(r => r.posn === 1).length;
console.log(`1. FIT: ${fits}/${rows.length} personas land on their own ideology\n2. RETAKE STABILITY (20% of answers changed at random)`);
rows.sort((a, b) => a.stab - b.stab).forEach(r => {
    if (r.posn !== 1) problems++;
    console.log(`  ${r.posn === 1 ? 'OK  ' : 'MISS'} ${(r.stab * 100).toFixed(0).padStart(3)}%  ${short(r.name).padEnd(30)} ` +
        `C${r.pos.c.toFixed(0).padStart(3)} M${r.pos.m.toFixed(0).padStart(3)} P${r.pos.p.toFixed(0).padStart(3)} O${r.pos.a.toFixed(0).padStart(3)}  ` +
        `tie-breakers asked: ${r.asked}  ` + (r.posn === 1 ? `runner-up ${short(r.next.name)} (+${(r.next.d - r.top.d).toFixed(0)})` : `-> ${short(r.top.name)}`));
});
const avg = rows.reduce((s, r) => s + r.stab, 0) / rows.length;
console.log(`  average retake stability: ${(avg * 100).toFixed(0)}%`);

// 3. closest pairs
const pairs = [];
for (let i = 0; i < IDEOS.length; i++) for (let j = i + 1; j < IDEOS.length; j++) {
    const a = IDEOS[i], b = IDEOS[j];
    const full = Object.assign({}, a);   // include tie-break measures: the real distance once tie-breakers are asked
    pairs.push([a.name, b.name, Scoring.distance(full, b), Scoring.distance({ c: a.c, m: a.m, p: a.p, a: a.a }, b)]);
}
pairs.sort((x, y) => x[2] - y[2]);
console.log('\n3. CLOSEST PAIRS (distance with tie-breakers / main test only)');
pairs.slice(0, 8).forEach(([a, b, d, d0]) => console.log(`  ${d.toFixed(0).padStart(3)} / ${d0.toFixed(0).padStart(3)}  ${short(a)} <> ${short(b)}`));

// 4. territory and gaps (main test only)
const share = {}; let empty = 0; const M = 60000;
for (let i = 0; i < M; i++) {
    let r1 = Math.random(), r2 = Math.random(); if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
    const n = { c: r1 * 100, m: r2 * 100, p: (1 - r1 - r2) * 100, a: Math.random() * 100 };
    const r = Scoring.rank(n, IDEOS);
    share[r[0].name] = (share[r[0].name] || 0) + 1;
    if (r[0].d > 30) empty++;
}
const sh = Object.entries(share).sort((a, b) => b[1] - a[1]);
console.log(`\n4. TERRITORY: largest ${short(sh[0][0])} ${(sh[0][1] / M * 100).toFixed(1)}%, smallest ${short(sh[sh.length - 1][0])} ${(sh[sh.length - 1][1] / M * 100).toFixed(1)}%; ` +
    `${(empty / M * 100).toFixed(1)}% of positions are over 30 points from every ideology`);
const never = names.filter(n => !share[n]);
if (never.length) console.log('  never the closest anywhere:', never);

// 5. content checks
for (const n of names) {
    if (!SUM[n]) { console.log('No sarcastic summary:', n); problems++; }
    if (!SC[n]) { console.log('No classroom summary:', n); problems++; }
    const p = IP[n];
    if (Math.abs(p.c + p.m + p.p - 100) > 0.01) { console.log('Does not sum to 100:', n); problems++; }
    for (const d of Scoring.TB_DIMS) if (p[d] == null) { console.log(`No ${d} value:`, n); problems++; }
}
for (const q of [...Q, ...TB]) {
    if (!q.classroom) { console.log('No classroom wording for', q.id); problems++; }
    q.options.forEach((o, i) => { if (!o.classroom) { console.log('No classroom wording for', q.id, 'option', i + 1); problems++; } });
}
console.log(problems ? `\n${problems} problem(s).` : '\nAll checks passed.');
process.exitCode = problems ? 1 : 0;
