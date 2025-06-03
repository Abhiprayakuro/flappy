const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let bgX = 0;
const bgScrollSpeed = 1.5; // Kecepatan geser background

//lagu disini
const music = new Audio("sounds/backgroundsound.mp3");
const flapSound = new Audio("sounds/Jumpsound.mp3");
const hitSound = new Audio("sounds/Hitsound.mp3");

// Optional: Set properti
music.loop = true;
music.volume = 0.5;
flapSound.volume = 1;
hitSound.volume = 1;


canvas.width = 480;
canvas.height = 640;

const birdImg = new Image();
const bgImg = new Image();
const pipeTopImg = new Image();
const pipeBottomImg = new Image();

birdImg.src = "images/beluang.jpeg";
bgImg.src = "images/latar.png";
pipeTopImg.src = "images/pipaup.png";
pipeBottomImg.src = "images/pipadown.png";

const GRAVITY = 0.4;
const FLAP = -7;
const GAP = 150;
const PIPE_WIDTH = 110;
const PIPE_SPEED = 2;

let bird = { x: 100, y: 250, width: 45, height: 45, velocity: 0 };
let pipes = [];
let score = 0;
let gameRunning = false;

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const scoreEl = document.getElementById("score");

//sistem kontrol
startButton.onclick = startGame;
restartButton.onclick = startGame;

// Untuk klik / tap desktop
canvas.onclick = () => gameRunning && flap();

// Untuk keyboard Space
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && gameRunning) {
    e.preventDefault(); // hanya cegah scroll jika tekan Space
    flap();
  }
});

// Untuk tap di layar sentuh (HP)
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault(); // cegah scroll browser saat tap
  if (gameRunning) flap();
});

function startGame() {
  pipes = [];
  bird.y = 250;
  bird.velocity = 0;
  score = 0;
  gameRunning = true;

  music.currentTime = 0;
  music.play();

  startButton.style.display = "none";
  restartButton.style.display = "none";
  scoreEl.textContent = "Skor: 0";
  requestAnimationFrame(gameLoop);
}

function flap() {
  bird.velocity = FLAP;
  flapSound.currentTime = 0;
  flapSound.play();
}

let collisionCheckCounter = 0;

function gameLoop() {
  if (!gameRunning) return;

  

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  bgX -= bgScrollSpeed;
  if (bgX <= -canvas.width) {
    bgX = 0;
  }

  // Gambar dua latar bersebelahan agar seamless
  ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);


  bird.velocity += GRAVITY;
  bird.y += bird.velocity;

  if (bird.y + bird.height > canvas.height || bird.y < 0) {
    return endGame();
  }

  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
    const topHeight = Math.floor(Math.random() * 250) + 50;
    pipes.push({ x: canvas.width, topHeight, passed: false });
  }

  for (let i = 0; i < pipes.length; i++) {
    const pipe = pipes[i];
    pipe.x -= PIPE_SPEED;

    ctx.drawImage(pipeTopImg, pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    ctx.drawImage(
      pipeBottomImg,
      pipe.x,
      pipe.topHeight + GAP,
      PIPE_WIDTH,
      canvas.height - pipe.topHeight - GAP
    );

    if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.passed = true;
      score++;
      scoreEl.textContent = "Skor: " + score;
    }

    // ✅ Hanya deteksi tabrakan jika pipa terlihat di layar
    if (pipe.x + PIPE_WIDTH > 0 && pipe.x < canvas.width) {
      collisionCheckCounter++;
      if (collisionCheckCounter % 3 === 0) {
        if (
          pixelCollision(
            birdImg, bird.x, bird.y, bird.width, bird.height,
            pipeTopImg, pipe.x, 0, PIPE_WIDTH, pipe.topHeight
          ) ||
          pixelCollision(
            birdImg, bird.x, bird.y, bird.width, bird.height,
            pipeBottomImg, pipe.x, pipe.topHeight + GAP,
            PIPE_WIDTH, canvas.height - pipe.topHeight - GAP
          )
        ) {
          return endGame();
        }
      }
    }
  }

  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
  pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > 0);
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;

  music.pause();
  hitSound.currentTime = 0;
  hitSound.play();

  restartButton.style.display = "block";
  renderFinalFrame();
}

function renderFinalFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  for (let i = 0; i < pipes.length; i++) {
    const pipe = pipes[i];
    ctx.drawImage(pipeTopImg, pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    ctx.drawImage(
      pipeBottomImg,
      pipe.x,
      pipe.topHeight + GAP,
      PIPE_WIDTH,
      canvas.height - pipe.topHeight - GAP
    );
  }
  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
}

// Pixel-perfect collision
function pixelCollision(imgA, ax, ay, aw, ah, imgB, bx, by, bw, bh) {
  const buffer = document.createElement("canvas");
  buffer.width = Math.max(ax + aw, bx + bw);
  buffer.height = Math.max(ay + ah, by + bh);
  const bctx = buffer.getContext("2d");

  bctx.clearRect(0, 0, buffer.width, buffer.height);
  bctx.drawImage(imgA, ax, ay, aw, ah);
  bctx.globalCompositeOperation = "source-in";
  bctx.drawImage(imgB, bx, by, bw, bh);

  const pixels = bctx.getImageData(0, 0, buffer.width, buffer.height).data;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] !== 0) return true;
  }
  return false;
}
