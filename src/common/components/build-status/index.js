import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import moment from 'moment';

import { BuildStatusConstants } from '../../helpers/snap-builds';

import styles from './buildStatus.css';

const BuildStatus = (props) => {

  const {
    link,
    status,
    statusMessage,
    dateStarted
  } = props;

  const statusStyle = {
    [BuildStatusConstants.SUCCESS]: styles.success,
    [BuildStatusConstants.ERROR]: styles.error,
    [BuildStatusConstants.PENDING]: styles.pending
  };

  let humanDateStarted;

  if (dateStarted) {
    const momentStarted = moment(dateStarted);
    humanDateStarted = (
      <span className={ styles.buildDate } title={momentStarted.format('YYYY-MM-DD HH:mm:ss UTC')}>
        {momentStarted.fromNow()}
      </span>
    );
  } else {
    humanDateStarted = '';
  }

  return (
    <div className={ `${styles.buildStatus} ${statusStyle[status]}` }>
      { link
        ? <Link to={link}>{statusMessage}</Link>
        : <span>{statusMessage}</span>
      }
      { humanDateStarted }
    </div>
  );
};

BuildStatus.propTypes = {
  link: PropTypes.string,
  status:  PropTypes.string,
  statusMessage: PropTypes.string,
  dateStarted: PropTypes.string
};

export default BuildStatus;
