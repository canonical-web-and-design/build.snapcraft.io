import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import moment from 'moment';

import { BuildStatusConstants } from '../../helpers/snap-builds';

import styles from './buildRow.css';

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

  const statusStyle = {
    [BuildStatusConstants.SUCCESS]: styles.success,
    [BuildStatusConstants.ERROR]: styles.error,
    [BuildStatusConstants.PENDING]: styles.pending
  };

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
    <div className={ `${styles.buildRow} ${statusStyle[status]}` }>
      <div className={ styles.item }><Link to={`/${repository.fullName}/builds/${buildId}`}>{`#${buildId}`}</Link> {statusMessage}</div>
      <div className={ styles.item }>
        {architecture}
      </div>
      <div className={ styles.item }>
        {humanDuration}
      </div>
      <div className={ styles.item }>
        {humanDateStarted}
      </div>
    </div>
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
  status:  PropTypes.string,
  statusMessage: PropTypes.string,
  dateStarted: PropTypes.string,
  duration: PropTypes.string
};

export default BuildRow;
