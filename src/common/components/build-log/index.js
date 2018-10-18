import PropTypes from 'prop-types';
import React from 'react';

import styles from './build-log.css';

const BuildLog = (props) => {
  if (props.logUrl) {
    return (
      <iframe className={styles.frame} src={props.logUrl}>
      </iframe>
    );
  } else {
    return (
      <div>
        The build log will appear here once the build has finished.
      </div>
    );
  }
};

BuildLog.propTypes = {
  logUrl: PropTypes.string
};

export default BuildLog;
