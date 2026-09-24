// Data model for The DigiBoost Crown Quest.
// Matches the official DigiBoost Crown Quest concept document:
// 6 Kingdoms representing agency services, 2 puzzles each (12 total),
// earning 6 crown gems to forge the final DigiBoost Crown.

export const FAST_SOLVE_MS = 25000; // under 25 seconds = fast-completion bonus

export const SCORING = {
    CORRECT: 100,
    FAST: 50,
    NO_MISTAKES: 25,
    WRONG: -20,
};

export const KINGDOMS = [
    {
        id: 'smm',
        name: 'SMM & Branding',
        title: 'The Kingdom of Identity',
        icon: 'fa-solid fa-bullhorn',
        gem: 'Brand Gem',
        gemColor: '#00f2fe',
        playerTitle: 'Brand Builder',
        message: 'Need a brand people remember? DigiBoost builds brands that stand out.',
        puzzles: [
            {
                key: 'build-the-brand',
                name: 'Build the Brand',
                type: 'brand-board',
                prompt: 'Place the matching element into each slot of the Brand Identity Board (Tap or Drag).',
                slots: [
                    { id: 'slot-logo', category: 'logo', label: 'Logo Mark', icon: 'fa-solid fa-crown' },
                    { id: 'slot-color', category: 'color', label: 'Color Palette', icon: 'fa-solid fa-palette' },
                    { id: 'slot-font', category: 'font', label: 'Typeface', icon: 'fa-solid fa-font' },
                    { id: 'slot-tagline', category: 'tagline', label: 'Tagline', icon: 'fa-solid fa-quote-left' },
                ],
                chips: [
                    {
                        id: 'logo-1',
                        category: 'logo',
                        label: 'Bold Crown Monogram',
                        badge: '👑 DIGIBOOST',
                        correct: true,
                        hint: 'A distinguished royal agency mark'
                    },
                    {
                        id: 'logo-2',
                        category: 'logo',
                        label: 'Generic Clipart Icon',
                        badge: '🌀 ClipArt',
                        correct: false,
                        hint: 'Blurry stock icon'
                    },
                    {
                        id: 'color-1',
                        category: 'color',
                        label: 'Cyan + Deep Navy',
                        swatches: ['#00f2fe', '#070d0e', '#9ada00'],
                        correct: true,
                        hint: 'High-contrast luxury cyber palette'
                    },
                    {
                        id: 'color-2',
                        category: 'color',
                        label: 'Clashing Neon Rainbow',
                        swatches: ['#ff0055', '#ff9900', '#00ff66', '#9900ff'],
                        correct: false,
                        hint: 'Unbalanced overwhelming hues'
                    },
                    {
                        id: 'font-1',
                        category: 'font',
                        label: 'Clean Modern Sans',
                        fontFamily: "'Outfit', sans-serif",
                        correct: true,
                        hint: 'Geometric, crisp and authoritative'
                    },
                    {
                        id: 'font-2',
                        category: 'font',
                        label: 'Messy Script',
                        fontFamily: "'Sacramento', cursive",
                        correct: false,
                        hint: 'Hard to read at body scale'
                    },
                    {
                        id: 'tagline-1',
                        category: 'tagline',
                        label: '"Impossible to Ignore"',
                        correct: true,
                        hint: 'Unapologetically memorable'
                    },
                    {
                        id: 'tagline-2',
                        category: 'tagline',
                        label: '"We Do Marketing Stuff"',
                        correct: false,
                        hint: 'Vague and forgettable'
                    },
                ],
            },
            {
                key: 'social-feed-fixer',
                name: 'Social Feed Fixer',
                type: 'social-fixer',
                prompt: 'Choose the strongest social post. Look for a strong hook, clear visual value, and a compelling call-to-action.',
                options: [
                    {
                        id: 'post-weak-1',
                        author: 'QuickPost Bot',
                        hook: 'BUY OUR SERVICE NOW!!',
                        body: 'Click here immediately to get 5% discount before midnight!',
                        cta: 'No link provided',
                        metrics: '12 Likes · 1 Comment',
                        status: 'Spammy / Zero Value',
                        correct: false,
                    },
                    {
                        id: 'post-strong',
                        author: 'DigiBoost Agency',
                        hook: 'How this D2C brand scaled 340% without increasing ad spend 📈',
                        body: 'We revamped their funnel into 3 high-converting micro-audiences. Here is the exact breakdown step-by-step.',
                        cta: '👉 Tap the link in bio for the complete strategy blueprint',
                        metrics: '2,840 Likes · 318 Comments · 892 Shares',
                        status: 'Hook + Value + Clear CTA',
                        correct: true,
                    },
                    {
                        id: 'post-weak-2',
                        author: 'CasualPoster',
                        hook: 'Office coffee today ☕',
                        body: 'Hope everyone has a nice week ahead.',
                        cta: 'None',
                        metrics: '18 Likes · 2 Comments',
                        status: 'Personal / No Brand Impact',
                        correct: false,
                    },
                    {
                        id: 'post-weak-3',
                        author: 'TagSpammer',
                        hook: 'Check our business #marketing #business #growth #viral #follow #trending',
                        body: 'Giant wall of hashtags with no caption and no image.',
                        cta: 'None',
                        metrics: '5 Likes · 0 Comments',
                        status: 'Hashtag Stuffing / Shadowbanned',
                        correct: false,
                    },
                ],
            },
        ],
    },
    {
        id: 'leadgen',
        name: 'Lead Generation',
        title: 'The Kingdom of Growth',
        icon: 'fa-solid fa-chart-line',
        gem: 'Growth Gem',
        gemColor: '#9ada00',
        playerTitle: 'Growth Hunter',
        message: "Ready to turn attention into customers? Let's build your funnel.",
        puzzles: [
            {
                key: 'repair-the-funnel',
                name: 'Repair the Funnel',
                type: 'funnel',
                prompt: 'Assemble the marketing funnel stages in order from top to bottom (Stranger → Client).',
                stages: [
                    { id: 'visitor', label: '1. Visitor', sub: 'Cold traffic arriving at site', count: '10,000 Visitors', icon: 'fa-solid fa-eye' },
                    { id: 'interested', label: '2. Interested', sub: 'Engaging with brand content', count: '2,800 Engaged', icon: 'fa-solid fa-thumbs-up' },
                    { id: 'lead', label: '3. Lead', sub: 'Submitting contact & booking call', count: '640 Qualified', icon: 'fa-solid fa-envelope-open-text' },
                    { id: 'customer', label: '4. Customer', sub: 'High-value paying client', count: '160 Conversions', icon: 'fa-solid fa-crown' },
                ],
            },
            {
                key: 'catch-the-customer',
                name: 'Catch the Customer',
                type: 'radar',
                prompt: 'Catch 3 high-intent prospects for the sales pipeline. Let casual browsers and bots pass by!',
                targetGoal: 3,
                prospects: [
                    { id: 'p1', intent: 'low', text: '"Just browsing, maybe someday"', badge: 'Casual Browser', tip: 'Low intent — don’t waste ad spend!' },
                    { id: 'p2', intent: 'high', text: '"Requested a custom price quote today"', badge: 'Ready to Buy', tip: 'High buying intent captured! (+100 pts)' },
                    { id: 'p3', intent: 'low', text: 'Bounced in 1.5 seconds', badge: 'High Bounce', tip: 'Unengaged traffic — skipped!' },
                    { id: 'p4', intent: 'high', text: '"Added enterprise tier to cart, ready to pay"', badge: 'Checkout Ready', tip: 'Commercial lead captured! (+100 pts)' },
                    { id: 'p5', intent: 'low', text: 'Bot traffic from overseas proxy click farm', badge: 'Bot Traffic', tip: 'Click fraud prevented! (-20 pts)' },
                    { id: 'p6', intent: 'high', text: '"Booked a 30-min strategy session call"', badge: 'High Urgency', tip: 'Sales call booked! (+100 pts)' },
                ],
            },
        ],
    },
    {
        id: 'tvc',
        name: 'TVC Ad Videos',
        title: 'The Kingdom of Stories',
        icon: 'fa-solid fa-clapperboard',
        gem: 'Story Gem',
        gemColor: '#9d4edd',
        playerTitle: 'Story Master',
        message: "Have a story worth watching? Let's turn it into a commercial.",
        puzzles: [
            {
                key: 'build-the-story',
                name: 'Build the Story',
                type: 'storyboard',
                prompt: 'Arrange the four cinematic storyboard frames in the proven narrative order: Problem → Discovery → Solution → Result.',
                frames: [
                    {
                        id: 'problem',
                        step: 1,
                        name: 'Problem',
                        icon: 'fa-solid fa-triangle-exclamation',
                        desc: 'Customer struggles with outdated, invisible marketing.',
                        visual: '🌧️ Frustrated brand owner with falling sales chart',
                    },
                    {
                        id: 'discovery',
                        step: 2,
                        name: 'Discovery',
                        icon: 'fa-solid fa-lightbulb',
                        desc: 'Customer discovers DigiBoost’s cinematic growth system.',
                        visual: '✨ Golden lightbulb turns on, revealing high-impact blueprint',
                    },
                    {
                        id: 'solution',
                        step: 3,
                        name: 'Solution',
                        icon: 'fa-solid fa-wand-magic-sparkles',
                        desc: 'Launches stunning 3D commercial & omnichannel ad push.',
                        visual: '🎬 Cinema camera rolling dynamic 3D commercial',
                    },
                    {
                        id: 'result',
                        step: 4,
                        name: 'Result',
                        icon: 'fa-solid fa-trophy',
                        desc: 'Brand doubles revenue, capturing industry dominance.',
                        visual: '👑 Smiling founder wearing crown with 5x revenue trophy',
                    },
                ],
            },
            {
                key: 'choose-the-shot',
                name: 'Choose the Shot',
                type: 'cinematic-shot',
                prompt: 'The client wants to evoke raw empathy and heartfelt connection in the hero ad. Which camera shot communicates this best?',
                options: [
                    {
                        id: 'a',
                        title: 'Wide Establishing Shot',
                        lens: '16mm Wide Angle',
                        desc: 'Shows distant city buildings from far away.',
                        previewIcon: 'fa-solid fa-city',
                        correct: false,
                        feedback: 'Too distant — establishing shots set the scene, but fail to build emotional intimacy.'
                    },
                    {
                        id: 'b',
                        title: 'Close-Up Emotional Portrait',
                        lens: '85mm f/1.4 Prime',
                        desc: 'Focuses deeply on the customer’s eyes and authentic expression.',
                        previewIcon: 'fa-solid fa-face-smile',
                        correct: true,
                        feedback: 'Perfect! Close-ups trigger mirror neurons and create immediate viewer empathy.'
                    },
                    {
                        id: 'c',
                        title: 'Overhead Drone Shot',
                        lens: '24mm Aerial',
                        desc: 'High-altitude bird’s-eye view of empty parking lot.',
                        previewIcon: 'fa-solid fa-plane',
                        correct: false,
                        feedback: 'Too impersonal — aerial shots give scale, not emotional depth.'
                    },
                    {
                        id: 'd',
                        title: 'Static Product Packshot',
                        lens: '50mm Macro',
                        desc: 'Cardboard box sitting on a dark shelf without humans.',
                        previewIcon: 'fa-solid fa-box',
                        correct: false,
                        feedback: 'Too sterile — people connect with humans, not inanimate boxes.'
                    },
                ],
            },
        ],
    },
    {
        id: 'influencer',
        name: 'Influencer Marketing',
        title: 'The Kingdom of Influence',
        icon: 'fa-solid fa-hashtag',
        gem: 'Influence Gem',
        gemColor: '#ff8fd6',
        playerTitle: 'Trend Maker',
        message: "Your audience is already listening. Let's find the right voice.",
        puzzles: [
            {
                key: 'choose-your-influencer',
                name: 'Choose Your Influencer',
                type: 'single-card',
                prompt: 'A boutique streetwear brand needs a creator partner. High relevance and engaged niche beat vanity follower counts.',
                options: [
                    {
                        id: 'c1',
                        name: 'Mega Celeb "Famous Dave"',
                        followers: '5.2 Million Followers',
                        engagement: '0.4% Engagement',
                        niche: 'Generic Comedy / Memes',
                        badge: 'Vanity Numbers',
                        desc: 'Massive audience but zero interest in streetwear fashion.',
                        correct: false,
                    },
                    {
                        id: 'c2',
                        name: 'Streetwear Curator "Maya Kicks"',
                        followers: '42,000 Followers',
                        engagement: '14.8% Engagement',
                        niche: 'Sneakers, Streetwear & Drops',
                        badge: 'High-Converting Niche',
                        desc: 'Hyper-engaged community where 92% buy recommended sneakers.',
                        correct: true,
                    },
                    {
                        id: 'c3',
                        name: 'Random Viral Page',
                        followers: '820,000 Followers',
                        engagement: '1.1% Engagement',
                        niche: 'Funny Pets & Fails',
                        badge: 'Unrelated Audience',
                        desc: 'Audience looks for pet videos, not limited-edition footwear.',
                        correct: false,
                    },
                    {
                        id: 'c4',
                        name: 'Inactive Influencer',
                        followers: '150,000 Followers',
                        engagement: '0.1% Engagement',
                        niche: 'Former Travel Vlogger',
                        badge: 'Dead Account',
                        desc: 'Hasn’t posted in 18 months, algorithmic reach is gone.',
                        correct: false,
                    },
                ],
            },
            {
                key: 'match-the-audience',
                name: 'Match the Audience',
                type: 'match-pairs',
                prompt: 'Match each creator with the target audience they authentically influence (Tap or Drag).',
                left: [
                    { id: 'creator-fashion', label: 'Streetwear Stylist', icon: 'fa-solid fa-shirt' },
                    { id: 'creator-gaming', label: 'Pro Esports Streamer', icon: 'fa-solid fa-gamepad' },
                    { id: 'creator-food', label: 'Artisan Foodie Vlogger', icon: 'fa-solid fa-utensils' },
                ],
                right: [
                    { id: 'aud-gaming', label: 'Competitive Gamers & Techies', matches: 'creator-gaming', icon: 'fa-solid fa-headset' },
                    { id: 'aud-food', label: 'Foodies & Home Chefs', matches: 'creator-food', icon: 'fa-solid fa-bowl-food' },
                    { id: 'aud-fashion', label: 'Sneakerheads & Fashionistas', matches: 'creator-fashion', icon: 'fa-solid fa-vest-patches' },
                ],
            },
        ],
    },
    {
        id: 'seo',
        name: 'SEO Optimization',
        title: 'The Kingdom of Search',
        icon: 'fa-solid fa-magnifying-glass',
        gem: 'Search Gem',
        gemColor: '#00c6ff',
        playerTitle: 'Search Wizard',
        message: "Being great isn't enough if nobody finds you. Let's put your brand where people search.",
        puzzles: [
            {
                key: 'find-the-keyword',
                name: 'Find the Keyword',
                type: 'single-card',
                prompt: 'Which search phrase shows the strongest intent to immediately buy from a local bakery?',
                options: [
                    {
                        id: 'k1',
                        query: '"history of bread making in ancient Egypt"',
                        intent: 'Informational (0% Intent)',
                        desc: 'School student researching history project.',
                        correct: false,
                    },
                    {
                        id: 'k2',
                        query: '"best artisan bakery near me open now"',
                        intent: 'High Commercial / Local Purchase Intent',
                        desc: 'Hungry local customer holding a wallet, searching for immediate purchase.',
                        correct: true,
                    },
                    {
                        id: 'k3',
                        query: '"how to bake sourdough bread at home"',
                        intent: 'DIY / Informational',
                        desc: 'User wants to make bread themselves, not purchase.',
                        correct: false,
                    },
                    {
                        id: 'k4',
                        query: '"bread rolls images free download"',
                        intent: 'Asset Search',
                        desc: 'Graphic designer looking for stock pictures.',
                        correct: false,
                    },
                ],
            },
            {
                key: 'climb-the-rankings',
                name: 'Climb the Rankings',
                type: 'search-tower',
                prompt: 'Select the 3 legitimate optimizations that catapult a website to Rank #1 on DigiSearch!',
                targetRank: 1,
                startRank: 12,
                options: [
                    {
                        id: 'opt1',
                        label: 'Lightning Mobile Speed & Core Web Vitals',
                        badge: 'Technical SEO',
                        correct: true,
                        rankImpact: -4,
                        tip: 'Google rewards instant page loads and responsive mobile layouts.'
                    },
                    {
                        id: 'opt2',
                        label: 'Original, High-Value Content Matching Search Intent',
                        badge: 'On-Page SEO',
                        correct: true,
                        rankImpact: -4,
                        tip: 'Comprehensive, helpful answers earn top authority rankings.'
                    },
                    {
                        id: 'opt3',
                        label: 'Optimized Title Tags, Meta Descriptions & Schema',
                        badge: 'Structure SEO',
                        correct: true,
                        rankImpact: -3,
                        tip: 'Helps search engine crawlers understand and feature your pages.'
                    },
                    {
                        id: 'opt4',
                        label: 'Hidden White-on-White Keyword Stuffing',
                        badge: 'Black-Hat Trap',
                        correct: false,
                        rankImpact: +5,
                        tip: 'Search algorithms instantly penalize hidden keyword stuffing!'
                    },
                    {
                        id: 'opt5',
                        label: 'Buying 50,000 Spammy Backlinks from Link Farms',
                        badge: 'Spam Penalty',
                        correct: false,
                        rankImpact: +5,
                        tip: 'Triggers Google algorithmic penalty and deranks site.'
                    },
                ],
            },
        ],
    },
    {
        id: 'ai',
        name: 'AI Video Production',
        title: 'The Kingdom of AI',
        icon: 'fa-solid fa-robot',
        gem: 'AI Gem',
        gemColor: '#f5c542',
        playerTitle: 'AI Visionary',
        message: 'Imagine producing your next campaign like this.',
        puzzles: [
            {
                key: 'prompt-the-story',
                name: 'Prompt the Story',
                type: 'ai-prompt-studio',
                prompt: 'Engineer your AI video prompt by selecting one element from each category.',
                categories: [
                    {
                        key: 'subject',
                        label: '1. Subject',
                        options: ['A Royal Brand Explorer', 'A Rising Founder', 'A Cyber Cyber-Lion Mascot']
                    },
                    {
                        key: 'style',
                        label: '2. Visual Style',
                        options: ['8K Cinematic Film', 'Cyberpunk Neon Anime', 'Hyper-Realistic Commercial']
                    },
                    {
                        key: 'voice',
                        label: '3. Voiceover Tone',
                        options: ['Inspiring Royal Narrator', 'Bold TVC Announcer', 'Visionary Guide']
                    },
                    {
                        key: 'scene',
                        label: '4. Environment',
                        options: ['A Golden Throne Room', 'A High-Tech Hologram Studio', 'Sunrise Over Digital Kingdom']
                    },
                ],
                previewTemplate: (sel) =>
                    `Prompt: "${sel.subject}, captured in stunning ${sel.style.toLowerCase()}, voiced by an ${sel.voice.toLowerCase()}, illuminated by ${sel.scene.toLowerCase()}."`,
            },
            {
                key: 'direct-your-ai-avatar',
                name: 'Direct Your AI Avatar',
                type: 'ai-avatar-director',
                prompt: 'Direct the AI avatar’s final commercial take. Select expression, delivery, and set.',
                categories: [
                    {
                        key: 'expression',
                        label: 'Avatar Expression',
                        options: ['Commanding Royal Smile', 'Focused Determination', 'Warm & Welcoming']
                    },
                    {
                        key: 'voice',
                        label: 'Voice Tone',
                        options: ['Bold & Authoritative', 'Smooth & Magnetic', 'Energetic & Inspiring']
                    },
                    {
                        key: 'background',
                        label: 'Virtual Set',
                        options: ['DigiBoost Cyber Throne', 'Holographic Studio', 'Infinite Horizon Balcony']
                    },
                ],
                dialogueTemplate: (sel) =>
                    `"Welcome to DigiBoost. Together, we don't just market brands — we make them impossible to ignore."`,
            },
        ],
    },
];

export const RESULT_TITLES = KINGDOMS.reduce((acc, k) => {
    acc[k.id] = k.playerTitle;
    return acc;
}, {});
