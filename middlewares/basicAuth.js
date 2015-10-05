/*jshint node:true */

var basicAuth = require('basic-auth');
var sha1      = require('sha1');

/**
 * basicAuth middleware for Express 4
 * @param  {Object} config ezVIS settings (containing access key. Or not)
 * @return {function}      Express 4 middleware requiring the given credentials
 */
module.exports = function(config) {
  var access = config.get('access');
  // When no access constraint, go to the next middleware
  if (!access) return function(req, res,next) { next(); };

  return function(req, res, next) {
    var sendAuthorizationRequired = function () {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        res.sendStatus(401);
    };

    var user = basicAuth(req);
    // Authorize local:/// protocol (for corpusFields)
    if (!user) {
      if (!req.headers['x-forwarded-for'] && req.ip === "127.0.0.1") {
        return next();
      }
    }
    if (!user || user.name !== access.login) {
      return sendAuthorizationRequired();
    }
    if (access.plain && user.pass !== access.plain) {
      return sendAuthorizationRequired();
    }
    if (access.sha1 && sha1(user.pass) !== access.sha1) {
      return sendAuthorizationRequired();
    }
    next();
  };
};
