// script.js (Linear 30-Question Quiz - CORRECTED AND SIMPLIFIED)
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

    // New UI Element References
    const restartButton = document.getElementById('restart-button');
    const backButton = document.getElementById('back-button');
    const themeSwitch = document.getElementById('theme-switch-checkbox');
    const copyResultsButton = document.getElementById('copy-results-button');
    const copyStatusElement = document.getElementById('copy-status');

    // Quiz State Variables
    let userScores = { c: 0, m: 0, p: 0 };
    // Recalculate these based on your final 30 questions using the calculateMinMaxRawScores function
    let minMaxRawScores = {
        c: { min: -20.25, max: 27.1 }, // Placeholder based on previous 24q + 6 new
        m: { min: -20.25, max: 29.0 }, // Placeholder
        p: { min: -20.25, max: 27.1 }  // Placeholder
    };
    
    let currentQuestionIndex = 0;
    let questionOrder = []; // To store shuffled order of question indices for the linear quiz
    let answerHistory = []; // For 'Back' button functionality

    let debounceTimer; // For dev mode sliders

    // --- DARK MODE LOGIC ---
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (themeSwitch) themeSwitch.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            if (themeSwitch) themeSwitch.checked = false;
        }
    }

    if (themeSwitch) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) { applyTheme(savedTheme); }
        else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { applyTheme('dark'); }
        else { applyTheme('light'); }
        themeSwitch.addEventListener('change', function() {
            const newTheme = this.checked ? 'dark' : 'light';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
        if (window.matchMedia) {
             window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem('theme')) { applyTheme(e.matches ? 'dark' : 'light'); }
            });
        }
    } else { if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { applyTheme('dark');} }
    
    // --- QUIZ INITIALIZATION & STATE MANAGEMENT ---
    function initializeQuizState() {
        userScores = { c: 0, m: 0, p: 0 };
        currentQuestionIndex = 0;
        answerHistory = [];
        
        if (typeof questions !== 'undefined' && questions.length > 0) {
            questionOrder = shuffleArray([...Array(questions.length).keys()]);
        } else {
            questionOrder = [];
        }
        
        console.log("Quiz state initialized/reset for linear quiz.");
        if (resultsArea) resultsArea.style.display = 'none';
        if (quizArea) quizArea.style.display = 'block';
        if (devControlsContainer && devControlsContainer.parentNode) {
            devControlsContainer.parentNode.removeChild(devControlsContainer);
        }
        if(progressIndicator) progressIndicator.style.display = 'block';
        if(nextButton) nextButton.disabled = false;
        if(restartButton) restartButton.style.display = 'none'; 
        if(backButton) backButton.style.display = 'none'; 
    }

    // --- DEV MODE CHECK & INITIALIZATION ---
    const urlParams = new URLSearchParams(window.location.search);
    const isDevMode = urlParams.get('dev') === 'true';

    if (isDevMode) {
        console.log("Developer Mode Activated");
        if(quizArea) quizArea.style.display = 'none'; if(resultsArea) resultsArea.style.display = 'block';
        const mainHeading = document.querySelector('.container h1'); if (mainHeading) mainHeading.textContent += " (Dev Mode)";
        const introP = document.querySelector('p.intro'); if (introP) introP.style.display = 'none';
        const outroP = document.querySelector('p.outro'); if(outroP) outroP.style.display = 'none';
        if(progressIndicator) progressIndicator.style.display = 'none';
        if(restartButton) restartButton.style.display = 'block'; 

        setupDevControls();
        calculateMinMaxRawScores(); // Calculate based on the single `questions` array
        updateResultsFromDevControls();
    } else {
        if (typeof questions === 'undefined' || questions.length === 0) {
            alert("Error: Questions not loaded. Cannot start quiz.");
            if(questionTextElement) questionTextElement.innerHTML = "Error loading questions. Please check console.";
            if(nextButton) nextButton.disabled = true; return;
        }
        calculateMinMaxRawScores();
        initializeQuizState(); 
        loadQuestion();
    }

    // --- CORE QUIZ FUNCTIONS (FOR LINEAR QUIZ) ---
    function calculateMinMaxRawScores() {
        minMaxRawScores = { c: { min: 0, max: 0 }, m: { min: 0, max: 0 }, p: { min: 0, max: 0 } };
        if (typeof questions !== 'undefined' && questions.length > 0) {
            questions.forEach(q => {
                if (q && q.options && q.options.length > 0) {
                    let cScoresInQ = q.options.map(opt => opt.scores.c);
                    let mScoresInQ = q.options.map(opt => opt.scores.m);
                    let pScoresInQ = q.options.map(opt => opt.scores.p);
                    minMaxRawScores.c.min += Math.min(...cScoresInQ);
                    minMaxRawScores.c.max += Math.max(...cScoresInQ);
                    minMaxRawScores.m.min += Math.min(...mScoresInQ);
                    minMaxRawScores.m.max += Math.max(...mScoresInQ);
                    minMaxRawScores.p.min += Math.min(...pScoresInQ);
                    minMaxRawScores.p.max += Math.max(...pScoresInQ);
                }
            });
        } else { 
             minMaxRawScores = { c: { min: -25, max: 35 }, m: { min: -25, max: 35 }, p: { min: -25, max: 35 } }; // Generic fallback
        }
        console.log("Calculated Min/Max Raw Scores for linear quiz:", minMaxRawScores);
    }

    function loadQuestion() {
        if (currentQuestionIndex < questions.length) {
            const actualQuestionIndexInFullList = questionOrder[currentQuestionIndex];
            const currentQuestionObject = questions[actualQuestionIndexInFullList];
            
            if(questionTextElement) questionTextElement.innerHTML = `Q${currentQuestionIndex + 1} (${questions.length} total): ${currentQuestionObject.text}`;
            if(optionsContainer) optionsContainer.innerHTML = '';
            
            const previousAnswerForThisStep = answerHistory.find(hist => hist.questionOrderIndex === currentQuestionIndex);
            
            const displayOptions = shuffleArray(currentQuestionObject.options); 

            displayOptions.forEach((optionData, displayIndex) => {
                const inputId = `q_opt_disp${displayIndex}_${currentQuestionIndex}`;
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = `q_options_${currentQuestionIndex}`; 
                input.id = inputId;
                input.value = JSON.stringify(optionData.scores);
                input.dataset.originalOptionText = optionData.text; // For re-selecting with "Back"

                if (previousAnswerForThisStep && optionData.text === previousAnswerForThisStep.selectedOptionText) {
                    input.checked = true;
                }
                
                const label = document.createElement('label');
                label.htmlFor = inputId;
                label.textContent = optionData.text;
                if(optionsContainer) { optionsContainer.appendChild(input); optionsContainer.appendChild(label); }
            });

            if(progressIndicator) progressIndicator.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
            if(nextButton) nextButton.textContent = (currentQuestionIndex + 1 === questions.length) ? "Finish & See My Glorious Doom" : "Next";
            if(backButton) backButton.style.display = (currentQuestionIndex > 0 && answerHistory.length > 0) ? 'inline-block' : 'none';
            if(restartButton && (currentQuestionIndex > 0 || (resultsArea && resultsArea.style.display === 'block'))) restartButton.style.display = 'inline-block'; else if(restartButton) restartButton.style.display = 'none';
        } else {
            showResults();
        }
    }
    
    function getSelectedOptionData() { // Simpler name for linear
        const radioGroupName = `q_options_${currentQuestionIndex}`;
        const selectedRadio = document.querySelector(`input[name="${radioGroupName}"]:checked`);
        if (selectedRadio) {
            try {
                const scores = JSON.parse(selectedRadio.value);
                const text = selectedRadio.dataset.originalOptionText || selectedRadio.nextElementSibling.textContent;
                return { scores: scores, text: text };
            }
            catch (e) { console.error("Error parsing scores from radio value:", selectedRadio.value, e); return null; }
        }
        return null;
    }

    // --- BUTTON EVENT LISTENERS ---
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const selectedData = getSelectedOptionData();
            if (selectedData && selectedData.scores) {
                const questionJustAnswered = questions[questionOrder[currentQuestionIndex]];
                
                // Check if we are re-answering a question (after going back)
                // If currentQuestionIndex is already in answerHistory, we might need to adjust.
                // For simplicity, this version assumes "Next" always moves forward and adds to history.
                // A more robust "Back" might require removing a future history if an earlier answer changes.
                // For now, we just push.
                answerHistory.push({
                    questionOrderIndex: currentQuestionIndex, // Index in the shuffled questionOrder
                    questionId: questionJustAnswered.id,
                    selectedOptionText: selectedData.text,
                    scoresGiven: JSON.parse(JSON.stringify(selectedData.scores)) 
                });

                userScores.c += selectedData.scores.c;
                userScores.m += selectedData.scores.m;
                userScores.p += selectedData.scores.p;
                
                currentQuestionIndex++;
                console.log(`Answered Q ${currentQuestionIndex}. Raw scores: C=${userScores.c.toFixed(2)}, M=${userScores.m.toFixed(2)}, P=${userScores.p.toFixed(2)}`);
                loadQuestion(); 
            } else {
                if (currentQuestionIndex < questions.length) { 
                     alert("Please select an option before proceeding, you indecisive wretch!");
                } else { 
                    showResults();
                }
            }
        });
    }

    if (restartButton) {
        restartButton.addEventListener('click', () => {
            console.log("Restart button clicked.");
            if (isDevMode || confirm("Are you sure you want to restart the quiz? Your current progress will be lost.")) {
                initializeQuizState();
                loadQuestion();
            }
        });
    }

    if (backButton) {
        backButton.addEventListener('click', () => {
            if (currentQuestionIndex > 0 && answerHistory.length > 0) {
                // Find the history entry for the question we are going *back to*
                // This simple back just reverts the *last* answered question.
                const lastAnswerRecord = answerHistory.pop();
                if (lastAnswerRecord) {
                    console.log("Going back. Reverting scores for:", lastAnswerRecord);
                    userScores.c -= lastAnswerRecord.scoresGiven.c;
                    userScores.m -= lastAnswerRecord.scoresGiven.m;
                    userScores.p -= lastAnswerRecord.scoresGiven.p;
                    
                    currentQuestionIndex--; // This is the index for questionOrder array
                    
                    console.log(`State reverted for back: Displaying Q ${currentQuestionIndex + 1}. Raw: C=${userScores.c.toFixed(2)}, M=${userScores.m.toFixed(2)}, P=${userScores.p.toFixed(2)}`);
                    loadQuestion(); // Reloads the previous question, re-selects option via history peek
                }
            } else {
                console.log("No history to go back to, or at the first question.");
                if(backButton) backButton.style.display = 'none';
            }
        });
    }
    
    if (copyResultsButton && copyStatusElement) {
        copyResultsButton.addEventListener('click', () => { 
            let resultsText = "My Sarcastic Political Test Results:\n\n";
            const ideologyLabelEl = document.getElementById('ideology-label-result');
            const ideologySummaryEl = document.getElementById('ideology-summary-result');
            const normalizedScoresEl = document.getElementById('normalized-scores');
            if (ideologyLabelEl) resultsText += ideologyLabelEl.innerText.replace(/<br>/g, "\n") + "\n\n";
            if (ideologySummaryEl) resultsText += "Summary: " + ideologySummaryEl.textContent + "\n\n";
            if (normalizedScoresEl) {
                let normScoresText = normalizedScoresEl.innerHTML.replace(/<br\s*\/?>/gi, "\n");
                normScoresText = normScoresText.replace(/<\/?[^>]+(>|$)/g, ""); resultsText += normScoresText + "\n";
            }
            resultsText += "\nTake the test: " + window.location.href.split('?')[0]; 
            navigator.clipboard.writeText(resultsText).then(() => {
                copyStatusElement.textContent = "Results copied to clipboard!";
                setTimeout(() => { copyStatusElement.textContent = ""; }, 3000);
            }).catch(err => { copyStatusElement.textContent = "Failed to copy. Please copy manually."; console.error('Failed to copy results: ', err); });
        });
    }

    // --- NORMALIZATION, DEV CONTROLS, DISPLAY, PLOT, IDEOLOGY LOGIC ---
    function normalizeScores(rawScores, minMax) { 
        let rangeC = minMax.c.max - minMax.c.min; let rangeM = minMax.m.max - minMax.m.min; let rangeP = minMax.p.max - minMax.p.min;
        if (rangeC === 0) rangeC = 1; if (rangeM === 0) rangeM = 1; if (rangeP === 0) rangeP = 1;
        let normC_intermediate = (rawScores.c - minMax.c.min) / rangeC;
        let normM_intermediate = (rawScores.m - minMax.m.min) / rangeM;
        let normP_intermediate = (rawScores.p - minMax.p.min) / rangeP;
        normC_intermediate = Math.max(0, Math.min(1, normC_intermediate)); // Clamp between 0 and 1
        normM_intermediate = Math.max(0, Math.min(1, normM_intermediate));
        normP_intermediate = Math.max(0, Math.min(1, normP_intermediate));
        const totalIntermediate = normC_intermediate + normM_intermediate + normP_intermediate;
        if (totalIntermediate === 0) return { c: 33.33, m: 33.33, p: 33.34 };
        let normC = (normC_intermediate / totalIntermediate) * 100;
        let normM = (normM_intermediate / totalIntermediate) * 100;
        let normP = (normP_intermediate / totalIntermediate) * 100;
        normC = parseFloat(normC.toFixed(2)); normM = parseFloat(normM.toFixed(2));
        normP = parseFloat((100.0 - normC - normM).toFixed(2));
        if (normP < 0) { // Handle potential negative P after toFixed C and M
            normP = 0.00;
            let sumCM = normC + normM;
            if (sumCM > 100) { // If C+M is over 100, rescale them to sum to 100
                 normC = parseFloat(((normC / sumCM) * 100).toFixed(2));
                 normM = parseFloat((100 - normC).toFixed(2));
            } else if (sumCM < 100 && sumCM > 0) { // if C+M < 100, P was negative for other reasons, error
                // This state should be rare with proper clamping and sum-to-100 logic
            } else if (sumCM === 0) { // if both C and M are 0, P should be 100
                 normP = 100.00; // this case not handled above well
            }
        }
         // Final ensure P is not negative and re-calculate based on C and M which are more fixed by toFixed
        normP = parseFloat(Math.max(0, 100.0 - normC - normM).toFixed(2));

        return { c: normC, m: normM, p: normP };
    }

    function setupDevControls() { /* ... (Same as adaptive version, with debouncing) ... */ 
        devControlsContainer.innerHTML = `<h3>Developer Controls (Normalized Scores %)</h3><div><label for="devC">Centralism (C):</label><input type="range" id="devC" min="0" max="100" value="33.3" step="0.1"><span id="devCValue">33.3%</span></div><div><label for="devM">Communalism (M):</label><input type="range" id="devM" min="0" max="100" value="33.3" step="0.1"><span id="devMValue">33.3%</span></div><div><label for="devP">Privatism (P):</label><input type="range" id="devP" min="0" max="100" value="33.4" step="0.1"><span id="devPValue">33.4%</span></div><p style="font-size:0.8em; color: #555;">Note: Sliders directly set normalized % for ideology test.</p>`;
        if (resultsArea && rawScoresElement) resultsArea.insertBefore(devControlsContainer, rawScoresElement);
        const devCInput = document.getElementById('devC'), devMInput = document.getElementById('devM'), devPInput = document.getElementById('devP');
        const devCValueSpan = document.getElementById('devCValue'), devMValueSpan = document.getElementById('devMValue'), devPValueSpan = document.getElementById('devPValue');
        function updateSliderDisplay() {
            if(devCValueSpan && devCInput) devCValueSpan.textContent = `${parseFloat(devCInput.value).toFixed(1)}%`;
            if(devMValueSpan && devMInput) devMValueSpan.textContent = `${parseFloat(devMInput.value).toFixed(1)}%`;
            if(devPValueSpan && devPInput) devPValueSpan.textContent = `${parseFloat(devPInput.value).toFixed(1)}%`;
        }
        [devCInput, devMInput, devPInput].forEach(input => { if(input) input.addEventListener('input', () => { updateSliderDisplay(); clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { updateResultsFromDevControls(); }, 200); }); });
        updateSliderDisplay();
    }

    function updateResultsFromDevControls() { /* ... (Same as adaptive, but minMax for mocked raw is global) ... */ 
        const devC_raw_percent = parseFloat(document.getElementById('devC').value); const devM_raw_percent = parseFloat(document.getElementById('devM').value); const devP_raw_percent = parseFloat(document.getElementById('devP').value);
        let totalInput = devC_raw_percent + devM_raw_percent + devP_raw_percent;
        let normalizedForPlot = {c:33.33, m:33.33, p:33.34}; // Default
        if(totalInput === 0) { /* use default */ } 
        else { normalizedForPlot = {c: (devC_raw_percent/totalInput)*100, m: (devM_raw_percent/totalInput)*100, p: (devP_raw_percent/totalInput)*100 }; }
        
        normalizedForPlot.c = parseFloat(Math.min(100, Math.max(0, normalizedForPlot.c)).toFixed(2));
        normalizedForPlot.m = parseFloat(Math.min(100, Math.max(0, normalizedForPlot.m)).toFixed(2));
        normalizedForPlot.p = parseFloat(Math.min(100, Math.max(0, 100.0 - normalizedForPlot.c - normalizedForPlot.m)).toFixed(2));
        let finalSumCheck = normalizedForPlot.c + normalizedForPlot.m + normalizedForPlot.p;
        if (Math.abs(finalSumCheck - 100.0) > 0.03) { normalizedForPlot.p = parseFloat((100.0 - normalizedForPlot.c - normalizedForPlot.m).toFixed(2));}
        if (normalizedForPlot.p < 0) normalizedForPlot.p = 0.00;
        if (normalizedForPlot.c + normalizedForPlot.m + normalizedForPlot.p > 100.03 || normalizedForPlot.c + normalizedForPlot.m + normalizedForPlot.p < 99.97) {
             normalizedForPlot.p = Math.max(0, parseFloat((100.0 - normalizedForPlot.c - normalizedForPlot.m).toFixed(2)));
        }
        normalizedForPlot.c = parseFloat(normalizedForPlot.c.toFixed(2)); normalizedForPlot.m = parseFloat(normalizedForPlot.m.toFixed(2)); normalizedForPlot.p = parseFloat(normalizedForPlot.p.toFixed(2));

        userScores.c = (normalizedForPlot.c / 100) * (minMaxRawScores.c.max - minMaxRawScores.c.min) + minMaxRawScores.c.min; 
        userScores.m = (normalizedForPlot.m / 100) * (minMaxRawScores.m.max - minMaxRawScores.m.min) + minMaxRawScores.m.min; 
        userScores.p = (normalizedForPlot.p / 100) * (minMaxRawScores.p.max - minMaxRawScores.p.min) + minMaxRawScores.p.min;
        if (rawScoresElement) rawScoresElement.innerHTML = `Raw Scores (Mocked for Dev Mode):<br>C: ${userScores.c.toFixed(2)}, M: ${userScores.m.toFixed(2)}, P: ${userScores.p.toFixed(2)}`;
        if (normalizedScoresElement) normalizedScoresElement.innerHTML = `Normalized Scores (from sliders, re-normalized to sum 100%):<br>C: ${normalizedForPlot.c.toFixed(2)}%, M: ${normalizedForPlot.m.toFixed(2)}%, P: ${normalizedForPlot.p.toFixed(2)}%`;
        const ideologyInfo = getIdeologyLabelAndSarcasm(normalizedForPlot.c, normalizedForPlot.m, normalizedForPlot.p);
        displayIdeologyInfo(ideologyInfo);
        let plotTitleLabel = ideologyInfo.specific || "Political Profile";
        const genericKeywords = ["(General)", "Tendencies", "Eclectic", "Uncategorized", "Outlook", "(Undifferentiated)"];
        if (genericKeywords.some(keyword => ideologyInfo.specific && ideologyInfo.specific.includes(keyword)) && ideologyInfo.broadCategory && ideologyInfo.broadCategory !== "Unclassifiable" && ideologyInfo.broadCategory !== ideologyInfo.specific) { plotTitleLabel = ideologyInfo.broadCategory; }
        else if (plotTitleLabel === "Uncategorized" || (ideologyInfo.broadCategory && ideologyInfo.broadCategory === "Unclassifiable") || (ideologyInfo.specific && ideologyInfo.specific.includes("Outlook"))) { plotTitleLabel = "Political Profile Explorer"; }
        drawPlot(normalizedForPlot, plotTitleLabel);
    }

    function displayIdeologyInfo(ideologyInfo) { /* ... (Same as adaptive version) ... */ 
        let ideologyLabelElement = document.getElementById('ideology-label-result');
        if (!ideologyLabelElement) { ideologyLabelElement = document.createElement('h3'); ideologyLabelElement.id = 'ideology-label-result'; if(normalizedScoresElement && normalizedScoresElement.parentNode) { normalizedScoresElement.parentNode.insertBefore(ideologyLabelElement, normalizedScoresElement.nextSibling); } else if (resultsArea) { resultsArea.appendChild(ideologyLabelElement); }}
        if(ideologyLabelElement) { if (ideologyInfo.specific && ideologyInfo.broadCategory && ideologyInfo.specific !== ideologyInfo.broadCategory && ideologyInfo.broadCategory !== "Unclassifiable" && ideologyInfo.specific !== "Uncategorized") { ideologyLabelElement.innerHTML = `Political Profile:<br><b>Specific Ideology:</b> ${ideologyInfo.specific}<br><b>Broad Category:</b> ${ideologyInfo.broadCategory}`; } else if (ideologyInfo.specific && ideologyInfo.specific !== "Uncategorized") { ideologyLabelElement.innerHTML = `Political Profile:<br><b>Ideology:</b> ${ideologyInfo.specific}`; } else { ideologyLabelElement.innerHTML = `Political Profile:<br><b>Category:</b> ${ideologyInfo.broadCategory || "Not Determined"}`; }}
        let ideologySummaryElement = document.getElementById('ideology-summary-result');
        if (!ideologySummaryElement) { ideologySummaryElement = document.createElement('p'); ideologySummaryElement.id = 'ideology-summary-result'; ideologySummaryElement.style.fontStyle = 'italic'; ideologySummaryElement.style.border = '1px dashed #ccc'; ideologySummaryElement.style.padding = '10px'; if (ideologyLabelElement && ideologyLabelElement.parentNode) { ideologyLabelElement.parentNode.insertBefore(ideologySummaryElement, ideologyLabelElement.nextSibling); } else if (resultsArea) { resultsArea.appendChild(ideologySummaryElement); }}
        if(ideologySummaryElement) ideologySummaryElement.textContent = ideologyInfo.summary;
    }

    function showResults() { /* ... (Same as adaptive version, but no branch complexity) ... */ 
        console.log("Showing results. Final Raw Scores:", userScores);
        if(quizArea) quizArea.style.display = 'none'; if(resultsArea) resultsArea.style.display = 'block';
        if(progressIndicator) progressIndicator.style.display = 'none'; if(restartButton) restartButton.style.display = 'block'; 
        if(backButton) backButton.style.display = 'none';
        const finalNormalizedScores = normalizeScores(userScores, minMaxRawScores);
        console.log("Final Normalized Scores:", finalNormalizedScores);
        if(rawScoresElement) rawScoresElement.innerHTML = `Raw Scores (End of Quiz):<br>C: ${userScores.c.toFixed(2)}, M: ${userScores.m.toFixed(2)}, P: ${userScores.p.toFixed(2)}`;
        if(normalizedScoresElement) normalizedScoresElement.innerHTML = `Normalized Scores (Final):<br>C: ${finalNormalizedScores.c.toFixed(2)}%, M: ${finalNormalizedScores.m.toFixed(2)}%, P: ${finalNormalizedScores.p.toFixed(2)}%`;
        const ideologyInfo = getIdeologyLabelAndSarcasm(finalNormalizedScores.c, finalNormalizedScores.m, finalNormalizedScores.p);
        displayIdeologyInfo(ideologyInfo);
        let plotTitleLabel = ideologyInfo.specific || "Your Political Profile";
        const genericKeywords = ["(General)", "Tendencies", "Eclectic", "Uncategorized", "Outlook", "(Undifferentiated)"];
        if (genericKeywords.some(keyword => ideologyInfo.specific && ideologyInfo.specific.includes(keyword)) && ideologyInfo.broadCategory && ideologyInfo.broadCategory !== "Unclassifiable" && ideologyInfo.broadCategory !== ideologyInfo.specific) { plotTitleLabel = ideologyInfo.broadCategory; }
        else if (plotTitleLabel === "Uncategorized" || (ideologyInfo.broadCategory && ideologyInfo.broadCategory === "Unclassifiable") || (ideologyInfo.specific && ideologyInfo.specific.includes("Outlook"))) { plotTitleLabel = "Your Political Profile"; }
        drawPlot(finalNormalizedScores, plotTitleLabel);
    }

    function drawPlot(normalized, ideologyLabel = "Your Position") { /* ... (Same as adaptive version) ... */ 
        const plotDiv = document.getElementById('plot-div'); if (!plotDiv || typeof Plotly === 'undefined') { console.error("Plot div or Plotly missing."); return; }
        const plotC = isNaN(normalized.c) ? 33.33 : normalized.c; const plotM = isNaN(normalized.m) ? 33.33 : normalized.m; const plotP = isNaN(normalized.p) ? 33.34 : normalized.p;
        const plotData = [{ type: 'scatterternary', mode: 'markers', a: [plotC], b: [plotM], c: [plotP], name: 'Your Position', text: [`C: ${plotC.toFixed(1)}%<br>M: ${plotM.toFixed(1)}%<br>P: ${plotP.toFixed(1)}%`], hoverinfo: 'text', marker: { symbol: 'circle', color: '#FF0000', size: 14, line: { width: 1, color: '#880000' } } }];
        const layout = { title: `Political Profile: ${ideologyLabel}`, ternary: { sum: 100, aaxis: { title: '<b>Centralism</b><br>(Big Brother is Watching)', min: 0, linewidth: 2, ticks: 'outside' }, baxis: { title: '<b>Communalism</b><br>(Endless Group Hugs)', min: 0, linewidth: 2, ticks: 'outside' }, caxis: { title: '<b>Privatism</b><br>(Every Man for Himself)', min: 0, linewidth: 2, ticks: 'outside' }, bgcolor: '#f0f0f0' }, annotations: [{ showarrow: false, text: '*Not actually scientific. At all.', x: 0.5, y: -0.15, xref: 'paper', yref: 'paper', font: { size: 10, color: 'grey' } }], paper_bgcolor: '#fff', plot_bgcolor: '#fff', margin: { l: 70, r: 50, b: 100, t: 100, pad: 4 } };
        Plotly.newPlot('plot-div', plotData, layout);
     }

    // --- getIdeologyLabelAndSarcasm FUNCTION (Your latest version with all thresholds and summaries) ---
    function getIdeologyLabelAndSarcasm(normC_input, normM_input, normP_input) {
        let result = { broadCategory: "Unclassifiable", specific: "Uncategorized", summary: "You're a unique snowflake of political confusion... Embrace the chaos." };
        let normC = parseFloat(normC_input); let normM = parseFloat(normM_input); let normP = parseFloat(normP_input);
        if (isNaN(normC)) normC = 33.33; if (isNaN(normM)) normM = 33.33; if (isNaN(normP)) normP = 33.34;
        const dominant = 60; const veryDominantCorner = 68; const strong = 45; const moderate = 25;
        const weakCorner = 18; const weakGeneral = 15; const veryLowCorner = 12; const veryLowGeneral = 10;
        let sum = normC + normM + normP;
        if (Math.abs(sum - 100.0) > 0.01 && sum !== 0) { const scale = 100.0 / sum; normC *= scale; normM *= scale; normP = 100.0 - normC - normM; }
        normC = Math.max(0, Math.min(100, normC)); normM = Math.max(0, Math.min(100, normM)); normP = Math.max(0, Math.min(100, normP));
        normC = parseFloat(normC.toFixed(2)); normM = parseFloat(normM.toFixed(2)); normP = parseFloat((100.0 - normC - normM).toFixed(2));
        if (normP < 0) normP = 0.00;
        let finalSum = normC + normM + normP;
        if (Math.abs(finalSum - 100.0) > 0.03) { normP = parseFloat(Math.max(0, 100.0 - normC - normM).toFixed(2)); }
        normC = parseFloat(normC.toFixed(2)); normM = parseFloat(normM.toFixed(2)); normP = parseFloat(normP.toFixed(2));

        // --- PASTE YOUR FULL LATEST CLASSIFICATION LOGIC (IF/ELSE IF BLOCKS) HERE ---
        // Example structure (ensure this is your fully populated version):
        if (normC >= dominant && normM < strong && normP < strong) { /* Statism block */
            result.broadCategory = "Statism";
            if (normC >= veryDominantCorner && normM < weakCorner && normP < weakCorner) { result.specific = "Totalitarianism / Absolutism"; result.summary = "The State is your loving parent... (compulsory)."; }
            else if (normP >= weakGeneral && normP > normM && normM < moderate && normC >= strong) { result.specific = "Authoritarian Capitalism / Fascism (Economic Aspect)"; result.summary = "National glory! The trains run on time... last century."; }
            else if (normM >= weakGeneral && normM > normP && normP < moderate && normC >= strong) { result.specific = "State Communism / Marxism-Leninism"; result.summary = "The Party knows what's best... in the Politburo."; }
            else if (normC >= dominant + 10 && normM < moderate && normP < moderate) { result.specific = "Hyper-Statism / Leviathan State"; result.summary = "You don't just love Big Brother... State will be watching you."; }
            else { result.specific = "Statism (General Authoritarian)"; result.summary = "Clearly, someone needs to be in charge... know what's best for everyone else."; }
        }
        else if (normM >= dominant && normC < moderate && normP < strong) { /* Libertarian Socialism block */
            result.broadCategory = "Libertarian Socialism / Social Anarchism";
            if (normM >= veryDominantCorner && normC < veryLowCorner && normP < weakCorner) { result.specific = "Anarcho-Communism"; result.summary = "No gods, no masters... protest zines is sacrosanct."; }
            else if (normC < veryLowGeneral && normP >= weakGeneral && normP < moderate) { result.specific = "Anarcho-Syndicalism / Collectivist Anarchism"; result.summary = "Workers of the world, unite!... one general strike at a time."; }
            else if (normC >= veryLowGeneral && normC < weakGeneral + 5 && normP < moderate) { result.specific = "Council Communism / Libertarian Municipalism"; result.summary = "Power to the workers' councils... (and zoning debates)?"; }
            else { result.specific = "Libertarian Socialism (General)"; result.summary = "Let's smash oppression... definition of 'free association'."; }
        }
        else if (normP >= dominant && normC < strong && normM < strong) { /* Propertarianism block */
            result.broadCategory = "Propertarianism / Individualist Libertarianism";
            if (normP >= veryDominantCorner && normC < veryLowCorner && normM < weakCorner) { result.specific = "Anarcho-Capitalism"; result.summary = "The Non-Aggression Principle is our one true god... Eventually. Maybe."; }
            else if (normC >= veryLowGeneral && normC < moderate && normM < weakGeneral) { result.specific = "Minarchism / Night-Watchman State"; result.summary = "The government should do one thing... Night-watchman state, activate!"; }
            else if (normC < veryLowGeneral && normM >= weakGeneral && normM < moderate) { result.specific = "Agorism / Counter-Economics"; result.summary = "The state is illegitimate... one untaxed transaction at a time."; }
            else if (normP >= dominant + 10 && normC < moderate && normM < moderate) { result.specific = "Radical Propertarianism / Hoppeanism (Economic Aspect)"; result.summary = "Private property über alles!... It's efficient!"; }
            else { result.specific = "Libertarianism (Right-Libertarian / Propertarian General)"; result.summary = "Don't tread on me... (preferably not at all)."; }
        }
        else if (normC >= moderate && normM >= moderate && normP < moderate && normC < dominant && normM < dominant) { /* Authoritarian Socialism block */
            result.broadCategory = "Authoritarian Socialism / State Collectivism";
            if (normC > normM + 10 && normM >= moderate) { result.specific = "State Socialism (Centralized Planning Focus)"; result.summary = "The State will provide all your needs... Innovation is... discouraged."; }
            else if (normM > normC + 10 && normC >= moderate) { result.specific = "Collectivist Statism (Community-Oriented but State-Led)"; result.summary = "We're all in this glorious collective... enthusiasm is encouraged (and monitored)."; }
            else if (Math.abs(normC - normM) <= 10 && normC >= strong - 5 && normM >= strong - 5) { result.specific = "National Syndicalism (Non-Fascist) / Guild Socialism (State-Backed)"; result.summary = "Society neatly organized into state-approved... less chance of contracting the plague. Probably."; }
            else { result.specific = "Authoritarian Socialism (General)"; result.summary = "Socialism: so good, it has to be mandatory!... whether they want to or not."; }
        }
        else if (normM >= moderate && normP >= moderate && normC < veryLowGeneral + 5 && normM < dominant && normP < dominant) { /* Individualist Anarchism block */
            result.broadCategory = "Individualist Anarchism";
            if (Math.abs(normM - normP) < 15 && normM > moderate - 5 && normP > moderate - 5) { result.specific = "Mutualism (Proudhonian Anarchism)"; result.summary = "Fair exchange is no robbery... might actually work this time?"; }
            else if (normP > normM && normM >= moderate - 5) { result.specific = "Market Anarchism (Individualist Tradition)"; result.summary = "Liberty, property, and no state!... besides everything?"; }
            else if (normM > normP && normP >= moderate - 5) { result.specific = "Communal Individualism / Egoism (Stirnerite, in voluntary association)"; result.summary = "My will is my only law!... Don't get any ideas."; }
            else { result.specific = "Individualist Anarchism (General)"; result.summary = "Leave me alone to do my thing!... thank you very much."; }
        }
        else if (normC >= moderate && normP >= moderate && normM < moderate && normC < dominant && normP < dominant) { /* Classical Liberalism block */
            result.broadCategory = "Classical Liberalism / Constitutionalism";
            if (normP > normC + 10 && normC >= moderate - 5) { result.specific = "Classical Liberalism (Lockean/Smithian)"; result.summary = "Life, liberty, property... sort out the rest... hopefully."; }
            else if (normC > normP + 10 && normP >= moderate - 5) { result.specific = "Traditional Conservatism (Burkean / Constitutional)"; result.summary = "Change is bad, tradition is good... Pass the sherry."; }
            else if (Math.abs(normC - normP) <= 10 && normC >= strong - 5 && normP >= strong - 5) { result.specific = "Constitutional Republicanism / Conservative Liberalism"; result.summary = "A well-ordered republic... *right sort* of people."; }
            else { result.specific = "Liberalism (General Constitutional)"; result.summary = "We believe in rights, laws... It's all very reasonable, until it isn't."; }
        }
        else if (normC >= moderate && normC < strong + 5 && normM >= moderate && normM < strong + 5 && normP >= moderate && normP < strong + 5 && (Math.max(normC, normM, normP) - Math.min(normC, normM, normP)) < 25) { /* Centrism block */
            result.broadCategory = "Centrism / Mixed Economy Ideologies";
            if (normM > normC && normM > normP && normM > Math.max(normC, normP) + 5) { result.specific = "Social Democracy"; result.summary = "Capitalism needs a good hug... (and probably higher taxes)."; }
            else if (normP > normC && normP > normM && normP > Math.max(normC, normP) + 5) { result.specific = "Market-Oriented Liberalism / Third Way"; result.summary = "We're 'radically pragmatic!... actual Labour part."; }
            else if (normC > normM && normC > normP && normC > Math.max(normM, normP) + 5) { result.specific = "Technocratic / Managerial Liberalism"; result.summary = "Society is a complex machine... have you seen our spreadsheets?"; }
            else { result.specific = "Social Liberalism / Progressive Liberalism"; result.summary = "Let's blend individual liberty... 'social market economy' with extra rights."; }
        }
        else { /* Fallback block */
            if (result.specific === "Uncategorized") { 
                if (normC >= strong) { result.broadCategory = "Statism"; result.specific = "Statism (Undifferentiated)"; result.summary = "You've got a definite 'someone should be in charge' vibe... More rules! More order! Probably!"; }
                else if (normM >= strong && normC < moderate) { result.broadCategory = "Libertarian Socialism / Social Anarchism"; result.specific = "Libertarian Socialism (Undifferentiated)"; result.summary = "Power to the people, or the commune, or something!... Details TBD."; }
                else if (normP >= strong && normC < moderate) { result.broadCategory = "Propertarianism / Individualist Libertarianism"; result.specific = "Propertarianism (Undifferentiated)"; result.summary = "It's all about ME and MY STUFF... large fence and low taxes."; }
                else if (normC >= moderate && normM >= moderate && normP < moderate) { result.broadCategory = "Authoritarian Socialism / State Collectivism"; result.specific = "Authoritarian Socialism (Undifferentiated)"; result.summary = "You like your socialism with a side of 'do as you're told.'... centrally managed."; }
                else if (normM >= moderate && normP >= moderate && normC < moderate) { result.broadCategory = "Individualist Anarchism"; result.specific = "Individualist Anarchism (Undifferentiated)"; result.summary = "You're not a fan of the state... co-op membership."; }
                else if (normC >= moderate && normP >= moderate && normM < moderate) { result.broadCategory = "Classical Liberalism / Constitutionalism"; result.specific = "Liberalism (Undifferentiated)"; result.summary = "You're into rights, reason... old-fashioned, choice."; }
                else { result.specific = "Mixed / Eclectic Political Outlook"; result.summary = "You've taken a 'one from column A, one from column B' approach... The world may never know."; }
            }
        }
        return result;
    }

}); // End of DOMContentLoaded