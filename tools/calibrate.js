// tools/calibrate.js
// Sanity check for the scoring. Run with:  node tools/calibrate.js
//
// Each persona below is a guess at how a typical holder of that ideology would answer.
// The script reports where each persona lands and whether its own ideology comes out as the
// closest match ("OK"). It also checks that every ideology can be reached and that every
// ideology has a summary. When you add or move an ideology, add a persona and re-run this.

const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(['questions.js', 'ideology_summaries.js', 'ideology_ideal_points.js']
    .map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n;\n') +
    '\n;this.Q=questions;this.S=ideologySummaries;this.IP=ideologyIdealPoints;', ctx);
const { Q, S, IP } = ctx;

const ORDER_WEIGHT = 0.6; // must match ORDER_WEIGHT in script.js
const NT = Q.filter(q => q.type !== 'agreeScale').length, NA = Q.length - NT;
const place = (u) => ({ c: u.c / NT * 100, m: u.m / NT * 100, p: u.p / NT * 100, a: NA ? (u.a / NA + 2) / 4 * 100 : 50 });
const rank = (n) => Object.entries(IP)
    .map(([k, p]) => [k, Math.sqrt((n.c - p.c) ** 2 + (n.m - p.m) ** 2 + (n.p - p.p) ** 2 + (ORDER_WEIGHT * (n.a - p.a)) ** 2)])
    .sort((a, b) => a[1] - b[1]);

// Answer keys. "Pick a corner" questions take C / M / P / X (X = muddle).
// "Pick a villain" questions take rC / rM / rP (the corner being criticised) or X.
// Order statements take -2..+2, where + always means MORE ORDER (regardless of how the statement is worded).
const PICK_IDS = ['q1', 'q2', 'q3', 'q6', 'q7', 'q10', 'q11', 'q14', 'q15', 'q18', 'q19', 'q22', 'q23', 'q26', 'q28', 'q30'];
const VILLAIN_IDS = ['q5', 'q9', 'q13', 'q17', 'q21', 'q25', 'q27', 'q29'];
const ORDER_IDS = ['q4', 'q8', 'q12', 'q16', 'q20', 'q24'];
const persona = (picks, villains, order) => {
    const k = {};
    picks.split(' ').forEach((v, i) => k[PICK_IDS[i]] = v);
    villains.split(' ').forEach((v, i) => k[VILLAIN_IDS[i]] = v);
    order.forEach((v, i) => k[ORDER_IDS[i]] = v);
    return k;
};
//                 picks: own health housing business schools carbon tech welfare banks arts town breakthroughs transport oldage news organised
//              villains: worries inequality project power freedom commongood crisis monopoly
//                 order: stopsearch offensive nationalid private emergency protest
const personas = {
    'Social Democracy':                        persona('C C C C C P C C X C C C C C C X', 'rP rP rP rP rP rP X rP', [-1, 0, 0, -1, 1, 0]),
    'Anarcho-Communism':                       persona('M M M M M M M M M M M M M M M M', 'rC rP rP rC rC rC rP rC', [-2, -1, -2, -2, -2, -2]),
    'Anarcho-Capitalism':                      persona('P P P P P P P P P P P P P P P P', 'rC rC rC rC rC rC rC rC', [-1, -2, -1, -2, -2, 1]),
    'State Communism / Marxism-Leninism':      persona('C C C C C C C C C C C C C C C C', 'rP rP rP rP rP rP rP rP', [2, 1, 1, 0, 2, 0]),
    'Classical Liberalism (Lockean/Smithian)': persona('X P P P C P P P P P P C P P P P', 'rC rC rC rC X rC X rP', [-1, -2, 0, -2, 0, 1]),
    'National Conservatism':                   persona('X C P P C X C M P C C C X M C C', 'rM rC rC rC rC rM rC rP', [2, 0, 2, 1, 1, 2]),
    'Mutualism':                               persona('M M M M M P M M M M M M M M M P', 'rC rC rC rC rC rC rC rC', [-2, -2, -2, -2, -2, -1]),
    'Democratic Socialism':                    persona('C C M M M C C C M C M C C C M M', 'rP rP rP rP rP rP rP rP', [-2, -1, -2, -2, 0, -2]),
    'Market-Oriented Liberalism / Third Way':  persona('X X P X P P C C X X C X X X C X', 'X X rC X X X X X', [0, -1, 0, -1, 1, 1]),
    'Minarchism / Night-Watchman State':       persona('X P P P P P P P P P P P P X P P', 'rC rC rC rC rC rC rC X', [0, -2, 0, -2, -1, 1]),
    'Radical Centrism / Syncretic Politics':   persona('X X X X X X X X X X X X X X X X', 'X X X X X X X X', [0, 0, 0, 0, 0, 0]),
};
const PICK = { C: 0, M: 1, P: 2, X: 3 }, VILLAIN = { rC: 0, rM: 1, rP: 2, X: 3 };
function score(key) {
    const u = { c: 0, m: 0, p: 0, a: 0 };
    for (const q of Q) {
        const k = key[q.id];
        if (k === undefined) throw new Error(`persona has no answer for ${q.id}`);
        if (q.type === 'agreeScale') { u.a += k; continue; }
        const o = q.options[(PICK_IDS.includes(q.id) ? PICK : VILLAIN)[k]];
        if (!o) throw new Error(`bad answer ${k} for ${q.id}`);
        for (const a of 'cmp') u[a] += o.scores[a];
    }
    return place(u);
}

let fails = 0;
for (const [name, key] of Object.entries(personas)) {
    const n = score(key), r = rank(n), pos = r.findIndex(x => x[0] === name) + 1;
    if (pos !== 1) fails++;
    const short = (s) => s.split(' (')[0].split(' /')[0];
    console.log(`${pos === 1 ? 'OK  ' : 'MISS'} ${short(name).padEnd(26)} C${n.c.toFixed(0).padStart(3)} M${n.m.toFixed(0).padStart(3)} P${n.p.toFixed(0).padStart(3)} Order${n.a.toFixed(0).padStart(4)}  ->  ${r.slice(0, 3).map(x => `${short(x[0])} (${x[1].toFixed(0)})`).join(', ')}`);
}

const names = Object.keys(IP);
const missing = names.filter(k => !S[k]);
if (missing.length) { console.log('\nMissing summaries:', missing); fails++; }
for (const k of names) { const p = IP[k]; if (Math.abs(p.c + p.m + p.p - 100) > 0.01) { console.log('Does not sum to 100:', k); fails++; } }

// Every ideology should be reachable by someone answering with a consistent lean.
const reached = new Set();
for (let i = 0; i < 100000; i++) {
    const w = [0, 0, 0].map(() => Math.random() * 4 - 2), wa = Math.random() * 4 - 2, noise = Math.random() * 2;
    const u = { c: 0, m: 0, p: 0, a: 0 };
    for (const q of Q) {
        let best, bv = -Infinity;
        for (const o of q.options) {
            const s = o.scores;
            const v = w[0] * (s.c || 0) + w[1] * (s.m || 0) + w[2] * (s.p || 0) + wa * (s.a || 0) + noise * Math.random();
            if (v > bv) { bv = v; best = o; }
        }
        for (const a of 'cmpa') u[a] += best.scores[a] || 0;
    }
    reached.add(rank(place(u))[0][0]);
}
const unreachable = names.filter(k => !reached.has(k));
if (unreachable.length) { console.log('\nNever reached:', unreachable); fails++; }

console.log(fails ? `\n${fails} problem(s).` : '\nAll checks passed.');
process.exitCode = fails ? 1 : 0;
