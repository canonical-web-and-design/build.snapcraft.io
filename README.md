# build.snapcraft.io

Snapcraft Build site.

## Local development

First, make sure all dependencies are installed:

``` bash
npm install
```

### Pre-requisites
Before you start the development site, you need to set up test accounts with **GitHub** and **Launchpad** to test with.

#### GitHub
To connect to GitHub itself, you will need to create a "client id" and "client secret" to allow the application to authenticate itself.

Go and [register a new OAuth application](https://github.com/settings/applications/new) in your GitHub account. You can fill in the form however you want, the only important detail is that you set the "Authorization callback URL" to `http://localhost:8000/auth/verify`.

Once you've created the application, you should be given the client id and the client secret. **Make a note of these**.

#### Launchpad
To connect to Launchpad, you need to set up a **username**, a **consumer key** and obtain an **API token** and an **API token secret**. Instructions for obtaining these details can be found [here](https://help.launchpad.net/API/SigningRequests).

#### Env file
To use the credentials from GitHub and Launchpad, you need to create an **env file**.

```
atom environments/dev.env
```

Paste the following into the file and fill in the missing values:

```
LP_API_USERNAME=
LP_API_CONSUMER_KEY=
LP_API_TOKEN=
LP_API_TOKEN_SECRET=
GITHUB_AUTH_CLIENT_ID=
GITHUB_AUTH_CLIENT_SECRET=
```

You should now have all the configuration necessary for starting the development site.

### Start the dev server

To start the development server:

```
npm start -- --env=environments/dev.env
```

After about 20 seconds, the web application should be available at <http://127.0.0.1:8000>.

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
