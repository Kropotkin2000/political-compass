// ideology_ideal_points.js
//
// Where each ideology sits.
//   c, m, p : position in the triangle (percentages, must sum to 100)
//             c = Centralism (the state organises), m = Communalism (communities organise),
//             p = Privatism (private owners and markets organise)
//   a       : Liberty vs Order, 0 = maximum personal liberty, 100 = maximum order/authority
//   change  : 0 = gradual reform .. 100 = revolution            } tie-break measures, only used when
//   scale   : 0 = local .. 100 = national / global               } the test asks the tie-breaker
//   trad    : 0 = secular, progressive .. 100 = religious, traditional  } questions (see scoring.js)
//   nation  : 0 = humanity or class .. 100 = nation first        }
//   broad   : family, used for colours and the legend
//
// THESE NUMBERS ARE NOT HAND-PICKED. Each one is where a written-out set of typical answers for that
// ideology lands (the "personas" in tools/calibrate.js). To move an ideology, change its persona's
// answers, run `node tools/calibrate.js --suggest`, and copy the new line here. Then run
// `node tools/calibrate.js` to check nothing else broke.

const ideologyIdealPoints = {

    // --- Anarchist and libertarian-socialist ---
    "Anarcho-Communism":                                       { c: 5, m: 95, p: 0, a: 4, change: 100, scale: 0, trad: 0, nation: 0, broad: "Libertarian Socialism / Social Anarchism" },
    "Left Communism (General)":                                { c: 54, m: 46, p: 0, a: 21, change: 100, scale: 100, trad: 0, nation: 0, broad: "Libertarian Socialism / Social Anarchism" },
    "Anarcho-Syndicalism / Collectivist Anarchism":            { c: 8, m: 92, p: 0, a: 4, change: 100, scale: 33, trad: 0, nation: 0, broad: "Libertarian Socialism / Social Anarchism" },
    "Democratic Confederalism / Libertarian Municipalism":     { c: 6, m: 94, p: 0, a: 13, change: 67, scale: 0, trad: 0, nation: 0, broad: "Libertarian Socialism / Social Anarchism" },
    "Guild Socialism":                                         { c: 36, m: 64, p: 0, a: 38, change: 33, scale: 67, trad: 33, nation: 33, broad: "Libertarian Socialism / Social Anarchism" },
    "De Leonism":                                              { c: 36, m: 64, p: 0, a: 33, change: 67, scale: 67, trad: 0, nation: 0, broad: "Libertarian Socialism / Social Anarchism" },

    // --- Individualist anarchism ---
    "Mutualism":                                               { c: 0, m: 74, p: 26, a: 4, change: 67, scale: 33, trad: 0, nation: 0, broad: "Individualist Anarchism" },
    "Communal Individualism / Egoism":                         { c: 0, m: 22, p: 78, a: 0, change: 67, scale: 0, trad: 0, nation: 0, broad: "Individualist Anarchism" },
    "Free Market Anti-Capitalism":                             { c: 0, m: 50, p: 50, a: 4, change: 67, scale: 33, trad: 0, nation: 0, broad: "Individualist Anarchism" },

    // --- Propertarian / right-libertarian ---
    "Voluntaryism":                                            { c: 0, m: 9, p: 91, a: 8, change: 33, scale: 33, trad: 33, nation: 0, broad: "Propertarianism / Individualist Libertarianism" },
    "Anarcho-Capitalism":                                      { c: 0, m: 9, p: 91, a: 21, change: 67, scale: 33, trad: 33, nation: 0, broad: "Propertarianism / Individualist Libertarianism" },
    "Agorism / Counter-Economics":                             { c: 0, m: 30, p: 70, a: 0, change: 100, scale: 33, trad: 0, nation: 0, broad: "Propertarianism / Individualist Libertarianism" },
    "Radical Propertarianism / Hoppeanism":                    { c: 0, m: 6, p: 94, a: 75, change: 67, scale: 0, trad: 100, nation: 67, broad: "Propertarianism / Individualist Libertarianism" },
    "Geolibertarianism":                                       { c: 19, m: 10, p: 71, a: 21, change: 33, scale: 67, trad: 33, nation: 0, broad: "Propertarianism / Individualist Libertarianism" },
    "Minarchism / Night-Watchman State":                       { c: 6, m: 3, p: 91, a: 33, change: 33, scale: 67, trad: 33, nation: 33, broad: "Propertarianism / Individualist Libertarianism" },
    "Conservative Libertarianism":                             { c: 3, m: 6, p: 91, a: 67, change: 33, scale: 67, trad: 67, nation: 67, broad: "Propertarianism / Individualist Libertarianism" },

    // --- Classical liberalism ---
    "Classical Liberalism (Lockean/Smithian)":                 { c: 23, m: 3, p: 74, a: 33, change: 0, scale: 67, trad: 33, nation: 33, broad: "Classical Liberalism / Constitutionalism" },
    "Constitutional Republicanism / Conservative Liberalism":  { c: 50, m: 8, p: 42, a: 67, change: 0, scale: 67, trad: 67, nation: 67, broad: "Classical Liberalism / Constitutionalism" },

    // --- Centre and mixed economy ---
    "Market-Oriented Liberalism / Third Way":                  { c: 38, m: 16, p: 46, a: 50, change: 0, scale: 67, trad: 33, nation: 33, broad: "Centrism / Mixed Economy Ideologies" },
    "Technocratic / Managerial Liberalism":                    { c: 63, m: 4, p: 33, a: 58, change: 0, scale: 100, trad: 0, nation: 33, broad: "Centrism / Mixed Economy Ideologies" },
    "Social Liberalism / Progressive Liberalism":              { c: 55, m: 19, p: 26, a: 17, change: 33, scale: 67, trad: 0, nation: 33, broad: "Centrism / Mixed Economy Ideologies" },
    "Radical Centrism / Syncretic Politics":                   { c: 34, m: 33, p: 33, a: 50, change: 33, scale: 67, trad: 33, nation: 33, broad: "Centrism / Mixed Economy Ideologies" },
    "Social Democracy":                                        { c: 68, m: 15, p: 17, a: 46, change: 0, scale: 67, trad: 33, nation: 33, broad: "Centrism / Mixed Economy Ideologies" },
    "Social Market Economy":                                   { c: 45, m: 17, p: 38, a: 50, change: 0, scale: 67, trad: 33, nation: 33, broad: "Centrism / Mixed Economy Ideologies" },

    // --- Democratic and market socialism ---
    "Democratic Socialism":                                    { c: 50, m: 50, p: 0, a: 13, change: 33, scale: 67, trad: 0, nation: 0, broad: "Democratic Socialism" },
    "Market Socialism":                                        { c: 23, m: 60, p: 17, a: 25, change: 33, scale: 33, trad: 0, nation: 33, broad: "Democratic Socialism" },

    // --- Green politics ---
    "Green Politics":                                          { c: 32, m: 66, p: 2, a: 17, change: 67, scale: 33, trad: 0, nation: 0, broad: "Green Politics" },

    // --- Christian democracy and communitarianism ---
    "Christian Democracy":                                     { c: 35, m: 40, p: 25, a: 63, change: 0, scale: 33, trad: 67, nation: 33, broad: "Christian Democracy / Communitarianism" },
    "Communitarianism":                                        { c: 16, m: 73, p: 11, a: 75, change: 33, scale: 33, trad: 67, nation: 67, broad: "Christian Democracy / Communitarianism" },
    "Distributism":                                            { c: 0, m: 72, p: 28, a: 67, change: 33, scale: 0, trad: 100, nation: 33, broad: "Christian Democracy / Communitarianism" },

    // --- State socialism and collectivism ---
    "State Socialism (Centralised Planning Focus)":            { c: 91, m: 9, p: 0, a: 71, change: 67, scale: 67, trad: 0, nation: 33, broad: "Authoritarian Socialism / State Collectivism" },
    "State Collectivism":                                      { c: 70, m: 30, p: 0, a: 79, change: 67, scale: 67, trad: 33, nation: 67, broad: "Authoritarian Socialism / State Collectivism" },
    "National Syndicalism (Non-Fascist)":                      { c: 57, m: 43, p: 0, a: 75, change: 67, scale: 67, trad: 67, nation: 100, broad: "Authoritarian Socialism / State Collectivism" },

    // --- Conservatism and hard statism ---
    "Paternalistic Conservatism":                              { c: 63, m: 11, p: 26, a: 75, change: 0, scale: 67, trad: 67, nation: 67, broad: "Statism" },
    "Traditionalist Conservatism":                             { c: 12, m: 41, p: 47, a: 92, change: 0, scale: 33, trad: 100, nation: 67, broad: "Statism" },
    "National Conservatism":                                   { c: 43, m: 12, p: 45, a: 83, change: 33, scale: 67, trad: 67, nation: 100, broad: "Statism" },
    "Authoritarian Conservatism":                              { c: 78, m: 0, p: 22, a: 100, change: 33, scale: 67, trad: 100, nation: 67, broad: "Statism" },
    "Authoritarian Capitalism (Fascist Economic Type)":        { c: 57, m: 0, p: 43, a: 100, change: 33, scale: 67, trad: 67, nation: 100, broad: "Statism" },
    "Nationalist Corporatism (Fascist/Falangist Type)":        { c: 85, m: 7, p: 8, a: 100, change: 67, scale: 67, trad: 67, nation: 100, broad: "Statism" },
    "Nationalist Collectivism (Strasserite/NazBol Type)":      { c: 70, m: 30, p: 0, a: 100, change: 100, scale: 67, trad: 33, nation: 100, broad: "Statism" },
    "State Communism / Marxism-Leninism":                      { c: 91, m: 9, p: 0, a: 88, change: 100, scale: 67, trad: 0, nation: 33, broad: "Statism" },
    "Totalitarianism / Absolutism":                            { c: 95, m: 5, p: 0, a: 100, change: 67, scale: 100, trad: 67, nation: 67, broad: "Statism" },
};
