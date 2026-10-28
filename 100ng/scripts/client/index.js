'use strict';
/*
 * 100ng - standalone / offline mode.
 * The original game needed a multiplayer server (each person controlled one paddle).
 * This version runs entirely in the browser: you control ONE paddle with the mouse or touch,
 * everybody else on both teams is played by the computer.
 * First team to WIN_SCORE goals wins. Click or press Enter/Space to start / restart.
 */
(function() {
  const FIELD_W = 98;       // vw
  const FIELD_H = 54.25;    // vw (16:9 minus margins)
  const PADDLE_W = 1, PADDLE_H = 5, BALL = 1;
  const PER_TEAM = 9;       // paddles per team (you + 8 bots on the left, 9 bots on the right)
  const COLUMNS = 3, WIN_SCORE = 11;
  const START_SPEED = 42, MAX_SPEED = 95;

  const game = document.getElementById('game');
  const ballEl = game.querySelector('.ball');
  const scoreEl = {A: document.getElementById('a'), B: document.getElementById('b')};
  const sounds = {
    hit: document.getElementById('hitSound'),
    goal: document.getElementById('goalSound'),
    win: document.getElementById('winSound'),
  };
  function play(name) {
    try { const s = sounds[name]; s.currentTime = 0; const p = s.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  }

  const paddles = [];
  let human = null;

  function build() {
    const perCol = Math.ceil(PER_TEAM / COLUMNS);
    for (const team of ['A', 'B']) {
      let n = 0;
      for (let c = 0; c < COLUMNS; c++) {
        const inCol = Math.min(perCol, PER_TEAM - n);
        for (let r = 0; r < inCol; r++) {
          const slot = FIELD_H / inCol;
          const x = team === 'A' ? 2 + c * 7 : FIELD_W - 2 - PADDLE_W - c * 7;
          const y = slot * r + (slot - PADDLE_H) / 2;
          const isHuman = team === 'A' && c === 0 && r === Math.floor(inCol / 2);
          const color = isHuman ? '#ffffff' : utils.randomColor();
          const p = {
            team, x, y, home: y, ai: !isHuman,
            skill: 0.35 + Math.random() * 0.45, err: 0, errT: 0,
          };
          p.el = createPaddle(game, {x, y, color});
          if (isHuman) { human = p; p.el.style.outline = '0.15vw solid #fff'; p.el.style.outlineOffset = '0.2vw'; }
          paddles.push(p);
          n++;
        }
      }
    }
  }

  const ball = {x: 0, y: 0, vx: 0, vy: 0, speed: START_SPEED};
  const score = {A: 0, B: 0};
  let state = 'ready'; // ready | serving | playing | over
  let serveAt = 0, blinkTeam = null;

  function showScores() {
    scoreEl.A.textContent = String(score.A).padStart(2, '0');
    scoreEl.B.textContent = String(score.B).padStart(2, '0');
  }

  function serve(toward) {
    ball.x = FIELD_W / 2 - BALL / 2;
    ball.y = FIELD_H / 2 - BALL / 2;
    ball.speed = START_SPEED;
    const ang = (Math.random() - 0.5) * 0.8;
    const dir = toward === 'A' ? -1 : 1;
    ball.vx = Math.cos(ang) * ball.speed * dir;
    ball.vy = Math.sin(ang) * ball.speed;
    state = 'playing';
  }

  function startMatch() {
    score.A = score.B = 0;
    showScores();
    scoreEl.A.classList.remove('blink');
    scoreEl.B.classList.remove('blink');
    ball.x = FIELD_W / 2 - BALL / 2; ball.y = FIELD_H / 2 - BALL / 2; ball.vx = ball.vy = 0;
    state = 'serving';
    serveAt = performance.now() + 700;
  }

  function goal(team) {
    score[team]++;
    showScores();
    if (score[team] >= WIN_SCORE) {
      state = 'over';
      scoreEl[team].classList.add('blink');
      play('win');
      return;
    }
    play('goal');
    state = 'serving';
    serveAt = performance.now() + 900;
    ball.vx = ball.vy = 0;
    ball.x = FIELD_W / 2 - BALL / 2; ball.y = FIELD_H / 2 - BALL / 2;
    ball._next = team === 'A' ? 'B' : 'A'; // the team that conceded gets the serve
  }

  function clampY(y) { return Math.max(0, Math.min(FIELD_H - PADDLE_H, y)); }

  function update(dt, now) {
    // bots
    for (const p of paddles) {
      if (!p.ai) continue;
      p.errT -= dt;
      if (p.errT <= 0) { p.err = (Math.random() - 0.5) * 8; p.errT = 0.3 + Math.random() * 0.5; }
      const approaching = !p.lazy && state === 'playing' && ((p.team === 'A' && ball.vx < 0) || (p.team === 'B' && ball.vx > 0));
      const near = Math.abs(ball.x - p.x) < 45;
      const target = approaching && near ? ball.y + BALL / 2 - PADDLE_H / 2 + p.err : p.home;
      const maxMove = 30 * p.skill * dt;
      const d = target - p.y;
      p.y = clampY(p.y + Math.max(-maxMove, Math.min(maxMove, d)));
    }

    if (state === 'serving' && now >= serveAt) serve(ball._next || (Math.random() < 0.5 ? 'A' : 'B'));
    if (state === 'playing') {
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.y < 0) { ball.y = 0; ball.vy = Math.abs(ball.vy); }
      if (ball.y > FIELD_H - BALL) { ball.y = FIELD_H - BALL; ball.vy = -Math.abs(ball.vy); }

      for (const p of paddles) {
        const hits = ball.x < p.x + PADDLE_W && ball.x + BALL > p.x && ball.y < p.y + PADDLE_H && ball.y + BALL > p.y;
        if (!hits) continue;
        if (p.team === 'A' && ball.vx < 0) {
          ball.x = p.x + PADDLE_W; bounce(p, 1);
        } else if (p.team === 'B' && ball.vx > 0) {
          ball.x = p.x - BALL; bounce(p, -1);
        }
      }
      if (ball.x + BALL < 0) goal('B');
      else if (ball.x > FIELD_W) goal('A');
    }
  }

  function bounce(p, dir) {
    const rel = ((ball.y + BALL / 2) - (p.y + PADDLE_H / 2)) / (PADDLE_H / 2 + BALL / 2); // -1..1
    ball.speed = Math.min(MAX_SPEED, ball.speed * 1.04);
    const ang = rel * 0.9;
    ball.vx = Math.cos(ang) * ball.speed * dir;
    ball.vy = Math.sin(ang) * ball.speed;
    play('hit');
    // bots sometimes lose focus after each hit, so goals actually happen
    for (const q of paddles) if (q.ai) q.lazy = Math.random() < 0.6;
  }

  function render() {
    for (const p of paddles) p.el.style.top = p.y + 'vw';
    ballEl.style.left = ball.x + 'vw';
    ballEl.style.top = ball.y + 'vw';
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt, now);
    render();
    requestAnimationFrame(frame);
  }

  function setHumanY(clientY) {
    if (!human) return;
    const rect = game.getBoundingClientRect();
    const vw = rect.width / FIELD_W;
    human.y = clampY((clientY - rect.top) / vw - PADDLE_H / 2);
  }

  game.addEventListener('mousemove', e => setHumanY(e.clientY));
  game.addEventListener('touchmove', e => { setHumanY(e.touches[0].clientY); e.preventDefault(); }, {passive: false});
  game.addEventListener('touchstart', e => setHumanY(e.touches[0].clientY), {passive: true});
  function kick() { if (state === 'ready' || state === 'over') startMatch(); }
  game.addEventListener('click', kick);
  window.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { kick(); e.preventDefault(); }
    // keyboard fallback for the human paddle
    if (human && (e.key === 'ArrowUp' || e.key === 'w')) { human.y = clampY(human.y - 3); e.preventDefault(); }
    if (human && (e.key === 'ArrowDown' || e.key === 's')) { human.y = clampY(human.y + 3); e.preventDefault(); }
  });

  build();
  showScores();
  ball.x = FIELD_W / 2 - BALL / 2; ball.y = FIELD_H / 2 - BALL / 2;
  scoreEl.A.classList.add('blink'); // blinking score = "click to start"
  const startOnce = () => { scoreEl.A.classList.remove('blink'); };
  game.addEventListener('click', startOnce, {once: true});
  requestAnimationFrame(frame);
})();
