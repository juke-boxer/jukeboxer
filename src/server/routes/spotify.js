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
      console.log(response);
      return {
        spotifyAccessToken: response.access_token,
        spotifyRefreshToken: response.refresh_token
      };
    }).catch((err) => {
      console.log(err);
      process.exit(1);
    });

  console.log('tokens v1');
  console.log(tokens);
  db.query('UPDATE users SET misc_data=misc_data::jsonb || $1::jsonb WHERE userid=$2',
    [JSON.stringify(tokens), userID]).then((x) => {
    console.log(x);
  }).catch((err) => {
    console.log(err);
    process.exit(1);
  });

  console.log('tokens v2');
  console.log(tokens.spotifyAccessToken);
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
    process.exit(1);
  });

  res.redirect(`${process.env.FRONTEND_URI}/playlists`);
});

router.post('/importPlaylists', async (req, res, next) => {
  const { access_token, user_id } = req.body;
  console.log(`access_token: ${access_token}`);
  const playlistsData = await fetch('https://api.spotify.com/v1/me/playlists', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  }).then(resp => resp.json())
    .then((resp) => {
      if (resp.error !== undefined) {
        console.log(resp.error);
        throw new Error(resp.error);
      }
      console.log(resp);
      return resp.items;
    }).catch((err) => {
      console.log(err);
      process.exit(1);
    });

  // fs.writeFileSync('spotify_playlists_test.json', playlistsData);
  /*
  const playlistsDetails = await Promise.all(playlistsData.items.map((item) => {
    const { tracks } = item;
    const url = tracks.href;
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }).then(resp => resp.json())
      .then((resp) => {
        if (resp.error) {
          console.log(resp.error);
          process.exit(1);
        }
        resp.on_spotify = true;
        return resp;
      }).catch((err) => {
        console.log(err);
        process.exit(1);
      });
  }));
  */

  /*
  db.query('INSERT INTO playlists VALUES (owner, misc_data) $1 $2',
    [user_id, playlistsDetails]).then((x) => {
    console.log(x);
  }).catch((err) => {
    console.log(err);
    process.exit(1);
  });
  */
  res.end('success!');
  return next();
});

module.exports = router;
