# Memcached entries

## `lp:url_prefix:https://github.com/:owner/`

Caches list of snaps (enabled repositories) for given GitHub user (via URL prefix).

## `lp:url:https://github.com/:owner/:name`

Caches snap data for given repository URL.

## `lp:snapcraft_data:https://github.com/:owner/:name`

Caches JSON subset of data from `snapcraft.yaml` found in given repository.
Currently it contains only a snap name.
