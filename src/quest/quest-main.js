import '../index.css';
import './quest.css';
import { QuestGame } from './quest-engine.js';

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('quest-root');
    if (!root) return;
    const game = new QuestGame(root);
    game.init();
});
