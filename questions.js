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
//   "Pick a villain" - one option criticising each corner, plus a muddle option (kind: 'villain').
//                      Blaming a corner pushes you directly away from it. The push is split between the
//                      other two corners in proportion to how you answered the rest of the triangle
//                      questions, so a market fan who blames the state moves towards Privatism and a
//                      co-op fan who blames the state moves towards Communalism (see scoring.js).
//   Muddle options sit at the dead centre.
//   "Pick a blend"   - (kind: 'blend') one option for each PAIR of corners (state + community, state + private,
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
        text: "Railways, power grids, water pipes: sacred public trust, the people's property, or a nice little earner?",
        classroom: "Who should own major infrastructure, such as railways, the power grid and the water supply?",
        type: 'forcedChoice4',
        options: [
            { text: "Nationalise the lot. Trains, pipes, pylons. If it hums, the state should own it, and the humming should be state-approved.", classroom: "The state, so that essential services are run for the public rather than for profit.", scores: PICK_C },
            { text: "Hand it to the workers and the passengers! We'll run the railway by consensus. The 07:42 leaves when everyone feels heard.", classroom: "The people who use and work in them, through co-operatives or local trusts.", scores: PICK_M },
            { text: "Sell it. All of it. If granny can't afford the water bill, granny should have invested in water.", classroom: "Private companies, competing for customers to keep services efficient.", scores: PICK_P },
            { text: "Whoever owns it, it'll be late, broken and somehow my fault.", classroom: "A mix of public, community and private ownership, decided case by case.", scores: MUDDLE },
        ]
    },
    {
        id: 'q2',
        kind: 'blend',
        text: "Someone breaks their leg. How should their treatment be arranged?",
        classroom: "How should medical treatment be organised and paid for?",
        type: 'forcedChoice4',
        options: [
            { text: "One national health service, run by local boards of ordinary people. Yes, the dentist is elected. No, you can't recall them mid-filling.", classroom: "A national health service, run locally by elected community health boards.", scores: BLEND_CM },
            { text: "Everyone's insured by law, then the hospitals fight over you like seagulls over chips. It's called choice. Pick a seagull.", classroom: "Compulsory public insurance, with private and public hospitals competing for patients.", scores: BLEND_CP },
            { text: "Mutual insurers owned by us members, competing for us members. Four AGMs this month and my knee still isn't covered.", classroom: "Mutual insurers owned by their members, competing with each other for members.", scores: BLEND_MP },
            { text: "A bewildering hybrid nobody understands, least of all the people running it. Please hold.", classroom: "A mixed system combining public, mutual and private provision.", scores: MUDDLE },
        ]
    },
    {
        id: 'q3',
        kind: 'blend',
        text: "There aren't enough homes. What's the fix?",
        classroom: "There is a shortage of housing. What is the best solution?",
        type: 'forcedChoice4',
        options: [
            { text: "Council houses run by tenants' committees. You get a home, plus a lifelong feud with number 12 about the bins.", classroom: "Public housing built by the state and managed by tenants' associations.", scores: BLEND_CM },
            { text: "The government sets targets and hands out subsidies. Developers build homes and pocket the subsidies. Everyone wins! The developers win.", classroom: "The government sets targets and offers subsidies, and private developers build the homes.", scores: BLEND_CP },
            { text: "Housing co-ops buying land on the open market. We're our own landlords now, so there's nobody left to blame. Terrifying.", classroom: "Housing co-operatives and self-build groups buying land on the open market.", scores: BLEND_MP },
            { text: "Announce a target, miss it, blame the last lot, announce a bigger target.", classroom: "Combine public building, community schemes and private development.", scores: MUDDLE },
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
        kind: 'villain',
        text: "What keeps you up at night?",
        classroom: "Which of these concerns you most about the future?",
        type: 'forcedChoice4',
        options: [
            { text: "A state that keeps growing until it's choosing my breakfast and naming my children.", classroom: "Government growing too powerful and controlling too much of daily life.", scores: AGAINST_C },
            { text: "Endless committees, run by whoever has the most free time and the loudest voice. It's always Brenda.", classroom: "Decisions being taken over by small groups who dominate meetings and committees.", scores: AGAINST_M },
            { text: "Corporations owning everything: my house, my data, my water, and eventually my soul (terms apply).", classroom: "Large corporations owning and controlling more and more of the economy.", scores: AGAINST_P },
            { text: "All three, in rotation, depending on what I read this morning.", classroom: "All of these, about equally.", scores: MUDDLE },
        ]
    },
    {
        id: 'q6',
        kind: 'blend',
        text: "Who should have the final say in how a business is run?",
        classroom: "Who should have the final say in how a business is run?",
        type: 'forcedChoice4',
        options: [
            { text: "The state owns the factory, the workers' council runs it. Production quotas by decree, canteen menu by referendum.", classroom: "Publicly owned firms, managed day to day by elected councils of their workers.", scores: BLEND_CM },
            { text: "Owners call the shots, inside a fat rulebook of labour law. The bosses keep their yachts; the workers keep their fingers.", classroom: "The owners, but within strict laws on pay, hours and safety that the state sets and enforces.", scores: BLEND_CP },
            { text: "Worker co-ops slugging it out in an open market. We're all bosses now, and we all have to sack ourselves when sales are down.", classroom: "Worker co-operatives, owned by their workers and competing in an open market.", scores: BLEND_MP },
            { text: "Whoever won the last strike, until the next one.", classroom: "It should be negotiated between owners, workers and government.", scores: MUDDLE },
        ]
    },
    {
        id: 'q7',
        text: "Who should run schools?",
        classroom: "Who should run schools?",
        type: 'forcedChoice4',
        options: [
            { text: "One national curriculum, tested to destruction. Every child in the land reading the same page on the same day. Glorious.", classroom: "The state, with a national curriculum and the same standards everywhere.", scores: PICK_C },
            { text: "Parents and teachers decide together what children learn! Seven hundred people, one curriculum, no survivors.", classroom: "Parents, teachers and the local community, deciding together.", scores: PICK_M },
            { text: "Let schools compete and parents shop around. If your kid's school goes bust, that's the market teaching them a lesson.", classroom: "Independent providers, with parents free to choose and funding following the child.", scores: PICK_P },
            { text: "Doesn't matter. My kid will learn to vape behind the bike sheds either way.", classroom: "A mix of national standards, local input and parental choice.", scores: MUDDLE },
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
        kind: 'villain',
        text: "Some people have private jets; some people have mould. Whose fault is that?",
        classroom: "There are large differences in wealth between people. What is the main cause?",
        type: 'forcedChoice4',
        options: [
            { text: "Governments handing bailouts and cushy monopolies to their mates. Same school, same club, same tax haven.", classroom: "Governments granting favours, bailouts and protected positions to the well-connected.", scores: AGAINST_C },
            { text: "Cosy cliques and closed shops that look after their own and slam the door on everyone else.", classroom: "Closed networks that look after their own members and keep outsiders out.", scores: AGAINST_M },
            { text: "A rigged economy where money makes money and the rest of us make do.", classroom: "Markets that let wealth build up among those who already have it.", scores: AGAINST_P },
            { text: "Mostly luck: who your parents were, where you were born, and which way the dice fell.", classroom: "Mainly luck and circumstance, such as family background and place of birth.", scores: MUDDLE },
        ]
    },
    {
        id: 'q10',
        text: "How should we cut carbon emissions?",
        classroom: "How should we reduce carbon emissions?",
        type: 'forcedChoice4',
        options: [
            { text: "A Ministry of Weather. Binding targets, five-year plans, and inspectors who can smell a diesel at forty paces.", classroom: "Government planning and public investment, with binding targets.", scores: PICK_C },
            { text: "Community energy co-ops on every street. We'll save the planet one passive-aggressive meeting about solar panels at a time.", classroom: "Local community energy projects and co-operatives.", scores: PICK_M },
            { text: "Slap a price on carbon and let the market sort it. The rich keep their jets and buy a forest to feel better.", classroom: "Put a price on carbon and let markets find the cheapest ways to cut emissions.", scores: PICK_P },
            { text: "A summit. A pledge. A photo. A follow-up summit. A slightly sadder photo.", classroom: "International agreements that combine several approaches.", scores: MUDDLE },
        ]
    },
    {
        id: 'q11',
        text: "What should happen to the giant tech platforms?",
        classroom: "What should happen to the largest technology companies?",
        type: 'forcedChoice4',
        options: [
            { text: "Nationalise them. The algorithm should answer to the state, which would never misuse a database of everyone's secrets.", classroom: "Strict regulation or public ownership, so that they answer to elected governments.", scores: PICK_C },
            { text: "Tear them down and build user-owned co-op platforms. Fewer adverts, endless threads about the moderation policy's moderation policy.", classroom: "Replace them with platforms owned co-operatively by their users.", scores: PICK_M },
            { text: "Leave them alone. If they get evil enough, some kid in a garage will disrupt them. Any day now.", classroom: "Leave them to market competition, which will challenge them if they fail their users.", scores: PICK_P },
            { text: "Fine them a rounding error every few years and call it justice.", classroom: "Moderate regulation and occasional fines, much as now.", scores: MUDDLE },
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
        kind: 'villain',
        text: "When a big project goes badly wrong, the cause is usually:",
        classroom: "When large projects fail, what is usually the main cause?",
        type: 'forcedChoice4',
        options: [
            { text: "Officials who answer to nobody and get promoted after every fiasco.", classroom: "Officials who are not held accountable for their decisions.", scores: AGAINST_C },
            { text: "Too many people with a veto. By the time everyone agrees, the bridge has already fallen down.", classroom: "Too many groups able to block decisions, causing delay.", scores: AGAINST_M },
            { text: "Some genius cutting corners to keep the share price up. The bridge was always going to fall down.", classroom: "Cutting costs in order to increase profits.", scores: AGAINST_P },
            { text: "A bit of everyone's fault, plus a spreadsheet error.", classroom: "A combination of factors, often including simple human error.", scores: MUDDLE },
        ]
    },
    {
        id: 'q14',
        text: "How should a society look after people who fall on hard times?",
        classroom: "How should a society support people who fall on hard times?",
        type: 'forcedChoice4',
        options: [
            { text: "A big state safety net, cradle to grave, in triplicate. Lose form B-47 and the grave comes sooner than planned.", classroom: "A guaranteed safety net from the state: benefits, pensions and services.", scores: PICK_C },
            { text: "Mutual aid! Neighbours looking after neighbours. Unless you're the neighbour nobody likes. Then, good luck.", classroom: "Mutual aid through neighbours, unions, friendly societies and community groups.", scores: PICK_M },
            { text: "Get a job. Then get a better job. Charity exists for the rest, and the rest should be grateful.", classroom: "Economic growth, jobs and voluntary private charity.", scores: PICK_P },
            { text: "A system so complicated that half the people who need help never find out they're allowed to ask.", classroom: "A combination of state support, community help and private charity.", scores: MUDDLE },
        ]
    },
    {
        id: 'q15',
        kind: 'blend',
        text: "Who should run the banks?",
        classroom: "Who should run the banks?",
        type: 'forcedChoice4',
        options: [
            { text: "A people's bank, lending through the town council. Your mortgage gets approved by a committee of your nosiest neighbours.", classroom: "A public bank that lends through local councils and community funds.", scores: BLEND_CM },
            { text: "Private banks, tightly regulated, rescued by the taxpayer whenever they set themselves on fire. Which is often.", classroom: "Private banks, closely regulated, with the state as lender of last resort.", scores: BLEND_CP },
            { text: "Credit unions and building societies, competing politely. Banking, with a members' newsletter and a raffle.", classroom: "Credit unions and mutual building societies, competing with each other.", scores: BLEND_MP },
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
        kind: 'villain',
        text: "Who would you least want to have power over your life?",
        classroom: "Whose power over your life would concern you most?",
        type: 'forcedChoice4',
        options: [
            { text: "Officials in a distant ministry who've never met me and never will.", classroom: "Government officials who have never met you.", scores: AGAINST_C },
            { text: "My neighbours, voting on how I should live. I've seen their gardens. No.", classroom: "Your neighbours, voting on how you should live.", scores: AGAINST_M },
            { text: "My landlord and my boss. Between them they own my time and my roof.", classroom: "Your landlord and your employer.", scores: AGAINST_P },
            { text: "All of them equally, which is why I live in a shed.", classroom: "All of them, about equally.", scores: MUDDLE },
        ]
    },
    {
        id: 'q18',
        text: "Who should make the everyday stuff: cars, phones, toothpaste?",
        classroom: "Who should produce everyday goods, such as cars, phones and food?",
        type: 'forcedChoice4',
        options: [
            { text: "State factories building to the national plan. Three models of car, all beige, nine-year waiting list. Worth it.", classroom: "State-owned enterprises, producing according to a national plan.", scores: PICK_C },
            { text: "Worker co-ops make everything. The toothpaste is ethically sourced, democratically flavoured, and costs eleven quid.", classroom: "Worker co-operatives and community-owned enterprises.", scores: PICK_M },
            { text: "Private companies selling me things I didn't know I needed, in seventeen colours. I'll take all seventeen.", classroom: "Private companies, competing to sell to customers.", scores: PICK_P },
            { text: "Whoever's cheapest, as long as the box turns up tomorrow.", classroom: "A mix of private, co-operative and public enterprises.", scores: MUDDLE },
        ]
    },
    {
        id: 'q19',
        text: "Your town must choose between a new park and a new car park. Who gets to decide, God help us?",
        classroom: "A town must choose between a new park and a new car park. Who should decide?",
        type: 'forcedChoice4',
        options: [
            { text: "The council planners, following the thirty-year strategic framework. You may submit comments, which will be filed.", classroom: "The council's planners, using expert advice and a long-term plan.", scores: PICK_C },
            { text: "A town assembly where everybody votes! Bring snacks, a camping chair and your fiercest opinion about bollards.", classroom: "A town meeting where every resident can vote and the result is binding.", scores: PICK_M },
            { text: "Whoever owns the land. Want a park? Club together and buy it, you freeloading hippies.", classroom: "The owner of the land, who can sell it to whoever values it most.", scores: PICK_P },
            { text: "A public consultation whose result was decided six months before it started.", classroom: "A public consultation, followed by a council decision.", scores: MUDDLE },
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
        kind: 'villain',
        text: "What's the biggest lie people tell themselves about freedom?",
        classroom: "Which is the greatest threat to real freedom?",
        type: 'forcedChoice4',
        options: [
            { text: "That your rights are safe because the state wrote them down. It wrote them in pencil.", classroom: "Rights granted by the state can also be taken away by the state.", scores: AGAINST_C },
            { text: "That a close-knit community sets you free. Try leaving one.", classroom: "Close-knit communities put pressure on people to conform.", scores: AGAINST_M },
            { text: "That the free market makes you free. Tell that to your rent.", classroom: "Depending on landlords and employers limits people's real choices.", scores: AGAINST_P },
            { text: "That anyone is free before their first coffee.", classroom: "No single one; it depends on the situation.", scores: MUDDLE },
        ]
    },
    {
        id: 'q22',
        text: "Where do the big breakthroughs come from?",
        classroom: "Where do major scientific and technological breakthroughs mostly come from?",
        type: 'forcedChoice4',
        options: [
            { text: "Government missions: moon landings, the internet, vaccines. Name one thing a billionaire invented that wasn't a worse taxi.", classroom: "Publicly funded research and government-led missions.", scores: PICK_C },
            { text: "Open collaboration and freely shared knowledge. Wikipedia, but for everything, with edit wars about everything.", classroom: "Open collaboration and freely shared knowledge.", scores: PICK_M },
            { text: "Entrepreneurs chasing profit. For every light bulb, a thousand crypto start-ups. That's the price of genius, baby.", classroom: "Entrepreneurs and companies investing in pursuit of profit.", scores: PICK_P },
            { text: "A government grant, a university lab, a corporate patent and a lawsuit about who did what.", classroom: "A combination of public research, collaboration and private investment.", scores: MUDDLE },
        ]
    },
    {
        id: 'q23',
        text: "Should people be free to start a business, grow it and hire staff?",
        classroom: "Should people be free to start a business, grow it and employ staff?",
        type: 'forcedChoice4',
        options: [
            { text: "Only within the national plan. Fill in form E-1, wait for the licence, then apply for a licence to use the licence.", classroom: "Only in limited ways, within a plan set by the state.", scores: PICK_C },
            { text: "Sure, but the moment you hire someone, they own half of it. Welcome to the board, comrade.", classroom: "Yes, but businesses that employ people should become co-operatives owned by their workers.", scores: PICK_M },
            { text: "Start it, grow it, sell it, buy a yacht, start another. Some of you will end up eating beans. That's the deal.", classroom: "Yes, with as few restrictions as possible.", scores: PICK_P },
            { text: "Yes, after the paperwork, which takes longer than building the business.", classroom: "Yes, within ordinary regulation.", scores: MUDDLE },
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
        kind: 'villain',
        text: "When someone says it's 'for the common good', who's most likely pulling a fast one?",
        classroom: "When people say something is 'for the common good', who is most likely to be misusing the phrase?",
        type: 'forcedChoice4',
        options: [
            { text: "Politicians and officials, quietly helping themselves to a bit more power.", classroom: "Politicians and officials seeking more power.", scores: AGAINST_C },
            { text: "Activists and committees, ramming their pet projects down everyone's throats.", classroom: "Activists and committees promoting their own priorities.", scores: AGAINST_M },
            { text: "Business lobbyists, dressing up their profits as a public service.", classroom: "Business lobbyists presenting private interests as public benefit.", scores: AGAINST_P },
            { text: "Everyone. It's a phrase, not a plan.", classroom: "Anyone can misuse it; it depends on the case.", scores: MUDDLE },
        ]
    },
    {
        id: 'q26',
        text: "What should happen to the money and property people leave behind when they die?",
        classroom: "What should happen to the money and property people leave when they die?",
        type: 'forcedChoice4',
        options: [
            { text: "Most of it goes to the state. Death and taxes, together at last, the way nature intended.", classroom: "Most of it should be taxed and used by the state for everyone's benefit.", scores: PICK_C },
            { text: "Back to the community. Grandad's house becomes a really very nice village hall. He'd have hated it. Tough.", classroom: "It should go to community funds, trusts or co-operatives rather than to individuals.", scores: PICK_M },
            { text: "Whoever they leave it to. It's their stuff. If the cat gets the mansion, the cat gets the mansion.", classroom: "Whoever they choose; people should be free to pass on what they own.", scores: PICK_P },
            { text: "A bit to the family, a bit to the taxman, and a decade of screaming at the solicitor.", classroom: "Some to family and some in tax, through a moderate inheritance tax.", scores: MUDDLE },
        ]
    },
    {
        id: 'q27',
        kind: 'villain',
        text: "In a pandemic or a flood, who tends to let people down?",
        classroom: "In a crisis such as a pandemic or a flood, which tends to let people down most?",
        type: 'forcedChoice4',
        options: [
            { text: "The government: slow, rigid, and fond of contradictory press conferences.", classroom: "Government, which can be slow, rigid and inconsistent.", scores: AGAINST_C },
            { text: "Local groups: big hearts, no capacity, three rival group chats.", classroom: "Local groups, which are willing but often lack capacity and coordination.", scores: AGAINST_M },
            { text: "Businesses: suddenly hand sanitiser costs forty quid.", classroom: "Businesses, which may raise prices on essential goods.", scores: AGAINST_P },
            { text: "Everyone, at first. Then everyone gets slightly less useless.", classroom: "All of them at first, though each improves with experience.", scores: MUDDLE },
        ]
    },
    {
        id: 'q28',
        text: "Where should the money to build new factories and businesses come from?",
        classroom: "Where should the money to start and expand businesses come from?",
        type: 'forcedChoice4',
        options: [
            { text: "A state investment plan. The Ministry knows where the money should go. The Ministry always knows.", classroom: "A state investment plan that directs money to where it is needed.", scores: PICK_C },
            { text: "Workers' pension funds and community pots. Every investment voted on by people who've never seen a balance sheet.", classroom: "Funds pooled and controlled by workers and communities.", scores: PICK_M },
            { text: "Private investors and the stock market. Up, down, up, panic, up. Mostly up. Usually.", classroom: "Private investors and the stock market.", scores: PICK_P },
            { text: "Banks, after a lot of paperwork and a very firm handshake.", classroom: "A mix of private investment, public banks and community funds.", scores: MUDDLE },
        ]
    },
    {
        id: 'q29',
        kind: 'villain',
        text: "What's the most dangerous kind of monopoly?",
        classroom: "What is the most dangerous kind of monopoly?",
        type: 'forcedChoice4',
        options: [
            { text: "The state's monopoly on law, force and money. Try competing with that.", classroom: "The state's monopoly on law, force and money.", scores: AGAINST_C },
            { text: "A clique that decides who's in and who's out, and calls it community.", classroom: "A closed group that controls who may join and who has a say.", scores: AGAINST_M },
            { text: "A corporation so big the law is just another supplier.", classroom: "A corporation too large for anyone to challenge.", scores: AGAINST_P },
            { text: "The board game. Think what it's done to families at Christmas.", classroom: "Any monopoly can be dangerous; it depends how it is used.", scores: MUDDLE },
        ]
    },
    {
        id: 'q30',
        text: "In a well-run society, most things get organised by:",
        classroom: "In a well-run society, most things are organised by:",
        type: 'forcedChoice4',
        options: [
            { text: "Public institutions, clear laws and long plans. Someone sensible in charge. Ideally someone like me.", classroom: "Public institutions, with clear laws and long-term plans.", scores: PICK_C },
            { text: "People co-operating directly with their neighbours and co-workers. You'll love it. You'll have to.", classroom: "People co-operating directly with their neighbours and co-workers.", scores: PICK_M },
            { text: "Individuals making their own deals in a free market. If you lost, you weren't free enough.", classroom: "Individuals making their own choices and agreements in a free market.", scores: PICK_P },
            { text: "Muddling through. It's worked about as well as anything, which says a lot about everything.", classroom: "A mix of all three, adjusted over time.", scores: MUDDLE },
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
