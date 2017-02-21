import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import Button from '../vanilla/button';
import { Row, Data, Dropdown } from '../vanilla/table-interactive';
import BuildStatus from '../build-status';

import { signIntoStore } from '../../actions/auth-store';
import { registerName } from '../../actions/register-name';

import styles from './repositoryRow.css';

class RepositoryRow extends Component {

  constructor(props) {
    super(props);

    let snapName;
    if (props.snap.snapcraft_data && props.snap.snapcraft_data.name) {
      snapName = props.snap.snapcraft_data.name;
    } else {
      snapName = '';
    }

    this.state = {
      snapName,
      unconfiguredDropdownExpanded: false,
      unregisteredDropdownExpanded: false
    };
  }

  onConfiguredClick() {
    this.setState({
      unconfiguredDropdownExpanded: !this.state.unconfiguredDropdownExpanded,
      unregisteredDropdownExpanded: false
    });
  }

  onUnregisteredClick() {
    this.setState({
      unconfiguredDropdownExpanded: false,
      unregisteredDropdownExpanded: !this.state.unregisteredDropdownExpanded
    });
  }

  onSignInClick() {
    this.props.dispatch(signIntoStore());
  }

  onSnapNameChange(event) {
    const snapName = event.target.value.replace(/[^a-z0-9-]/g, '');
    this.setState({ snapName });
  }

  onRegisterClick(fullName) {
    this.props.dispatch(registerName(fullName, this.state.snapName));
  }

  renderUnconfiguredDropdown() {
    return (
      <Dropdown>
        <Row>
          <Data col="100">
            This repo needs a snapcraft.yaml file, so that Snapcraft can make it buildable, installable, and runnable.
            {/* TODO: add more info/links as in spec */}
          </Data>
        </Row>
      </Dropdown>
    );
  }

  renderUnregisteredDropdown() {
    const { authStore, fullName, registerNameStatus } = this.props;

    // If the user has signed into the store but we haven't fetched the
    // resulting discharge macaroon, we need to wait for that before
    // allowing them to proceed.
    const authStoreFetchingDischarge = (
      authStore.hasDischarge && !authStore.authenticated
    );

    let caption;
    if (registerNameStatus.error) {
      caption = <div>{ registerNameStatus.error.json.detail }</div>;
    } else {
      caption = (
        <div>
          To publish to the Snap Store, this repo needs a registered name.
          { !authStore.authenticated &&
            ' You need to sign in to Ubuntu One to register a name.'
          }
          { (authStoreFetchingDischarge || authStore.authenticated) &&
            <div className={ styles.helpText }>
              Lower-case letters, numbers, and hyphens only.
            </div>
          }
        </div>
      );
    }

    let actionDisabled;
    let actionOnClick;
    let actionSpinner = false;
    let actionText;
    if (authStoreFetchingDischarge || authStore.authenticated) {
      actionDisabled = (
        this.state.snapName === '' ||
        registerNameStatus.isFetching ||
        authStoreFetchingDischarge
      );
      actionOnClick = this.onRegisterClick.bind(this, fullName);
      if (registerNameStatus.isFetching) {
        actionSpinner = true;
        actionText = 'Checking...';
      } else {
        actionText = 'Register';
      }
    } else {
      actionDisabled = authStore.isFetching;
      actionOnClick = this.onSignInClick.bind(this);
      actionText = 'Sign in...';
    }

    return (
      <Dropdown>
        <Row>
          <Data col="100">
            { caption }
          </Data>
        </Row>
        <Row>
          <Button onClick={this.onUnregisteredClick.bind(this)} appearance='neutral'>
            Cancel
          </Button>
          <Button disabled={actionDisabled} onClick={actionOnClick} isSpinner={actionSpinner}>
            { actionText }
          </Button>
        </Row>
      </Dropdown>
    );
  }

  render() {
    const { snap, latestBuild, fullName, authStore } = this.props;

    const unconfigured = true;
    const showUnconfiguredDropdown = unconfigured && this.state.unconfiguredDropdownExpanded;
    const unregistered = true;
    const showUnregisteredDropdown = unregistered && this.state.unregisteredDropdownExpanded;
    const showRegisterNameInput = (
      showUnregisteredDropdown && authStore.authenticated
    );

    const isActive = showUnconfiguredDropdown; // TODO (or any other dropdown)
    return (
      <Row isActive={isActive}>
        <Data col="30"><Link to={ `/${fullName}/builds` }>{ fullName }</Link></Data>
        <Data col="20">
          { this.renderConfiguredStatus.call(this, snap.snapcraft_data) }
        </Data>
        <Data col="20">
          { this.renderSnapName.call(this, showRegisterNameInput) }
        </Data>
        <Data col="30">
          {/*
            TODO: show 'Loading' when waiting for status?
              and also show 'Never built' when no builds available
          */}
          { latestBuild &&
            <BuildStatus
              link={ `/${fullName}/builds/${latestBuild.buildId}`}
              status={ latestBuild.status }
              statusMessage={ latestBuild.statusMessage }
              dateStarted={ latestBuild.dateStarted }
            />
          }
        </Data>
        { showUnconfiguredDropdown && this.renderUnconfiguredDropdown() }
        { showUnregisteredDropdown && this.renderUnregisteredDropdown() }
      </Row>
    );
  }

  renderConfiguredStatus(data) {
    if (!data) {
      return (
        <a onClick={this.onConfiguredClick.bind(this)}>Not configured</a>
      );
    }

    return (
      <div>Configured</div>
    );
  }

  renderSnapName(showRegisterNameInput) {
    if (showRegisterNameInput) {
      return (
        <input
          type='text'
          className={ styles.snapName }
          value={ this.state.snapName }
          onChange={ this.onSnapNameChange.bind(this) }
        />
      );
    } else {
      return (
        <a onClick={this.onUnregisteredClick.bind(this)}>
          Not registered
        </a>
      );
    }
  }
}

RepositoryRow.propTypes = {
  snap: PropTypes.shape({
    resource_type_link: PropTypes.string,
    git_repository_url: PropTypes.string,
    self_link: PropTypes.string,
    snapcraft_data: PropTypes.object
  }),
  latestBuild: PropTypes.shape({
    buildId: PropTypes.string,
    status: PropTypes.string,
    statusMessage: PropTypes.string
  }),
  fullName: PropTypes.string,
  authStore: PropTypes.shape({
    authenticated: PropTypes.bool
  }),
  registerNameStatus: PropTypes.shape({
    isFetching: PropTypes.bool,
    success: PropTypes.bool,
    error: PropTypes.object
  }),
  dispatch: PropTypes.func.isRequired
};

export default connect()(RepositoryRow);
