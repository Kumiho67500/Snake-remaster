let snake = [];
let snake_direction = "up";
let food = [];
let rottenFood = [];
let yellowFood = [];
let flashingFood = [];
let blueFood = [];
let explosiveFood = [];

let poop = []; // pour morceaux "morts" issus de pommes pourries (disparaissent)
let snakePieces = []; // morceaux issus des bombes, posés au sol, récupérables

let gameOver = false;
let score = 0;
let superSpeedFrames = 0;
let invincibleFrames = 0;
let blueEffectFrames = 0;

let cellSize = 10;
let cols, rows;

function setup() {
  createCanvas(floor(windowWidth / cellSize) * cellSize, floor(windowHeight / cellSize) * cellSize);
  cols = width / cellSize;
  rows = height / cellSize;
  frameRate(10);
  resetGame();
}

function draw() {
  background(220);
  drawGrid();

  if (gameOver) {
    fill(0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Game Over", width / 2, height / 2 - 20);
    textSize(16);
    text("Appuie sur 'R' pour rejouer", width / 2, height / 2 + 20);
    text("Score : " + score, width / 2, height / 2 + 50);
    return;
  }

  drawFood();
  drawRottenFood();
  drawYellowFood();
  drawFlashingFood();
  drawBlueFood();
  drawExplosiveFood();
  drawPoop();
  drawSnakePieces();
  drawSnake();
  move();
  updatePoop();
  updateSnakePieces();

  if (blueEffectFrames > 0) {
    blueEffectFrames--;
    attractRedFoodTowardsSnake();
  }

  if (invincibleFrames > 0) {
    attractAllElementsTowardsSnake();
  }

  fill(0);
  textSize(16);
  textAlign(LEFT, TOP);
  text("Score : " + score, 10, 10);

  if (invincibleFrames > 0) {
    invincibleFrames--;
    frameRate(30);
  } else if (superSpeedFrames > 0) {
    superSpeedFrames--;
    frameRate(20);
  } else {
    frameRate(10);
  }

  if (random() < 0.1) placeFood();
  if (random() < 0.01) placeRottenFood();
  if (random() < 0.005) placeYellowFood();
  if (random() < 0.002) placeFlashingFood();
  if (random() < 0.003) placeBlueFood();
  if (random() < 0.002) placeExplosiveFood();
}

function drawGrid() {
  stroke(200);
  for (let i = 0; i <= cols; i++) line(i * cellSize, 0, i * cellSize, height);
  for (let j = 0; j <= rows; j++) line(0, j * cellSize, width, j * cellSize);
}

function drawFood() {
  fill(255, 0, 0);
  for (let f of food) rect(f[0], f[1], cellSize, cellSize);
}

function drawRottenFood() {
  fill(220, 50, 0);
  for (let f of rottenFood) rect(f[0], f[1], cellSize, cellSize);
}

function drawYellowFood() {
  fill(255, 255, 0);
  for (let f of yellowFood) rect(f[0], f[1], cellSize, cellSize);
}

function drawFlashingFood() {
  for (let f of flashingFood) {
    fill(random(0, 255), random(0, 255), random(0, 255));
    rect(f[0], f[1], cellSize, cellSize);
  }
}

function drawBlueFood() {
  fill(0, 0, 255);
  for (let f of blueFood) rect(f[0], f[1], cellSize, cellSize);
}

function drawExplosiveFood() {
  let c = frameCount % 20 < 10 ? 0 : 255;
  fill(c);
  for (let f of explosiveFood) rect(f[0], f[1], cellSize, cellSize);
}

function drawPoop() {
  fill(139, 69, 19);
  for (let s of detachedSegments) rect(s.x, s.y, cellSize, cellSize);
}

function drawSnakePieces() {
  fill(0);
  for (let s of collectibleSegments) {
    rect(s.x, s.y, cellSize, cellSize);
  }
}

function drawSnake() {
  if (invincibleFrames > 0) {
    fill(random(0, 255), random(0, 255), random(0, 255));
  } else {
    fill(0);
  }
  for (let s of snake) rect(s[0], s[1], cellSize, cellSize);
}

function updatePoop() {
  detachedSegments = detachedSegments.filter(s => --s.timer > 0);
}

function updateSnakePieces() {
  for (let i = collectibleSegments.length - 1; i >= 0; i--) {
    let seg = collectibleSegments[i];
    if (seg.stepsLeft > 0) {
      seg.x += seg.dx * cellSize;
      seg.y += seg.dy * cellSize;
      seg.stepsLeft--;
    } else {
      // immobile, posés au sol
      // on ne fait rien ici, ils restent à cette position
    }
  }
}

function keyPressed() {
  if (keyCode === UP_ARROW && snake_direction !== "down") snake_direction = "up";
  else if (keyCode === DOWN_ARROW && snake_direction !== "up") snake_direction = "down";
  else if (keyCode === LEFT_ARROW && snake_direction !== "right") snake_direction = "left";
  else if (keyCode === RIGHT_ARROW && snake_direction !== "left") snake_direction = "right";
  else if (key === 'r' || key === 'R') resetGame();
}

function move() {
  let head = snake[0];
  let newHead = [...head];

  if (snake_direction === "up") newHead[1] -= cellSize;
  else if (snake_direction === "down") newHead[1] += cellSize;
  else if (snake_direction === "left") newHead[0] -= cellSize;
  else if (snake_direction === "right") newHead[0] += cellSize;

  if (invincibleFrames > 0) {
    newHead[0] = (newHead[0] + width) % width;
    newHead[1] = (newHead[1] + height) % height;
  } else if (
    newHead[0] < 0 || newHead[0] >= width || newHead[1] < 0 || newHead[1] >= height ||
    snake.some(seg => seg[0] === newHead[0] && seg[1] === newHead[1])
  ) {
    gameOver = true;
    return;
  }

  let collectedIndex = collectibleSegments.findIndex(s => s.x === newHead[0] && s.y === newHead[1]);
  if (collectedIndex !== -1) {
    collectibleSegments.splice(collectedIndex, 1);
    snake.push([snake[snake.length - 1][0], snake[snake.length - 1][1]]); // agrandir serpent
    score++;
  }

  snake.unshift(newHead);

  if (eatFood(newHead, food)) {
    score++;
  } else if (eatFood(newHead, blueFood)) {
    blueEffectFrames = 50;
  } else if (eatFood(newHead, rottenFood) && !invincibleFrames) {
    let detached = snake.splice(-5, 5);
    detached.forEach(s => detachedSegments.push({ x: s[0], y: s[1], timer: 50 }));
    if (snake.length === 0) gameOver = true;
  } else if (eatFood(newHead, yellowFood)) {
    superSpeedFrames = 50;
  } else if (eatFood(newHead, flashingFood)) {
    invincibleFrames = 150;
  } else if (eatFood(newHead, explosiveFood)) {
    explodeSnakePieces(newHead);
    score++;
  } else if (detachedSegments.some(s => s.x === newHead[0] && s.y === newHead[1])) {
    detachedSegments = detachedSegments.filter(s => !(s.x === newHead[0] && s.y === newHead[1]));
    score = max(score - 1, 0);
  } else {
    snake.pop();
  }
}

function explodeSnakePieces(bombPos) {
  let radius = 5 * cellSize;
  let centerX = bombPos[0];
  let centerY = bombPos[1];

  let toExplode = [];
  for (let i = 1; i < snake.length; i++) {
    let seg = snake[i];
    let dist = distSq(centerX, centerY, seg[0], seg[1]);
    if (dist <= radius * radius) {
      toExplode.push(seg);
    }
  }

  snake = snake.filter(s => !toExplode.includes(s));

  toExplode.forEach(seg => {
    let angle = random(TWO_PI);
    let dx = Math.round(cos(angle));
    let dy = Math.round(sin(angle));
    if (dx !== 0 && dy !== 0) {
      if (random() < 0.5) dx = 0; else dy = 0;
    }
    collectibleSegments.push({
      x: seg[0],
      y: seg[1],
      dx: dx,
      dy: dy,
      stepsLeft: 20
    });
  });
}

function distSq(x1, y1, x2, y2) {
  let dx = x1 - x2;
  let dy = y1 - y2;
  return dx * dx + dy * dy;
}

function eatFood(head, list) {
  const index = list.findIndex(f => f[0] === head[0] && f[1] === head[1]);
  if (index !== -1) {
    list.splice(index, 1);
    return true;
  }
  return false;
}

function attract(elements) {
  let head = snake[0];
  for (let i = 0; i < elements.length; i++) {
    let dx = head[0] - elements[i][0];
    let dy = head[1] - elements[i][1];
    if (dx !== 0) elements[i][0] += dx > 0 ? cellSize : -cellSize;
    if (dy !== 0) elements[i][1] += dy > 0 ? cellSize : -cellSize;
  }
}

function attractRedFoodTowardsSnake() {
  attract(food);
}

function attractAllElementsTowardsSnake() {
  attract(food);
  attract(rottenFood);
  attract(yellowFood);
  attract(flashingFood);
  attract(blueFood);
  attract(snakePieces);
  for (let i = 0; i < detachedSegments.length; i++) {
    let dx = snake[0][0] - detachedSegments[i].x;
    let dy = snake[0][1] - detachedSegments[i].y;
    if (dx !== 0) detachedSegments[i].x += dx > 0 ? cellSize : -cellSize;
    if (dy !== 0) detachedSegments[i].y += dy > 0 ? cellSize : -cellSize;
  }
}

function randomEmptyCell() {
  let x, y;
  do {
    x = floor(random(cols)) * cellSize;
    y = floor(random(rows)) * cellSize;
  } while (
    snake.some(s => s[0] === x && s[1] === y) ||
    food.concat(rottenFood, yellowFood, flashingFood, blueFood, explosiveFood).some(f => f[0] === x && f[1] === y) ||
    collectibleSegments.some(s => s.x === x && s.y === y)
  );
  return [x, y];
}

function placeFood() {
  food.push(randomEmptyCell());
}

function placeRottenFood() {
  rottenFood.push(randomEmptyCell());
}

function placeYellowFood() {
  yellowFood.push(randomEmptyCell());
}

function placeFlashingFood() {
  flashingFood.push(randomEmptyCell());
}

function placeBlueFood() {
  blueFood.push(randomEmptyCell());
}

function placeExplosiveFood() {
  explosiveFood.push(randomEmptyCell());
}

function resetGame() {
  snake = [
    [90, 90],
    [90, 100],
    [90, 110]
  ];
  snake_direction = "up";
  gameOver = false;
  score = 0;
  food = [];
  rottenFood = [];
  yellowFood = [];
  flashingFood = [];
  blueFood = [];
  explosiveFood = [];
  detachedSegments = [];
  collectibleSegments = [];
  superSpeedFrames = 0;
  invincibleFrames = 0;
  blueEffectFrames = 0;
  placeFood();
}
