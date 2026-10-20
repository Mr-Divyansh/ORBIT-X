const fs = require('fs');
let c = fs.readFileSync('js/ghostHunt.js', 'utf8');

// Add interactionCircle variable
c = c.replace("const staff = document.getElementById('gh-staff');\n  const ghostsContainer = document.getElementById('gh-ghosts-container');",
  "const staff = document.getElementById('gh-staff');\n  const interactionCircle = document.getElementById('gh-interaction-circle');\n  const ghostsContainer = document.getElementById('gh-ghosts-container');");

// Add lanternX/Y variables
c = c.replace("let activeTool = null;\n  let audioCtx = null;",
  "let activeTool = null;\n  let audioCtx = null;\n  let lanternX = 5;\n  let lanternY = 80;");

// Add updateToolPositions function before initGhosts
c = c.replace("  function initGhosts() {",
  "  function updateToolPositions() {\n    lantern.style.left = 'calc(' + lanternX + '% - ' + (lantern.offsetWidth / 2) + 'px)';\n    lantern.style.top = 'calc(' + lanternY + '% - ' + (lantern.offsetHeight / 2) + 'px)';\n    interactionCircle.style.left = 'calc(' + lanternX + '% - 20px)';\n    interactionCircle.style.top = 'calc(' + lanternY + '% - 20px)';\n  }\n\n  function initGhosts() {");

// Update initGhosts to use lanternX/Y
c = c.replace("    lantern.style.transform = 'none';\n    lantern.style.left = '5%';\n    lantern.style.top = '80%';\n\n    staff.style.transform = 'none';",
  "    lanternX = 5;\n    lanternY = 80;\n    updateToolPositions();\n\n    staff.style.transform = 'none';");

// Add circle case in onPointerDown
c = c.replace("      } else if (e.target === staff) {\n        currentDragEl = staff;\n        activeTool = 'staff';\n      } else {",
  "      } else if (e.target === staff) {\n        currentDragEl = staff;\n        activeTool = 'staff';\n      } else if (e.target === interactionCircle || e.target.parentElement === interactionCircle) {\n        currentDragEl = interactionCircle;\n        activeTool = 'circle';\n      } else {");

// Add circle handling in onPointerDown drag setup
c = c.replace("      e.preventDefault();\n      initAudio();\n      const rect = currentDragEl.getBoundingClientRect();\n      const areaRect = gameArea.getBoundingClientRect();\n      const startLeft = ((rect.left - areaRect.left) / areaRect.width) * 100;\n      const startTop = ((rect.top - areaRect.top) / areaRect.height) * 100;\n      currentDragEl.style.left = startLeft + '%';\n      currentDragEl.style.top = startTop + '%';",
  "      e.preventDefault();\n      initAudio();\n      const rect = currentDragEl.getBoundingClientRect();\n      const areaRect = gameArea.getBoundingClientRect();\n      if (activeTool === 'circle') {\n        const circleCenterX = rect.left + rect.width / 2;\n        const circleCenterY = rect.top + rect.height / 2;\n        lanternX = ((circleCenterX - areaRect.left) / areaRect.width) * 100;\n        lanternY = ((circleCenterY - areaRect.top) / areaRect.height) * 100;\n        updateToolPositions();\n      } else {\n        const startLeft = ((rect.left - areaRect.left) / areaRect.width) * 100;\n        const startTop = ((rect.top - areaRect.top) / areaRect.height) * 100;\n        if (activeTool === 'lantern') {\n          lanternX = startLeft;\n          lanternY = startTop;\n        }\n      }");

// Update onPointerMove to handle circle and lantern together
c = c.replace("      currentDragEl.style.left = 'calc(' + percX + '% - ' + (currentDragEl.offsetWidth/2) + 'px)';\n      currentDragEl.style.top = 'calc(' + percY + '% - ' + (currentDragEl.offsetHeight/2) + 'px)';\n      if (activeTool === 'lantern') {\n        updateDarknessMask({x: percX, y: percY});\n        checkRevealGhosts({x: percX, y: percY});\n      } else if (activeTool === 'staff') {",
  "      if (activeTool === 'circle' || activeTool === 'lantern') {\n        lanternX = percX;\n        lanternY = percY;\n        updateToolPositions();\n      } else if (activeTool === 'staff') {\n        staff.style.left = 'calc(' + percX + '% - ' + (staff.offsetWidth/2) + 'px)';\n        staff.style.top = 'calc(' + percY + '% - ' + (staff.offsetHeight/2) + 'px)';\n      }\n\n      if (activeTool === 'lantern' || activeTool === 'circle') {\n        updateDarknessMask({x: lanternX, y: lanternY});\n        checkRevealGhosts({x: lanternX, y: lanternY});\n      } else if (activeTool === 'staff') {");

c = c.replace("        checkStaffPurify(currentDragEl.getBoundingClientRect());\n      }",
  "        checkStaffPurify(staff.getBoundingClientRect());\n      }");

// Add interactionCircle event listeners
c = c.replace("  staff.addEventListener('pointerdown', onPointerDown);\n  document.addEventListener('pointermove', onPointerMove, { passive: false });",
  "  staff.addEventListener('pointerdown', onPointerDown);\n  interactionCircle.addEventListener('pointerdown', onPointerDown);\n  document.addEventListener('pointermove', onPointerMove, { passive: false });");

c = c.replace("  staff.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });\n  document.addEventListener('touchmove', (e) => {",
  "  staff.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });\n  interactionCircle.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });\n  document.addEventListener('touchmove', (e) => {");

fs.writeFileSync('js/ghostHunt.js', c, 'utf8');
console.log('ghostHunt.js fixed successfully');