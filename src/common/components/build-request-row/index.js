import PropTypes from 'prop-types';
import React from 'react';

import { Row, Data } from '../vanilla/table-interactive';
import { BuildStatusColours } from '../../helpers/snap-builds.js';
import BuildStatus from '../build-status';

import * as buildAnnotation from '../../helpers/build_annotation';

const getBuildTriggerMessage = (repository, reason) => {
  switch (reason) {
    case buildAnnotation.BUILD_TRIGGERED_MANUALLY:
      return 'Manual build';
    case buildAnnotation.BUILD_TRIGGERED_BY_POLLER:
      return 'Dependency change';
    case buildAnnotation.BUILD_TRIGGERED_BY_WEBHOOK:
      return 'Commit';
    default:
      return 'Unknown';
  }
};

const BuildRequestRow = (props) => {

  const {
    repository,
    buildId,
    colour,
    statusMessage,
    dateCreated,
    errorMessage,
    reason
  } = props;

  return (
    <Row key={ buildId }>
      <Data col="15">
        Requested
      </Data>
      <Data col="20">
        { getBuildTriggerMessage(repository, reason) }
      </Data>
      <Data col="65">
        { statusMessage === 'Failed to build' &&
          <BuildStatus
            colour={colour}
            statusMessage={ `(Request #${buildId}) ${errorMessage}` }
            dateStarted={dateCreated}
          />
        }
      </Data>
    </Row>
  );
};

BuildRequestRow.defaultProps = {
  isLinked: true
};

BuildRequestRow.propTypes = {
  // params from URL
  repository: PropTypes.shape({
    fullName: PropTypes.string
  }),

  // build properties
  buildId: PropTypes.string,
  colour: PropTypes.oneOf(Object.values(BuildStatusColours)),
  statusMessage: PropTypes.string,
  dateCreated: PropTypes.string,
  errorMessage: PropTypes.string,
  reason: PropTypes.string
};

export default BuildRequestRow;
