# build.snapcraft.io

Snapcraft Build site.

## Local development

First, make sure all dependencies are installed:

``` bash
npm install
```

### Start the dev server

To start the development server:

``` bash
npm start
```

After about 20 seconds, the web application should be available at <http://127.0.0.1:8000>.

### Service layer mock

To actually test out the service, the app needs to connect to a GitHub-like API. By default, the development server is set up to look for the mock API service at <http://localhost:4000>.

You can start the mock service as follows:

```
npm run start-mock-service
```

It is possible to restart the mock service automatically when changes are made to its source files using nodemon:

`npm install nodemon -g`

Start the mock service using nodemon using the following command:

`DEBUG=express:* nodemon mocks/service/index.js`

### Connecting to GitHub

To connect to GitHub itself, you will need to create a `client_id` and `client_secret`.

Go and [register a new OAuth application](https://github.com/settings/applications/new) in your GitHub account. You can fill in the form however you want, the only important detail is that you set the "Authorization callback URL" to `http://localhost:8000/auth/verify`.

Once you've created the application, you should be given a "Client ID" and a "Client Secret".

Now pass these values, along with the correct API settings, to the development server as follows:

``` bash
export GITHUB_API_ENDPOINT="https://api.github.com"
export GITHUB_AUTH_LOGIN_URL="https://github.com/login/oauth/authorize"
export GITHUB_AUTH_VERIFY_URL="https://github.com/login/oauth/access_token"
export GITHUB_AUTH_CLIENT_ID="{your_client_id}"

GITHUB_AUTH_CLIENT_SECRET={your_client_secret} npm start
```

Now the service at <http://127.0.0.1:8000> should be able to login with any GitHub account.

## lxd container setup

To locally reproduce the ols jenkaas setup, a local lxd container can be
created on ubuntu with the python3-ols-vms package from the
ubuntuone/ols-tests PPA:

```
$ ols-vms setup [--force] build-snapcraft-io
$ ols-vms shell build-snapcraft-io
ubuntu@build-snapcraft-io:~$ git clone git://github.com/canonical-ols/build.snapcraft.io.git work
ubuntu@build-snapcraft-io:~$ cd work
ubuntu@build-snapcraft-io:~/work$ npm install
ubuntu@build-snapcraft-io:~/work$ npm test
```

## emacs

Emacs is confused if 'build.snapcraft.io' is used in the project directory
name, using 'build-snapcraft-io' restores sanity.

