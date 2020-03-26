require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const uuid = require('uuid/v4');
const { NODE_ENV, PORT, API_TOKEN } = require('./config')

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(express.json())

function validateBearerToken(req, res, next) {
    const apiToken = API_TOKEN
    const authToken = req.get('Authorization')

    if (!authToken || authToken.split(' ')[1] !== apiToken) {
        return res.status(401).json({ error: 'Unauthorized request' })
    }
    // move to the next middleware
    next()
}

let users = [];

app.get('/address', (req, res) => {
    res.json(users);
})

app.post('/address', validateBearerToken, (req, res) => {
  const { firstName, lastName, address1, address2, city, state, zip } = req.body;

 if(!firstName) {
     return res
       .status(400)
       .send('First Name required');
 }

 if(!lastName) {
    return res
      .status(400)
      .send('Last Name required');
}

if(!address1) {
    return res
      .status(400)
      .send('Address required');
}

if(!city) {
    return res
      .status(400)
      .send('City required');
}

if(!state || !(state.length === 2)) {
    return res
      .status(400)
      .send('State required');
}

if(!zip || !(String(zip).length === 5) || (isNaN(zip))) {
    return res
      .status(400)
      .send('Zip Code required');
}

  const id = uuid();
  const newUser = {
    id,
    firstName,
    lastName,
    address1,
    address2,
    city,
    state,
    zip
  };

  users.push(newUser);
  res.status(201).location(`http://localhost:${PORT}/address/:${id}`).json(newUser);
})


app.delete('/address/:id', validateBearerToken, (req, res) => {
    const { id } = req.params;

    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
        return res
          .status(404)
          .send('User Not Found');
    }

    users.splice(index, 1);

    res.status(204).end();
})


app.use((error, req, res, next) => {
    let message;
    if (NODE_ENV === 'production') {
        message = 'Server error';
    } else {
        console.log(error);
        message = error.message;
    }

    res.status(500).json({ error: message })
});

module.exports = app