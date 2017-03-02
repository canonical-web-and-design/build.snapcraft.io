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

  return (
    <Row key={ buildId }>
      <Data col="20">
        <Link to={`/${repository.fullName}/builds/${buildId}`}>{`#${buildId}`}</Link>
      </Data>
      <Data col="20">
        {architecture}
      </Data>
      <Data col="20">
        {humanDuration}
      </Data>
      <Data col="40">
        <BuildStatus colour={colour} statusMessage={statusMessage} dateStarted={dateStarted} />
      </Data>
    </Row>
  );
};

BuildRow.propTypes = {
  // params from URL
  repository: PropTypes.shape({
    owner: PropTypes.string,
    name: PropTypes.string
  }),

  // build properties
  buildId:  PropTypes.string,
  architecture: PropTypes.string,
  colour:  PropTypes.oneOf(['green', 'yellow', 'red', 'grey']),
  statusMessage: PropTypes.string,
  dateStarted: PropTypes.string,
  duration: PropTypes.string
};

export default BuildRow;
