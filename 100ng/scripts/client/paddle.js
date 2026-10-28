// Creates a paddle element. Positions are in "vw" units (the playfield is 98vw x 54.25vw).
const createPaddle = function(game, options) {
  const paddle = document.createElement('div');
  paddle.classList.add('paddle');
  paddle.style.left = options.x + 'vw';
  paddle.style.top = options.y + 'vw';
  paddle.style.backgroundColor = options.color;
  game.appendChild(paddle);
  return paddle;
};
