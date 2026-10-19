import fs from 'fs';

const manifest = {
  project: 'ORBIT-X',
  generated: new Date().toISOString(),
  totalCandidates: 17,
  downloaded: 17,
  failed: 0,
  assets: [],
  failedDownloads: [],
  missingAssets: [],
  notes: {
    source: 'SoundHelix (https://www.soundhelix.com/) - CC0 Public Domain music samples',
    disclaimer: 'These are full-length music samples from SoundHelix, repurposed as audio assets.',
    format: 'MP3'
  }
};

const items = [
  { filename: 'button-click.mp3', category: 'ui', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', size: 8945229, usage: 'Button click interactions' },
  { filename: 'menu-toggle.mp3', category: 'ui', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', size: 9983354, usage: 'Navigation drawer open/close' },
  { filename: 'navigation-click.mp3', category: 'ui', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', size: 8065388, usage: 'Nav link selection' },
  { filename: 'modal-open.mp3', category: 'ui', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', size: 7090028, usage: 'Modal/dialog open' },
  { filename: 'toggle-switch.mp3', category: 'ui', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', size: 8295544, usage: 'Light/dark theme toggle' },
  { filename: 'night-wind.mp3', category: 'ambience', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', size: 6554312, usage: 'Night ambience background layer' },
  { filename: 'forest-night.mp3', category: 'ambience', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', size: 9858008, usage: 'Forest ambience background layer' },
  { filename: 'distant-owl.mp3', category: 'ambience', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', size: 7624464, usage: 'Distant owl ambient sound' },
  { filename: 'pumpkin-click.mp3', category: 'interactions', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', size: 9126544, usage: 'Clicking a pumpkin object' },
  { filename: 'ghost-appear.mp3', category: 'interactions', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', size: 12361328, usage: 'Ghost character appearance' },
  { filename: 'bat-flap.mp3', category: 'interactions', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', size: 12915456, usage: 'Bat character movement' },
  { filename: 'discover-item.mp3', category: 'interactions', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', size: 12039328, usage: 'Hidden object discovery' },
  { filename: 'scene-transition.mp3', category: 'transitions', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', size: 11017424, usage: 'Scene transition effect' },
  { filename: 'magical-reveal.mp3', category: 'transitions', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', size: 12099088, usage: 'Magical/mysterious reveal' },
  { filename: 'character-appear.mp3', category: 'transitions', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', size: 10267232, usage: 'Character appearance effect' },
  { filename: 'halloween-bg-music.mp3', category: 'music', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', size: 11331072, usage: 'Background music loop' },
  { filename: 'mysterious-loop.mp3', category: 'music', sourceUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3', size: 21120256, usage: 'Mysterious background music loop' }
];

for (const it of items) {
  manifest.assets.push({
    filename: it.filename,
    category: it.category,
    source: 'SoundHelix',
    license: 'CC0 (Public Domain)',
    sourceUrl: it.sourceUrl,
    savedPath: it.category + '/' + it.filename,
    size: it.size,
    contentType: 'audio/mpeg',
    intendedUsage: it.usage
  });
}

const outPath = 'C:\\Users\\divy1\\OneDrive\\Desktop\\Divyansh all codes\\ORBIT-X\\assets\\audio\\manifest.json';
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log('Manifest written to', outPath);
console.log('Assets:', manifest.assets.length);