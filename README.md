# build.snapcraft.io
Snapcraft Build site.

## Service layer mock
A mock service is bundled with this project to replace the GitHub API when running on development platforms. To start the mock service, run the following command:

```
npm run start-mock-service
```

It is possible to restart the mock service automatically when changes are made to its source files using nodemon:

`npm install nodemon -g`

Start the mock service using nodemon using the following command:

`DEBUG=express:* nodemon mocks/service/index.js`

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
