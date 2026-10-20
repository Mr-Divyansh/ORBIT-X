/* ORBIT-X — The Ghost Purificators (story2.html) — scene engine.
 * Renders the seven-scene story into #storyGrid and drives the scene
 * controls: prevBtn, sceneDots, nextBtn, replayBtn, currentCount.
 * Artwork: Assets/img/S2 S{n}.png
 */

(function () {
  'use strict';

  // --- State ----------------------------------------------------------------
  let current = 0;

  // --- Scene library (artwork: Assets/img/S2 S{n}.png) ----------------------
  const SCENES = [
    {
      num: 1, title: 'The Haunted Mansion', setting: 'A bell tower that forgot the hour',
      body: [
        'For as long as anyone could remember, the White Ash Mansion had sat at the end of a road that only appeared after rain. No one in the village could say who lived there, and fewer still would swear they had ever seen a soul inside.',
        'Abhay and Divyansh pushed open the front door on a Tuesday afternoon and stopped breathing.'
      ],
      art: 'Assets/img/S2 S1.png'
    },
    {
      num: 2, title: 'A Memory in the Keyhole', setting: 'The foyer, dust and gold light',
      body: [
        'When the last of the dust settled, the air inside the mansion was not cold. It was warm, and it carried a smell like rain on hot stone.',
        'Hanging from the hall table was a brass key, tarnished green, resting on a child\u2019s drawing of a star.'
      ],
      art: 'Assets/img/S2 S2.png'
    },
    {
      num: 3, title: 'The Lost Spirit', setting: 'The study, a door left open',
      body: [
        'From the next room came a sound that was not quite a voice and not quite the wind. It was a sigh, repeated, like someone trying to remember how to speak.',
        'Abhay stepped forward slowly. Divyansh kept one hand on his lantern.'
      ],
      art: 'Assets/img/S2 S3.png'
    },
    {
      num: 4, title: 'Echoes of the House', setting: 'A corridor of cracked wallpaper',
      body: [
        'The spirit showed them the wall, the one the morning light never reached. For years it had held a memory too heavy to name, a promise made and quietly forgotten.',
        'The more the house tried to keep the secret, the louder the secret knocked back.'
      ],
      art: 'Assets/img/S2 S4.png'
    },
    {
      num: 5, title: 'Gentle Attention', setting: 'The top landing, quiet and still',
      body: [
        'They did not argue. They did not chase. They simply sat on the floor and let the silence build around them, until the house felt it had been heard.',
        'A long moment passed. Then the air went still.'
      ],
      art: 'Assets/img/S2 S5.png'
    },
    {
      num: 6, title: 'Peace Comes Back', setting: 'The library, the final door',
      body: [
        'The spirit stepped through the doorway and into the light, not with a rush, but with a long exhale.',
        'Someone was left at the top of the stairs. Someone, and a memory.',
        'The mansion did not need to be emptied. It needed to be let go.'
      ],
      art: 'Assets/img/S2 S6.png'
    },
    {
      num: 7, title: 'The Observer', setting: 'The garden, first light',
      body: [
        'By the time the sun came up, the mansion stood quiet again, and the road had not appeared.',
        'Abhay and Divyansh slipped out, the lantern low. The spirits of the house were at peace, and the night was over.',
        'Every ghost, they agreed, just needs someone to remember them long enough to let go.'
      ],
      art: 'Assets/img/S2 S7.png'
    }
  ];

  // --- DOM refs ------------------------------------------------------------
  const storyGrid = document.getElementById('storyGrid');
  const sceneDots = document.getElementById('sceneDots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const replayBtn = document.getElementById('replayBtn');
  const currentCount = document.getElementById('currentCount');

  // --- Render --------------------------------------------------------------
  function render() {
    storyGrid.innerHTML = '';
    sceneDots.innerHTML = '';

    SCENES.forEach(function (scene, i) {
      const card = document.createElement('article');
      card.className = 'scene-card' + (i === current ? ' selected' : '');
      card.setAttribute('aria-label', 'Scene ' + scene.num + ' of ' + SCENES.length + ': ' + scene.title);

      const imageWrap = document.createElement('div');
      imageWrap.className = 'scene-image-wrap';
      const image = document.createElement('img');
      image.className = 'scene-image';
      image.src = scene.art;
      image.alt = scene.title + ' artwork';
      imageWrap.appendChild(image);

      const number = document.createElement('div');
      number.className = 'scene-number';
      number.textContent = String(scene.num).padStart(2, '0');
      imageWrap.appendChild(number);

      const content = document.createElement('div');
      content.className = 'scene-content';

      const kicker = document.createElement('p');
      kicker.className = 'scene-kicker';
      kicker.textContent = 'Scene ' + String(scene.num).padStart(2, '0');
      content.appendChild(kicker);

      const h3 = document.createElement('h3');
      h3.textContent = scene.title;
      content.appendChild(h3);

      const setting = document.createElement('p');
      setting.textContent = scene.setting;
      content.appendChild(setting);

      scene.body.forEach(function (paragraph) {
        const p = document.createElement('p');
        p.textContent = paragraph;
        content.appendChild(p);
      });

      const footer = document.createElement('div');
      footer.className = 'scene-footer';
      const prevHint = document.createElement('span');
      prevHint.textContent = 'Previous' + (i === 0 ? ' (start)' : ' (back)');
      const nextHint = document.createElement('span');
      nextHint.textContent = (i === SCENES.length - 1 ? ' (end)' : ' next') + ' Scene';
      footer.appendChild(prevHint);
      footer.appendChild(nextHint);

      card.appendChild(imageWrap);
      card.appendChild(content);
      card.appendChild(footer);
      storyGrid.appendChild(card);
    });

    // Dots
    SCENES.forEach(function (scene, i) {
      const dot = document.createElement('button');
      dot.className = 'dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to scene ' + scene.num);
      dot.textContent = String(scene.num).padStart(2, '0');
      dot.addEventListener('click', function () {
        current = i;
        render();
        updateCounts();
      });
      sceneDots.appendChild(dot);
    });

    updateCounts();
  }

  function updateCounts() {
    currentCount.textContent = String(current + 1).padStart(2, '0');
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === SCENES.length - 1;

    document.querySelectorAll('.dot').forEach(function (dot, i) {
      dot.classList.toggle('active', i === current);
    });
    document.querySelectorAll('.scene-card').forEach(function (card, i) {
      card.classList.toggle('selected', i === current);
    });
  }

  function goPrev() {
    if (current > 0) {
      current -= 1;
      render();
      updateCounts();
    }
  }

  function goNext() {
    if (current < SCENES.length - 1) {
      current += 1;
      render();
      updateCounts();
    }
  }

  function replay() {
    current = 0;
    render();
    updateCounts();
  }

  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);
  replayBtn.addEventListener('click', replay);

  render();
})();
