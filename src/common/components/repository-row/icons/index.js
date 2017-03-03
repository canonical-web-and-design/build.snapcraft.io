import React from 'react';

import styles from './icons.css';

const TickIcon = () => <span className={styles.tickIcon} />;
const ErrorIcon = () => <span className={styles.errorIcon} />;
const WarningIcon = () => <span className={styles.warningIcon} />;

export {
  ErrorIcon,
  TickIcon,
  WarningIcon
};
