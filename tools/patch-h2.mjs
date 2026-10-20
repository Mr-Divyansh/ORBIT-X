// HTML patch 2: unique meta description + canonical + Open Graph per page.
import fs from 'node:fs';
const BASE = 'https://orbit-x-brown.vercel.app/';
const IMG = BASE + 'Assets/img/HomePage.jpeg';

const PAGES = {
  'index.html': {
    title: 'ORBIT-X — Two Friends, One Magical World',
    desc: 'ORBIT-X is a magical Halloween universe by two friends — Abhay and Divyansh. Read stories, explore the universe, and play friendly ghost games about kindness and courage.'
  },
  'about.html': {
    title: 'Meet the Magic | ORBIT-X',
    desc: 'Meet Abhay and Divyansh — the Ghost Purificators of ORBIT-X — and the magical gadgets, mission, and friendship behind the universe.'
  },
  'credits.html': {
    title: 'ORBIT-X — Credits',
    desc: 'The people, artwork, sounds, and tools behind the ORBIT-X Halloween storytelling universe.'
  },
  'Exploration.html': {
    title: 'ORBIT-X Exploration: My Projects',
    desc: 'Explore the ORBIT-X universe — three missions, three stories, and the projects of two friends who help children and friendly ghosts.'
  },
  'games.html': {
    title: 'Games - ORBIT-X',
    desc: 'Play ORBIT-X games — start with Ghost Hunt: explore a darkened room with your lantern, discover hidden ghosts, capture and purify them.'
  },
  'ghost-hunt.html': {
    title: 'Ghost Hunting - ORBIT-X',
    desc: 'Ghost Hunt — an ORBIT-X game. Light the room with your lantern, discover and capture 20 hidden ghosts, and purify them with the crystal staff.'
  },
  'login.html': {
    title: 'Login | ORBIT-X',
    desc: 'Sign in to ORBIT-X and continue your magical Halloween adventure.'
  }
};

let fails = 0;
for (const [file, meta] of Object.entries(PAGES)) {
  let t = fs.readFileSync(file, 'utf8');
  if (t.includes('<meta name="description"')) { console.log('skip desc ' + file); }
  else {
    const inject =
      '\n  <meta name="description" content="' + meta.desc + '" />' +
      '\n  <link rel="canonical" href="' + BASE + file + '" />' +
      '\n  <meta property="og:title" content="' + meta.title + '" />' +
      '\n  <meta property="og:description" content="' + meta.desc + '" />' +
      '\n  <meta property="og:type" content="website" />' +
      '\n  <meta property="og:url" content="' + BASE + file + '" />' +
      '\n  <meta property="og:image" content="' + IMG + '" />';
    if (!t.includes('</title>')) { console.error('no title ' + file); fails++; continue; }
    t = t.replace('</title>', '</title>' + inject);
  }
  fs.writeFileSync(file, t, 'utf8');
  console.log('meta ok ' + file);
}

// Story.html + project pages: canonical/og:url only (Story already has a
// description + og block; project pages get full metadata).
for (const f of ['projects/dream-guardians.html', 'projects/ghost-catchers.html',
  'projects/halloween-helpers.html']) {
  let t = fs.readFileSync(f, 'utf8');
  if (!t.includes('<meta name="description"')) {
    const names = {
      'projects/dream-guardians.html': ['Hexa Baby: Dream Guardians | ORBIT-X', 'When nightmares trap little dreamers, the ORBIT-X guardians step inside dreams and guide children safely back to warm, happy sleep.'],
      'projects/ghost-catchers.html': ['Ghost Catchers: Spirit Purification | ORBIT-X', 'Find wandering spirits, understand what keeps them here, capture them gently, and purify their energy so they can rest in peace.'],
      'projects/halloween-helpers.html': ['Halloween Helpers | ORBIT-X', 'On Halloween night, Abhay and Divyansh bring costumes, treats, and kindness to the kids and streets that always get skipped over.']
    }[f];
    t = t.replace('</title>', '</title>' +
      '\n  <meta name="description" content="' + names[1] + '" />' +
      '\n  <link rel="canonical" href="' + BASE + f + '" />' +
      '\n  <meta property="og:title" content="' + names[0] + '" />' +
      '\n  <meta property="og:description" content="' + names[1] + '" />' +
      '\n  <meta property="og:type" content="article" />' +
      '\n  <meta property="og:url" content="' + BASE + f + '" />' +
      '\n  <meta property="og:image" content="' + IMG + '" />');
    fs.writeFileSync(f, t, 'utf8');
  }
  console.log('meta ok ' + f);
}

// Story.html: canonical + absolute og:url/image (og:image was a placeholder
// SVG; point it at real artwork).
{
  const f = 'Story.html';
  let t = fs.readFileSync(f, 'utf8');
  if (!t.includes('rel="canonical"')) {
    t = t.replace('</title>', '</title>\n  <link rel="canonical" href="' + BASE + 'Story.html" />');
  }
  t = t.split('content="Assets/img/story/forgotten-treats/story-01-night.svg"')
    .join('content="' + BASE + 'Assets/img/HomePage.jpeg"');
  fs.writeFileSync(f, t, 'utf8');
  console.log('meta ok ' + f);
}

if (fails) process.exit(1);
console.log('H2 DONE');
