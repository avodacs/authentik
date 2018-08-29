const debug = require('debug')('authentik:authentik');
const jwt = require('jsonwebtoken');

class Authentik {
  /**
   * Creates an instance of Authentik.
   * @param {String} secret Secret token for JWT
   * @param {Array} options Options for Authentik and dependencies
   * @memberof Authentik
   */
  constructor(secret, options) {
    debug('created instance of Authentik');

    this.secret = secret;
    this.options = options || [];
  }

  /**
   * Authenticate username and password.  Should be overridden for custom
   * authentication mechanisms.
   *
   * @param {String} username Username to authenticate
   * @param {String} password Password to authenticate
   * @returns
   * @memberof Authentik
   */
  authenticate(username, password) {
    debug(`authenticating '${username}'`);

    return new Promise((resolve, reject) => {
      // Basic checks to make sure configuration is good
      if (this.options.basicAuth === undefined) {
        debug('basic authentication is not configured');

        return reject({
          err: 'Basic authentication not configured!',
          authenticated: false,
          data: null
        });
      }

      if (this.options.basicAuth.username === undefined || this.options.basicAuth.password === undefined) {
        debug('basic authentication is not configured');

        return reject({
          err: 'Basic authentication not configured!',
          authenticated: false,
          data: null
        });
      }

      if (username === this.options.basicAuth.username && password === this.options.basicAuth.password) {
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
  }

  /**
   * Login a user, based on username and password.  Handles authentication
   * via the authenticate method.
   *
   * @param {String} username Username to authenticate
   * @param {*} password Password to authenticate
   * @returns
   * @memberof Authentik
   */
  login(username, password) {
    debug('login method called');

    return new Promise(async (resolve, reject) => {
      let authenticated = await this.authenticate(username, password);

      if (authenticated.authenticated) {
        debug('user is authenticated');

        let options = this.options.jwtOptions;

        let token = await this.sign(authenticated.data, this.secret, options);

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
  }

  /**
   * Create JWT
   *
   * @param {*} data
   * @param {String} secret Secret token for JWT
   * @param {*} options Options for jsonwebtoken
   * @returns
   * @memberof Authentik
   */
  sign(data, secret, options) {
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
  }

  verify() {

  }
}

module.exports = Authentik;
