const router = require('express-promise-router')();
const db = require('../db');

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

async function login(req, res, next) {
  const { username, password } = req.body;
  const { rows } = await db.query('SELECT * FROM users WHERE username=$1 AND password=$2', [username, password]);

  if (rows.length > 0) {
    res.send('success');
  } else { res.send('fail'); }

  return next();
}

router.get('/getUserById/:id', getUserById);
router.post('/createUser', createUser);
router.post('/login', login);

module.exports = router;
