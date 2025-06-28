# Blackout Music

An open-source [online tool](https://blackoutmusic.brianfoo.com/) by [Brian Foo](https://brianfoo.com/) for creating new music by erasing old music. Read more about it on [my blog post](https://blog.brianfoo.com/blackout-music/).

## The codebase

This is a completely static web app written in "Vanilla" Javascript. The only external libraries it uses is [Tone.js](https://tonejs.github.io/) (for playing synths in the browser) and the [Tone.js MIDI](https://github.com/Tonejs/Midi) utility for loading and creating MIDI files.

No building is necessary. All interface files can be found in the [./public/](https://github.com/beefoo/blackout-music/tree/main/public) folder.

## Modifying the code

Since this is a side project, **I don't have the bandwith to guarantee feature requests or reviewing/accepting pull requests** but they will always be considered. Forking this repo and derivative works are encouraged, with proper attribution.

Running this app locally only requires Node.js. Installing and running is simple as:

```
npm install
npm start
```

## Credits

This app depends on free and open source software and public domain music.

- [Tone.js](https://tonejs.github.io/) for managing MIDI files and playing synths in the browser
- [Pixelarticons](https://github.com/halfmage/pixelarticons) and [HackerNoon](https://github.com/hackernoon/pixel-icon-library) for icons
- [VT323](https://fonts.google.com/specimen/VT323) font
- Source songs and MIDI files:
  - [Für Elise](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=931) by Ludwig van Beethoven, 1810
  - [Piano Sonata No. 16](http://piano-midi.de/mozart.htm) by Wolfgang Amadeus Mozart, 1805
  - [Rondo Alla Turca (Piano Sonata No. 11)](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=108) by Wolfgang Amadeus Mozart, 1783
  - [Moonlight Sonata (Piano Sonata No. 14)](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=276) by Ludwig van Beethoven, 1802
  - [Clair de lune (Suite bergamasque)](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1778) by Claude Debussy, 1905
  - [Nocturne in E-flat major](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1590) by Frédéric Chopin, 1832
  - [The Well-Tempered Clavier](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=5) by Johann Sebastian Bach, 1722
  - [Gymnopédie No. 1](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=37) by Erik Satie, 1888
  - [Passacaglia](https://www.freepianotutorials.net/2021/09/handel-halvorsen-passacaglia-piano.html) by Johan Halvorsen, 1894
  - [Maple Leaf Rag](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=23) by Scott Joplin, 1899
