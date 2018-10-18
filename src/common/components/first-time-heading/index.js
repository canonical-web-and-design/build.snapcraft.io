import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { HeadingThree } from '../vanilla-modules/heading';
import TrafficLights, { SIGNALS } from '../traffic-lights';

import {
  hasLoadedSnaps,
  hasNoRegisteredNames,
  snapsWithRegisteredNameAndSnapcraftData,
  snapsWithRegisteredNameAndNoSnapcraftData,
  snapsWithNoBuilds,
  hasNoSnaps
} from '../../selectors';

import styles from './firstTimeHeading.css';

class FirstTimeHeading extends Component {

  getCurrentState() {
    const {
      snapsLoaded,
      hasAddedSnaps,
      hasNoSnaps,
      hasNoRegisteredNames,
      hasSnapsWithRegisteredNameAndNoSnapcraftData,
      hasNoSnapsWithRegisteredNameAndSnapcraftData,
      hasOneSnapWithNoBuilds
    } = this.props;

    let message = null;
    let progress = null;

    if (snapsLoaded) {
      // no repos added yet
      if (hasNoSnaps) {
        if (!hasAddedSnaps) {
          message = 'Let’s get started! First, choose one or more GitHub repos for building.';
          progress = [SIGNALS.DONE, SIGNALS.ACTIVE, SIGNALS.DEFAULT];
        }
      } else if (this.props.isOnMyRepos) { // further steps are only visible on 'My Repos' page
        // at least one repo, but none have a name yet
        if (hasNoRegisteredNames) {
          message = 'Great! Next, register a snap name for releasing.';
          progress = [SIGNALS.DONE, SIGNALS.DONE, SIGNALS.ACTIVE];
          // at least one repo has a name but no snapcraft.yaml, and none have both
        } else if (hasSnapsWithRegisteredNameAndNoSnapcraftData &&
                   hasNoSnapsWithRegisteredNameAndSnapcraftData) {
          message = 'Okay, your repo is registered. Now push a snapcraft.yaml file, and building will start.';
          progress = [SIGNALS.DONE, SIGNALS.DONE, SIGNALS.ACTIVE];
          // only one repo has both a name and snapcraft.yaml, and it hasn’t had a build yet
        } else if (hasOneSnapWithNoBuilds) {
          message = 'All set up! Your first build is on the way.';
          progress = [SIGNALS.DONE, SIGNALS.DONE, SIGNALS.DONE];
        }
      }
    }

    return {
      message,
      progress
    };
  }

  renderProgress(progress) {
    return (progress ? <TrafficLights signalState={ progress } /> : null);
  }

  renderMessage(message) {
    return (message ? <HeadingThree>{message}</HeadingThree> : null);
  }

  render() {
    const { message, progress } = this.getCurrentState();

    return ( (message || progress) &&
      <div className={styles.firstTimeHeading}>
        { this.renderProgress(progress) }
        { this.renderMessage(message) }
      </div>
    );
  }
}

FirstTimeHeading.propTypes = {
  snapsLoaded: PropTypes.bool,
  hasNoRegisteredNames: PropTypes.bool,
  hasNoSnapsWithRegisteredNameAndSnapcraftData: PropTypes.bool,
  hasSnapsWithRegisteredNameAndNoSnapcraftData: PropTypes.bool,
  hasOneSnapWithNoBuilds: PropTypes.bool,
  hasNoSnaps: PropTypes.bool,
  hasAddedSnaps: PropTypes.bool,
  isOnMyRepos: PropTypes.bool
};

function mapStateToProps(state) {
  return {
    snapsLoaded: hasLoadedSnaps(state),
    hasNoRegisteredNames: hasNoRegisteredNames(state),
    hasNoSnapsWithRegisteredNameAndSnapcraftData: snapsWithRegisteredNameAndSnapcraftData(state).length === 0,
    hasSnapsWithRegisteredNameAndNoSnapcraftData: snapsWithRegisteredNameAndNoSnapcraftData(state).length > 0,
    hasOneSnapWithNoBuilds: snapsWithNoBuilds(state).length === 1,
    hasNoSnaps: hasNoSnaps(state),
    hasAddedSnaps: state.user.hasAddedSnaps
  };
}

export default connect(mapStateToProps)(FirstTimeHeading);
