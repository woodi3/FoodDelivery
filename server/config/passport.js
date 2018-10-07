const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user');
// const Employee = require('../models/employee');
const tokenKey = require('./database.js')['token'];
module.exports = function(passport){
  let opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
  let secret = tokenKey;
  opts.secretOrKey = secret;
  passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    User.getUserById(jwt_payload._id).then(user => {
      return done(null, user);
    })
    .catch(err => {
      return done(err, false);
    });
  }));
}
