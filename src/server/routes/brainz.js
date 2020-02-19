const fetch = require('node-fetch');
const router = require('express-promise-router')();
const { MusicBrainzApi } = require('musicbrainz-api');
const db = require('../db');

const acousticbrainz = 'https://acousticbrainz.org';

const mbApi = new MusicBrainzApi({
  botAccount: {
    username: 'armv32020@gmail.com',
    password: process.env.BRAINZ_PASSWORD
  },
  baseUrl: 'https://musicbrainz.org',
  appName: 'jukeboxer',
  appVersion: '0.1.0',
  appMail: 'armv32020@gmail.com'
});

// If a song is not found in the songs table, fetch the song data using
// musicbrainz and acousticbrainz
async function findSong(req, res, next) {
  const { artist, album, song } = req.body;
  const songSearchResults = await mbApi.search('recording', {
    artist: artist !== undefined ? artist : '',
    release: album !== undefined ? album : '',
    recording: song
  });

  let MusicbrainzResult;
  try {
    MusicbrainzResult = songSearchResults.recordings[0];
  } catch {
    MusicbrainzResult = false;
  }

  if (!MusicbrainzResult) {
    res.send({ result: 'song is not in musicbrainz database' });
    return next();
  }

  // We need the musicbrainz id to make calls to acousticbrainz
  const MusicbrainzId = MusicbrainzResult.id;
  fetch(`${acousticbrainz}/api/v1/${MusicbrainzId}/high-level`)
    .then(resp => resp.json())
    .then((j) => {
      res.send({ result: j });
      return next();
    });
}

router.post('/findSong', findSong);
module.exports = router;
