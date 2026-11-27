// questions.js
//
// TWO TONES
// ---------
// Every question and answer has `text` (the sarcastic version) and `classroom` (plain, neutral wording
// for the classroom version). Both versions of an answer must mean the same thing: scores are shared.
//
// HOW THE SCORING WORKS
// ---------------------
// Triangle questions (type 'forcedChoice4') score three axes:
//   c = Centralism   (the state organises things: public ownership, planning, public services)
//   m = Communalism  (communities organise things: co-ops, mutual aid, collective decisions)
//   p = Privatism    (private owners organise things: property, markets, contracts)
//
// Each answer is a point in the triangle, and your position is the average of all your points:
//   "Pick a corner"  - one option per corner (the point sits on that corner), plus a muddle option.
//   "Pick a villain" - one option criticising each corner (the point sits halfway along the opposite
//                      edge, i.e. split evenly between the other two corners), plus a muddle option.
//   Muddle options sit at the dead centre.
//   "Pick a blend"   - one option for each PAIR of corners (state + community, state + private,
//                      community + private), sitting halfway along that edge, plus a muddle option.
//                      These let people say what mixed positions (social democracy, market socialism,
//                      distributism...) actually think, instead of picking the nearest corner.
// So answering every question with the same corner puts you exactly on that corner, and answering
// everything with a muddle puts you exactly in the middle.
//
// Every corner option mocks its own downside in the same register (queues and forms / meetings and
// rotas / fine print and inequality), so no corner is the obvious "nice" answer.
//
// Order vs Liberty statements (type 'agreeScale') score a separate axis, a, from -2 to +2:
//   +a = more order and authority, -a = more personal liberty. Half the statements are keyed each way.
//   Your Order score is the average, rescaled to 0 (all liberty) .. 100 (all order).
//   Authoritarianism is deliberately NOT part of Centralism: you can want a big state and civil liberties.

const PICK_C = { c: 1, m: 0, p: 0 };
const PICK_M = { c: 0, m: 1, p: 0 };
const PICK_P = { c: 0, m: 0, p: 1 };
const AGAINST_C = { c: 0, m: 0.5, p: 0.5 };
const AGAINST_M = { c: 0.5, m: 0, p: 0.5 };
const AGAINST_P = { c: 0.5, m: 0.5, p: 0 };
const MUDDLE = { c: 1 / 3, m: 1 / 3, p: 1 / 3 };
// "Pick a blend" answers sit halfway along an edge: two corners combined.
const BLEND_CM = { c: 0.5, m: 0.5, p: 0 };   // state + community
const BLEND_CP = { c: 0.5, m: 0, p: 0.5 };   // state + private
const BLEND_MP = { c: 0, m: 0.5, p: 0.5 };   // community + private

// Agree scale. keyed: 1 means "agree = more order", -1 means "agree = more liberty".
// Answers run from strongly agree to strongly disagree (never shuffled); both sides are teased equally.
const agreeScale = (keyed) => [
    { text: "Obviously. Why is this even a question?",                classroom: "Strongly agree",    scores: { a: 2 * keyed } },   // strongly agree
    { text: "Yes, but I wouldn't say it at a dinner party.",          classroom: "Agree",             scores: { a: 1 * keyed } },   // agree
    { text: "Depends who's asking. And who's watching.",              classroom: "Neither agree nor disagree", scores: { a: 0 } },           // shrug
    { text: "No, accompanied by a long and meaningful sigh.",         classroom: "Disagree",          scores: { a: -1 * keyed } },  // disagree
    { text: "Absolutely not. I'm drafting a strongly worded letter.", classroom: "Strongly disagree", scores: { a: -2 * keyed } },  // strongly disagree
];

const questions = [
    {
        id: 'q1',
        text: "Who should own the big stuff: the railways, the power grid, the water pipes?",
        classroom: "Who should own major infrastructure, such as railways, the power grid and the water supply?",
        type: 'forcedChoice4',
        options: [
            { text: "The state. It's infrastructure for everyone, so the public should own it. The trains will still be late, but they'll be *our* late trains.", classroom: "The state, so that essential services are run for the public rather than for profit.", scores: PICK_C },
            { text: "The people who use it and run it, as co-ops or local trusts. Expect a lot of annual general meetings about leaves on the line.", classroom: "The people who use and work in them, through co-operatives or local trusts.", scores: PICK_M },
            { text: "Private companies competing for customers. Competition keeps them sharp, and you'll get a loyalty card for your water.", classroom: "Private companies, competing for customers to keep services efficient.", scores: PICK_P },
            { text: "Some mix of all three, renegotiated every decade by people who have never been on a train.", classroom: "A mix of public, community and private ownership, decided case by case.", scores: MUDDLE },
        ]
    },
    {
        id: 'q2',
        text: "Someone breaks their leg. How should their treatment be arranged?",
        classroom: "How should medical treatment be organised and paid for?",
        type: 'forcedChoice4',
        options: [
            { text: "A national health service, run locally by elected community health boards. Free at the point of use, discussed at length at the point of governance.", classroom: "A national health service, run locally by elected community health boards.", scores: BLEND_CM },
            { text: "Compulsory public insurance, with private hospitals competing for your custom. Universal cover, glossy brochures.", classroom: "Compulsory public insurance, with private and public hospitals competing for patients.", scores: BLEND_CP },
            { text: "Mutual insurers owned by their members, competing for members. Your premium comes with voting rights you will never use.", classroom: "Mutual insurers owned by their members, competing with each other for members.", scores: BLEND_MP },
            { text: "A bewildering hybrid that nobody fully understands, including the people running it.", classroom: "A mixed system combining public, mutual and private provision.", scores: MUDDLE },
        ]
    },
    {
        id: 'q3',
        text: "There aren't enough homes. What's the fix?",
        classroom: "There is a shortage of housing. What is the best solution?",
        type: 'forcedChoice4',
        options: [
            { text: "Council homes, built by the state and run by tenants' associations. The roof gets fixed once the subcommittee agrees on a roofer.", classroom: "Public housing built by the state and managed by tenants' associations.", scores: BLEND_CM },
            { text: "The government sets the targets and the subsidies, and private builders do the building. Ribbon-cutting ceremonies all round.", classroom: "The government sets targets and offers subsidies, and private developers build the homes.", scores: BLEND_CP },
            { text: "Housing co-ops and self-build groups buying land on the open market. Your neighbours are also your landlords, and your builders.", classroom: "Housing co-operatives and self-build groups buying land on the open market.", scores: BLEND_MP },
            { text: "Announce an ambitious target, miss it, then announce a new one.", classroom: "Combine public building, community schemes and private development.", scores: MUDDLE },
        ]
    },
    {
        id: 'q4',
        text: "Statement: The police should be able to stop and search anyone they find suspicious, even without firm evidence.",
        classroom: "Statement: The police should be able to stop and search people they consider suspicious, even without firm evidence.",
        type: 'agreeScale',
        options: agreeScale(1)
    },
    {
        id: 'q5',
        text: "Which of these worries you most about the future?",
        classroom: "Which of these concerns you most about the future?",
        type: 'forcedChoice4',
        options: [
            { text: "A state that keeps growing until it runs everything, from your pension to your breakfast.", classroom: "Government growing too powerful and controlling too much of daily life.", scores: AGAINST_C },
            { text: "Everything being decided by endless committees, where whoever has the most free time wins.", classroom: "Decisions being taken over by small groups who dominate meetings and committees.", scores: AGAINST_M },
            { text: "Corporations owning everything, from your home to your data to your water supply.", classroom: "Large corporations owning and controlling more and more of the economy.", scores: AGAINST_P },
            { text: "Honestly, all three, in rotation.", classroom: "All of these, about equally.", scores: MUDDLE },
        ]
    },
    {
        id: 'q6',
        text: "Who should have the final say in how a business is run?",
        classroom: "Who should have the final say in how a business is run?",
        type: 'forcedChoice4',
        options: [
            { text: "Publicly owned firms, run day to day by elected councils of workers. The state owns the factory; the canteen menu is put to a vote.", classroom: "Publicly owned firms, managed day to day by elected councils of their workers.", scores: BLEND_CM },
            { text: "The owners, within strict laws on pay, hours and safety set by the state. Freedom to manage, subject to an inspector with a clipboard.", classroom: "The owners, but within strict laws on pay, hours and safety that the state sets and enforces.", scores: BLEND_CP },
            { text: "Worker co-operatives competing in an open market. Everyone's a boss, and everyone's worried about the quarterly figures.", classroom: "Worker co-operatives, owned by their workers and competing in an open market.", scores: BLEND_MP },
            { text: "Whoever won the last round of negotiations, until the next round.", classroom: "It should be negotiated between owners, workers and government.", scores: MUDDLE },
        ]
    },
    {
        id: 'q7',
        text: "Who should run schools?",
        classroom: "Who should run schools?",
        type: 'forcedChoice4',
        options: [
            { text: "The state: one national curriculum, inspected to the same standard everywhere. Consistent, with the occasional pointless worksheet.", classroom: "The state, with a national curriculum and the same standards everywhere.", scores: PICK_C },
            { text: "Parents, teachers and the local community, deciding together what their children need. Prepare for a twelve-hour debate about uniforms.", classroom: "Parents, teachers and the local community, deciding together.", scores: PICK_M },
            { text: "Anyone who wants to open a school, with parents free to choose and the funding following the child. Bring your prospectus-decoding skills.", classroom: "Independent providers, with parents free to choose and funding following the child.", scores: PICK_P },
            { text: "The current system, but with a new acronym every three years.", classroom: "A mix of national standards, local input and parental choice.", scores: MUDDLE },
        ]
    },
    {
        id: 'q8',
        text: "Statement: People should be free to say things that most of us find offensive.",
        classroom: "Statement: People should be free to say things that most others find offensive.",
        type: 'agreeScale',
        options: agreeScale(-1)
    },
    {
        id: 'q9',
        text: "Some people are vastly richer than others. What's mostly to blame?",
        classroom: "There are large differences in wealth between people. What is the main cause?",
        type: 'forcedChoice4',
        options: [
            { text: "Governments handing out favours, bailouts and protected monopolies to their friends.", classroom: "Governments granting favours, bailouts and protected positions to the well-connected.", scores: AGAINST_C },
            { text: "Cosy cliques and closed networks that look after their own and keep outsiders out.", classroom: "Closed networks that look after their own members and keep outsiders out.", scores: AGAINST_M },
            { text: "An economy where wealth piles up for those who already have it.", classroom: "Markets that let wealth build up among those who already have it.", scores: AGAINST_P },
            { text: "Mostly luck: who your parents were, where you were born, and which way the dice fell.", classroom: "Mainly luck and circumstance, such as family background and place of birth.", scores: MUDDLE },
        ]
    },
    {
        id: 'q10',
        text: "How should we cut carbon emissions?",
        classroom: "How should we reduce carbon emissions?",
        type: 'forcedChoice4',
        options: [
            { text: "Government plans and public investment: build the green grid directly and set binding targets. Five-year plans, but for wind turbines.", classroom: "Government planning and public investment, with binding targets.", scores: PICK_C },
            { text: "Community energy co-ops run by the neighbourhoods that use the power. Solar panels on every roof, and a rota for the Tuesday meeting.", classroom: "Local community energy projects and co-operatives.", scores: PICK_M },
            { text: "Put a price on carbon and let markets find the cheapest cuts. Efficiency, innovation, and a very smug app.", classroom: "Put a price on carbon and let markets find the cheapest ways to cut emissions.", scores: PICK_P },
            { text: "A summit, a pledge, a photo opportunity, and a follow-up summit.", classroom: "International agreements that combine several approaches.", scores: MUDDLE },
        ]
    },
    {
        id: 'q11',
        text: "What should happen to the giant tech platforms?",
        classroom: "What should happen to the largest technology companies?",
        type: 'forcedChoice4',
        options: [
            { text: "Regulate them hard, or bring them into public ownership so they answer to voters rather than shareholders. Terms of service now in triplicate.", classroom: "Strict regulation or public ownership, so that they answer to elected governments.", scores: PICK_C },
            { text: "Replace them with user-owned co-operative platforms. Fewer adverts, many more forum threads about governance.", classroom: "Replace them with platforms owned co-operatively by their users.", scores: PICK_M },
            { text: "Leave them alone; if they get bad enough, a competitor will eat their lunch. Probably. Eventually.", classroom: "Leave them to market competition, which will challenge them if they fail their users.", scores: PICK_P },
            { text: "Fine them a rounding error every few years and call it accountability.", classroom: "Moderate regulation and occasional fines, much as now.", scores: MUDDLE },
        ]
    },
    {
        id: 'q12',
        text: "Statement: A country needs a strong shared national identity, and newcomers should adopt it.",
        classroom: "Statement: A country needs a strong shared national identity, and newcomers should adopt it.",
        type: 'agreeScale',
        options: agreeScale(1)
    },
    {
        id: 'q13',
        text: "When a big project goes badly wrong, the cause is usually:",
        classroom: "When large projects fail, what is usually the main cause?",
        type: 'forcedChoice4',
        options: [
            { text: "Officials who answer to nobody and never pay for their mistakes.", classroom: "Officials who are not held accountable for their decisions.", scores: AGAINST_C },
            { text: "Too many people with a veto, so nothing gets decided until it's too late.", classroom: "Too many groups able to block decisions, causing delay.", scores: AGAINST_M },
            { text: "Someone cutting corners to save money and keep the share price up.", classroom: "Cutting costs in order to increase profits.", scores: AGAINST_P },
            { text: "A bit of everyone's fault, plus a spreadsheet error.", classroom: "A combination of factors, often including simple human error.", scores: MUDDLE },
        ]
    },
    {
        id: 'q14',
        text: "How should a society look after people who fall on hard times?",
        classroom: "How should a society support people who fall on hard times?",
        type: 'forcedChoice4',
        options: [
            { text: "A guaranteed safety net from the state: benefits, pensions, the lot. You'll just need to fill in form B-47 (and B-47a).", classroom: "A guaranteed safety net from the state: benefits, pensions and services.", scores: PICK_C },
            { text: "Mutual aid: neighbours, unions, friendly societies and food co-ops looking after each other. Warm and generous, but it depends who turns up.", classroom: "Mutual aid through neighbours, unions, friendly societies and community groups.", scores: PICK_M },
            { text: "Growth, jobs and private charity. A rising tide lifts all boats, provided you own a boat.", classroom: "Economic growth, jobs and voluntary private charity.", scores: PICK_P },
            { text: "A system so complicated that half the people who need help never find out they qualify.", classroom: "A combination of state support, community help and private charity.", scores: MUDDLE },
        ]
    },
    {
        id: 'q15',
        text: "Who should run the banks?",
        classroom: "Who should run the banks?",
        type: 'forcedChoice4',
        options: [
            { text: "A public bank that lends through local councils and community funds. Your loan is approved by a committee of your neighbours, on behalf of the Treasury.", classroom: "A public bank that lends through local councils and community funds.", scores: BLEND_CM },
            { text: "Private banks, tightly regulated, with the state as lender of last resort. Profits are private; the safety net is very public.", classroom: "Private banks, closely regulated, with the state as lender of last resort.", scores: BLEND_CP },
            { text: "Credit unions and building societies competing with each other. Banking with a members' newsletter.", classroom: "Credit unions and mutual building societies, competing with each other.", scores: BLEND_MP },
            { text: "Whichever one has a cash machine nearest the chip shop.", classroom: "A mixture of public, mutual and private banks.", scores: MUDDLE },
        ]
    },
    {
        id: 'q16',
        text: "Statement: What consenting adults do in private is nobody else's business.",
        classroom: "Statement: What consenting adults do in private is nobody else's business.",
        type: 'agreeScale',
        options: agreeScale(-1)
    },
    {
        id: 'q17',
        text: "Who would you least want to have power over your life?",
        classroom: "Whose power over your life would concern you most?",
        type: 'forcedChoice4',
        options: [
            { text: "Officials in a distant ministry who have never met you.", classroom: "Government officials who have never met you.", scores: AGAINST_C },
            { text: "Your neighbours, voting on how you ought to live.", classroom: "Your neighbours, voting on how you should live.", scores: AGAINST_M },
            { text: "Your landlord and your employer.", classroom: "Your landlord and your employer.", scores: AGAINST_P },
            { text: "All of them equally, which is why I live in a shed.", classroom: "All of them, about equally.", scores: MUDDLE },
        ]
    },
    {
        id: 'q18',
        text: "Who should pay for museums, theatre and the arts?",
        classroom: "Who should pay for museums, theatre and the arts?",
        type: 'forcedChoice4',
        options: [
            { text: "The state, through generous public funding so culture belongs to everyone. A committee will decide what counts as art.", classroom: "The state, through public funding, so that culture is available to everyone.", scores: PICK_C },
            { text: "Local communities and volunteers, running their own venues and festivals. Expect an ambitious amateur musical.", classroom: "Local communities and volunteers, running their own venues and events.", scores: PICK_M },
            { text: "Tickets, patrons and sponsors. If people value it, they'll pay for it, and the MegaCorp Pavilion is a small price.", classroom: "Ticket sales, private patrons and sponsors.", scores: PICK_P },
            { text: "A lottery, a levy, a gala and a lot of anxious grant applications.", classroom: "A mix of public grants, lottery money, sponsorship and ticket sales.", scores: MUDDLE },
        ]
    },
    {
        id: 'q19',
        text: "Your town must choose between a new park and a new car park. Who decides?",
        classroom: "A town must choose between a new park and a new car park. Who should decide?",
        type: 'forcedChoice4',
        options: [
            { text: "The council's planning department, using expert reports and the official long-term plan.", classroom: "The council's planners, using expert advice and a long-term plan.", scores: PICK_C },
            { text: "A town assembly where everyone gets a say and the vote is binding. Bring snacks.", classroom: "A town meeting where every resident can vote and the result is binding.", scores: PICK_M },
            { text: "Whoever owns the land. If people want a park badly enough, they can club together and buy it.", classroom: "The owner of the land, who can sell it to whoever values it most.", scores: PICK_P },
            { text: "A public consultation whose result was decided before it started.", classroom: "A public consultation, followed by a council decision.", scores: MUDDLE },
        ]
    },
    {
        id: 'q20',
        text: "Statement: In a real emergency, the government should be able to suspend normal rights and rules.",
        classroom: "Statement: In a genuine emergency, the government should be able to suspend normal rights and rules.",
        type: 'agreeScale',
        options: agreeScale(1)
    },
    {
        id: 'q21',
        text: "What's the biggest lie people tell themselves about freedom?",
        classroom: "Which is the greatest threat to real freedom?",
        type: 'forcedChoice4',
        options: [
            { text: "That rights granted by the state are safe, when the state can take them back whenever it likes.", classroom: "Rights granted by the state can also be taken away by the state.", scores: AGAINST_C },
            { text: "That a close-knit community sets you free, when it comes with a thousand unwritten rules.", classroom: "Close-knit communities put pressure on people to conform.", scores: AGAINST_M },
            { text: "That a free market makes you free, when your rent and your boss decide most of your choices.", classroom: "Depending on landlords and employers limits people's real choices.", scores: AGAINST_P },
            { text: "That anyone is free before their first coffee.", classroom: "No single one; it depends on the situation.", scores: MUDDLE },
        ]
    },
    {
        id: 'q22',
        text: "Where do the big breakthroughs come from?",
        classroom: "Where do major scientific and technological breakthroughs mostly come from?",
        type: 'forcedChoice4',
        options: [
            { text: "Publicly funded research and government missions: moon landings, the internet, vaccines. Forms in quadruplicate, results eventually.", classroom: "Publicly funded research and government-led missions.", scores: PICK_C },
            { text: "Open collaboration, with scientists, hobbyists and communities sharing knowledge freely. Wikipedia, but for everything.", classroom: "Open collaboration and freely shared knowledge.", scores: PICK_M },
            { text: "Entrepreneurs chasing profit and taking risks. For every inventor of the light bulb, a thousand crypto start-ups.", classroom: "Entrepreneurs and companies investing in pursuit of profit.", scores: PICK_P },
            { text: "A government grant, a university lab, a corporate patent and a lawsuit about who did what.", classroom: "A combination of public research, collaboration and private investment.", scores: MUDDLE },
        ]
    },
    {
        id: 'q23',
        text: "How should getting around town work?",
        classroom: "How should local transport be organised?",
        type: 'forcedChoice4',
        options: [
            { text: "Publicly owned buses and trains, planned as one network with one ticket. The timetable is aspirational.", classroom: "Publicly owned buses and trains, planned as a single network.", scores: PICK_C },
            { text: "Community transport schemes, bike co-ops and car-sharing clubs. Very green, mildly smug.", classroom: "Community transport schemes, cycling co-operatives and car-sharing clubs.", scores: PICK_M },
            { text: "Private operators and ride-hailing apps competing on price. Surge pricing builds character.", classroom: "Private operators and apps competing on price and service.", scores: PICK_P },
            { text: "Whatever survived forty years of all three, stitched together badly.", classroom: "A mixture of public, community and private services.", scores: MUDDLE },
        ]
    },
    {
        id: 'q24',
        text: "Statement: Disruptive protests, like blocking roads, are a legitimate part of a free society.",
        classroom: "Statement: Disruptive protests, such as blocking roads, are a legitimate part of a free society.",
        type: 'agreeScale',
        options: agreeScale(-1)
    },
    {
        id: 'q25',
        text: "When someone says it's 'for the common good', who's most likely pulling a fast one?",
        classroom: "When people say something is 'for the common good', who is most likely to be misusing the phrase?",
        type: 'forcedChoice4',
        options: [
            { text: "Politicians and officials, quietly extending their own power.", classroom: "Politicians and officials seeking more power.", scores: AGAINST_C },
            { text: "Activists and committees, imposing their pet projects on everyone else.", classroom: "Activists and committees promoting their own priorities.", scores: AGAINST_M },
            { text: "Business lobbyists, dressing up their profits as public benefit.", classroom: "Business lobbyists presenting private interests as public benefit.", scores: AGAINST_P },
            { text: "Everyone, frankly. It's a phrase, not a plan.", classroom: "Anyone can misuse it; it depends on the case.", scores: MUDDLE },
        ]
    },
    {
        id: 'q26',
        text: "How should people be looked after in old age?",
        classroom: "How should people be supported in old age?",
        type: 'forcedChoice4',
        options: [
            { text: "A state pension and state-run care, the same for everyone and guaranteed. Assuming the Treasury is still there.", classroom: "A state pension and state-run care, the same for everyone.", scores: PICK_C },
            { text: "Families and communities, with shared housing and local care co-ops. Hope you like your relatives.", classroom: "Families and communities, supported by local care co-operatives.", scores: PICK_M },
            { text: "Save and invest for yourself; it's your money and your retirement. Fingers crossed for the next market crash.", classroom: "Individuals saving and investing for their own retirement.", scores: PICK_P },
            { text: "Work until you're 74, then work it out.", classroom: "A combination of state pension, family support and private savings.", scores: MUDDLE },
        ]
    },
    {
        id: 'q27',
        text: "In a pandemic or a flood, who tends to let people down?",
        classroom: "In a crisis such as a pandemic or a flood, which tends to let people down most?",
        type: 'forcedChoice4',
        options: [
            { text: "The government: slow, rigid, and fond of contradictory guidance.", classroom: "Government, which can be slow, rigid and inconsistent.", scores: AGAINST_C },
            { text: "Local groups: big hearts, no capacity, and three rival group chats.", classroom: "Local groups, which are willing but often lack capacity and coordination.", scores: AGAINST_M },
            { text: "Businesses: hiking the price of everything people suddenly need.", classroom: "Businesses, which may raise prices on essential goods.", scores: AGAINST_P },
            { text: "Everyone at first, then everyone gets slightly better at it.", classroom: "All of them at first, though each improves with experience.", scores: MUDDLE },
        ]
    },
    {
        id: 'q28',
        text: "What makes for good, trustworthy news?",
        classroom: "What makes news trustworthy?",
        type: 'forcedChoice4',
        options: [
            { text: "A well-funded public broadcaster with a legal duty to be impartial. Reliably balanced, reliably beige.", classroom: "A well-funded public broadcaster with a legal duty to be impartial.", scores: PICK_C },
            { text: "Non-profit outlets owned by their readers and run locally. Earnest, and slightly behind on the big stories.", classroom: "Non-profit, locally run outlets owned by their readers.", scores: PICK_M },
            { text: "Lots of outlets competing for your attention. Choose wisely; the algorithm already has.", classroom: "Many competing outlets, with readers choosing which to trust.", scores: PICK_P },
            { text: "None of it. We'll just argue in the comments.", classroom: "A mixture of public, non-profit and commercial media.", scores: MUDDLE },
        ]
    },
    {
        id: 'q29',
        text: "What's the most dangerous kind of monopoly?",
        classroom: "What is the most dangerous kind of monopoly?",
        type: 'forcedChoice4',
        options: [
            { text: "The state's monopoly on law, force and money.", classroom: "The state's monopoly on law, force and money.", scores: AGAINST_C },
            { text: "A tight-knit group that controls who gets in and who gets a say.", classroom: "A closed group that controls who may join and who has a say.", scores: AGAINST_M },
            { text: "A corporation so big that nobody can challenge it.", classroom: "A corporation too large for anyone to challenge.", scores: AGAINST_P },
            { text: "The board game, given what it does to families at Christmas.", classroom: "Any monopoly can be dangerous; it depends how it is used.", scores: MUDDLE },
        ]
    },
    {
        id: 'q30',
        text: "In a well-run society, most things get organised by:",
        classroom: "In a well-run society, most things are organised by:",
        type: 'forcedChoice4',
        options: [
            { text: "Public institutions, with clear laws and long-term plans.", classroom: "Public institutions, with clear laws and long-term plans.", scores: PICK_C },
            { text: "People co-operating directly with their neighbours and co-workers.", classroom: "People co-operating directly with their neighbours and co-workers.", scores: PICK_M },
            { text: "Individuals making their own choices and deals in a free market.", classroom: "Individuals making their own choices and agreements in a free market.", scores: PICK_P },
            { text: "Muddling through, which has worked about as well as anything so far.", classroom: "A mix of all three, adjusted over time.", scores: MUDDLE },
        ]
    },
];

// ------------------------------------------------------------------
// TIE-BREAKERS
// Asked after the main test, and only when they would separate your closest matches (see scoring.js).
// Each one measures a single thing on a 0..100 scale; the options are in order and never shuffled.
//   change: 0 = gradual reform .. 100 = revolution
//   scale:  0 = local .. 100 = national / global
//   trad:   0 = secular, progressive .. 100 = religious, traditional
//   nation: 0 = humanity or class .. 100 = nation first
// ------------------------------------------------------------------
const tiebreakers = [
    {
        id: 't1',
        dim: 'change',
        text: "How should big changes to society happen?",
        classroom: "How should major changes to society be made?",
        type: 'tiebreak',
        options: [
            { text: "Slowly, through elections and compromise. Ten-year plans for five-minute fixes.", classroom: "Gradually, through elections, law and compromise.", value: 0 },
            { text: "Steady pressure: campaigns, unions, petitions and the occasional sternly worded march.", classroom: "Through sustained pressure such as campaigns, unions and protest, alongside elections.", value: 33 },
            { text: "Build the new world alongside the old one until the old one is redundant. Very patient. Slightly smug.", classroom: "By building new institutions alongside the existing ones until they replace them.", value: 67 },
            { text: "Tear it down and start again. Bring a hammer.", classroom: "Through revolution, replacing the existing system rather than reforming it.", value: 100 },
        ]
    },
    {
        id: 't2',
        dim: 'change',
        text: "The current system:",
        classroom: "Which comes closest to your view of the current political and economic system?",
        type: 'tiebreak',
        options: [
            { text: "Mostly works. Tweak it gently and don't spill the tea.", classroom: "It mostly works and needs careful improvement.", value: 0 },
            { text: "Needs serious repairs, but the foundations are sound.", classroom: "It needs major reform, but it can be fixed.", value: 33 },
            { text: "Is broken in ways no amount of reform can reach.", classroom: "It has deep flaws that reform alone cannot fix.", value: 67 },
            { text: "Should be dismantled. All of it. Preferably by Thursday.", classroom: "It should be replaced entirely.", value: 100 },
        ]
    },
    {
        id: 't3',
        dim: 'scale',
        text: "At what level should most decisions be made?",
        classroom: "At what level should most decisions be made?",
        type: 'tiebreak',
        options: [
            { text: "The street. If it can't be settled over the garden fence, it's too big.", classroom: "In the neighbourhood or the workplace.", value: 0 },
            { text: "The town or region: big enough to matter, small enough to complain to.", classroom: "In the town, city or region.", value: 33 },
            { text: "The nation. One set of rules, one very long queue.", classroom: "By the national government.", value: 67 },
            { text: "The whole planet. Global problems, global committees, terrible time zones.", classroom: "By international or global institutions.", value: 100 },
        ]
    },
    {
        id: 't4',
        dim: 'scale',
        text: "Who do you trust most to get things right?",
        classroom: "Which do you trust most to make good decisions?",
        type: 'tiebreak',
        options: [
            { text: "People I know by name.", classroom: "People and groups I know personally.", value: 0 },
            { text: "My local council, mostly, on a good day.", classroom: "Local and regional bodies.", value: 33 },
            { text: "The national government, eventually.", classroom: "National institutions.", value: 67 },
            { text: "International bodies of experts, ideally with very good translators.", classroom: "International institutions and agreements.", value: 100 },
        ]
    },
    {
        id: 't5',
        dim: 'trad',
        text: "What role should religion and tradition play in public life?",
        classroom: "What role should religion and tradition play in public life?",
        type: 'tiebreak',
        options: [
            { text: "None. Keep the hymns out of parliament.", classroom: "None; public life should be strictly secular.", value: 0 },
            { text: "Respect them, but make the laws from reason and evidence.", classroom: "They should be respected, but laws should be based on reason and evidence.", value: 33 },
            { text: "They hold society together, so the state should give them a hand.", classroom: "They hold society together and deserve public support.", value: 67 },
            { text: "They should guide the law. Some rules are older than any parliament.", classroom: "They should shape the country's laws and values.", value: 100 },
        ]
    },
    {
        id: 't6',
        dim: 'trad',
        text: "Should society actively promote traditional family life?",
        classroom: "Should society actively encourage traditional family structures?",
        type: 'tiebreak',
        options: [
            { text: "No. Families come in all shapes, and some of them are three cats.", classroom: "No; people should form families however they choose.", value: 0 },
            { text: "Support every family equally, including the odd ones.", classroom: "Society should support all kinds of family equally.", value: 33 },
            { text: "Gently, yes. A stable marriage never hurt anyone (citation needed).", classroom: "Yes; marriage and traditional families deserve encouragement.", value: 67 },
            { text: "Yes. Mum, dad, kids, Sunday roast. Non-negotiable.", classroom: "Yes, strongly; traditional family structures should be actively promoted.", value: 100 },
        ]
    },
    {
        id: 't7',
        dim: 'nation',
        text: "Who do you owe your first loyalty to?",
        classroom: "Who do you owe your first loyalty to?",
        type: 'tiebreak',
        options: [
            { text: "Humanity. Borders are lines somebody drew on a map.", classroom: "Humanity as a whole.", value: 0 },
            { text: "People who share my cause, my class or my faith, wherever they live.", classroom: "People who share my class, faith or cause, wherever they live.", value: 33 },
            { text: "My country, though not at everyone else's expense.", classroom: "My country, while respecting other countries.", value: 67 },
            { text: "My nation, first and always. The anthem gives me goosebumps.", classroom: "My nation, above all.", value: 100 },
        ]
    },
    {
        id: 't8',
        dim: 'nation',
        text: "Should the economy be run mainly to make the nation strong?",
        classroom: "Should the economy be run mainly to strengthen the nation?",
        type: 'tiebreak',
        options: [
            { text: "No. Money doesn't have a flag; trade with whoever.", classroom: "No; people should trade freely, whatever their nationality.", value: 0 },
            { text: "Mostly no, but keep an eye on the strategic stuff.", classroom: "Mostly no, although some strategic industries need protection.", value: 33 },
            { text: "Largely yes: protect national industries and jobs.", classroom: "Largely yes; national industries and jobs should be protected.", value: 67 },
            { text: "Absolutely. The economy exists to serve the nation.", classroom: "Yes; the economy should serve national strength above all.", value: 100 },
        ]
    },
];
