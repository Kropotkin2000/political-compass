document.addEventListener('DOMContentLoaded', () => {
    const questionTextElement = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const nextButton = document.getElementById('next-button');
    const progressIndicator = document.getElementById('progress-indicator');
    const quizArea = document.getElementById('quiz-area');
    const resultsArea = document.getElementById('results-area');
    const rawScoresElement = document.getElementById('raw-scores');
    const normalizedScoresElement = document.getElementById('normalized-scores');

    let currentQuestionIndex = 0;
    let userScores = { c: 0, m: 0, p: 0 };

    // --- CRITICAL FOR NORMALIZATION: Min/Max Possible Raw Scores ---
    // This function needs to be accurate based on the 'questions.js' scores.
    // It calculates the theoretical min and max raw score for each pole.
    let minMaxRawScores = {
        c: { min: 0, max: 0 },
        m: { min: 0, max: 0 },
        p: { min: 0, max: 0 }
    };

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
        console.log("Calculated Min/Max Raw Scores:", minMaxRawScores); // For debugging
    }


    function loadQuestion() {
        if (currentQuestionIndex < questions.length) {
            const currentQuestion = questions[currentQuestionIndex];
            questionTextElement.innerHTML = `Q${currentQuestion.id} (Tier ${currentQuestion.tier}): ${currentQuestion.text}`; // Using innerHTML for bold etc. if needed
            optionsContainer.innerHTML = ''; // Clear previous options

            currentQuestion.options.forEach((option, index) => {
                const optionId = `q${currentQuestion.id}_opt${index}`;
                const li = document.createElement('li'); // Using li for better structure if needed, or just labels
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = `q${currentQuestion.id}_options`;
                input.id = optionId;
                input.value = index; // Store the index of the option

                const label = document.createElement('label');
                label.htmlFor = optionId;
                label.textContent = option.text;

                optionsContainer.appendChild(input);
                optionsContainer.appendChild(label);
                optionsContainer.appendChild(document.createElement('br')); // Simple line break
            });

            progressIndicator.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
            nextButton.textContent = (currentQuestionIndex === questions.length - 1) ? "Finish & See My Glorious Doom" : "Next";
        } else {
            showResults();
        }
    }

    function getSelectedOptionScores() {
        const currentQuestion = questions[currentQuestionIndex];
        const selectedRadio = document.querySelector(`input[name="q${currentQuestion.id}_options"]:checked`);

        if (selectedRadio) {
            const optionIndex = parseInt(selectedRadio.value);
            return currentQuestion.options[optionIndex].scores;
        }
        return null; // No option selected
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
            alert("Please select an option before proceeding, you indecisive wretch!");
        }
    });

    function normalizeScores(rawScores, minMax) {
        // Shift scores so that the minimum possible score for each pole becomes 0.
        // Then, calculate proportions for the ternary plot (summing to 100).
        let shiftedC = rawScores.c - minMax.c.min;
        let shiftedM = rawScores.m - minMax.m.min;
        let shiftedP = rawScores.p - minMax.p.min;

        // The "range" for each pole after shifting min to 0
        let rangeC = minMax.c.max - minMax.c.min;
        let rangeM = minMax.m.max - minMax.m.min;
        let rangeP = minMax.p.max - minMax.p.min;
        
        // Avoid division by zero if a range is 0 (e.g., if all questions had same min/max for a pole)
        // This normalization makes each score a percentage of its own potential positive range
        // then we combine them.
        // let normC_individual = rangeC === 0 ? 0 : (shiftedC / rangeC) * 100;
        // let normM_individual = rangeM === 0 ? 0 : (shiftedM / rangeM) * 100;
        // let normP_individual = rangeP === 0 ? 0 : (shiftedP / rangeP) * 100;

        // Total of shifted scores (this ensures proportions sum to 100)
        const totalShifted = shiftedC + shiftedM + shiftedP;

        if (totalShifted === 0) { // Avoid division by zero, assign a neutral center if all scores cancel out perfectly to min
            return { c: 33.33, m: 33.33, p: 33.33 };
        }
        
        let normC = (shiftedC / totalShifted) * 100;
        let normM = (shiftedM / totalShifted) * 100;
        let normP = (shiftedP / totalShifted) * 100;

        // Ensure they sum to 100 exactly due to potential floating point issues
        const currentSum = normC + normM + normP;
        if (Math.abs(currentSum - 100.0) > 0.01 && currentSum !== 0) { // Check if not close to 100 and not zero
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

    function drawPlot(normalized) {
        const plotData = [{
            type: 'scatterternary',
            mode: 'markers',
            a: [normalized.p], // Corresponds to Privatism axis
            b: [normalized.c], // Corresponds to Centralism axis
            c: [normalized.m], // Corresponds to Communalism axis
            name: 'Your Inevitable Doom',
            marker: {
                symbol: 'circle',
                color: '#FF0000', // A suitably alarming red
                size: 14,
                line: { width: 1, color: '#880000'}
            },
            hoverinfo: 'text',
            text: [`C: ${normalized.c}%<br>M: ${normalized.m}%<br>P: ${normalized.p}%`]
        }];

        const layout = {
            title: 'Your Highly Scientific* Political Caricature',
            ternary: {
                sum: 100,
                aaxis: { title: '<b>Privatism</b> (Every Man for Himself!)', min: 0, linewidth: 2, ticks: 'outside' },
                baxis: { title: '<b>Centralism</b> (Big Brother is Watching)', min: 0, linewidth: 2, ticks: 'outside' },
                caxis: { title: '<b>Communalism</b> (Endless Group Hugs)', min: 0, linewidth: 2, ticks: 'outside' },
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
            plot_bgcolor: '#fff' // Background inside the plot area itself
        };

        Plotly.newPlot('plot-div', plotData, layout);
    }

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
        drawPlot(normalized);
    }

    // Initial setup
    calculateMinMaxScores(); // Calculate min/max scores based on the question data
    loadQuestion(); // Load the first question
});