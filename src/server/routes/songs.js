const fetch = require('node-fetch');
const router = require('express-promise-router')();
const { MusicBrainzApi } = require('musicbrainz-api');
const db = require('../db');
const fs = require('fs');
const merge = require('lodash.merge');

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
  const { artist, song, spotify_id } = req.body;
  const { rows } = await db.query('SELECT songid FROM songs WHERE artist=$1 AND title=$2', [artist, song])
    .catch((err) => {
      console.log(err);
      res.send({ result: err });
      return next();
    });

  if (rows.length === 0) {
    const newSongId = await fetch(`${process.env.FRONTEND_URI}/api/songs/createSong`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ artist, song, spotify_id })
    }).then(resp => resp.json()).then((json) => {
      const { id } = json;
      return id;
    }).catch((err) => {
      console.log(err);
    });
    res.json({ id: newSongId });
  } else {
    res.json({ id: rows[0].songid });
  }
  return next();
}

async function getMusicBrainzData(artist, album, song) {
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
  return MusicbrainzResult;
}

async function getAcousticBrainzData(MusicbrainzResult) {
  // We need the musicbrainz id to make calls to acousticbrainz
  const MusicbrainzId = MusicbrainzResult.id;
  const AcousticBrainzResult = await fetch(`${acousticbrainz}/api/v1/${MusicbrainzId}/low-level`)
    .then(resp => resp.json())
    .catch((err) => {
      console.log(err);
    });
  return AcousticBrainzResult;
}

// If a song is not found in the songs table, fetch the song data using
// MusicBrainz and AcousticBrainz
// Note that there are three possibilities for whatever song we are creating:
async function createSong(req, res, next) {
  const { artist, album, song, spotify_id } = req.body;
  const MusicbrainzResult = await getMusicBrainzData(artist, album, song);
  // 1. The song is on the streaming service we are importing from and not on MusicBrainz
  if (!MusicbrainzResult) {
    const id = await db.query('INSERT INTO songs (title, artist, misc_data) VALUES ($1, $2, $3) RETURNING songid',
      [song, artist, { album, spotify_id }]).then((result) => {
      const { rows } = result;
      const { songid } = rows[0];
      return songid;
    })
      .catch((err) => {
        console.log(err);
        res.send({ result: err });
        return next();
      });
    res.json({ id });
    return next();
  }

  const AcousticBrainzResult = await getAcousticBrainzData(MusicbrainzResult);
  AcousticBrainzResult.album = album;
  const DBRow = [MusicbrainzResult.id, song, artist, { album, spotify_id }];

  // 2. The song is on the streaming service and MusicBrainz but not on AcousticBrainz
  if (AcousticBrainzResult.message === 'Not found') {
    const id = await db.query('INSERT INTO songs (mbid, title, artist, misc_data) VALUES ($1, $2, $3, $4) RETURNING songid', DBRow)
      .then((result) => {
        const { rows } = result;
        const { songid } = rows[0];
        return songid;
      }).catch((err) => {
        console.log(err);
        res.json({ result: err });
        return next();
      });
    res.send({ id });
    return next();
  }

  // 3. The song is on the streaming service, MusicBrainz, and AcousticBrainz
  DBRow[3] = merge(DBRow[3], AcousticBrainzResult);
  const id = await db.query('INSERT INTO songs (mbid, title, artist, misc_data) VALUES ($1, $2, $3, $4) RETURNING songid', DBRow)
    .then((result) => {
      const { rows } = result;
      const { songid } = rows[0];
      return songid;
    }).catch((err) => {
      console.log(err);
      res.json({ result: err });
      return next();
    });
  res.json({ id });
  return next();
}

// import Songs from a track
router.post('/importSongs', async (req, res, next) => {
  const { playlistId } = req.body;
  const playlistTracks = await db.query("SELECT misc_data->'tracks' AS tracks FROM playlists where playlistid=$1",
    [playlistId])
    .then((x) => {
      const { rows } = x;
      const { tracks } = rows[0];
      return tracks;
    }).catch((err) => {
      console.log(err);
      res.status(500).json(err);
      return next();
    });

  const songIds = await Promise.all(playlistTracks.items.map(async (item) => {
    const { track } = item;
    const { artists, name, id } = track;
    const spotify_id = id;
    const artist = artists[0].name;
    const songId = await fetch(`${process.env.FRONTEND_URI}/api/songs/findSong`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        song: name,
        artist,
        spotify_id
      })
    })
      .then(resp => resp.json())
      .then((json) => {
        const { id } = json;
        return id;
      });
    return songId;
  }))
    .then(result => result)
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
      return next();
    });
  console.log(songIds);
  res.json({ playlistId, songIds });
  return next();
});
router.get('/getSongById/:id', getSongById);
router.post('/createSong', createSong);
router.post('/findSong', findSong);
module.exports = router;
