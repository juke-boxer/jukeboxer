const router = require('express-promise-router')();
const jwt = require('jsonwebtoken');
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
  res.send(JSON.stringify({ result: `User ${username} was successfully created.` }));
  return next();
}

router.get('/getUserById/:id', getUserById);
router.post('/createUser', createUser);

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;
  const { rows } = await db.query('SELECT * FROM users WHERE username=$1 AND password=$2', [username, password]);

  if (rows.length > 0) {
    const userRow = rows[0];
    const token = jwt.sign({ userid: userRow.userid, username: userRow.username }, 'secret');
    res.send(JSON.stringify({ result: 'success', token }));
  } else { res.send('fail'); }
  return next();
});

module.exports = router;
