/* =========================
   LOADING SCREEN
========================= */
window.addEventListener("load", () => {
  const loader = document.getElementById("loadingScreen");
  if (!loader) return;

  setTimeout(() => {
    loader.style.opacity = "0";
    loader.style.transition = "opacity .4s ease";
    setTimeout(() => loader.remove(), 400);
  }, 1500);
});

/* =========================
   EDITOR INIT
========================= */
const pagesContainer = document.getElementById("pages");

/* =========================
   CREATE PAGE
========================= */
function createPage(content = "") {
  if (!pagesContainer) return;

  const page = document.createElement("div");
  page.className = "page";

  const contentDiv = document.createElement("div");
  contentDiv.className = "page-content";
  contentDiv.contentEditable = true;
  contentDiv.innerHTML = content;

  contentDiv.addEventListener("input", save);

  page.appendChild(contentDiv);
  pagesContainer.appendChild(page);
}

function addPage() {
  createPage();
  save();
}

/* =========================
   FORMAT COMMANDS
========================= */
function toggleCmd(btn, cmd, e) {
  e.preventDefault();

  document.execCommand(cmd, false, null);

  const isActive = document.queryCommandState(cmd);

  if (isActive) btn.classList.add("active");
  else btn.classList.remove("active");

  save();
}

function cmd(command, e) {
  if (e) e.preventDefault();
  document.execCommand(command, false, null);
  save();
}

function addLink(e) {
  // empêche perte de sélection quand on clique le bouton
  if (e) e.preventDefault();

  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const selectedText = selection.toString().trim();

  // demander URL
  let url = prompt("Entrer l’URL du lien :");
  if (!url) return;

  // auto https si oublié
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  // si texte sélectionné → lien sur sélection
  if (selectedText.length > 0) {
    document.execCommand("createLink", false, url);
  }
  // sinon → insère le lien avec texte = URL
  else {
    const a = document.createElement("a");
    a.href = url;
    a.textContent = url;
    a.target = "_blank";

    const range = selection.getRangeAt(0);
    range.insertNode(a);

    // déplacer curseur après lien
    range.setStartAfter(a);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  /* =========================
   OUVERTURE LIENS — CLIC SIMPLE
========================= */

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    // seulement dans l’éditeur
    if (!link.closest(".page-content")) return;

    e.preventDefault();
    window.open(link.href, "_blank");
  });

  save();
}

/* =========================
   HIGHLIGHT (PALETTE STABLE)
========================= */
function togglePalette(e) {
  e.preventDefault();
  e.stopPropagation();

  const palette = document.getElementById("palette");
  if (!palette) return;

  palette.classList.toggle("open");
}

function applyHighlight(color, e) {
  e.preventDefault();
  e.stopPropagation();

  document.execCommand("hiliteColor", false, color);
  save();
}

/* fermer palette seulement si clic hors */
document.addEventListener("mousedown", (e) => {
  const palette = document.getElementById("palette");
  const picker = document.querySelector(".color-picker");

  if (!palette || !picker) return;

  if (!picker.contains(e.target)) {
    palette.classList.remove("open");
  }
});

/* =========================
   TOOLBAR SYNC (ETAT REEL)
========================= */
document.addEventListener("selectionchange", () => {
  updateToolbarState();
});

function updateToolbarState() {
  const map = {
    bold: "bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "strikeThrough",
  };

  document.querySelectorAll(".tool-btn").forEach((btn) => {
    const icon = btn.querySelector("i");
    if (!icon) return;

    const name = icon.getAttribute("data-lucide");
    const cmd = map[name];

    if (!cmd) return;

    if (document.queryCommandState(cmd)) btn.classList.add("active");
    else btn.classList.remove("active");
  });
}

/* =========================
   SAVE / LOAD
========================= */
function save() {
  const pages = [];

  document.querySelectorAll(".page-content").forEach((p) => {
    pages.push(p.innerHTML);
  });

  localStorage.setItem("notely-doc", JSON.stringify(pages));
}

function load() {
  if (!pagesContainer) return;

  const data = JSON.parse(localStorage.getItem("notely-doc") || "[]");

  if (data.length === 0) createPage();
  else data.forEach((c) => createPage(c));
}

/* =========================
   PDF
========================= */
function downloadPDF() {
  const opt = {
    margin: 10,
    filename: "notely.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  html2pdf().set(opt).from(pagesContainer).save();
}

load();
/* =========================
   DARK MODE — NOTELY
========================= */
function toggleDarkMode() {
  document.body.classList.toggle("dark");

  const icon = document.querySelector(".theme-toggle i");

  if (document.body.classList.contains("dark")) {
    icon.setAttribute("data-lucide", "sun");
  } else {
    icon.setAttribute("data-lucide", "moon");
  }

  lucide.createIcons();
}

function toggleTheme() {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("notely-theme", isDark);

  updateThemeIcon();
}

function loadTheme() {
  const saved = localStorage.getItem("notely-theme");
  if (saved === "true") {
    document.body.classList.add("dark");
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById("themeBtn");
  if (!btn) return;

  const icon = btn.querySelector("i");

  if (document.body.classList.contains("dark")) {
    icon.setAttribute("data-lucide", "sun");
  } else {
    icon.setAttribute("data-lucide", "moon");
  }

  lucide.createIcons();
}

window.addEventListener("DOMContentLoaded", loadTheme);

/* =========================
   EASTER EGG — SNAKE FINAL PIXEL PERFECT
========================= */

document.addEventListener("input", (e) => {
  const el = e.target;
  if (!el.classList || !el.classList.contains("page-content")) return;

  const text = el.innerText.toLowerCase();

  if (text.includes("snake") && !document.getElementById("snakeOverlay")) {
    launchSnake();
  }
});

/* =========================
   OVERLAY + COUNTDOWN
========================= */

function launchSnake() {
  const overlay = document.createElement("div");
  overlay.id = "snakeOverlay";

  overlay.innerHTML = `
    <div class="snake-container">
      <div id="snakeScore" class="snake-score">0</div>
      <div id="snakeCountdown" class="snake-countdown">3</div>
      <canvas id="snakeCanvas" width="300" height="300" style="display:none"></canvas>
    </div>
  `;

  document.body.appendChild(overlay);

  startCountdownThenGame();
}

function startCountdownThenGame() {
  const countdownEl = document.getElementById("snakeCountdown");
  const canvas = document.getElementById("snakeCanvas");

  let count = 3;

  const interval = setInterval(() => {
    count--;

    if (count > 0) {
      countdownEl.textContent = count;
    } else if (count === 0) {
      countdownEl.textContent = "GO";
    } else {
      clearInterval(interval);
      countdownEl.remove();
      canvas.style.display = "block";
      startSnakeGame();
    }
  }, 700);
}

/* =========================
   GAME
========================= */

function startSnakeGame() {
  const canvas = document.getElementById("snakeCanvas");
  const ctx = canvas.getContext("2d");

  const grid = 15;
  const drawSize = grid - 1; // taille visuelle réelle
  let count = 0;

  let score = 0;
  const scoreEl = document.getElementById("snakeScore");

  let snake = {
    x: 150,
    y: 150,
    dx: grid,
    dy: 0,
    cells: [],
    maxCells: 4,
  };

  let apple = randomApple();

  function randomApple() {
    return {
      x: Math.floor(Math.random() * (canvas.width / grid)) * grid,
      y: Math.floor(Math.random() * (canvas.height / grid)) * grid,
    };
  }

  function gameLoop() {
    requestAnimationFrame(gameLoop);

    if (++count < 4) return;
    count = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // déplacement
    snake.x += snake.dx;
    snake.y += snake.dy;

    // COLLISION VISUELLE EXACTE (basée sur drawSize)
    if (
      snake.x < 0 ||
      snake.x > canvas.width - drawSize ||
      snake.y < 0 ||
      snake.y > canvas.height - drawSize
    ) {
      endSnake();
      return;
    }

    // avancer
    snake.cells.unshift({ x: snake.x, y: snake.y });

    if (snake.cells.length > snake.maxCells) {
      snake.cells.pop();
    }

    // pomme
    ctx.fillStyle = "#ff4d4d";
    ctx.fillRect(apple.x, apple.y, drawSize, drawSize);

    // serpent
    ctx.fillStyle = "#7b8cff";
    snake.cells.forEach((cell, index) => {
      ctx.fillRect(cell.x, cell.y, drawSize, drawSize);

      // mange pomme
      if (cell.x === apple.x && cell.y === apple.y) {
        snake.maxCells++;
        score++;
        if (scoreEl) scoreEl.textContent = score;
        apple = randomApple();
      }

      // collision corps
      for (let i = index + 1; i < snake.cells.length; i++) {
        if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
          endSnake();
        }
      }
    });
  }

  function endSnake() {
    const overlay = document.getElementById("snakeOverlay");
    if (overlay) overlay.remove();
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" && snake.dx === 0) {
      snake.dx = -grid;
      snake.dy = 0;
    } else if (e.key === "ArrowUp" && snake.dy === 0) {
      snake.dy = -grid;
      snake.dx = 0;
    } else if (e.key === "ArrowRight" && snake.dx === 0) {
      snake.dx = grid;
      snake.dy = 0;
    } else if (e.key === "ArrowDown" && snake.dy === 0) {
      snake.dy = grid;
      snake.dx = 0;
    }
  });

  requestAnimationFrame(gameLoop);
}
/* =========================
   BURGER TOOLS MOBILE — FIX
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("burgerBtn");
  const tools = document.getElementById("toolsBar");

  if (!burger || !tools) return;

  burger.addEventListener("click", (e) => {
    e.stopPropagation();
    tools.classList.toggle("open");
  });

  // fermer si clic ailleurs
  document.addEventListener("click", (e) => {
    if (!tools.contains(e.target) && !burger.contains(e.target)) {
      tools.classList.remove("open");
    }
  });
});
