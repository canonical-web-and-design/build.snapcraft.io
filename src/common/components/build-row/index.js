import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import moment from 'moment';

import { BuildStatus } from '../../helpers/snap-builds';

import styles from './buildRow.css';

const BuildRow = (props) => {

  const {
    account,
    repo,
    architecture,
    buildId,
    duration,
    status,
    statusMessage,
    dateStarted
  } = props;

  const statusStyle = {
    [BuildStatus.SUCCESS]: styles.success,
    [BuildStatus.ERROR]: styles.error,
    [BuildStatus.PENDING]: styles.pending
  };

  return (
    <div className={ `${styles.buildRow} ${statusStyle[status]}` }>
      <div className={ styles.item }><Link to={`/${account}/${repo}/builds/${buildId}`}>{`#${buildId}`}</Link> {statusMessage}</div>
      <div className={ styles.item }>
        {architecture}
      </div>
      <div className={ styles.item }>
        {moment.duration(duration).humanize()}
      </div>
      <div className={ styles.item }>
        <span title={moment(dateStarted).format('DD-MM-YYYY HH:mm:ss')}>{ moment(dateStarted).fromNow() }</span>
      </div>
    </div>
  );
};

BuildRow.propTypes = {
  // params from URL
  account: PropTypes.string,
  repo: PropTypes.string,

  // build properties
  buildId:  PropTypes.string,
  architecture: PropTypes.string,
  status:  PropTypes.string,
  statusMessage: PropTypes.string,
  dateStarted: PropTypes.string,
  duration: PropTypes.string
};

export default BuildRow;
