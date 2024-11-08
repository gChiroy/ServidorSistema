const passport = require('passport');
const { Strategy } = require('passport-jwt');
const { SECRET } = require('../constants');
const db = require('../db');
const Users = require('../models/Users')
const { config } = require ('dotenv')
config();

//const secret = process.env.SECRET;
const secret = "secret";

const cookieExtractor = function (req) {
  let token = null;
  if (req && req.cookies) token = req.cookies['token'];
  return token;
};

const opts = {
  secretOrKey: secret,
  jwtFromRequest: cookieExtractor,
};

passport.use(
  new Strategy(opts, async ({ id }, done) => {
    try {
      const user = await Users.findByPk(id, { attributes: ['user_id', 'users', 'rol'] });

      if (!user) {
        throw new Error('401 not authorized');
      }

      return done(null, user);
    } catch (error) {
      console.log(error.message);
      done(null, false);
    }
  })
);

module.exports = passport;