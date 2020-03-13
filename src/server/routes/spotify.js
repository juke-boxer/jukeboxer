const router = require('express-promise-router')();
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const jwt = require('jsonwebtoken');
const db = require('../db');

const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
console.log(redirect_uri);
const queryString = params => Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');

router.get('/login', async (req, res) => {
  const userID = req.query.user_id;

  const params = {
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri,
    scope: 'playlist-read-private user-read-private user-read-email',
    state: userID
  };

  res.redirect(`https://accounts.spotify.com/authorize?${queryString(params)}`);
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

  let tokens;
  try {
    tokens = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
      .then(response => response.json())
      .then((response) => {
        if (response.error !== undefined) {
          console.log(`Error: ${response.error} Desc: ${response.error_description}`);
        } else {
          return {
            spotifyAccessToken: response.access_token,
            spotifyRefreshtoken: response.refresh_token
          };
        }
      });
  } catch (err) {
    console.log(err);
    res.end('fail!');
    return next();
  }
  console.log(tokens);

  db.query('UPDATE users SET misc_data=misc_data::jsonb || $1::jsonb WHERE userid=$2',
    [JSON.stringify(tokens), userID]).then((x) => {
    console.log(x);
  }).catch((err) => {
    console.log(err);
  });

  fetch(`${process.env.FRONTEND_URI}/api/spotify/importPlaylists`, {
    method: 'POST',
    body: {
      access_token: tokens.spotifyAccessToken,
      user_id: userID
    }
  }).then((x) => {
    console.log(x);
  }).catch((err) => {
    console.log(err);
  });

  res.redirect(`${process.env.FRONTEND_URI}/playlists`);
});

router.post('/importPlaylists', async (req, res, next) => {
  const { access_token, user_id } = req.body;
  let playlists;
  try {
    playlists = await fetch('https://api.spotify.com/v1/me/playlists', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }).then((resp) => {
      resp.json();
    });
  } catch (err) {
    console.log(err);
  }
  console.log(playlists);

  let playlistsData;
  try {
    playlistsData = Promise.all(playlists.items.map((item) => {
      const { tracks } = item;
      const url = tracks.href;
      return fetch(url, {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }).then((resp) => {
        resp.json();
      });
    }));
  } catch (err) {
    console.log(err);
    res.end('fail!');
    return next();
  }

  console.log(playlistsData);
  res.end('success!');
  return next();
});

module.exports = router;
