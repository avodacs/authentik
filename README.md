# authentik

Express.js JWT authentication middleware

## Configuration

### JWT Options

When creating an instance of `Authentik`, the second parameter is an array of configuration options.  To pass options directly to the `jsonwebtoken` dependency, include a key of `jwtOptions` with children specific to the options listed in this package:

https://www.npmjs.com/package/jsonwebtoken

## Examples

### Built in basic username, password authentication

```js
let authentik = require('authentik');

(async () => {
  authentik.config(
    'my-secret-token',        // JWT Secret
    {
      basicAuth: {            // Basic authentication provided by Authentik
        username: 'admin',    // Expected Username
        password: 'password'  // Expected Password
      },
      jwtOptions: {           // jsonwebtoken options
        expiresIn: '1h'
      }
    }
  );

  let authenticated = await authentik.login('admin', 'password');
})();
```

If successful, the response is:

```js
{
  err: null,
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImVyaWNrIiwiaWF0IjoxNTM1NTU4NzY2LCJleHAiOjE1MzU1NjIzNjZ9.mf2txDsxaGaaO14yLOn5tX0dYl3lEhJZijZoQcoY9xU'
}
```

If unsuccessful, the response is:

```js
{
  err: 'Username and/or password invalid!',
  token: null
}
```

### Override authentication method

The default authentication method provides very basic username and password matching.  If you want to extend `Authentik` to work with your own authentication mechanism, you can override the `authenticate` method:

```js
let Authentik = require('authentik');

(async () => {
  const customAuth = (sharedSecret) => {
    return new Promise((resolve, reject) => {
      if (sharedSecret === 'lorem') {
        let data = {
          anything: 'else',
          you: 'want',
          to: 'include'
        };

        return resolve({
          err: null,
          authenticated: true,
          data
        });
      }

      return resolve({
        err: 'Total failure',
        authenticated: false
      });
    });
  };

  authentik.config(
    'my-secret-token',        // JWT Secret
    {
      jwtOptions: {           // jsonwebtoken options
        expiresIn: '1h'
      },
      customAuthenticationFunction: customAuth
    }
  );

  let authenticated = await authentik.login('lorem');
})();
```

If successful, the response is:

```js
{
  err: null,
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImVyaWNrIiwiaWF0IjoxNTM1NTU4NzY2LCJleHAiOjE1MzU1NjIzNjZ9.mf2txDsxaGaaO14yLOn5tX0dYl3lEhJZijZoQcoY9xU'
}
```

If unsuccessful, the response is:

```js
{
  err: 'Total failure',
  token: null
}
```

## Debugging

`Authentik` makes use of the `debug` package.  To include debugging output, include `DEBUG=authentik*` in your environment.

## TODO

* Full testing
