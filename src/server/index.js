const express = require('express');
const bodyParser = require('body-parser');
const router = require('express-promise-router')();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

const db = require('./db');

async function getUserById(req, res, next) {
  const { id } = req.params;
  const { rows } = await db.query('SELECT * FROM users where userid=$1', [id]);
  res.send(rows[0]);
  return next();
}

async function createUser(req, res, next) {
  const { username, password } = req.body;
  await db.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, password]);
  res.send(JSON.stringify({ message: `user ${username} was successfully created` }));
  return next();
}

app.use(express.static('dist'));
router.get('/api/users/getUserById/:id', getUserById);
router.post('/api/users/createUser', createUser);
app.use(router);
app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
