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

    // Quiz State Variables
    let currentQuestionIndex = 0;
    let userScores = { c: 0, m: 0, p: 0 };
    let minMaxRawScores = { c: { min: 0, max: 0 }, m: { min: 0, max: 0 }, p: { min: 0, max: 0 } };


    function calculateMinMaxScores() {
        minMaxRawScores = { c: { min: 0, max: 0 }, m: { min: 0, max: 0 }, p: { min: 0, max: 0 } };
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
        // console.log("Calculated Min/Max Raw Scores:", minMaxRawScores);
    }


    function loadQuestion() {
        if (currentQuestionIndex < questions.length) {
            const currentQuestion = questions[currentQuestionIndex];
            questionTextElement.innerHTML = `Q${currentQuestion.id} (Tier ${currentQuestion.tier}): ${currentQuestion.text}`;
            optionsContainer.innerHTML = ''; 

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

                optionsContainer.appendChild(input);
                optionsContainer.appendChild(label);
            });

            progressIndicator.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
            nextButton.textContent = (currentQuestionIndex === questions.length - 1) ? "Finish & See My Glorious Doom" : "Next";
        } else {
            showResults();
        }
    }

    function getSelectedOptionScores() {
        const radioGroupName = `q${questions[currentQuestionIndex].id}_options`;
        const selectedRadio = document.querySelector(`input[name="${radioGroupName}"]:checked`);

        if (selectedRadio) {
            try {
                return JSON.parse(selectedRadio.value); 
            } catch (e) {
                console.error("Error parsing scores from radio button value:", e, selectedRadio.value);
                return null; 
            }
        }
        return null; 
    }

    nextButton.addEventListener('click', () => {
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

    function normalizeScores(rawScores, minMax) {
        let rangeC = minMax.c.max - minMax.c.min;
        let rangeM = minMax.m.max - minMax.m.min;
        let rangeP = minMax.p.max - minMax.p.min;

        if (rangeC === 0) rangeC = 1; 
        if (rangeM === 0) rangeM = 1;
        if (rangeP === 0) rangeP = 1;
        
        let normC_intermediate = ((rawScores.c - minMax.c.min) / rangeC);
        let normM_intermediate = ((rawScores.m - minMax.m.min) / rangeM);
        let normP_intermediate = ((rawScores.p - minMax.p.min) / rangeP);
        
        const totalIntermediate = normC_intermediate + normM_intermediate + normP_intermediate;

        if (totalIntermediate === 0) { 
            return { c: 33.33, m: 33.33, p: 33.33 };
        }
        
        let normC = (normC_intermediate / totalIntermediate) * 100;
        let normM = (normM_intermediate / totalIntermediate) * 100;
        let normP = (normP_intermediate / totalIntermediate) * 100;
        
        const currentSum = normC + normM + normP;
        if (Math.abs(currentSum - 100.0) > 0.01 && currentSum !== 0) { 
            const scaleFactor = 100.0 / currentSum;
            normC *= scaleFactor;
            normM *= scaleFactor;
            normP *= scaleFactor;
        }
        
        return {
            c: parseFloat(normC.toFixed(2)),
            m: parseFloat(normM.toFixed(2)),
            p: parseFloat(normP.toFixed(2))
        };
    }

// In script.js

function drawPlot(normalized, ideologyLabel = "Your Position") {
    const plotData = [{
        type: 'scatterternary',
        mode: 'markers',
        a: [normalized.c],     // Centralism data for 'a' (typically top)
        b: [normalized.m],     // Communalism data for 'b' (typically bottom-left)
        c: [normalized.p],     // Privatism data for 'c' (typically bottom-right)
        
        name: 'Your Inevitable Doom', 
        text: [`Centralism: ${normalized.c}%<br>Communalism: ${normalized.m}%<br>Privatism: ${normalized.p}%`], 
        hoverinfo: 'text', 
        marker: {
            symbol: 'circle',
            color: '#FF0000', 
            size: 14,
            line: { width: 1, color: '#880000' }
        }
    }];

    const layout = {
        title: `Your Political Caricature: ${ideologyLabel}`,
        ternary: {
            sum: 100,
            aaxis: { 
                // Centralism Axis (typically 'a' if data is C,M,P)
                title: '<b>Centralism</b><br>(Big Brother is Watching)', // Added <br>
                min: 0, 
                linewidth: 2, 
                ticks: 'outside' 
            },
            baxis: { 
                // Communalism Axis (typically 'b')
                title: '<b>Communalism</b><br>(Endless Group Hugs)', // Added <br>
                min: 0, 
                linewidth: 2, 
                ticks: 'outside' 
            },
            caxis: { 
                // Privatism Axis (typically 'c')
                title: '<b>Privatism</b><br>(Every Man for Himself)', // Added <br>  
                min: 0, 
                linewidth: 2, 
                ticks: 'outside' 
            },
            bgcolor: '#f0f0f0'
        },
        annotations: [{
            showarrow: false,
            text: '*Not actually scientific. At all.',
            x: 0.5,
            y: -0.15, 
            xref: 'paper',
            yref: 'paper',
            font: { size: 10, color: 'grey' }
        }],
        paper_bgcolor: '#fff',
        plot_bgcolor: '#fff',
        margin: { 
            l: 70, 
            r: 50, 
            // You might need to increase bottom and top margins slightly 
            // if the new lines make the titles taller and they get cut off.
            b: 100, // Potentially increased bottom margin
            t: 100, // Potentially increased top margin for the Centralism title
            pad: 4
        }
    };

    Plotly.newPlot('plot-div', plotData, layout);
}
    
       
    // In script.js
function getIdeologyLabelAndSarcasm(normC, normM, normP) {
    let result = { /* ... */ }; // Default result

    // --- Tier 1: EXTREME CORNERS ---
    if (normC >= 80 && normM <= 20 && normP <= 20) {
        result = { umbrella: "Statism", specific: "Totalitarianism / Absolutism", summary: "..." };
    } 
    else if (normM >= 80 && normC <= 20 && normP <= 20) {
        result = { umbrella: "Libertarian Socialism", specific: "Anarcho-Communism", summary: "..." };
    } 
    else if (normP >= 80 && normC <= 20 && normM <= 20) {
        result = { umbrella: "Propertarianism", specific: "Anarcho-Capitalism (Rothbardian)", summary: "..." };
    }

    // --- Tier 2: DISTINCT HIGH-C IDEOLOGIES ---
    else if (normC >= 65 && normP > normM && normP >= 15 && normM < 35 && normC > (normM + normP) && (normM + normP) < 40) { 
        result = { umbrella: "Statism", specific: "Fascism", summary: "..." };
    }
    else if (normC >= 60 && normM > normP && normM >= 15 && normP < 30 && normC > normP && (normM+normP) < 50) { 
        result = { umbrella: "Statism", specific: "Marxism-Leninism", summary: "..." };
        if (normC >= 55 && normC < 70 && normM >= 45 && normM > normP + 10) { 
            result.specific = "Authoritarian Socialism (e.g., Castroism, Titoism)"; summary: "..." 
        }
    }

    // --- Tier 3: LOW-C BASE (Anarchist Spectrum & Agorism moved) ---
    else if (normC < 25 && (normM + normP > 55) && !(normP >= 55 && normC < 20) ) { 
        result.umbrella = "Individualist Anarchism"; 
        if (normM >= 38 && normP >= 38 && Math.abs(normM - normP) < 10) { 
            result.specific = "Mutualism"; summary: "..." 
        } 
        else if (normP >= normM + 8 && normP >= 35 && normP < 55 && normM < 40) { 
            result.specific = "Market Individualist Anarchism"; summary: "..."
        } 
        else if (normM >= normP + 8 && normM >= 35 && normP < 40) { 
            result.specific = "Communal Individualist Anarchism"; summary: "..."
        } 
        else { result.specific = "Individualist Anarchism (General)"; summary: "..." }
    }
    else if (normC < 30 && normM >= 50 && normP < 35 && normM > normP + 15 && !(normM >= 80 && normC <= 20 && normP <= 20)) { 
        result = { umbrella: "Libertarian Socialism", specific: "Anarcho-Syndicalism", summary: "..." };
        if (normC >= 15 && normC < 30) { 
            result.specific = "Council Communism"; summary: "..." 
        }
    }

    // --- Tier 4: MAJOR MID-RANGE UMBRELLAS ---
    else if (normP >= 55 && normC < 20 && normM < 30 && !(normP >= 80 && normC <= 20 && normM <= 20)) { 
        result = { umbrella: "Propertarianism", specific: "Agorism / Counter-Economics", summary: "..." };
    }
    else if (normP >= 50 && normC >= 5 && normC < 40 && normM < 30 && normP > normC + 10 && normP > normM + 20 && !(normP >= 80 && normC <= 20 && normM <= 20) ) { 
        result = { umbrella: "Propertarianism", specific: "Minarchism", summary: "..." };
    }
    // "Liberal Tradition" Umbrella Block
    else if (normC >= 15 && normC < 55 && 
             normM >= 10 && normM < 50 && 
             normP >= 15 && normP < 70 && 
             (normM + normP > 40 || normC + normP > 45 || normC + normM > 40) && 
             !(normP >= 50 && normC < 40 && normM < 30 && normP > normC +10) && 
             !(normM >= 35 && normP < 45 && normC < 55 && normM > normP) ) { 

        result.umbrella = "Liberal Tradition";
        if (normP >= 40 && normC >= 20 && normC < 40 && normM < 30 && normP > normC + 5) { 
            result.specific = "Libertarian Conservatism"; /* ... */
        }
        else if (normP >= 40 && normC >= 15 && normC < 35 && normM < 30 && normP > normC + 10 && Math.abs(normP-normC) > 5) {
            result.specific = "Classical Liberalism"; /* ... */
        }
        else if (normC >= 35 && normC <= 55 && normM >= 25 && normM < 40 && normP < 35 && normC > normP && normM > normP) {
            result.specific = "One-Nation Conservatism"; /* ... */
        }
        else if (normC >= 38 && normP >= 20 && normM < 30 && normC > normM && (normC >= normP - 15 || normP <= normC + 5)) { 
            result.specific = "Traditional Conservatism"; /* ... */
            if (normC >= 50 && (normP < Math.max(normM + 10, 25)) ) { 
                result.specific = "National Conservatism"; /* ... */
            }
        }
        else if (normM >= 30 && normC >= 20 && normC < 50 && normP >= 20 && normM > normP && Math.abs(normC-normP) < 20) { 
            result.specific = "Social Liberalism"; /* ... */
        }
        else {
            result.specific = "Liberalism (Unspecified Variant)"; /* ... */
        }
    } 
    // "Socialism (Non-Marxist State)" Umbrella Block
    else if (normM >= 35 && normP < 45 && normC < 55 && normM > normP && normM > normC - 5) {
        result.umbrella = "Socialism (Non-Marxist State)";
        if (normM >= 40 && normP >= 25 && normP < 45 && normC < 40 && normM > normP + 5) {
            result.specific = "Market Socialism"; /* ... */
        }
        else if (normM >= 40 && normC >= 25 && normC < 50 && normP < 30 && normM > normC) { 
            result.specific = "Guild Socialism"; /* ... */
        }
        else if (normM >= 38 && normC >= 20 && normC < 55 && normP < 30 && normM > normC && normM > normP + 10) { 
            result.specific = "Democratic Socialism";  /* ... */
        } else { 
             result.specific = "Socialism (General Non-Marxist State)"; /* ... */
        }
    }
    
    // --- Tier 5: CENTRISM / MODERATE POLITICS (REVISED) ---
    else if (normC >= 15 && normC <= 50 && 
             normM >= 25 && normM <= 55 &&
             normP >= 20 && normP <= 55 && 
             (Math.max(normC, normM, normP) - Math.min(normC, normM, normP)) < 30 ) { 
        
        result.umbrella = "Centrism / Moderate Politics";

        if (normP > normM && normP > normC && normP >= Math.max(normM, normC) + 5 && normP > 30) { 
            result.specific = "Third Way / Market-Oriented Centrism"; 
            result.summary = "We're 'radically pragmatic'! Markets are good, efficiency is great, and social justice is a nice bonus if it doesn't hurt the bottom line too much. Think 'New Labour' without the actual Labour part.";
        } 
        else if (normC > normM && normC > normP && normC >= Math.max(normM, normP) + 5 && normC > 30) { 
            result.specific = "Technocratic Centrism / Managerialism"; 
            result.summary = "Society is a complex machine that just needs competent managers (like us!) and evidence-based policies. Feelings are nice, but have you seen our spreadsheets?";
        }
        else if (normC >= 15 && normC < 30 && 
                 normM >= 30 && normM < 45 && 
                 normP >= 30 && normP < 50 && 
                 Math.abs(normM - normP) < 15 ) { 
            result.specific = "Liberal Socialism";
            result.summary = "Let's blend individual liberty with social justice, using markets wisely but fairly! Less state than the old guard, more heart than pure capitalism. Think 'social market economy' with extra rights.";
        }
        else { 
            result.specific = "Social Democracy"; 
            result.summary = "Capitalism needs a good hug and some strict house rules. Let's have markets, but also a comfy welfare state so nobody starves (too much). It's all about 'balance' and 'fairness' (and probably higher taxes).";
        }
    }

    // --- Tier 6: Broad Ideological Leanings ---
    // (These remain the same as before)
    else if (normC >= normM && normC >= normP && normC >= 35 && !(normC >= 80 && normM <= 20 && normP <= 20)) { 
        result = { umbrella: "Statism / Centralism", specific: "Statism (General)", summary: "..." };
    } 
    else if (normM >= normC && normM >= normP && normM >= 35 && !(normM >= 80 && normC <= 20 && normP <= 20)) { 
        result = { umbrella: "Communalism / Collectivism", specific: "Collectivism (General)", summary: "..." };
    } 
    else if (normP >= normC && normP >= normM && normP >= 35 && !(normP >= 80 && normC <= 20 && normM <= 20)) { 
        result = { umbrella: "Propertarianism / Individualism", specific: "Propertarianism (General)", summary: "..." };
    }

    return result;
}

    // In script.js

    function showResults() {
        quizArea.style.display = 'none';
        resultsArea.style.display = 'block';

        rawScoresElement.innerHTML = `Raw Scores (mostly meaningless without context):<br>
                                    Centralism: ${userScores.c.toFixed(2)}<br>
                                    Communalism: ${userScores.m.toFixed(2)}<br>
                                    Privatism: ${userScores.p.toFixed(2)}`;

        const normalized = normalizeScores(userScores, minMaxRawScores);
        normalizedScoresElement.innerHTML = `Normalized Scores (for the pretty triangle):<br>
                                            Centralism: ${normalized.c}%<br>
                                            Communalism: ${normalized.m}%<br>
                                            Privatism: ${normalized.p}%`;
        
        const ideologyInfo = getIdeologyLabelAndSarcasm(normalized.c, normalized.m, normalized.p);

        const resultsHeading = resultsArea.querySelector('h2'); 
        const firstParagraphAfterHeading = resultsHeading.nextElementSibling; 

        let ideologyLabelElement = document.getElementById('ideology-label-result');
        if (!ideologyLabelElement) {
            ideologyLabelElement = document.createElement('h3');
            ideologyLabelElement.id = 'ideology-label-result';
            firstParagraphAfterHeading.parentNode.insertBefore(ideologyLabelElement, firstParagraphAfterHeading.nextSibling);
        }
        
        if (ideologyInfo.specific && ideologyInfo.umbrella && 
            ideologyInfo.specific !== ideologyInfo.umbrella && 
            ideologyInfo.umbrella !== "Unclassifiable Political Profile") {
            ideologyLabelElement.innerHTML = `Your Political Profile:<br>
                                        <b>Specific Ideology:</b> ${ideologyInfo.specific}<br>
                                        <b>Umbrella Category:</b> ${ideologyInfo.umbrella}`;
        } else if (ideologyInfo.specific) {
            ideologyLabelElement.innerHTML = `Your Political Profile:<br>
                                        <b>Ideology:</b> ${ideologyInfo.specific}`;
        } else { 
            ideologyLabelElement.innerHTML = `Your Political Profile:<br>
                                        <b>Category:</b> ${ideologyInfo.umbrella || "Not Determined"}`;
        }

        let ideologySummaryElement = document.getElementById('ideology-summary-result');
        if (!ideologySummaryElement) {
            ideologySummaryElement = document.createElement('p');
            ideologySummaryElement.id = 'ideology-summary-result';
            ideologySummaryElement.style.fontStyle = 'italic';
            ideologySummaryElement.style.border = '1px dashed #ccc';
            ideologySummaryElement.style.padding = '10px';
            ideologyLabelElement.parentNode.insertBefore(ideologySummaryElement, ideologyLabelElement.nextSibling);
        }
        // --- THIS IS THE CHANGED LINE ---
        ideologySummaryElement.textContent = ideologyInfo.summary; // Removed "Sarcastic Summary: " prefix
        // --- END OF CHANGE ---
        
        let plotTitleLabel = ideologyInfo.specific || "Your Political Profile"; 

        const genericSpecificKeywords = [
            "(General)", 
            "(Pragmatic)", 
            "(Idealistic)", 
            "(Propertarian)", // For Propertarianism (General)
            "Unique Political Outlook (Uncategorized)" 
        ]; 
        
        if (genericSpecificKeywords.some(keyword => ideologyInfo.specific.includes(keyword)) &&
            ideologyInfo.umbrella &&
            ideologyInfo.umbrella !== "Unclassifiable Political Profile" && 
            ideologyInfo.umbrella !== ideologyInfo.specific) {
            plotTitleLabel = ideologyInfo.umbrella;
        } 
        else if (plotTitleLabel === "Unique Political Outlook (Uncategorized)" || plotTitleLabel === "Unclassifiable Political Profile") {
            plotTitleLabel = "Your Political Profile";
        }

        drawPlot(normalized, plotTitleLabel);
}

    // Initial setup
    calculateMinMaxScores();
    loadQuestion();       
});