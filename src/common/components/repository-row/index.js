import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import url from 'url';
import localforage from 'localforage';

import Button from '../vanilla/button';
import { Row, Data, Dropdown } from '../vanilla/table-interactive';
import BuildStatus from '../build-status';
import { Message } from '../forms';
import templateYaml from './template-yaml.js';

import { signIntoStore } from '../../actions/auth-store';
import { registerName } from '../../actions/register-name';
import { parseGitHubRepoUrl } from '../../helpers/github-url';

import styles from './repositoryRow.css';


const LEARN_THE_BASICS_LINK = 'https://snapcraft.io/docs/build-snaps/your-first-snap';
const INSTALL_IT_LINK = 'https://snapcraft.io/create/';
const tickIcon = (
  <img
    src='http://assets.ubuntu.com/v1/6c395e6d-green-tick.svg'
    className={ styles.tickIcon }
  />
);

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

  saveState() {
    localforage.setItem(`repository_row_${this.props.snap.git_repository_url}`, this.state);
  }

  loadState() {
    localforage.getItem(`repository_row_${this.props.snap.git_repository_url}`)
      .then((state) => {
        if (state) {
          this.setState(state);
        }
      });
  }

  clearState() {
    localforage.removeItem(`repository_row_${this.props.snap.git_repository_url}`);
  }

  componentDidMount() {
    this.loadState();
  }

  componentDidUpdate() {
    // save the component state in browser storage whenever it changes
    this.saveState();
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

  closeUnregisteredDropdown() {
    this.setState({ unregisteredDropdownExpanded: false });
    delete this.closeUnregisteredTimerID;
  }

  onSignInClick() {
    this.props.dispatch(signIntoStore());
  }

  onSnapNameChange(event) {
    const snapName = event.target.value.replace(/[^a-z0-9-]/g, '');
    this.setState({ snapName });
  }

  onRegisterClick(repositoryUrl) {
    const { snap } = this.props;
    const repository = parseGitHubRepoUrl(repositoryUrl);
    const { snapName } = this.state;
    const triggerBuilds = (!!snap.snapcraft_data);
    this.props.dispatch(registerName(repository, snapName, triggerBuilds));
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.registerNameStatus.success &&
        !this.props.registerNameStatus.success) {
      this.closeUnregisteredTimerID = window.setTimeout(
        this.closeUnregisteredDropdown.bind(this), 2000
      );
    }
  }

  componentWillUnmount() {
    // when user goes to different view within the app we can clear the state from storage
    // so we don't keep it unnecessarily long in browser store

    // XXX
    // This call of `clearState` makes it safe to keep potentially not yet resolved promise
    // from `loadStore`, because after clearing it will resolve with empty state and not
    // attempt to update the component.
    // But if we ever decide we don't want to clear stored state there we need to make sure
    // to cancel promise from loadStore because it may try to set the state after component
    // is already unmounted which will cause React error.
    // See: https://facebook.github.io/react/blog/2015/12/16/ismounted-antipattern.html
    this.clearState();

    if (this.closeUnregisteredTimerID) {
      window.clearTimeout(this.closeUnregisteredTimerID);
      delete this.closeUnregisteredTimerID;
    }
  }

  renderUnconfiguredDropdown() {
    return (
      <Dropdown>
        <Row>
          <Data col="100">
            <p>
              This repo needs a snapcraft.yaml file,
              so that Snapcraft can make it buildable,
              installable, and runnable.
            </p>
            <p>
              <a href={ LEARN_THE_BASICS_LINK } target="_blank">Learn the basics</a>,
              or
              <a href={ this.getTemplateUrl.call(this) } target="_blank"> get started with a template</a>.
            </p>
            <p>
              Don’t have snapcraft?
              <a href={ INSTALL_IT_LINK } target="_blank"> Install it on your own PC </a>
              for testing.
            </p>
          </Data>
        </Row>
      </Dropdown>
    );
  }

  renderUnregisteredDropdown() {
    const { snap, authStore, registerNameStatus } = this.props;

    // If the user has signed into the store but we haven't fetched the
    // resulting discharge macaroon, we need to wait for that before
    // allowing them to proceed.
    const authStoreFetchingDischarge = (
      authStore.hasDischarge && !authStore.authenticated
    );

    let caption;
    if (registerNameStatus.success) {
      caption = <div>{ tickIcon } Registered successfully</div>;
    } else if (registerNameStatus.error) {
      caption = (
        <Message status='error'>
          { registerNameStatus.error.message }
        </Message>
      );
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
      actionOnClick = this.onRegisterClick.bind(this, snap.git_repository_url);
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
    const {
      snap,
      latestBuild,
      fullName,
      authStore,
      registerNameStatus
    } = this.props;

    const unconfigured = true;
    const showUnconfiguredDropdown = unconfigured && this.state.unconfiguredDropdownExpanded;
    const showUnregisteredDropdown = this.state.unregisteredDropdownExpanded;
    const showRegisterNameInput = (
      showUnregisteredDropdown && authStore.authenticated
    );
    const registeredName = (
      registerNameStatus.success ?
      registerNameStatus.snapName : snap.store_name
    );

    // TODO (or any other dropdown)
    const isActive = showUnconfiguredDropdown || showUnregisteredDropdown;
    return (
      <Row isActive={isActive}>
        <Data col="30"><Link to={ `/${fullName}/builds` }>{ fullName }</Link></Data>
        <Data col="20">
          { this.renderConfiguredStatus.call(this, snap.snapcraft_data) }
        </Data>
        <Data col="20">
          { this.renderSnapName.call(this, registeredName, showRegisterNameInput) }
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

  renderSnapName(registeredName, showRegisterNameInput) {
    if (registeredName !== null) {
      return <span>{ tickIcon } { registeredName }</span>;
    } else if (showRegisterNameInput) {
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

  getTemplateUrl() {
    const templateUrl = url.format({
      protocol: 'https:',
      host: 'github.com',
      pathname: parseGitHubRepoUrl(this.props.snap.git_repository_url).fullName + '/new/master',
      query: {
        'filename': 'snapcraft.yaml',
        'value': templateYaml
      }
    });

    return templateUrl;
  }
}

RepositoryRow.propTypes = {
  snap: PropTypes.shape({
    resource_type_link: PropTypes.string,
    git_repository_url: PropTypes.string,
    self_link: PropTypes.string,
    store_name: PropTypes.string,
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
