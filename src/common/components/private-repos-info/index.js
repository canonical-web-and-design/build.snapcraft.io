import React, { Component } from 'react';

import { conf } from '../../helpers/config';
const BASE_URL = conf.get('BASE_URL');

import Popover from '../popover';
import Button from '../vanilla/button';

import styles from './private-repos-info.css';

export default class PrivateReposInfo extends Component {
  constructor() {
    super();

    this.state = {
      showPopover: false,
      popoverOffsetLeft: 0,
      popoverOffsetTop: 0,
      subscribeEmail: '',
      subscribeSuccess: false,
      subscribeError: false,
      message: ''
    };
  }

  componentDidMount() {
    this.onBoundDocumentClick = this.onDocumentClick.bind(this);
    document.addEventListener('click', this.onBoundDocumentClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onBoundDocumentClick);
  }

  onDocumentClick() {
    this.setState({
      showPopover: false
    });
  }

  onHelpClick(event) {
    // prevent help click from triggering document click
    event.nativeEvent.stopImmediatePropagation();

    const { target } = event;

    this.setState({
      showPopover: !this.state.showPopover,
      popoverOffsetLeft: target.offsetLeft + (target.offsetWidth / 2),
      popoverOffsetTop: target.offsetTop + target.offsetHeight
    });
  }

  onEmailChange(event) {
    const { target } = event;

    this.setState({
      subscribeEmail: target.value
    });
  }

  async onSubscribeSubmit(event) {
    event.preventDefault();

    try {
      const response = await fetch(`${BASE_URL}/api/subscribe/private-repos?email=${encodeURIComponent(this.state.subscribeEmail)}`);
      const json = await response.json();

      this.setState({
        subscribeSuccess: json.result === 'success',
        subscribeError: json.result === 'error',
        message: json.msg
      });
    } catch (e) {
      this.setState({
        subscribeSuccess: false,
        subscribeError: true,
        message: e.message || 'There was unexpected error while subscribing. Please try again later.'
      });
    }
  }

  renderSubsribeForm() {
    return (
      <form onSubmit={this.onSubscribeSubmit.bind(this)}>
        <label className={styles.subscribeEmailLabel} htmlFor="subscribe_email">E-mail address:</label>
        <input
          id="subscribe_email"
          required={true}
          className={styles.subscribeEmailInput}
          type="email"
          onChange={this.onEmailChange.bind(this)}
          value={this.state.subscribeEmail}
        />
        <Button type="submit" appearance='neutral' flavour='smaller'>Keep me posted</Button>
        { this.state.subscribeError &&
          // MailChimp errors may contain HTML links in error messages
          // but we sanitize it on server side, so should be safe to insert
          <p className={styles.errorMsg} dangerouslySetInnerHTML={{ __html: this.state.message }}></p>
        }
      </form>
    );
  }

  onPopoverClick(event) {
    // prevent popover from closing when it's clicked
    event.nativeEvent.stopImmediatePropagation();
  }

  render() {
    return (
      <div className={ styles.info }>
        <p>Private repos not shown yet. (<a onClick={this.onHelpClick.bind(this)}>Why?</a>)</p>
        { this.state.showPopover &&
          <Popover
            left={this.state.popoverOffsetLeft}
            top={this.state.popoverOffsetTop}
            onClick={this.onPopoverClick.bind(this)}
          >
            <p className={styles.infoMsg}>We’re working hard on making these buildable. If you like, we can e-mail you when we’re ready.</p>
            { this.state.subscribeSuccess
              ? <p className={styles.successMsg}>{ this.state.message }</p>
              : this.renderSubsribeForm()
            }
          </Popover>
        }
      </div>
    );
  }
}
