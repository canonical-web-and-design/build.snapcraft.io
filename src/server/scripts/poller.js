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
export const pollRepositories = (checker, builder) => {
  logger.info('GitHub Repository Poller ...');
  var raven_client = raven.Client(conf.get('SENTRY_DSN'));

  checker = checker || checkSnapRepository;
  builder = builder || buildSnapRepository;

  // XXX: meh! no ES6 import support, great library :-/
  let AsyncLock = require('async-lock');
  let pollRepoLock = new AsyncLock();

  return db.model('Repository').fetchAll().then(function (results) {
    logger.info(`Iterating over ${results.length} repositories.`);
    results.models.forEach((repo) => {
      pollRepoLock.acquire('PROCESS-REPO-SYNC', async () => {
        const owner = repo.get('owner');
        const name = repo.get('name');

        // XXX skip repos already updated recently, create a new datetime
        // column exclusively for the poller.
        const last_polled_at = repo.get('polled_at') || repo.get('updated_at');

        if (!repo.get('snapcraft_name')) {
          logger.info(`${owner}/${name}: NO NAME IN SNAPCRAFT.YAML`);
          return;
        }

        if (!repo.get('store_name')) {
          logger.info(`${owner}/${name}: NO NAME REGISTERED IN THE STORE`);
          return;
        }

        const store_name = repo.get('store_name');
        const snapcraft_name = repo.get('snapcraft_name');
        if (store_name != snapcraft_name) {
          logger.info(`${owner}/${name}: STORE/SNAPCRAFT NAME MISMATCH ` +
                      `(${store_name} != ${snapcraft_name})`);
          return;
        }

        try {
          if (await checker(owner, name, last_polled_at)) {
            logger.info(`${owner}/${name}: NEEDSBUILD`);
            await builder(owner, name);
          } else {
            logger.info(`${owner}/${name}: UNCHANGED`);
          }
        } catch (e) {
          raven_client.captureException(e);
          logger.error(`${owner}/${name}: FAILED (${e.message})`);
        }
        logger.info('==========');
      });
    });
    // Pass the lock through so chained tasks can actually check
    // for completion, if necessary.
    return pollRepoLock;
  });
};


// Whether a given snap (GitHub) repository has changed since 'last_polled_at'.
// Consider changes in the repository itself as well as any of the (GitHub)
// parts source.
export const checkSnapRepository = async (owner, name, last_polled_at) => {
  const token = conf.get('GITHUB_AUTH_CLIENT_TOKEN');
  const repo_url = getGitHubRepoUrl(owner, name);
  if (await new GitSourcePart(repo_url).hasRepoChangedSince(last_polled_at, token)) {
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
    if (await source_part.hasRepoChangedSince(last_polled_at, token)) {
      logger.info(`${owner}/${name}: ${source_part.repoUrl} changed.`);
      return true;
    }
  }
  return false;
};


/** Request a build of the corresponding snap repository (in LP) and
 *  update `polled_at` (in DB).
 *
 * Return a `Promise` with the result of the operation.
 */
export const buildSnapRepository = async (owner, name) => {
  // TODO: annotate why the repository is being built (change on the main repo
  // or in parts? which part ?).
  const repositoryUrl = getGitHubRepoUrl(owner, name);
  try {
    const snap = await internalFindSnap(repositoryUrl);
    await internalRequestSnapBuilds(snap, owner, name);
    logger.info(`Requested builds of ${repositoryUrl}.`);
  } catch (e) {
    logger.error(`Failed to request builds of ${repositoryUrl}: ${e}.`);
    return Promise.reject(e);
  }

  return db.transaction(async (trx) => {
    const row = await db.model('Repository')
      .where({ owner, name })
      .fetch({ transacting: trx });
    await row.save(
      { polled_at: new Date() }, { method: 'update', transacting: trx });
  });
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
    const gh_repo_prefix = conf.get('GITHUB_REPOSITORY_PREFIX');
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
  async hasRepoChangedSince(last_polled_at, token) {
    if (last_polled_at === undefined || !last_polled_at) {
      throw new Error('`last_polled_at` must be given.');
    }
    const last_polled = moment(last_polled_at);
    const { owner, name } = parseGitHubRepoUrl(this.repoUrl);

    const options = {
      token,
      headers: {
        'If-Modified-Since': last_polled.format('ddd, MM MMM YYYY HH:mm:ss [GMT]')
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
          return branch_date.isAfter(last_polled);
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
