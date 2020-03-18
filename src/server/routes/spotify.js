const router = require('express-promise-router')();
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const qs = require('querystring');
const db = require('../db');

const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
console.log(redirect_uri);
router.get('/login', async (req, res) => {
  const userID = req.query.user_id;

  const params = {
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri,
    scope: 'playlist-read-private user-read-private user-read-email',
    state: userID
  };

  res.redirect(`https://accounts.spotify.com/authorize?${qs.stringify(params)}`);
});

router.get('/callback', async (req, res, next) => {
  const code = req.query.code || null;
  const userID = req.query.state;

  const params = new URLSearchParams();
  params.append('code', code);
  params.append('redirect_uri', redirect_uri);
  params.append('grant_type', 'authorization_code');
  params.append('client_id', process.env.SPOTIFY_CLIENT_ID);
  params.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET);
  console.log(params);

  const tokens = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
    .then(response => response.json())
    .then((response) => {
      if (response.error !== undefined) {
        console.log(`Error: ${response.error} Desc: ${response.error_description}`);
        throw new Error(response.error);
      }
      return {
        spotifyAccessToken: response.access_token,
        spotifyRefreshToken: response.refresh_token
      };
    }).catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
      return next();
    });

  console.log(tokens);
  console.log(userID);
  db.query('UPDATE users SET misc_data=misc_data::jsonb || $1::jsonb WHERE userid=$2',
    [JSON.stringify(tokens), userID])
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
      return next();
    });

  fetch(`${process.env.FRONTEND_URI}/api/spotify/importPlaylists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: tokens.spotifyAccessToken,
      user_id: userID
    })
  }).then((resp) => {
    console.log(resp);
  }).catch((err) => {
    console.log(err);
    res.status(500).json({ error: err });
    return next();
  });

  res.redirect(`${process.env.FRONTEND_URI}/playlists`);
});


router.post('/importPlaylists', async (req, res, next) => {
  const { access_token, user_id } = req.body;
  const playlistsData = await fetch('https://api.spotify.com/v1/me/playlists?limit=5', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  }).then(resp => resp.json())
    .then((resp) => {
      if (resp.error !== undefined) {
        console.log(resp.error);
        throw new Error(resp.error);
      }
      return resp.items;
    }).catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
      return next();
    });

  const playlistIds = await Promise.all(playlistsData.map(p => db.query('INSERT INTO playlists (ownerid, title, description, misc_data) VALUES ($1, $2, $3, $4) RETURNING playlistid',
    [user_id, p.name, p.description, JSON.stringify({ on_spotify: true })])
    .then((result) => {
      const { rows } = result;
      return rows[0].playlistid;
    })))
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });

  const playlistsDataWithIds = playlistsData.map((item, i) => ({
    ...item,
    jukeboxer_id: playlistIds[i]
  }));

  const playlistsTracks = await Promise.all(playlistsDataWithIds.map(async (item) => {
    const { jukeboxer_id, tracks } = item;
    const url = `${tracks.href}?limit=5`;
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }).then(resp => resp.json())
      .then((resp) => {
        if (resp.status === 500) {
          console.log(resp.error);
          res.status(500).json(resp.error);
          return next();
        }
        resp.jukeboxer_id = jukeboxer_id;
        return resp;
      }).catch((err) => {
        console.log(err);
        res.status(500).json({ error: err });
        return next();
      });
  }));

  await Promise.all(playlistsTracks.map(async (p) => {
    await db.query('UPDATE playlists SET misc_data=misc_data::jsonb || $1::jsonb WHERE playlistid=$2',
      [JSON.stringify({ tracks: p }), p.jukeboxer_id]).then((x => console.log(x)));
  })).catch((err) => {
    console.log(err);
    res.status(500).json({ error: err });
    return next();
  });

  const songsIds = await Promise.all(playlistsTracks.map(async (t) => {
    await fetch(`${process.env.FRONTEND_URI}/api/songs/importSongs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        access_token,
        user_id,
        playlistId: t.jukeboxer_id
      })
    })
      .then((resp) => {
        if (resp.error) {
          console.log(resp.error);
          res.status(500).json(resp.error);
          return next();
        }
        return resp;
      }).catch((err) => {
        console.log(err);
        res.status(500).json(err);
        return next();
      });
  }));
  console.log(songsIds);

  /*
  await Promise.all(songsIds.map((songsArrays) => {
    const { playlistId, songIds } = songsArrays;
    db.query('UPDATE playlists SET songsList=$1 WHERE playlistid=$2', [`{${songIds.join(',')}}`, playlistId])
      .then((x) => {
        console.log(x);
      });
  })).catch((err) => {
    console.log(err);
    res.status(500).json(err);
    return next();
  });
  */
  res.json({ message: 'successfully imported the playlists!' });
  return next();
});

module.exports = router;
