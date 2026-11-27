// questions.js
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

// Agree scale. keyed: 1 means "agree = more order", -1 means "agree = more liberty".
const agreeScale = (keyed) => [
    { text: "Strongly agree",    scores: { a: 2 * keyed } },
    { text: "Agree",             scores: { a: 1 * keyed } },
    { text: "Shrug",             scores: { a: 0 } },
    { text: "Disagree",          scores: { a: -1 * keyed } },
    { text: "Strongly disagree", scores: { a: -2 * keyed } },
];

const questions = [
    {
        id: 'q1',
        text: "Who should own the big stuff: the railways, the power grid, the water pipes?",
        type: 'forcedChoice4',
        options: [
            { text: "The state. It's infrastructure for everyone, so the public should own it. The trains will still be late, but they'll be *our* late trains.", scores: PICK_C },
            { text: "The people who use it and run it, as co-ops or local trusts. Expect a lot of annual general meetings about leaves on the line.", scores: PICK_M },
            { text: "Private companies competing for customers. Competition keeps them sharp, and you'll get a loyalty card for your water.", scores: PICK_P },
            { text: "Some mix of all three, renegotiated every decade by people who have never been on a train.", scores: MUDDLE },
        ]
    },
    {
        id: 'q2',
        text: "Someone breaks their leg. How should their treatment be arranged?",
        type: 'forcedChoice4',
        options: [
            { text: "A national health service, paid for from taxes and free when you need it. The wait is long, but the bill is zero.", scores: PICK_C },
            { text: "Mutual societies and community clinics that members run together. Wonderful, once the rota for the X-ray machine is sorted.", scores: PICK_M },
            { text: "Insurance you choose yourself, with hospitals competing for your custom. Read the small print before you fall over.", scores: PICK_P },
            { text: "A bewildering hybrid that nobody fully understands, including the people running it.", scores: MUDDLE },
        ]
    },
    {
        id: 'q3',
        text: "There aren't enough homes. What's the fix?",
        type: 'forcedChoice4',
        options: [
            { text: "The government builds them, lots of them, council-house style. They'll all look identical, but they'll exist.", scores: PICK_C },
            { text: "Housing co-ops and community land trusts, owned by the people who live in them. The planning meetings may outlast the buildings.", scores: PICK_M },
            { text: "Cut the red tape and let developers build what people will pay for. Brace for a lot of 'luxury studio apartments'.", scores: PICK_P },
            { text: "Announce an ambitious target, miss it, then announce a new one.", scores: MUDDLE },
        ]
    },
    {
        id: 'q4',
        text: "Statement: The police should be able to stop and search anyone they find suspicious, even without firm evidence.",
        type: 'agreeScale',
        options: agreeScale(1)
    },
    {
        id: 'q5',
        text: "Which of these worries you most about the future?",
        type: 'forcedChoice4',
        options: [
            { text: "A state that keeps growing until it runs everything, from your pension to your breakfast.", scores: AGAINST_C },
            { text: "Everything being decided by endless committees, where whoever has the most free time wins.", scores: AGAINST_M },
            { text: "Corporations owning everything, from your home to your data to your water supply.", scores: AGAINST_P },
            { text: "Honestly, all three, in rotation.", scores: MUDDLE },
        ]
    },
    {
        id: 'q6',
        text: "Who should have the final say in how a business is run?",
        type: 'forcedChoice4',
        options: [
            { text: "Within strict laws on pay, hours and safety, set and policed by the state. The inspectors' clipboards are a feature, not a bug.", scores: PICK_C },
            { text: "The workers, through co-operative ownership or elected councils. Every decision gets a show of hands, including the coffee brand.", scores: PICK_M },
            { text: "The owners. It's their money on the line; if you don't like it, start your own firm.", scores: PICK_P },
            { text: "Whoever won the last round of negotiations, until the next round.", scores: MUDDLE },
        ]
    },
    {
        id: 'q7',
        text: "Who should run schools?",
        type: 'forcedChoice4',
        options: [
            { text: "The state: one national curriculum, inspected to the same standard everywhere. Consistent, with the occasional pointless worksheet.", scores: PICK_C },
            { text: "Parents, teachers and the local community, deciding together what their children need. Prepare for a twelve-hour debate about uniforms.", scores: PICK_M },
            { text: "Anyone who wants to open a school, with parents free to choose and the funding following the child. Bring your prospectus-decoding skills.", scores: PICK_P },
            { text: "The current system, but with a new acronym every three years.", scores: MUDDLE },
        ]
    },
    {
        id: 'q8',
        text: "Statement: People should be free to say things that most of us find offensive.",
        type: 'agreeScale',
        options: agreeScale(-1)
    },
    {
        id: 'q9',
        text: "Some people are vastly richer than others. What's mostly to blame?",
        type: 'forcedChoice4',
        options: [
            { text: "Governments handing out favours, bailouts and protected monopolies to their friends.", scores: AGAINST_C },
            { text: "Cosy cliques and closed networks that look after their own and keep outsiders out.", scores: AGAINST_M },
            { text: "An economy where wealth piles up for those who already have it.", scores: AGAINST_P },
            { text: "Luck, mostly, with a bit of everything above.", scores: MUDDLE },
        ]
    },
    {
        id: 'q10',
        text: "How should we cut carbon emissions?",
        type: 'forcedChoice4',
        options: [
            { text: "Government plans and public investment: build the green grid directly and set binding targets. Five-year plans, but for wind turbines.", scores: PICK_C },
            { text: "Community energy co-ops run by the neighbourhoods that use the power. Solar panels on every roof, and a rota for the Tuesday meeting.", scores: PICK_M },
            { text: "Put a price on carbon and let markets find the cheapest cuts. Efficiency, innovation, and a very smug app.", scores: PICK_P },
            { text: "A summit, a pledge, a photo opportunity, and a follow-up summit.", scores: MUDDLE },
        ]
    },
    {
        id: 'q11',
        text: "What should happen to the giant tech platforms?",
        type: 'forcedChoice4',
        options: [
            { text: "Regulate them hard, or bring them into public ownership so they answer to voters rather than shareholders. Terms of service now in triplicate.", scores: PICK_C },
            { text: "Replace them with user-owned co-operative platforms. Fewer adverts, many more forum threads about governance.", scores: PICK_M },
            { text: "Leave them alone; if they get bad enough, a competitor will eat their lunch. Probably. Eventually.", scores: PICK_P },
            { text: "Fine them a rounding error every few years and call it accountability.", scores: MUDDLE },
        ]
    },
    {
        id: 'q12',
        text: "Statement: A country needs a strong shared national identity, and newcomers should adopt it.",
        type: 'agreeScale',
        options: agreeScale(1)
    },
    {
        id: 'q13',
        text: "When a big project goes badly wrong, the cause is usually:",
        type: 'forcedChoice4',
        options: [
            { text: "Officials who answer to nobody and never pay for their mistakes.", scores: AGAINST_C },
            { text: "Too many people with a veto, so nothing gets decided until it's too late.", scores: AGAINST_M },
            { text: "Someone cutting corners to save money and keep the share price up.", scores: AGAINST_P },
            { text: "All of the above, plus a spreadsheet error.", scores: MUDDLE },
        ]
    },
    {
        id: 'q14',
        text: "How should a society look after people who fall on hard times?",
        type: 'forcedChoice4',
        options: [
            { text: "A guaranteed safety net from the state: benefits, pensions, the lot. You'll just need to fill in form B-47 (and B-47a).", scores: PICK_C },
            { text: "Mutual aid: neighbours, unions, friendly societies and food co-ops looking after each other. Warm and generous, but it depends who turns up.", scores: PICK_M },
            { text: "Growth, jobs and private charity. A rising tide lifts all boats, provided you own a boat.", scores: PICK_P },
            { text: "A system so complicated that half the people who need help never find out they qualify.", scores: MUDDLE },
        ]
    },
    {
        id: 'q15',
        text: "Who should run the banks?",
        type: 'forcedChoice4',
        options: [
            { text: "A strong public bank and tight state control of credit. Lending in the national interest, decided in a very grey building.", scores: PICK_C },
            { text: "Credit unions and co-operative banks owned by their members. Your loan gets approved at the members' meeting, right after the raffle.", scores: PICK_M },
            { text: "Private banks competing freely, and the ones that blunder go bust. Your savings are your own lookout.", scores: PICK_P },
            { text: "Private banks, until they crash, then the taxpayer, then private banks again.", scores: MUDDLE },
        ]
    },
    {
        id: 'q16',
        text: "Statement: What consenting adults do in private is nobody else's business.",
        type: 'agreeScale',
        options: agreeScale(-1)
    },
    {
        id: 'q17',
        text: "Who would you least want to have power over your life?",
        type: 'forcedChoice4',
        options: [
            { text: "Officials in a distant ministry who have never met you.", scores: AGAINST_C },
            { text: "Your neighbours, voting on how you ought to live.", scores: AGAINST_M },
            { text: "Your landlord and your employer.", scores: AGAINST_P },
            { text: "All of them equally, which is why I live in a shed.", scores: MUDDLE },
        ]
    },
    {
        id: 'q18',
        text: "Who should pay for museums, theatre and the arts?",
        type: 'forcedChoice4',
        options: [
            { text: "The state, through generous public funding so culture belongs to everyone. A committee will decide what counts as art.", scores: PICK_C },
            { text: "Local communities and volunteers, running their own venues and festivals. Expect an ambitious amateur musical.", scores: PICK_M },
            { text: "Tickets, patrons and sponsors. If people value it, they'll pay for it, and the MegaCorp Pavilion is a small price.", scores: PICK_P },
            { text: "A lottery, a levy, a gala and a lot of anxious grant applications.", scores: MUDDLE },
        ]
    },
    {
        id: 'q19',
        text: "Your town must choose between a new park and a new car park. Who decides?",
        type: 'forcedChoice4',
        options: [
            { text: "The council's planning department, using expert reports and the official long-term plan.", scores: PICK_C },
            { text: "A town assembly where everyone gets a say and the vote is binding. Bring snacks.", scores: PICK_M },
            { text: "Whoever owns the land. If people want a park badly enough, they can club together and buy it.", scores: PICK_P },
            { text: "A public consultation whose result was decided before it started.", scores: MUDDLE },
        ]
    },
    {
        id: 'q20',
        text: "Statement: In a real emergency, the government should be able to suspend normal rights and rules.",
        type: 'agreeScale',
        options: agreeScale(1)
    },
    {
        id: 'q21',
        text: "What's the biggest lie people tell themselves about freedom?",
        type: 'forcedChoice4',
        options: [
            { text: "That rights granted by the state are safe, when the state can take them back whenever it likes.", scores: AGAINST_C },
            { text: "That a close-knit community sets you free, when it comes with a thousand unwritten rules.", scores: AGAINST_M },
            { text: "That a free market makes you free, when your rent and your boss decide most of your choices.", scores: AGAINST_P },
            { text: "That anyone is free before their first coffee.", scores: MUDDLE },
        ]
    },
    {
        id: 'q22',
        text: "Where do the big breakthroughs come from?",
        type: 'forcedChoice4',
        options: [
            { text: "Publicly funded research and government missions: moon landings, the internet, vaccines. Forms in quadruplicate, results eventually.", scores: PICK_C },
            { text: "Open collaboration, with scientists, hobbyists and communities sharing knowledge freely. Wikipedia, but for everything.", scores: PICK_M },
            { text: "Entrepreneurs chasing profit and taking risks. For every inventor of the light bulb, a thousand crypto start-ups.", scores: PICK_P },
            { text: "A government grant, a university lab, a corporate patent and a lawsuit about who did what.", scores: MUDDLE },
        ]
    },
    {
        id: 'q23',
        text: "How should getting around town work?",
        type: 'forcedChoice4',
        options: [
            { text: "Publicly owned buses and trains, planned as one network with one ticket. The timetable is aspirational.", scores: PICK_C },
            { text: "Community transport schemes, bike co-ops and car-sharing clubs. Very green, mildly smug.", scores: PICK_M },
            { text: "Private operators and ride-hailing apps competing on price. Surge pricing builds character.", scores: PICK_P },
            { text: "Whatever survived forty years of all three, stitched together badly.", scores: MUDDLE },
        ]
    },
    {
        id: 'q24',
        text: "Statement: Disruptive protests, like blocking roads, are a legitimate part of a free society.",
        type: 'agreeScale',
        options: agreeScale(-1)
    },
    {
        id: 'q25',
        text: "When someone says it's 'for the common good', who's most likely pulling a fast one?",
        type: 'forcedChoice4',
        options: [
            { text: "Politicians and officials, quietly extending their own power.", scores: AGAINST_C },
            { text: "Activists and committees, imposing their pet projects on everyone else.", scores: AGAINST_M },
            { text: "Business lobbyists, dressing up their profits as public benefit.", scores: AGAINST_P },
            { text: "Everyone, frankly. It's a phrase, not a plan.", scores: MUDDLE },
        ]
    },
    {
        id: 'q26',
        text: "How should people be looked after in old age?",
        type: 'forcedChoice4',
        options: [
            { text: "A state pension and state-run care, the same for everyone and guaranteed. Assuming the Treasury is still there.", scores: PICK_C },
            { text: "Families and communities, with shared housing and local care co-ops. Hope you like your relatives.", scores: PICK_M },
            { text: "Save and invest for yourself; it's your money and your retirement. Fingers crossed for the next market crash.", scores: PICK_P },
            { text: "Work until you're 74, then work it out.", scores: MUDDLE },
        ]
    },
    {
        id: 'q27',
        text: "In a pandemic or a flood, who tends to let people down?",
        type: 'forcedChoice4',
        options: [
            { text: "The government: slow, rigid, and fond of contradictory guidance.", scores: AGAINST_C },
            { text: "Local groups: big hearts, no capacity, and three rival group chats.", scores: AGAINST_M },
            { text: "Businesses: hiking the price of everything people suddenly need.", scores: AGAINST_P },
            { text: "Everyone at first, then everyone gets slightly better at it.", scores: MUDDLE },
        ]
    },
    {
        id: 'q28',
        text: "What makes for good, trustworthy news?",
        type: 'forcedChoice4',
        options: [
            { text: "A well-funded public broadcaster with a legal duty to be impartial. Reliably balanced, reliably beige.", scores: PICK_C },
            { text: "Non-profit outlets owned by their readers and run locally. Earnest, and slightly behind on the big stories.", scores: PICK_M },
            { text: "Lots of outlets competing for your attention. Choose wisely; the algorithm already has.", scores: PICK_P },
            { text: "None of it. We'll just argue in the comments.", scores: MUDDLE },
        ]
    },
    {
        id: 'q29',
        text: "What's the most dangerous kind of monopoly?",
        type: 'forcedChoice4',
        options: [
            { text: "The state's monopoly on law, force and money.", scores: AGAINST_C },
            { text: "A tight-knit group that controls who gets in and who gets a say.", scores: AGAINST_M },
            { text: "A corporation so big that nobody can challenge it.", scores: AGAINST_P },
            { text: "The board game, given what it does to families at Christmas.", scores: MUDDLE },
        ]
    },
    {
        id: 'q30',
        text: "In a well-run society, most things get organised by:",
        type: 'forcedChoice4',
        options: [
            { text: "Public institutions, with clear laws and long-term plans.", scores: PICK_C },
            { text: "People co-operating directly with their neighbours and co-workers.", scores: PICK_M },
            { text: "Individuals making their own choices and deals in a free market.", scores: PICK_P },
            { text: "Muddling through, which has worked about as well as anything so far.", scores: MUDDLE },
        ]
    },
];
