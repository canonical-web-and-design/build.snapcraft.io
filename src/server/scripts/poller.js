import moment from 'moment';
import raven from 'raven';

import logging from '../logging';
import { conf } from '../helpers/config';
import db from '../db';
import {
  getGitHubRepoUrl,
  parseGitHubRepoUrl
} from '../../common/helpers/github-url';
import {
  internalFindSnap,
  internalGetSnapBuilds,
  internalGetSnapcraftYaml,
  internalRequestSnapBuilds
} from '../handlers/launchpad';
import { getDefaultBranch } from '../handlers/github';
import requestGitHub from '../helpers/github';

const logger = logging.getLogger('poller');
raven.config(conf.get('SENTRY_DSN')).install();

// Process all Repository (DB) models synchronously. Check for changes using
// `checkSnapRepository` and if changed request a LP snap build and mark
// it as 'updated'.
export const pollRepositories = (checker) => {
  logger.info('GitHub Repository Poller ...');
  var raven_client = raven.Client(conf.get('SENTRY_DSN'));

  checker = checker || checkSnapRepository;

  // XXX cprov 2017-10-06: meh! no ES6 import support e small maxPending
  // default (1000, but we need 1 per registered repo in production),
  // such a great library I found :-/
  let AsyncLock = require('async-lock');
  let pollRepoLock = new AsyncLock({ maxPending: 10000 });
  let locked_promises = [];

  let poller_request_builds = false;
  try {
    poller_request_builds = JSON.parse(conf.get('POLLER_REQUEST_BUILDS'));
  } catch (e) {
    logger.error(`Invalid POLLER_REQUEST_BUILDS configuration: ${e}`);
  }

  return db.model('Repository').fetchAll().then(function (results) {
    logger.info(`Iterating over ${results.length} repositories.`);
    results.models.forEach((repo) => {
      const p = pollRepoLock.acquire('PROCESS-REPO-SYNC', async () => {
        const owner = repo.get('owner');
        const name = repo.get('name');
        const store_name = repo.get('store_name');
        const snapcraft_name = repo.get('snapcraft_name');

        if (!snapcraft_name) {
          logger.info(`${owner}/${name}: NO NAME IN SNAPCRAFT.YAML`);
          logger.info('==========');
          return;
        }

        if (!store_name) {
          logger.info(`${owner}/${name}: NO NAME REGISTERED IN THE STORE`);
          logger.info('==========');
          return;
        }

        if (store_name != snapcraft_name) {
          logger.info(`${owner}/${name}: STORE/SNAPCRAFT NAME MISMATCH ` +
                      `(${store_name} != ${snapcraft_name})`);
          logger.info('==========');
          return;
        }

        const repositoryUrl = getGitHubRepoUrl(owner, name);
        try {
          const snap = await internalFindSnap(repositoryUrl);
          const builds = await internalGetSnapBuilds(snap, 0, 1);
          // https://launchpad.net/+apidoc/devel.html#snap
          // All builds of this snap package, sorted in descending order of
          // finishing (or starting if not completed successfully).
          const last_build = builds.entries[0];

          // TODO: builds won't be triggered if there are already previous ones
          // waiting in queue ('Needs Building' or 'Building').
          const last_built_at = last_build.datebuilt || last_build.datecreated;
          if (!last_built_at) {
            throw new Error('LP last build timestamps are inconsistent.');
          }
          const last_built = moment(last_built_at).utc();
          logger.info(`${owner}/${name}: last built in ${last_built.format()}`);

          // Do not even check for changes if the snap was already built in the
          // last `POLLER_BUILD_THRESHOLD` interval (typically 24h).
          const threshold = parseInt(conf.get('POLLER_BUILD_THRESHOLD'), 10);
          if (moment().utc().diff(last_built, 'hours', true) <= threshold) {
            logger.info(
              `${owner}/${name}: Already built in the last ${threshold}h`);
            logger.info('==========');
            return;
          }

          if (await checker(owner, name, last_built)) {
            logger.info(`${owner}/${name}: NEEDSBUILD`);
            if (poller_request_builds) {
              await internalRequestSnapBuilds(snap, owner, name);
              logger.info(`${owner}/${name}: Builds requested.`);
            } else {
              logger.info(`${owner}/${name}: Build requesting DISABLED.`);
            }
          } else {
            logger.info(`${owner}/${name}: UNCHANGED`);
          }
        } catch (e) {
          raven_client.captureException(e);
          logger.error(`${owner}/${name}: FAILED (${e.message || e})`);
        }
        logger.info('==========');
      });

      locked_promises.push(p);
    });
    // Wrap all the individual locked promises so chained tasks can actually check
    // for completion, if necessary.
    return Promise.all(locked_promises);
  });
};


// Whether a given snap (GitHub) repository has changed since `since` datetime.
// Consider changes in the repository itself as well as any of the (GitHub)
// parts source.
export const checkSnapRepository = async (owner, name, since) => {
  const token = conf.get('POLLER_GITHUB_AUTH_TOKEN');
  const repo_url = getGitHubRepoUrl(owner, name);
  if (await new GitSourcePart(repo_url).hasRepoChangedSince(since, token)) {
    logger.info(`The ${owner}/${name} repository has changed.`);
    return true;
  }
  logger.info(`${owner}/${name}: unchanged, checking parts ...`);

  let snapcraft_yaml;
  try {
    snapcraft_yaml = await internalGetSnapcraftYaml(owner, name, token);
  } catch (e) {
    return false;
  }
  for (const source_part of extractPartsToPoll(snapcraft_yaml.contents)) {
    logger.info(`${owner}/${name}: Checking whether ${source_part.repoUrl} part has changed.`);
    if (await source_part.hasRepoChangedSince(since, token)) {
      logger.info(`${owner}/${name}: ${source_part.repoUrl} changed.`);
      return true;
    }
  }
  return false;
};


// Extracts unique GH repository URLs from a given (parsed) snapcraft.yaml
export function extractPartsToPoll(snapcraft_yaml) {
  const parts = Object.values(snapcraft_yaml.parts || {});
  const sourceParts = parts.map(
    GitSourcePart.fromSnapcraftPart).filter(part => part != undefined);
  return Array.from(new Set(sourceParts));
}


/// GitSourcePart encapsulates the relevant information from a snapcraft
/// source part, and contains the methods to determine whether it's up to
/// date.
export class GitSourcePart {

  constructor(repoUrl, branch, tag) {
    if (repoUrl === undefined) {
      throw new Error('Required parameter: repoUrl');
    }
    this.repoUrl = repoUrl;
    this.branch = branch;
    this.tag = tag;
  }

  /** Extract a GitSourcePart from a snapcraft part definition.
   *
   * Returns a GitSourcePart instance if the source part meets the following
   * criteria:
   *
   * - The source part has a source repository listed, and it's a github
   *   hosted repository
   */
  static fromSnapcraftPart(part) {
    // TODO: Warn if source-commit or source-subdir are set, since we don't
    //       support these.
    // TODO: Not sure if we can support setting tags _and_ branch in the same
    //       part.
    const gh_repo_prefix = conf.get('POLLER_GITHUB_REPOSITORY_PREFIX');
    if (part.source == undefined) {
      logger.info('Skipping part with no source set.');
    } else if (part.source.startsWith(gh_repo_prefix)) {
      var sourceUrl = part['source'];
      var sourceBranch = part['source-branch'];
      var sourceTag = part['source-tag'];
      // TODO: figure out tag support:
      if (sourceTag) {
        logger.info(
          `Not checking ${sourceUrl} with tag ${sourceTag} since tags are not supported`);
        return;
      }
      return new GitSourcePart(sourceUrl, sourceBranch, sourceTag);
    } else {
      logger.info(
        `Not checking ${part.source} as only github repos are supported`);
    }
  }

  /** Determine if the source part has changed since `last_polled_at`
   *
   */
  async hasRepoChangedSince(since, token) {
    if (since === undefined || !since) {
      throw new Error('`since` must be given.');
    }
    const { owner, name } = parseGitHubRepoUrl(this.repoUrl);

    const options = {
      token,
      headers: {
        'If-Modified-Since': since.format('ddd, MM MMM YYYY HH:mm:ss [GMT]')
      },
      json: true
    };

    if (this.tag == undefined) {
      // check the default branch, no tag.

      if (this.branch === undefined) {
        try {
          this.branch = await getDefaultBranch(this.repoUrl, token);
        } catch (e) {
          // TODO: we should log the reason why the context repository
          // was considered unchanged. If it's a 404 (repository disapeared),
          // we should cleanup (LP, DB and memcache).
          return false;
        }
      }

      const uri = `/repos/${owner}/${name}/branches/${this.branch}`;
      const response = await requestGitHub.get(uri, options);

      switch (response.statusCode) {
        case 200: {
          // Check the branch modification time. The GH API is kind of crazy
          // here:
          const date_string = response.body.commit.commit.committer.date;
          const branch_date = moment(date_string);
          return branch_date.isAfter(since);
        }
        case 304:
          // `If-Modified-Since` in action, cache hit, no changes.
          // TODO: This doesn't seem to work with the branches API.
          return false;
        default:
          // Bail, unexpected response.
          throw new Error(
            `${this.repoUrl} (${response.statusCode}): ${response.body.message}`);
      }
    } else {
      // check tag:
      // TODO: How the hell do we support tags?
    }
  }

}
