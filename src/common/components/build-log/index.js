import React, { PropTypes } from 'react';

import styles from './build-log.css';

const BuildLog= (props) => {

  return (
    <iframe className={styles.frame} src={props.logUrl}>
    </iframe>
  );
};

BuildLog.propTypes = {
  logUrl: PropTypes.string.isRequired
};


export default BuildLog;
