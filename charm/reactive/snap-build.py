from glob import glob
from re import search
from os.path import dirname, join
from subprocess import check_call, check_output

from charmhelpers.core import hookenv
from charmhelpers.core.host import restart_on_change
from charmhelpers.core.templating import render
from charms.reactive import when, when_not, set_state
from charms.apt import queue_install
from ols.base import check_port, code_dir, logs_dir, service_name, user
from ols.http import port


SYSTEMD_CONFIG = '/lib/systemd/system/snap-build.service'


@when('cache.available')
@when('ols.service.installed')
@restart_on_change({SYSTEMD_CONFIG: ['snap-build']}, stopstart=True)
def configure(cache):
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
    if session_secret and memcache_session_secret:
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
            })
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
