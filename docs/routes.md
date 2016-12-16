# Routes

## Launchpad snap management

Unless otherwise stated, routes return JSON responses of this form:

    {"status": "...", "payload": {"code": "...", "message": "..."}}

`status` may be `success` or `error`.

To create a snap:

    POST /launchpad/snaps
    Cookie: <session cookie>
    Content-Type: application/json
    Accept: application/json

    {
      "repository_url": "https://github.com/:account/:repo"
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
which it should then store in Launchpad:

    POST /launchpad/snaps/complete-authorization
    Cookie: <session cookie>
    Content-Type: application/json
    Accept: application/json

    {
      "repository_url": "https://github.com/:account/:repo",
      "discharge_macaroon": ":discharge"
    }

On success, this returns 200.

To search for an existing snap:

    GET /launchpad/snaps?repository_url=:url
    Accept: application/json

Successful responses have `status` set to `success` and `code` set to
`snap-found`; the `message` will be the URL of the snap on the Launchpad
API.
