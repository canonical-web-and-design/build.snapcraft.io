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
    status,
    statusMessage,
    dateStarted
  } = props;

  let humanDuration;
  if (duration !== null) {
    humanDuration = moment.duration(duration).humanize();
  } else {
    humanDuration = '';
  }

  let humanDateStarted;
  if (dateStarted !== null) {
    const momentStarted = moment(dateStarted);
    humanDateStarted = (
      <span title={momentStarted.format('YYYY-MM-DD HH:mm:ss UTC')}>
        {momentStarted.fromNow()}
      </span>
    );
  } else {
    humanDateStarted = '';
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
        <BuildStatus link="" status={status} statusMessage={statusMessage} dateStarted={humanDateStarted} />
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
  status:  PropTypes.oneOf(['success', 'pending', 'error']),
  statusMessage: PropTypes.string,
  dateStarted: PropTypes.string,
  duration: PropTypes.string
};

export default BuildRow;
