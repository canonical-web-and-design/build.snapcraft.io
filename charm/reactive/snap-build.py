from glob import glob
from re import search
from os.path import basename, dirname, join
from subprocess import check_call, check_output
from textwrap import dedent

import psycopg2

from charmhelpers.core import hookenv
from charmhelpers.core.host import restart_on_change
from charmhelpers.core.templating import render
from charms.apt import queue_install
from charms.leadership import leader_set
from charms.reactive import when, when_not, set_state
from ols.base import check_port, code_dir, logs_dir, service_name, user
from ols.http import port


SYSTEMD_CONFIG = '/lib/systemd/system/snap-build.service'
KNEXFILE_NORMAL = join(code_dir(), 'knexfile-normal.js')
KNEXFILE_ADMIN = join(code_dir(), 'knexfile-admin.js')


def get_node_env(environment):
    if environment in ('staging', 'production'):
        return 'production'
    else:
        return 'development'


def quote_identifier(identifier):
    # Fail if it's not ASCII.
    identifier.encode('US-ASCII')
    return '"{}"'.format(identifier.replace('"', '""'))


@when('db-admin.master.available')
@when('ols.configured')
@when('leadership.is_leader')
@when_not('leadership.set.migrated')
def migrate(pgsql):
    db_name = hookenv.config('db_name')
    if pgsql.master is None or pgsql.master.dbname != db_name:
        hookenv.log('Database context not available yet; skipping')
        return
    node_env = get_node_env(hookenv.config('environment'))
    render(
        source='knexfile.js.j2',
        target=KNEXFILE_ADMIN,
        context={
            'node_env': node_env,
            'db_conn': pgsql.master.uri,
        })
    # knex's migration facilities don't include granting database
    # privileges.  We don't care very deeply about fine-grained privileges
    # here, so let's just grant general query and manipulation access (but
    # not schema modification) to our roles.
    roles = hookenv.config('db_roles')
    if isinstance(roles, str):
        roles = [roles]
    con = psycopg2.connect(pgsql.master)
    with con.cursor() as cur:
        quoted_roles = ', '.join(quote_identifier(role) for role in roles)
        cur.execute(dedent('''\
            ALTER DEFAULT PRIVILEGES IN SCHEMA public
            GRANT ALL PRIVILEGES ON TABLES TO {}
            ''').format(quoted_roles))
        cur.execute(dedent('''\
            ALTER DEFAULT PRIVILEGES IN SCHEMA public
            GRANT ALL PRIVILEGES ON SEQUENCES TO {}
            ''').format(quoted_roles))
    migrate_cmd = [
        'npm', 'run', 'migrate:latest', '--',
        '--knexfile', KNEXFILE_ADMIN, '--env', node_env,
        ]
    check_call(migrate_cmd, cwd=code_dir())
    leader_set(migrated=True)


@when('leadership.set.migrated')
@when('cache.available')
@when('db.master.available')
@when('ols.pg.configured')
@when('ols.service.installed')
@restart_on_change({
    SYSTEMD_CONFIG: ['snap-build'],
    KNEXFILE_NORMAL: ['snap-build'],
    }, stopstart=True)
def configure(pgsql, cache):
    db_name = hookenv.config('db_name')
    if pgsql.master is None or pgsql.master.dbname != db_name:
        hookenv.log('Database context not available yet; skipping')
        return
    environment = hookenv.config('environment')
    session_secret = hookenv.config('session_secret')
    memcache_session_secret = hookenv.config('memcache_session_secret')
    sentry_dsn = hookenv.config('sentry_dsn')
    lp_api_username = hookenv.config('lp_api_username') or ''
    lp_api_consumer_key = hookenv.config('lp_api_consumer_key') or ''
    lp_api_token = hookenv.config('lp_api_token') or ''
    lp_api_token_secret = hookenv.config('lp_api_token_secret') or ''
    github_auth_client_id = hookenv.config('github_auth_client_id') or ''
    github_auth_client_secret = (
        hookenv.config('github_auth_client_secret') or '')
    github_webhook_secret = hookenv.config('github_webhook_secret') or ''
    http_proxy = hookenv.config('http_proxy') or ''
    trusted_networks = (hookenv.config('trusted_networks') or '').split()
    if session_secret and memcache_session_secret:
        render(
            source='knexfile.js.j2',
            target=KNEXFILE_NORMAL,
            context={
                'node_env': get_node_env(environment),
                'db_conn': pgsql.master.uri,
            })
        # XXX cjwatson 2017-03-08: Set NODE_ENV from here instead of in .env
        # files?  This may make more sense as part of entirely getting rid
        # of {staging,production}.env
        # (https://github.com/canonical-ols/build.snapcraft.io/issues/276).
        render(
            source='snap-build_systemd.j2',
            target=SYSTEMD_CONFIG,
            context={
                'working_dir': code_dir(),
                'user': user(),
                'session_secret': session_secret,
                'logs_path': logs_dir(),
                'environment': environment,
                'cache_hosts': sorted(cache.memcache_hosts()),
                'memcache_session_secret': memcache_session_secret,
                'sentry_dsn': sentry_dsn,
                'lp_api_username': lp_api_username,
                'lp_api_consumer_key': lp_api_consumer_key,
                'lp_api_token': lp_api_token,
                'lp_api_token_secret': lp_api_token_secret,
                'github_auth_client_id': github_auth_client_id,
                'github_auth_client_secret': github_auth_client_secret,
                'github_webhook_secret': github_webhook_secret,
                'knex_config_path': KNEXFILE_NORMAL,
                'http_proxy': http_proxy,
                'trusted_networks': trusted_networks,
            })
        check_call(['systemctl', 'enable', basename(SYSTEMD_CONFIG)])
        check_call(['systemctl', 'daemon-reload'])
        check_port('ols.{}.express'.format(service_name()), port())
        set_state('service.configured')
        hookenv.status_set('active', 'systemd unit configured')
    else:
        hookenv.status_set('blocked',
                           'Service requires session_secret and '
                           'memcache_session_secret to be set')


@when_not('apt.queued_installs')
def install_custom_nodejs():
    deb_path = join(dirname(dirname(__file__)), 'files', 'nodejs*.deb')
    paths = glob(deb_path)
    if paths:
        deb_path = paths[0]
        deb_pkg_version_output = check_output(['dpkg-deb', '-I', deb_path])
        deb_pkg_version = search('Version: (.*)',
                                 deb_pkg_version_output.decode('ascii'))

        installed_version_output = check_output('dpkg -s nodejs || exit 0',
                                                shell=True)
        installed = search('Version: (.*)',
                            installed_version_output.decode('ascii'))
        installed_version = installed.groups()[0] if installed else ''

        if installed_version.strip() != deb_pkg_version.groups()[0].strip():
            hookenv.log('Installed NodeJS {} != {}, installing from custom deb'
                        .format(installed_version,  deb_pkg_version))
            hookenv.status_set('maintenance', 'Installing {}'.format(deb_path))
            check_call(['apt', 'install', '-y', '--allow-downgrades', deb_path])
            hookenv.status_set('active', 'Custom NodeJs package installed')
    else:
        # Although it would be nice to let the apt layer handle all this for
        # us, we can't due to the conditional nature of installing these
        # packages *only* if the .deb file isn't used
        queue_install(['npm', 'nodejs', 'nodejs-legacy'])
