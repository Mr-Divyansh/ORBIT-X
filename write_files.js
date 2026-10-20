const fs = require('fs');

const gamesHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#fffaf5" />
  <title>Games - ORBIT-X</title>
  <link rel="icon" type="image/png" href="Assets/img/LogoMin.png" />
  <link rel="shortcut icon" type="image/png" href="Assets/img/LogoMin.png" />
  <link rel="apple-touch-icon" href="Assets/img/LogoMin.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="preload" as="image" href="Assets/img/solo gadget abhay.png" />
  <link rel="preload" as="image" href="Assets/img/solo gadget divyansh.png" />
  <script>
    (function () {
      try {
        localStorage.removeItem('orbitx-theme');
        sessionStorage.removeItem('orbitx-theme');
        document.documentElement.removeAttribute('data-theme');
      } catch (e) { /* ignore */ }
    })();
  </script>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div class="page-frame" aria-hidden="true"></div>

  <header class="navbar">
    <a class="brand" href="index.html" aria-label="Orbit-X home">
      <img src="Assets/img/Logo.png" alt="ORBIT-X logo" class="brand-logo-img" width="40" height="40" loading="eager" />
      <svg class="brand-planet" viewBox="0 0 76 58" aria-hidden="true">
        <ellipse cx="36" cy="29" rx="30" ry="11" transform="rotate(-28 36 29)" fill="none" stroke="currentColor" stroke-width="4" />
        <circle cx="34" cy="28" r="15" fill="#bca0ef" />
        <path d="M22 18c5-7 13-9 20-7" fill="none" stroke="#fff8ff" stroke-width="4" stroke-linecap="round" />
        <path d="M59 9l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#f8d889" />
      </svg>
      <span>ORBIT-X</span>
    </a>

    <div class="nav-mascot" aria-hidden="true">
      <img class="nav-sparkle" src="Assets/img/icons/sparkle-yellow.svg" alt="" width="17" height="17" />
    </div>

    <nav class="nav-links" aria-label="Main navigation">
      <a class="active" href="index.html" aria-current="page">Home</a>
      <a href="about.html">About</a>
      <a href="Exploration.html">Exploration</a>
      <a href="Story.html">Stories</a>
      <a href="credits.html">Credits</a>
      <a href="games.html" aria-current="page">Games</a>
    </nav>
    <button class="menu-toggle" aria-label="Toggle navigation" aria-expanded="false"><span></span><span></span><span></span></button>
    <button class="theme-toggle" aria-label="Switch to Dark Mode" aria-pressed="false">
      <span class="theme-icon">🌙</span>
      <span class="theme-label">Dark</span>
    </button>
  </header>

  <main id="games" class="hero" style="min-height: calc(100vh - 100px); padding-top: 100px; display:flex; justify-content:center; align-items:center;">
    <div style="text-align: center; max-width: 800px; padding: 20px;">
      <h1 style="font-size: 3rem; margin-bottom: 1rem;">ORBIT-X Games</h1>
      <p style="font-size: 1.2rem; margin-bottom: 2rem;">Explore the magical worlds and interactive experiences of ORBIT-X.</p>
      
      <div style="background: var(--bg-secondary); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align:left; display: flex; flex-direction: column;">
        <div style="height: 250px; overflow: hidden; display: flex; justify-content: center; align-items: center; background: #000;">
           <img src="Assets/img/icons/Moonlit Whimsy Bedroom Study.png" alt="Ghost Hunting" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div style="padding: 24px;">
          <span style="background: var(--primary); color: white; padding: 4px 8px; border-radius: 8px; font-weight: bold; font-size: 0.8rem; margin-bottom: 12px; display: inline-block;">GAME 1</span>
          <h2 style="margin-top: 0; font-size: 2rem; color: var(--text-primary);">Ghost Hunt</h2>
          <p style="color: var(--text-secondary); line-height: 1.5; margin-bottom: 24px;">Explore a mysterious room, discover hidden ghosts, capture them, and purify them with your enchanted staff.</p>
          <a href="ghost-hunt.html" class="button button-primary" style="display: inline-block;">Play Game →</a>
        </div>
      </div>
    </div>
  </main>
  <script src="js/themeManager.js"></script>
  <script src="js/script.js"></script>
</body>
</html>`;

fs.writeFileSync('games.html', gamesHtml, 'utf8');
console.log('games.html written');

const ghostHuntHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#fffaf5" />
  <title>Ghost Hunting - ORBIT-X</title>
  <link rel="icon" type="image/png" href="Assets/img/LogoMin.png" />
  <link rel="shortcut icon" type="image/png" href="Assets/img/LogoMin.png" />
  <link rel="apple-touch-icon" href="Assets/img/LogoMin.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script>
    (function () {
      try {
        localStorage.removeItem('orbitx-theme');
        sessionStorage.removeItem('orbitx-theme');
        document.documentElement.removeAttribute('data-theme');
      } catch (e) { /* ignore */ }
    })();
  </script>
  <link rel="stylesheet" href="css/style.css" />
  <link rel="stylesheet" href="css/ghostHunt.css" />
</head>
<body>
  <div class="page-frame" aria-hidden="true"></div>

  <header class="navbar">
    <a class="brand" href="index.html" aria-label="Orbit-X home">
      <img src="Assets/img/Logo.png" alt="ORBIT-X logo" class="brand-logo-img" width="40" height="40" loading="eager" />
      <svg class="brand-planet" viewBox="0 0 76 58" aria-hidden="true">
        <ellipse cx="36" cy="29" rx="30" ry="11" transform="rotate(-28 36 29)" fill="none" stroke="currentColor" stroke-width="4" />
        <circle cx="34" cy="28" r="15" fill="#bca0ef" />
        <path d="M22 18c5-7 13-9 20-7" fill="none" stroke="#fff8ff" stroke-width="4" stroke-linecap="round" />
        <path d="M59 9l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#f8d889" />
      </svg>
      <span>ORBIT-X</span>
    </a>

    <div class="nav-mascot" aria-hidden="true">
      <img class="nav-sparkle" src="Assets/img/icons/sparkle-yellow.svg" alt="" width="17" height="17" />
    </div>

    <nav class="nav-links" aria-label="Main navigation">
      <a href="index.html">Home</a>
      <a href="about.html">About</a>
      <a href="Exploration.html">Exploration</a>
      <a href="Story.html">Stories</a>
      <a href="credits.html">Credits</a>
      <a href="games.html">Games</a>
    </nav>
    <button class="menu-toggle" aria-label="Toggle navigation" aria-expanded="false"><span></span><span></span><span></span></button>
    <button class="theme-toggle" aria-label="Switch to Dark Mode" aria-pressed="false">
      <span class="theme-icon">🌙</span>
      <span class="theme-label">Dark</span>
    </button>
  </header>

  <link rel="stylesheet" href="css/ghostHunt.css" />
<main id="ghost-hunt-game">
  <div class="gh-hud">
    <div class="gh-title">Ghost Hunting</div>
    <div class="gh-stats">
      <div class="gh-stat"><span class="gh-label">Discovered:</span> <span id="gh-discovered">0</span> / 20</div>
      <div class="gh-stat"><span class="gh-label">Captured:</span> <span id="gh-captured">0</span> / 20</div>
      <div class="gh-stat"><span class="gh-label">Purified:</span> <span id="gh-purified">0</span> / 20</div>
    </div>
    <div class="gh-controls">
      <button id="gh-sound-btn" class="button button-secondary">Sound: OFF</button>
      <button id="gh-restart-btn" class="button button-secondary">Restart</button>
    </div>
    <div id="gh-instruction" class="gh-instruction">Pick up the lantern to explore the room.</div>
  </div>

  <div class="gh-game-area-wrapper">
    <div class="gh-game-area" id="gh-playfield">
      <img src="Assets/img/icons/Moonlit Whimsy Bedroom Study.png" alt="Bedroom Study" class="gh-bg" draggable="false" />
      
      <div id="gh-ghosts-container" class="gh-layer"></div>
      
      <div id="gh-darkness" class="gh-darkness gh-layer"></div>
      
      <div id="gh-tools-container" class="gh-layer">
        <img src="Assets/img/icons/Enchanted Amberglow Fantasy Lantern.png" alt="Lantern" id="gh-lantern" class="gh-tool" draggable="false" />
        <img src="Assets/img/icons/Enchanted Crystal Staff with Purple Runes.png" alt="Purification Staff" id="gh-staff" class="gh-tool" draggable="false" />
      </div>

      <div id="gh-ui-layer" class="gh-layer gh-ui-layer"></div>
    </div>
  </div>

  <div id="gh-victory-overlay" class="gh-victory-overlay hidden">
    <div class="gh-victory-modal">
      <h2>Room Purified!</h2>
      <p>You found and purified all <span id="gh-victory-count">0</span> ghosts.</p>
      <div class="gh-victory-actions">
        <button id="gh-play-again" class="button button-primary">Play Again</button>
        <a href="games.html" class="button button-secondary">Back to Games</a>
      </div>
    </div>
  </div>
</main>
<script src="js/themeManager.js"></script>
<script src="js/script.js"></script>
<script src="js/ghostHunt.js"></script>
</body>
</html>`;

fs.writeFileSync('ghost-hunt.html', ghostHuntHtml, 'utf8');
console.log('ghost-hunt.html written');