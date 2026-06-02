(() => {
  'use strict';

  // Estado único da verdade
  const state = {
    board: Array(9).fill(null),
    current: 'X',
    mode: null, // 'pvp' | 'pvc'
    active: false,
    thinking: false,
    scores: { X: 0, O: 0, draws: 0 },
  };

  let aiTimer = null;
  let generation = 0;

  const LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  // Elementos do DOM
  const menuScreen = document.getElementById('menu');
  const gameScreen = document.getElementById('game');
  const statusEl = document.getElementById('status');
  const gridEl = document.getElementById('grid');
  const scoreXEl = document.getElementById('score-x');
  const scoreOEl = document.getElementById('score-o');
  const scoreDrawsEl = document.getElementById('score-draws');

  document.getElementById('btn-pvp').addEventListener('click', () => selectMode('pvp'));
  document.getElementById('btn-pvc').addEventListener('click', () => selectMode('pvc'));
  document.getElementById('btn-restart').addEventListener('click', restartGame);
  document.getElementById('btn-menu').addEventListener('click', backToMenu);

  // Delegação de eventos no grid
  gridEl.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const index = Number(cell.dataset.index);
    handleCellClick(index);
  });

  function selectMode(mode) {
    state.mode = mode;
    menuScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    restartGame();
  }

  function restartGame() {
    generation++;
    clearTimeout(aiTimer);
    aiTimer = null;
    state.board.fill(null);
    state.current = 'X';
    state.active = true;
    state.thinking = false;
    gridEl.classList.remove('locked');
    renderBoard();
    updateStatus('Vez do X');
  }

  function backToMenu() {
    generation++;
    clearTimeout(aiTimer);
    aiTimer = null;
    state.scores = { X: 0, O: 0, draws: 0 };
    updateScoreboard();
    state.mode = null;
    state.active = false;
    state.thinking = false;
    menuScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
  }

  function handleCellClick(index) {
    if (!state.active) return;
    if (state.thinking) return;
    if (state.board[index] !== null) return;

    makeMove(index, state.current);

    const winnerInfo = checkWinner();
    if (winnerInfo) {
      endGame({ type: 'win', winner: winnerInfo.winner, line: winnerInfo.line });
      return;
    }

    if (checkDraw()) {
      endGame({ type: 'draw' });
      return;
    }

    swapTurn();

    if (state.mode === 'pvc' && state.current === 'O' && state.active) {
      state.thinking = true;
      gridEl.classList.add('locked');
      const myGen = generation;
      aiTimer = setTimeout(() => {
        gridEl.classList.remove('locked');
        if (myGen !== generation || !state.active || state.mode !== 'pvc' || state.current !== 'O') {
          state.thinking = false;
          return;
        }
        aiMove();
        state.thinking = false;
      }, 400);
    }
  }

  function makeMove(index, player) {
    state.board[index] = player;
    const cell = gridEl.querySelector(`[data-index="${index}"]`);
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
  }

  function swapTurn() {
    state.current = state.current === 'X' ? 'O' : 'X';
    updateStatus(`Vez do ${state.current}`);
  }

  function updateStatus(text) {
    statusEl.textContent = text;
  }

  function checkWinner() {
    for (const line of LINES) {
      const [a, b, c] = line;
      const va = state.board[a];
      if (va && va === state.board[b] && va === state.board[c]) {
        return { winner: va, line };
      }
    }
    return null;
  }

  function checkDraw() {
    return state.board.every((cell) => cell !== null);
  }

  function aiMove() {
    const emptyIndices = state.board
      .map((v, i) => (v === null ? i : null))
      .filter((i) => i !== null);
    if (emptyIndices.length === 0) return;

    const pick = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    makeMove(pick, 'O');

    const winnerInfo = checkWinner();
    if (winnerInfo) {
      endGame({ type: 'win', winner: winnerInfo.winner, line: winnerInfo.line });
      return;
    }

    if (checkDraw()) {
      endGame({ type: 'draw' });
      return;
    }

    swapTurn();
  }

  function endGame(result) {
    state.active = false;
    gridEl.classList.add('locked');

    if (result.type === 'win') {
      state.scores[result.winner]++;
      updateStatus(`${result.winner} venceu!`);
      highlightWinningLine(result.line);
    } else {
      state.scores.draws++;
      updateStatus('Empate!');
    }

    updateScoreboard();
  }

  function highlightWinningLine(line) {
    for (const idx of line) {
      const cell = gridEl.querySelector(`[data-index="${idx}"]`);
      if (cell) cell.classList.add('win');
    }
  }

  function updateScoreboard() {
    scoreXEl.textContent = String(state.scores.X);
    scoreOEl.textContent = String(state.scores.O);
    scoreDrawsEl.textContent = String(state.scores.draws);
  }

  function renderBoard() {
    const cells = gridEl.querySelectorAll('.cell');
    cells.forEach((cell, i) => {
      const val = state.board[i];
      cell.textContent = val || '';
      cell.className = 'cell';
      if (val) cell.classList.add(val.toLowerCase());
    });
  }
})();
