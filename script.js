// script.js (Adaptive Version - Branched Tier 3 + UI Features)
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
    let minMaxRawScores = { // Pre-calculated estimates
        c: { min: -20.25, max: 27.1 }, m: { min: -20.25, max: 29.0 }, p: { min: -20.25, max: 27.1 }
    };
    
    let currentTier = 1;
    let currentQuestionIndexInTier = 0;
    let currentBranch = null; 
    let currentQuestionSet = []; 
    let questionsAnsweredInQuiz = 0;
    let answerHistory = []; 

    // Check if question arrays are defined (must be global in questions.js)
    const T1_Q_LEN = (typeof TIER1_QUESTIONS !== 'undefined' ? TIER1_QUESTIONS.length : 0);
    const T2_BRANCH_LEN = (typeof TIER2_C_PATH_QUESTIONS !== 'undefined' ? TIER2_C_PATH_QUESTIONS.length : 0); 
    const T3_BRANCH_LEN = (typeof TIER3_C_PATH_DEALBREAKERS_FINAL !== 'undefined' ? TIER3_C_PATH_DEALBREAKERS_FINAL.length : 0);
    const TOTAL_QUESTIONS_PER_USER = T1_Q_LEN + T2_BRANCH_LEN + T3_BRANCH_LEN;


    let debounceTimer;

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
        userScores = { c: 0, m: 0, p: 0 }; currentTier = 1; currentQuestionIndexInTier = 0;
        currentBranch = null; questionsAnsweredInQuiz = 0; answerHistory = []; 
        if (typeof TIER1_QUESTIONS !== 'undefined') currentQuestionSet = TIER1_QUESTIONS; else currentQuestionSet = [];
        console.log("Quiz state initialized/reset.");
        if (resultsArea) resultsArea.style.display = 'none';
        if (quizArea) quizArea.style.display = 'block';
        if (devControlsContainer && devControlsContainer.parentNode) { devControlsContainer.parentNode.removeChild(devControlsContainer); }
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
        if(progressIndicator) progressIndicator.style.display = 'none'; if(restartButton) restartButton.style.display = 'block'; 
        setupDevControls(); updateResultsFromDevControls();
    } else {
        if (typeof TIER1_QUESTIONS === 'undefined' || TIER1_QUESTIONS.length === 0) {
            alert("Error: Core questions not loaded. Cannot start quiz.");
            if(questionTextElement) questionTextElement.innerHTML = "Error loading questions. Please check console.";
            if(nextButton) nextButton.disabled = true; return;
        }
        initializeQuizState(); loadQuestion();
    }

    // --- BRANCHING LOGIC ---
    function determineBranch(c_norm, m_norm, p_norm) {
        const dominantThresh = 45; const lowThreshForBranch = 28; const veryLowCForAnarchist = 22; 
        const balancedUpper = 48; const balancedLower = 22; const balancedSpread = 20; const moderate = 25; 
        console.log(`Branching on (Norm. T1 Scores): C=${c_norm.toFixed(1)}%, M=${m_norm.toFixed(1)}%, P=${p_norm.toFixed(1)}%`);
        if (c_norm >= dominantThresh && m_norm < lowThreshForBranch && p_norm < lowThreshForBranch) { console.log("Branching to C_PATH"); return "C_PATH"; }
        else if (m_norm >= dominantThresh && c_norm < veryLowCForAnarchist && p_norm < lowThreshForBranch + 5) { console.log("Branching to M_PATH"); return "M_PATH"; }
        else if (p_norm >= dominantThresh && c_norm < veryLowCForAnarchist && m_norm < lowThreshForBranch + 5) { console.log("Branching to P_PATH"); return "P_PATH"; }
        else if (c_norm >= balancedLower && c_norm <= balancedUpper && m_norm >= balancedLower && m_norm <= balancedUpper && p_norm >= balancedLower && p_norm <= balancedUpper && (Math.max(c_norm, m_norm, p_norm) - Math.min(c_norm, m_norm, p_norm)) < balancedSpread) { console.log("Branching to X_PATH"); return "X_PATH"; }
        else {
            if (c_norm > m_norm && c_norm > p_norm && c_norm > balancedLower) { console.log("Branching to C_PATH (Fallback)"); return "C_PATH"; }
            else if (m_norm > c_norm && m_norm > p_norm && m_norm > balancedLower && c_norm < moderate) { console.log("Branching to M_PATH (Fallback)"); return "M_PATH"; }
            else if (p_norm > c_norm && p_norm > m_norm && p_norm > balancedLower && c_norm < moderate) { console.log("Branching to P_PATH (Fallback)"); return "P_PATH"; }
            console.log("Branching to X_PATH (General Fallback)"); return "X_PATH";
        }
    }
    
    function getQuestionSetByRefName(refName) {
        if (!refName) return null;
        switch(refName.toUpperCase()) { // Make it case-insensitive
            case 'TIER1_QUESTIONS': return TIER1_QUESTIONS;
            case 'TIER2_C_PATH_QUESTIONS': return TIER2_C_PATH_QUESTIONS;
            case 'TIER2_M_PATH_QUESTIONS': return TIER2_M_PATH_QUESTIONS;
            case 'TIER2_P_PATH_QUESTIONS': return TIER2_P_PATH_QUESTIONS;
            case 'TIER2_X_PATH_QUESTIONS': return TIER2_X_PATH_QUESTIONS;
            case 'TIER3_C_PATH_DEALBREAKERS_FINAL': return TIER3_C_PATH_DEALBREAKERS_FINAL;
            case 'TIER3_M_PATH_DEALBREAKERS_FINAL': return TIER3_M_PATH_DEALBREAKERS_FINAL;
            case 'TIER3_P_PATH_DEALBREAKERS_FINAL': return TIER3_P_PATH_DEALBREAKERS_FINAL;
            case 'TIER3_X_PATH_DEALBREAKERS_FINAL': return TIER3_X_PATH_DEALBREAKERS_FINAL;
            default: console.warn("Unknown question set refName:", refName); return null;
        }
    }
    
    function getCurrentQuestionSetRefName() {
        if (currentQuestionSet === TIER1_QUESTIONS) return 'TIER1_QUESTIONS';
        if (currentQuestionSet === TIER2_C_PATH_QUESTIONS) return 'TIER2_C_PATH_QUESTIONS';
        if (currentQuestionSet === TIER2_M_PATH_QUESTIONS) return 'TIER2_M_PATH_QUESTIONS';
        if (currentQuestionSet === TIER2_P_PATH_QUESTIONS) return 'TIER2_P_PATH_QUESTIONS';
        if (currentQuestionSet === TIER2_X_PATH_QUESTIONS) return 'TIER2_X_PATH_QUESTIONS';
        if (currentQuestionSet === TIER3_C_PATH_DEALBREAKERS_FINAL) return 'TIER3_C_PATH_DEALBREAKERS_FINAL';
        if (currentQuestionSet === TIER3_M_PATH_DEALBREAKERS_FINAL) return 'TIER3_M_PATH_DEALBREAKERS_FINAL';
        if (currentQuestionSet === TIER3_P_PATH_DEALBREAKERS_FINAL) return 'TIER3_P_PATH_DEALBREAKERS_FINAL';
        if (currentQuestionSet === TIER3_X_PATH_DEALBREAKERS_FINAL) return 'TIER3_X_PATH_DEALBREAKERS_FINAL';
        return null;
    }


    // --- QUESTION LOADING & TIER TRANSITIONS ---
    function loadQuestion() {
        let questionToLoad = null;
        // Determine which question set we are currently using (already set in currentQuestionSet by init or transition)
        if (currentQuestionSet && currentQuestionIndexInTier < currentQuestionSet.length) {
            questionToLoad = currentQuestionSet[currentQuestionIndexInTier];
        }

        if (questionToLoad) {
            if(questionTextElement) questionTextElement.innerHTML = `Q${questionsAnsweredInQuiz + 1} (${TOTAL_QUESTIONS_PER_USER} total): ${questionToLoad.text}`;
            if(optionsContainer) optionsContainer.innerHTML = '';
            
            // Find if this question was previously answered (for "Back" functionality)
            const previousAnswerForThisStep = answerHistory.find(hist => hist.questionsAnsweredGlobal === questionsAnsweredInQuiz);

            const shuffledOptions = shuffleArray(questionToLoad.options);
            shuffledOptions.forEach((optionData, displayIndex) => {
                const inputId = `q_opt_disp${displayIndex}_${questionsAnsweredInQuiz}`;
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = `q_options_${questionsAnsweredInQuiz}`;
                input.id = inputId;
                input.value = JSON.stringify(optionData.scores);
                // Store original option text in a data attribute to reliably find it later for history
                input.dataset.originalOptionText = optionData.text; 

                if (previousAnswerForThisStep && optionData.text === previousAnswerForThisStep.selectedOptionText) {
                    input.checked = true;
                }
                const label = document.createElement('label');
                label.htmlFor = inputId;
                label.textContent = optionData.text;
                if(optionsContainer) { optionsContainer.appendChild(input); optionsContainer.appendChild(label); }
            });
            if(progressIndicator) progressIndicator.textContent = `Question ${questionsAnsweredInQuiz + 1} of ${TOTAL_QUESTIONS_PER_USER}`;
            if(nextButton) nextButton.textContent = (questionsAnsweredInQuiz + 1 === TOTAL_QUESTIONS_PER_USER) ? "Finish & See My Glorious Doom" : "Next";
            if(backButton) backButton.style.display = (questionsAnsweredInQuiz > 0 && answerHistory.length > 0) ? 'inline-block' : 'none'; // Show if not first question
            if(restartButton) restartButton.style.display = 'block'; // Always show restart if quiz started

        } else {
            handleTierTransition();
        }
    }
    
    function handleTierTransition() {
        console.log(`Handling tier transition. Current Tier: ${currentTier}, Index in Tier: ${currentQuestionIndexInTier}, Branch: ${currentBranch}`);
        let nextQuestionSetFound = false;
        if (currentTier === 1 && currentQuestionIndexInTier >= T1_Q_LEN) {
            const normalizedTier1Scores = normalizeScores(userScores, minMaxRawScores);
            currentBranch = determineBranch(normalizedTier1Scores.c, normalizedTier1Scores.m, normalizedTier1Scores.p);
            switch(currentBranch) {
                case "C_PATH": currentQuestionSet = TIER2_C_PATH_QUESTIONS; break;
                case "M_PATH": currentQuestionSet = TIER2_M_PATH_QUESTIONS; break;
                case "P_PATH": currentQuestionSet = TIER2_P_PATH_QUESTIONS; break;
                case "X_PATH": default: currentQuestionSet = TIER2_X_PATH_QUESTIONS; break;
            }
            currentTier = 2; currentQuestionIndexInTier = 0; nextQuestionSetFound = true;
            console.log("Transitioning to Tier 2, Branch: " + currentBranch);
        } else if (currentTier === 2 && currentQuestionSet && currentQuestionIndexInTier >= T2_BRANCH_LEN) {
            console.log(`Transitioning from Tier 2 (Branch: ${currentBranch}) to Tier 3.`);
            switch(currentBranch) { 
                case "C_PATH": currentQuestionSet = TIER3_C_PATH_DEALBREAKERS_FINAL; break;
                case "M_PATH": currentQuestionSet = TIER3_M_PATH_DEALBREAKERS_FINAL; break;
                case "P_PATH": currentQuestionSet = TIER3_P_PATH_DEALBREAKERS_FINAL; break;
                case "X_PATH": default: currentQuestionSet = TIER3_X_PATH_DEALBREAKERS_FINAL; break;
            }
            currentTier = 3; currentQuestionIndexInTier = 0; nextQuestionSetFound = true;
            console.log(`Transitioning to Tier 3, Branched Dealbreakers for: ${currentBranch}`);
        } else if (currentTier === 3 && currentQuestionSet && currentQuestionIndexInTier >= T3_BRANCH_LEN) {
            console.log("Finished all tiers. Showing results.");
            showResults(); return; // End of quiz
        }

        if (nextQuestionSetFound) {
            if (!currentQuestionSet || currentQuestionSet.length === 0) {
                 console.error(`Error: Next question set for Tier ${currentTier}, Branch ${currentBranch} is empty or undefined!`);
                 alert("Error: Could not load next set of questions.");
                 showResults(); return;
            }
            loadQuestion();
        } else {
            console.error("Unexpected state in handleTierTransition or end of quiz not properly handled.");
            showResults(); // Fallback
        }
    }

    function getSelectedOptionDataAdaptive() {
        const radioGroupName = `q_options_${questionsAnsweredInQuiz}`;
        const selectedRadio = document.querySelector(`input[name="${radioGroupName}"]:checked`);
        if (selectedRadio) {
            try {
                const scores = JSON.parse(selectedRadio.value);
                const text = selectedRadio.dataset.originalOptionText; 
                return { scores: scores, text: text };
            }
            catch (e) { console.error("Error parsing scores from radio value:", selectedRadio.value, e); return null; }
        }
        return null;
    }

    // --- BUTTON EVENT LISTENERS ---
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const selectedData = getSelectedOptionDataAdaptive();
            if (selectedData && selectedData.scores) {
                const questionJustAnswered = currentQuestionSet[currentQuestionIndexInTier];
                answerHistory.push({
                    tier: currentTier,
                    branch: currentBranch,
                    questionSetRefName: getCurrentQuestionSetRefName(),
                    questionIndexInTier: currentQuestionIndexInTier,
                    questionId: questionJustAnswered ? questionJustAnswered.id : 'unknown_q_id',
                    selectedOptionText: selectedData.text,
                    scoresGiven: JSON.parse(JSON.stringify(selectedData.scores)) 
                });
                userScores.c += selectedData.scores.c;
                userScores.m += selectedData.scores.m;
                userScores.p += selectedData.scores.p;
                currentQuestionIndexInTier++;
                questionsAnsweredInQuiz++;
                console.log(`Answered Q ${questionsAnsweredInQuiz}. Raw scores: C=${userScores.c.toFixed(2)}, M=${userScores.m.toFixed(2)}, P=${userScores.p.toFixed(2)}`);
                loadQuestion(); 
            } else {
                if (questionsAnsweredInQuiz < TOTAL_QUESTIONS_PER_USER) {
                     alert("Please select an option before proceeding, you indecisive wretch!");
                } else { showResults(); } // Should be caught by button text change to "Finish"
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
            if (answerHistory.length > 0) {
                // Check if going back would cross a major branch decision (T1 to T2, or T2 to T3 if T3 was common)
                // For this implementation, "Back" is limited to within the current segment (T1, current T2 branch, or current T3 branch)
                // A more complex "back" that re-evaluates branching is deferred.
                const lastAnswer = answerHistory[answerHistory.length - 1]; // Peek
                
                // Simple back: only if currentQuestionIndexInTier > 0 for the current tier.
                // Does not support going back to a previous tier or re-branching.
                if (currentQuestionIndexInTier > 0) {
                    answerHistory.pop(); // Now actually remove it
                    console.log("Going back. Popped answer:", lastAnswer);

                    userScores.c -= lastAnswer.scoresGiven.c;
                    userScores.m -= lastAnswer.scoresGiven.m;
                    userScores.p -= lastAnswer.scoresGiven.p;

                    questionsAnsweredInQuiz--; 
                    currentQuestionIndexInTier = lastAnswer.questionIndexInTier; 
                    // currentTier and currentBranch remain the same as we are within segment
                    // currentQuestionSet also remains the same
                    
                    console.log(`State reverted for back button: Tier ${currentTier}, Branch ${currentBranch}, IndexInTier ${currentQuestionIndexInTier}, QsAnswered ${questionsAnsweredInQuiz}`);
                    loadQuestion(); // This will re-render the previous question and re-select its answer
                } else {
                    console.log("Cannot go back further within this tier/segment.");
                    backButton.style.display = 'none'; // Hide if at start of current segment
                }
            } else {
                console.log("No history to go back to.");
                if(backButton) backButton.style.display = 'none';
            }
        });
    }
    
    if (copyResultsButton && copyStatusElement) {
        copyResultsButton.addEventListener('click', () => { /* ... (Copy Results logic as provided before) ... */ 
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
    function normalizeScores(rawScores, minMaxIgnored) { /* ... (Simplified sum-to-100 version as provided before) ... */ 
        let tempC = rawScores.c; let tempM = rawScores.m; let tempP = rawScores.p;
        const overallMin = Math.min(0, tempC, tempM, tempP); 
        if (overallMin < 0) { const shift = Math.abs(overallMin); tempC += shift; tempM += shift; tempP += shift; }
        const totalSum = tempC + tempM + tempP;
        if (totalSum === 0) return { c: 33.33, m: 33.33, p: 33.34 };
        let normC = (tempC / totalSum) * 100; let normM = (tempM / totalSum) * 100; let normP = (tempP / totalSum) * 100;
        normC = parseFloat(Math.min(100, Math.max(0, normC)).toFixed(2));
        normM = parseFloat(Math.min(100, Math.max(0, normM)).toFixed(2));
        normP = parseFloat(Math.min(100, Math.max(0, 100.0 - normC - normM)).toFixed(2));
        let finalSumCheck = parseFloat(normC.toFixed(2)) + parseFloat(normM.toFixed(2)) + parseFloat(normP.toFixed(2)); // Use parsed floats for sum
        if (Math.abs(finalSumCheck - 100.0) > 0.03) {
            normP = parseFloat((100.0 - normC - normM).toFixed(2));
        }
        if (normP < 0) normP = 0.00;
        if (normC + normM + normP > 100.03 || normC + normM + normP < 99.97) {
             normP = Math.max(0, parseFloat((100.0 - normC - normM).toFixed(2)));
        }
        return { c: parseFloat(normC.toFixed(2)), m: parseFloat(normM.toFixed(2)), p: parseFloat(normP.toFixed(2)) };
    }

    function setupDevControls() { /* ... (As provided before, with debouncing) ... */ 
        devControlsContainer.innerHTML = `<h3>Developer Controls (Normalized Scores %)</h3><div><label for="devC">Centralism (C):</label><input type="range" id="devC" min="0" max="100" value="33.3" step="0.1"><span id="devCValue">33.3%</span></div><div><label for="devM">Communalism (M):</label><input type="range" id="devM" min="0" max="100" value="33.3" step="0.1"><span id="devMValue">33.3%</span></div><div><label for="devP">Privatism (P):</label><input type="range" id="devP" min="0" max="100" value="33.4" step="0.1"><span id="devPValue">33.4%</span></div><p style="font-size:0.8em; color: #555;">Note: Sliders are independent. Plot & ideology use values re-normalized to sum to 100%.</p>`;
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

    function updateResultsFromDevControls() { /* ... (As provided before) ... */ 
        const devC_raw_percent = parseFloat(document.getElementById('devC').value); const devM_raw_percent = parseFloat(document.getElementById('devM').value); const devP_raw_percent = parseFloat(document.getElementById('devP').value);
        let tempScoresForNormalization = {c: devC_raw_percent, m: devM_raw_percent, p: devP_raw_percent};
        let normalizedForPlot = normalizeScores(tempScoresForNormalization, {}); 
        userScores.c = devC_raw_percent * 0.3; userScores.m = devM_raw_percent * 0.3; userScores.p = devP_raw_percent * 0.3; // Simplified mock
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

    function displayIdeologyInfo(ideologyInfo) { /* ... (As provided before, ensuring elements exist) ... */ 
        let ideologyLabelElement = document.getElementById('ideology-label-result');
        if (!ideologyLabelElement) { ideologyLabelElement = document.createElement('h3'); ideologyLabelElement.id = 'ideology-label-result'; if(normalizedScoresElement && normalizedScoresElement.parentNode) { normalizedScoresElement.parentNode.insertBefore(ideologyLabelElement, normalizedScoresElement.nextSibling); } else if (resultsArea) { resultsArea.appendChild(ideologyLabelElement); }}
        if(ideologyLabelElement) { if (ideologyInfo.specific && ideologyInfo.broadCategory && ideologyInfo.specific !== ideologyInfo.broadCategory && ideologyInfo.broadCategory !== "Unclassifiable" && ideologyInfo.specific !== "Uncategorized") { ideologyLabelElement.innerHTML = `Political Profile:<br><b>Specific Ideology:</b> ${ideologyInfo.specific}<br><b>Broad Category:</b> ${ideologyInfo.broadCategory}`; } else if (ideologyInfo.specific && ideologyInfo.specific !== "Uncategorized") { ideologyLabelElement.innerHTML = `Political Profile:<br><b>Ideology:</b> ${ideologyInfo.specific}`; } else { ideologyLabelElement.innerHTML = `Political Profile:<br><b>Category:</b> ${ideologyInfo.broadCategory || "Not Determined"}`; }}
        let ideologySummaryElement = document.getElementById('ideology-summary-result');
        if (!ideologySummaryElement) { ideologySummaryElement = document.createElement('p'); ideologySummaryElement.id = 'ideology-summary-result'; ideologySummaryElement.style.fontStyle = 'italic'; ideologySummaryElement.style.border = '1px dashed #ccc'; ideologySummaryElement.style.padding = '10px'; if (ideologyLabelElement && ideologyLabelElement.parentNode) { ideologyLabelElement.parentNode.insertBefore(ideologySummaryElement, ideologyLabelElement.nextSibling); } else if (resultsArea) { resultsArea.appendChild(ideologySummaryElement); }}
        if(ideologySummaryElement) ideologySummaryElement.textContent = ideologyInfo.summary;
    }

    function showResults() { /* ... (As provided before, with safety checks for DOM elements) ... */ 
        console.log("Showing results. Final Raw Scores:", userScores);
        if(quizArea) quizArea.style.display = 'none'; if(resultsArea) resultsArea.style.display = 'block';
        if(progressIndicator) progressIndicator.style.display = 'none'; if(restartButton) restartButton.style.display = 'block'; 
        if(backButton) backButton.style.display = 'none'; // Hide back on results page
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

    function drawPlot(normalized, ideologyLabel = "Your Position") { /* ... (As provided before, with NaN checks for plot values) ... */
        const plotDiv = document.getElementById('plot-div'); if (!plotDiv || typeof Plotly === 'undefined') { console.error("Plot div or Plotly missing."); return; }
        const plotC = isNaN(normalized.c) ? 33.33 : normalized.c; const plotM = isNaN(normalized.m) ? 33.33 : normalized.m; const plotP = isNaN(normalized.p) ? 33.34 : normalized.p;
        const plotData = [{ type: 'scatterternary', mode: 'markers', a: [plotC], b: [plotM], c: [plotP], name: 'Your Position', text: [`C: ${plotC.toFixed(1)}%<br>M: ${plotM.toFixed(1)}%<br>P: ${plotP.toFixed(1)}%`], hoverinfo: 'text', marker: { symbol: 'circle', color: '#FF0000', size: 14, line: { width: 1, color: '#880000' } } }];
        const layout = { title: `Political Profile: ${ideologyLabel}`, ternary: { sum: 100, aaxis: { title: '<b>Centralism</b><br>(Big Brother is Watching)', min: 0, linewidth: 2, ticks: 'outside' }, baxis: { title: '<b>Communalism</b><br>(Endless Group Hugs)', min: 0, linewidth: 2, ticks: 'outside' }, caxis: { title: '<b>Privatism</b><br>(Every Man for Himself)', min: 0, linewidth: 2, ticks: 'outside' }, bgcolor: '#f0f0f0' }, annotations: [{ showarrow: false, text: '*Not actually scientific. At all.', x: 0.5, y: -0.15, xref: 'paper', yref: 'paper', font: { size: 10, color: 'grey' } }], paper_bgcolor: '#fff', plot_bgcolor: '#fff', margin: { l: 70, r: 50, b: 100, t: 100, pad: 4 } };
        Plotly.newPlot('plot-div', plotData, layout);
     }

    // --- getIdeologyLabelAndSarcasm FUNCTION ---
    // This is your full, latest version with all thresholds and sarcastic summaries
    function getIdeologyLabelAndSarcasm(normC_input, normM_input, normP_input) {
        let result = { broadCategory: "Unclassifiable", specific: "Uncategorized", summary: "You're a unique snowflake of political confusion, a glorious mess of contradictory impulses. Or maybe this test is just deeply flawed. Probably both. Embrace the chaos." };
        let normC = parseFloat(normC_input); let normM = parseFloat(normM_input); let normP = parseFloat(normP_input);
        if (isNaN(normC)) normC = 33.33; if (isNaN(normM)) normM = 33.33; if (isNaN(normP)) normP = 33.34;
        
        const dominant = 60; const veryDominantCorner = 68; const strong = 45; const moderate = 25;
        const weakCorner = 18; const weakGeneral = 15; const veryLowCorner = 12; const veryLowGeneral = 10;
    
        let sum = normC + normM + normP;
        if (Math.abs(sum - 100.0) > 0.01 && sum !== 0) { const scale = 100.0 / sum; normC *= scale; normM *= scale; normP = 100.0 - normC - normM; }
        
        normC = Math.max(0, Math.min(100, normC)); normM = Math.max(0, Math.min(100, normM)); normP = Math.max(0, Math.min(100, normP));
        normC = parseFloat(normC.toFixed(2)); normM = parseFloat(normM.toFixed(2));
        normP = parseFloat((100.0 - normC - normM).toFixed(2));
        if (normP < 0) normP = 0.00; // Ensure P isn't negative after C and M are set with toFixed
        
        // Recalculate sum after toFixed and adjust P to make it exactly 100 if possible
        let finalSum = normC + normM + normP;
        if (Math.abs(finalSum - 100.0) > 0.001) { // Allow for tiny float deviations
            normP = parseFloat((100.0 - normC - normM).toFixed(2));
            if (normP < 0) { // If P is still negative, C+M was > 100
                let tempSumCM = normC + normM;
                if (tempSumCM > 0) {
                     normC = parseFloat(((normC / tempSumCM) * 100).toFixed(2));
                     normM = parseFloat((100.0 - normC).toFixed(2));
                } else { // Both C and M are zero or negative, this is an edge case
                     normC = 33.33; normM = 33.33; // Default to prevent NaN further down
                }
                normP = 0.00;
            }
        }
        // One last check on P's bounds
        normP = Math.max(0, Math.min(100, normP));
        normC = parseFloat(normC.toFixed(2)); normM = parseFloat(normM.toFixed(2)); normP = parseFloat(normP.toFixed(2));


        // 1. STATISM
        if (normC >= dominant && normM < strong && normP < strong) {
            result.broadCategory = "Statism";
            if (normC >= veryDominantCorner && normM < weakCorner && normP < weakCorner) { result.specific = "Totalitarianism / Absolutism"; result.summary = "The State is your loving parent, your stern teacher, your omniscient god, and the creepy neighbor who watches you through the blinds. Every thought is a state-approved thought. Enjoy your perfectly curated existence, citizen! (Attendance at Mandatory Fun Hour is compulsory)."; }
            else if (normP >= weakGeneral && normP > normM && normM < moderate && normC >= strong) { result.specific = "Authoritarian Capitalism / Fascism (Economic Aspect)"; result.summary = "National glory! The trains run on time (mostly to transport dissenters), and the Leader's chiseled jawline adorns every billboard. Private enterprise is fine, as long as it serves the State's glorious ambitions and kicks up a healthy cut. Individuality is so last century."; }
            else if (normM >= weakGeneral && normM > normP && normP < moderate && normC >= strong) { result.specific = "State Communism / Marxism-Leninism"; result.summary = "The Party knows what's best for the proletariat (that's you, unless you own too many spoons). Equality for all... except for those more equal than others in the Politburo."; }
            else if (normC >= dominant + 10 && normM < moderate && normP < moderate) { result.specific = "Hyper-Statism / Leviathan State"; result.summary = "You don't just love Big Brother; you want him to micromanage your sock drawer and write your Tinder bio. The State isn't just an entity; it's an all-consuming hobby, a lifestyle choice, and probably your only friend. Every breath you take, the State will be watching you."; }
            else { result.specific = "Statism (General Authoritarian)"; result.summary = "Clearly, someone needs to be in charge, and it's definitely not the unruly masses. A firm hand, a plethora of regulations, and the comforting, soul-crushing belief that 'they' (the ones with the bigger hats) know what's best for everyone else."; }
        }
        // 2. LIBERTARIAN SOCIALISM
        else if (normM >= dominant && normC < moderate && normP < strong) {
            result.broadCategory = "Libertarian Socialism / Social Anarchism";
            if (normM >= veryDominantCorner && normC < veryLowCorner && normP < weakCorner) { result.specific = "Anarcho-Communism"; result.summary = "No gods, no masters, just an endless series of highly-caffeinated consensus meetings in a drafty community hall to decide who gets the last artisanal turnip. Property is theft, but our extensive collection of protest zines is sacrosanct."; }
            else if (normC < veryLowGeneral && normP >= weakGeneral && normP < moderate) { result.specific = "Anarcho-Syndicalism / Collectivist Anarchism"; result.summary = "Workers of the world, unite! And then run everything through radical unions. One big union. Management? The state? Obsolete! We've got this, one general strike at a time."; }
            else if (normC >= veryLowGeneral && normC < weakGeneral + 5 && normP < moderate) { result.specific = "Council Communism / Libertarian Municipalism"; result.summary = "Power to the workers' councils and neighborhood assemblies! Spontaneous revolution, direct democracy on the factory floor. What could go wrong with pure, unadulterated proletarian power (and zoning debates)?"; }
            else { result.specific = "Libertarian Socialism (General)"; result.summary = "Let's smash oppression and dismantle all hierarchy through free association and mutual aid! It'll be a paradise of autonomy, once we've finished the 17 sub-committee reports on the proper definition of 'free association'."; }
        }
        // 3. PROPERTARIANISM
        else if (normP >= dominant && normC < strong && normM < strong) {
            result.broadCategory = "Propertarianism / Individualist Libertarianism";
            if (normP >= veryDominantCorner && normC < veryLowCorner && normM < weakCorner) { result.specific = "Anarcho-Capitalism"; result.summary = "The Non-Aggression Principle is our one true god, and the Free Market its only prophet! Roads? Police? Child labor laws? Pfft, voluntary contracts and private arbitration will solve *everything*. Eventually. Maybe."; }
            else if (normC >= veryLowGeneral && normC < moderate && normM < weakGeneral) { result.specific = "Minarchism / Night-Watchman State"; result.summary = "The government should do one thing: protect my property. And maybe enforce contracts. That's it. Roads? Fire department? Charity? Voluntary! Night-watchman state, activate!"; }
            else if (normC < veryLowGeneral && normM >= weakGeneral && normM < moderate) { result.specific = "Agorism / Counter-Economics"; result.summary = "The state is illegitimate, so let's just... ignore it. Black markets, grey markets, crypto, under-the-table deals – build the free society in the shell of the old, one untaxed transaction at a time."; }
            else if (normP >= dominant + 10 && normC < moderate && normM < moderate) { result.specific = "Radical Propertarianism / Hoppeanism (Economic Aspect)"; result.summary = "Private property über alles! So private, in fact, that entire towns are gated communities with 'physical removal' clauses. Freedom through exclusion! It's efficient!"; }
            else { result.specific = "Libertarianism (Right-Libertarian / Propertarian General)"; result.summary = "Don't tread on me, my money, or my right to own an unreasonable amount of guns. The government that governs least governs best (preferably not at all)."; }
        }
        // 4. AUTHORITARIAN SOCIALISM
        else if (normC >= moderate && normM >= moderate && normP < moderate && normC < dominant && normM < dominant) {
            result.broadCategory = "Authoritarian Socialism / State Collectivism";
            if (normC > normM + 10 && normM >= moderate) { result.specific = "State Socialism (Centralized Planning Focus)"; result.summary = "The State will provide all your needs, from cradle to grave, as long as your needs align perfectly with the current Five-Year Plan. Innovation is... discouraged."; }
            else if (normM > normC + 10 && normC >= moderate) { result.specific = "Collectivist Statism (Community-Oriented but State-Led)"; result.summary = "We're all in this glorious collective endeavor together, comrades! And by 'we,' the State means 'you,' and by 'together,' the State means 'as directed by the Central Committee for Mandatory Happiness.' Participation is not optional, but enthusiasm is encouraged (and monitored)."; }
            else if (Math.abs(normC - normM) <= 10 && normC >= strong - 5 && normM >= strong - 5) { result.specific = "National Syndicalism (Non-Fascist) / Guild Socialism (State-Backed)"; result.summary = "Society neatly organized into state-approved vocational groups! It's like a medieval craft fair, but with significantly more paperwork, five-year plans, and less chance of contracting the plague. Probably."; }
            else { result.specific = "Authoritarian Socialism (General)"; result.summary = "Socialism: so good, it has to be mandatory! The state ensures everyone shares... whether they want to or not."; }
        }
        // 5. INDIVIDUALIST ANARCHISM
        else if (normM >= moderate && normP >= moderate && normC < veryLowGeneral + 5 && normM < dominant && normP < dominant) {
            result.broadCategory = "Individualist Anarchism";
            if (Math.abs(normM - normP) < 15 && normM > moderate - 5 && normP > moderate - 5) { result.specific = "Mutualism (Proudhonian Anarchism)"; result.summary = "Fair exchange is no robbery, as long as we're all using our own labor-backed currency and occupying unused land. Banks? Who needs 'em when you have a People's Credit Union that might actually work this time?"; }
            else if (normP > normM && normM >= moderate - 5) { result.specific = "Market Anarchism (Individualist Tradition)"; result.summary = "Liberty, property, and no state! Let individuals and their voluntary associations hash it out in a truly free market. What could go wrong, besides everything?"; }
            else if (normM > normP && normP >= moderate - 5) { result.specific = "Communal Individualism / Egoism (Stirnerite, in voluntary association)"; result.summary = "My will is my only law! All those 'higher ideals' are just spooks. I'll hang with my 'Union of Egoists' as long as it suits me, then I'm out. Don't get any ideas."; }
            else { result.specific = "Individualist Anarchism (General)"; result.summary = "Leave me alone to do my thing! Society is a spook, property is probably a spook, and your rules are definitely a spook. I'll figure it out myself, thank you very much."; }
        }
        // 6. CLASSICAL LIBERALISM
        else if (normC >= moderate && normP >= moderate && normM < moderate && normC < dominant && normP < dominant) {
            result.broadCategory = "Classical Liberalism / Constitutionalism";
            if (normP > normC + 10 && normC >= moderate - 5) { result.specific = "Classical Liberalism (Lockean/Smithian)"; result.summary = "Life, liberty, property, and a government just strong enough to protect them (and not a penny more!). The invisible hand will sort out the rest... hopefully."; }
            else if (normC > normP + 10 && normP >= moderate - 5) { result.specific = "Traditional Conservatism (Burkean / Constitutional)"; result.summary = "Change is bad, tradition is good, and society is an organic whole held together by institutions, faith, and knowing your place. If it ain't broke (for centuries), don't fix it! Pass the sherry."; }
            else if (Math.abs(normC - normP) <= 10 && normC >= strong - 5 && normP >= strong - 5) { result.specific = "Constitutional Republicanism / Conservative Liberalism"; result.summary = "A well-ordered republic with checks, balances, and powdered wigs. Freedom is great, as long as it's exercised by the *right sort* of people."; }
            else { result.specific = "Liberalism (General Constitutional)"; result.summary = "We believe in rights, laws, and probably a lengthy document written by dead white guys. It's all very reasonable, until it isn't."; }
        }
        // 7. CENTRISM
        else if (normC >= moderate && normC < strong + 5 && normM >= moderate && normM < strong + 5 && normP >= moderate && normP < strong + 5 && (Math.max(normC, normM, normP) - Math.min(normC, normM, normP)) < 25) {
            result.broadCategory = "Centrism / Mixed Economy Ideologies";
            if (normM > normC && normM > normP && normM > Math.max(normC, normP) + 5) { result.specific = "Social Democracy"; result.summary = "Capitalism needs a good hug and some strict house rules. Let's have markets, but also a comfy welfare state so nobody starves (too much). It's all about 'balance' and 'fairness' (and probably higher taxes)."; }
            else if (normP > normC && normP > normM && normP > Math.max(normC, normP) + 5) { result.specific = "Market-Oriented Liberalism / Third Way"; result.summary = "We're 'radically pragmatic'! Markets are good, efficiency is great, and social justice is a nice bonus if it doesn't hurt the bottom line too much. Think 'New Labour' without the actual Labour part."; }
            else if (normC > normM && normC > normP && normC > Math.max(normM, normP) + 5) { result.specific = "Technocratic / Managerial Liberalism"; result.summary = "Society is a complex machine that just needs competent managers (like us!) and evidence-based policies. Feelings are nice, but have you seen our spreadsheets?"; }
            else { result.specific = "Social Liberalism / Progressive Liberalism"; result.summary = "Let's blend individual liberty with social justice, using markets wisely but fairly! Less state than the old guard, more heart than pure capitalism. Think 'social market economy' with extra rights."; }
        }
        // 8. FALLBACK
        else {
            if (result.specific === "Uncategorized") { 
                if (normC >= strong) { result.broadCategory = "Statism"; result.specific = "Statism (Undifferentiated)"; result.summary = "You've got a definite 'someone should be in charge' vibe, but the specifics are a bit hazy. More rules! More order! Probably!"; }
                else if (normM >= strong && normC < moderate) { result.broadCategory = "Libertarian Socialism / Social Anarchism"; result.specific = "Libertarian Socialism (Undifferentiated)"; result.summary = "Power to the people, or the commune, or something! Just... not the state. And probably lots of sharing. Details TBD."; }
                else if (normP >= strong && normC < moderate) { result.broadCategory = "Propertarianism / Individualist Libertarianism"; result.specific = "Propertarianism (Undifferentiated)"; result.summary = "It's all about ME and MY STUFF. Freedom means being left alone, preferably with a large fence and low taxes."; }
                else if (normC >= moderate && normM >= moderate && normP < moderate) { result.broadCategory = "Authoritarian Socialism / State Collectivism"; result.specific = "Authoritarian Socialism (Undifferentiated)"; result.summary = "You like your socialism with a side of 'do as you're told.' The collective is great, as long as it's centrally managed."; }
                else if (normM >= moderate && normP >= moderate && normC < moderate) { result.broadCategory = "Individualist Anarchism"; result.specific = "Individualist Anarchism (Undifferentiated)"; result.summary = "You're not a fan of the state, and you value both your freedom and your ability to cooperate (or not) on your own terms. A rugged individualist, but maybe with a co-op membership."; }
                else if (normC >= moderate && normP >= moderate && normM < moderate) { result.broadCategory = "Classical Liberalism / Constitutionalism"; result.specific = "Liberalism (Undifferentiated)"; result.summary = "You're into rights, reason, and probably a constitution. The government should be limited, and markets mostly free. A sensible, if somewhat old-fashioned, choice."; }
                else { result.specific = "Mixed / Eclectic Political Outlook"; result.summary = "You've taken a 'one from column A, one from column B' approach to political thought, and your plate is a glorious, chaotic mess of conflicting flavors. Are you a visionary synthesist or just deeply indecisive? The world may never know."; }
            }
        }
        return result;
    }

}); // End of DOMContentLoaded