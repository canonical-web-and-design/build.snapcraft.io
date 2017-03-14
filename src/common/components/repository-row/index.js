import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import localforage from 'localforage';

import { Row, Data } from '../vanilla/table-interactive';
import BuildStatus from '../build-status';

import {
  NameMismatchDropdown,
  RemoveRepoDropdown,
  UnconfiguredDropdown,
  RegisterNameDropdown
} from './dropdowns';
import {
  TickIcon,
  ErrorIcon
} from './icons';
import { signIntoStore } from '../../actions/auth-store';
import { registerName, registerNameError, registerNameClear } from '../../actions/register-name';
import { removeSnap } from '../../actions/snaps';

import { parseGitHubRepoUrl } from '../../helpers/github-url';

import styles from './repositoryRow.css';
import iconStyles from './icons/icons.css';

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
      nameMismatchDropdownExpanded: false,
      unconfiguredDropdownExpanded: false,
      unregisteredDropdownExpanded: props.registerNameIsOpen,
      removeDropdownExpanded: false,
      signAgreement: false
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

  toggleDropdownState(dropdown) {
    this.setState({
      // close all dropdowns
      nameMismatchDropdownExpanded: false,
      unconfiguredDropdownExpanded: false,
      unregisteredDropdownExpanded: false,
      removeDropdownExpanded: false,

      // and toggle the one
      [dropdown]: !this.state[dropdown]
    });
  }

  onConfiguredClick() {
    this.toggleDropdownState('unconfiguredDropdownExpanded');
  }

  onNameMismatchClick() {
    this.toggleDropdownState('nameMismatchDropdownExpanded');
  }

  onUnregisteredClick() {
    this.toggleDropdownState('unregisteredDropdownExpanded');
  }

  onToggleRemoveClick() {
    this.toggleDropdownState('removeDropdownExpanded');
  }

  closeUnregisteredDropdown() {
    this.setState({ unregisteredDropdownExpanded: false });
    delete this.closeUnregisteredTimerID;
  }

  onSignInClick() {
    this.props.dispatch(signIntoStore());
  }

  onSignAgreementChange(event) {
    this.setState({ signAgreement: event.target.checked });
  }

  onSnapNameChange(event) {
    const { dispatch, fullName } = this.props;
    const snapName = event.target.value.replace(/[^a-z0-9-]/g, '');
    let clientValidationError = null;
    this.setState({ snapName });

    if (/^-|-$/.test(snapName)) {
      clientValidationError = {
        message: 'Sorry the name can\'t start or end with a hyphen.'
      };
    }

    dispatch(registerNameError(fullName, clientValidationError));
  }

  onRegisterClick(repositoryUrl) {
    const { authStore, snap, dispatch } = this.props;
    const repository = parseGitHubRepoUrl(repositoryUrl);
    const { snapName, signAgreement } = this.state;
    const requestBuilds = (!!snap.snapcraft_data);

    dispatch(registerName(repository, snapName, {
      signAgreement: signAgreement ? authStore.userName : null,
      requestBuilds
    }));
  }

  onRemoveClick(repositoryUrl) {
    this.props.dispatch(removeSnap(repositoryUrl));
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.registerNameStatus.success &&
        !this.props.registerNameStatus.success) {
      this.closeUnregisteredTimerID = window.setTimeout(() => {
        this.closeUnregisteredDropdown();
        this.props.dispatch(registerNameClear(this.props.fullName));
      }, 2000);
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
    const showRemoveDropdown = this.state.removeDropdownExpanded;
    const showNameMismatchDropdown = this.state.nameMismatchDropdownExpanded;
    const showRegisterNameInput = (
      showUnregisteredDropdown && authStore.authenticated
    );
    const registeredName = (
      registerNameStatus.success ?
      registerNameStatus.snapName : snap.store_name
    );

    const hasBuilt = !!(latestBuild && snap.snapcraft_data);
    const hasLog = !!(hasBuilt && latestBuild.buildLogUrl);

    // only link to builds that have log available
    const latestBuildUrl = hasLog
      ? `/${fullName}/builds/${latestBuild.buildId}`
      : null;

    const isActive = (
      showNameMismatchDropdown ||
      showUnconfiguredDropdown ||
      showUnregisteredDropdown ||
      showRemoveDropdown
    );
    // XXX cjwatson 2017-02-28: The specification calls for the remove icon
    // to be shown only when hovering over or tapping in an empty part of
    // the row.  My attempts to do this so far have resulted in the remove
    // icon playing hide-and-seek.

    return (
      <Row isActive={isActive}>
        <Data col="27">
          { hasBuilt
            ? (
              <Link to={ `/${fullName}/builds` }>{ fullName }</Link>
            )
            : (
              <span>{ fullName }</span>
            )
          }
        </Data>
        <Data col="15">
          { this.renderConfiguredStatus.call(this, snap) }
        </Data>
        <Data col="25">
          { this.renderSnapName.call(this, registeredName, showRegisterNameInput) }
        </Data>
        <Data col="30">
          { hasBuilt
            ? (
              <BuildStatus
                link={ latestBuildUrl }
                colour={ latestBuild.colour }
                statusMessage={ latestBuild.statusMessage }
                dateStarted={ latestBuild.dateStarted }
              />
            )
            : (
              <BuildStatus
                colour="grey"
                statusMessage="Never built"
              />
            )
          }
        </Data>
        <Data col="3">
          <a
            className={ iconStyles.deleteIcon }
            onClick={ this.onToggleRemoveClick.bind(this) }
          />
        </Data>
        { showNameMismatchDropdown && <NameMismatchDropdown snap={snap} /> }
        { showUnconfiguredDropdown && <UnconfiguredDropdown snap={snap} /> }
        { showUnregisteredDropdown &&
          <RegisterNameDropdown
            registeredName={registeredName}
            snapcraftData={snap.snapcraft_data}
            snapName={this.state.snapName}
            authStore={authStore}
            registerNameStatus={registerNameStatus}
            onSignAgreementChange={this.onSignAgreementChange.bind(this)}
            onRegisterClick={this.onRegisterClick.bind(this, snap.git_repository_url)}
            onSignInClick={this.onSignInClick.bind(this)}
            onCancelClick={this.onUnregisteredClick.bind(this)}
            onSnapNameChange={this.onSnapNameChange.bind(this)}
          />
        }
        { showRemoveDropdown &&
          <RemoveRepoDropdown
            message={this.getRemoveWarningMessage(latestBuild, registeredName)}
            onRemoveClick={this.onRemoveClick.bind(this, snap.git_repository_url)}
            onCancelClick={this.onToggleRemoveClick.bind(this)}
          />
        }
      </Row>
    );
  }

  getRemoveWarningMessage(latestBuild, registeredName) {
    let warningText;
    if (latestBuild) {
      warningText = (
        'Removing this repo will delete all its builds and build logs.'
      );
    } else {
      warningText = (
        'Are you sure you want to remove this repo from the list?'
      );
    }
    if (registeredName !== null) {
      warningText += ' The name will remain registered.';
    }
    // XXX cjwatson 2017-02-28: Once we can get hold of published states for
    // builds, we should also implement this design requirement:
    //   Separately, if any build has been published, the text should end
    //   with:
    //     Published builds will remain published.

    return warningText;
  }

  renderConfiguredStatus(snap) {
    const { snapcraft_data, store_name } = snap;

    if (!snapcraft_data) {
      return (
        <a onClick={this.onConfiguredClick.bind(this)}>Not configured</a>
      );
    } else if (snapcraft_data && store_name && snapcraft_data.name !== store_name){
      return (
        <span onClick={this.onNameMismatchClick.bind(this)}>
          <ErrorIcon /> <a>Doesn’t match</a>
        </span>
      );
    }

    return <TickIcon />;
  }

  renderSnapName(registeredName, showRegisterNameInput) {
    if (registeredName !== null) {
      return (
        <span onClick={this.onUnregisteredClick.bind(this)}>
          <TickIcon /> <a>{ registeredName }</a>
        </span>
      );
    } else if (showRegisterNameInput) {
      return (
        <input
          type='text'
          className={ styles.snapNameInput }
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
    git_repository_url: PropTypes.string,
    store_name: PropTypes.string,
    snapcraft_data: PropTypes.object
  }),
  latestBuild: PropTypes.shape({
    buildId: PropTypes.string,
    buildLogUrl: PropTypes.string,
    colour: PropTypes.string,
    dateStarted: PropTypes.string,
    statusMessage: PropTypes.string
  }),
  fullName: PropTypes.string,
  authStore: PropTypes.shape({
    authenticated: PropTypes.bool,
    userName: PropTypes.string
  }),
  registerNameStatus: PropTypes.shape({
    success: PropTypes.bool
  }),
  dispatch: PropTypes.func.isRequired,
  registerNameIsOpen: PropTypes.bool
};

// FIXME:
// `connect` shouldn't be used just to add dispatch to props
// this makes it much harder to test it as it get wrapped
export default connect()(RepositoryRow);
