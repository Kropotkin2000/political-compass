// V9 Sarcastic Tiered Questionnaire
// SCORING IS HIGHLY SPECULATIVE AND REQUIRES INTENSE CALIBRATION
// C = Centralism, M = Communalism, P = Privatism

const questions = [
    // Tier 1: Broad Strokes / Value Correlates (8 Questions)
    {
        id: 1,
        tier: 1,
        text: "When a big problem arises, what's your instinctive, deeply unhelpful first thought?",
        type: 'forcedChoice3',
        options: [
            { text: "(A) \"Someone really important and official should sort this out. Where's the manager of the universe?!\"", scores: { c: 2, m: -1, p: -1 } },
            { text: "(B) \"Ugh, if only we could form a thousand sub-committees to 'dialogue' this problem into submission! Surely a perfectly 'inclusive' process will magically yield a perfect solution, eventually\"", scores: { c: -1, m: 2, p: -1 } },
            { text: "(C) \"Not my circus, not my monkeys. Unless there's a way to profit from this chaos, then it's *very much* my circus.\"", scores: { c: -1, m: -1, p: 2 } }
        ]
    },
    {
        id: 2,
        tier: 1,
        text: "\"Progress.\" If it's not just a fancy word for \"gentrification,\" it probably means:",
        type: 'forcedChoice3',
        options: [
            { text: "(A) Making everything more streamlined, predictable, and under the firm-but-loving grip of those who 'know best.' For efficiency!", scores: { c: 2, m: -1, p: -1 } },
            { text: "(B) Everyone feeling 'empowered' to 'live their truth' and 'express themselves,' leading to a society that's... certainly more colorful, if not actually functional.", scores: { c: -1, m: 2, p: -1 } },
            { text: "(C) A new app that shaves 0.2 seconds off ordering a pizza, while the actual societal dumpster fire rages on. But hey, convenience!", scores: { c: -1, m: -1, p: 2 } }
        ]
    },
    {
        id: 3,
        tier: 1,
        text: "What's generally a bigger threat to a \"good life\" (whatever that is)?",
        type: 'forcedChoice2',
        options: [
            { text: "(A) Too much messy, unpredictable individual freedom leading to societal breakdown and people putting pineapples on pizza.", scores: { c: 1, m: 0, p: -1 } },
            { text: "(B) Too many rules and powerful institutions telling you what to do, crushing your unique spirit under the weight of conformity.", scores: { c: -1, m: 0, p: 1 } }
        ]
    },
    {
        id: 4,
        tier: 1,
        text: "When you hear \"the common good,\" what's your immediate, cynical translation?",
        type: 'forcedChoice3', // Scoring here is inverted: picking A means you're NOT C
        options: [
            { text: "(A) \"What the people in charge have decided is good for *them*, and by extension, 'us,' whether we like it or not.\"", scores: { c: -2, m: 0.5, p: 0.5 } },
            { text: "(B) \"Something vague and fluffy that sounds nice but usually means *I* have to give up something I like for people I don't know.\"", scores: { c: 0.5, m: 0.5, p: -2 } },
            { text: "(C) \"An endless series of meetings to determine what 'the community' wants, which usually means what the loudest person wants.\"", scores: { c: 0.5, m: -2, p: 0.5 } }
        ]
    },
    {
        id: 5,
        tier: 1,
        text: "If society is a stage play, what's the most crucial role?",
        type: 'forcedChoice3',
        options: [
            { text: "(A) The Stern But Fair Director: Making sure everyone hits their marks, says their lines, and doesn't upstage the star (usually The State).", scores: { c: 2, m: -1, p: -1 } },
            { text: "(B) The Harmonious Ensemble Cast: Everyone supporting each other, sharing the spotlight, and creating something beautiful (and probably unprofitable) together.", scores: { c: -1, m: 2, p: -1 } },
            { text: "(C) The Dashing Maverick Lead: Improvising wildly, stealing every scene, and to hell with the script or the other actors. It's *their* show!", scores: { c: -1, m: -1, p: 2 } }
        ]
    },
    {
        id: 6,
        tier: 1,
        text: "What's the more fundamental human drive?",
        type: 'forcedChoice3',
        options: [
            { text: "(A) The desperate need for order, security, and someone to tell us it's all going to be okay (even if it's a lie).", scores: { c: 2, m: -1, p: -1 } },
            { text: "(B) The deep-seated urge to connect, belong, and not be a total hermit, even if other people are mostly annoying.", scores: { c: -1, m: 2, p: -1 } },
            { text: "(C) The insatiable hunger to be special, get ahead, and accumulate more shiny things than the next person.", scores: { c: -1, m: -1, p: 2 } }
        ]
    },
    {
        id: 7,
        tier: 1,
        text: "When faced with a complex problem, what's your go-to (probably flawed) initial strategy?",
        type: 'forcedChoice3',
        options: [
            { text: "(A) \"Let's form a committee, draft a policy paper, and schedule a series of consultations. Action can wait until we have a 300-page report!\"", scores: { c: 2, m: -1, p: -1 } },
            { text: "(B) \"We need to talk about our feelings about this problem! Let's have a sharing circle and ensure everyone feels validated before we even *think* about solutions.\"", scores: { c: -1, m: 2, p: -1 } },
            { text: "(C) \"Screw the rules, I have money/connections/a crazy idea! Let me just dive in and 'disrupt' things. What's the worst that could happen?\"", scores: { c: -1, m: -1, p: 2 } }
        ]
    },
    {
        id: 8,
        tier: 1,
        text: "If society had a motto, which of these cringeworthy options would be the most accurate (if depressing)?",
        type: 'forcedChoice3',
        options: [
            { text: "(A) \"Order Above All (Even Your Happiness).\"", scores: { c: 1, m: -0.5, p: -0.5 } },
            { text: "(B) \"Together We Achieve... Eventually... Maybe.\"", scores: { c: -0.5, m: 1, p: -0.5 } },
            { text: "(C) \"Every Person For Themselves (Good Luck!).\"", scores: { c: -0.5, m: -0.5, p: 1 } }
        ]
    },

    // Tier 2: Nuance & Overlap Probes (10 Questions)
    {
        id: 9,
        tier: 2,
        text: "The \"ideal\" economy (if such a non-disaster exists) would mostly run on:",
        type: 'forcedChoice4',
        options: [
            { text: "(A) The State's All-Knowing Wisdom: Central planners heroically assigning production quotas for artisanal pickles and novelty socks. Maximum efficiency!", scores: { c: 1.5, m: 0.5, p: -1 } },
            { text: "(B) Ugh, if only we could form a thousand sub-committees to 'dialogue' this problem into submission! Surely a perfectly 'inclusive' process will magically yield a perfect solution, eventually", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "(C) The 'Invisible Hand's' Slightly Sticky Fingers: Let the market decide who gets rich and who gets to eat ramen for eternity. It's 'natural'!", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "(D) The 'Sensible Shoes' Model: A bit of market 'dynamism,' a lot of government 'oversight,' and some 'social responsibility.' It's boring, but it vaguely functions.", scores: { c: 0.4, m: 0.3, p: 0.8 } } // P-Leaning Centrist
        ]
    },
    {
        id: 10,
        tier: 2,
        text: "\"Social Justice.\" What does that *actually* mean when it's not just a hashtag?",
        type: 'forcedChoice4',
        options: [
            { text: "(A) The State ensuring everyone is 'equal' by making sure everyone has equally little, except the party officials, who are 'more equal'.", scores: { c: 1, m: 1, p: -1 } },
            { text: "(B) Everyone in the 'community' feeling equally 'seen' and 'heard,' possibly through mandatory 'empathy workshops,' while systemic issues remain untouched.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "(C) Everyone having the 'equal opportunity' to become obscenely wealthy by exploiting others, or to fail spectacularly on their own 'merits'.", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "(D) A complex, probably flawed, attempt to balance individual rights, market realities, and societal support systems so that fewer people get totally screwed over. Low bar, but it's something.", scores: { c: 0.5, m: 0.5, p: 0.5 } } // Balanced Centrist
        ]
    },
     {
        id: 11,
        tier: 2,
        text: "When it comes to \"individual liberty,\" what's the most common societal self-deception?",
        type: 'forcedChoice4',
        options: [
            { text: "(A) Believing you're 'free' because the government 'grants' you a list of carefully curated 'rights' (which it can also 'reinterpret' at will).", scores: { c: 1.5, m: -0.5, p: -0.5 } },
            { text: "(B) Thinking you're 'truly yourself' because you're part of a 'radically inclusive community' that just happens to have very strong opinions on what your 'true self' should be.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "(C) Assuming you're 'captain of your soul' in a 'free market' where giant corporations and billionaires basically own the water you float in.", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "(D) The comforting illusion that our current messy system 'balances' all these freedoms perfectly, when it mostly just balances powerful interests against each other, and we get the leftovers.", scores: { c: 0.5, m: 0.5, p: 0.5 } } // Balanced Centrist
        ]
    },
    {
        id: 12,
        tier: 2,
        text: "Healthcare. How do we ensure people don't just, you know, die avoidably (without it being *too* inconvenient for the system)?",
        type: 'forcedChoice4',
        options: [
            { text: "(A) The State Emergency Ward Model: Everyone queues for the same, slightly rusty, government-approved care. It's 'universally accessible' (if you don't mind the wait and the distinct aroma of institutional despair)! Everyone gets the same level of indifferent care!", scores: { c: 1, m: 1, p: -1 } },
            { text: "(B) The 'Holistic Community Care Collective': Where access is 'guaranteed' through a network of underfunded local clinics run by passionate-but-overwhelmed volunteers, offering 'empowerment' and maybe some actual medicine if they haven't run out.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "(C) The 'Pay-to-Live' Subscription Service: Got gold-plated insurance? Welcome to the VIP recovery suite! No? Here's an aspirin and a pamphlet on 'positive thinking'.", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "(D) The Bureaucratic Labyrinth of Mixed Provision: A confusing maze of public options, private plans, and endless forms, where you *might* get what you need if you're persistent and lucky.", scores: { c: 0.4, m: 0.3, p: 0.8 } } // P-Leaning Centrist
        ]
    },
    {
        id: 13,
        tier: 2,
        text: "How should society \"manage\" its \"valuable resources\" (like, say, breathable air or the last dodo)?",
        type: 'forcedChoice4',
        options: [
            { text: "(A) Appoint a Ministry of Absolutely Everything, which will issue stern directives and five-color charts on sustainable dodo farming. Problem solved!", scores: { c: 1.5, m: -0.5, p: -0.5 } },
            { text: "(B) Establish an 'International People's Resource Stewardship Council' with representatives from every conceivable affinity group, to 'democratically allocate' resources through endless debate and the power of strongly worded resolutions.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "(C) Auction off the broadcasting rights to the last dodo's extinction. The market provides! (Also, dodo nuggets, limited time only!)", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "(D) The 'Let's Try Everything and Hope Something Sticks' approach: Forming endless committees to draft toothless regulations, while also 'incentivizing' corporations to 'be green' (wink, wink) and funding a few understaffed conservation groups. It's a masterclass in looking busy!", scores: { c: 0.5, m: 0.5, p: 0.5 } } // Balanced Centrist
        ]
    },
    {
        id: 14,
        tier: 2,
        text: "\"Law and Order.\" What's the least dysfunctional way to stop people from behaving like complete animals (more than usual)?",
        type: 'forcedChoice4',
        options: [
            { text: "(A) A Robocop on Every Corner: Constant surveillance, swift 'justice' (i.e., punishment), and a society so orderly it's practically embalmed.", scores: { c: 1.5, m: -0.5, p: -0.5 } },
            { text: "(B) Community Accountability Circles™: Where offenders and victims 'dialogue' their way to 'healing,' and serious crimes are handled with 'empathy' and maybe a stern talking-to.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "(C) Private Security for the Rich, Darwin for the Rest: If you can afford a panic room and a mercenary army, you're golden! If not, well, 'natural selection' is a kind of order, isn't it?", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "(D) The Current Creaky Legal System: Flawed laws, overburdened courts, some good cops, some bad cops, and lawyers. So many lawyers. It's a mess, but it's *our* mess.", scores: { c: 0.8, m: 0.2, p: 0.2 } } // C-Leaning Centrist
        ]
    },
    {
        id: 15,
        tier: 2,
        text: "How should \"Big Tech\" (those friendly overlords who know your every thought) be \"handled\"?",
        type: 'forcedChoice4',
        options: [
            { text: "(A) Nationalize them! Let The State control the algorithms for 'public good' and 'national security.' What could be more trustworthy?", scores: { c: 1.5, m: -0.5, p: -0.5 } },
            { text: "(B) Break them up into tiny, worker-owned digital co-ops that build 'ethical AI' and probably get bought out by a new Big Tech in six months.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "(C) Let them fight! May the biggest data-hoarding monopoly win! 'Innovation' means new ways to harvest your soul for ad revenue.", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "(D) A patchwork of confusing regulations, antitrust lawsuits that take a decade, and strongly worded parliamentary inquiries that achieve very little besides good soundbites.", scores: { c: 0.4, m: 0.3, p: 0.8 } } // P-Leaning Centrist
        ]
    },
    {
        id: 16,
        tier: 2,
        text: "International relations. What's the most 'realistic' (i.e., depressing) way for nations to interact?",
        type: 'forcedChoice4',
        options: [
            { text: "(A) One World Government (Probably Run by Lizards): Finally, a single authority to mismanage the entire planet with breathtaking efficiency!", scores: { c: 1.5, m: -0.5, p: -0.5 } },
            { text: "(B) A 'Global Federation of Sovereign Peoples' where everyone agrees to 'peace, love, and mutual understanding' via international Zoom calls, blissfully ignoring power politics until someone actually wants a valuable resource.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "(C) Global Corporate Feudalism: Nations are just brands, citizens are consumers, and a few mega-corps pull all the strings. At least the quarterly reports are good!", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "(D) The 'Cautious Diplomat's Two-Step': Issuing strongly worded condemnations, signing vague international accords that everyone ignores, and generally trying to keep the global applecart from completely tipping over through a delicate balance of threats and tea parties.", scores: { c: 0.5, m: 0.5, p: 0.5 } } // Balanced Centrist
        ]
    },
    {
        id: 17,
        tier: 2,
        text: "\"Social progress.\" If it happens at all, it's usually because:",
        type: 'forcedChoice4',
        options: [
            { text: "(A) Some stern, far-sighted (or just plain bossy) state figures drag society kicking and screaming into a 'better' future they've designed.", scores: { c: 1.5, m: -0.5, p: -0.5 } },
            { text: "(B) Grassroots movements of well-meaning (and often Birkenstock-clad) activists tirelessly campaign for change, annoying everyone into submission eventually.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "(C) Some clever individual invents a new widget or business model that accidentally makes things better (or worse, but differently!) for everyone, while making themselves rich.", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "(D) The 'Incremental Muddle-Through' Method: Progress happens via slow, painful compromises, a bit of reluctant state action here, some hesitant market reform there, and a vague hope that it all adds up to something slightly less awful over several decades.", scores: { c: 0.5, m: 0.5, p: 0.5 } } // Balanced Centrist
        ]
    },
    {
        id: 18,
        tier: 2,
        text: "Education's *real* purpose in this clown show we call life is to:",
        type: 'forcedChoice4',
        options: [
            { text: "(A) Produce obedient little citizens who know the approved national narrative and won't cause too much trouble. Think of it as state-sponsored daycare with flags.", scores: { c: 1.5, m: -0.5, p: -0.5 } },
            { text: "(B) Create 'well-rounded individuals' who can 'think critically' (i.e., agree with their progressive teachers) and 'collaborate' on endless group projects that prepare them for... more group projects.", scores: { c: -0.5, m: 1.5, p: -0.5 } },
            { text: "(C) Equip individuals with 'marketable skills' so they can 'compete' in the glorious 'knowledge economy' (i.e., fight for unpaid internships).", scores: { c: -0.5, m: -0.5, p: 1.5 } },
            { text: "(D) Keep kids off the streets and vaguely literate, with a mix of useful stuff, useless stuff, and standardized tests, all managed by a bureaucracy that means well. Mostly.", scores: { c: 0.8, m: 0.2, p: 0.2 } } // C-Leaning Centrist
        ]
    },

    // Tier 3: "Dealbreaker" / Strong Stance Clarifiers (6 Questions)
    {
        id: 19,
        tier: 3,
        text: "\"Private property: sacred right bestowed by angels, or a polite term for 'I stole this fair and square'?\"",
        type: 'forcedChoice2',
        options: [
            { text: "(A) It's the bedrock of civilization! Without it, we're all just cavemen fighting over berries. My stuff is MINE!", scores: { c: 0, m: -1, p: 2 } },
            { text: "(B) Pretty much a scam that allows a few to hoard what should belong to everyone. Time to share the 'wealth' (and the pitchforks).", scores: { c: 0, m: 2, p: -1 } }
        ]
    },
    {
        id: 20,
        tier: 3,
        text: "\"The State: benevolent protector or just the biggest gang in town?\"",
        type: 'forcedChoice2',
        options: [
            { text: "(A) It's the only thing stopping us from total Mad Max anarchy! We NEED its wise guidance and firm hand (preferably not *too* firm on *my* neck).", scores: { c: 2, m: -0.5, p: -0.5 } },
            { text: "(B) Mostly a protection racket that takes our money and tells us what to do. Let's just agree to not punch each other and call it a day.", scores: { c: -2, m: 0.5, p: 0.5 } }
        ]
    },
    {
        id: 21,
        tier: 3,
        text: "Statement: \"Ultimately, individual success is purely down to personal effort and talent; blaming 'the system' is just for losers.\"",
        type: 'agreeDisagree', // Will be handled as two radio buttons: "Agree" and "Disagree"
        options: [ // Scores for "Agree"
            { text: "Agree (or at least, that's what winners say).", scores: { c: 0, m: -1, p: 2 } },
            { text: "Disagree (because 'the system' is obviously rigged, duh).", scores: { c: 0, m: 1, p: -1 } } // Scores for "Disagree"
        ]
    },
    {
        id: 22,
        tier: 3,
        text: "Statement: \"A bit of chaos and radical experimentation is essential for a truly vibrant and evolving society, even if it makes the sensible people nervous.\"",
        type: 'agreeDisagree',
        options: [ // Scores for "Agree"
            { text: "Agree (let's burn it down and see what sprouts!).", scores: { c: -1, m: 0.5, p: 0.5 } },
            { text: "Disagree (stability and proven methods are underrated, you damn hippies/disruptors!).", scores: { c: 1, m: -0.5, p: -0.5 } } // Scores for "Disagree"
        ]
    },
    {
        id: 23,
        tier: 3,
        text: "\"Community decision-making: beautiful expression of collective wisdom, or just a recipe for endless arguments and bad compromises?\"",
        type: 'forcedChoice2',
        options: [
            { text: "(A) It's the only truly legitimate way! Power to the people (and their endless meetings)!", scores: { c: -0.5, m: 2, p: -0.5 } },
            { text: "(B) Give me a decisive leader or a clear market signal any day. 'Community' usually means someone's annoying opinions.", scores: { c: 0.5, m: -2, p: 0.5 } }
        ]
    },
    {
        id: 24,
        tier: 3,
        text: "Statement: \"A society that doesn't have a strong, unified national identity and purpose is basically just a random collection of people waiting to fall apart.\"",
        type: 'agreeDisagree',
        options: [ // Scores for "Agree"
            { text: "Agree (One Nation, One Glorious Purpose... as soon as we figure out what it is this week).", scores: { c: 2, m: -0.5, p: -0.5 } },
            { text: "Disagree (Diversity is strength! National identity is mostly just old flags and boring songs. Let a thousand flowers bloom, etc.).", scores: { c: -1, m: 0.5, p: 0.5 } } // Scores for "Disagree"
        ]
    }
];
