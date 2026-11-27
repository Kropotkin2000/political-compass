// ideology_ideal_points.js
//
// Where each ideology sits.
//   c, m, p : position in the triangle (percentages, must sum to 100)
//             c = Centralism (the state organises), m = Communalism (communities organise),
//             p = Privatism (private owners and markets organise)
//   a       : Order vs Liberty, 0 = maximum personal liberty, 100 = maximum order/authority
//   broad   : family, used for colours and the legend
//
// The triangle alone cannot tell apart ideologies that agree on WHO should run the economy but
// disagree on authority (e.g. social democracy vs paternalistic conservatism, or democratic vs
// authoritarian socialism). The `a` value does that job.
//
// Positions were calibrated by writing typical answer sets ("personas") for a range of ideologies
// and checking that each lands on itself. Run `node tools/calibrate.js` after moving anything.

const ideologyIdealPoints = {

    // --- Anarchist and libertarian-socialist (low C) ---
    "Anarcho-Communism":                                   { c:  5, m: 88, p:  7, a: 10, broad: "Libertarian Socialism / Social Anarchism" },
    "Left Communism (General)":                            { c: 15, m: 78, p:  7, a: 35, broad: "Libertarian Socialism / Social Anarchism" },
    "Anarcho-Syndicalism / Collectivist Anarchism":        { c: 10, m: 82, p:  8, a: 15, broad: "Libertarian Socialism / Social Anarchism" },
    "Democratic Confederalism / Libertarian Municipalism": { c: 15, m: 72, p: 13, a: 25, broad: "Libertarian Socialism / Social Anarchism" },
    "Guild Socialism":                                     { c: 22, m: 65, p: 13, a: 35, broad: "Libertarian Socialism / Social Anarchism" },
    "De Leonism":                                          { c: 25, m: 68, p:  7, a: 40, broad: "Libertarian Socialism / Social Anarchism" },

    // --- Individualist anarchism (low C, between M and P) ---
    "Mutualism":                                           { c:  3, m: 62, p: 35, a:  8, broad: "Individualist Anarchism" },
    "Communal Individualism / Egoism":                     { c:  3, m: 40, p: 57, a:  2, broad: "Individualist Anarchism" },
    "Free Market Anti-Capitalism":                         { c:  5, m: 35, p: 60, a: 10, broad: "Individualist Anarchism" },

    // --- Propertarian / right-libertarian (high P) ---
    "Voluntaryism":                                        { c:  2, m: 15, p: 83, a:  3, broad: "Propertarianism / Individualist Libertarianism" },
    "Anarcho-Capitalism":                                  { c:  2, m: 12, p: 86, a: 15, broad: "Propertarianism / Individualist Libertarianism" },
    "Agorism / Counter-Economics":                         { c:  4, m: 24, p: 72, a:  5, broad: "Propertarianism / Individualist Libertarianism" },
    "Radical Propertarianism / Hoppeanism":                { c:  5, m: 10, p: 85, a: 75, broad: "Propertarianism / Individualist Libertarianism" },
    "Geolibertarianism":                                   { c: 15, m: 22, p: 63, a: 15, broad: "Propertarianism / Individualist Libertarianism" },
    "Minarchism / Night-Watchman State":                   { c: 12, m: 10, p: 78, a: 35, broad: "Propertarianism / Individualist Libertarianism" },
    "Conservative Libertarianism":                         { c: 18, m: 12, p: 70, a: 60, broad: "Propertarianism / Individualist Libertarianism" },

    // --- Classical liberalism (state + markets, low M) ---
    "Classical Liberalism (Lockean/Smithian)":             { c: 18, m: 15, p: 67, a: 30, broad: "Classical Liberalism / Constitutionalism" },
    "Constitutional Republicanism / Conservative Liberalism": { c: 38, m: 12, p: 50, a: 55, broad: "Classical Liberalism / Constitutionalism" },

    // --- Centre and mixed economy ---
    "Market-Oriented Liberalism / Third Way":              { c: 36, m: 20, p: 44, a: 48, broad: "Centrism / Mixed Economy Ideologies" },
    "Technocratic / Managerial Liberalism":                { c: 48, m: 12, p: 40, a: 50, broad: "Centrism / Mixed Economy Ideologies" },
    "Social Liberalism / Progressive Liberalism":          { c: 38, m: 27, p: 35, a: 22, broad: "Centrism / Mixed Economy Ideologies" },
    "Radical Centrism / Syncretic Politics":               { c: 34, m: 33, p: 33, a: 50, broad: "Centrism / Mixed Economy Ideologies" },
    "Social Democracy":                                    { c: 60, m: 22, p: 18, a: 40, broad: "Centrism / Mixed Economy Ideologies" },

    // --- Democratic socialism (community-led, state-assisted) ---
    "Democratic Socialism":                                { c: 38, m: 50, p: 12, a: 30, broad: "Democratic Socialism" },

    // --- State socialism and collectivism (high C and M, low P) ---
    "State Socialism (Centralised Planning Focus)":        { c: 70, m: 22, p:  8, a: 75, broad: "Authoritarian Socialism / State Collectivism" },
    "State Collectivism":                                  { c: 52, m: 40, p:  8, a: 70, broad: "Authoritarian Socialism / State Collectivism" },
    "National Syndicalism (Non-Fascist)":                  { c: 45, m: 45, p: 10, a: 70, broad: "Authoritarian Socialism / State Collectivism" },

    // --- Conservatism (state-led order, some market) ---
    "Paternalistic Conservatism":                          { c: 50, m: 25, p: 25, a: 70, broad: "Statism" },
    "Traditionalist Conservatism":                         { c: 40, m: 30, p: 30, a: 75, broad: "Statism" },
    "National Conservatism":                               { c: 45, m: 20, p: 35, a: 82, broad: "Statism" },
    "Authoritarian Conservatism":                          { c: 55, m: 20, p: 25, a: 90, broad: "Statism" },

    // --- Hard statism (high C, high authority) ---
    "Authoritarian Capitalism (Fascist Economic Type)":    { c: 58, m:  5, p: 37, a: 92, broad: "Statism" },
    "Nationalist Corporatism (Fascist/Falangist Type)":    { c: 62, m: 20, p: 18, a: 97, broad: "Statism" },
    "Nationalist Collectivism (Strasserite/NazBol Type)":  { c: 62, m: 30, p:  8, a: 95, broad: "Statism" },
    "State Communism / Marxism-Leninism":                  { c: 75, m: 20, p:  5, a: 88, broad: "Statism" },
    "Totalitarianism / Absolutism":                        { c: 90, m:  5, p:  5, a: 100, broad: "Statism" },
};
