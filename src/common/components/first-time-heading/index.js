import React, { Component, PropTypes } from 'react';

import { parseGitHubRepoUrl } from '../../helpers/github-url';
import { HeadingThree } from '../vanilla/heading';
import TrafficLights, { SIGNALS } from '../traffic-lights';

import styles from './firstTimeHeading.css';

const hasStoreName = (snap) => snap.store_name;
const hasStoreNameAndSnapcraftData = (snap) => snap.store_name && snap.snapcraft_data;
const hasStoreNameButNotSnapcraftData = (snap) => snap.store_name && !snap.snapcraft_data;

class FirstTimeHeading extends Component {

  hasNoBuilds(snap) {
    const { fullName } = parseGitHubRepoUrl(snap.git_repository_url);
    const repoBuilds = this.props.snapBuilds[fullName];

    if (repoBuilds && repoBuilds.success) {
      // if builds for given repo were fetched but there aren't any builds yet
      return repoBuilds.builds.length === 0;
    }
    return false;
  }

  getCurrentState() {
    const snapsStore = this.props.snaps;
    const snaps = snapsStore.snaps;

    let message = null;
    let progress = null;

    if (snapsStore.success) {
      // no repos added yet
      if (snaps.length === 0) {
        message = 'Let’s get started! First, choose one or more GitHub repos for building.';
        progress = [SIGNALS.DONE, SIGNALS.ACTIVE, SIGNALS.DEFAULT];
      // at least one repo, but none have a name yet
      } else if (snaps.filter(hasStoreName).length === 0) {
        message = 'Great! To publish a snap to the store, it needs a unique name. Try registering one now.';
        progress = [SIGNALS.DONE, SIGNALS.DONE, SIGNALS.ACTIVE];
      // at least one repo has a name but no snapcraft.yaml, and none have both
      } else if (snaps.filter(hasStoreNameButNotSnapcraftData).length &&
                 snaps.filter(hasStoreNameAndSnapcraftData).length === 0) {
        message = 'Okay, your repo is registered. Now push a snapcraft.yaml file, and building will start.';
        progress = [SIGNALS.DONE, SIGNALS.DONE, SIGNALS.ACTIVE];
        // only one repo has both a name and snapcraft.yaml, and it hasn’t had a build yet
      } else if (snaps.filter(hasStoreNameAndSnapcraftData).filter(this.hasNoBuilds.bind(this)).length === 1) {
        message = 'All set up! Your first build is on the way.';
        progress = [SIGNALS.DONE, SIGNALS.DONE, SIGNALS.DONE];
      }
    }

    return {
      message,
      progress
    };
  }

  // TODO: bartaz display state properly (not based on message)
  renderProgress(progress) {
    return (progress ? <TrafficLights signalState={ progress } /> : null);
  }

  renderMessage(message) {
    return (message ? <HeadingThree>{message}</HeadingThree> : null);
  }

  render() {
    const { message, progress } = this.getCurrentState();

    return (
      <div className={styles.firstTimeHeading}>
        { this.renderProgress(progress) }
        { this.renderMessage(message) }
      </div>
    );
  }
}

FirstTimeHeading.propTypes = {
  snaps: PropTypes.object,
  snapBuilds: PropTypes.object
};

export default FirstTimeHeading;
