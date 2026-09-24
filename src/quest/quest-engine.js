import { KINGDOMS, SCORING, FAST_SOLVE_MS } from './quest-data.js';
import { sound } from './quest-audio.js';
import kingSearchingImg from '../assets/avatars/king_searching.jpg';
import queenSearchingImg from '../assets/avatars/queen_searching.jpg';
import kingCrownedImg from '../assets/avatars/king_crowned.jpg';
import queenCrownedImg from '../assets/avatars/queen_crowned.jpg';

const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const BEST_SCORE_KEY = 'digiboost-crown-quest-best-score';

const NODE_POSITIONS = [
    { x: 18, y: 10 },
    { x: 82, y: 10 },
    { x: 82, y: 42 },
    { x: 18, y: 42 },
    { x: 18, y: 74 },
    { x: 82, y: 74 },
];

export class QuestGame {
    constructor(root) {
        this.root = root;
        this.state = this.freshState();
        this._pendingWalkTo = null;
        this._selectedChip = null;
        this._selectedSlot = null;
        this._activeMatchLeft = null;
        this.companionMood = 'searching';
        this.companionSpeech = '';
        this._cleanupFns = [];
    }

    freshState() {
        return {
            avatar: null,
            playerName: '',
            screen: 'landing',
            score: 0,
            kingdomIndex: 0,
            puzzleIndex: 0,
            puzzleStartTime: 0,
            avatarNodeIndex: 0,
            avatarEntered: false,
            kingdoms: KINGDOMS.map((k, i) => ({
                ...k,
                locked: i !== 0,
                completed: false,
                mistakes: 0,
            })),
        };
    }

    getAvatarSearchingImg() {
        return this.state.avatar === 'queen' ? queenSearchingImg : kingSearchingImg;
    }

    getAvatarCrownedImg() {
        return this.state.avatar === 'queen' ? queenCrownedImg : kingCrownedImg;
    }

    getMoodEmoji() {
        switch (this.companionMood) {
            case 'thinking': return '🤔';
            case 'oops': return '😅';
            case 'cheer': return '🎉';
            default: return '🔍';
        }
    }

    setCompanionMood(mood, speech) {
        this.companionMood = mood;
        this.companionSpeech = speech;
        const banner = qs('#quest-companion-banner', this.root);
        const textEl = qs('#quest-companion-text', this.root);
        const avatarWrap = qs('.quest-companion-avatar-wrap', this.root);
        const emojiEl = qs('.quest-mood-emoji', this.root);
        if (textEl) textEl.textContent = `"${speech}"`;
        if (emojiEl) emojiEl.textContent = this.getMoodEmoji();
        if (avatarWrap) {
            avatarWrap.className = `quest-companion-avatar-wrap mood-${mood}`;
        }
    }

    avatarIconClass() {
        return this.state.avatar === 'queen' ? 'fa-chess-queen' : 'fa-chess-king';
    }

    getBestScore() {
        try {
            return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
        } catch (e) {
            return 0;
        }
    }

    saveBestScore(score) {
        try {
            const best = this.getBestScore();
            if (score > best) localStorage.setItem(BEST_SCORE_KEY, String(score));
        } catch (e) {}
    }

    init() {
        this.render();
    }

    addScore(delta) {
        this.state.score = Math.max(0, this.state.score + delta);
        const scoreEl = qs('.quest-score-value', this.root);
        if (scoreEl) {
            scoreEl.textContent = this.state.score;
            scoreEl.classList.remove('quest-score-pop');
            void scoreEl.offsetWidth;
            scoreEl.classList.add('quest-score-pop');
        }
    }

    get currentKingdom() {
        return this.state.kingdoms[this.state.kingdomIndex];
    }

    get currentPuzzle() {
        return this.currentKingdom.puzzles[this.state.puzzleIndex];
    }

    getDefaultTrialSpeech() {
        const k = this.currentKingdom;
        if (!k) return "My crown awaits in the royal vault! Let's conquer this challenge.";
        if (k.id === 'smm') return "We need an unforgettable identity to command the digital realm. Let's match the brand elements!";
        if (k.id === 'leadgen') return "A true kingdom thrives on loyal buyers, not random noise. Let's build a qualified pipeline!";
        if (k.id === 'tvc') return "Every great empire has a compelling story. Let's direct a cinematic masterpiece!";
        if (k.id === 'influencer') return "Real influence comes from genuine trust and passionate communities. Let's find our true allies!";
        if (k.id === 'seo') return "Even the greatest palace is useless if nobody can find it. Let's conquer the search rankings!";
        if (k.id === 'ai') return "The future belongs to visionary rulers using AI innovation. Let's synthesize our digital vision!";
        return "Lead the way, ruler! Each puzzle brings us closer to the DigiBoost Crown.";
    }

    registerMistake(flashTarget, customMsg = null) {
        sound.playError();
        this.addScore(SCORING.WRONG);
        this.currentKingdom.mistakes += 1;
        const msg = customMsg || "Careful, ruler! Low-impact moves cost our treasury. Let's rethink!";
        this.setCompanionMood('oops', msg);
        if (flashTarget) {
            flashTarget.classList.add('quest-shake', 'quest-error-border');
            setTimeout(() => {
                flashTarget.classList.remove('quest-shake', 'quest-error-border');
            }, 500);
        }
        if (customMsg) {
            this.showToast(customMsg, 'error');
        }
    }

    registerSuccess(customDelay = 900) {
        sound.playCorrect();
        this.addScore(SCORING.CORRECT);
        this.setCompanionMood('cheer', "Brilliant strategy! Another step closer to our golden crown!");
        if (Date.now() - this.state.puzzleStartTime < FAST_SOLVE_MS) {
            this.addScore(SCORING.FAST);
            this.showToast('⚡ Fast Completion Bonus! +50 pts', 'bonus');
        }
        const panel = qs('.quest-puzzle-panel', this.root);
        if (panel) panel.classList.add('quest-solved-flash');
        this.celebrateAvatar();
        setTimeout(() => this.advanceAfterPuzzle(), customDelay);
    }

    celebrateAvatar() {
        const badge = qs('.quest-topbar-avatar', this.root);
        if (!badge) return;
        badge.classList.add('quest-avatar-celebrate');
        setTimeout(() => badge.classList.remove('quest-avatar-celebrate'), 800);
    }

    showToast(message, type = 'info') {
        const existing = qs('.quest-toast', this.root);
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = `quest-toast quest-toast--${type}`;
        toast.innerHTML = message;
        this.root.appendChild(toast);
        setTimeout(() => toast.classList.add('visible'), 20);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 400);
        }, 2200);
    }

    advanceAfterPuzzle() {
        const kingdom = this.currentKingdom;
        if (this.state.puzzleIndex === 0) {
            this.state.puzzleIndex = 1;
            this.state.puzzleStartTime = Date.now();
            this.renderPuzzle();
            return;
        }

        // Both puzzles solved
        if (kingdom.mistakes === 0) {
            this.addScore(SCORING.NO_MISTAKES);
            this.showToast('🌟 Flawless Kingdom Bonus! +25 pts', 'bonus');
        }
        kingdom.completed = true;
        const nextIndex = this.state.kingdomIndex + 1;
        if (nextIndex < this.state.kingdoms.length) {
            this.state.kingdoms[nextIndex].locked = false;
        }
        this.renderKingdomComplete();
    }

    // Top Navigation & Progress Bar
    topBar() {
        const gems = this.state.kingdoms.map(k =>
            `<span class="quest-gem-slot ${k.completed ? 'filled' : ''}" style="--gem-color:${k.gemColor}" title="${k.gem}: ${k.completed ? 'Earned' : (k.locked ? 'Locked' : 'Available')}">
                <i class="fa-solid fa-gem"></i>
            </span>`
        ).join('');

        const avatarBadge = this.state.avatar
            ? `<div class="quest-topbar-avatar" title="Your Ruler: ${this.state.avatar}">
                 <img src="${this.getAvatarSearchingImg()}" alt="${this.state.avatar}" class="quest-topbar-avatar-img" />
               </div>`
            : '';

        const soundIcon = sound.isMuted() ? 'fa-volume-xmark' : 'fa-volume-high';

        return `
            <div class="quest-topbar">
                <a href="../" class="quest-home-link" aria-label="Back to DigiBoost Solutions">
                    <i class="fa-solid fa-arrow-left"></i> <span>DigiBoost</span>
                </a>
                <div class="quest-topbar-center">
                    ${avatarBadge}
                    <div class="quest-gem-track" title="Crown Gems Progress">${gems}</div>
                </div>
                <div class="quest-topbar-right">
                    <button class="quest-sound-btn" id="quest-sound-toggle" aria-label="Toggle Sound" title="Sound Effects">
                        <i class="fa-solid ${soundIcon}"></i>
                    </button>
                    <div class="quest-score" title="Your Royal Score">
                        <i class="fa-solid fa-star"></i> <span class="quest-score-value">${this.state.score}</span>
                    </div>
                </div>
            </div>
        `;
    }

    bindTopBarEvents() {
        const soundBtn = qs('#quest-sound-toggle', this.root);
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const muted = sound.toggleMute();
                soundBtn.innerHTML = `<i class="fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}"></i>`;
                this.showToast(muted ? 'Sound Muted' : 'Sound Enabled', 'info');
            });
        }
    }

    render() {
        // Clear any lingering drag state or listeners
        this._selectedChip = null;
        this._selectedSlot = null;
        this._activeMatchLeft = null;

        switch (this.state.screen) {
            case 'landing': return this.renderLanding();
            case 'avatar': return this.renderAvatar();
            case 'map': return this.renderMap();
            case 'kingdomIntro': return this.renderKingdomIntro();
            case 'puzzle': return this.renderPuzzle();
            case 'kingdomComplete': return this.renderKingdomComplete();
            case 'ceremony': return this.renderCeremony();
            case 'result': return this.renderResult();
            default: return this.renderLanding();
        }
    }

    renderLanding() {
        const best = this.getBestScore();
        this.root.innerHTML = `
            <section class="quest-screen quest-landing">
                <a href="../" class="quest-home-link quest-home-link--floating">
                    <i class="fa-solid fa-arrow-left"></i> DigiBoost Solutions
                </a>
                <div class="quest-badge-crown"><i class="fa-solid fa-crown"></i></div>
                <span class="quest-eyebrow">Interactive Marketing Experience</span>
                <h1 class="quest-title">The DigiBoost <span class="quest-gold">Crown Quest</span></h1>
                <p class="quest-tagline">"Every great brand needs a ruler."</p>
                <p class="quest-desc">
                    Master six digital marketing realms. Solve twelve strategic challenges.
                    Collect the royal gems and forge the legendary DigiBoost Crown.
                </p>
                ${best > 0 ? `<div class="quest-best-badge"><i class="fa-solid fa-trophy"></i> Best Score: <strong>${best} pts</strong></div>` : ''}
                <button class="quest-btn quest-btn-primary quest-btn-glow" id="quest-begin">
                    Begin Your Quest <i class="fa-solid fa-arrow-right"></i>
                </button>
                <div class="quest-realm-preview">
                    ${KINGDOMS.map(k => `
                        <div class="quest-realm-chip" style="--chip-accent:${k.gemColor}">
                            <i class="${k.icon}"></i>
                            <span>${k.name}</span>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
        qs('#quest-begin', this.root).addEventListener('click', () => {
            sound.playClick();
            this.state.screen = 'avatar';
            this.render();
        });
    }

    renderAvatar() {
        this.root.innerHTML = `
            <section class="quest-screen quest-avatar">
                <a href="../" class="quest-home-link quest-home-link--floating">
                    <i class="fa-solid fa-arrow-left"></i> DigiBoost Solutions
                </a>
                <span class="quest-eyebrow">Royal Initiation</span>
                <h2 class="quest-h2">Choose Your Ruler</h2>
                <p class="quest-desc">
                    Your crown was lost across six realms. Choose your monarch to embark on the quest and forge the DigiBoost Crown!
                </p>
                <div class="quest-avatar-grid">
                    <button class="quest-avatar-card ${this.state.avatar === 'king' ? 'selected' : ''}" data-avatar="king">
                        <div class="quest-avatar-portrait-wrap">
                            <img src="${kingSearchingImg}" alt="King searching for crown" class="quest-avatar-portrait-img" />
                            <span class="quest-avatar-quest-tag"><i class="fa-solid fa-magnifying-glass"></i> Searching for Crown</span>
                        </div>
                        <span class="quest-avatar-name">The King</span>
                        <span class="quest-avatar-sub">Scouting with his brass spyglass for the lost crown</span>
                    </button>
                    <button class="quest-avatar-card ${this.state.avatar === 'queen' ? 'selected' : ''}" data-avatar="queen">
                        <div class="quest-avatar-portrait-wrap">
                            <img src="${queenSearchingImg}" alt="Queen searching for crown" class="quest-avatar-portrait-img" />
                            <span class="quest-avatar-quest-tag"><i class="fa-solid fa-compass"></i> Searching for Crown</span>
                        </div>
                        <span class="quest-avatar-name">The Queen</span>
                        <span class="quest-avatar-sub">Navigating with her golden compass to forge the crown</span>
                    </button>
                </div>
                <button class="quest-btn quest-btn-primary" id="quest-enter-map" ${!this.state.avatar ? 'disabled' : ''}>
                    Embark on the Quest <i class="fa-solid fa-arrow-right"></i>
                </button>
            </section>
        `;

        const cards = qsa('.quest-avatar-card', this.root);
        const enterBtn = qs('#quest-enter-map', this.root);

        cards.forEach(card => {
            card.addEventListener('click', () => {
                sound.playSelect();
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.state.avatar = card.dataset.avatar;
                enterBtn.disabled = false;
            });
        });

        enterBtn.addEventListener('click', () => {
            sound.playClick();
            this.state.screen = 'map';
            this.render();
        });
    }

    renderMap() {
        const nodesHtml = this.state.kingdoms.map((k, i) => {
            let stateClass = 'locked';
            if (k.completed) stateClass = 'completed';
            else if (!k.locked) stateClass = 'unlocked';
            const pos = NODE_POSITIONS[i];
            return `
                <button class="quest-map-node ${stateClass}" data-index="${i}" style="left:${pos.x}%; top:${pos.y}%; --gem-color:${k.gemColor};" ${k.locked ? 'disabled' : ''}>
                    <div class="quest-map-node-icon">
                        <i class="${k.completed ? 'fa-solid fa-check' : k.icon}"></i>
                    </div>
                    <div class="quest-map-node-info">
                        <span class="quest-map-node-name">${k.name}</span>
                        <span class="quest-map-node-gem">${k.completed ? `👑 ${k.gem}` : k.gem}</span>
                    </div>
                    <div class="quest-map-node-status">
                        ${k.completed ? '<span class="status-done">Mastered</span>' : k.locked ? '<i class="fa-solid fa-lock"></i>' : '<span class="status-enter">Enter <i class="fa-solid fa-play"></i></span>'}
                    </div>
                </button>
            `;
        }).join('');

        const points = NODE_POSITIONS.map(p => `${p.x},${p.y}`).join(' ');
        const allDone = this.state.kingdoms.every(k => k.completed);

        const completedCount = this.state.kingdoms.filter(k => k.completed).length;

        this.root.innerHTML = `
            <section class="quest-screen quest-map">
                ${this.topBar()}
                <div class="quest-map-header">
                    <span class="quest-eyebrow">The Grand Realm</span>
                    <h2 class="quest-h2">The Six Kingdoms of Digital Growth</h2>
                    <div class="quest-map-quest-status">
                        <div class="quest-status-avatar">
                            <img src="${this.getAvatarSearchingImg()}" alt="${this.state.avatar}" />
                            <span class="quest-status-lens"><i class="fa-solid fa-magnifying-glass"></i></span>
                        </div>
                        <div class="quest-status-speech">
                            <strong>${this.state.avatar === 'queen' ? 'The Queen' : 'The King'}:</strong>
                            <span>"Searching for my lost crown... We've recovered ${completedCount} of 6 crown gems! Onward!"</span>
                        </div>
                    </div>
                </div>
                <div class="quest-path-map" id="quest-path-map">
                    <svg class="quest-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline points="${points}" class="quest-path-line-bg"></polyline>
                        <polyline points="${points}" class="quest-path-line-active"></polyline>
                    </svg>
                    ${nodesHtml}
                    <div class="quest-map-character" id="quest-map-character">
                        <div class="quest-map-character-inner">
                            <img src="${this.getAvatarSearchingImg()}" alt="${this.state.avatar}" class="quest-map-avatar-img" />
                            <span class="quest-map-character-sparkle"><i class="fa-solid fa-sparkles"></i></span>
                        </div>
                    </div>
                </div>
                <div class="quest-map-footer">
                    ${allDone ? `
                        <button class="quest-btn quest-btn-gold quest-btn-glow" id="quest-goto-ceremony">
                            Assemble the DigiBoost Crown <i class="fa-solid fa-crown"></i>
                        </button>
                    ` : `
                        <div class="quest-map-hint">
                            <i class="fa-solid fa-circle-info"></i> Tap on any unlocked kingdom above to enter its trial.
                        </div>
                    `}
                </div>
            </section>
        `;

        this.bindTopBarEvents();

        qsa('.quest-map-node:not([disabled])', this.root).forEach(btn => {
            btn.addEventListener('click', () => {
                sound.playClick();
                this.state.kingdomIndex = Number(btn.dataset.index);
                this.state.puzzleIndex = 0;
                this.state.screen = 'kingdomIntro';
                this.render();
            });
        });

        const ceremonyBtn = qs('#quest-goto-ceremony', this.root);
        if (ceremonyBtn) {
            ceremonyBtn.addEventListener('click', () => {
                sound.playClick();
                this.state.screen = 'ceremony';
                this.render();
            });
        }

        this.positionAvatarOnMap();
    }

    positionAvatarOnMap() {
        const el = qs('#quest-map-character', this.root);
        if (!el) return;
        const lastIndex = NODE_POSITIONS.length - 1;

        const setPosition = (pos) => {
            el.style.left = pos.x + '%';
            el.style.top = pos.y + '%';
        };

        if (!this.state.avatarEntered) {
            this.state.avatarEntered = true;
            this.state.avatarNodeIndex = 0;
            setPosition(NODE_POSITIONS[0]);
            return;
        }

        if (this._pendingWalkTo !== null && this._pendingWalkTo !== this.state.avatarNodeIndex) {
            const target = Math.min(this._pendingWalkTo, lastIndex);
            this._pendingWalkTo = null;
            el.classList.add('walking');
            setPosition(NODE_POSITIONS[target]);
            this.state.avatarNodeIndex = target;
            setTimeout(() => el.classList.remove('walking'), 1200);
            return;
        }

        const resting = NODE_POSITIONS[Math.min(this.state.avatarNodeIndex, lastIndex)];
        setPosition(resting);
    }

    renderKingdomIntro() {
        const k = this.currentKingdom;
        this.root.innerHTML = `
            <section class="quest-screen quest-kingdom-intro">
                ${this.topBar()}
                <div class="quest-kingdom-emblem" style="--gem-color:${k.gemColor}">
                    <div class="quest-kingdom-emblem-ring"></div>
                    <i class="${k.icon}"></i>
                </div>
                <span class="quest-eyebrow">${k.title}</span>
                <h2 class="quest-h2">${k.name}</h2>
                <p class="quest-desc">
                    Solve both trials to prove your mastery of <strong>${k.name}</strong> and forge the <strong>${k.gem}</strong>.
                </p>
                <div class="quest-intro-gem-preview" style="--gem-color:${k.gemColor}">
                    <i class="fa-solid fa-gem"></i> Reward: ${k.gem}
                </div>
                <div class="quest-intro-actions">
                    <button class="quest-btn quest-btn-primary quest-btn-glow" id="quest-enter-realm">
                        Enter Realm <i class="fa-solid fa-arrow-right"></i>
                    </button>
                    <button class="quest-btn quest-btn-ghost" id="quest-back-map">
                        <i class="fa-solid fa-map"></i> Return to Map
                    </button>
                </div>
            </section>
        `;
        this.bindTopBarEvents();

        qs('#quest-enter-realm', this.root).addEventListener('click', () => {
            sound.playClick();
            this.state.puzzleStartTime = Date.now();
            this.state.screen = 'puzzle';
            this.render();
        });
        qs('#quest-back-map', this.root).addEventListener('click', () => {
            sound.playClick();
            this.state.screen = 'map';
            this.render();
        });
    }

    renderPuzzleShell(innerHtml) {
        const k = this.currentKingdom;
        const p = this.currentPuzzle;
        this.root.innerHTML = `
            <section class="quest-screen quest-puzzle-screen">
                ${this.topBar()}
                <div class="quest-puzzle-panel" style="--gem-color:${k.gemColor}">
                    <div class="quest-puzzle-header">
                        <div class="quest-puzzle-breadcrumbs">
                            <span>${k.name}</span> &bull; <span>Trial ${this.state.puzzleIndex + 1} of 2</span>
                        </div>
                        <div class="quest-companion-banner" id="quest-companion-banner">
                            <div class="quest-companion-avatar-wrap mood-${this.companionMood}">
                                <img src="${this.getAvatarSearchingImg()}" alt="${this.state.avatar}" class="quest-companion-avatar-img" />
                                <span class="quest-mood-emoji">${this.getMoodEmoji()}</span>
                            </div>
                            <div class="quest-companion-dialogue-wrap">
                                <span class="quest-companion-speaker">${this.state.avatar === 'queen' ? 'The Queen' : 'The King'} (Seeking Crown):</span>
                                <span class="quest-companion-dialogue" id="quest-companion-text">"${this.companionSpeech || this.getDefaultTrialSpeech()}"</span>
                            </div>
                        </div>
                        <h2 class="quest-h2">${p.name}</h2>
                        <p class="quest-desc">${p.prompt}</p>
                    </div>
                    <div class="quest-puzzle-body">${innerHtml}</div>
                </div>
            </section>
        `;
        this.bindTopBarEvents();
    }

    renderPuzzle() {
        this.companionMood = 'searching';
        this.companionSpeech = '';
        this.state.puzzleStartTime = Date.now();
        const p = this.currentPuzzle;

        switch (p.type) {
            case 'brand-board': return this.renderBrandBoard(p);
            case 'social-fixer': return this.renderSocialFixer(p);
            case 'funnel': return this.renderFunnel(p);
            case 'radar': return this.renderRadar(p);
            case 'storyboard': return this.renderStoryboard(p);
            case 'cinematic-shot': return this.renderCinematicShot(p);
            case 'single-card': return this.renderSingleCard(p);
            case 'match-pairs': return this.renderMatchPairs(p);
            case 'search-tower': return this.renderSearchTower(p);
            case 'ai-prompt-studio': return this.renderAIPromptStudio(p);
            case 'ai-avatar-director': return this.renderAIAvatarDirector(p);
            default: return this.renderBrandBoard(p);
        }
    }

    // ==========================================
    // 01 SMM: Trial 1 - Brand Identity Board
    // Both Tap-to-Place AND Smooth Drag & Drop
    // ==========================================
    renderBrandBoard(p) {
        const chips = shuffle(p.chips);
        const totalSlots = p.slots.length;
        let lockedCount = 0;

        this.renderPuzzleShell(`
            <div class="quest-brand-instructions">
                <span class="quest-instruction-tag"><i class="fa-solid fa-hand-pointer"></i> Tap or Drag</span>
                <span>Select an element below, then place it into its matching board slot.</span>
            </div>

            <div class="quest-brand-board">
                ${p.slots.map(s => `
                    <div class="quest-brand-slot" data-slot-id="${s.id}" data-category="${s.category}">
                        <div class="quest-brand-slot-header">
                            <i class="${s.icon}"></i>
                            <span>${s.label}</span>
                        </div>
                        <div class="quest-brand-slot-content">
                            <span class="quest-slot-placeholder">Empty Slot</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="quest-brand-pool" id="quest-brand-pool">
                ${chips.map(c => {
                    let previewContent = c.label;
                    if (c.swatches) {
                        previewContent = `
                            <span class="quest-swatches-preview">
                                ${c.swatches.map(col => `<span style="background:${col}"></span>`).join('')}
                            </span>
                            <span class="quest-chip-text">${c.label}</span>
                        `;
                    } else if (c.badge) {
                        previewContent = `<span class="quest-badge-preview">${c.badge}</span>`;
                    }
                    return `
                        <div class="quest-chip quest-brand-chip" 
                             data-id="${c.id}" 
                             data-category="${c.category}" 
                             data-correct="${c.correct}"
                             tabindex="0"
                             role="button">
                            ${previewContent}
                        </div>
                    `;
                }).join('')}
            </div>
        `);

        const slots = qsa('.quest-brand-slot', this.root);
        const pool = qs('#quest-brand-pool', this.root);
        let selectedChip = null;

        // Try placing chip into slot
        const tryPlaceChipInSlot = (chip, slot) => {
            if (!chip || !slot || slot.classList.contains('locked')) return;

            const isMatchingCategory = slot.dataset.category === chip.dataset.category;
            const isCorrect = chip.dataset.correct === 'true';

            if (!isMatchingCategory) {
                this.registerMistake(slot, `That goes in the ${chip.dataset.category.toUpperCase()} slot!`);
                return;
            }

            if (isCorrect) {
                sound.playDrop();
                slot.classList.add('locked', 'correct');
                const slotContent = qs('.quest-brand-slot-content', slot);
                slotContent.innerHTML = chip.innerHTML;
                chip.classList.add('used');
                chip.style.display = 'none';
                lockedCount += 1;
                this.showToast(`✓ ${slot.dataset.category.toUpperCase()} Locked In!`, 'success');

                if (selectedChip === chip) {
                    chip.classList.remove('selected');
                    selectedChip = null;
                }

                if (lockedCount === totalSlots) {
                    slots.forEach(s => s.classList.add('quest-board-unlocked'));
                    this.registerSuccess(1200);
                }
            } else {
                this.registerMistake(chip, 'Incorrect brand piece — try the other option!');
                chip.classList.add('quest-shake');
                setTimeout(() => chip.classList.remove('quest-shake'), 400);
            }
        };

        // Click-to-Place handlers
        qsa('.quest-brand-chip', this.root).forEach(chip => {
            chip.addEventListener('click', () => {
                if (chip.classList.contains('used')) return;
                sound.playClick();
                if (selectedChip === chip) {
                    chip.classList.remove('selected');
                    selectedChip = null;
                    return;
                }
                qsa('.quest-brand-chip', this.root).forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
                selectedChip = chip;
            });
        });

        slots.forEach(slot => {
            slot.addEventListener('click', () => {
                if (slot.classList.contains('locked')) return;
                if (selectedChip) {
                    tryPlaceChipInSlot(selectedChip, slot);
                } else {
                    slot.classList.add('slot-pulse');
                    setTimeout(() => slot.classList.remove('slot-pulse'), 400);
                    this.showToast(`Tap an element below to place into ${slot.dataset.category.toUpperCase()}`, 'info');
                }
            });
        });

        // Pointer-based Drag & Drop with Bounding Box Collision
        qsa('.quest-brand-chip', this.root).forEach(chip => {
            let isDragging = false;
            let startX, startY;
            let currentX, currentY;
            let ghostEl = null;

            const onPointerDown = (e) => {
                if (chip.classList.contains('used')) return;
                startX = e.clientX;
                startY = e.clientY;

                const onPointerMove = (ev) => {
                    const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
                    if (!isDragging && dist > 5) {
                        isDragging = true;
                        chip.classList.add('is-drag-origin');
                        ghostEl = chip.cloneNode(true);
                        ghostEl.classList.add('quest-drag-ghost');
                        ghostEl.style.position = 'fixed';
                        ghostEl.style.pointerEvents = 'none';
                        ghostEl.style.zIndex = '99999';
                        ghostEl.style.width = chip.offsetWidth + 'px';
                        ghostEl.style.height = chip.offsetHeight + 'px';
                        ghostEl.style.transform = 'translate(-50%, -50%) scale(1.05)';
                        document.body.appendChild(ghostEl);
                    }

                    if (isDragging && ghostEl) {
                        ghostEl.style.left = ev.clientX + 'px';
                        ghostEl.style.top = ev.clientY + 'px';

                        // Highlight hovering slot
                        slots.forEach(s => {
                            const rect = s.getBoundingClientRect();
                            const isOver = ev.clientX >= rect.left && ev.clientX <= rect.right &&
                                           ev.clientY >= rect.top && ev.clientY <= rect.bottom;
                            s.classList.toggle('hover-target', isOver && !s.classList.contains('locked'));
                        });
                    }
                };

                const onPointerUp = (ev) => {
                    window.removeEventListener('pointermove', onPointerMove);
                    window.removeEventListener('pointerup', onPointerUp);

                    slots.forEach(s => s.classList.remove('hover-target'));

                    if (ghostEl) {
                        ghostEl.remove();
                        ghostEl = null;
                    }
                    chip.classList.remove('is-drag-origin');

                    if (isDragging) {
                        isDragging = false;
                        // Bounding Box Collision Detection
                        const targetSlot = slots.find(s => {
                            const rect = s.getBoundingClientRect();
                            return ev.clientX >= rect.left && ev.clientX <= rect.right &&
                                   ev.clientY >= rect.top && ev.clientY <= rect.bottom;
                        });

                        if (targetSlot) {
                            tryPlaceChipInSlot(chip, targetSlot);
                        }
                    }
                };

                window.addEventListener('pointermove', onPointerMove);
                window.addEventListener('pointerup', onPointerUp);
            };

            chip.addEventListener('pointerdown', onPointerDown);
        });
    }

    // ==========================================
    // 01 SMM: Trial 2 - Social Feed Fixer
    // ==========================================
    renderSocialFixer(p) {
        const options = shuffle(p.options);
        this.renderPuzzleShell(`
            <div class="quest-social-grid">
                ${options.map(opt => `
                    <div class="quest-social-card" data-id="${opt.id}">
                        <div class="quest-social-header">
                            <div class="quest-social-avatar"><i class="fa-solid fa-user-circle"></i></div>
                            <div class="quest-social-author">
                                <span class="name">${opt.author}</span>
                                <span class="metrics">${opt.metrics}</span>
                            </div>
                        </div>
                        <div class="quest-social-hook">${opt.hook}</div>
                        <div class="quest-social-body">${opt.body}</div>
                        <div class="quest-social-cta">${opt.cta}</div>
                        <div class="quest-social-tag">${opt.status}</div>
                    </div>
                `).join('')}
            </div>
        `);

        qsa('.quest-social-card', this.root).forEach(card => {
            card.addEventListener('click', () => {
                const opt = p.options.find(o => o.id === card.dataset.id);
                if (opt.correct) {
                    card.classList.add('correct');
                    this.showToast('✓ High-converting post chosen: Hook + Value + Clear CTA!', 'success');
                    this.registerSuccess();
                } else {
                    this.registerMistake(card, 'Weak post! Lacks value, credibility, or call-to-action.');
                }
            });
        });
    }

    // ==========================================
    // 02 Lead Gen: Trial 1 - Repair the Funnel
    // ==========================================
    renderFunnel(p) {
        const stages = p.stages;
        const shuffled = shuffle(stages);
        const placed = [];

        this.renderPuzzleShell(`
            <div class="quest-funnel-container">
                <div class="quest-funnel-visual">
                    ${stages.map((s, idx) => `
                        <div class="quest-funnel-tier quest-funnel-tier-${idx + 1}" data-step="${idx}">
                            <div class="quest-tier-label">${idx + 1}. [ Tap or Place Stage ]</div>
                            <div class="quest-tier-count">--</div>
                        </div>
                    `).join('')}
                    <div class="quest-funnel-stream" id="quest-funnel-stream"></div>
                </div>

                <div class="quest-funnel-pool" id="quest-funnel-pool">
                    <p class="quest-hint"><i class="fa-solid fa-arrow-down-wide-short"></i> Tap stages in sequential order from Top (Awareness) to Bottom (Conversion):</p>
                    <div class="quest-funnel-chips">
                        ${shuffled.map(s => `
                            <button class="quest-chip quest-funnel-chip" data-id="${s.id}">
                                <i class="${s.icon}"></i> ${s.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `);

        const tiers = qsa('.quest-funnel-tier', this.root);

        qsa('.quest-funnel-chip', this.root).forEach(chip => {
            chip.addEventListener('click', () => {
                sound.playClick();
                const nextExpected = stages[placed.length];
                if (chip.dataset.id === nextExpected.id) {
                    sound.playDrop();
                    const currentTierIndex = placed.length;
                    placed.push(chip.dataset.id);

                    const tier = tiers[currentTierIndex];
                    tier.classList.add('filled');
                    qs('.quest-tier-label', tier).innerHTML = `<i class="${nextExpected.icon}"></i> ${nextExpected.label} (${nextExpected.sub})`;
                    qs('.quest-tier-count', tier).textContent = nextExpected.count;

                    chip.classList.add('used');
                    chip.disabled = true;

                    if (placed.length === stages.length) {
                        const stream = qs('#quest-funnel-stream', this.root);
                        if (stream) stream.classList.add('active');
                        this.showToast('🚀 Funnel Complete! Leads flowing smoothly.', 'success');
                        this.registerSuccess(1200);
                    }
                } else {
                    this.registerMistake(chip, `Out of order! Funnels must flow: Visitor → Interested → Lead → Customer.`);
                }
            });
        });
    }

    // ==========================================
    // 02 Lead Gen: Trial 2 - Catch the Customer
    // Live Prospect Stream / Lead Radar
    // ==========================================
    renderRadar(p) {
        let caughtCount = 0;
        const target = p.targetGoal || 3;
        const shuffled = shuffle(p.prospects);

        this.renderPuzzleShell(`
            <div class="quest-radar-wrap">
                <div class="quest-radar-statusbar">
                    <span><i class="fa-solid fa-filter"></i> High-Intent Leads Caught:</span>
                    <strong class="quest-radar-counter"><span id="quest-caught-count">0</span> / ${target}</strong>
                </div>

                <div class="quest-prospects-stream">
                    ${shuffled.map(pr => `
                        <div class="quest-prospect-card" data-id="${pr.id}" data-intent="${pr.intent}">
                            <div class="quest-prospect-icon">
                                <i class="fa-solid ${pr.intent === 'high' ? 'fa-user-check' : 'fa-user-clock'}"></i>
                            </div>
                            <div class="quest-prospect-content">
                                <span class="badge ${pr.intent === 'high' ? 'badge-high' : 'badge-low'}">${pr.badge}</span>
                                <p class="quote">${pr.text}</p>
                            </div>
                            <button class="quest-btn-catch" aria-label="Catch Prospect">
                                <i class="fa-solid fa-plus"></i> Capture
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `);

        qsa('.quest-prospect-card', this.root).forEach(card => {
            card.addEventListener('click', () => {
                if (card.classList.contains('captured') || card.classList.contains('dismissed')) return;

                const isHigh = card.dataset.intent === 'high';
                if (isHigh) {
                    sound.playDrop();
                    card.classList.add('captured');
                    caughtCount += 1;
                    const counterEl = qs('#quest-caught-count', this.root);
                    if (counterEl) counterEl.textContent = caughtCount;
                    this.showToast('🎯 Qualified Lead Secured in Pipeline! (+100 pts)', 'success');

                    if (caughtCount >= target) {
                        this.registerSuccess(1000);
                    }
                } else {
                    card.classList.add('dismissed');
                    this.registerMistake(card, 'Unqualified prospect! Casual browsers or click fraud waste budget.');
                }
            });
        });
    }

    // ==========================================
    // 03 TVC: Trial 1 - Build the Story
    // Storyboard Sequence: Problem -> Discovery -> Solution -> Result
    // ==========================================
    renderStoryboard(p) {
        const frames = p.frames;
        const shuffled = shuffle(frames);
        const placed = [];

        this.renderPuzzleShell(`
            <div class="quest-storyboard-wrap">
                <div class="quest-storyboard-strip">
                    ${frames.map((_, i) => `
                        <div class="quest-storyboard-slot" data-slot="${i}">
                            <div class="slot-num">Scene 0${i + 1}</div>
                            <div class="slot-content">Drop or Tap Scene</div>
                        </div>
                    `).join('')}
                </div>

                <div class="quest-storyboard-pool">
                    <p class="quest-hint"><i class="fa-solid fa-film"></i> Assemble frames in proven narrative sequence (Problem → Discovery → Solution → Result):</p>
                    <div class="quest-storyboard-cards">
                        ${shuffled.map(f => `
                            <div class="quest-frame-card" data-id="${f.id}" data-step="${f.step}">
                                <div class="frame-icon"><i class="${f.icon}"></i></div>
                                <div class="frame-title">${f.name}</div>
                                <div class="frame-desc">${f.desc}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `);

        const slots = qsa('.quest-storyboard-slot', this.root);

        qsa('.quest-frame-card', this.root).forEach(card => {
            card.addEventListener('click', () => {
                sound.playClick();
                const expectedStep = placed.length + 1;
                const cardStep = Number(card.dataset.step);

                if (cardStep === expectedStep) {
                    sound.playDrop();
                    const slotIndex = placed.length;
                    placed.push(card.dataset.id);

                    const frameData = frames.find(f => f.step === cardStep);
                    const slot = slots[slotIndex];
                    slot.classList.add('filled');
                    qs('.slot-content', slot).innerHTML = `
                        <i class="${frameData.icon}"></i>
                        <strong>${frameData.name}</strong>
                        <p>${frameData.desc}</p>
                    `;

                    card.classList.add('used');
                    card.style.display = 'none';

                    if (placed.length === frames.length) {
                        slots.forEach(s => s.classList.add('playing'));
                        this.showToast('🎬 Commercial sequence ready for release!', 'success');
                        this.registerSuccess(1200);
                    }
                } else {
                    this.registerMistake(card, `Narrative order should be: Problem → Discovery → Solution → Result!`);
                }
            });
        });
    }

    // ==========================================
    // 03 TVC: Trial 2 - Choose the Shot
    // Cinematic Viewfinder Simulation
    // ==========================================
    renderCinematicShot(p) {
        this.renderPuzzleShell(`
            <div class="quest-cinematic-wrap">
                <div class="quest-viewfinder-preview" id="quest-viewfinder">
                    <div class="vf-corner tl"></div>
                    <div class="vf-corner tr"></div>
                    <div class="vf-corner bl"></div>
                    <div class="vf-corner br"></div>
                    <div class="vf-rec"><span class="rec-dot"></span> REC &bull; 4K 60FPS</div>
                    <div class="vf-center-lens" id="quest-lens-focus">
                        <i class="fa-solid fa-camera"></i>
                        <span id="quest-lens-label">Select camera lens to test shot</span>
                    </div>
                </div>

                <div class="quest-shot-grid">
                    ${p.options.map(opt => `
                        <button class="quest-shot-card" data-id="${opt.id}" data-correct="${opt.correct}">
                            <div class="shot-icon"><i class="${opt.previewIcon}"></i></div>
                            <div class="shot-title">${opt.title}</div>
                            <div class="shot-lens">${opt.lens}</div>
                            <div class="shot-desc">${opt.desc}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `);

        qsa('.quest-shot-card', this.root).forEach(btn => {
            btn.addEventListener('click', () => {
                const isCorrect = btn.dataset.correct === 'true';
                const opt = p.options.find(o => o.id === btn.dataset.id);
                const vf = qs('#quest-viewfinder', this.root);
                const lensLabel = qs('#quest-lens-label', this.root);

                if (isCorrect) {
                    vf.classList.add('focused', 'correct');
                    btn.classList.add('correct');
                    lensLabel.innerHTML = `<strong>${opt.title}</strong><br><small>${opt.feedback}</small>`;
                    this.showToast('🎥 Golden emotional shot locked in!', 'success');
                    this.registerSuccess(1200);
                } else {
                    vf.classList.add('shake-viewfinder');
                    setTimeout(() => vf.classList.remove('shake-viewfinder'), 400);
                    this.registerMistake(btn, opt.feedback);
                }
            });
        });
    }

    // ==========================================
    // Generic Card Selection (Influencer / Keyword)
    // ==========================================
    renderSingleCard(p) {
        const options = shuffle(p.options);
        this.renderPuzzleShell(`
            <div class="quest-single-card-grid">
                ${options.map(opt => `
                    <div class="quest-profile-card" data-id="${opt.id}" data-correct="${opt.correct}">
                        ${opt.badge ? `<span class="quest-card-badge">${opt.badge}</span>` : ''}
                        <h3 class="quest-card-h3">${opt.name || opt.query}</h3>
                        ${opt.followers ? `
                            <div class="quest-card-stat"><i class="fa-solid fa-users"></i> ${opt.followers}</div>
                            <div class="quest-card-stat"><i class="fa-solid fa-chart-pie"></i> ${opt.engagement}</div>
                            <div class="quest-card-stat"><i class="fa-solid fa-tag"></i> ${opt.niche}</div>
                        ` : ''}
                        ${opt.intent ? `<div class="quest-card-intent">${opt.intent}</div>` : ''}
                        <p class="quest-card-desc">${opt.desc}</p>
                    </div>
                `).join('')}
            </div>
        `);

        qsa('.quest-profile-card', this.root).forEach(card => {
            card.addEventListener('click', () => {
                const isCorrect = card.dataset.correct === 'true';
                if (isCorrect) {
                    card.classList.add('correct');
                    this.showToast('✓ Strategic choice verified!', 'success');
                    this.registerSuccess();
                } else {
                    this.registerMistake(card, 'Sub-optimal match — examine target intent & engagement depth.');
                }
            });
        });
    }

    // ==========================================
    // 04 Influencer: Trial 2 - Match the Audience
    // Pair Matching (Tap or Drag)
    // ==========================================
    renderMatchPairs(p) {
        const rightShuffled = shuffle(p.right);
        let matchedCount = 0;
        let selectedLeft = null;

        this.renderPuzzleShell(`
            <div class="quest-match-instruction">
                <i class="fa-solid fa-hand-pointer"></i> Tap a creator on the left, then tap their true matching audience on the right.
            </div>
            <div class="quest-match-columns">
                <div class="quest-match-col" id="col-left">
                    <span class="col-title"><i class="fa-solid fa-bullhorn"></i> Content Creators</span>
                    ${p.left.map(l => `
                        <button class="quest-chip quest-match-card" data-id="${l.id}" data-side="left">
                            <i class="${l.icon}"></i> <span>${l.label}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="quest-match-col" id="col-right">
                    <span class="col-title"><i class="fa-solid fa-users-viewfinder"></i> Receptive Audiences</span>
                    ${rightShuffled.map(r => `
                        <button class="quest-chip quest-match-card" data-id="${r.id}" data-matches="${r.matches}" data-side="right">
                            <i class="${r.icon}"></i> <span>${r.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `);

        const leftBtns = qsa('.quest-match-card[data-side="left"]', this.root);
        const rightBtns = qsa('.quest-match-card[data-side="right"]', this.root);

        leftBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('matched')) return;
                sound.playClick();
                leftBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedLeft = btn.dataset.id;
            });
        });

        rightBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('matched')) return;
                if (!selectedLeft) {
                    this.showToast('Select a creator on the left first!', 'info');
                    return;
                }
                const leftBtn = leftBtns.find(l => l.dataset.id === selectedLeft);
                const matches = btn.dataset.matches === selectedLeft;

                if (matches) {
                    sound.playDrop();
                    btn.classList.add('matched');
                    leftBtn.classList.add('matched');
                    leftBtn.classList.remove('selected');
                    selectedLeft = null;
                    matchedCount += 1;
                    this.showToast('🔥 High-converting audience alignment unlocked!', 'success');

                    if (matchedCount === p.left.length) {
                        this.registerSuccess(1000);
                    }
                } else {
                    this.registerMistake(btn, 'Mismatched audience! Creators convert best with their natural niche.');
                    leftBtn.classList.remove('selected');
                    selectedLeft = null;
                }
            });
        });
    }

    // ==========================================
    // 05 SEO: Trial 2 - Climb the Rankings
    // Search Ranking Tower Simulation
    // ==========================================
    renderSearchTower(p) {
        let currentRank = p.startRank;
        let selectedCount = 0;
        const options = shuffle(p.options);

        this.renderPuzzleShell(`
            <div class="quest-serp-wrap">
                <div class="quest-serp-tower">
                    <div class="serp-tower-header">
                        <span><i class="fa-solid fa-ranking-star"></i> DigiSearch Rank</span>
                        <span class="serp-rank-indicator" id="quest-rank-badge">#${currentRank}</span>
                    </div>
                    <div class="serp-preview-card" id="quest-serp-card">
                        <div class="serp-url">https://digiboost.agency/crown-bakery</div>
                        <div class="serp-title" id="serp-title">Artisan Bakery — Fresh Sourdough & Pastries</div>
                        <div class="serp-snippet">Best bakery open now. 5-star fresh artisan bread, morning croissants, and local catering.</div>
                    </div>
                </div>

                <div class="quest-seo-checklist">
                    <p class="quest-hint"><i class="fa-solid fa-list-check"></i> Select the 3 high-impact white-hat optimizations to hit Rank #1:</p>
                    <div class="quest-seo-options">
                        ${options.map(opt => `
                            <button class="quest-seo-opt-btn" data-id="${opt.id}" data-correct="${opt.correct}" data-impact="${opt.rankImpact}">
                                <div class="opt-tag">${opt.badge}</div>
                                <div class="opt-label">${opt.label}</div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `);

        const rankBadge = qs('#quest-rank-badge', this.root);
        const serpCard = qs('#quest-serp-card', this.root);

        qsa('.quest-seo-opt-btn', this.root).forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('correct') || btn.classList.contains('penalized')) return;

                const isCorrect = btn.dataset.correct === 'true';
                const impact = Number(btn.dataset.impact);
                const opt = p.options.find(o => o.id === btn.dataset.id);

                if (isCorrect) {
                    sound.playDrop();
                    btn.classList.add('correct');
                    currentRank = Math.max(1, currentRank + impact);
                    rankBadge.textContent = `#${currentRank}`;
                    rankBadge.classList.add('rank-up');
                    setTimeout(() => rankBadge.classList.remove('rank-up'), 400);

                    selectedCount += 1;
                    this.showToast(`📈 ${opt.tip}`, 'success');

                    if (currentRank <= 1 || selectedCount === 3) {
                        rankBadge.innerHTML = '👑 #1 RANKED';
                        serpCard.classList.add('serp-winner');
                        this.registerSuccess(1200);
                    }
                } else {
                    btn.classList.add('penalized');
                    currentRank = Math.min(20, currentRank + impact);
                    rankBadge.textContent = `#${currentRank}`;
                    this.registerMistake(btn, `⚠️ Algorithm Penalty! ${opt.tip}`);
                }
            });
        });
    }

    // ==========================================
    // 06 AI: Trial 1 - Prompt the Story
    // ==========================================
    renderAIPromptStudio(p) {
        const selections = {};

        this.renderPuzzleShell(`
            <div class="quest-ai-studio">
                <div class="quest-ai-terminal">
                    <div class="terminal-bar">
                        <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
                        <span class="terminal-title">DigiBoost Neural Video Engine</span>
                    </div>
                    <div class="terminal-code" id="quest-prompt-terminal">
                        // Choose subject, style, voice and scene below to compile prompt...
                    </div>
                    <div class="terminal-progress" id="quest-ai-render-bar" style="display:none;">
                        <div class="progress-fill"></div>
                    </div>
                </div>

                <div class="quest-ai-categories">
                    ${p.categories.map(cat => `
                        <div class="quest-ai-cat-row">
                            <span class="cat-label">${cat.label}</span>
                            <div class="cat-chips">
                                ${cat.options.map(opt => `
                                    <button class="quest-chip quest-ai-chip" data-cat="${cat.key}" data-val="${opt}">${opt}</button>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <button class="quest-btn quest-btn-primary quest-btn-glow" id="quest-compile-prompt" disabled>
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Synthesize AI Video
                </button>
            </div>
        `);

        const compileBtn = qs('#quest-compile-prompt', this.root);
        const terminal = qs('#quest-prompt-terminal', this.root);
        const renderBar = qs('#quest-ai-render-bar', this.root);

        p.categories.forEach(cat => {
            const btns = qsa(`.quest-ai-chip[data-cat="${cat.key}"]`, this.root);
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    sound.playClick();
                    btns.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selections[cat.key] = btn.dataset.val;

                    terminal.innerHTML = `<span class="keyword">PROMPT</span> = <span class="string">${p.previewTemplate(selections)}</span>`;

                    const ready = Object.keys(selections).length === p.categories.length;
                    compileBtn.disabled = !ready;
                });
            });
        });

        compileBtn.addEventListener('click', () => {
            sound.playDrop();
            compileBtn.disabled = true;
            compileBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Rendering Diffusion Frames...';
            renderBar.style.display = 'block';

            setTimeout(() => {
                terminal.innerHTML = `
                    <span class="success">✓ VIDEO GENERATED SUCCESSFULLY</span><br>
                    <strong>Resolution:</strong> 4K UHD &bull; 60fps &bull; HDR<br>
                    <strong>Style:</strong> ${selections.style}<br>
                    <strong>Narration:</strong> Synthesized by DigiBoost AI Studio
                `;
                this.showToast('🎬 AI Masterpiece Generated!', 'success');
                this.registerSuccess(1200);
            }, 1200);
        });
    }

    // ==========================================
    // 06 AI: Trial 2 - Direct Your AI Avatar
    // ==========================================
    renderAIAvatarDirector(p) {
        const selections = {};

        this.renderPuzzleShell(`
            <div class="quest-avatar-director">
                <div class="quest-avatar-stage" id="quest-avatar-stage">
                    <div class="stage-hologram">
                        <i class="fa-solid ${this.avatarIconClass()} avatar-holo-icon"></i>
                        <div class="soundwave" id="quest-soundwave">
                            <span></span><span></span><span></span><span></span><span></span>
                        </div>
                    </div>
                    <div class="stage-dialogue" id="quest-stage-dialogue">
                        "Configure the AI avatar's direction for the final take..."
                    </div>
                </div>

                <div class="quest-director-controls">
                    ${p.categories.map(cat => `
                        <div class="quest-dir-row">
                            <span class="dir-label">${cat.label}</span>
                            <div class="dir-options">
                                ${cat.options.map(opt => `
                                    <button class="quest-chip quest-dir-chip" data-cat="${cat.key}" data-val="${opt}">${opt}</button>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <button class="quest-btn quest-btn-gold quest-btn-glow" id="quest-direct-take" disabled>
                    <i class="fa-solid fa-clapperboard"></i> Direct Final Take
                </button>
            </div>
        `);

        const directBtn = qs('#quest-direct-take', this.root);
        const dialogueBox = qs('#quest-stage-dialogue', this.root);
        const stage = qs('#quest-avatar-stage', this.root);
        const wave = qs('#quest-soundwave', this.root);

        p.categories.forEach(cat => {
            const btns = qsa(`.quest-dir-chip[data-cat="${cat.key}"]`, this.root);
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    sound.playClick();
                    btns.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selections[cat.key] = btn.dataset.val;

                    const ready = Object.keys(selections).length === p.categories.length;
                    directBtn.disabled = !ready;
                });
            });
        });

        directBtn.addEventListener('click', () => {
            sound.playGemUnlock();
            directBtn.disabled = true;
            directBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Performing Final Take...';
            stage.classList.add('recording');
            wave.classList.add('active');

            dialogueBox.innerHTML = `
                <div class="dialogue-quote">
                    ${p.dialogueTemplate(selections)}
                </div>
                <div class="dialogue-meta">
                    Delivery: <strong>${selections.voice}</strong> &bull; Expression: <strong>${selections.expression}</strong> &bull; Set: <strong>${selections.background}</strong>
                </div>
            `;

            this.showToast('👑 Flawless take directed! The final AI Gem is yours.', 'success');
            setTimeout(() => {
                this.registerSuccess(1500);
            }, 1800);
        });
    }

    // ==========================================
    // Kingdom Mastered & Gem Unlocked
    // ==========================================
    renderKingdomComplete() {
        const k = this.currentKingdom;
        const isLastKingdom = this.state.kingdomIndex === this.state.kingdoms.length - 1;
        sound.playGemUnlock();

        const remainingGems = this.state.kingdoms.length - this.state.kingdomIndex - 1;

        this.root.innerHTML = `
            <section class="quest-screen quest-kingdom-complete">
                ${this.topBar()}
                <div class="quest-kingdom-complete-character">
                    <div class="quest-complete-avatar-wrap">
                        <img src="${this.getAvatarSearchingImg()}" alt="${this.state.avatar}" class="quest-complete-avatar-img" />
                        <div class="quest-complete-gem-badge" style="--gem-color:${k.gemColor}">
                            <i class="fa-solid fa-gem"></i>
                        </div>
                    </div>
                    <div class="quest-complete-speech">
                        <strong>${this.state.avatar === 'queen' ? 'The Queen' : 'The King'}:</strong>
                        <span>"${k.gem} recovered! ${isLastKingdom ? 'All six crown gems are in our grasp — let us forge the DigiBoost Crown!' : 'Only ' + remainingGems + ' more gems remain to complete the crown.'}"</span>
                    </div>
                </div>
                <h2 class="quest-h2 quest-gold">${k.gem} Unlocked!</h2>
                <p class="quest-desc">
                    You have mastered <strong>${k.name}</strong> (${k.title}).
                </p>
                <div class="quest-marketing-card">
                    <div class="marketing-badge"><i class="${k.icon}"></i> DigiBoost Capability</div>
                    <p class="marketing-quote">"${k.message}"</p>
                </div>
                <button class="quest-btn quest-btn-primary quest-btn-glow" id="quest-continue-quest">
                    ${isLastKingdom ? 'Proceed to Crown Ceremony' : 'Continue Quest'} 
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            </section>
        `;
        this.bindTopBarEvents();

        qs('#quest-continue-quest', this.root).addEventListener('click', () => {
            sound.playClick();
            if (isLastKingdom) {
                this.state.screen = 'ceremony';
            } else {
                this.state.kingdomIndex += 1;
                this.state.puzzleIndex = 0;
                this.state.screen = 'map';
                this._pendingWalkTo = this.state.kingdomIndex;
            }
            this.render();
        });
    }

    // ==========================================
    // Final Coronation & Crown Forging Ceremony
    // ==========================================
    renderCeremony() {
        this.saveBestScore(this.state.score);
        sound.playCeremonyFanfare();

        const gemsHtml = this.state.kingdoms.map((k, i) => `
            <div class="quest-ceremony-gem" style="--gem-color:${k.gemColor}; --delay:${i * 0.2}s" title="${k.gem}">
                <i class="fa-solid fa-gem"></i>
                <span>${k.gem}</span>
            </div>
        `).join('');

        this.root.innerHTML = `
            <section class="quest-screen quest-ceremony">
                <span class="quest-eyebrow">Coronation Ceremony</span>
                <div class="quest-ceremony-gems">${gemsHtml}</div>
                
                <div class="quest-coronation-showcase">
                    <div class="quest-coronation-img-frame">
                        <img src="${this.getAvatarCrownedImg()}" alt="Crowned and Cheered Up ${this.state.avatar}" class="quest-coronation-hero-img" />
                        <div class="quest-coronation-halo"></div>
                        <div class="quest-coronation-cheer-tag">
                            <i class="fa-solid fa-crown"></i> Crown Restored & Cheered Up!
                        </div>
                    </div>
                    <div class="quest-coronation-speech-bubble">
                        <strong>${this.state.avatar === 'queen' ? 'The Queen' : 'The King'}:</strong>
                        <span>"My crown is restored and glowing brighter than ever! We now rule the digital marketing kingdom!"</span>
                    </div>
                </div>

                <h1 class="quest-title quest-gold">YOU HAVE MASTERED<br>THE SIX REALMS OF DIGITAL GROWTH</h1>
                <p class="quest-desc">Your legendary DigiBoost Crown is complete.</p>
                <button class="quest-btn quest-btn-gold quest-btn-glow" id="quest-see-result">
                    Claim Your Royal Title & Score <i class="fa-solid fa-arrow-right"></i>
                </button>
            </section>
        `;

        qs('#quest-see-result', this.root).addEventListener('click', () => {
            sound.playClick();
            this.state.screen = 'result';
            this.render();
        });
    }

    // ==========================================
    // Royal Result & Lead Conversion CTA
    // ==========================================
    renderResult() {
        // Player title awarded by strongest kingdom performance
        const bestKingdom = this.state.kingdoms.reduce(
            (best, k) => (k.mistakes < best.mistakes ? k : best),
            this.state.kingdoms[0]
        );

        const shareText = `I just mastered all six realms of digital marketing, earned the royal title "${bestKingdom.playerTitle}", and forged the DigiBoost Crown with ${this.state.score} points! 👑 Can you rule your digital kingdom?`;
        const shareUrl = window.location.href;

        this.root.innerHTML = `
            <section class="quest-screen quest-result">
                <div class="quest-result-card" id="quest-result-card">
                    <div class="quest-result-hero-avatar">
                        <div class="quest-result-crowned-wrap">
                            <img src="${this.getAvatarCrownedImg()}" alt="Crowned ${this.state.avatar}" class="quest-result-crowned-img" />
                            <div class="quest-result-crown-badge"><i class="fa-solid fa-crown"></i> Crowned Ruler</div>
                        </div>
                    </div>
                    <span class="quest-eyebrow">Royal Title Conferred</span>
                    <h2 class="quest-h2 quest-gold">${bestKingdom.playerTitle}</h2>
                    <div class="quest-result-score">
                        <strong>${this.state.score}</strong>
                        <span>points</span>
                    </div>
                    <p class="quest-result-proclamation">
                        You conquered all twelve strategic trials, restored the DigiBoost Crown, and proved your leadership across every digital growth discipline.
                    </p>
                    <div class="quest-result-gem-row">
                        ${this.state.kingdoms.map(k => `<i class="fa-solid fa-gem" style="color:${k.gemColor};" title="${k.gem}"></i>`).join('')}
                    </div>
                </div>

                <div class="quest-result-actions">
                    <button class="quest-btn quest-btn-primary" id="quest-share">
                        <i class="fa-solid fa-share-nodes"></i> Share Your Crown
                    </button>
                    <button class="quest-btn quest-btn-ghost" id="quest-play-again">
                        <i class="fa-solid fa-rotate-right"></i> Play Again
                    </button>
                </div>

                <div class="quest-final-cta">
                    <span class="quest-eyebrow quest-gold-border">Next Step for Your Brand</span>
                    <h3>Ready to Build Your Kingdom?</h3>
                    <p>Don't just visit the agency website. Turn attention into customers and rule your digital kingdom with DigiBoost.</p>
                    <a href="../#contact" class="quest-btn quest-btn-gold quest-btn-glow">
                        Get a Free Strategy Session <i class="fa-solid fa-crown"></i>
                    </a>
                </div>
            </section>
        `;

        qs('#quest-share', this.root).addEventListener('click', async () => {
            sound.playClick();
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'The DigiBoost Crown Quest',
                        text: shareText,
                        url: shareUrl,
                    });
                    return;
                } catch (e) {}
            }
            try {
                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                const btn = qs('#quest-share', this.root);
                const original = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Proclamation Copied to Clipboard!';
                setTimeout(() => { btn.innerHTML = original; }, 2500);
            } catch (e) {}
        });

        qs('#quest-play-again', this.root).addEventListener('click', () => {
            sound.playClick();
            this.state = this.freshState();
            this._pendingWalkTo = null;
            this.render();
        });
    }
}
