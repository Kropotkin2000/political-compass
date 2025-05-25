// questions.js (Linear 30 Questions - CLEANED UP)
// SCORING IS HIGHLY SPECULATIVE AND REQUIRES INTENSE CALIBRATION
// C = Centralism, M = Communalism, P = Privatism

const questions = [
    // Original Q1-Q8, now q1-q8, with X-options where added & sarcasm tweaks
    {
        id: 'q1',
        text: "When a big problem arises, what's your instinctive, deeply unhelpful first thought?",
        type: 'forcedChoice4',
        options: [
            { text: "Someone really important and official should sort this out. Where's the manager of the universe?!", scores: { c: 2, m: -1, p: -1 } },
            { text: "Ugh, if only we could form a thousand sub-committees to 'dialogue' this problem into submission! Surely a perfectly 'inclusive' process will magically yield a perfect solution, eventually.", scores: { c: -1, m: 2, p: -1 } },
            { text: "Not my circus, not my monkeys. Unless there's a way to profit from this chaos, then it's *very much* my circus.", scores: { c: -1, m: -1, p: 2 } },
            { text: "\"Sigh. Another one? Fine. Can someone at least Google the 'least worst' option while I make some tea and try not to think about how we're all doomed anyway?\"", scores: { c: 0.3, m: 0.3, p: 0.3 } }
        ]
    },
    {
        id: 'q2',
        text: "\"Progress.\" If it's not just a fancy word for \"gentrification,\" it probably means:",
        type: 'forcedChoice4',
        options: [
            { text: "Making everything more streamlined, predictable, and under the firm-but-loving grip of those who 'know best.' For efficiency!", scores: { c: 2, m: -1, p: -1 } },
            { text: "Everyone feeling 'empowered' to 'live their truth' and 'express themselves,' leading to a society that's... certainly more colorful, if not actually functional.", scores: { c: -1, m: 2, p: -1 } },
            { text: "A new app that shaves 0.2 seconds off ordering a pizza, while the actual societal dumpster fire rages on. But hey, convenience!", scores: { c: -1, m: -1, p: 2 } },
            { text: "Painfully slow, incremental changes that involve a lot of boring meetings, disappoint everyone slightly, and ultimately result in things being marginally less terrible than they were a decade ago. Thrilling.", scores: { c: 0.4, m: 0.4, p: 0.4 } }
        ]
    },
    {
        id: 'q3',
        text: "What's generally a bigger threat to a \"good life\" (whatever that is)?",
        type: 'forcedChoice3',
        options: [
            { text: "Too much messy, unpredictable individual freedom leading to societal breakdown and people putting pineapples on pizza.", scores: { c: 1, m: 0, p: -1 } },
            { text: "Too many rules and powerful institutions telling you what to do, crushing your unique spirit under the weight of conformity.", scores: { c: -1, m: 0, p: 1 } },
            { text: "Honestly, both extremes are terrifying. The real danger is any ideology taken too far, or just a general lack of common sense and decency.", scores: { c: 0.1, m: 0.1, p: 0.1 } }
        ]
    },
    {
        id: 'q4',
        text: "When you hear \"the common good,\" what's your immediate, cynical translation?",
        type: 'forcedChoice4',
        options: [
            { text: "\"What the people in charge have decided is good for *them*, and by extension, 'us,' whether we like it or not.\"", scores: { c: -2, m: 0.5, p: 0.5 } },
            { text: "\"Something vague and fluffy that sounds nice but usually means *I* have to give up something I like for people I don't know.\"", scores: { c: 0.5, m: 0.5, p: -2 } },
            { text: "\"An endless series of meetings to determine what 'the community' wants, which usually means what the loudest person with the most free time wants.\"", scores: { c: 0.5, m: -2, p: 0.5 } },
            { text: "\"A marketing slogan used to sell us policies that primarily benefit powerful, well-connected insiders, while the rest of us get some nice-sounding platitudes and maybe a commemorative tea towel.\"", scores: { c: 0.1, m: 0.1, p: 0.1 } }
        ]
    },
    {
        id: 'q5',
        text: "If society is a stage play, what's the most crucial role?",
        type: 'forcedChoice4',
        options: [
            { text: "The Stern But Fair Director: Making sure everyone hits their marks, says their lines, and doesn't upstage the star (usually The State).", scores: { c: 2, m: -1, p: -1 } },
            { text: "The Harmonious Ensemble Cast: Everyone supporting each other, sharing the spotlight, and creating something beautiful (and probably unprofitable) together.", scores: { c: -1, m: 2, p: -1 } },
            { text: "The Dashing Maverick Lead: Improvising wildly, stealing every scene, and to hell with the script or the other actors. It's *their* show!", scores: { c: -1, m: -1, p: 2 } },
            { text: "The exhausted Stage Manager, fueled by lukewarm coffee and existential dread, desperately trying to stop the sets from collapsing while the actors ad-lib increasingly bizarre plot twists.", scores: { c: 0.3, m: 0.3, p: 0.3 } }
        ]
    },
    {
        id: 'q6',
        text: "What's the more fundamental human drive?",
        type: 'forcedChoice4',
        options: [
            { text: "The desperate need for order, security, and someone to tell us it's all going to be okay (even if it's a blatant, easily disproven lie).", scores: { c: 2, m: -1, p: -1 } },
            { text: "The deep-seated urge to connect, belong, and not be a total hermit, even if other people are mostly a collection of infuriating quirks and bad opinions.", scores: { c: -1, m: 2, p: -1 } },
            { text: "The insatiable hunger to be special, get ahead, and accumulate more shiny, status-affirming things than the next person, ideally while live-streaming it.", scores: { c: -1, m: -1, p: 2 } },
            { text: "The ability to hold wildly contradictory drives simultaneously – like wanting world peace AND that last slice of pizza. Humans: masters of cognitive dissonance.", scores: { c: 0.2, m: 0.2, p: 0.2 } }
        ]
    },
    {
        id: 'q7',
        text: "When faced with a complex problem, what's your go-to (probably flawed) initial strategy?",
        type: 'forcedChoice4',
        options: [
            { text: "\"Let's form a committee, draft a policy paper, schedule a series of consultations, and then set up a steering group to review the findings of the preliminary report. Action can wait until we have a 300-page, fully-footnoted document!\"", scores: { c: 2, m: -1, p: -1 } },
            { text: "\"We need to talk about our *feelings* about this problem! Let's have a sharing circle, ensure everyone feels validated, maybe do some trust falls, before we even *think* about solutions that might invalidate someone's lived experience.\"", scores: { c: -1, m: 2, p: -1 } },
            { text: "\"Screw the rules, I have money/connections/a half-baked but incredibly disruptive idea! Let me just dive in and 'move fast and break things.' What's the worst that could happen? (Famous last words).\"", scores: { c: -1, m: -1, p: 2 } },
            { text: "\"Sigh. Okay, what's the absolute minimum we can do that looks like we're addressing this but doesn't actually require too much effort, money, or upsetting anyone important? Let's aim for 'performative competence.'\"", scores: { c: 0.3, m: 0.3, p: 0.3 } }
        ]
    },
    {
        id: 'q8',
        text: "If society had a motto, which of these cringeworthy options would be the most accurate (if depressing)?",
        type: 'forcedChoice4',
        options: [
            { text: "\"Order Above All (Even Your Happiness, And Especially Your Quirky Hobbies).\"", scores: { c: 1, m: -0.5, p: -0.5 } },
            { text: "\"Together We Achieve... Eventually... Maybe... After A Few More Meetings About The Minutes Of The Previous Meetings.\"", scores: { c: -0.5, m: 1, p: -0.5 } },
            { text: "\"Every Person For Themselves (And May The Person With The Best Offshore Accountant Win!).\"", scores: { c: -0.5, m: -0.5, p: 1 } },
            { text: "\"It's Complicated, Mostly Broken, And We're All Just Pretending It Makes Sense. (Want a donut?)\"", scores: { c: 0.1, m: 0.1, p: 0.1 } }
        ]
    },
    // Your original Q9-Q18 from file, now q9-q18 for linear
    { // Original Q9 (Economy) from your file, now q9
        id: 'q9',
        text: "The \"ideal\" economy (if such a non-disaster exists) would mostly run on:",
        type: 'forcedChoice4',
        options: [
            { text: "The State's All-Knowing Wisdom: Central planners heroically assigning production quotas for artisanal pickles and novelty socks. Maximum efficiency! (And only a *few* crippling shortages of essential goods, promise!)", scores: { c: 1.5, m: 0, p: -1 } }, // m:0
            { text: "A network of worker co-ops and 'socially responsible' B-corps, where every decision is vetted by seven ethics committees and an 'impact assessment' working group, ensuring products are 'mindfully sourced' but also three years behind schedule and cost twice as much.", scores: { c: -0.75, m: 2, p: -0.75 } },
            { text: "The 'Invisible Hand's' Slightly Sticky Fingers: Let the market decide who gets rich and who gets to eat ramen for eternity. It's 'natural selection' for your bank account!", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "The 'Sensible Shoes' Model: A thrillingly beige tapestry of market 'dynamism' (i.e., occasional crashes), government 'oversight' (i.e., endless forms), and 'social responsibility' (i.e., feel-good PR campaigns). It's boring, but it vaguely functions, mostly by accident.", scores: { c: 0.4, m: 0.3, p: 0.8 } }
        ]
    },
    { // Original Q10 (Social Justice) from your file, now q10
        id: 'q10',
        text: "\"Social Justice.\" What does that *actually* mean when it's not just a hashtag?",
        type: 'forcedChoice4',
        options: [
            { text: "The State ensuring everyone is 'equal' by making sure everyone has equally little, except the party officials, who are 'more equal'.", scores: { c: 1, m: 1, p: -1 } },
            { text: "Everyone in the 'community' feeling equally 'seen' and 'heard,' possibly through mandatory 'empathy workshops,' while systemic issues remain untouched.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "Everyone having the 'equal opportunity' to become obscenely wealthy by exploiting others, or to fail spectacularly on their own 'merits'.", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "A complex, probably flawed, attempt to balance individual rights, market realities, and societal support systems so that fewer people get totally screwed over. Low bar, but it's something.", scores: { c: 0.5, m: 0.5, p: 0.5 } }
        ]
    },
     { // Original Q11 (Individual Liberty) from your file, now q11 - WITH INVERTED SCORING
        id: 'q11',
        text: "When it comes to \"individual liberty,\" what's the most common societal self-deception?",
        type: 'forcedChoice4',
        options: [
            { text: "Believing you're 'free' because the government 'grants' you a list of carefully curated 'rights' (which it can also 'reinterpret' or suspend the moment it becomes mildly inconvenient for those in power).", scores: { c: -1.5, m: 0.5, p: 0.5 } },
            { text: "Thinking you're 'truly yourself' because you're part of a 'radically inclusive community' that celebrates your 'authentic self,' provided your authentic self aligns perfectly with the community's ever-shifting list of approved authenticities.", scores: { c: 0.5, m: -1.5, p: 0.5 } },
            { text: "Assuming you're 'captain of your soul' in a 'free market' where your every click, purchase, and fleeting thought is meticulously harvested, packaged, and sold to the highest bidder by tech oligarchs.", scores: { c: 0.5, m: 0.5, p: -1.5 } },
            { text: "The comforting illusion that our current messy system 'balances' all these freedoms perfectly, when it mostly just balances powerful interests against each other, and we get the leftovers.", scores: { c: 0.5, m: 0.5, p: 0.5 } }
        ]
    },
    { // Original Q12 (Healthcare) from your file, now q12
        id: 'q12',
        text: "Healthcare. How do we ensure people don't just, you know, die avoidably (without it being *too* inconvenient for the system)?",
        type: 'forcedChoice4',
        options: [
            { text: "The State Emergency Ward Model: Everyone queues for the same, slightly rusty, government-approved care. It's 'universally accessible' (if you don't mind the wait and the distinct aroma of institutional despair)! Everyone gets the same level of indifferent care!", scores: { c: 1, m: 1, p: -1 } },
            { text: "The 'Holistic Community Care Collective': Where access is 'guaranteed' through a network of underfunded local clinics run by passionate-but-overwhelmed volunteers, offering 'empowerment' and maybe some actual medicine if they haven't run out.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "The 'Pay-to-Live' Subscription Service: Got gold-plated insurance? Welcome to the VIP recovery suite! No? Here's an aspirin and a pamphlet on 'positive thinking'.", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "The Bureaucratic Labyrinth of Mixed Provision: A confusing maze of public options, private plans, and endless forms, where you *might* get what you need if you're persistent and lucky.", scores: { c: 0.4, m: 0.3, p: 0.8 } }
        ]
    },
    { // Original Q13 (Resource Management) from your file, now q13
        id: 'q13',
        text: "How should society \"manage\" its \"valuable resources\" (like, say, breathable air or the last dodo)?",
        type: 'forcedChoice4',
        options: [
            { text: "Appoint a Ministry of Absolutely Everything, which will issue stern directives and five-color charts on sustainable dodo farming. Problem solved!", scores: { c: 1.5, m: -0.5, p: -0.5 } },
            { text: "Establish an 'International People's Resource Stewardship Council' with representatives from every conceivable affinity group, to 'democratically allocate' resources through endless debate and the power of strongly worded resolutions.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "Auction off the broadcasting rights to the last dodo's extinction. The market provides! (Also, dodo nuggets, limited time only!)", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "The 'Let's Try Everything and Hope Something Sticks' approach: Forming endless committees to draft toothless regulations, while also 'incentivizing' corporations to 'be green' (wink, wink) and funding a few understaffed conservation groups. It's a masterclass in looking busy!", scores: { c: 0.5, m: 0.5, p: 0.5 } }
        ]
    },
    { // Original Q14 (Law and Order) from your file, now q14
        id: 'q14',
        text: "\"Law and Order.\" What's the least dysfunctional way to stop people from behaving like complete animals (more than usual)?",
        type: 'forcedChoice4',
        options: [
            { text: "A Robocop on Every Corner: Constant surveillance, swift 'justice' (i.e., punishment), and a society so orderly it's practically embalmed.", scores: { c: 1.5, m: -0.5, p: -0.5 } },
            { text: "Community Accountability Circles™: Where offenders and victims 'dialogue' their way to 'healing,' and serious crimes are handled with 'empathy' and maybe a stern talking-to.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "Private Security for the Rich, Darwin for the Rest: If you can afford a panic room and a mercenary army, you're golden! If not, well, 'natural selection' is a kind of order, isn't it?", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "The Current Creaky Legal System: Flawed laws, overburdened courts, some good cops, some bad cops, and lawyers. So many lawyers. It's a mess, but it's *our* mess.", scores: { c: 0.8, m: 0.2, p: 0.2 } }
        ]
    },
    { // Original Q15 (Big Tech) from your file, now q15
        id: 'q15',
        text: "How should \"Big Tech\" (those friendly overlords who know your every thought) be \"handled\"?",
        type: 'forcedChoice4',
        options: [
            { text: "Nationalize them! Let The State control the algorithms for 'public good' and 'national security.' What could be more trustworthy?", scores: { c: 1.5, m: -0.5, p: -0.5 } },
            { text: "Break them up into tiny, worker-owned digital co-ops that build 'ethical AI' and probably get bought out by a new Big Tech in six months.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "Let them fight! May the biggest data-hoarding monopoly win! 'Innovation' means new ways to harvest your soul for ad revenue.", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "A patchwork of confusing regulations, antitrust lawsuits that take a decade, and strongly worded parliamentary inquiries that achieve very little besides good soundbites.", scores: { c: 0.4, m: 0.3, p: 0.8 } }
        ]
    },
    { // Original Q16 (International Relations) from your file, now q16 - WITH REVISED C-OPTION & enhanced text
        id: 'q16',
        text: "International relations. What's the most 'realistic' (i.e., depressing) way for nations to interact?",
        type: 'forcedChoice4',
        options: [
            { text: "A glorious global pecking order established by 'might makes right,' where strong nations dictate terms, weaker nations comply (or get invaded), and 'international law' is just a cute suggestion for the powerful.", scores: { c: 1.5, m: -0.5, p: -0.5 } },
            { text: "A 'Global Federation of Sovereign Peoples' where everyone agrees to 'peace, love, and mutual understanding' via international Zoom calls, blissfully ignoring power politics until someone actually wants a valuable resource (at which point it's back to 'might makes right' but with more passive-aggressive emoji use).", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "Global Corporate Feudalism: Nations are just brands, citizens are consumers, and a few mega-corps pull all the strings from their tax-haven HQs. At least the quarterly earnings calls are consistently upbeat!", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "The 'Cautious Diplomat's Two-Step': Issuing strongly worded condemnations, signing vague international accords that everyone ignores, and generally trying to keep the global applecart from completely tipping over through a delicate balance of veiled threats and performative tea parties.", scores: { c: 0.5, m: 0.5, p: 0.5 } }
        ]
    },
    { // Original Q17 (Social Progress) from your file, now q17 - WITH ENHANCED SARCASM
        id: 'q17',
        text: "\"Social progress.\" If it happens at all, it's usually because:",
        type: 'forcedChoice4',
        options: [
            { text: "Some stern, far-sighted (or just plain bossy) state figures, armed with five-year plans and an unshakeable belief in their own genius, drag society kicking and screaming towards a 'brighter tomorrow' (that looks suspiciously like yesterday, but with more surveillance).", scores: { c: 1.5, m: -0.5, p: -0.5 } },
            { text: "Grassroots movements of well-meaning (and often Birkenstock-clad) activists tirelessly campaign for change, fueled by fair-trade coffee and righteous indignation, eventually annoying the establishment into making a tiny, largely symbolic concession.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "Some 'disruptive innovator' unleashes a new app/gizmo/Ponzi scheme that accidentally reshapes society, usually while making them obscenely wealthy and leaving a trail of bewildered Luddites and 'unforeseen consequences'.", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "The 'Incremental Muddle-Through' Method: Progress happens via slow, painful compromises, a bit of reluctant state action here, some hesitant market reform there, and a vague hope that it all adds up to something slightly less awful over several decades – a process so glacial it makes tectonic plate movement look like a sprint.", scores: { c: 0.5, m: 0.5, p: 0.5 } }
        ]
    },
    { // Original Q18 (Education Purpose) from your file, now q18
        id: 'q18',
        text: "Education's *real* purpose in this clown show we call life is to:",
        type: 'forcedChoice4',
        options: [
            { text: "Produce obedient little citizens who know the approved national narrative and won't cause too much trouble. Think of it as state-sponsored daycare with flags.", scores: { c: 1.5, m: -0.5, p: -0.5 } },
            { text: "Create 'well-rounded individuals' who can 'think critically' (i.e., agree with their progressive teachers) and 'collaborate' on endless group projects that prepare them for... more group projects.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "Equip individuals with 'marketable skills' so they can 'compete' in the glorious 'knowledge economy' (i.e., fight for unpaid internships).", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "Keep kids off the streets and vaguely literate, with a mix of useful stuff, useless stuff, and standardized tests, all managed by a bureaucracy that means well. Mostly.", scores: { c: 0.8, m: 0.2, p: 0.2 } }
        ]
    },
    // Original Tier 3 Questions (Q19-Q24 from your file, now q19-q24 for linear)
    { // Original Q19 (Private Property)
        id: 'q19',
        text: "\"Private property: sacred right bestowed by angels, or a polite term for 'I stole this fair and square'?\"",
        type: 'forcedChoice2',
        options: [ { text: "It's the bedrock of civilization! Without it, we're all just cavemen fighting over berries. My stuff is MINE!", scores: { c: 0, m: -1, p: 2 } }, { text: "Pretty much a scam that allows a few to hoard what should belong to everyone. Time to share the 'wealth' (and the pitchforks).", scores: { c: 0, m: 2, p: -1 } } ]
    },
    { // Original Q20 (The State)
        id: 'q20',
        text: "\"The State: benevolent protector or just the biggest gang in town?\"",
        type: 'forcedChoice2',
        options: [ { text: "It's the only thing stopping us from total Mad Max anarchy! We NEED its wise guidance and firm hand (preferably not *too* firm on *my* neck).", scores: { c: 2, m: -0.5, p: -0.5 } }, { text: "Mostly a protection racket that takes our money and tells us what to do. Let's just agree to not punch each other and call it a day.", scores: { c: -2, m: 0.5, p: 0.5 } } ]
    },
    { // Original Q21 (Individual Success) - WITH REVISED M SCORE
        id: 'q21',
        text: "Statement: \"Ultimately, individual success is purely down to personal effort and talent; blaming 'the system' is just for losers.\"",
        type: 'agreeDisagree',
        options: [ { text: "Agree (or at least, that's what winners say).", scores: { c: 0, m: -1, p: 2 } }, { text: "Disagree (because 'the system' is obviously rigged, duh).", scores: { c: 0, m: 1.5, p: -1 } } ]
    },
    { // Original Q22 (Chaos/Experimentation)
        id: 'q22',
        text: "Statement: \"A bit of chaos and radical experimentation is essential for a truly vibrant and evolving society, even if it makes the sensible people nervous.\"",
        type: 'agreeDisagree',
        options: [ { text: "Agree (let's burn it down and see what sprouts!).", scores: { c: -1, m: 0.5, p: 0.5 } }, { text: "Disagree (stability and proven methods are underrated, you damn hippies/disruptors!).", scores: { c: 1, m: -0.5, p: -0.5 } } ]
    },
    { // Original Q23 (Community Decision-Making)
        id: 'q23',
        text: "\"Community decision-making: beautiful expression of collective wisdom, or just a recipe for endless arguments and bad compromises?\"",
        type: 'forcedChoice2',
        options: [ { text: "It's the only truly legitimate way! Power to the people (and their endless meetings)!", scores: { c: -0.5, m: 2, p: -0.5 } }, { text: "Give me a decisive leader or a clear market signal any day. 'Community' usually means someone's annoying opinions.", scores: { c: 0.5, m: -2, p: 0.5 } } ]
    },
    { // Original Q24 (National Identity)
        id: 'q24',
        text: "Statement: \"A society that doesn't have a strong, unified national identity and purpose is basically just a random collection of people waiting to fall apart.\"",
        type: 'agreeDisagree',
        options: [ { text: "Agree (One Nation, One Glorious Purpose... as soon as we figure out what it is this week).", scores: { c: 2, m: -0.5, p: -0.5 } }, { text: "Disagree (Diversity is strength! National identity is mostly just old flags and boring songs. Let a thousand flowers bloom, etc.).", scores: { c: -1, m: 0.5, p: 0.5 } } ]
    },
    // The 6 "New" Questions with enhanced sarcasm (q25-q30)
    {
        id: 'q25',
        text: "Let's be brutally honest: if the 'government' (or whatever euphemism we're using for 'the people bossing us around') has *one* actual, non-negotiable job, it's to:",
        type: 'forcedChoice4',
        options: [
            { text: "Grandly steer the national ship towards a Glorious Predetermined Destiny™, using a very large megaphone, an army of planners, and a healthy disregard for individual preferences that 'deviate from the approved trajectory.'", scores: { c: 2, m: -1, p: -1 } },
            { text: "Act as society's overly enthusiastic cruise director, ensuring everyone 'feels included' in endless 'enrichment activities' and 'synergy workshops,' while the actual ship slowly takes on water due to committee paralysis.", scores: { c: -1, m: 2, p: -1 } },
            { text: "Be an almost invisible, ultra-low-budget night watchman who just stops blatant arson and grand larceny, then immediately goes back to sleep so rugged individuals can get on with building their empires (or meth labs).", scores: { c: -1, m: -1, p: 2 } },
            { text: "Basically, keep the traffic lights working and stop society from devolving into a full-blown medieval brawl over the last Wi-Fi hotspot. Anything more is just asking for trouble and more paperwork.", scores: { c: 0.5, m: 0.2, p: 0.2 } }
        ]
    },
    {
        id: 'q26',
        text: "Humanity's biggest, most apocalyptic-level screw-ups (climate change, pandemics, reality TV) are fundamentally the result of:",
        type: 'forcedChoice4',
        options: [
            { text: "A catastrophic lack of centralized control and not enough PowerPoint presentations from The Experts™. If only everyone listened to the Smartest People in the Room (i.e., us), we'd have a utopia by lunchtime.", scores: { c: 2, m: -1, p: -0.5 } },
            { text: "A tragic empathy deficit and too many people stubbornly refusing to join hands, sing campfire songs, and collectively solve everything with good intentions and locally-sourced, artisanal solutions. Also, probably capitalism.", scores: { c: -1, m: 2, p: -0.5 } },
            { text: "Too many meddling bureaucrats, innovation-stifling regulations, and a general societal failure to just get out of the way and let brilliant, unfettered individuals and the glorious Free Market 'disrupt' us into a brighter future (with optional shareholder dividends).", scores: { c: -0.5, m: -0.5, p: 2 } },
            { text: "The depressing fact that humans are, by and large, short-sighted, mildly corruptible, and easily distracted by shiny objects. We're basically clever monkeys with anxiety and car keys; 'solving' things permanently is a bit much to ask.", scores: { c: 0.2, m: 0.2, p: 0.2 } }
        ]
    },
    {
        id: 'q27', // Critique of Stateless Capitalism (descriptive text)
        text: "Consider a proposed society with no state, where *all* services (defense, courts, roads) are run by competing private businesses, and all interactions are based on voluntary contracts. This vision is:",
        type: 'forcedChoice4',
        options: [
            { text: "The pinnacle of human freedom and efficiency! A shining beacon where every interaction is voluntary and the only king is the Consumer. If you can't afford your private firefighter subscription, that's just natural selection at work!", scores: { c: -2, m: -0.5, p: 2 } },
            { text: "A terrifying descent into Mad Max, but with corporate branding and better-armed private armies. You absolutely *need* a State, preferably a very large one with a monopoly on all the good weapons, to prevent this nightmare.", scores: { c: 1.5, m: -0.5, p: -1 } },
            { text: "Just capitalism with the mask off: private tyrannies replacing a public one, where 'freedom' means choosing which billionaire's private law you'll be oppressed by. We need *actual* community control, not just different bosses.", scores: { c: -0.5, m: 1.5, p: -1.5 } },
            { text: "An amusingly chaotic idea for a video game, but in reality, probably just a recipe for a really terrible HOA that eventually declares itself a sovereign nation and invades the next cul-de-sac.", scores: { c: 0.5, m: 0.2, p: 0.2 } }
        ]
    },
    {
        id: 'q28', // Critique of Stateless Communalism (descriptive text)
        text: "Picture a society with no state, no money, where all property is held in common, and all decisions are made by community consensus, with everyone contributing as they can and taking what they need. This vision is:",
        type: 'forcedChoice4',
        options: [
            { text: "Humanity's inevitable, enlightened destiny! Once we've all transcended petty selfishness (and personal hygiene concerns), we'll live in perfect, leaderless harmony, fueled by mutual aid and really good organic kale.", scores: { c: -2, m: 2, p: -0.5 } },
            { text: "A one-way ticket to 'Lord of the Flies' with more drum circles and arguments about who used the last of the collectively-owned patchouli. Someone authoritative needs to hide the talking stick and enforce a basic chore rota, stat!", scores: { c: 1.5, m: -1, p: 0 } },
            { text: "A charmingly naive fantasy that forgets most people would rather have their own damn toothbrush and the incentive to invent something cooler than another lentil recipe. 'Shared everything' usually means 'nothing good for anyone.'", scores: { c: 0, m: -1.5, p: 1.5 } },
            { text: "An adorable concept for a small, very patient cult or a particularly ambitious improv troupe, but try running a city on 'good vibes' and a vague agreement to 'be nice.' Spoiler: it involves a lot of unwashed dishes.", scores: { c: 0.5, m: -0.5, p: 0 } }
        ]
    },
    {
        id: 'q29', // Attitude Towards Wealth Inequality
        text: "The fact that some people have private jets and gold-plated bidets while others are using newspapers for insulation is, from a societal perspective:",
        type: 'forcedChoice4',
        options: [
            { text: "A situation the State must carefully 'manage' – not to eliminate wealth (Heavens, no! We need our loyal oligarchs!), but to tax just enough to prevent outright revolution while ensuring the 'right' people stay comfortable.", scores: { c: 1, m: 0.5, p: -1 } },
            { text: "An outrageous moral failing and clear proof of a rigged, exploitative system! Time to sharpen the guillotines, redistribute the jets, and ensure everyone has at least a cooperatively-owned, ethically-sourced bidet.", scores: { c: -0.5, m: 1.5, p: -1.5 } },
            { text: "The beautiful, natural outcome of some people being brilliant, hard-working geniuses and others being... less so. As long as the jets were acquired 'legally' (i.e., through shrewd market plays or a really good inheritance), it's just the free market doing its inspiring work!", scores: { c: -0.5, m: -1.5, p: 2 } },
            { text: "Frankly, inevitable and a bit depressing, but probably not fixable without making things even worse. Best to focus on a robust-ish charity sector and hope the jet-owners occasionally feel a pang of guilt and donate some spare bidet parts.", scores: { c: 0.2, m: 0.3, p: 0.4 } }
        ]
    },
    {
        id: 'q30', // Primary Role of Law
        text: "Beyond just stopping people from engaging in enthusiastic axe-murder, society's legal system should primarily exist to:",
        type: 'forcedChoice4',
        options: [
            { text: "Diligently uphold The Nation's Sacred Values, codify The One True Path to Good Citizenship, and gently (or not-so-gently) guide the populace away from 'undesirable' thoughts and behaviors. For their own moral hygiene, of course.", scores: { c: 1.5, m: -0.25, p: -0.75 } },
            { text: "Serve as a dynamic tool for communities to achieve restorative justice, ensure equitable access to all resources (especially the good snacks), and constantly evolve through participatory public forums to reflect the People's ever-changing sense of 'fairness.'", scores: { c: -0.75, m: 1.5, p: -0.25 } },
            { text: "Meticulously define and ruthlessly protect individual rights – especially the right to own vast quantities of stuff and enter into incredibly complex, probably exploitative contracts. Everything else is just statist fluff.", scores: { c: -0.75, m: -0.25, p: 1.5 } },
            { text: "Provide a somewhat stable, mostly understandable (if you have three law degrees) framework so businesses can sue each other and the rest of us have a vague idea of what's likely to get us thrown in jail this week. It's not pretty, but it's (sort of) order.", scores: { c: 0.3, m: 0.1, p: 0.3 } }
        ]
    }
];