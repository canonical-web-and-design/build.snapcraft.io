import React from 'react';

import styles from './icons.css';

const DeleteIcon = () => <span className={styles.deleteIcon} />;
const TickIcon = () => <span className={styles.tickIcon} />;
const ErrorIcon = () => <span className={styles.errorIcon} />;
const WarningIcon = () => <span className={styles.warningIcon} />;

export {
  DeleteIcon,
  ErrorIcon,
  TickIcon,
  WarningIcon
};
