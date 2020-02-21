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

async function getSongById(req, res, next) {
  const { id } = req.params;
  const { rows } = await db.query('SELECT * FROM songs WHERE songid=$1', [id])
    .catch((err) => {
      console.log(err);
      res.send({ result: err });
      return next();
    });
  res.send({ result: rows[0] });
  return next();
}

async function findSong(req, res, next) {
  const { artist, song } = req.body;
  const { rows } = await db.query('SELECT * FROM songs WHERE artist=$1 AND title=$2', [artist, song])
    .catch((err) => {
      console.log(err);
      res.send({ result: err });
      return next();
    });
  res.send({ result: rows.length > 0 });
  return next();
}

// If a song is not found in the songs table, fetch the song data using
// musicbrainz and acousticbrainz
async function createSong(req, res, next) {
  const { artist, album, song } = req.body;
  const MusicBrainzSearchResults = await mbApi.search('recording', {
    artist: artist !== undefined ? artist : '',
    release: album !== undefined ? album : '',
    recording: song
  });

  let MusicbrainzResult;
  try {
    MusicbrainzResult = MusicBrainzSearchResults.recordings[0];
  } catch {
    MusicbrainzResult = false;
  }

  if (!MusicbrainzResult) {
    const noMusicBrainzDataInsert = await db.query('INSERT INTO songs (title, artist, misc_data) VALUES ($1, $2, $3)', [song, artist, { album }])
      .catch((err) => {
        console.log(err);
        res.send({ result: err });
        return next();
      });
    res.send({ result: 'song was successfully added to the database, but was not in musicbrainz database' });
    return next();
  }

  // We need the musicbrainz id to make calls to acousticbrainz
  const MusicbrainzId = MusicbrainzResult.id;
  const AcousticBrainzResult = await fetch(`${acousticbrainz}/api/v1/${MusicbrainzId}/low-level`)
    .then(resp => resp.json())
    .catch((err) => {
      console.log(err);
      res.send({ result: err });
      return next();
    });

  const DBRow = [MusicbrainzId, song, artist, { album }];
  if (AcousticBrainzResult.message === 'Not found') {
    const noAcousticBrainzDataInsert = await db.query('INSERT INTO songs (mbid, title, artist, misc_data) VALUES ($1, $2, $3, $4)', DBRow)
      .catch((err) => {
        console.log(err);
        res.send({ result: err });
        return next();
      });
    res.send({ result: 'song was successfully added to the database, but was not in acousticbrainz database' });
    return next();
  }

  const { metadata, tonal, rhythm } = AcousticBrainzResult;
  const { chords_key, chords_scale } = tonal;
  const { tags } = metadata;
  const { danceability } = rhythm;
  const bpm = tags.bpm[0];
  const date = tags.date[0];
  const genre = tags.genre[0];
  const misc_data = {
    album, chords_scale, chords_key, danceability, bpm, date, genre
  };
  DBRow[3] = misc_data;
  const noLoveDeepWebInsert = await db.query('INSERT INTO songs (mbid, title, artist, misc_data) VALUES ($1, $2, $3, $4)', DBRow)
    .catch((err) => {
      console.log(err);
      res.send({ result: err });
      return next();
    });
  res.send({ result: 'song was successfully inserted into the database' });
  return next();
}

router.get('/getSongById/:id', getSongById);
router.post('/createSong', createSong);
router.post('/findSong', findSong);
module.exports = router;
