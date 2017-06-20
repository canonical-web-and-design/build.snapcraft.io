import React, { Component, PropTypes } from 'react';

import { conf } from '../../helpers/config';
const BASE_URL = conf.get('BASE_URL');
const GITHUB_AUTH_CLIENT_ID = conf.get('GITHUB_AUTH_CLIENT_ID');

import Button, { Anchor } from '../vanilla/button';

import styles from './private-repos-info.css';

export default class PrivateReposInfo extends Component {
  constructor() {
    super();

    this.state = {
      subscribeEmail: '',
      subscribeSuccess: false,
      subscribeError: false,
      message: ''
    };
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

  renderOrgsInfo() {
    const { orgs } = this.props.user;

    const number = orgs.length;
    const plural = orgs.length > 1 ? 's' : '';
    const orgsList = orgs.slice(0, 3).map((org) => org.login).join(', ');


    return (
      <p className={styles.infoMsg}>Missing an <strong>organization</strong>? {' '}
        { number
          ? `Snapcraft has access to ${number} organization${plural} you’re a member of (${orgsList}${number > 3 ? '…' : ''}).`
          : 'Snapcraft doesn’t have access to any organizations you’re a member of. The organization owner needs to grant access.'
        }
      </p>
    );
  }

  render() {
    return (
      <ul>
        <li>
          <p className={styles.infoMsg}>Want to use a <strong>private repo</strong>? We’re working hard on making these buildable. If you like, we can e-mail you when we’re ready.</p>
          { this.state.subscribeSuccess
            ? <p className={styles.successMsg}>{ this.state.message }</p>
            : this.renderSubsribeForm()
          }
        </li>
        <li>
          <p className={styles.infoMsg}>Don’t have <strong>admin permission</strong>? Ask a repo admin to add it instead, and it will show up in your repo list too.</p>
        </li>
        <li>
          { this.renderOrgsInfo() }
          <Anchor
            appearance='neutral' flavour='smaller'
            target="blank" rel="noreferrer noopener"
            href={`https://github.com/settings/connections/applications/${GITHUB_AUTH_CLIENT_ID}`}
          >
            Review organization access…
          </Anchor>
          {' '}
          <Button
            appearance='neutral' flavour='smaller'
            onClick={this.onRefreshClick.bind(this)}
          >
            OK, it’s added
          </Button>
        </li>
        <li>
          <p className={styles.infoMsg}>Using the <strong>wrong GitHub account</strong>? Sign out and try again with the right one.</p>
          <Anchor appearance='neutral' flavour='smaller' href="https://github.com/logout">Change account…</Anchor>
        </li>
      </ul>
    );
  }

  onRefreshClick() {
    this.setState({
      showPopover: false
    });
    this.props.onRefreshClick();
  }
}

PrivateReposInfo.propTypes = {
  user: PropTypes.shape({
    orgs: PropTypes.array
  }).isRequired,
  onRefreshClick: PropTypes.func
};
