import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import moment from 'moment';

import { Row, Data } from '../vanilla/table-interactive';
import BuildStatus from '../build-status';

const BuildRow = (props) => {

  const {
    repository,
    architecture,
    buildId,
    buildLogUrl,
    duration,
    colour,
    statusMessage,
    dateStarted
  } = props;

  let humanDuration;
  if (duration !== null) {
    humanDuration = moment.duration(duration).humanize();
  } else {
    humanDuration = '';
  }

  // only link to builds that have log available
  const buildUrl = buildLogUrl
    ? `/user/${repository.fullName}/${buildId}`
    : null;

  return (
    <Row key={ buildId }>
      <Data col="20">
        { buildUrl
          ? <Link to={buildUrl}>{`#${buildId}`}</Link>
          : <span>{`#${buildId}`}</span>
        }
      </Data>
      <Data col="20">
        {architecture}
      </Data>
      <Data col="20">
        {humanDuration}
      </Data>
      <Data col="40">
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

BuildRow.propTypes = {
  // params from URL
  repository: PropTypes.shape({
    fullName: PropTypes.string
  }),

  // build properties
  buildId:  PropTypes.string,
  buildLogUrl: PropTypes.string,
  architecture: PropTypes.string,
  colour:  PropTypes.oneOf(['green', 'yellow', 'red', 'grey']),
  statusMessage: PropTypes.string,
  dateStarted: PropTypes.string,
  duration: PropTypes.string
};

export default BuildRow;
