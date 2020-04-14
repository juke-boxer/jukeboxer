const express = require('express');
const bodyParser = require('body-parser');
const router = require('express-promise-router')();
const path = require('path');
const userRoutes = require('./routes/users');
const songRoutes = require('./routes/songs');
const spotifyRoutes = require('./routes/spotify');
const playlistRoutes = require('./routes/playlists');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('dist'));

router.use('/api/users', userRoutes);
router.use('/api/songs', songRoutes);
router.use('/api/spotify', spotifyRoutes);
router.use('/api/playlists', playlistRoutes);

router.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

app.use(router);
app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
