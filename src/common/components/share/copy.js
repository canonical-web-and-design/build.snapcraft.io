import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Clipboard from 'clipboard';
import { IconCopy } from '../vanilla-modules/icons';

import styles from './styles.css';

export class CopyToClipboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSupported: Clipboard.isSupported()
    };
  }

  componentDidMount() {
    if (this.state.isSupported) {
      this.initClipboard();
    }
  }

  componentWillUnmount() {
    this.clipboard && this.clipboard.destroy();
  }

  initClipboard() {
    this.clipboard = new Clipboard(this.copyBtn);
  }

  render() {
    const { copyme, tooltip } = this.props;

    if (!this.state.isSupported) {
      return null;
    }

    return (
      <span
        ref={(span) => { this.copyBtn = span; }}
        title={ tooltip || 'Copy to clipboard' }
        className={`${styles.share} ${styles.clipboard}`}
        data-clipboard-action='copy'
        data-clipboard-text={ copyme }
      >
        <IconCopy />
      </span>
    );
  }
}

CopyToClipboard.propTypes = {
  tooltip: PropTypes.string,
  copyme: PropTypes.string.isRequired
};
