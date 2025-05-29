// script.js

document.addEventListener('DOMContentLoaded', () => {
    // UTILITY FUNCTIONS
    function shuffleArray(array) {
        if (!array || array.length === 0) return [];
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // DOM Element References
    const questionTextElement = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const nextButton = document.getElementById('next-button');
    const progressIndicator = document.getElementById('progress-indicator');
    const quizArea = document.getElementById('quiz-area');
    const resultsArea = document.getElementById('results-area');
    const rawScoresElement = document.getElementById('raw-scores');
    const normalizedScoresElement = document.getElementById('normalized-scores');
    const devControlsContainer = document.createElement('div');
    devControlsContainer.id = 'dev-controls';

    const restartButton = document.getElementById('restart-button');
    const backButton = document.getElementById('back-button');
    const themeSwitch = document.getElementById('theme-switch-checkbox');
    const copyResultsButton = document.getElementById('copy-results-button');
    const copyStatusElement = document.getElementById('copy-status');

    const ideologyLabelElement = document.getElementById('ideology-label-result');
    const primaryIdeologyProximityElement = document.getElementById('primary-ideology-proximity-result');
    const ideologySummaryElement = document.getElementById('ideology-summary-result');
    const plotDiv = document.getElementById('plot-div');
    const extremityScoreDisplayElement = document.getElementById('extremity-score-display');

    const secondaryMatchArea = document.getElementById('secondary-match-area');
    const secondaryIdeologyLabelElement = document.getElementById('secondary-ideology-label-result');
    const secondaryIdeologyProximityElement = document.getElementById('secondary-ideology-proximity-result');
    const secondaryIdeologySummaryElement = document.getElementById('secondary-ideology-summary-result');

    // Quiz State Variables
    let userScores = { c: 0, m: 0, p: 0 };
    let minMaxRawScores = { c: { min: 0, max: 0 }, m: { min: 0, max: 0 }, p: { min: 0, max: 0 } };

    // Affinity System State & Parameters
    const stage1AffinityQuestionIds = ['q1', 'q2', 'q3']; // Assumes q1-q3 in questions.js are the IDQs
    const NUM_STAGE_1_QUESTIONS = stage1AffinityQuestionIds.length;
    const stage2AffinityQuestionIds = ['q4', 'q5', 'q6']; // Assumes q4-q6 in questions.js are the Vision questions
    const NUM_STAGE_2_QUESTIONS = stage2AffinityQuestionIds.length;

    let affinityOptionChoices = {};
    let idqAxisStates = { dominantHigh: null, resisted: [], confidence: 'none' };
    let affinityStage1Complete = false;
    let affinityStage2Complete = false;

    const MIN_AFFIRMATION_SIGNAL_FOR_HIGH = 2.0; // Example: Net positive signal required
    const DOMINANT_HIGH_SIGNAL_DIFFERENCE = 1.0; // Example: How much stronger one signal must be
    const DAMPENING_FACTOR = 0.5;
    const MAX_ACCUMULATED_ON_RESISTED_AXIS = 3.0;

    let currentQuestionActualIndex = 0;
    let currentQuestionDisplayNumber = 0;
    let questionOrder = [];
    let answerHistory = [];
    let debounceTimer;
    let devSliderControlsState = {};
    const MAX_POSSIBLE_DISTANCE_IN_TERNARY_SPACE = Math.sqrt(20000);

    // --- CRITICAL FILE CHECKS ---
    if (typeof questions === 'undefined' || !Array.isArray(questions) || questions.length === 0) {
        document.body.innerHTML = `<p style="color:red;text-align:center;padding:20px;font-size:1.2em;">Error: questions.js not loaded or empty.</p>`; return;
    }
    if (typeof ideologySummaries === 'undefined' || typeof ideologySummaries !== 'object' || Object.keys(ideologySummaries).length === 0) {
        document.body.innerHTML = `<p style="color:red;text-align:center;padding:20px;font-size:1.2em;">Error: ideology_summaries.js not loaded or empty.</p>`; return;
    }
    if (typeof ideologyIdealPoints === 'undefined' || typeof ideologyIdealPoints !== 'object' || Object.keys(ideologyIdealPoints).length === 0) {
        document.body.innerHTML = `<p style="color:red;text-align:center;padding:20px;font-size:1.2em;">Error: ideology_ideal_points.js not loaded or empty.</p>`; return;
    }
    if (typeof Plotly === 'undefined') {
        if (plotDiv) plotDiv.innerHTML = "<p style='color:red; text-align:center;'>Error: Plotly.js library not loaded.</p>";
        console.error("Plotly.js not loaded.");
    }

    // --- DARK MODE LOGIC ---
    function applyTheme(theme) {
        const isCurrentlyDark = document.body.classList.contains('dark-mode');
        let themeChanged = false;
        if (theme === 'dark') { if (!isCurrentlyDark) { document.body.classList.add('dark-mode'); themeChanged = true; } if (themeSwitch) themeSwitch.checked = true; }
        else { if (isCurrentlyDark) { document.body.classList.remove('dark-mode'); themeChanged = true; } if (themeSwitch) themeSwitch.checked = false; }

        const elementsToStyleLikeScoreBox = [extremityScoreDisplayElement, primaryIdeologyProximityElement, secondaryIdeologyProximityElement];
         elementsToStyleLikeScoreBox.forEach(el => {
            if (el) {
                const isDarkNow = document.body.classList.contains('dark-mode');
                const safeGetCssVar = (varName, fallback) => { try { const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); return val || fallback; } catch (e) { return fallback; } };
                el.style.backgroundColor = isDarkNow ? safeGetCssVar('--score-box-bg', '#2c2c3a') : '#eef';
                if (el === extremityScoreDisplayElement) {
                    el.style.borderLeftColor = isDarkNow ? safeGetCssVar('--score-box-border', '#555577') : '#77a';
                    el.style.borderLeftStyle = 'solid'; el.style.borderLeftWidth = '3px';
                } else { el.style.borderLeftStyle = 'none'; }
                el.style.color = isDarkNow ? safeGetCssVar('--text-color', '#e2e2e2') : '#333';
                el.style.padding = '10px';
            }
        });
        if (ideologySummaryElement) {
            const isDarkNow = document.body.classList.contains('dark-mode');
            const safeGetCssVar = (varName, fallback) => { try { const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); return val || fallback; } catch (e) { return fallback; }};
            ideologySummaryElement.style.backgroundColor = isDarkNow ? safeGetCssVar('--option-bg', '#333333') : '#f9f9f9';
            ideologySummaryElement.style.borderColor = isDarkNow ? safeGetCssVar('--option-border', '#444444') : '#ccc';
        }
         if (secondaryIdeologySummaryElement) {
            const isDarkNow = document.body.classList.contains('dark-mode');
            const safeGetCssVar = (varName, fallback) => { try { const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); return val || fallback; } catch (e) { return fallback; }};
            secondaryIdeologySummaryElement.style.backgroundColor = isDarkNow ? safeGetCssVar('--option-bg', '#383838') : '#fdfdfd';
            secondaryIdeologySummaryElement.style.borderColor = isDarkNow ? safeGetCssVar('--option-border', '#4a4a4a') : '#eee';
        }
        if (themeChanged && resultsArea && resultsArea.style.display === 'block' && typeof Plotly !== 'undefined') {
            let currentNormalizedScoresToPlot; let currentIdeologyInfoForPlot; let currentRawScoresForExtremityUpdate;
            if (isDevMode && Object.keys(devSliderControlsState).length > 0 && devSliderControlsState.C.input) {
                currentNormalizedScoresToPlot = { c: parseFloat(devSliderControlsState.C.value), m: parseFloat(devSliderControlsState.M.value), p: parseFloat(devSliderControlsState.P.value) };
                let tempSumForPlot = currentNormalizedScoresToPlot.c + currentNormalizedScoresToPlot.m + currentNormalizedScoresToPlot.p;
                if (Math.abs(tempSumForPlot - 100.0) > 0.1) {
                    if (tempSumForPlot === 0) {currentNormalizedScoresToPlot = {c:33.33,m:33.33,p:33.34};}
                    else { let scale = 100.0 / tempSumForPlot; currentNormalizedScoresToPlot.c *= scale; currentNormalizedScoresToPlot.m *= scale; currentNormalizedScoresToPlot.p = 100.0 - currentNormalizedScoresToPlot.c - currentNormalizedScoresToPlot.m;}
                }
                currentNormalizedScoresToPlot.c = parseFloat(currentNormalizedScoresToPlot.c.toFixed(2)); currentNormalizedScoresToPlot.m = parseFloat(currentNormalizedScoresToPlot.m.toFixed(2)); currentNormalizedScoresToPlot.p = parseFloat(currentNormalizedScoresToPlot.p.toFixed(2));
                const mid_C_dev = (minMaxRawScores.c.max + minMaxRawScores.c.min) / 2; const mid_M_dev = (minMaxRawScores.m.max + minMaxRawScores.m.min) / 2; const mid_P_dev = (minMaxRawScores.p.max + minMaxRawScores.p.min) / 2;
                const range_C_dev = (minMaxRawScores.c.max - minMaxRawScores.c.min); const range_M_dev = (minMaxRawScores.m.max - minMaxRawScores.m.min); const range_P_dev = (minMaxRawScores.p.max - minMaxRawScores.p.min);
                currentRawScoresForExtremityUpdate = { c: mid_C_dev + ((currentNormalizedScoresToPlot.c - 50) / 50) * (range_C_dev / 2 || 1), m: mid_M_dev + ((currentNormalizedScoresToPlot.m - 50) / 50) * (range_M_dev / 2 || 1), p: mid_P_dev + ((currentNormalizedScoresToPlot.p - 50) / 50) * (range_P_dev / 2 || 1)};
                currentRawScoresForExtremityUpdate.c = Math.max(minMaxRawScores.c.min, Math.min(minMaxRawScores.c.max, currentRawScoresForExtremityUpdate.c)); currentRawScoresForExtremityUpdate.m = Math.max(minMaxRawScores.m.min, Math.min(minMaxRawScores.m.max, currentRawScoresForExtremityUpdate.m)); currentRawScoresForExtremityUpdate.p = Math.max(minMaxRawScores.p.min, Math.min(minMaxRawScores.p.max, currentRawScoresForExtremityUpdate.p));
                currentIdeologyInfoForPlot = getIdeologyLabelAndSarcasm(currentNormalizedScoresToPlot.c, currentNormalizedScoresToPlot.m, currentNormalizedScoresToPlot.p);
            } else if (!isDevMode && Object.keys(userScores).length > 0 && (userScores.c !== 0 || userScores.m !== 0 || userScores.p !== 0) ) {
                currentNormalizedScoresToPlot = normalizeScores(userScores, minMaxRawScores); currentRawScoresForExtremityUpdate = userScores;
                currentIdeologyInfoForPlot = getIdeologyLabelAndSarcasm(currentNormalizedScoresToPlot.c, currentNormalizedScoresToPlot.m, currentNormalizedScoresToPlot.p);
            }
            if (currentNormalizedScoresToPlot && currentIdeologyInfoForPlot) {
                let plotTitle = determinePlotTitle(currentIdeologyInfoForPlot);
                drawPlot(currentNormalizedScoresToPlot, plotTitle);
                if (currentRawScoresForExtremityUpdate && typeof minMaxRawScores.c.min !== 'undefined') { calculateAndDisplayExtremityScore(currentNormalizedScoresToPlot, currentRawScoresForExtremityUpdate);}
            }
        }
    }
    if (themeSwitch) { const savedTheme = localStorage.getItem('theme'); if (savedTheme) { applyTheme(savedTheme); } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { applyTheme('dark'); } else { applyTheme('light'); } themeSwitch.addEventListener('change', function() { const newTheme = this.checked ? 'dark' : 'light'; applyTheme(newTheme); localStorage.setItem('theme', newTheme); }); if (window.matchMedia) { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => { if (!localStorage.getItem('theme')) { applyTheme(e.matches ? 'dark' : 'light'); }});}} else { if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { applyTheme('dark');} else {applyTheme('light');}}

    // --- QUIZ LOGIC & AFFINITY SYSTEM ---
    function initializeQuizState() {
        userScores = { c: 0, m: 0, p: 0 };
        affinityOptionChoices = {};
        idqAxisStates = { dominantHigh: null, resisted: [], confidence: 'none' };
        affinityStage1Complete = false;
        affinityStage2Complete = false;
        currentQuestionDisplayNumber = 0;
        answerHistory = [];

        const allQuestionIndices = [...Array(questions.length).keys()];
        const stage1OriginalIndices = stage1AffinityQuestionIds.map(id => questions.findIndex(q => q.id === id)).filter(idx => idx !== -1);
        const stage2OriginalIndices = stage2AffinityQuestionIds.map(id => questions.findIndex(q => q.id === id)).filter(idx => idx !== -1);

        if (stage1OriginalIndices.length !== NUM_STAGE_1_QUESTIONS || stage2OriginalIndices.length !== NUM_STAGE_2_QUESTIONS) {
            console.error("Critical error: Not all affinity questions found by ID. Quiz order will be incorrect. Defaulting to simple sequence.");
            questionOrder = allQuestionIndices;
        } else {
            const affinityIndicesSet = new Set([...stage1OriginalIndices, ...stage2OriginalIndices]);
            const mainPoolOriginalIndices = allQuestionIndices.filter(index => !affinityIndicesSet.has(index));
            questionOrder = [...stage1OriginalIndices, ...stage2OriginalIndices, ...mainPoolOriginalIndices];
        }

        if (resultsArea) resultsArea.style.display = 'none';
        if (extremityScoreDisplayElement) extremityScoreDisplayElement.style.display = 'none';
        if (primaryIdeologyProximityElement) primaryIdeologyProximityElement.style.display = 'none';
        if (secondaryMatchArea) secondaryMatchArea.style.display = 'none';
        if (quizArea) quizArea.style.display = 'block';
        if (devControlsContainer.parentNode) { devControlsContainer.parentNode.removeChild(devControlsContainer); }
        if (progressIndicator) progressIndicator.style.display = 'block';
        if (nextButton) { nextButton.disabled = false; nextButton.style.backgroundColor = ''; }
        if (restartButton) restartButton.style.display = 'none';
        if (backButton) backButton.style.display = 'none';
        if (copyStatusElement) copyStatusElement.textContent = "";
        if (isDevMode && devSliderControlsState.C && devSliderControlsState.C.input) {
            devSliderControlsState.C.value = 33.3; devSliderControlsState.C.locked = false;
            devSliderControlsState.M.value = 33.3; devSliderControlsState.M.locked = false;
            devSliderControlsState.P.value = 33.4; devSliderControlsState.P.locked = false;
            updateAllDisplaysFromInternalState();
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const isDevMode = urlParams.get('dev') === 'true';
    calculateMinMaxRawScores();

    function calculateMinMaxRawScores() {
        minMaxRawScores = { c: { min: 0, max: 0 }, m: { min: 0, max: 0 }, p: { min: 0, max: 0 } };
        if (!questions || questions.length === 0) {
            console.error("No questions found for min/max score calculation.");
            minMaxRawScores = { c: { min: -10, max: 10 }, m: { min: -10, max: 10 }, p: { min: -10, max: 10 } }; return;
        }
        questions.forEach(q => {
            if (q && q.options && q.options.length > 0) {
                const cScoresInQ = q.options.map(opt => opt.scores.c || 0);
                const mScoresInQ = q.options.map(opt => opt.scores.m || 0);
                const pScoresInQ = q.options.map(opt => opt.scores.p || 0);
                if (cScoresInQ.length > 0) { minMaxRawScores.c.min += Math.min(...cScoresInQ); minMaxRawScores.c.max += Math.max(...cScoresInQ); }
                if (mScoresInQ.length > 0) { minMaxRawScores.m.min += Math.min(...mScoresInQ); minMaxRawScores.m.max += Math.max(...mScoresInQ); }
                if (pScoresInQ.length > 0) { minMaxRawScores.p.min += Math.min(...pScoresInQ); minMaxRawScores.p.max += Math.max(...pScoresInQ); }
            }
        });
    }

    function determineDominantHighAndResistedAxes(currentStage) {
        let affirm_C = 0, affirm_M = 0, affirm_P = 0;
        let reject_C = 0, reject_M = 0, reject_P = 0;
        const questionsToConsider = currentStage === 1 ? stage1AffinityQuestionIds : [...stage1AffinityQuestionIds, ...stage2AffinityQuestionIds];

        questionsToConsider.forEach(qId => {
            const choice = affinityOptionChoices[qId];
            if (typeof choice === 'undefined') return;

            if (qId === 'q1') { // Property: P vs M
                if (choice === 0) { affirm_P += 1; reject_M += 1; }
                else if (choice === 1) { affirm_M += 1; reject_P += 1; }
                else if (choice === 2) { reject_P += 0.3; reject_M += 0.3; }
            } else if (qId === 'q2') { // State: C vs Anti-C
                if (choice === 0) { affirm_C += 1; }
                else if (choice === 1) { reject_C += 1; }
                else if (choice === 2) { reject_C += 0.3; }
            } else if (qId === 'q3') { // Community Decision: M vs Anti-M
                if (choice === 0) { affirm_M += 1; }
                else if (choice === 1) { reject_M += 1; }
                else if (choice === 2) { reject_M += 0.3; }
            } else if (qId === 'q4') { // Anarcho-Capitalism (Extreme P)
                if (choice === 0) { affirm_P += 2; }
                else if (choice === 1) { reject_P += 1.5; affirm_C += 0.5; }
                else if (choice === 2) { reject_P += 1.5; affirm_M += 0.5; }
                else if (choice === 3) { reject_P += 0.5; }
            } else if (qId === 'q5') { // Anarcho-Communism (Extreme M)
                if (choice === 0) { affirm_M += 2; }
                else if (choice === 1) { reject_M += 1.5; affirm_C += 0.5; }
                else if (choice === 2) { reject_M += 1.5; affirm_P += 0.5; }
                else if (choice === 3) { reject_M += 0.5; }
            } else if (qId === 'q6') { // Totalitarian State (Extreme C)
                if (choice === 0) { affirm_C += 2; }
                else if (choice === 1) { reject_C += 1.5; affirm_M += 0.5; }
                else if (choice === 2) { reject_C += 1.5; affirm_P += 0.5; }
                else if (choice === 3) { reject_C += 0.5; }
            }
        });

        let netSignal_C = affirm_C - reject_C; let netSignal_M = affirm_M - reject_M; let netSignal_P = affirm_P - reject_P;
        let potentialHighAxes = [];
        if (netSignal_C >= MIN_AFFIRMATION_SIGNAL_FOR_HIGH) potentialHighAxes.push({ axis: 'C', signal: netSignal_C });
        if (netSignal_M >= MIN_AFFIRMATION_SIGNAL_FOR_HIGH) potentialHighAxes.push({ axis: 'M', signal: netSignal_M });
        if (netSignal_P >= MIN_AFFIRMATION_SIGNAL_FOR_HIGH) potentialHighAxes.push({ axis: 'P', signal: netSignal_P });

        idqAxisStates.dominantHigh = null; idqAxisStates.resisted = []; idqAxisStates.confidence = 'none';
        if (potentialHighAxes.length > 0) {
            potentialHighAxes.sort((a, b) => b.signal - a.signal);
            if (potentialHighAxes.length === 1 || (potentialHighAxes[0].signal > potentialHighAxes[1].signal + DOMINANT_HIGH_SIGNAL_DIFFERENCE)) {
                idqAxisStates.dominantHigh = potentialHighAxes[0].axis;
                idqAxisStates.confidence = (currentStage === 1) ? 'tentative' : 'confirmed';
            }
        }
        if (idqAxisStates.dominantHigh) {
            idqAxisStates.resisted = ['C', 'M', 'P'].filter(ax => ax !== idqAxisStates.dominantHigh);
        }
    }

    function applyDiminishingReturns(baseScores, currentTotalUserScores) {
        if (!idqAxisStates.dominantHigh || idqAxisStates.confidence !== 'confirmed') { return baseScores; }
        let dampened = { ...baseScores };
        idqAxisStates.resisted.forEach(resistedAxisLetter => {
            const axisKey = resistedAxisLetter.toLowerCase();
            if (baseScores[axisKey] > 0) {
                if (currentTotalUserScores[axisKey] >= MAX_ACCUMULATED_ON_RESISTED_AXIS) { dampened[axisKey] = 0; }
                else if (currentTotalUserScores[axisKey] + baseScores[axisKey] > MAX_ACCUMULATED_ON_RESISTED_AXIS) {
                    dampened[axisKey] = MAX_ACCUMULATED_ON_RESISTED_AXIS - currentTotalUserScores[axisKey];
                    dampened[axisKey] = Math.max(0, dampened[axisKey]);
                } else { dampened[axisKey] = baseScores[axisKey] * DAMPENING_FACTOR; }
            }
        });
        return dampened;
    }

    function loadQuestion() {
        if (currentQuestionDisplayNumber < questions.length) {
            currentQuestionActualIndex = questionOrder[currentQuestionDisplayNumber];
            const currentQuestionObject = questions[currentQuestionActualIndex];
            if (!currentQuestionObject) {
                console.error("Question object not found for actual index: " + currentQuestionActualIndex + " (display number " + currentQuestionDisplayNumber + ")");
                if(quizArea) quizArea.innerHTML = "<p style='color:red'>Error loading question. Please restart.</p>"; return;
            }
            if (questionTextElement) questionTextElement.innerHTML = `Q${currentQuestionDisplayNumber + 1}: ${currentQuestionObject.text}`;
            if (optionsContainer) optionsContainer.innerHTML = '';
            const previousAnswerRecord = answerHistory.find(hist => hist.displayNumber === currentQuestionDisplayNumber);
            let displayOptions = [...currentQuestionObject.options];
            const shouldShuffleOptions = (currentQuestionObject.type === 'forcedChoice3' || currentQuestionObject.type === 'forcedChoice4');
            if (shouldShuffleOptions) { displayOptions = shuffleArray(displayOptions); }

            displayOptions.forEach((optionData, displayIndexInList) => {
                const originalOptionIndex = currentQuestionObject.options.findIndex(opt => opt.text === optionData.text);
                const inputId = `q${currentQuestionDisplayNumber}_opt${displayIndexInList}`;
                const input = document.createElement('input'); input.type = 'radio'; input.name = `q_options_${currentQuestionDisplayNumber}`; input.id = inputId;
                input.value = originalOptionIndex.toString(); input.dataset.scores = JSON.stringify(optionData.scores); input.dataset.originalOptionText = optionData.text;
                if (previousAnswerRecord && previousAnswerRecord.selectedOptionIndex === originalOptionIndex) { input.checked = true; }
                const label = document.createElement('label'); label.htmlFor = inputId; label.textContent = optionData.text;
                if (optionsContainer) { optionsContainer.appendChild(input); optionsContainer.appendChild(label); }
            });
            if (progressIndicator) progressIndicator.textContent = `Question ${currentQuestionDisplayNumber + 1} of ${questions.length}`;
            if (nextButton) nextButton.textContent = (currentQuestionDisplayNumber + 1 === questions.length) ? "Finish & See My Glorious Doom" : "Next";
            if (backButton) backButton.style.display = (currentQuestionDisplayNumber > 0 && answerHistory.length > 0) ? 'inline-block' : 'none';
            const showRestart = currentQuestionDisplayNumber > 0 || (resultsArea && resultsArea.style.display === 'block');
            if (restartButton) { restartButton.style.display = isDevMode || showRestart ? 'inline-block' : 'none'; }
        } else { showResults(); }
    }

    function getSelectedOptionData() {
        const radioGroupName = `q_options_${currentQuestionDisplayNumber}`;
        const selectedRadio = document.querySelector(`input[name="${radioGroupName}"]:checked`);
        if (selectedRadio) {
            try {
                const scores = JSON.parse(selectedRadio.dataset.scores);
                const validatedScores = { c: Number(scores.c) || 0, m: Number(scores.m) || 0, p: Number(scores.p) || 0 };
                const originalIndex = parseInt(selectedRadio.value, 10); const text = selectedRadio.dataset.originalOptionText;
                return { scores: validatedScores, originalOptionIndex: originalIndex, text: text };
            } catch (e) { console.error("Error parsing scores:", e); return null; }
        }
        return null;
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const selectedData = getSelectedOptionData();
            if (selectedData && typeof selectedData.originalOptionIndex !== 'undefined') {
                const questionJustAnswered = questions[currentQuestionActualIndex];
                let baseScoresFromOption = { ...selectedData.scores }; let scoresToAdd = { ...baseScoresFromOption };
                const isStage1AffinityQ = stage1AffinityQuestionIds.includes(questionJustAnswered.id);
                const isStage2AffinityQ = stage2AffinityQuestionIds.includes(questionJustAnswered.id);

                if (isStage1AffinityQ || isStage2AffinityQ) { affinityOptionChoices[questionJustAnswered.id] = selectedData.originalOptionIndex; }
                if (!isStage1AffinityQ && !isStage2AffinityQ) { scoresToAdd = applyDiminishingReturns(baseScoresFromOption, userScores); }

                userScores.c += scoresToAdd.c; userScores.m += scoresToAdd.m; userScores.p += scoresToAdd.p;
                answerHistory.push({ displayNumber: currentQuestionDisplayNumber, questionId: questionJustAnswered.id, originalQuestionIndex: currentQuestionActualIndex, selectedOptionIndex: selectedData.originalOptionIndex, selectedOptionText: selectedData.text, scoresAddedToUserTotal: { ...scoresToAdd }, baseScoresFromOption: { ...baseScoresFromOption } });

                if (isStage1AffinityQ) {
                    const answeredStage1Count = Object.keys(affinityOptionChoices).filter(id => stage1AffinityQuestionIds.includes(id)).length;
                    if (answeredStage1Count === NUM_STAGE_1_QUESTIONS && !affinityStage1Complete) {
                        affinityStage1Complete = true; determineDominantHighAndResistedAxes(1);
                    }
                } else if (isStage2AffinityQ) {
                    const answeredStage2Count = Object.keys(affinityOptionChoices).filter(id => stage2AffinityQuestionIds.includes(id)).length;
                    if (answeredStage2Count === NUM_STAGE_2_QUESTIONS && affinityStage1Complete && !affinityStage2Complete) {
                        affinityStage2Complete = true; determineDominantHighAndResistedAxes(2);
                    }
                }
                currentQuestionDisplayNumber++; loadQuestion();
            } else { if (currentQuestionDisplayNumber < questions.length) { alert("Please select an option before proceeding, you indecisive wretch!"); } }
        });
    }

    if (backButton) {
        backButton.addEventListener('click', () => {
            if (currentQuestionDisplayNumber > 0) {
                const lastAnswerRecord = answerHistory.pop();
                if (lastAnswerRecord) {
                    userScores.c -= lastAnswerRecord.scoresAddedToUserTotal.c; userScores.m -= lastAnswerRecord.scoresAddedToUserTotal.m; userScores.p -= lastAnswerRecord.scoresAddedToUserTotal.p;
                    const questionIdPopped = lastAnswerRecord.questionId;
                    if (stage1AffinityQuestionIds.includes(questionIdPopped) || stage2AffinityQuestionIds.includes(questionIdPopped)) {
                        delete affinityOptionChoices[questionIdPopped];
                        if (affinityStage2Complete && stage2AffinityQuestionIds.includes(questionIdPopped)) {
                            affinityStage2Complete = false; determineDominantHighAndResistedAxes(1);
                        } else if (affinityStage1Complete && stage1AffinityQuestionIds.includes(questionIdPopped)) {
                            affinityStage1Complete = false; idqAxisStates = { dominantHigh: null, resisted: [], confidence: 'none' };
                        }
                    }
                }
                currentQuestionDisplayNumber--; loadQuestion();
            }
        });
    }

    function normalizeScores(rawScores, minMax) {
        let rangeC = (minMax.c.max - minMax.c.min); let rangeM = (minMax.m.max - minMax.m.min); let rangeP = (minMax.p.max - minMax.p.min);
        if (rangeC === 0) rangeC = 1; if (rangeM === 0) rangeM = 1; if (rangeP === 0) rangeP = 1;
        let normC_intermediate = (rawScores.c - minMax.c.min) / rangeC; let normM_intermediate = (rawScores.m - minMax.m.min) / rangeM; let normP_intermediate = (rawScores.p - minMax.p.min) / rangeP;
        normC_intermediate = Math.max(0, Math.min(1, normC_intermediate)); normM_intermediate = Math.max(0, Math.min(1, normM_intermediate)); normP_intermediate = Math.max(0, Math.min(1, normP_intermediate));
        const totalIntermediate = normC_intermediate + normM_intermediate + normP_intermediate;
        if (totalIntermediate === 0) return { c: 33.33, m: 33.33, p: 33.34 };
        let c = parseFloat(((normC_intermediate / totalIntermediate) * 100).toFixed(2)); let m = parseFloat(((normM_intermediate / totalIntermediate) * 100).toFixed(2)); let p = parseFloat((100.0 - c - m).toFixed(2));
        c = Math.max(0, Math.min(100, c)); m = Math.max(0, Math.min(100, m)); p = Math.max(0, Math.min(100, p));
        let finalSum = c + m + p; const epsilon = 0.03;
        if (Math.abs(finalSum - 100.0) > epsilon) { p = parseFloat((100.0 - c - m).toFixed(2)); p = Math.max(0, Math.min(100, p)); }
        return { c: c, m: m, p: p };
    }

    function updateAllDisplaysFromInternalState() { for (const key in devSliderControlsState) { const s = devSliderControlsState[key]; if (s.input && s.span && s.label && s.lockStatusSpan) { s.value = parseFloat(s.value.toFixed(1)); s.input.value = s.value.toFixed(1); s.span.textContent = `${s.value.toFixed(1)}%`; s.lockStatusSpan.textContent = s.locked ? "(Locked)" : ""; s.label.classList.toggle('locked-label', s.locked); s.input.disabled = s.locked; } } }
    function reBalanceSliders(changedKey = null) { let sumLocked = 0; let unlockedKeys = []; let sumOfUnlockedOriginalValues = 0; for (const key in devSliderControlsState) { const s = devSliderControlsState[key]; let currentValue = (key === changedKey && !s.locked) ? parseFloat(s.input.value) : s.value; currentValue = parseFloat(Math.max(0, Math.min(100, currentValue)).toFixed(1)); s.value = currentValue; if (s.locked) { sumLocked += s.value; } else { unlockedKeys.push(key); sumOfUnlockedOriginalValues += s.value; } } let availableForUnlocked = 100.0 - sumLocked; availableForUnlocked = Math.max(0, availableForUnlocked); if (unlockedKeys.length > 0) { if (unlockedKeys.includes(changedKey)) { let valueOfChanged = devSliderControlsState[changedKey].value; valueOfChanged = Math.min(valueOfChanged, availableForUnlocked); devSliderControlsState[changedKey].value = valueOfChanged; let sumForOthers = availableForUnlocked - valueOfChanged; sumForOthers = Math.max(0, sumForOthers); let otherUnlockedKeys = unlockedKeys.filter(k => k !== changedKey); if (otherUnlockedKeys.length > 0) { let sumOfOriginalValuesOfOthers = 0; otherUnlockedKeys.forEach(k => sumOfOriginalValuesOfOthers += devSliderControlsState[k].value); if (Math.abs(sumOfOriginalValuesOfOthers) < 0.01) { const valPer = sumForOthers / otherUnlockedKeys.length; otherUnlockedKeys.forEach(k => devSliderControlsState[k].value = valPer); } else { otherUnlockedKeys.forEach(k => { const proportion = devSliderControlsState[k].value / sumOfOriginalValuesOfOthers; devSliderControlsState[k].value = proportion * sumForOthers; }); } } } else { if (Math.abs(sumOfUnlockedOriginalValues) < 0.01 && unlockedKeys.length > 0) { const valPer = availableForUnlocked / unlockedKeys.length; unlockedKeys.forEach(k => devSliderControlsState[k].value = valPer); } else if (unlockedKeys.length > 0 && sumOfUnlockedOriginalValues !== 0) { unlockedKeys.forEach(k => { const proportion = devSliderControlsState[k].value / sumOfUnlockedOriginalValues; devSliderControlsState[k].value = proportion * availableForUnlocked; }); } } } let currentTotal = 0; for (const key in devSliderControlsState) { devSliderControlsState[key].value = parseFloat(Math.max(0, Math.min(100, devSliderControlsState[key].value)).toFixed(1)); currentTotal += devSliderControlsState[key].value; } let diff = 100.0 - currentTotal; if (Math.abs(diff) >= 0.05) { const orderOfPreference = ['P', 'M', 'C']; for (const key of orderOfPreference) { if (unlockedKeys.includes(key)) { let newVal = devSliderControlsState[key].value + diff; if (newVal >= -0.049 && newVal <= 100.049) { devSliderControlsState[key].value = parseFloat(Math.max(0, Math.min(100, newVal)).toFixed(1)); break; } } } } if (!devSliderControlsState.P.locked && (devSliderControlsState.C.locked || devSliderControlsState.M.locked)) { devSliderControlsState.P.value = parseFloat(Math.max(0, Math.min(100, 100.0 - devSliderControlsState.C.value - devSliderControlsState.M.value)).toFixed(1)); } else if (!devSliderControlsState.M.locked && (devSliderControlsState.C.locked || devSliderControlsState.P.locked)) { devSliderControlsState.M.value = parseFloat(Math.max(0, Math.min(100, 100.0 - devSliderControlsState.C.value - devSliderControlsState.P.value)).toFixed(1)); } else if (!devSliderControlsState.C.locked && (devSliderControlsState.M.locked || devSliderControlsState.P.locked)) { devSliderControlsState.C.value = parseFloat(Math.max(0, Math.min(100, 100.0 - devSliderControlsState.M.value - devSliderControlsState.P.value)).toFixed(1)); } updateAllDisplaysFromInternalState(); triggerResultsUpdate(); }
    function triggerResultsUpdate() { clearTimeout(debounceTimer); debounceTimer = setTimeout(updateResultsFromDevControls, 100); }
    function setupDevControls() { devControlsContainer.innerHTML = `<h3>Developer Controls (Normalized Scores %)</h3><div><label for="devC" id="labelC" title="Double-click to lock/unlock">Centralism (C):</label><input type="range" id="devC" min="0" max="100" value="33.3" step="0.1"><span id="devCValue">33.3%</span><span id="lockStatusC" class="lock-status"></span></div><div><label for="devM" id="labelM" title="Double-click to lock/unlock">Communalism (M):</label><input type="range" id="devM" min="0" max="100" value="33.3" step="0.1"><span id="devMValue">33.3%</span><span id="lockStatusM" class="lock-status"></span></div><div><label for="devP" id="labelP" title="Double-click to lock/unlock">Privatism (P):</label><input type="range" id="devP" min="0" max="100" value="33.4" step="0.1"><span id="devPValue">33.4%</span><span id="lockStatusP" class="lock-status"></span></div><p style="font-size:0.8em; color: #555;">Double-click a label to lock/unlock its slider. Sliders will auto-balance.</p>`; const style = document.createElement('style'); style.textContent = `.lock-status { margin-left: 5px; font-size: 0.8em; color: #d9534f; font-style: italic; } label.locked-label { font-weight: bold; color: #d9534f !important; cursor: pointer; } label:not(.locked-label) { cursor: pointer; } input[type="range"]:disabled { opacity: 0.6; }`; document.head.appendChild(style); if (resultsArea && rawScoresElement && resultsArea.contains(rawScoresElement)) { resultsArea.insertBefore(devControlsContainer, rawScoresElement); } else if (resultsArea) { resultsArea.appendChild(devControlsContainer); } else { console.error("Cannot setup dev controls: resultsArea not found."); return; } devSliderControlsState = { C: { input: document.getElementById('devC'), span: document.getElementById('devCValue'), label: document.getElementById('labelC'), lockStatusSpan: document.getElementById('lockStatusC'), locked: false, value: 33.3 }, M: { input: document.getElementById('devM'), span: document.getElementById('devMValue'), label: document.getElementById('labelM'), lockStatusSpan: document.getElementById('lockStatusM'), locked: false, value: 33.3 }, P: { input: document.getElementById('devP'), span: document.getElementById('devPValue'), label: document.getElementById('labelP'), lockStatusSpan: document.getElementById('lockStatusP'), locked: false, value: 33.4 } }; updateAllDisplaysFromInternalState(); for (const key in devSliderControlsState) { const s = devSliderControlsState[key]; s.input.addEventListener('input', (event) => { if (s.locked) { event.target.value = s.value.toFixed(1); return; } reBalanceSliders(key); }); s.label.addEventListener('dblclick', () => { s.locked = !s.locked; s.input.disabled = s.locked; if (s.locked) { s.value = parseFloat(s.input.value); } reBalanceSliders(); }); } reBalanceSliders(); }

    function getIdeologyLabelAndSarcasm(normC_user, normM_user, normP_user) {
        let bestMatch = { specific: "Mixed / Eclectic Political Outlook", broadCategory: "Mixed / Eclectic Political Outlook", summary: "", distanceToClosest: MAX_POSSIBLE_DISTANCE_IN_TERNARY_SPACE, proximityPrimary: 0, secondClosestSpecific: null, distanceToSecondClosest: MAX_POSSIBLE_DISTANCE_IN_TERNARY_SPACE, proximitySecondary: 0 };
        if (typeof ideologyIdealPoints === 'undefined' || Object.keys(ideologyIdealPoints).length === 0) { console.error("ideology_ideal_points.js not loaded or empty for getIdeologyLabelAndSarcasm!"); bestMatch.summary = ideologySummaries[bestMatch.specific] || "Error: Ideal points data missing."; return bestMatch; }
        if (typeof ideologySummaries === 'undefined') { console.error("ideology_summaries.js not loaded for getIdeologyLabelAndSarcasm!"); bestMatch.summary = "Error: Summaries data missing."; return bestMatch; }
        let C_user = parseFloat(normC_user); let M_user = parseFloat(normM_user); let P_user = parseFloat(normP_user);
        let sumUser = C_user + M_user + P_user;
        if (Math.abs(sumUser - 100.0) > 0.01) { if (sumUser === 0) { C_user = 33.33; M_user = 33.33; P_user = 33.34; } else { const scale = 100.0 / sumUser; C_user = parseFloat((C_user * scale).toFixed(2)); M_user = parseFloat((M_user * scale).toFixed(2)); } P_user = parseFloat((100.0 - C_user - M_user).toFixed(2)); }
        C_user = Math.max(0, Math.min(100, C_user)); M_user = Math.max(0, Math.min(100, M_user)); P_user = Math.max(0, Math.min(100, P_user)); P_user = parseFloat((100.0 - C_user - M_user).toFixed(2));
        let distances = [];
        for (const ideologyName in ideologyIdealPoints) {
            const ideal = ideologyIdealPoints[ideologyName];
            if (typeof ideal.c !== 'number' || typeof ideal.m !== 'number' || typeof ideal.p !== 'number' || typeof ideal.broad !== 'string') { console.warn(`Skipping invalid ideal point structure for: ${ideologyName}`); continue; }
            const distance = Math.sqrt(Math.pow(C_user - ideal.c, 2) + Math.pow(M_user - ideal.m, 2) + Math.pow(P_user - ideal.p, 2));
            distances.push({ name: ideologyName, distance: distance, broad: ideal.broad });
        }
        if (distances.length === 0) { console.error("No valid ideal points found for distance calculation."); bestMatch.summary = ideologySummaries[bestMatch.specific] || "Error: No ideal points."; return bestMatch; }
        distances.sort((a, b) => a.distance - b.distance);
        bestMatch.specific = distances[0].name; bestMatch.broadCategory = distances[0].broad; bestMatch.distanceToClosest = distances[0].distance;
        bestMatch.proximityPrimary = Math.max(0, parseFloat(((1 - (bestMatch.distanceToClosest / MAX_POSSIBLE_DISTANCE_IN_TERNARY_SPACE)) * 100).toFixed(1)));
        let foundSecond = false;
        for (let i = 1; i < distances.length; i++) { if (distances[i].name !== bestMatch.specific) { bestMatch.secondClosestSpecific = distances[i].name; bestMatch.distanceToSecondClosest = distances[i].distance; bestMatch.proximitySecondary = Math.max(0, parseFloat(((1 - (bestMatch.distanceToSecondClosest / MAX_POSSIBLE_DISTANCE_IN_TERNARY_SPACE)) * 100).toFixed(1))); foundSecond = true; break; } }
        if (!foundSecond) { bestMatch.secondClosestSpecific = null; bestMatch.distanceToSecondClosest = MAX_POSSIBLE_DISTANCE_IN_TERNARY_SPACE; bestMatch.proximitySecondary = 0; }
        if (ideologySummaries[bestMatch.specific]) { bestMatch.summary = ideologySummaries[bestMatch.specific]; }
        else if (ideologySummaries[bestMatch.broadCategory]) { bestMatch.summary = ideologySummaries[bestMatch.broadCategory]; if (bestMatch.specific !== bestMatch.broadCategory && bestMatch.specific !== "Mixed / Eclectic Political Outlook") { bestMatch.summary += ` (Specific leaning towards ${bestMatch.specific}.)`; } }
        else { const ultimateFallbackSpecific = "Mixed / Eclectic Political Outlook"; bestMatch.specific = ultimateFallbackSpecific; bestMatch.broadCategory = ultimateFallbackSpecific; bestMatch.summary = ideologySummaries[ultimateFallbackSpecific] || "Your political profile is a unique enigma! (Summary data incomplete)"; if (!ideologySummaries[ultimateFallbackSpecific]) console.error("Critical Error: Summary for 'Mixed / Eclectic Political Outlook' is missing!"); }
        if (bestMatch.secondClosestSpecific === bestMatch.specific || bestMatch.secondClosestSpecific === "Mixed / Eclectic Political Outlook") { bestMatch.secondClosestSpecific = null; bestMatch.distanceToSecondClosest = MAX_POSSIBLE_DISTANCE_IN_TERNARY_SPACE; bestMatch.proximitySecondary = 0; }
        return bestMatch;
    }

    function calculateAndDisplayExtremityScore(currentNormalizedScores, currentRawUserScores) {
        if (!minMaxRawScores || !minMaxRawScores.c || typeof minMaxRawScores.c.min === 'undefined') { console.error("minMaxRawScores not fully available for extremity calculation."); if (extremityScoreDisplayElement) extremityScoreDisplayElement.innerHTML = `<b>Overall Profile Extremity:</b> Data N/A`; return; }
        const mid_C = (minMaxRawScores.c.max + minMaxRawScores.c.min) / 2; const mid_M = (minMaxRawScores.m.max + minMaxRawScores.m.min) / 2; const mid_P = (minMaxRawScores.p.max + minMaxRawScores.p.min) / 2;
        const dev_C = Math.abs(currentRawUserScores.c - mid_C); const dev_M = Math.abs(currentRawUserScores.m - mid_M); const dev_P = Math.abs(currentRawUserScores.p - mid_P);
        const rawExtremityScore = dev_C + dev_M + dev_P;
        const max_dev_C = (minMaxRawScores.c.max - minMaxRawScores.c.min) / 2; const max_dev_M = (minMaxRawScores.m.max - minMaxRawScores.m.min) / 2; const max_dev_P = (minMaxRawScores.p.max - minMaxRawScores.p.min) / 2;
        const theoreticalMaxRawExtremity = max_dev_C + max_dev_M + max_dev_P;
        let extremityPercentage = 0;
        if (theoreticalMaxRawExtremity > 0) { extremityPercentage = Math.min(100, (rawExtremityScore / theoreticalMaxRawExtremity) * 100); }
        extremityPercentage = Math.max(0, parseFloat(extremityPercentage.toFixed(1)));
        if (extremityScoreDisplayElement) { extremityScoreDisplayElement.style.display = 'block'; extremityScoreDisplayElement.innerHTML = `<b>Overall Profile Extremity:</b> ${extremityPercentage}%`; if (isDevMode) { extremityScoreDisplayElement.innerHTML += ` <span style="font-size:0.8em; color:#777;">(Approximated for Dev Mode)</span>`; } }
    }

    function showResults() {
        if(quizArea) quizArea.style.display = 'none'; if(resultsArea) resultsArea.style.display = 'block'; if(progressIndicator) progressIndicator.style.display = 'none'; if(restartButton && !isDevMode) restartButton.style.display = 'block'; if(backButton) backButton.style.display = 'none';
        const finalNormalizedScores = normalizeScores(userScores, minMaxRawScores);
        if(rawScoresElement) rawScoresElement.innerHTML = `Raw Scores (End of Quiz):<br>C: ${userScores.c.toFixed(2)}, M: ${userScores.m.toFixed(2)}, P: ${userScores.p.toFixed(2)}`;
        if(normalizedScoresElement) normalizedScoresElement.innerHTML = `Normalized Scores (Final):<br>C: ${finalNormalizedScores.c.toFixed(2)}%, M: ${finalNormalizedScores.m.toFixed(2)}%, P: ${finalNormalizedScores.p.toFixed(2)}%`;
        if (typeof minMaxRawScores.c.min !== 'undefined') { calculateAndDisplayExtremityScore(finalNormalizedScores, userScores); }
        const ideologyInfo = getIdeologyLabelAndSarcasm(finalNormalizedScores.c, finalNormalizedScores.m, finalNormalizedScores.p);
        displayIdeologyInfo(ideologyInfo); let plotTitle = determinePlotTitle(ideologyInfo);
        if (typeof Plotly !== 'undefined') { drawPlot(finalNormalizedScores, plotTitle); }
        else { console.error("Plotly undefined in showResults. Plot not drawn."); if(plotDiv) plotDiv.innerHTML = "<p style='color:orange; text-align:center;'>Plot could not be displayed (Plotly library issue).</p>"; }
        applyTheme(document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    }

    function updateResultsFromDevControls() {
        let cVal = parseFloat(devSliderControlsState.C.value); let mVal = parseFloat(devSliderControlsState.M.value); let pVal = parseFloat(devSliderControlsState.P.value);
        let tempSum = cVal + mVal;
        if (tempSum > 100.0) { if (tempSum > 0) { cVal = (cVal / tempSum) * 100.0; mVal = 100.0 - cVal; } else { cVal = 33.33; mVal = 33.33; } pVal = 0.0; } else { pVal = 100.0 - cVal - mVal; }
        cVal = parseFloat(Math.max(0, Math.min(100, cVal)).toFixed(2)); mVal = parseFloat(Math.max(0, Math.min(100, mVal)).toFixed(2)); pVal = parseFloat(Math.max(0, Math.min(100, pVal)).toFixed(2));
        pVal = parseFloat((100.0 - cVal - mVal).toFixed(2)); pVal = Math.max(0, pVal);
        const normalizedScoresToUse = { c: cVal, m: mVal, p: pVal };
        if (devSliderControlsState.C.input && ( Math.abs(parseFloat(devSliderControlsState.C.input.value) - normalizedScoresToUse.c) > 0.05 || Math.abs(parseFloat(devSliderControlsState.M.input.value) - normalizedScoresToUse.m) > 0.05 || Math.abs(parseFloat(devSliderControlsState.P.input.value) - normalizedScoresToUse.p) > 0.05 )) {
            devSliderControlsState.C.input.value = normalizedScoresToUse.c.toFixed(1); devSliderControlsState.M.input.value = normalizedScoresToUse.m.toFixed(1); devSliderControlsState.P.input.value = normalizedScoresToUse.p.toFixed(1);
            devSliderControlsState.C.value = parseFloat(normalizedScoresToUse.c.toFixed(1)); devSliderControlsState.M.value = parseFloat(normalizedScoresToUse.m.toFixed(1)); devSliderControlsState.P.value = parseFloat(normalizedScoresToUse.p.toFixed(1));
            if (devSliderControlsState.C.span) devSliderControlsState.C.span.textContent = `${devSliderControlsState.C.value}%`; if (devSliderControlsState.M.span) devSliderControlsState.M.span.textContent = `${devSliderControlsState.M.value}%`; if (devSliderControlsState.P.span) devSliderControlsState.P.span.textContent = `${devSliderControlsState.P.value}%`;
        }
        const mid_C = (minMaxRawScores.c.max + minMaxRawScores.c.min) / 2; const mid_M = (minMaxRawScores.m.max + minMaxRawScores.m.min) / 2; const mid_P = (minMaxRawScores.p.max + minMaxRawScores.p.min) / 2;
        const range_C = (minMaxRawScores.c.max - minMaxRawScores.c.min); const range_M = (minMaxRawScores.m.max - minMaxRawScores.m.min); const range_P = (minMaxRawScores.p.max - minMaxRawScores.p.min);
        const mockedRawScoresForExtremity = { c: mid_C + ((normalizedScoresToUse.c - 50) / 50) * (range_C / 2 || 1), m: mid_M + ((normalizedScoresToUse.m - 50) / 50) * (range_M / 2 || 1), p: mid_P + ((normalizedScoresToUse.p - 50) / 50) * (range_P / 2 || 1) };
        mockedRawScoresForExtremity.c = Math.max(minMaxRawScores.c.min, Math.min(minMaxRawScores.c.max, mockedRawScoresForExtremity.c)); mockedRawScoresForExtremity.m = Math.max(minMaxRawScores.m.min, Math.min(minMaxRawScores.m.max, mockedRawScoresForExtremity.m)); mockedRawScoresForExtremity.p = Math.max(minMaxRawScores.p.min, Math.min(minMaxRawScores.p.max, mockedRawScoresForExtremity.p));
        if (rawScoresElement) rawScoresElement.innerHTML = `Raw Scores (Mocked for Dev Mode):<br>C: ${mockedRawScoresForExtremity.c.toFixed(2)}, M: ${mockedRawScoresForExtremity.m.toFixed(2)}, P: ${mockedRawScoresForExtremity.p.toFixed(2)}`;
        if (normalizedScoresElement) normalizedScoresElement.innerHTML = `Normalized Scores (from sliders):<br>C: ${normalizedScoresToUse.c.toFixed(2)}%, M: ${normalizedScoresToUse.m.toFixed(2)}%, P: ${normalizedScoresToUse.p.toFixed(2)}%`;
        if (typeof minMaxRawScores.c.min !== 'undefined') calculateAndDisplayExtremityScore(normalizedScoresToUse, mockedRawScoresForExtremity);
        const ideologyInfo = getIdeologyLabelAndSarcasm(normalizedScoresToUse.c, normalizedScoresToUse.m, normalizedScoresToUse.p);
        displayIdeologyInfo(ideologyInfo); let plotTitle = determinePlotTitle(ideologyInfo);
        if (typeof Plotly !== 'undefined') { drawPlot(normalizedScoresToUse, plotTitle); }
        else { console.error("Plotly undefined in updateDevControls"); if(plotDiv) plotDiv.innerHTML = "<p style='color:orange; text-align:center;'>Plot could not be displayed (Plotly library issue).</p>";}
        applyTheme(document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    }

    function displayIdeologyInfo(ideologyInfo) {
        if (!ideologyInfo || !ideologyInfo.specific) {
            console.error("displayIdeologyInfo received invalid ideologyInfo:", ideologyInfo);
            if(ideologyLabelElement) ideologyLabelElement.innerHTML = "<b>Political Profile:</b> Error determining ideology."; if(ideologySummaryElement) ideologySummaryElement.textContent = "Please try the quiz again or check console for errors."; if(primaryIdeologyProximityElement) primaryIdeologyProximityElement.style.display = 'none'; if(secondaryMatchArea) secondaryMatchArea.style.display = 'none'; return;
        }
        if (ideologyLabelElement) {
            let labelHTML = "Political Profile:<br>"; const ultimateFallback = "Mixed / Eclectic Political Outlook";
            if (ideologyInfo.specific && ideologyInfo.specific !== ultimateFallback) { labelHTML += `<b>Specific Ideology:</b> ${ideologyInfo.specific}`; if (ideologyInfo.broadCategory && ideologyInfo.broadCategory !== "" && ideologyInfo.broadCategory !== ideologyInfo.specific && ideologyInfo.broadCategory !== ultimateFallback) { labelHTML += `<br><b>Broad Category:</b> ${ideologyInfo.broadCategory}`; } }
            else { labelHTML += `<b>Category:</b> ${ultimateFallback}`; } ideologyLabelElement.innerHTML = labelHTML;
        }
        if (primaryIdeologyProximityElement) { primaryIdeologyProximityElement.innerHTML = `<b>Match Strength:</b> ${ideologyInfo.proximityPrimary.toFixed(1)}%`; if (isDevMode) primaryIdeologyProximityElement.innerHTML += ` <span style="font-size:0.8em; color:${document.body.classList.contains('dark-mode') ? '#aaa' : '#777'};">(Dist: ${ideologyInfo.distanceToClosest.toFixed(2)})</span>`; primaryIdeologyProximityElement.style.display = 'block';
        } else { console.warn("Element #primary-ideology-proximity-result not found. Primary proximity not displayed."); }
        if (ideologySummaryElement) { ideologySummaryElement.textContent = ideologyInfo.summary || "No summary available for this profile."; }
        const MIN_DIST_DIFFERENCE = 0.01;
        if (secondaryMatchArea && ideologyInfo.secondClosestSpecific && ideologyInfo.secondClosestSpecific !== "Mixed / Eclectic Political Outlook" && ideologyInfo.secondClosestSpecific !== ideologyInfo.specific && ideologyInfo.distanceToSecondClosest > (ideologyInfo.distanceToClosest + MIN_DIST_DIFFERENCE)) {
            if (secondaryIdeologyLabelElement) secondaryIdeologyLabelElement.textContent = ideologyInfo.secondClosestSpecific;
            if (secondaryIdeologyProximityElement) { secondaryIdeologyProximityElement.innerHTML = `<b>Match Strength:</b> ${ideologyInfo.proximitySecondary.toFixed(1)}%`; if (isDevMode) secondaryIdeologyProximityElement.innerHTML += ` <span style="font-size:0.8em; color:${document.body.classList.contains('dark-mode') ? '#aaa' : '#777'};">(Dist: ${ideologyInfo.distanceToSecondClosest.toFixed(2)})</span>`; }
            if (secondaryIdeologySummaryElement) { secondaryIdeologySummaryElement.textContent = ideologySummaries[ideologyInfo.secondClosestSpecific] || "No summary available."; }
            secondaryMatchArea.style.display = 'block';
        } else { if (secondaryMatchArea) secondaryMatchArea.style.display = 'none'; }
    }

    function determinePlotTitle(ideologyInfo) {
        let plotTitle = ideologyInfo.specific || "Your Political Profile"; const genericKeywords = ["(General)", "Tendencies", "Eclectic", "Outlook", "(Undifferentiated)", "Uncategorized"]; const ultimateFallback = "Mixed / Eclectic Political Outlook";
        const isSpecificGeneric = !ideologyInfo.specific || plotTitle === ultimateFallback || plotTitle === "Undetermined" || plotTitle === ideologyInfo.broadCategory || genericKeywords.some(keyword => plotTitle.includes(keyword));
        if (isSpecificGeneric) { if (ideologyInfo.broadCategory && ideologyInfo.broadCategory !== ultimateFallback && ideologyInfo.broadCategory !== "Undetermined" && ideologyInfo.broadCategory !== "Unclassifiable" && !genericKeywords.some(keyword => ideologyInfo.broadCategory.includes(keyword))) { plotTitle = ideologyInfo.broadCategory; } else { plotTitle = isDevMode ? "Political Profile Explorer" : "Your Political Profile"; } }
        if (!plotTitle || plotTitle.trim() === "") { plotTitle = isDevMode ? "Political Profile Explorer" : "Your Political Profile"; } return plotTitle;
    }

    function drawPlot(normalized, ideologyLabel = "Your Position") {
        const plotDivRef = document.getElementById('plot-div');
        if (!plotDivRef || typeof Plotly === 'undefined') { if (plotDivRef) plotDivRef.innerHTML = "<p style='color:red; text-align:center;'>Error: Plotting library not loaded or plot area missing.</p>"; else console.error("Plot div not found and Plotly undefined/not loaded."); return; }
        let plotC = !isNaN(normalized.c) ? parseFloat(normalized.c.toFixed(2)) : 33.33; let plotM = !isNaN(normalized.m) ? parseFloat(normalized.m.toFixed(2)) : 33.33; let plotP = parseFloat((100.0 - plotC - plotM).toFixed(2));
        plotC = Math.max(0, Math.min(100, plotC)); plotM = Math.max(0, Math.min(100, plotM)); plotP = Math.max(0, Math.min(100, plotP));
        let sumTotal = plotC + plotM + plotP; const plotEpsilon = 0.03;
        if (Math.abs(sumTotal - 100.0) > plotEpsilon) { if (sumTotal === 0) { plotC = 33.33; plotM = 33.33; plotP = 33.34; } else { const scale = 100.0 / sumTotal; plotC = parseFloat((plotC * scale).toFixed(2)); plotM = parseFloat((plotM * scale).toFixed(2)); } plotP = parseFloat((100.0 - plotC - plotM).toFixed(2)); }
        plotC = parseFloat(Math.max(0, Math.min(100, plotC)).toFixed(2)); plotM = parseFloat(Math.max(0, Math.min(100, plotM)).toFixed(2)); plotP = parseFloat(Math.max(0, Math.min(100, 100.0 - plotC - plotM)).toFixed(2));
        const isDarkMode = document.body.classList.contains('dark-mode');
        const safeGetCssVar = (varName, fallback) => { try { const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); return val || fallback; } catch (e) { return fallback; }};
        const currentBgColor = isDarkMode ? safeGetCssVar('--container-bg', '#2a2a2a') : '#fff'; const currentTextColor = isDarkMode ? safeGetCssVar('--text-color', '#e2e2e2') : '#333'; const plotTernaryBgColor = isDarkMode ? safeGetCssVar('--option-bg', '#333333') : '#f0f0f0'; const currentGridColor = isDarkMode ? safeGetCssVar('--dev-controls-border', '#555555') : safeGetCssVar('--option-border','#cccccc');
        const plotData = [{ type: 'scatterternary', mode: 'markers', a: [plotC], b: [plotM], c: [plotP], name: 'Your Position', text: [`C: ${plotC.toFixed(1)}%<br>M: ${plotM.toFixed(1)}%<br>P: ${plotP.toFixed(1)}%`], hoverinfo: 'text', marker: { symbol: 'circle', color: '#FF4136', size: 14, line: { width: 1, color: isDarkMode ? '#FFA500' : '#8B0000' } } }];
        const layout = { title: { text: `Political Profile: <b>${ideologyLabel}</b>`, font: { color: currentTextColor, size: 16 } }, ternary: { sum: 100, aaxis: { title: '<b>Centralism (C)</b>', min: 0, linewidth: 2, ticks: 'outside', tickfont: { color: currentTextColor, size:10 }, titlefont: { color: currentTextColor, size:12 },linecolor: currentTextColor, gridcolor: currentGridColor }, baxis: { title: '<b>Communalism (M)</b>', min: 0, linewidth: 2, ticks: 'outside', tickfont: { color: currentTextColor, size:10 }, titlefont: { color: currentTextColor, size:12 }, linecolor: currentTextColor, gridcolor: currentGridColor }, caxis: { title: '<b>Privatism (P)</b>', min: 0, linewidth: 2, ticks: 'outside', tickfont: { color: currentTextColor, size:10 }, titlefont: { color: currentTextColor, size:12 }, linecolor: currentTextColor, gridcolor: currentGridColor }, bgcolor: plotTernaryBgColor }, annotations: [{ showarrow: false, text: '*Not remotely scientific. Mostly for amusement.', x: 0.5, y: -0.15, xref: 'paper', yref: 'paper', font: { size: 10, color: isDarkMode ? '#aaa' : '#666' } }], paper_bgcolor: currentBgColor, plot_bgcolor: currentBgColor, margin: { l: 70, r: 50, b: 100, t: 80, pad: 4 } };
        try { Plotly.newPlot('plot-div', plotData, layout, {responsive: true}); }
        catch (e) { console.error("Error during Plotly.newPlot:", e); if (plotDivRef) plotDivRef.innerHTML = "<p style='color:red; text-align:center;'>Error rendering plot. Check console for details.</p>"; }
    }

    if (restartButton) {
        restartButton.addEventListener('click', () => {
            if (isDevMode) { devSliderControlsState.C.value = 33.3; devSliderControlsState.C.locked = false; devSliderControlsState.M.value = 33.3; devSliderControlsState.M.locked = false; devSliderControlsState.P.value = 33.4; devSliderControlsState.P.locked = false; updateAllDisplaysFromInternalState(); reBalanceSliders(); }
            else { initializeQuizState(); loadQuestion(); }
        });
    }

    if (copyResultsButton) {
        copyResultsButton.addEventListener('click', () => {
            let resultsText = "My Sarcastic Political Test Results:\n";
            const normScores = isDevMode ? {c: parseFloat(devSliderControlsState.C.value), m: parseFloat(devSliderControlsState.M.value), p: parseFloat(devSliderControlsState.P.value) } : normalizeScores(userScores, minMaxRawScores);
            resultsText += `Normalized Scores: C: ${normScores.c.toFixed(1)}%, M: ${normScores.m.toFixed(1)}%, P: ${normScores.p.toFixed(1)}%\n`;
            if (extremityScoreDisplayElement && extremityScoreDisplayElement.textContent.includes('%')) { resultsText += `${extremityScoreDisplayElement.textContent}\n`; }
            const ideologyInfo = getIdeologyLabelAndSarcasm(normScores.c, normScores.m, normScores.p);
            resultsText += `Primary Ideology: ${ideologyInfo.specific} (Match Strength: ${ideologyInfo.proximityPrimary.toFixed(1)}%)\n`;
            if (ideologyInfo.broadCategory && ideologyInfo.broadCategory !== ideologyInfo.specific && ideologyInfo.broadCategory !== "Mixed / Eclectic Political Outlook") { resultsText += `Broad Category: ${ideologyInfo.broadCategory}\n`; }
            const MIN_DIST_DIFF_FOR_COPY = 0.01;
            if (ideologyInfo.secondClosestSpecific && ideologyInfo.secondClosestSpecific !== "Mixed / Eclectic Political Outlook" && ideologyInfo.secondClosestSpecific !== ideologyInfo.specific && ideologyInfo.distanceToSecondClosest > (ideologyInfo.distanceToClosest + MIN_DIST_DIFF_FOR_COPY)) { resultsText += `Secondary Leaning: ${ideologyInfo.secondClosestSpecific} (Match Strength: ${ideologyInfo.proximitySecondary.toFixed(1)}%)\n`; }
            resultsText += `\nTake the test: ${window.location.href.split('?')[0]}`;
            navigator.clipboard.writeText(resultsText).then(() => { if (copyStatusElement) copyStatusElement.textContent = "Results copied to clipboard!"; setTimeout(() => { if (copyStatusElement) copyStatusElement.textContent = ""; }, 3000);
            }).catch(err => { console.error('Failed to copy results: ', err); if (copyStatusElement) copyStatusElement.textContent = "Failed to copy. See console."; });
        });
    }

    // --- INITIALIZATION ---
    if (isDevMode) {
        const mainHeading = document.querySelector('.container h1');
        if (mainHeading && !mainHeading.textContent.includes("(Dev Mode)")) mainHeading.textContent += " (Dev Mode)";
        if(quizArea) quizArea.style.display = 'none'; if(resultsArea) resultsArea.style.display = 'block';
        const introP = document.querySelector('p.intro'); if (introP) introP.style.display = 'none';
        const outroP = document.querySelector('p.outro'); if(outroP) outroP.style.display = 'none';
        if(progressIndicator) progressIndicator.style.display = 'none'; if(restartButton) restartButton.style.display = 'block'; // Always show restart in dev
        setupDevControls(); updateResultsFromDevControls();
    } else { 
        initializeQuizState(); 
        loadQuestion(); 
    }
}); // End of DOMContentLoaded