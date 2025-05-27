// script.js (Full Implementation - Color-Coded User Plot Point)

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
    const ideologySummaryElement = document.getElementById('ideology-summary-result');
    const plotDiv = document.getElementById('plot-div');

    // Quiz State Variables
    let userScores = { c: 0, m: 0, p: 0 };
    let minMaxRawScores = {
        c: { min: 0, max: 0 },
        m: { min: 0, max: 0 },
        p: { min: 0, max: 0 }
    };

    let currentQuestionIndex = 0;
    let questionOrder = [];
    let answerHistory = [];
    let debounceTimer;
    let devSliderControlsState = {};

    // --- COLOR MAP FOR BROAD CATEGORIES ---
    const broadCategoryColors = {
        "Statism": "rgba(220, 53, 69, 0.85)", // Red
        "Libertarian Socialism / Social Anarchism": "rgba(40, 167, 69, 0.85)", // Green
        "Propertarianism / Individualist Libertarianism": "rgba(0, 123, 255, 0.85)", // Blue
        "Authoritarian Socialism / State Collectivism": "rgba(108, 58, 183, 0.85)", // Purple
        "Individualist Anarchism": "rgba(255, 193, 7, 0.85)", // Yellow/Orange
        "Classical Liberalism / Constitutionalism": "rgba(102, 69, 40, 0.85)", // Brown
        "Democratic Socialism": "rgba(232, 62, 140, 0.85)", // Pink (Bootstrap Pink)
        "Centrism / Mixed Economy Ideologies": "rgba(108, 117, 125, 0.85)", // Grey
        "Mixed / Eclectic Political Outlook": "rgba(170, 170, 170, 0.85)",  // Lighter Grey
        // !!! ENSURE ALL BROAD CATEGORIES FROM ideology_ideal_points.js ARE LISTED HERE !!!
    };


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
        if (theme === 'dark') {
            if (!isCurrentlyDark) { document.body.classList.add('dark-mode'); themeChanged = true; }
            if (themeSwitch) themeSwitch.checked = true;
        } else {
            if (isCurrentlyDark) { document.body.classList.remove('dark-mode'); themeChanged = true; }
            if (themeSwitch) themeSwitch.checked = false;
        }
        const extremityElement = document.getElementById('extremity-score-display');
        if (extremityElement) {
            const isDarkNow = document.body.classList.contains('dark-mode');
            extremityElement.style.backgroundColor = isDarkNow ? 'var(--score-box-bg, #2c2c3a)' : '#eef';
            extremityElement.style.borderLeftColor = isDarkNow ? 'var(--score-box-border, #555577)' : '#77a';
            extremityElement.style.color = isDarkNow ? 'var(--text-color, #e2e2e2)' : '#333';
        }
        const primaryProxElement = document.getElementById('primary-ideology-proximity-result');
         if(primaryProxElement) primaryProxElement.style.color = document.body.classList.contains('dark-mode') ? 'var(--secondary-text-color)' : '#555';
        const secondaryProxElement = document.getElementById('secondary-ideology-proximity-result');
         if(secondaryProxElement) secondaryProxElement.style.color = document.body.classList.contains('dark-mode') ? 'var(--secondary-text-color)' : '#555';

        if (themeChanged && resultsArea && resultsArea.style.display === 'block' && typeof Plotly !== 'undefined') {
            let currentNormalizedScoresToPlot; let currentIdeologyInfoObjectForPlot; let currentRawScoresForExtremityUpdate; // Changed to object
            if (isDevMode && Object.keys(devSliderControlsState).length > 0 && devSliderControlsState.C && devSliderControlsState.C.input) {
                currentNormalizedScoresToPlot = { c: parseFloat(devSliderControlsState.C.value.toFixed(2)), m: parseFloat(devSliderControlsState.M.value.toFixed(2)), p: 0 };
                currentNormalizedScoresToPlot.p = parseFloat((100.0 - currentNormalizedScoresToPlot.c - currentNormalizedScoresToPlot.m).toFixed(2));
                currentNormalizedScoresToPlot.p = Math.max(0, Math.min(100, currentNormalizedScoresToPlot.p));
                let tempSumForPlot = currentNormalizedScoresToPlot.c + currentNormalizedScoresToPlot.m + currentNormalizedScoresToPlot.p;
                if (Math.abs(tempSumForPlot - 100.0) > 0.05) { if (tempSumForPlot === 0) {currentNormalizedScoresToPlot = {c:33.33,m:33.33,p:33.34};} else { let scale = 100.0 / tempSumForPlot; currentNormalizedScoresToPlot.c = parseFloat((currentNormalizedScoresToPlot.c * scale).toFixed(2)); currentNormalizedScoresToPlot.m = parseFloat((currentNormalizedScoresToPlot.m * scale).toFixed(2)); currentNormalizedScoresToPlot.p = parseFloat((100.0 - currentNormalizedScoresToPlot.c - currentNormalizedScoresToPlot.m).toFixed(2));}}
                const mid_C_dev = (minMaxRawScores.c.max + minMaxRawScores.c.min) / 2; const mid_M_dev = (minMaxRawScores.m.max + minMaxRawScores.m.min) / 2; const mid_P_dev = (minMaxRawScores.p.max + minMaxRawScores.p.min) / 2;
                const range_C_dev = (minMaxRawScores.c.max - minMaxRawScores.c.min); const range_M_dev = (minMaxRawScores.m.max - minMaxRawScores.m.min); const range_P_dev = (minMaxRawScores.p.max - minMaxRawScores.p.min);
                currentRawScoresForExtremityUpdate = { c: mid_C_dev + ((currentNormalizedScoresToPlot.c - 50) / 50) * (range_C_dev / 2 || 1), m: mid_M_dev + ((currentNormalizedScoresToPlot.m - 50) / 50) * (range_M_dev / 2 || 1), p: mid_P_dev + ((currentNormalizedScoresToPlot.p - 50) / 50) * (range_P_dev / 2 || 1)};
                currentRawScoresForExtremityUpdate.c = Math.max(minMaxRawScores.c.min, Math.min(minMaxRawScores.c.max, currentRawScoresForExtremityUpdate.c)); currentRawScoresForExtremityUpdate.m = Math.max(minMaxRawScores.m.min, Math.min(minMaxRawScores.m.max, currentRawScoresForExtremityUpdate.m)); currentRawScoresForExtremityUpdate.p = Math.max(minMaxRawScores.p.min, Math.min(minMaxRawScores.p.max, currentRawScoresForExtremityUpdate.p));
                currentIdeologyInfoObjectForPlot = getIdeologyLabelAndSarcasm(currentNormalizedScoresToPlot.c, currentNormalizedScoresToPlot.m, currentNormalizedScoresToPlot.p); // Returns {primary, secondary}
            } else if (!isDevMode && (userScores.c !== 0 || userScores.m !== 0 || userScores.p !== 0)) {
                currentNormalizedScoresToPlot = normalizeScores(userScores, minMaxRawScores); currentRawScoresForExtremityUpdate = userScores;
                currentIdeologyInfoObjectForPlot = getIdeologyLabelAndSarcasm(currentNormalizedScoresToPlot.c, currentNormalizedScoresToPlot.m, currentNormalizedScoresToPlot.p); // Returns {primary, secondary}
            }
            if (currentNormalizedScoresToPlot && currentIdeologyInfoObjectForPlot && currentIdeologyInfoObjectForPlot.primary) {
                let plotTitle = determinePlotTitle(currentIdeologyInfoObjectForPlot.primary);
                drawPlot(currentNormalizedScoresToPlot, plotTitle, currentIdeologyInfoObjectForPlot.primary.broadCategory); // Pass broad category for color
                if (currentRawScoresForExtremityUpdate && Object.keys(minMaxRawScores.c).length > 0) { calculateAndDisplayExtremityScore(currentNormalizedScoresToPlot, currentRawScoresForExtremityUpdate);}
            }
        }
        if (ideologySummaryElement) { const isDarkNow = document.body.classList.contains('dark-mode'); const safeGetCssVar = (varName, fallback) => { try { const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); return val || fallback; } catch (e) { return fallback; }}; ideologySummaryElement.style.backgroundColor = isDarkNow ? safeGetCssVar('--option-bg', '#333333') : '#f9f9f9'; ideologySummaryElement.style.borderColor = isDarkNow ? safeGetCssVar('--option-border', '#444444') : '#ccc';}
        const secondarySummaryEl = document.getElementById('secondary-ideology-summary-result');
        if (secondarySummaryEl) { const isDarkNow = document.body.classList.contains('dark-mode'); const safeGetCssVar = (varName, fallback) => { try { const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); return val || fallback; } catch (e) { return fallback; }}; secondarySummaryEl.style.backgroundColor = isDarkNow ? safeGetCssVar('--option-bg', '#383838') : '#fdfdfd'; secondarySummaryEl.style.borderColor = isDarkNow ? safeGetCssVar('--option-border', '#4a4a4a') : '#eee';}
    }
    if (themeSwitch) { const savedTheme = localStorage.getItem('theme'); if (savedTheme) { applyTheme(savedTheme); } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { applyTheme('dark'); } else { applyTheme('light'); } themeSwitch.addEventListener('change', function() { const newTheme = this.checked ? 'dark' : 'light'; applyTheme(newTheme); localStorage.setItem('theme', newTheme); }); if (window.matchMedia) { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => { if (!localStorage.getItem('theme')) { applyTheme(e.matches ? 'dark' : 'light'); }});}} else { if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { applyTheme('dark');} else {applyTheme('light');}}

    // --- QUIZ LOGIC ---
    function initializeQuizState() { userScores = { c: 0, m: 0, p: 0 }; currentQuestionIndex = 0; answerHistory = []; questionOrder = shuffleArray([...Array(questions.length).keys()]); if (resultsArea) resultsArea.style.display = 'none'; const extremityElement = document.getElementById('extremity-score-display'); if (extremityElement) extremityElement.style.display = 'none'; const secondaryMatchArea = document.getElementById('secondary-match-area'); if (secondaryMatchArea) secondaryMatchArea.style.display = 'none'; if (quizArea) quizArea.style.display = 'block'; if (devControlsContainer.parentNode) { devControlsContainer.parentNode.removeChild(devControlsContainer); } if(progressIndicator) progressIndicator.style.display = 'block'; if(nextButton) nextButton.disabled = false; if(restartButton) restartButton.style.display = 'none'; if(backButton) backButton.style.display = 'none'; if (copyStatusElement) copyStatusElement.textContent = ""; if(isDevMode && devSliderControlsState.C && devSliderControlsState.C.input) { devSliderControlsState.C.value = 33.3; devSliderControlsState.C.locked = false; devSliderControlsState.M.value = 33.3; devSliderControlsState.M.locked = false; devSliderControlsState.P.value = 33.4; devSliderControlsState.P.locked = false; updateAllDisplaysFromInternalState();}}
    const urlParams = new URLSearchParams(window.location.search); const isDevMode = urlParams.get('dev') === 'true';
    calculateMinMaxRawScores();
    function calculateMinMaxRawScores() { minMaxRawScores = { c: { min: 0, max: 0 }, m: { min: 0, max: 0 }, p: { min: 0, max: 0 } }; if (!questions || questions.length === 0) { minMaxRawScores = { c: { min: -10, max: 10 }, m: { min: -10, max: 10 }, p: { min: -10, max: 10 } }; return; } questions.forEach(q => { if (q && q.options && q.options.length > 0) { const cScoresInQ = q.options.map(opt => opt.scores.c || 0); const mScoresInQ = q.options.map(opt => opt.scores.m || 0); const pScoresInQ = q.options.map(opt => opt.scores.p || 0); if (cScoresInQ.length > 0) { minMaxRawScores.c.min += Math.min(...cScoresInQ); minMaxRawScores.c.max += Math.max(...cScoresInQ); } if (mScoresInQ.length > 0) { minMaxRawScores.m.min += Math.min(...mScoresInQ); minMaxRawScores.m.max += Math.max(...mScoresInQ); } if (pScoresInQ.length > 0) { minMaxRawScores.p.min += Math.min(...pScoresInQ); minMaxRawScores.p.max += Math.max(...pScoresInQ); } } });}
    function loadQuestion() { if (currentQuestionIndex < questions.length) { const actualQuestionIndexInFullList = questionOrder[currentQuestionIndex]; const currentQuestionObject = questions[actualQuestionIndexInFullList]; if(!currentQuestionObject) { if(questionTextElement) questionTextElement.textContent = "Error loading question. Please restart."; if(optionsContainer) optionsContainer.innerHTML = ""; if(nextButton) nextButton.disabled = true; return; } if(questionTextElement) questionTextElement.innerHTML = `Q${currentQuestionIndex + 1}: ${currentQuestionObject.text}`; if(optionsContainer) optionsContainer.innerHTML = ''; const previousAnswerRecord = answerHistory.find(hist => hist.questionOrderIndex === currentQuestionIndex); const displayOptions = [...currentQuestionObject.options]; displayOptions.forEach((optionData, displayIndex) => { const inputId = `q${currentQuestionIndex}_opt${displayIndex}`; const input = document.createElement('input'); input.type = 'radio'; input.name = `q_options_${currentQuestionIndex}`; input.id = inputId; const scoresToSave = { c: optionData.scores.c || 0, m: optionData.scores.m || 0, p: optionData.scores.p || 0 }; input.value = JSON.stringify(scoresToSave); input.dataset.originalOptionText = optionData.text; if (previousAnswerRecord && optionData.text === previousAnswerRecord.selectedOptionText) { input.checked = true; } const label = document.createElement('label'); label.htmlFor = inputId; label.textContent = optionData.text; if(optionsContainer) { optionsContainer.appendChild(input); optionsContainer.appendChild(label); } }); if(progressIndicator) progressIndicator.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`; if(nextButton) nextButton.textContent = (currentQuestionIndex + 1 === questions.length) ? "Finish & See My Glorious Doom" : "Next"; if(backButton) backButton.style.display = (currentQuestionIndex > 0 && answerHistory.length > 0) ? 'inline-block' : 'none'; if(restartButton && !isDevMode) { restartButton.style.display = (currentQuestionIndex > 0 || (resultsArea && resultsArea.style.display === 'block')) ? 'inline-block' : 'none';} else if (restartButton && isDevMode) { restartButton.style.display = 'block';}} else { showResults(); }}
    function getSelectedOptionData() { const radioGroupName = `q_options_${currentQuestionIndex}`; const selectedRadio = document.querySelector(`input[name="${radioGroupName}"]:checked`); if (selectedRadio) { try { const scores = JSON.parse(selectedRadio.value); const validatedScores = { c: Number(scores.c) || 0, m: Number(scores.m) || 0, p: Number(scores.p) || 0 }; const text = selectedRadio.dataset.originalOptionText || (selectedRadio.nextElementSibling ? selectedRadio.nextElementSibling.textContent : "Error retrieving option text"); return { scores: validatedScores, text: text }; } catch (e) { console.error("Error parsing scores from radio value:", selectedRadio.value, e); return null; }} return null;}
    if (nextButton) { nextButton.addEventListener('click', () => { const selectedData = getSelectedOptionData(); if (selectedData && selectedData.scores) { const questionJustAnswered = questions[questionOrder[currentQuestionIndex]]; const existingAnswerIndex = answerHistory.findIndex(a => a.questionOrderIndex === currentQuestionIndex); if (existingAnswerIndex !== -1) { const oldAnswer = answerHistory[existingAnswerIndex]; userScores.c -= oldAnswer.scoresGiven.c; userScores.m -= oldAnswer.scoresGiven.m; userScores.p -= oldAnswer.scoresGiven.p; answerHistory.splice(existingAnswerIndex, 1); } answerHistory.push({ questionOrderIndex: currentQuestionIndex, questionId: questionJustAnswered.id, selectedOptionText: selectedData.text, scoresGiven: JSON.parse(JSON.stringify(selectedData.scores)) }); userScores.c += selectedData.scores.c; userScores.m += selectedData.scores.m; userScores.p += selectedData.scores.p; currentQuestionIndex++; loadQuestion(); } else { if (currentQuestionIndex < questions.length) { alert("Please select an option before proceeding, you indecisive wretch!");}}});}
    if (restartButton) { restartButton.addEventListener('click', () => { if (isDevMode || confirm("Are you sure you want to restart the quiz? Your current progress will be lost.")) { initializeQuizState(); if (!isDevMode) loadQuestion(); else { updateResultsFromDevControls(); }}});}
    if (backButton) { backButton.addEventListener('click', () => { if (currentQuestionIndex > 0) { const answerForQuestionWeAreGoingBackTo = answerHistory.find(a => a.questionOrderIndex === currentQuestionIndex -1); if (answerForQuestionWeAreGoingBackTo) { userScores.c -= answerForQuestionWeAreGoingBackTo.scoresGiven.c; userScores.m -= answerForQuestionWeAreGoingBackTo.scoresGiven.m; userScores.p -= answerForQuestionWeAreGoingBackTo.scoresGiven.p; answerHistory = answerHistory.filter(hist => hist.questionOrderIndex !== currentQuestionIndex -1); } currentQuestionIndex--; loadQuestion(); } if (currentQuestionIndex === 0) { if(backButton) backButton.style.display = 'none'; }});}
    if (copyResultsButton && copyStatusElement) { copyResultsButton.addEventListener('click', () => { let resultsText = "My Sarcastic Political Ternary Test Results:\n\n"; const ideologyLabelElRef = document.getElementById('ideology-label-result'); const primaryProxElRef = document.getElementById('primary-ideology-proximity-result'); const ideologySummaryElRef = document.getElementById('ideology-summary-result'); const normalizedScoresElRef = document.getElementById('normalized-scores'); const extremityScoreElRef = document.getElementById('extremity-score-display'); const secondaryLabelElRef = document.getElementById('secondary-ideology-label-result'); const secondaryProxElRef = document.getElementById('secondary-ideology-proximity-result'); const secondarySummaryElRef = document.getElementById('secondary-ideology-summary-result'); if (ideologyLabelElRef) { let labelText = ideologyLabelElRef.innerHTML.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?b>/gi, ""); resultsText += labelText + "\n"; } if (primaryProxElRef && primaryProxElRef.style.display !== 'none') { let proxText = primaryProxElRef.innerHTML.replace(/<\/?[^>]+(>|$)/g, ""); resultsText += proxText + "\n"; } if (ideologySummaryElRef) resultsText += "\nSummary: " + ideologySummaryElRef.textContent + "\n\n"; if (secondaryLabelElRef && document.getElementById('secondary-match-area').style.display !== 'none') { resultsText += "Secondary Resemblance:\n"; let secLabelText = secondaryLabelElRef.innerHTML.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?b>/gi, ""); resultsText += secLabelText + "\n"; if (secondaryProxElRef) { let secProxText = secondaryProxElRef.innerHTML.replace(/<\/?[^>]+(>|$)/g, ""); resultsText += secProxText + "\n"; } if (secondarySummaryElRef) resultsText += "Summary: " + secondarySummaryElRef.textContent + "\n\n";} if (normalizedScoresElRef) { let normScoresText = normalizedScoresElRef.innerHTML.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?[^>]+(>|$)/g, ""); resultsText += normScoresText + "\n"; } if (extremityScoreElRef && extremityScoreElRef.style.display !== 'none') { let extremityText = extremityScoreElRef.innerHTML.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?[^>]+(>|$)/g, ""); resultsText += extremityText + "\n"; } const quizLink = window.location.href.split('?')[0]; resultsText += "\nTake the test: " + quizLink; navigator.clipboard.writeText(resultsText).then(() => { copyStatusElement.textContent = "Results copied to clipboard!"; setTimeout(() => { copyStatusElement.textContent = ""; }, 3000); }).catch(err => { copyStatusElement.textContent = "Failed to copy. Please copy manually."; console.error('Failed to copy results: ', err); }); });}
    function normalizeScores(rawScores, minMax) { let rangeC = (minMax.c.max - minMax.c.min); let rangeM = (minMax.m.max - minMax.m.min); let rangeP = (minMax.p.max - minMax.p.min); if (rangeC === 0) rangeC = 1; if (rangeM === 0) rangeM = 1; if (rangeP === 0) rangeP = 1; let normC_intermediate = (rawScores.c - minMax.c.min) / rangeC; let normM_intermediate = (rawScores.m - minMax.m.min) / rangeM; let normP_intermediate = (rawScores.p - minMax.p.min) / rangeP; normC_intermediate = Math.max(0, Math.min(1, normC_intermediate)); normM_intermediate = Math.max(0, Math.min(1, normM_intermediate)); normP_intermediate = Math.max(0, Math.min(1, normP_intermediate)); const totalIntermediate = normC_intermediate + normM_intermediate + normP_intermediate; if (totalIntermediate === 0) return { c: 33.33, m: 33.33, p: 33.34 }; let c = parseFloat(((normC_intermediate / totalIntermediate) * 100).toFixed(2)); let m = parseFloat(((normM_intermediate / totalIntermediate) * 100).toFixed(2)); let p; if (c + m > 100.005) { let sumCM = c + m; if (sumCM > 0) { c = parseFloat(((c / sumCM) * 100).toFixed(2)); m = parseFloat((100.0 - c).toFixed(2)); } else { c = 50.00; m = 50.00; } p = 0.00; } else { p = parseFloat((100.0 - c - m).toFixed(2)); } c = Math.max(0, Math.min(100, c)); m = Math.max(0, Math.min(100, m)); p = Math.max(0, Math.min(100, p)); let finalSum = c + m + p; const finalEpsilon = 0.03; if (Math.abs(finalSum - 100.0) > finalEpsilon) { p = parseFloat((100.0 - c - m).toFixed(2)); } return { c: c, m: m, p: Math.max(0,p) };}

    // --- DEV CONTROLS ---
    function updateAllDisplaysFromInternalState() { for (const key in devSliderControlsState) { const s = devSliderControlsState[key]; if (s.input && s.span && s.label && s.lockStatusSpan) { s.value = parseFloat(s.value.toFixed(1)); s.input.value = s.value.toFixed(1); s.span.textContent = `${s.value.toFixed(1)}%`; s.lockStatusSpan.textContent = s.locked ? "(Locked)" : ""; s.label.classList.toggle('locked-label', s.locked); s.input.disabled = s.locked; }}}
    function reBalanceSliders(changedKey = null) { let sumLocked = 0; let unlockedKeys = []; let sumOfUnlockedOriginalValues = 0; for (const key in devSliderControlsState) { const s = devSliderControlsState[key]; let currentValue = (key === changedKey && !s.locked) ? parseFloat(s.input.value) : s.value; currentValue = parseFloat(Math.max(0, Math.min(100, currentValue)).toFixed(1)); s.value = currentValue; if (s.locked) { sumLocked += s.value; } else { unlockedKeys.push(key); sumOfUnlockedOriginalValues += s.value; }} let availableForUnlocked = 100.0 - sumLocked; availableForUnlocked = Math.max(0, availableForUnlocked); if (unlockedKeys.length > 0) { if (unlockedKeys.includes(changedKey)) { let valueOfChanged = devSliderControlsState[changedKey].value; valueOfChanged = Math.min(valueOfChanged, availableForUnlocked); devSliderControlsState[changedKey].value = valueOfChanged; let sumForOthers = availableForUnlocked - valueOfChanged; sumForOthers = Math.max(0, sumForOthers); let otherUnlockedKeys = unlockedKeys.filter(k => k !== changedKey); if (otherUnlockedKeys.length > 0) { let sumOfOriginalValuesOfOthers = 0; otherUnlockedKeys.forEach(k => sumOfOriginalValuesOfOthers += devSliderControlsState[k].value); if (sumOfOriginalValuesOfOthers < 0.01 && sumOfOriginalValuesOfOthers > -0.01 ) { const valPer = sumForOthers / otherUnlockedKeys.length; otherUnlockedKeys.forEach(k => devSliderControlsState[k].value = valPer); } else { otherUnlockedKeys.forEach(k => { const proportion = devSliderControlsState[k].value / sumOfOriginalValuesOfOthers; devSliderControlsState[k].value = proportion * sumForOthers; });}}} else { if (sumOfUnlockedOriginalValues < 0.01 && sumOfUnlockedOriginalValues > -0.01 && unlockedKeys.length > 0) { const valPer = availableForUnlocked / unlockedKeys.length; unlockedKeys.forEach(k => devSliderControlsState[k].value = valPer); } else if (unlockedKeys.length > 0) { unlockedKeys.forEach(k => { const proportion = devSliderControlsState[k].value / sumOfUnlockedOriginalValues; devSliderControlsState[k].value = proportion * availableForUnlocked; });}}} let currentTotal = 0; for (const key in devSliderControlsState) { devSliderControlsState[key].value = parseFloat(Math.max(0, Math.min(100, devSliderControlsState[key].value)).toFixed(1)); currentTotal += devSliderControlsState[key].value;} let diff = 100.0 - currentTotal; if (Math.abs(diff) >= 0.05) { const orderOfPreference = ['P', 'M', 'C']; for (const key of orderOfPreference) { if (unlockedKeys.includes(key)) { let newVal = devSliderControlsState[key].value + diff; if (newVal >= -0.049 && newVal <= 100.049) { devSliderControlsState[key].value = parseFloat(Math.max(0, Math.min(100, newVal)).toFixed(1)); break; }}}} if (!devSliderControlsState.P.locked && (devSliderControlsState.C.locked || devSliderControlsState.M.locked)) { devSliderControlsState.P.value = parseFloat(Math.max(0, Math.min(100, 100.0 - devSliderControlsState.C.value - devSliderControlsState.M.value)).toFixed(1)); } else if (!devSliderControlsState.M.locked && (devSliderControlsState.C.locked || devSliderControlsState.P.locked)) { devSliderControlsState.M.value = parseFloat(Math.max(0, Math.min(100, 100.0 - devSliderControlsState.C.value - devSliderControlsState.P.value)).toFixed(1)); } else if (!devSliderControlsState.C.locked && (devSliderControlsState.M.locked || devSliderControlsState.P.locked)) { devSliderControlsState.C.value = parseFloat(Math.max(0, Math.min(100, 100.0 - devSliderControlsState.M.value - devSliderControlsState.P.value)).toFixed(1));} updateAllDisplaysFromInternalState(); triggerResultsUpdate();}
    function triggerResultsUpdate() { clearTimeout(debounceTimer); debounceTimer = setTimeout(updateResultsFromDevControls, 100);}
    function setupDevControls() { devControlsContainer.innerHTML = `<h3>Developer Controls (Normalized Scores %)</h3><div><label for="devC" id="labelC" title="Double-click to lock/unlock">Centralism (C):</label><input type="range" id="devC" min="0" max="100" value="33.3" step="0.1"><span id="devCValue">33.3%</span><span id="lockStatusC" class="lock-status"></span></div><div><label for="devM" id="labelM" title="Double-click to lock/unlock">Communalism (M):</label><input type="range" id="devM" min="0" max="100" value="33.3" step="0.1"><span id="devMValue">33.3%</span><span id="lockStatusM" class="lock-status"></span></div><div><label for="devP" id="labelP" title="Double-click to lock/unlock">Privatism (P):</label><input type="range" id="devP" min="0" max="100" value="33.4" step="0.1"><span id="devPValue">33.4%</span><span id="lockStatusP" class="lock-status"></span></div><p style="font-size:0.8em; color: #555;">Double-click a label to lock/unlock its slider. Sliders will auto-balance.</p>`; const style = document.createElement('style'); style.textContent = `.lock-status { margin-left: 5px; font-size: 0.8em; color: #d9534f; font-style: italic; } label.locked-label { font-weight: bold; color: #d9534f !important; cursor: pointer; } label:not(.locked-label) { cursor: pointer; } input[type="range"]:disabled { opacity: 0.6; }`; document.head.appendChild(style); if (resultsArea && rawScoresElement && resultsArea.contains(rawScoresElement)) { resultsArea.insertBefore(devControlsContainer, rawScoresElement); } else if (resultsArea) resultsArea.appendChild(devControlsContainer); else { console.error("Cannot setup dev controls: resultsArea not found."); return; } devSliderControlsState = { C: { input: document.getElementById('devC'), span: document.getElementById('devCValue'), label: document.getElementById('labelC'), lockStatusSpan: document.getElementById('lockStatusC'), locked: false, value: 33.3 }, M: { input: document.getElementById('devM'), span: document.getElementById('devMValue'), label: document.getElementById('labelM'), lockStatusSpan: document.getElementById('lockStatusM'), locked: false, value: 33.3 }, P: { input: document.getElementById('devP'), span: document.getElementById('devPValue'), label: document.getElementById('labelP'), lockStatusSpan: document.getElementById('lockStatusP'), locked: false, value: 33.4 }}; updateAllDisplaysFromInternalState(); for (const key in devSliderControlsState) { const s = devSliderControlsState[key]; s.input.addEventListener('input', (event) => { if (s.locked) { event.target.value = s.value.toFixed(1); return; } reBalanceSliders(key); }); s.label.addEventListener('dblclick', () => { s.locked = !s.locked; s.input.disabled = s.locked; if (s.locked) { s.value = parseFloat(s.input.value); } reBalanceSliders(); });} reBalanceSliders();}


    // --- Plot Title Helper ---
    function determinePlotTitle(ideologyInfoPrimary) {
        let plotTitle = ideologyInfoPrimary.specific || "Your Political Profile";
        const genericKeywords = ["(General)", "Tendencies", "Eclectic", "Uncategorized", "Outlook", "(Undifferentiated)"];
        const ultimateFallback = "Mixed / Eclectic Political Outlook";

        if (!ideologyInfoPrimary.specific ||
            plotTitle === ultimateFallback ||
            plotTitle === "Undetermined" ||
            plotTitle === ideologyInfoPrimary.broadCategory ||
            (genericKeywords.some(keyword => plotTitle.includes(keyword)))) {

            if (ideologyInfoPrimary.broadCategory &&
                ideologyInfoPrimary.broadCategory !== ultimateFallback &&
                ideologyInfoPrimary.broadCategory !== "Undetermined" &&
                ideologyInfoPrimary.broadCategory !== "Unclassifiable") {
                plotTitle = ideologyInfoPrimary.broadCategory;
            } else {
                plotTitle = isDevMode ? "Political Profile Explorer" : "Your Political Profile";
            }
        }
        if (!plotTitle || plotTitle.trim() === "") {
             plotTitle = isDevMode ? "Political Profile Explorer" : "Your Political Profile";
        }
        return plotTitle;
    }

    // --- getIdeologyLabelAndSarcasm (Nearest Centroid Method) ---
    function getIdeologyLabelAndSarcasm(normC_user, normM_user, normP_user) {
        let bestMatch = {
            specific: "Mixed / Eclectic Political Outlook",
            broadCategory: "Mixed / Eclectic Political Outlook",
            minDistance: Infinity,
            summary: ""
        };
        let secondBestMatch = {
            specific: "", broadCategory: "", distance: Infinity, summary: ""
        };

        if (typeof ideologyIdealPoints === 'undefined' || Object.keys(ideologyIdealPoints).length === 0) {
            console.error("ideology_ideal_points.js not loaded or empty!");
            bestMatch.summary = (typeof ideologySummaries !== 'undefined' && ideologySummaries[bestMatch.specific]) ? ideologySummaries[bestMatch.specific] : "Error: Ideal points data missing.";
            return { primary: bestMatch, secondary: secondBestMatch };
        }
        if (typeof ideologySummaries === 'undefined') {
             console.error("ideology_summaries.js not loaded!");
             bestMatch.summary = "Error: Summaries data missing.";
             return { primary: bestMatch, secondary: secondBestMatch };
        }

        let C_user = parseFloat(normC_user); let M_user = parseFloat(normM_user); let P_user = parseFloat(normP_user);
        let sumUser = C_user + M_user + P_user;
        if (Math.abs(sumUser - 100.0) > 0.1) { // Ensure input scores sum to 100 for accurate distance
            if (sumUser === 0) { C_user = 33.33; M_user = 33.33; P_user = 33.34; }
            else { const scale = 100.0 / sumUser; C_user = parseFloat((C_user * scale).toFixed(2)); M_user = parseFloat((M_user * scale).toFixed(2)); P_user = parseFloat((100.0 - C_user - M_user).toFixed(2)); }
        }
        C_user = Math.max(0, Math.min(100, C_user)); M_user = Math.max(0, Math.min(100, M_user));
        P_user = parseFloat((100.0 - C_user - M_user).toFixed(2)); P_user = Math.max(0, Math.min(100, P_user));


        for (const ideologyName in ideologyIdealPoints) {
            const ideal = ideologyIdealPoints[ideologyName];
            if (typeof ideal.c !== 'number' || typeof ideal.m !== 'number' || typeof ideal.p !== 'number' || typeof ideal.broad !== 'string') {
                console.warn(`Skipping invalid ideal point structure for: ${ideologyName}`); continue;
            }
            const distance = Math.sqrt(Math.pow(C_user - ideal.c, 2) + Math.pow(M_user - ideal.m, 2) + Math.pow(P_user - ideal.p, 2));
            if (distance < bestMatch.minDistance) {
                secondBestMatch.distance = bestMatch.minDistance; secondBestMatch.specific = bestMatch.specific; secondBestMatch.broadCategory = bestMatch.broadCategory;
                bestMatch.minDistance = distance; bestMatch.specific = ideologyName; bestMatch.broadCategory = ideal.broad;
            } else if (distance < secondBestMatch.distance && ideologyName !== bestMatch.specific) {
                secondBestMatch.distance = distance; secondBestMatch.specific = ideologyName; secondBestMatch.broadCategory = ideal.broad;
            }
        }

        if (ideologySummaries[bestMatch.specific]) { bestMatch.summary = ideologySummaries[bestMatch.specific];
        } else if (ideologySummaries[bestMatch.broadCategory]) { bestMatch.summary = ideologySummaries[bestMatch.broadCategory]; if (bestMatch.specific !== bestMatch.broadCategory && !bestMatch.specific.includes("(General)") && !bestMatch.specific.includes("Tendencies") && !ideologySummaries[bestMatch.specific]) { bestMatch.summary += ` (Specifically leaning towards ${bestMatch.specific}.)`; }
        } else { bestMatch.summary = ideologySummaries["Mixed / Eclectic Political Outlook"] || "A unique perspective! (Summary not found)"; }

        if (secondBestMatch.specific && secondBestMatch.specific !== "" && secondBestMatch.specific !== bestMatch.specific) {
            if (ideologySummaries[secondBestMatch.specific]) { secondBestMatch.summary = ideologySummaries[secondBestMatch.specific];
            } else if (ideologySummaries[secondBestMatch.broadCategory]) { secondBestMatch.summary = ideologySummaries[secondBestMatch.broadCategory]; if (secondBestMatch.specific !== secondBestMatch.broadCategory && !secondBestMatch.specific.includes("(General)") && !secondBestMatch.specific.includes("Tendencies") && !ideologySummaries[secondBestMatch.specific]) { secondBestMatch.summary += ` (Specifically leaning towards ${secondBestMatch.specific}.)`;}}
            else { secondBestMatch.summary = ""; }
        } else { secondBestMatch.specific = ""; secondBestMatch.summary = ""; secondBestMatch.distance = Infinity; }

        return { primary: bestMatch, secondary: secondBestMatch };
    }

    // --- DISPLAY AND PLOT FUNCTIONS ---
    function calculateAndDisplayExtremityScore(currentNormalizedScores, currentRawScoresForExtremity) {
        if (!minMaxRawScores || !minMaxRawScores.c || typeof minMaxRawScores.c.min === 'undefined') { console.error("minMaxRawScores not fully available for extremity calculation."); const el = document.getElementById('extremity-score-display'); if (el) el.innerHTML = `<b>Overall Profile Extremity:</b> Data N/A`; return; }
        const mid_C = (minMaxRawScores.c.max + minMaxRawScores.c.min) / 2; const mid_M = (minMaxRawScores.m.max + minMaxRawScores.m.min) / 2; const mid_P = (minMaxRawScores.p.max + minMaxRawScores.p.min) / 2;
        const dev_C = Math.abs(currentRawScoresForExtremity.c - mid_C); const dev_M = Math.abs(currentRawScoresForExtremity.m - mid_M); const dev_P = Math.abs(currentRawScoresForExtremity.p - mid_P);
        const rawExtremityScore = dev_C + dev_M + dev_P;
        const max_dev_C = (minMaxRawScores.c.max - minMaxRawScores.c.min) / 2; const max_dev_M = (minMaxRawScores.m.max - minMaxRawScores.m.min) / 2; const max_dev_P = (minMaxRawScores.p.max - minMaxRawScores.p.min) / 2;
        const theoreticalMaxRawExtremity = max_dev_C + max_dev_M + max_dev_P;
        let extremityPercentage = 0;
        if (theoreticalMaxRawExtremity > 0) { extremityPercentage = Math.min(100, (rawExtremityScore / theoreticalMaxRawExtremity) * 100); }
        extremityPercentage = Math.max(0, parseFloat(extremityPercentage.toFixed(1)));
        const extremityElementId = 'extremity-score-display'; let extremityElement = document.getElementById(extremityElementId);
        if (!extremityElement) { extremityElement = document.createElement('div'); extremityElement.id = extremityElementId; extremityElement.style.marginTop = '15px'; extremityElement.style.padding = '10px'; if (plotDiv && plotDiv.parentNode) { plotDiv.parentNode.insertBefore(extremityElement, plotDiv); } else if (normalizedScoresElement && normalizedScoresElement.parentNode) { normalizedScoresElement.parentNode.insertBefore(extremityElement, normalizedScoresElement.nextSibling); } else if (resultsArea) { resultsArea.appendChild(extremityElement); }}
        extremityElement.style.display = 'block'; const isDark = document.body.classList.contains('dark-mode');
        extremityElement.style.backgroundColor = isDark ? 'var(--score-box-bg, #2c2c3a)' : '#eef'; extremityElement.style.borderLeft = `3px solid ${isDark ? 'var(--score-box-border, #555577)' : '#77a'}`; extremityElement.style.color = isDark ? 'var(--text-color, #e2e2e2)' : '#333';
        extremityElement.innerHTML = `<b>Overall Profile Extremity:</b> ${extremityPercentage}%`;
        if (isDevMode) { extremityElement.innerHTML += ` <span style="font-size:0.8em; color: #777;">(Approximated for Dev Mode)</span>`; }
    }

    function displayIdeologyInfo(ideologyInfoObject) {
        const primaryMatch = ideologyInfoObject.primary;
        const secondaryMatch = ideologyInfoObject.secondary;
        const primaryIdeologyLabelElement = document.getElementById('ideology-label-result');
        const primaryIdeologySummaryElement = document.getElementById('ideology-summary-result');
        let primaryProximityElement = document.getElementById('primary-ideology-proximity-result');
        if (!primaryProximityElement) {
            primaryProximityElement = document.createElement('p'); primaryProximityElement.id = 'primary-ideology-proximity-result';
            primaryProximityElement.style.fontSize = '0.9em'; primaryProximityElement.style.marginBottom = '5px';
             if (primaryIdeologyLabelElement && primaryIdeologyLabelElement.parentNode && primaryIdeologySummaryElement) {
                primaryIdeologyLabelElement.parentNode.insertBefore(primaryProximityElement, primaryIdeologySummaryElement);
            }
        }
        primaryProximityElement.style.color = document.body.classList.contains('dark-mode') ? 'var(--secondary-text-color)' : '#555';

        if (primaryIdeologyLabelElement) {
            let labelHTML = "Your Closest Political Profile:<br>"; const ultimateFallback = "Mixed / Eclectic Political Outlook";
            const isGeneralSpecific = primaryMatch.specific === primaryMatch.broadCategory + " (General)" || primaryMatch.specific === primaryMatch.broadCategory + " Tendencies" || (primaryMatch.specific === primaryMatch.broadCategory && primaryMatch.broadCategory !== ultimateFallback && primaryMatch.specific !== ultimateFallback) ;
            if (primaryMatch.specific && primaryMatch.specific !== ultimateFallback && !isGeneralSpecific && primaryMatch.broadCategory !== "" && primaryMatch.specific !== primaryMatch.broadCategory) { labelHTML += `<b>Specific Ideology:</b> ${primaryMatch.specific}`; if (primaryMatch.broadCategory && primaryMatch.broadCategory !== primaryMatch.specific) { labelHTML += `<br><b>Broad Category:</b> ${primaryMatch.broadCategory}`; }}
            else if (primaryMatch.broadCategory && primaryMatch.broadCategory !== ultimateFallback && primaryMatch.broadCategory !== "") { labelHTML += `<b>Category:</b> ${primaryMatch.broadCategory}`; if (primaryMatch.specific && primaryMatch.specific !== primaryMatch.broadCategory && !isGeneralSpecific && primaryMatch.specific !== ultimateFallback) { labelHTML += ` (leaning ${primaryMatch.specific})`; }}
            else if (primaryMatch.specific && primaryMatch.specific !== ultimateFallback && primaryMatch.specific !== "") { labelHTML += `<b>Ideology:</b> ${primaryMatch.specific}`; }
            else { labelHTML += `<b>Category:</b> ${ultimateFallback}`; if (!primaryMatch.summary && typeof ideologySummaries !== 'undefined' && ideologySummaries[ultimateFallback]) { primaryMatch.summary = ideologySummaries[ultimateFallback]; } else if (!primaryMatch.summary) { primaryMatch.summary = "A uniquely balanced perspective!"; }}
            primaryIdeologyLabelElement.innerHTML = labelHTML;
        }

        const REFERENCE_MAX_DISTANCE = 60;
        let primaryProximity = Math.max(0, parseFloat(((1 - primaryMatch.minDistance / REFERENCE_MAX_DISTANCE) * 100).toFixed(1)));
        primaryProximityElement.innerHTML = `<b>Match Strength:</b> ${primaryProximity}% <span style="font-size:0.8em;">(Distance: ${primaryMatch.minDistance.toFixed(1)})</span>`;

        if (primaryIdeologySummaryElement) {
            primaryIdeologySummaryElement.textContent = primaryMatch.summary;
            const isDark = document.body.classList.contains('dark-mode'); const safeGetCssVar = (varName, fallback) => { try { const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); return val || fallback; } catch (e) { return fallback; }};
            primaryIdeologySummaryElement.style.backgroundColor = isDark ? safeGetCssVar('--option-bg', '#333333') : '#f9f9f9';
            primaryIdeologySummaryElement.style.borderColor = isDark ? safeGetCssVar('--option-border', '#444444') : '#ccc';
        }

        const secondaryArea = document.getElementById('secondary-match-area');
        const secondaryLabelElement = document.getElementById('secondary-ideology-label-result');
        const secondarySummaryElement = document.getElementById('secondary-ideology-summary-result');
        const secondaryProximityElement = document.getElementById('secondary-ideology-proximity-result');

        if (secondaryMatch && secondaryMatch.specific && secondaryMatch.specific !== "" && secondaryMatch.specific !== primaryMatch.specific && secondaryMatch.distance < Infinity && secondaryArea && secondaryLabelElement && secondarySummaryElement && secondaryProximityElement) {
            secondaryArea.style.display = 'block'; let secLabelHTML = "";
            const secIsGeneralSpecific = secondaryMatch.specific === secondaryMatch.broadCategory + " (General)" || secondaryMatch.specific === secondaryMatch.broadCategory + " Tendencies" || (secondaryMatch.specific === secondaryMatch.broadCategory && secondaryMatch.broadCategory !== "Mixed / Eclectic Political Outlook");
            if (secondaryMatch.specific && !secIsGeneralSpecific && secondaryMatch.broadCategory !== "" && secondaryMatch.specific !== secondaryMatch.broadCategory) { secLabelHTML += `<b>Specific Ideology:</b> ${secondaryMatch.specific}`; if (secondaryMatch.broadCategory && secondaryMatch.broadCategory !== secondaryMatch.specific) { secLabelHTML += `<br><b>Broad Category:</b> ${secondaryMatch.broadCategory}`; }}
            else if (secondaryMatch.broadCategory && secondaryMatch.broadCategory !== "") { secLabelHTML += `<b>Category:</b> ${secondaryMatch.broadCategory}`; if (secondaryMatch.specific && secondaryMatch.specific !== secondaryMatch.broadCategory && !secIsGeneralSpecific) { secLabelHTML += ` (leaning ${secondaryMatch.specific})`; }}
            else if (secondaryMatch.specific && secondaryMatch.specific !== "") { secLabelHTML += `<b>Ideology:</b> ${secondaryMatch.specific}`; }
            secondaryLabelElement.innerHTML = secLabelHTML;
            secondarySummaryElement.textContent = secondaryMatch.summary || "No further details available.";
            const isDark = document.body.classList.contains('dark-mode'); const safeGetCssVar = (varName, fallback) => { try { const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); return val || fallback; } catch (e) { return fallback; }};
            secondarySummaryElement.style.backgroundColor = isDark ? safeGetCssVar('--option-bg', '#383838') : '#fdfdfd'; secondarySummaryElement.style.borderColor = isDark ? safeGetCssVar('--option-border', '#4a4a4a') : '#eee';
            let secondaryProximity = Math.max(0, parseFloat(((1 - secondaryMatch.distance / REFERENCE_MAX_DISTANCE) * 100).toFixed(1)));
            secondaryProximityElement.innerHTML = `<b>Match Strength:</b> ${secondaryProximity}% <span style="font-size:0.8em;">(Distance: ${secondaryMatch.distance.toFixed(1)})</span>`;
            secondaryProximityElement.style.color = document.body.classList.contains('dark-mode') ? 'var(--secondary-text-color)' : '#555';
        } else if (secondaryArea) { secondaryArea.style.display = 'none'; }
    }

    function drawPlot(normalized, ideologyLabel = "Your Position", userBroadCategory = "Mixed / Eclectic Political Outlook") {
        const plotDivRef = document.getElementById('plot-div');
        if (!plotDivRef || typeof Plotly === 'undefined') { if (plotDivRef) plotDivRef.innerHTML = "<p style='color:red; text-align:center;'>Plotly error.</p>"; return; }

        let plotC = !isNaN(normalized.c) ? parseFloat(normalized.c.toFixed(2)) : 33.33;
        let plotM = !isNaN(normalized.m) ? parseFloat(normalized.m.toFixed(2)) : 33.33;
        let plotP = parseFloat((100.0 - plotC - plotM).toFixed(2));
        plotC = Math.max(0, Math.min(100, plotC)); plotM = Math.max(0, Math.min(100, plotM)); plotP = Math.max(0, Math.min(100, plotP));
        let sumTotal = plotC + plotM + plotP;
        if (Math.abs(sumTotal - 100.0) > 0.03) {
            if (sumTotal === 0) { plotC = 33.33; plotM = 33.33; plotP = 33.34; }
            else { const scale = 100.0 / sumTotal; plotC = parseFloat((plotC * scale).toFixed(2)); plotM = parseFloat((plotM * scale).toFixed(2)); }
            plotP = parseFloat((100.0 - plotC - plotM).toFixed(2));
        }
        plotC = parseFloat(Math.max(0, Math.min(100, plotC)).toFixed(2));
        plotM = parseFloat(Math.max(0, Math.min(100, plotM)).toFixed(2));
        plotP = parseFloat(Math.max(0, Math.min(100, 100.0 - plotC - plotM)).toFixed(2)); // Final P calculation

        const userPointColor = broadCategoryColors[userBroadCategory] || broadCategoryColors["Mixed / Eclectic Political Outlook"];
        const isDarkMode = document.body.classList.contains('dark-mode');
        const safeGetCssVar = (varName, fallback) => { try { const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); return val || fallback; } catch (e) { return fallback; }};
        const currentBgColor = isDarkMode ? safeGetCssVar('--container-bg', '#2a2a2a') : '#fff';
        const currentTextColor = isDarkMode ? safeGetCssVar('--text-color', '#e2e2e2') : '#333';
        const plotTernaryBgColor = isDarkMode ? safeGetCssVar('--option-bg', '#333333') : '#f0f0f0';
        const currentGridColor = isDarkMode ? safeGetCssVar('--dev-controls-border', '#555555') : safeGetCssVar('--option-border','#cccccc');
        const plotData = [{ type: 'scatterternary', mode: 'markers', a: [plotC], b: [plotM], c: [plotP], name: 'Your Position', text: [`C: ${plotC.toFixed(1)}%<br>M: ${plotM.toFixed(1)}%<br>P: ${plotP.toFixed(1)}%`], hoverinfo: 'text', marker: { symbol: 'circle', color: userPointColor, size: 14, line: { width: 1.5, color: isDarkMode ? '#FFFFFF' : '#000000' } } }];
        const layout = { title: { text: `Political Profile: <b>${ideologyLabel}</b>`, font: { color: currentTextColor, size: 16 } }, ternary: { sum: 100, aaxis: { title: '<b>Centralism (C)</b><br>(State / Authority Focus)', min: 0, linewidth: 2, ticks: 'outside', tickfont: { color: currentTextColor, size:10 }, titlefont: { color: currentTextColor, size:12 },linecolor: currentTextColor, gridcolor: currentGridColor }, baxis: { title: '<b>Communalism (M)</b><br>(Collective / Social Focus)', min: 0, linewidth: 2, ticks: 'outside', tickfont: { color: currentTextColor, size:10 }, titlefont: { color: currentTextColor, size:12 }, linecolor: currentTextColor, gridcolor: currentGridColor }, caxis: { title: '<b>Privatism (P)</b><br>(Individual / Market Focus)', min: 0, linewidth: 2, ticks: 'outside', tickfont: { color: currentTextColor, size:10 }, titlefont: { color: currentTextColor, size:12 }, linecolor: currentTextColor, gridcolor: currentGridColor }, bgcolor: plotTernaryBgColor }, annotations: [{ showarrow: false, text: '*Not remotely scientific. Mostly for amusement.', x: 0.5, y: -0.15, xref: 'paper', yref: 'paper', font: { size: 10, color: isDarkMode ? '#aaa' : '#666' } }], paper_bgcolor: currentBgColor, plot_bgcolor: currentBgColor, margin: { l: 70, r: 50, b: 100, t: 80, pad: 4 } };
        try { Plotly.newPlot('plot-div', plotData, layout, {responsive: true}); }
        catch (e) { console.error("Error during Plotly.newPlot:", e); if (plotDivRef) plotDivRef.innerHTML = "<p style='color:red; text-align:center;'>Error rendering plot. Check console for details.</p>"; }
    }

    function showResults() {
        if(quizArea) quizArea.style.display = 'none'; if(resultsArea) resultsArea.style.display = 'block'; if(progressIndicator) progressIndicator.style.display = 'none'; if(restartButton && !isDevMode) restartButton.style.display = 'block'; if(backButton) backButton.style.display = 'none';
        const finalNormalizedScores = normalizeScores(userScores, minMaxRawScores);
        if(rawScoresElement) rawScoresElement.innerHTML = `Raw Scores (End of Quiz):<br>C: ${userScores.c.toFixed(2)}, M: ${userScores.m.toFixed(2)}, P: ${userScores.p.toFixed(2)}`;
        if(normalizedScoresElement) normalizedScoresElement.innerHTML = `Normalized Scores (Final):<br>C: ${finalNormalizedScores.c.toFixed(2)}%, M: ${finalNormalizedScores.m.toFixed(2)}%, P: ${finalNormalizedScores.p.toFixed(2)}%`;
        if (Object.keys(minMaxRawScores.c).length > 0) calculateAndDisplayExtremityScore(finalNormalizedScores, userScores);
        const ideologyInfoObject = getIdeologyLabelAndSarcasm(finalNormalizedScores.c, finalNormalizedScores.m, finalNormalizedScores.p);
        displayIdeologyInfo(ideologyInfoObject);
        let plotTitle = determinePlotTitle(ideologyInfoObject.primary);
        if (typeof Plotly !== 'undefined') { drawPlot(finalNormalizedScores, plotTitle, ideologyInfoObject.primary.broadCategory); } else { console.error("Plotly undefined in showResults");}
    }
    function updateResultsFromDevControls() {
        let cVal = devSliderControlsState.C.value; let mVal = devSliderControlsState.M.value; let pVal = devSliderControlsState.P.value;
        cVal = parseFloat(cVal.toFixed(2)); mVal = parseFloat(mVal.toFixed(2));
        let tempSum = cVal + mVal;
        if(tempSum > 100.005) { if (tempSum > 0) { cVal = parseFloat(((cVal/tempSum)*100.0).toFixed(2)); mVal = parseFloat((100.0-cVal).toFixed(2)); } else { cVal = 33.33; mVal = 33.33; } pVal = 0.00;}
        else { pVal = parseFloat((100.0 - cVal - mVal).toFixed(2)); }
        if (pVal < 0) pVal = 0.00;
        cVal = Math.max(0, Math.min(100, cVal)); mVal = Math.max(0, Math.min(100, mVal)); pVal = Math.max(0, Math.min(100, pVal));
        pVal = parseFloat((100.0 - cVal - mVal).toFixed(2)); pVal = Math.max(0,Math.min(100,pVal));
        const normalizedScoresToUse = { c: cVal, m: mVal, p: pVal };

        if (devSliderControlsState.C && devSliderControlsState.C.input && (Math.abs(parseFloat(devSliderControlsState.C.input.value) - normalizedScoresToUse.c) > 0.05 || Math.abs(parseFloat(devSliderControlsState.M.input.value) - normalizedScoresToUse.m) > 0.05 || Math.abs(parseFloat(devSliderControlsState.P.input.value) - normalizedScoresToUse.p) > 0.05) ) {
            devSliderControlsState.C.input.value = normalizedScoresToUse.c.toFixed(1); devSliderControlsState.M.input.value = normalizedScoresToUse.m.toFixed(1); devSliderControlsState.P.input.value = normalizedScoresToUse.p.toFixed(1);
            devSliderControlsState.C.value = normalizedScoresToUse.c; devSliderControlsState.M.value = normalizedScoresToUse.m; devSliderControlsState.P.value = normalizedScoresToUse.p;
            if(devSliderControlsState.C.span) devSliderControlsState.C.span.textContent = `${normalizedScoresToUse.c.toFixed(1)}%`; if(devSliderControlsState.M.span) devSliderControlsState.M.span.textContent = `${normalizedScoresToUse.m.toFixed(1)}%`; if(devSliderControlsState.P.span) devSliderControlsState.P.span.textContent = `${normalizedScoresToUse.p.toFixed(1)}%`;
        }

        const mid_C = (minMaxRawScores.c.max + minMaxRawScores.c.min) / 2; const mid_M = (minMaxRawScores.m.max + minMaxRawScores.m.min) / 2; const mid_P = (minMaxRawScores.p.max + minMaxRawScores.p.min) / 2;
        const range_C = (minMaxRawScores.c.max - minMaxRawScores.c.min); const range_M = (minMaxRawScores.m.max - minMaxRawScores.m.min); const range_P = (minMaxRawScores.p.max - minMaxRawScores.p.min);
        const mockedRawScoresForExtremity = { c: mid_C + ((normalizedScoresToUse.c - 50) / 50) * (range_C / 2 || 1), m: mid_M + ((normalizedScoresToUse.m - 50) / 50) * (range_M / 2 || 1), p: mid_P + ((normalizedScoresToUse.p - 50) / 50) * (range_P / 2 || 1) };
        mockedRawScoresForExtremity.c = Math.max(minMaxRawScores.c.min, Math.min(minMaxRawScores.c.max, mockedRawScoresForExtremity.c)); mockedRawScoresForExtremity.m = Math.max(minMaxRawScores.m.min, Math.min(minMaxRawScores.m.max, mockedRawScoresForExtremity.m)); mockedRawScoresForExtremity.p = Math.max(minMaxRawScores.p.min, Math.min(minMaxRawScores.p.max, mockedRawScoresForExtremity.p));
        if (rawScoresElement) rawScoresElement.innerHTML = `Raw Scores (Mocked for Dev Mode):<br>C: ${mockedRawScoresForExtremity.c.toFixed(2)}, M: ${mockedRawScoresForExtremity.m.toFixed(2)}, P: ${mockedRawScoresForExtremity.p.toFixed(2)}`;
        if (normalizedScoresElement) normalizedScoresElement.innerHTML = `Normalized Scores (from sliders):<br>C: ${normalizedScoresToUse.c.toFixed(2)}%, M: ${normalizedScoresToUse.m.toFixed(2)}%, P: ${normalizedScoresToUse.p.toFixed(2)}%`;
        if (Object.keys(minMaxRawScores.c).length > 0) calculateAndDisplayExtremityScore(normalizedScoresToUse, mockedRawScoresForExtremity);
        const ideologyInfoObject = getIdeologyLabelAndSarcasm(normalizedScoresToUse.c, normalizedScoresToUse.m, normalizedScoresToUse.p);
        displayIdeologyInfo(ideologyInfoObject);
        let plotTitle = determinePlotTitle(ideologyInfoObject.primary);
        if (typeof Plotly !== 'undefined') { drawPlot(normalizedScoresToUse, plotTitle, ideologyInfoObject.primary.broadCategory); } else { console.error("Plotly undefined in updateDevControls");}
     }

    // Initial setup logic
    if (isDevMode) {
        const mainHeading = document.querySelector('.container h1');
        if (mainHeading && !mainHeading.textContent.includes("(Dev Mode)")) mainHeading.textContent += " (Dev Mode)";
        if(quizArea) quizArea.style.display = 'none';
        if(resultsArea) resultsArea.style.display = 'block';
        const introP = document.querySelector('p.intro'); if (introP) introP.style.display = 'none';
        const outroP = document.querySelector('p.outro'); if(outroP) outroP.style.display = 'none';
        if(progressIndicator) progressIndicator.style.display = 'none';
        if(restartButton) restartButton.style.display = 'block';
        setupDevControls();
        updateResultsFromDevControls();
    } else {
        initializeQuizState();
        loadQuestion();
    }
}); // End of DOMContentLoaded