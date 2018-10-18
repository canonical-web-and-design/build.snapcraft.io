import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router';
import moment from 'moment';

import { Row, Data } from '../vanilla/table-interactive';
import { BuildStatusColours } from '../../helpers/snap-builds.js';
import BuildStatus from '../build-status';

import * as buildAnnotation from '../../helpers/build_annotation';

import styles from './buildRow.css';

const getBuildTriggerMessage = (repository, reason, commitId) => {
  switch (reason) {
    case buildAnnotation.BUILD_TRIGGERED_MANUALLY:
      return 'Manual build';
    case buildAnnotation.BUILD_TRIGGERED_BY_POLLER:
      return 'Dependency change';
    case buildAnnotation.BUILD_TRIGGERED_BY_WEBHOOK:
      if (commitId) {
        return (
          <span>
            Commit
            {' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`${repository.url}/commit/${commitId}`}
            >
              <img className={ styles.commitIcon } src="https://assets.ubuntu.com/v1/95b0c093-git-commit.svg" alt="" />
              { commitId.substring(0,7) }
            </a>
          </span>
        );
      }
      return 'Commit';
    default:
      return 'Unknown';
  }
};

const BuildRow = (props) => {

  const {
    repository,
    architecture,
    buildId,
    buildLogUrl,
    duration,
    colour,
    statusMessage,
    dateStarted,
    reason,
    commitId,
    isLinked
  } = props;

  let humanDuration;
  if (duration !== null) {
    humanDuration = moment.duration(duration).humanize();
  } else {
    humanDuration = '';
  }

  // only link to builds that have log available
  const buildUrl = (isLinked && buildLogUrl)
    ? `/user/${repository.fullName}/${buildId}`
    : null;

  return (
    <Row key={ buildId }>
      <Data col="15">
        { buildUrl
          ? <Link to={buildUrl}>{`#${buildId}`}</Link>
          : <span>{`#${buildId}`}</span>
        }
      </Data>
      <Data col="20">
        { getBuildTriggerMessage(repository, reason, commitId) }
      </Data>
      <Data col="15">
        {architecture}
      </Data>
      <Data col="15">
        {humanDuration}
      </Data>
      <Data col="35">
        <BuildStatus
          link={buildUrl}
          colour={colour}
          statusMessage={statusMessage}
          dateStarted={dateStarted}
        />
      </Data>
    </Row>
  );
};

BuildRow.defaultProps = {
  isLinked: true
};

BuildRow.propTypes = {
  // params from URL
  repository: PropTypes.shape({
    fullName: PropTypes.string
  }),

  // build properties
  buildId: PropTypes.string,
  buildLogUrl: PropTypes.string,
  architecture: PropTypes.string,
  colour: PropTypes.oneOf(Object.values(BuildStatusColours)),
  statusMessage: PropTypes.string,
  dateStarted: PropTypes.string,
  duration: PropTypes.string,
  reason: PropTypes.string,
  commitId: PropTypes.string,
  isLinked: PropTypes.bool
};

export default BuildRow;
