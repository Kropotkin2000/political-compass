// script.js
document.addEventListener('DOMContentLoaded', () => {
    // UTILITY FUNCTIONS
    function shuffleArray(array) {
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
    const devControlsContainer = document.createElement('div'); // For Dev Mode
    devControlsContainer.id = 'dev-controls';

    // Quiz State Variables
    let currentQuestionIndex = 0;
    let userScores = { c: 0, m: 0, p: 0 };
    let minMaxRawScores = { c: { min: 0, max: 0 }, m: { min: 0, max: 0 }, p: { min: 0, max: 0 } };

    let debounceTimer; // Timer for debouncing dev controls updates

    // --- DEV MODE CHECK ---
    const urlParams = new URLSearchParams(window.location.search);
    const isDevMode = urlParams.get('dev') === 'true';

    if (isDevMode) {
        console.log("Developer Mode Activated");
        if(quizArea) quizArea.style.display = 'none';
        if(resultsArea) resultsArea.style.display = 'block';
        
        const mainHeading = document.querySelector('.container h1');
        if (mainHeading) mainHeading.textContent += " (Dev Mode)";
        
        const introP = document.querySelector('p.intro');
        if (introP) introP.style.display = 'none';
        
        const outroP = document.querySelector('p.outro');
        if(outroP) outroP.style.display = 'none';

        setupDevControls();
        calculateMinMaxScores(); // Needed for mocked raw scores context
        updateResultsFromDevControls(); // Initial render
    } else {
        // Normal quiz flow
        calculateMinMaxScores();
        loadQuestion();
    }

    // --- CORE QUIZ FUNCTIONS ---
    function calculateMinMaxScores() {
        minMaxRawScores = { c: { min: 0, max: 0 }, m: { min: 0, max: 0 }, p: { min: 0, max: 0 } };
        if (typeof questions !== 'undefined' && questions.length > 0) {
            questions.forEach(q => {
                let qMinC = Infinity, qMaxC = -Infinity;
                let qMinM = Infinity, qMaxM = -Infinity;
                let qMinP = Infinity, qMaxP = -Infinity;

                q.options.forEach(opt => {
                    if (opt.scores.c < qMinC) qMinC = opt.scores.c;
                    if (opt.scores.c > qMaxC) qMaxC = opt.scores.c;
                    if (opt.scores.m < qMinM) qMinM = opt.scores.m;
                    if (opt.scores.m > qMaxM) qMaxM = opt.scores.m;
                    if (opt.scores.p < qMinP) qMinP = opt.scores.p;
                    if (opt.scores.p > qMaxP) qMaxP = opt.scores.p;
                });

                minMaxRawScores.c.min += qMinC;
                minMaxRawScores.c.max += qMaxC;
                minMaxRawScores.m.min += qMinM;
                minMaxRawScores.m.max += qMaxM;
                minMaxRawScores.p.min += qMinP;
                minMaxRawScores.p.max += qMaxP;
            });
        }
    }

    function loadQuestion() {
        if (typeof questions === 'undefined' || questions.length === 0) {
            console.error("Questions not loaded or empty!");
            if(questionTextElement) questionTextElement.textContent = "Error: Questions not found.";
            return;
        }
        if (currentQuestionIndex < questions.length) {
            const currentQuestion = questions[currentQuestionIndex];
            if(questionTextElement) questionTextElement.innerHTML = `Q${currentQuestion.id} (Tier ${currentQuestion.tier}): ${currentQuestion.text}`;
            if(optionsContainer) optionsContainer.innerHTML = '';

            const shuffledOptions = shuffleArray(currentQuestion.options);

            shuffledOptions.forEach((optionData, displayIndex) => {
                const optionId = `q${currentQuestion.id}_opt_disp${displayIndex}`;
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = `q${questions[currentQuestionIndex].id}_options`;
                input.id = optionId;
                input.value = JSON.stringify(optionData.scores);

                const label = document.createElement('label');
                label.htmlFor = optionId;
                label.textContent = optionData.text;
                
                if(optionsContainer) {
                    optionsContainer.appendChild(input);
                    optionsContainer.appendChild(label);
                }
            });

            if(progressIndicator) progressIndicator.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
            if(nextButton) nextButton.textContent = (currentQuestionIndex === questions.length - 1) ? "Finish & See My Glorious Doom" : "Next";
        } else {
            showResults();
        }
    }

    function getSelectedOptionScores() {
        if (typeof questions === 'undefined' || questions.length === 0 || currentQuestionIndex >= questions.length) return null;
        const radioGroupName = `q${questions[currentQuestionIndex].id}_options`;
        const selectedRadio = document.querySelector(`input[name="${radioGroupName}"]:checked`);
        if (selectedRadio) {
            try { return JSON.parse(selectedRadio.value); }
            catch (e) { console.error("Error parsing scores:", e, selectedRadio.value); return null; }
        }
        return null;
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (typeof questions === 'undefined' || questions.length === 0) return;
            const scoresToAdd = getSelectedOptionScores();
            if (scoresToAdd) {
                userScores.c += scoresToAdd.c;
                userScores.m += scoresToAdd.m;
                userScores.p += scoresToAdd.p;
                currentQuestionIndex++;
                loadQuestion();
            } else {
                if (currentQuestionIndex < questions.length) {
                    alert("Please select an option before proceeding, you indecisive wretch!");
                }
            }
        });
    }

    function normalizeScores(rawScores, minMax) {
        let rangeC = minMax.c.max - minMax.c.min;
        let rangeM = minMax.m.max - minMax.m.min;
        let rangeP = minMax.p.max - minMax.p.min;

        if (rangeC === 0) rangeC = 1; if (rangeM === 0) rangeM = 1; if (rangeP === 0) rangeP = 1;

        let normC_intermediate = rangeC === 0 ? 0.333 : (rawScores.c - minMax.c.min) / rangeC;
        let normM_intermediate = rangeM === 0 ? 0.333 : (rawScores.m - minMax.m.min) / rangeM;
        let normP_intermediate = rangeP === 0 ? 0.333 : (rawScores.p - minMax.p.min) / rangeP;

        const totalIntermediate = normC_intermediate + normM_intermediate + normP_intermediate;
        if (totalIntermediate === 0) return { c: 33.33, m: 33.33, p: 33.34 };

        let normC = (normC_intermediate / totalIntermediate) * 100;
        let normM = (normM_intermediate / totalIntermediate) * 100;
        let normP = (normP_intermediate / totalIntermediate) * 100;

        const currentSum = normC + normM + normP;
        if (Math.abs(currentSum - 100.0) > 0.01 && currentSum !== 0) {
            const scaleFactor = 100.0 / currentSum;
            normC *= scaleFactor;
            normM *= scaleFactor;
            normP = 100.0 - normC - normM; // Ensure sum is 100
        }
        return {
            c: parseFloat(normC.toFixed(2)),
            m: parseFloat(normM.toFixed(2)),
            p: parseFloat(normP.toFixed(2))
        };
    }

    // --- DEV MODE SPECIFIC FUNCTIONS ---
    function setupDevControls() {
        devControlsContainer.innerHTML = `
            <h3>Developer Controls (Normalized Scores %)</h3>
            <div><label for="devC">Centralism (C):</label><input type="range" id="devC" min="0" max="100" value="33.3" step="0.1"><span id="devCValue">33.3%</span></div>
            <div><label for="devM">Communalism (M):</label><input type="range" id="devM" min="0" max="100" value="33.3" step="0.1"><span id="devMValue">33.3%</span></div>
            <div><label for="devP">Privatism (P):</label><input type="range" id="devP" min="0" max="100" value="33.4" step="0.1"><span id="devPValue">33.4%</span></div>
            <p style="font-size:0.8em; color: #555;">Note: Sliders are independent. Plot & ideology use values re-normalized to sum to 100%.</p>
        `;
        if(resultsArea && rawScoresElement) resultsArea.insertBefore(devControlsContainer, rawScoresElement);

        const devCInput = document.getElementById('devC');
        const devMInput = document.getElementById('devM');
        const devPInput = document.getElementById('devP');
        const devCValueSpan = document.getElementById('devCValue');
        const devMValueSpan = document.getElementById('devMValue');
        const devPValueSpan = document.getElementById('devPValue');

        function updateSliderDisplay() {
            if(devCValueSpan) devCValueSpan.textContent = `${parseFloat(devCInput.value).toFixed(1)}%`;
            if(devMValueSpan) devMValueSpan.textContent = `${parseFloat(devMInput.value).toFixed(1)}%`;
            if(devPValueSpan) devPValueSpan.textContent = `${parseFloat(devPInput.value).toFixed(1)}%`;
        }

        [devCInput, devMInput, devPInput].forEach(input => {
            if(input) input.addEventListener('input', () => {
                updateSliderDisplay(); // Immediate text update
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    updateResultsFromDevControls(); // Debounced full update
                }, 200); // Adjust delay as needed (e.g., 150-250ms)
            });
        });
        updateSliderDisplay(); // Initial display
    }

    function updateResultsFromDevControls() {
        const devC_raw = parseFloat(document.getElementById('devC').value);
        const devM_raw = parseFloat(document.getElementById('devM').value);
        const devP_raw = parseFloat(document.getElementById('devP').value);

        // Mock raw scores
        if (minMaxRawScores.c) { // Check if minMaxRawScores is populated
             userScores.c = (devC_raw / 100) * (minMaxRawScores.c.max - minMaxRawScores.c.min) + minMaxRawScores.c.min;
             userScores.m = (devM_raw / 100) * (minMaxRawScores.m.max - minMaxRawScores.m.min) + minMaxRawScores.m.min;
             userScores.p = (devP_raw / 100) * (minMaxRawScores.p.max - minMaxRawScores.p.min) + minMaxRawScores.p.min;
        }


        // Normalize slider values for plot and ideology logic (sum to 100)
        let totalInput = devC_raw + devM_raw + devP_raw;
        let normalizedForPlot = { c: 33.33, m: 33.33, p: 33.34 }; // Default

        if (totalInput === 0) {
            console.warn("All dev sliders at 0, defaulting plot values.");
        } else {
            normalizedForPlot.c = (devC_raw / totalInput) * 100;
            normalizedForPlot.m = (devM_raw / totalInput) * 100;
            normalizedForPlot.p = (devP_raw / totalInput) * 100;
        }

        normalizedForPlot.c = Math.max(0, normalizedForPlot.c);
        normalizedForPlot.m = Math.max(0, normalizedForPlot.m);
        normalizedForPlot.p = Math.max(0, normalizedForPlot.p);

        let currentSum = normalizedForPlot.c + normalizedForPlot.m + normalizedForPlot.p;
        if (Math.abs(currentSum - 100.0) > 0.01 && currentSum !== 0) {
            const scaleFactor = 100.0 / currentSum;
            normalizedForPlot.c *= scaleFactor;
            normalizedForPlot.m *= scaleFactor;
            normalizedForPlot.p = 100.0 - normalizedForPlot.c - normalizedForPlot.m; // P gets remainder
        } else if (currentSum === 0 && totalInput !== 0) { // Should be rare
             normalizedForPlot = { c: 33.33, m: 33.33, p: 33.34 };
        }
        
        // Final toFixed(2) and re-balance P to ensure sum is 100.00
        normalizedForPlot.c = parseFloat(Math.min(100, Math.max(0, normalizedForPlot.c)).toFixed(2));
        normalizedForPlot.m = parseFloat(Math.min(100, Math.max(0, normalizedForPlot.m)).toFixed(2));
        normalizedForPlot.p = parseFloat(Math.min(100, Math.max(0, 100.0 - normalizedForPlot.c - normalizedForPlot.m)).toFixed(2));
        
        // Due to toFixed(2) on C & M, P might make total slightly off. One last adjustment to P for sum.
        let finalSumCheck = normalizedForPlot.c + normalizedForPlot.m + normalizedForPlot.p;
        if (Math.abs(finalSumCheck - 100.0) > 0.01) {
            normalizedForPlot.p = parseFloat((100.0 - normalizedForPlot.c - normalizedForPlot.m).toFixed(2));
        }


        if (isNaN(normalizedForPlot.c) || isNaN(normalizedForPlot.m) || isNaN(normalizedForPlot.p)) {
            console.error("CRITICAL: NaN detected in normalizedForPlot!", normalizedForPlot);
            normalizedForPlot = { c: 33.33, m: 33.33, p: 33.34 }; // Fallback
        }

        // Update display elements
        if (rawScoresElement) {
            rawScoresElement.innerHTML = `Raw Scores (Mocked for Dev Mode):<br>
                                        Centralism: ${userScores.c.toFixed(2)}<br>
                                        Communalism: ${userScores.m.toFixed(2)}<br>
                                        Privatism: ${userScores.p.toFixed(2)}`;
        }
        if (normalizedScoresElement) {
            normalizedScoresElement.innerHTML = `Normalized Scores (from sliders, re-normalized to sum 100%):<br>
                                                Centralism: ${normalizedForPlot.c.toFixed(2)}%<br>
                                                Communalism: ${normalizedForPlot.m.toFixed(2)}%<br>
                                                Privatism: ${normalizedForPlot.p.toFixed(2)}%`;
        }

        const ideologyInfo = getIdeologyLabelAndSarcasm(normalizedForPlot.c, normalizedForPlot.m, normalizedForPlot.p);
        displayIdeologyInfo(ideologyInfo);

        let plotTitleLabel = ideologyInfo.specific || "Political Profile";
        const genericKeywords = ["(General)", "Tendencies", "Eclectic", "Uncategorized", "Outlook", "(Undifferentiated)"];
        if (genericKeywords.some(keyword => ideologyInfo.specific.includes(keyword)) &&
            ideologyInfo.broadCategory && ideologyInfo.broadCategory !== "Unclassifiable" && ideologyInfo.broadCategory !== ideologyInfo.specific) {
            plotTitleLabel = ideologyInfo.broadCategory;
        } else if (plotTitleLabel === "Uncategorized" || ideologyInfo.broadCategory === "Unclassifiable" || plotTitleLabel.includes("Outlook")) {
            plotTitleLabel = "Political Profile Explorer";
        }
        drawPlot(normalizedForPlot, plotTitleLabel);
    }

    // --- SHARED RESULTS DISPLAY FUNCTIONS ---
    function displayIdeologyInfo(ideologyInfo) {
        let ideologyLabelElement = document.getElementById('ideology-label-result');
        if (!ideologyLabelElement) {
            ideologyLabelElement = document.createElement('h3');
            ideologyLabelElement.id = 'ideology-label-result';
            if(normalizedScoresElement && normalizedScoresElement.parentNode) {
                 normalizedScoresElement.parentNode.insertBefore(ideologyLabelElement, normalizedScoresElement.nextSibling);
            } else if (resultsArea) {
                resultsArea.appendChild(ideologyLabelElement); // Fallback
            }
        }

        if (ideologyInfo.specific && ideologyInfo.broadCategory &&
            ideologyInfo.specific !== ideologyInfo.broadCategory &&
            ideologyInfo.broadCategory !== "Unclassifiable" && ideologyInfo.specific !== "Uncategorized") {
            ideologyLabelElement.innerHTML = `Political Profile:<br>
                                        <b>Specific Ideology:</b> ${ideologyInfo.specific}<br>
                                        <b>Broad Category:</b> ${ideologyInfo.broadCategory}`;
        } else if (ideologyInfo.specific && ideologyInfo.specific !== "Uncategorized") {
            ideologyLabelElement.innerHTML = `Political Profile:<br>
                                        <b>Ideology:</b> ${ideologyInfo.specific}`;
        } else {
            ideologyLabelElement.innerHTML = `Political Profile:<br>
                                        <b>Category:</b> ${ideologyInfo.broadCategory || "Not Determined"}`;
        }

        let ideologySummaryElement = document.getElementById('ideology-summary-result');
        if (!ideologySummaryElement) {
            ideologySummaryElement = document.createElement('p');
            ideologySummaryElement.id = 'ideology-summary-result';
            ideologySummaryElement.style.fontStyle = 'italic';
            ideologySummaryElement.style.border = '1px dashed #ccc';
            ideologySummaryElement.style.padding = '10px';
            if (ideologyLabelElement && ideologyLabelElement.parentNode) {
                ideologyLabelElement.parentNode.insertBefore(ideologySummaryElement, ideologyLabelElement.nextSibling);
            } else if (resultsArea) {
                 resultsArea.appendChild(ideologySummaryElement); // Fallback
            }
        }
        ideologySummaryElement.textContent = ideologyInfo.summary;
    }

    function showResults() { // For normal quiz flow
        if(quizArea) quizArea.style.display = 'none';
        if(resultsArea) resultsArea.style.display = 'block';

        if(rawScoresElement) rawScoresElement.innerHTML = `Raw Scores (mostly meaningless without context):<br>
                                    Centralism: ${userScores.c.toFixed(2)}<br>
                                    Communalism: ${userScores.m.toFixed(2)}<br>
                                    Privatism: ${userScores.p.toFixed(2)}`;

        const normalized = normalizeScores(userScores, minMaxRawScores);
        if(normalizedScoresElement) normalizedScoresElement.innerHTML = `Normalized Scores (for the pretty triangle):<br>
                                            Centralism: ${normalized.c}%<br>
                                            Communalism: ${normalized.m}%<br>
                                            Privatism: ${normalized.p}%`;

        const ideologyInfo = getIdeologyLabelAndSarcasm(normalized.c, normalized.m, normalized.p);
        displayIdeologyInfo(ideologyInfo);

        let plotTitleLabel = ideologyInfo.specific || "Your Political Profile";
        const genericKeywords = ["(General)", "Tendencies", "Eclectic", "Uncategorized", "Outlook", "(Undifferentiated)"];
         if (genericKeywords.some(keyword => ideologyInfo.specific.includes(keyword)) &&
            ideologyInfo.broadCategory && ideologyInfo.broadCategory !== "Unclassifiable" && ideologyInfo.broadCategory !== ideologyInfo.specific) {
            plotTitleLabel = ideologyInfo.broadCategory;
        } else if (plotTitleLabel === "Uncategorized" || ideologyInfo.broadCategory === "Unclassifiable" || plotTitleLabel.includes("Outlook")) {
            plotTitleLabel = "Your Political Profile";
        }
        drawPlot(normalized, plotTitleLabel);
    }

    // --- PLOTLY AND IDEOLOGY LOGIC ---
    function drawPlot(normalized, ideologyLabel = "Your Position") {
        const plotDiv = document.getElementById('plot-div');
        if (!plotDiv || typeof Plotly === 'undefined') {
            console.error("Plot div or Plotly library not found.");
            return;
        }
        const plotData = [{
            type: 'scatterternary',
            mode: 'markers',
            a: [normalized.c], b: [normalized.m], c: [normalized.p],
            name: 'Your Position',
            text: [`C: ${normalized.c.toFixed(1)}%<br>M: ${normalized.m.toFixed(1)}%<br>P: ${normalized.p.toFixed(1)}%`],
            hoverinfo: 'text',
            marker: { symbol: 'circle', color: '#FF0000', size: 14, line: { width: 1, color: '#880000' } }
        }];
        const layout = {
            title: `Political Profile: ${ideologyLabel}`,
            ternary: {
                sum: 100,
                aaxis: { title: '<b>Centralism</b><br>(Big Brother is Watching)', min: 0, linewidth: 2, ticks: 'outside' },
                baxis: { title: '<b>Communalism</b><br>(Endless Group Hugs)', min: 0, linewidth: 2, ticks: 'outside' },
                caxis: { title: '<b>Privatism</b><br>(Every Man for Himself)', min: 0, linewidth: 2, ticks: 'outside' },
                bgcolor: '#f0f0f0'
            },
            annotations: [{ showarrow: false, text: '*Not actually scientific. At all.', x: 0.5, y: -0.15, xref: 'paper', yref: 'paper', font: { size: 10, color: 'grey' } }],
            paper_bgcolor: '#fff', plot_bgcolor: '#fff',
            margin: { l: 70, r: 50, b: 100, t: 100, pad: 4 }
        };
        Plotly.newPlot('plot-div', plotData, layout);
    }

    // In your script.js, replace the entire getIdeologyLabelAndSarcasm function with this:

    function getIdeologyLabelAndSarcasm(normC_input, normM_input, normP_input) {
        let result = { broadCategory: "Unclassifiable", specific: "Uncategorized", summary: "You're a unique snowflake of political confusion, a glorious mess of contradictory impulses. Or maybe this test is just deeply flawed. Probably both. Embrace the chaos." };

        let normC = normC_input;
        let normM = normM_input;
        let normP = normP_input;

        // Thresholds (FROM YOUR LAST PROVIDED SCRIPT - KEEP CALIBRATING)
        const dominant = 60;
        const veryDominantCorner = 68;
        const strong = 45;
        const moderate = 25;
        const weakCorner = 18;
        const weakGeneral = 15;
        const veryLowCorner = 12;
        const veryLowGeneral = 10;

        // Internal sum-to-100 normalization (as in your last script)
        let sum = normC + normM + normP;
        if (Math.abs(sum - 100.0) > 0.01 && sum !== 0) {
            const scale = 100.0 / sum;
            normC *= scale;
            normM *= scale;
            normP = 100.0 - normC - normM;
        }
        normC = parseFloat(Math.min(100, Math.max(0, normC)).toFixed(2));
        normM = parseFloat(Math.min(100, Math.max(0, normM)).toFixed(2));
        normP = parseFloat(Math.min(100, Math.max(0, 100.0 - normC - normM)).toFixed(2));
        if (normC + normM + normP !== 100.00 && Math.abs(normC + normM + normP - 100.0) < 0.05) {
            normP = parseFloat((100.0 - normC - normM).toFixed(2));
        }

        // --- Broad Category & Specific Ideology Classification WITH LONGER, MORE SARCASTIC SUMMARIES ---

        // 1. STATISM (High Centralism)
        if (normC >= dominant && normM < strong && normP < strong) {
            result.broadCategory = "Statism";
            if (normC >= veryDominantCorner && normM < weakCorner && normP < weakCorner) {
                result.specific = "Totalitarianism / Absolutism";
                result.summary = "The State is your loving parent, your stern teacher, your omniscient god, and the creepy neighbor who watches you through the blinds. Every thought is a state-approved thought. Enjoy your perfectly curated existence, citizen! (Attendance at Mandatory Fun Hour is compulsory).";
            } else if (normP >= weakGeneral && normP > normM && normM < moderate && normC >= strong) {
                result.specific = "Authoritarian Capitalism / Fascism (Economic Aspect)";
                result.summary = "National glory! The trains run on time (mostly to transport dissenters), and the Leader's chiseled jawline adorns every billboard. Private enterprise is fine, as long as it serves the State's glorious ambitions and kicks up a healthy cut. Individuality is so last century.";
            } else if (normM >= weakGeneral && normM > normP && normP < moderate && normC >= strong) {
                result.specific = "State Communism / Marxism-Leninism";
                result.summary = "The Party, in its infinite wisdom, guides the proletariat (that's you, unless you own too many spoons) to a utopia of perfect equality. Spoiler: some animals are more equal than others, especially those with Party memberships and access to special stores.";
            } else if (normC >= dominant + 10 && normM < moderate && normP < moderate) {
                result.specific = "Hyper-Statism / Leviathan State";
                result.summary = "You don't just love Big Brother; you want him to micromanage your sock drawer and write your Tinder bio. The State isn't just an entity; it's an all-consuming hobby, a lifestyle choice, and probably your only friend. Every breath you take, the State will be watching you.";
            } else {
                result.specific = "Statism (General Authoritarian)";
                result.summary = "Clearly, someone needs to be in charge, and it's definitely not the unruly masses. A firm hand, a plethora of regulations, and the comforting, soul-crushing belief that 'they' (the ones with the bigger hats) know what's best for everyone else.";
            }
        }

        // 2. LIBERTARIAN SOCIALISM / ANARCHISM (High Communalism, Moderately Low Centralism, P not dominant)
        else if (normM >= dominant && normC < moderate && normP < strong) {
            result.broadCategory = "Libertarian Socialism / Social Anarchism";
            if (normM >= veryDominantCorner && normC < veryLowCorner && normP < weakCorner) {
                result.specific = "Anarcho-Communism";
                result.summary = "No gods, no masters, just an endless series of highly-caffeinated consensus meetings in a drafty community hall to decide who *really* needs that last collectively-grown artisanal turnip. Property is theft, but our extensive collection of protest zines is sacrosanct.";
            } else if (normC < veryLowGeneral && normP >= weakGeneral && normP < moderate) {
                result.specific = "Anarcho-Syndicalism / Collectivist Anarchism";
                result.summary = "Workers of the world, unite! And then meticulously organize yourselves into radical, federated unions to run absolutely everything, from toothpick production to interpretive dance collectives. Management and the state are obsolete concepts, like good coffee at a general strike.";
            } else if (normC >= veryLowGeneral && normC < weakGeneral + 5 && normP < moderate) {
                result.specific = "Council Communism / Libertarian Municipalism";
                result.summary = "Forget parties and unions! True power lies with spontaneously formed workers' councils and hyper-local neighborhood assemblies, federating upwards into a beautiful, chaotic utopia of direct democracy. Hope you like debating parking regulations for six hours straight.";
            } else {
                result.specific = "Libertarian Socialism (General)";
                result.summary = "Let's smash oppression and dismantle all hierarchy through free association, mutual aid, and probably a collectively managed vegan bakery. It'll be a paradise of autonomy, once we've finished the 17 sub-committee reports on the proper definition of 'free association'.";
            }
        }

        // 3. PROPERTARIANISM / INDIVIDUALIST LIBERTARIANISM (High Privatism/Individualism, C & M not dominant)
        else if (normP >= dominant && normC < strong && normM < strong) {
            result.broadCategory = "Propertarianism / Individualist Libertarianism";
            if (normP >= veryDominantCorner && normC < veryLowCorner && normM < weakCorner) {
                result.specific = "Anarcho-Capitalism";
                result.summary = "The Non-Aggression Principle is our one true god, and the Free Market its only prophet. Roads? Police? Child protective services? Pfft, there's a private, voluntary, blockchain-based contract for that! Now, about those recreational McNukes...";
            } else if (normC >= veryLowGeneral && normC < moderate && normM < weakGeneral) {
                result.specific = "Minarchism / Night-Watchman State";
                result.summary = "The government should exist solely to protect my God-given (or Rand-given) property rights and enforce contracts. Anything else is tyranny. Fire departments? Voluntary subscription service, obviously. And don't even get me started on public libraries.";
            } else if (normC < veryLowGeneral && normM >= weakGeneral && normM < moderate) {
                result.specific = "Agorism / Counter-Economics";
                result.summary = "The State is an illegitimate protection racket, so let's just starve it by building a glorious underground economy of untaxed crypto, black market bartering, and principled tax evasion. Every off-the-books transaction is a revolutionary act! Vive la Résistance ( fiscale) !";
            } else if (normP >= dominant + 10 && normC < moderate && normM < moderate) {
                result.specific = "Radical Propertarianism / Hoppeanism (Economic Aspect)";
                result.summary = "Private property isn't just a right, it's the ONLY right. So private, in fact, that entire 'covenant communities' can physically remove anyone who violates the meticulously detailed HOA bylaws. Freedom through exclusion! It's efficient!";
            } else {
                result.specific = "Libertarianism (Right-Libertarian / Propertarian General)";
                result.summary = "Don't tread on me, my gold-backed currency, my extensive arsenal, or my profound distrust of anyone who uses the word 'collective.' The government that governs least governs best... ideally, it just dissolves into a series of competing private security firms.";
            }
        }

        // 4. AUTHORITARIAN / STATE SOCIALISM (Significant Centralism & Communalism, Low Privatism)
        else if (normC >= moderate && normM >= moderate && normP < moderate &&
                normC < dominant && normM < dominant) {
            result.broadCategory = "Authoritarian Socialism / State Collectivism";
            if (normC > normM + 10 && normM >= moderate) {
                result.specific = "State Socialism (Centralized Planning Focus)";
                result.summary = "The State, in its boundless wisdom and with its army of bureaucrats armed with clipboards, shall plan every aspect of the economy. Your assigned quota of artisanal pickle production is due Tuesday. No, you may not innovate.";
            } else if (normM > normC + 10 && normC >= moderate) {
                result.specific = "Collectivist Statism (Community-Oriented but State-Led)";
                result.summary = "We're all in this glorious collective endeavor together, comrades! And by 'we,' the State means 'you,' and by 'together,' the State means 'as directed by the Central Committee for Mandatory Happiness.' Participation is not optional, but enthusiasm is encouraged (and monitored).";
            } else if (Math.abs(normC - normM) <= 10 && normC >= strong - 5 && normM >= strong - 5) {
                result.specific = "National Syndicalism (Non-Fascist) / Guild Socialism (State-Backed)";
                result.summary = "Let's neatly organize society into powerful, state-sanctioned vocational guilds or syndicates! It's like a medieval craft fair, but with significantly more paperwork, five-year plans, and less chance of contracting the plague. Probably.";
            } else {
                result.specific = "Authoritarian Socialism (General)";
                result.summary = "Socialism is such a brilliant idea, it simply *must* be enforced by a powerful state with a monopoly on truth and a large collection of very stern-looking guards. For your own good, of course. Now, about that 'voluntary' contribution to the Leader's statue fund...";
            }
        }

        // 5. INDIVIDUALIST ANARCHISM (Significant Communalism & Privatism, Very Low Centralism)
        else if (normM >= moderate && normP >= moderate && normC < veryLowGeneral + 5 &&
                normM < dominant && normP < dominant) {
            result.broadCategory = "Individualist Anarchism";
            if (Math.abs(normM - normP) < 15 && normM > moderate - 5 && normP > moderate - 5) {
                result.specific = "Mutualism (Proudhonian Anarchism)";
                result.summary = "Property is theft (if it's exploitative)! Let's have free credit, people's banks, and federated communities where individuals and co-ops trade based on labor value. It's the original, beautifully impractical, anarchist third way. Just don't ask about interest rates.";
            } else if (normP > normM && normM >= moderate - 5) {
                result.specific = "Market Anarchism (Individualist Tradition)";
                result.summary = "To hell with the state, long live the truly free market! Let sovereign individuals and their voluntary associations engage in unfettered commerce. If a dispute arises, we'll just consult competing private arbitration agencies. It's foolproof, like a perpetual motion machine made of contracts.";
            } else if (normM > normP && normP >= moderate - 5) {
                result.specific = "Communal Individualism / Egoism (Stirnerite, in voluntary association)";
                result.summary = "My Unique Self is the only true reality! Morality, society, humanity? All 'spooks' designed to control me. I shall form a 'Union of Egoists' with other magnificent Uniques, purely for my own ever-shifting benefit and amusement. Then I'll ghost you when I get bored.";
            } else {
                result.specific = "Individualist Anarchism (General)";
                result.summary = "Maximum individual liberty, zero external authority, and a healthy suspicion of anyone who uses the word 'we' too often. I'll build my own utopia, with blackjack and... well, mostly just by being left alone, thanks.";
            }
        }

        // 6. CLASSICAL LIBERALISM / CONSTITUTIONALISM (Significant Centralism & Privatism, Low Communalism)
        else if (normC >= moderate && normP >= moderate && normM < moderate &&
                normC < dominant && normP < dominant) {
            result.broadCategory = "Classical Liberalism / Constitutionalism";
            if (normP > normC + 10 && normC >= moderate - 5) {
                result.specific = "Classical Liberalism (Lockean/Smithian)";
                result.summary = "Life, liberty, property, and a government just strong enough to keep grubby hands off them (and not a shilling more!). The 'invisible hand' of the market will guide us to prosperity, assuming it hasn't been recently disinfected. Read your Adam Smith, peasant!";
            } else if (normC > normP + 10 && normP >= moderate - 5) {
                result.specific = "Traditional Conservatism (Burkean / Constitutional)";
                result.summary = "Change is generally bad, tradition is mostly good, and society is a delicate, organic tapestry woven by dead white guys. Let's proceed with extreme caution, uphold established institutions, and for God's sake, don't frighten the horses (or the landed gentry).";
            } else if (Math.abs(normC - normP) <= 10 && normC >= strong - 5 && normP >= strong - 5) {
                result.specific = "Constitutional Republicanism / Conservative Liberalism";
                result.summary = "A well-ordered republic, governed by wise (and preferably wealthy) representatives, with a very long, very serious constitution full of checks, balances, and stern warnings about mob rule. Freedom is great, as long as it's exercised by the *right sort* of people.";
            } else {
                result.specific = "Liberalism (General Constitutional)";
                result.summary = "We're big fans of rights, laws, reason, and probably a carefully worded charter that took ages to draft. The government should be limited but effective, and markets mostly free. It's all very sensible and just a tad dull, isn't it?";
            }
        }

        // 7. CENTRISM / MIXED ECONOMY IDEOLOGIES (All three poles moderately present and somewhat balanced)
        else if (normC >= moderate && normC < strong + 5 &&
                normM >= moderate && normM < strong + 5 &&
                normP >= moderate && normP < strong + 5 &&
                (Math.max(normC, normM, normP) - Math.min(normC, normM, normP)) < 25) {
            result.broadCategory = "Centrism / Mixed Economy Ideologies";
            if (normM > normC && normM > normP && normM > Math.max(normC, normP) + 5) {
                result.specific = "Social Democracy";
                result.summary = "Capitalism is a bit of a wild beast, so let's put a strong leash on it, give it some therapy (welfare state), and make sure it plays nice with others (unions, regulations). It's all about 'fairness,' which usually means higher taxes and slightly less exciting quarterly reports.";
            } else if (normP > normC && normP > normM && normP > Math.max(normC, normP) + 5) {
                result.specific = "Market-Oriented Liberalism / Third Way";
                result.summary = "We're 'radically pragmatic,' which means we like markets but feel a bit guilty about it. So, we'll sprinkle in some social programs, emphasize 'personal responsibility,' and call it a 'New' approach. Think business-friendly with a conscience (or a focus group approved facsimile).";
            } else if (normC > normM && normC > normP && normC > Math.max(normM, normP) + 5) {
                result.specific = "Technocratic / Managerial Liberalism";
                result.summary = "Society is just a very complicated spreadsheet that needs optimizing by highly educated experts (like us!). Evidence-based policy, five-point plans, and a quiet disdain for messy things like 'feelings' or 'popular opinion.' The data says you'll be happier this way.";
            } else {
                result.specific = "Social Liberalism / Progressive Liberalism";
                result.summary = "Let's combine individual freedoms with a dash of social justice, using the state as a (hopefully) benevolent tool to fix market failures and uplift the downtrodden. It's about rights, but also responsibilities, and probably a lot of well-intentioned but slightly inefficient government programs.";
            }
        }

        // 8. FALLBACK
        else {
            if (result.specific === "Uncategorized") {
                if (normC >= strong) {
                    result.broadCategory = "Statism"; result.specific = "Statism (Undifferentiated)";
                    result.summary = "You've got a definite 'someone should be in charge' vibe, but the exact flavor of your preferred boot on the neck is unclear. More rules! More order! More... something centralized!";
                } else if (normM >= strong && normC < moderate) {
                    result.broadCategory = "Libertarian Socialism / Social Anarchism"; result.specific = "Libertarian Socialism (Undifferentiated)";
                    result.summary = "Power to the people, or the commune, or the local organic turnip co-op! You're into sharing and not being told what to do by 'The Man,' but the specifics of your utopia are still in the draft proposal stage.";
                } else if (normP >= strong && normC < moderate) {
                    result.broadCategory = "Propertarianism / Individualist Libertarianism"; result.specific = "Propertarianism (Undifferentiated)";
                    result.summary = "It's all about ME, MY rights, and MY STUFF. Freedom means being left utterly alone, preferably on a large, privately-owned island with excellent Wi-Fi and no HOA.";
                } else if (normC >= moderate && normM >= moderate && normP < moderate) {
                    result.broadCategory = "Authoritarian Socialism / State Collectivism"; result.specific = "Authoritarian Socialism (Undifferentiated)";
                    result.summary = "You like your socialism with a side of 'do as you're told because the State/Party said so.' The collective is paramount, as long as it's managed from the top down with ruthless efficiency.";
                } else if (normM >= moderate && normP >= moderate && normC < moderate) {
                    result.broadCategory = "Individualist Anarchism"; result.specific = "Individualist Anarchism (Undifferentiated)";
                    result.summary = "You're not a fan of the Man, and you value both your personal space and your ability to cooperate (or pointedly not cooperate) entirely on your own terms. A rugged individualist, but maybe with a well-stocked zine library and a strong opinion on barter systems.";
                } else if (normC >= moderate && normP >= moderate && normM < moderate) {
                    result.broadCategory = "Classical Liberalism / Constitutionalism"; result.specific = "Liberalism (Undifferentiated)";
                    result.summary = "You're probably fond of powdered wigs, lengthy legal documents, and the idea that individuals and markets mostly sort themselves out if the government just sticks to protecting property and not much else. A sensible, if perhaps slightly dusty, outlook.";
                } else {
                    result.specific = "Mixed / Eclectic Political Outlook";
                    result.summary = "You've apparently taken the 'all-you-can-eat buffet' approach to political thought, and your plate is a glorious, chaotic mess of conflicting flavors. Are you a visionary synthesist or just deeply indecisive? The world may never know.";
                }
            }
        }
        return result;
}

}); // End of DOMContentLoaded