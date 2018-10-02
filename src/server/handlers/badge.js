import path from 'path';

import logging from '../logging';
const logger = logging.getLogger('express');

import {
  internalFindSnap,
  internalGetSnapBuilds
} from './launchpad';
import { getGitHubRepoUrl } from '../../common/helpers/github-url';
import { snapBuildFromAPI } from '../../common/helpers/snap-builds';

const BADGES_PATH = path.join(__dirname, '../../common/images/badges');

export const badge = async (req, res) => {

  const repoUrl = getGitHubRepoUrl(req.params.owner, req.params.name);

  try {
    const snap = await internalFindSnap(repoUrl);
    const builds = await internalGetSnapBuilds(snap);

    let badgeName = 'never_built';

    if (builds.length) {
      const latestBuild = snapBuildFromAPI(builds[0]);

      if (latestBuild.badge) {
        badgeName = latestBuild.badge;
      }
    }

    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(path.join(BADGES_PATH, `${badgeName}.svg`));
  } catch (err) {
    logger.error(`Error generating badge for repo ${repoUrl}`, err);
    res.status(404).send('Not found');
  }

};
