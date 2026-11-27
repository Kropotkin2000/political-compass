// scoring.js
//
// All the maths in one place. Loaded by the page (index.html) and by tools/calibrate.js,
// so the website and the calibration checks can never disagree.
//
// Main measures (asked of everyone):
//   c, m, p  position in the triangle (percentages summing to 100)
//   a        Liberty vs Order, 0 = all liberty, 100 = all order
// Tie-break measures (asked only when they would separate your closest matches):
//   change   0 = gradual reform ........ 100 = revolution
//   scale    0 = local ................. 100 = national / global
//   trad     0 = secular, progressive .. 100 = religious, traditional
//   nation   0 = humanity / class ...... 100 = nation first

var Scoring = (function () {
    'use strict';

    var AXES = ['c', 'm', 'p'];
    var TB_DIMS = ['change', 'scale', 'trad', 'nation'];
    var ORDER_WEIGHT = 0.6;     // how much Order counts against the triangle when matching
    var TB_WEIGHT = 0.5;        // how much each answered tie-break measure counts
    var CANDIDATE_MARGIN = 15;  // ideologies within this many points of the best are "close"
    var MAX_CANDIDATES = 5;
    var MAX_TIEBREAKERS = 4;
    var MIN_SPREAD = 30;        // a measure is only worth asking if close matches differ by this much on it

    var isScale = function (q) { return q.type === 'agreeScale'; };

    // answers: array of option indexes, one per question in `qs` (null = unanswered)
    function position(qs, answers) {
        var t = { c: 0, m: 0, p: 0, a: 0 }, nTri = 0, nA = 0;
        for (var i = 0; i < qs.length; i++) {
            var k = answers[i];
            if (k == null) continue;
            var s = qs[i].options[k].scores;
            if (isScale(qs[i])) { t.a += Number(s.a) || 0; nA++; }
            else { t.c += Number(s.c) || 0; t.m += Number(s.m) || 0; t.p += Number(s.p) || 0; nTri++; }
        }
        var pos = nTri ? { c: t.c / nTri * 100, m: t.m / nTri * 100, p: t.p / nTri * 100 } : { c: 100 / 3, m: 100 / 3, p: 100 / 3 };
        var sum = (pos.c + pos.m + pos.p) || 1;
        AXES.forEach(function (ax) { pos[ax] = pos[ax] / sum * 100; });
        pos.a = nA ? Math.max(0, Math.min(100, (t.a / nA + 2) / 4 * 100)) : 50;
        return pos;
    }

    // tbAnswers: { questionId: optionIndex }. Adds change/scale/trad/nation to a copy of pos, averaging
    // over the questions answered for each measure.
    function withTiebreaks(pos, tiebreakers, tbAnswers) {
        var out = {}, sums = {}, counts = {};
        for (var k in pos) out[k] = pos[k];
        (tiebreakers || []).forEach(function (q) {
            var idx = tbAnswers && tbAnswers[q.id];
            if (idx == null) return;
            sums[q.dim] = (sums[q.dim] || 0) + q.options[idx].value;
            counts[q.dim] = (counts[q.dim] || 0) + 1;
        });
        TB_DIMS.forEach(function (d) { if (counts[d]) out[d] = sums[d] / counts[d]; });
        return out;
    }

    function triDist(a, b) {
        return Math.sqrt(Math.pow(a.c - b.c, 2) + Math.pow(a.m - b.m, 2) + Math.pow(a.p - b.p, 2));
    }

    // Distance between a person and an ideology. Tie-break measures only count if the person has them.
    function distance(pos, ideo) {
        var d2 = Math.pow(triDist(pos, ideo), 2) + Math.pow(ORDER_WEIGHT * ((pos.a == null ? 50 : pos.a) - (ideo.a == null ? 50 : ideo.a)), 2);
        TB_DIMS.forEach(function (dim) {
            if (pos[dim] == null) return;
            var iv = ideo[dim] == null ? 50 : ideo[dim];
            d2 += Math.pow(TB_WEIGHT * (pos[dim] - iv), 2);
        });
        return Math.sqrt(d2);
    }

    // ideologies: array of { name, c, m, p, a, change, scale, trad, nation, broad }
    function rank(pos, ideologies) {
        return ideologies.map(function (i) {
            var o = {}; for (var k in i) o[k] = i[k]; o.d = distance(pos, i); return o;
        }).sort(function (x, y) { return x.d - y.d; });
    }

    // Which tie-break questions to ask, given a main-test position. Looks at the closest matches and
    // picks the measures on which they disagree most. Returns an array of tie-breaker question ids.
    function chooseTiebreakers(pos, ideologies, tiebreakers) {
        var ranked = rank(pos, ideologies);
        var best = ranked[0].d;
        var cands = ranked.filter(function (r) { return r.d <= best + CANDIDATE_MARGIN; }).slice(0, MAX_CANDIDATES);
        if (cands.length < 2) return [];
        var spreads = TB_DIMS.map(function (dim) {
            var vals = cands.map(function (c) { return c[dim] == null ? 50 : c[dim]; });
            // weight disagreement with the very closest match most heavily
            var top = vals[0], spread = Math.max.apply(null, vals) - Math.min.apply(null, vals);
            var vsTop = Math.max.apply(null, vals.slice(1).map(function (v) { return Math.abs(v - top); }));
            return { dim: dim, vsTop: vsTop, score: spread + vsTop };
        }).filter(function (s) { return s.vsTop >= MIN_SPREAD; })   // only measures that could change the top match
          .sort(function (x, y) { return y.score - x.score; });
        var chosen = [];
        // best measure gets both of its questions, the next ones get one each
        spreads.forEach(function (s, i) {
            var qs = tiebreakers.filter(function (q) { return q.dim === s.dim; });
            var take = i === 0 ? qs.length : 1;
            qs.slice(0, take).forEach(function (q) { if (chosen.length < MAX_TIEBREAKERS) chosen.push(q.id); });
        });
        return chosen;
    }

    // How strongly someone leans: distance from the centre of the triangle as a share of centre-to-corner.
    var CENTRE = { c: 100 / 3, m: 100 / 3, p: 100 / 3, a: 50 };
    var CORNER_DIST = triDist(CENTRE, { c: 100, m: 0, p: 0 });
    function lean(pos) { return Math.min(100, triDist(pos, CENTRE) / CORNER_DIST * 100); }

    return {
        AXES: AXES, TB_DIMS: TB_DIMS, ORDER_WEIGHT: ORDER_WEIGHT, TB_WEIGHT: TB_WEIGHT, CENTRE: CENTRE,
        isScale: isScale, position: position, withTiebreaks: withTiebreaks, triDist: triDist,
        distance: distance, rank: rank, chooseTiebreakers: chooseTiebreakers, lean: lean,
    };
})();

if (typeof module !== 'undefined') module.exports = Scoring;
