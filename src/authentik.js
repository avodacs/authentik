const debug = require('debug')('authentik:authentik');
const jwt = require('jsonwebtoken');

let authenticate = null;
let _secret = null;
let _options = [];

/**
 * Configure Authentik
 *
 * @param {String} secret JWT Secret Token
 * @param {Array} options Options for Authentik and jsonwebtoken
 */
const config = (secret, options) => {
  debug('configured Authentik');
  _secret = secret;
  _options = options;

  if (options.customAuthenticationFunction) {
    debug('loading custom auth');
    authenticate = options.customAuthenticationFunction;
  } else {
    debug('using default auth');
    authenticate = defaultAuthenticate;
  }
};

/**
 * Authentication handler for username and password.  Override for custom
 * authentication requirements.
 *
 * @param {String} username Username to verify
 * @param {String} password Password to verify
 * @returns
 */

const defaultAuthenticate = (username, password) => {
  debug(`authenticating '${username}'`);

  return new Promise((resolve, reject) => {
    // Basic checks to make sure configuration is good
    if (_options.basicAuth === undefined) {
      debug('basic authentication is not configured');

      return reject({
        err: 'Basic authentication not configured!',
        authenticated: false,
        data: null
      });
    }

    if (_options.basicAuth.username === undefined || _options.basicAuth.password === undefined) {
      debug('basic authentication is not configured');

      return reject({
        err: 'Basic authentication not configured!',
        authenticated: false,
        data: null
      });
    }

    if (username === _options.basicAuth.username && password === _options.basicAuth.password) {
      debug('user is authenticated!');

      let data = {
        username
      };

      return resolve({
        err: null,
        authenticated: true,
        data
      });
    }

    return resolve({
      err: 'Username and/or password invalid!',
      authenticated: false,
      data: null
    });
  });
};

/**
 * Creates JWT
 *
 * @param {*} data JWT Data
 * @param {String} secret JWT Secret Token
 * @param {Array} options Options for jsonwebtoken
 * @returns
 */
const sign = (data, secret, options) => {
  return new Promise((resolve, reject) => {
    debug('creating jwt');

    jwt.sign(data, secret, options, (err, token) => {
      if (err) {
        debug(err.message);

        return reject(err);
      }

      debug('returning token');
      return resolve(token);
    });
  });
};

/**
 * Login a user, based on username and password.  Handles authentication
 * via the authenticate method.
 *
 * @param {String} username Username to authenticate
 * @param {String} password Password to authenticate
 * @returns
 */
const login = (username, password) => {
  debug('login method called');

  return new Promise(async (resolve, reject) => {
    let authenticated = await authenticate(username, password);

    if (authenticated.authenticated) {
      debug('user is authenticated');

      let options = _options.jwtOptions;

      let token = await sign(authenticated.data, _secret, options);

      return resolve({
        err: null,
        token
      });
    }

    debug('user is not authenticated');
    return resolve({
      err: authenticated.err,
      token: null
    });
  });
};

/**
 * Express middleware to provide authentication
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
const verify = (req, res, next) => {
  debug('verifying token');

  let authorization = req.headers.authorization;

  if (authorization === undefined) {
    debug('authorization token does not exist');

    return res.status(401).json({
      message: 'Authorization failed'
    });
  }

  debug('splitting token into type, token');
  let [type, token] = authorization.split(' ');

  if (type === 'Bearer' && token !== undefined) {
    debug('token exists, checking for validity');

    jwt.verify(token, _secret, (err, decodedToken) => {
      if (err) {
        switch (err.name) {
          case 'TokenExpiredError':
            debug('token is expired');

            return res.status(401).json({
              message: 'Token is expired'
            });
            break;
          default:
            debug('authorization failed');

            return res.status(401).json({
              message: 'Authorization failed'
            });
            break;
        }
      } else {
        debug('authorization succeeded');
        // embed token details in request
        req.authentik = {
          decodedToken
        };

        return next();
      }
    });
  }
};

module.exports = {
  authenticate,
  config,
  login,
  sign,
  verify
};
