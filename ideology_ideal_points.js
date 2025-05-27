// ideology_ideal_points.js

const ideologyIdealPoints = {

    // --- I. EXTREME ANARCHIST & LIBERTARIAN POLES (Very Low C) ---

    // A. M-Dominant Anarchism (Very High M, Very Low C, Very Low P)
    "Anarcho-Communism":                               { c:  5, m: 90, p:  5, broad: "Libertarian Socialism / Social Anarchism" },
    "Left Communism (General)":                        { c: 10, m: 80, p: 10, broad: "Libertarian Socialism / Social Anarchism" }, // Slightly more C for party concept

    // B. P-Dominant Anarchism/Libertarianism (Very High P, Very Low C, Very Low M)
    "Voluntaryism":                                    { c:  2, m:  8, p: 90, broad: "Propertarianism / Individualist Libertarianism" }, // Most C-minimal
    "Anarcho-Capitalism":                              { c:  5, m:  5, p: 90, broad: "Propertarianism / Individualist Libertarianism" },

    // C. M-P Balanced Individualist Anarchism (Very Low C)
    "Mutualism":                                       { c:  5, m: 47.5,p:47.5, broad: "Individualist Anarchism" },
    "Free Market Anti-Capitalism":                     { c:  5, m: 35, p: 60, broad: "Individualist Anarchism" }, // P leads M
    "Communal Individualism / Egoism":                 { c:  5, m: 55, p: 40, broad: "Individualist Anarchism" }, // M leads P (M for Union of Egoists)
    "Agorism / Counter-Economics":                     { c:  5, m: 25, p: 70, broad: "Propertarianism / Individualist Libertarianism" }, // P-dominant, M for counter-economy

    // D. Other Low-C Libertarian Socialist Types (M-Dominant, P present, C still low)
    "Guild Socialism":                                 { c: 20, m: 65, p: 15, broad: "Libertarian Socialism / Social Anarchism" }, // Highest C in this LibSoc group
    "Democratic Confederalism / Libertarian Municipalism": { c: 12, m: 63, p: 25, broad: "Libertarian Socialism / Social Anarchism" },
    "Anarcho-Syndicalism / Collectivist Anarchism":    { c: 10, m: 70, p: 20, broad: "Libertarian Socialism / Social Anarchism" },
    "De Leonism":                                      { c: 15, m: 75, p: 10, broad: "Libertarian Socialism / Social Anarchism" },

    // --- II. EXTREME STATIST POLES (Very High C) ---
    "Totalitarianism / Absolutism":                    { c: 90, m:  5, p:  5, broad: "Statism" },
    "State Communism / Marxism-Leninism":              { c: 60, m: 35, p:  5, broad: "Statism" }, // C-dominant collectivism
    "Nationalist Collectivism (Strasserite/NazBol Type)":{ c: 65, m: 25, p: 10, broad: "Statism" }, // C-extreme, M for national group, P low but > ML
    "Nationalist Corporatism (Fascist/Falangist Type)":{ c: 55, m: 30, p: 15, broad: "Statism" }, // C-dom, M-corporatist, P subordinate but present


    // --- III. OTHER NON-CENTRIST IDEOLOGIES (Clear dominance of 1 or 2 axes) ---

    // A. Other Statist Types (High C, M & P vary but are subordinate)
    "Paternalistic/Traditionalist Statism":            { c: 60, m: 20, p: 20, broad: "Statism" },
    "Authoritarian Capitalism (Fascist Economic Type)":{ c: 55, m: 10, p: 35, broad: "Statism" }, // C-P focus, M very low

    // B. Other Propertarian Types (High P, C varies, M generally low)
    "Geolibertarianism":                               { c: 10, m: 25, p: 65, broad: "Propertarianism / Individualist Libertarianism" },
    "Radical Propertarianism / Hoppeanism":            { c: 15, m: 10, p: 75, broad: "Propertarianism / Individualist Libertarianism" },
    "Minarchism / Night-Watchman State":               { c: 20, m: 10, p: 70, broad: "Propertarianism / Individualist Libertarianism" },
    "Conservative Libertarianism":                     { c: 30, m: 10, p: 60, broad: "Propertarianism / Individualist Libertarianism" },

    // C. Authoritarian Socialism / State Collectivism (High C & M, Low P - less C-extreme than "Statism" group II)
    "State Socialism (Centralized Planning Focus)":    { c: 50, m: 40, p: 10, broad: "Authoritarian Socialism / State Collectivism" }, // C leads M
    "State Collectivism":                              { c: 40, m: 50, p: 10, broad: "Authoritarian Socialism / State Collectivism" }, // M leads C
    "National Syndicalism (Non-Fascist)":              { c: 45, m: 45, p: 10, broad: "Authoritarian Socialism / State Collectivism" }, // C=M

    // D. Classical Liberalism / Constitutionalism (High C & P, Low M)
    "Constitutional Republicanism / Conservative Liberalism": { c: 45, m: 10, p: 45, broad: "Classical Liberalism / Constitutionalism" }, // C=P
    "Classical Liberalism (Lockean/Smithian)":         { c: 40, m: 10, p: 50, broad: "Classical Liberalism / Constitutionalism" }, // P leads C
    "Traditional Conservatism (Burkean)":              { c: 50, m: 10, p: 40, broad: "Classical Liberalism / Constitutionalism" }, // C leads P

    // E. Democratic Socialism (M-dominant, C moderate, P present - distinct broad category)
    "Democratic Socialism":                            { c: 30, m: 50, p: 20, broad: "Democratic Socialism" },


    // --- IV. CENTRIST / MIXED ECONOMY IDEOLOGIES ---
    "Social Democracy":                                { c: 34, m: 33, p: 33, broad: "Centrism / Mixed Economy Ideologies" }, // New "balanced center"
    "Radical Centrism / Syncretic Politics":           { c: 30, m: 30, p: 40, broad: "Centrism / Mixed Economy Ideologies" }, // P-leaning balanced C/M
    "Social Liberalism / Progressive Liberalism":      { c: 35, m: 30, p: 35, broad: "Centrism / Mixed Economy Ideologies" }, // C=P, M strong, P>=M
    "Technocratic / Managerial Liberalism":            { c: 40, m: 15, p: 45, broad: "Centrism / Mixed Economy Ideologies" }, // C&P strong, P slightly leads C, M very low
    "Market-Oriented Liberalism / Third Way":          { c: 25, m: 25, p: 50, broad: "Centrism / Mixed Economy Ideologies" }  // P dominant, C=M secondary
};

// Ensure all C, M, P values for each point sum to 100 and are valid numbers.
// This is a quick sanity check that can be run in the console during development.
function validateIdealPoints() {
    let valid = true;
    let count = 0;
    for (const ideologyName in ideologyIdealPoints) {
        count++;
        const point = ideologyIdealPoints[ideologyName];
        const sum = point.c + point.m + point.p;
        // Use a small epsilon for floating point comparison
        if (Math.abs(sum - 100.0) > 0.01 || isNaN(point.c) || isNaN(point.m) || isNaN(point.p)) {
            console.error(`INVALID ideal point for ${ideologyName}: C=${point.c}, M=${point.m}, P=${point.p}. Sum: ${sum.toFixed(2)}`);
            valid = false;
        }
        if (!point.broad || typeof point.broad !== 'string' || point.broad.trim() === "") {
            console.error(`Missing or invalid broad category for ${ideologyName}`);
            valid = false;
        }
    }
    if (valid) {
        console.log(`All ${count} ideal points validated successfully (sum to 100 and have broad category).`);
    } else {
        console.error(`One or more ideal points are invalid. Total points checked: ${count}. Please check console.`);
    }
    return valid;
}

// Call validateIdealPoints() when the script loads to check during development.
// Comment out for production if not needed.
// validateIdealPoints();