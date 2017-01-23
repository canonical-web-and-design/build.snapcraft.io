# Routes

## Launchpad snap management

Unless otherwise stated, routes return JSON responses of this form:

    {"status": "...", "payload": {"code": "...", "message": "..."}}

`status` may be `success` or `error`.

To create a snap:

    POST /api/launchpad/snaps
    Cookie: <session cookie>
    Content-Type: application/json
    Accept: application/json

    {
      "repository_url": "https://github.com/:owner/:name"
    }

On success, returns:

    HTTP/1.1 201 OK
    Content-Type: application/json

    {
      "status": "success",
      "payload": {
        "code": "snap-created",
        "message": ":caveat-id"
      }
    }

The caller should proceed to authorize the snap using an OpenID exchange,
using `:caveat-id` as the parameter to the Macaroon extension.  If
successful, the result of this OpenID exchange will be a discharge macaroon,
which the `/login/verify` handler will store in Launchpad.

To search for an existing snap:

    GET /api/launchpad/snaps?repository_url=:url
    Accept: application/json

Successful responses have `status` set to `success` and `code` set to
`snap-found`; the `message` will be the URL of the snap on the Launchpad
API.

To search for snap builds:

    GET /api/launchpad/builds?snap_link=:snap
    Accept: application/json

On success, returns the following, where the items in `builds` are
[snap\_build entries](https://launchpad.net/+apidoc/devel.html#snap_build)
as returned by the Launchpad API:

    HTTP/1.1 200 OK
    Content-Type: application/json

    {
      "status": "success",
      "payload": {
        "code": "snap-builds-found",
        "builds": [
          ...
        ]
      }
    }

To request builds of an existing snap:

    POST /api/launchpad/snaps/request-builds
    Cookie: <session cookie>
    Content-Type: application/json
    Accept: application/json

    {
      "repository_url": "https://github.com/:owner/:name"
    }

On success, returns the following, where the items in `builds` are
[snap\_build entries](https://launchpad.net/+apidoc/devel.html#snap_build)
as returned by the Launchpad API:

    HTTP/1.1 201 Created
    Content-Type: application/json

    {
      "status": "success",
      "payload": {
        "code": "snap-builds-requested",
        "builds": [
          ...
        ]
      }
    }
