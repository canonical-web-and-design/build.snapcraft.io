import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router';
import moment from 'moment';

import { BuildStatusColours } from '../../helpers/snap-builds.js';
import styles from './buildStatus.css';

const BuildStatus = (props) => {

  const {
    link,
    colour,
    statusMessage,
    dateStarted
  } = props;

  let humanDateStarted;

  if (dateStarted) {
    const momentStarted = moment.utc(dateStarted);
    humanDateStarted = (
      <span className={ styles.buildDate } title={momentStarted.format('YYYY-MM-DD HH:mm:ss UTC')}>
        {momentStarted.fromNow()}
      </span>
    );
  } else {
    humanDateStarted = '';
  }

  return (
    <div className={ `${styles.buildStatus} ${styles[colour]}` }>
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
  colour: PropTypes.oneOf(Object.values(BuildStatusColours)),
  statusMessage: PropTypes.string,
  dateStarted: PropTypes.string
};

export default BuildStatus;
