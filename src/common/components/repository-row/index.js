import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import localforage from 'localforage';
import { bindActionCreators } from 'redux';

import { Row, DataLink } from '../vanilla/table-interactive';
import BuildStatus from '../build-status';

import {
  NameMismatchDropdown,
  RemoveRepoDropdown,
  UnconfiguredDropdown,
  EditConfigDropdown,
  RegisterNameDropdown
} from './dropdowns';
import {
  DeleteIcon,
  TickIcon,
  ErrorIcon
} from './icons';
import * as authStoreActionCreators from '../../actions/auth-store';
import * as registerNameActionCreators from '../../actions/register-name';
import { NAME_OWNERSHIP_ALREADY_OWNED, checkNameOwnership } from '../../actions/name-ownership';
import * as snapActionCreators from '../../actions/snaps';

import { parseGitHubRepoUrl } from '../../helpers/github-url';

import styles from './repositoryRow.css';

export class RepositoryRowView extends Component {

  constructor(props) {
    super(props);

    let snapName;
    if (props.snap.snapcraftData && props.snap.snapcraftData.name) {
      snapName = props.snap.snapcraftData.name;
    } else {
      // suggest name based on git repository name
      snapName = parseGitHubRepoUrl(props.snap.gitRepoUrl).name.toLowerCase();
      // replace invalid characters with dash are trim leading and trailing dashes
      snapName = snapName.replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
    }

    this.state = {
      snapName,
      nameMismatchDropdownExpanded: false,
      unconfiguredDropdownExpanded: props.configureIsOpen,
      unregisteredDropdownExpanded: props.registerNameIsOpen,
      removeDropdownExpanded: false,
      signAgreement: false
    };
  }

  saveState() {
    localforage.setItem(`repository_row_${this.props.snap.gitRepoUrl}`, this.state);
  }

  async loadState() {
    const item = `repository_row_${this.props.snap.gitRepoUrl}`;
    const state = await localforage.getItem(item);
    if (state) {
      this.setState(state);
    }
  }

  clearState() {
    localforage.removeItem(`repository_row_${this.props.snap.gitRepoUrl}`);
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      this.loadState();
    }
  }

  componentDidUpdate() {
    // save the component state in browser storage whenever it changes
    if (typeof window !== 'undefined') {
      this.saveState();
    }
  }

  toggleDropdownState(dropdown) {
    this.setState({
      // close all dropdowns
      nameMismatchDropdownExpanded: false,
      unconfiguredDropdownExpanded: false,
      editConfigDropdownExpanded: false,
      unregisteredDropdownExpanded: false,
      removeDropdownExpanded: false,

      // and toggle the one
      [dropdown]: !this.state[dropdown]
    });
  }

  onConfiguredClick() {
    this.toggleDropdownState('editConfigDropdownExpanded');
  }

  onNotConfiguredClick() {
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
    this.props.authActions.signIntoStore();
  }

  onSignAgreementChange(event) {
    this.setState({ signAgreement: event.target.checked });
  }

  onSnapNameChange(event) {
    const { fullName } = this.props;
    const snapName = event.target.value.replace(/[^a-z0-9-]/g, '');
    let clientValidationError = null;
    this.setState({ snapName });

    if (/^-|-$/.test(snapName)) {
      clientValidationError = {
        message: 'Sorry the name can\'t start or end with a hyphen.'
      };
    }

    this.props.nameActions.registerNameError(fullName, clientValidationError);
  }

  onRegisterSubmit(repositoryUrl, event) {
    event.preventDefault();

    // if name is invalid do nothing
    if (this.props.registerNameStatus.error) return;

    const { authStore, snap } = this.props;
    const repository = parseGitHubRepoUrl(repositoryUrl);
    const { snapName, signAgreement } = this.state;
    const requestBuilds = (!!snap.snapcraftData);

    this.props.nameActions.registerName(repository, snapName, {
      signAgreement: signAgreement ? authStore.userName : null,
      requestBuilds
    });
  }

  onRemoveClick(repositoryUrl) {
    this.props.snapActions.removeSnap(repositoryUrl);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.registerNameStatus.success &&
        !this.props.registerNameStatus.success) {
      this.closeUnregisteredTimerID = window.setTimeout(() => {
        this.closeUnregisteredDropdown();
        this.props.nameActions.registerNameClear(this.props.fullName);
      }, 2000);
    }

    // Close snap name mismatch dropdown if
    // name is updated and fixed
    if (snapNameIsMismatched(this.props.snap) && !snapNameIsMismatched(nextProps.snap)) {
      this.setState({
        nameMismatchDropdownExpanded: false
      });
    }

    if (nextProps.registerNameIsOpen !== this.props.registerNameIsOpen) {
      this.setState({
        unregisteredDropdownExpanded: nextProps.registerNameIsOpen
      });
    }

    if (nextProps.configureIsOpen !== this.props.configureIsOpen) {
      this.setState({
        unconfiguredDropdownExpanded: nextProps.configureIsOpen
      });
    }

    // Close edit config dropdown if
    // snapcraft.yml file is deleted
    if (snapIsConfigured(this.props.snap) && !snapIsConfigured(nextProps.snap)) {
      this.setState({
        editConfigDropdownExpanded: false
      });
    }

    // only attempt checking name ownership if user is authenticated
    // and we are not fetching any auth data (because fetched account info will
    // contain names already registered by given user)
    if (this.isAuthReady(nextProps)) {
      const nextSnapcraftData = nextProps.snap.snapcraftData;

      // if register name doesn't match snapcraft.yaml name verfify who
      // owns name in snapcraft.yaml
      if (snapNameIsMismatched(nextProps.snap)) {
        this.checkNameOwnership(nextProps.nameOwnership, nextSnapcraftData.name);
      }

      // if snap has a registered name, verify who owns it
      if (nextProps.snap.storeName) {
        this.checkNameOwnership(nextProps.nameOwnership, nextProps.snap.storeName);
      }
    }
  }

  isAuthReady(nextProps) {
    return (this.props.authStore.authenticated &&
        !nextProps.authStore.isFetching && !this.props.authStore.isFetching);
  }

  checkNameOwnership(nameOwnershipStore, name) {
    const nameOwnership = nameOwnershipStore[name];

    // don't fetch if we have the data or it's already fetching
    // also in case of error don't fetch again (to avoid fetching loop...)
    const isNameOwnershipAvailable = (nameOwnership &&
      (nameOwnership.status || nameOwnership.isFetching || nameOwnership.error)
    );

    if (!isNameOwnershipAvailable) {
      this.props.checkNameOwnership(name);
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
      isPublished,
      fullName,
      authStore,
      registerNameStatus,
      nameOwnership
    } = this.props;

    const showUnconfiguredDropdown = !snapIsConfigured(snap) && this.state.unconfiguredDropdownExpanded;
    const showEditConfigDropdown = this.state.editConfigDropdownExpanded;
    const showUnregisteredDropdown = this.state.unregisteredDropdownExpanded;
    const showRemoveDropdown = this.state.removeDropdownExpanded;
    const showNameMismatchDropdown = this.state.nameMismatchDropdownExpanded;
    const showRegisterNameInput = (
      showUnregisteredDropdown && authStore.authenticated
    );

    const registeredName = snap.storeName;

    const isBuilt = !!(latestBuild && snap.snapcraftData);

    const isActive = (
      showNameMismatchDropdown ||
      showUnconfiguredDropdown ||
      showEditConfigDropdown   ||
      showUnregisteredDropdown ||
      showRemoveDropdown
    );

    let isOwnerOfRegisteredName = (registeredName && nameOwnership[registeredName] &&
      nameOwnership[registeredName].status === NAME_OWNERSHIP_ALREADY_OWNED);

    return (
      <Row isActive={isActive}>

        {/* cells */}
        { this.renderRepoName(fullName, isBuilt) }
        { this.renderConfiguredStatus(snap) }
        { this.renderSnapName(registeredName, showRegisterNameInput, snap) }
        { this.renderBuildStatus(fullName, isBuilt, latestBuild) }
        { this.renderDelete() }

        {/* dropdowns */}
        { showNameMismatchDropdown &&
          <NameMismatchDropdown
            snap={snap}
            nameOwnership={nameOwnership}
            onOpenRegisterNameClick={this.onUnregisteredClick.bind(this)}
          />
        }
        { showUnconfiguredDropdown && <UnconfiguredDropdown snap={snap} /> }
        { showEditConfigDropdown &&
          <EditConfigDropdown
            repositoryUrl={ snap.gitRepoUrl }
            configFilePath={ snap.snapcraftData.path }
          />
        }
        { showUnregisteredDropdown &&
          <RegisterNameDropdown
            registeredName={registeredName}
            snapcraftData={snap.snapcraftData}
            isPublished={isPublished}
            snapName={this.state.snapName}
            authStore={authStore}
            registerNameStatus={registerNameStatus}
            onSignAgreementChange={this.onSignAgreementChange.bind(this)}
            onRegisterSubmit={this.onRegisterSubmit.bind(this, snap.gitRepoUrl)}
            onSignInClick={this.onSignInClick.bind(this)}
            onCancelClick={this.onUnregisteredClick.bind(this)}
            onSnapNameChange={this.onSnapNameChange.bind(this)}
          />
        }
        { showRemoveDropdown &&
          <RemoveRepoDropdown
            isBuilt={isBuilt}
            registeredName={registeredName}
            isOwnerOfRegisteredName={isOwnerOfRegisteredName}
            isAuthenticated={authStore.authenticated}
            onRemoveClick={this.onRemoveClick.bind(this, snap.gitRepoUrl)}
            onSignInClick={this.onSignInClick.bind(this)}
            onCancelClick={this.onToggleRemoveClick.bind(this)}
          />
        }
      </Row>
    );
  }

  renderRepoName(fullName, isLinked) {
    return (
      <DataLink col="28" to={ isLinked ? `/user/${fullName}` : null }>
        <strong>{ fullName }</strong>
      </DataLink>
    );
  }

  renderConfiguredStatus(snap) {
    const { snapcraftData } = snap;
    let onClick, content;

    if (!snapcraftData) {
      onClick = this.onNotConfiguredClick.bind(this);
      content = <span>Not configured</span>;
    } else if (snapNameIsMismatched(snap)){
      onClick = this.onNameMismatchClick.bind(this);
      content = <span><ErrorIcon /> Doesn’t match</span>;
    } else {
      onClick = this.onConfiguredClick.bind(this);
      content = <TickIcon />;
    }

    const active = (
      this.state.nameMismatchDropdownExpanded ||
      this.state.unconfiguredDropdownExpanded ||
      this.state.editConfigDropdownExpanded
    );

    return (
      <DataLink col="15" expandable={true} onClick={onClick} active={active}>
        { content }
      </DataLink>
    );
  }

  renderSnapName(registeredName, showRegisterNameInput, snap) {
    let onClick, content;

    if (registeredName !== null) {
      onClick = this.onUnregisteredClick.bind(this);
      content = <span><TickIcon /> { registeredName }</span>;
    } else if (showRegisterNameInput) {
      content = (
        <form onSubmit={this.onRegisterSubmit.bind(this, snap.gitRepoUrl)}>
          <input
            spellCheck={false}
            autoFocus={true}
            type='text'
            className={ styles.snapNameInput }
            value={ this.state.snapName }
            onChange={ this.onSnapNameChange.bind(this) }
          />
        </form>
      );
    } else {
      onClick = this.onUnregisteredClick.bind(this);
      content = <span>Not registered</span>;
    }

    const active = this.state.unregisteredDropdownExpanded;

    return (
      <DataLink col="21" expandable={true} onClick={onClick} active={active}>
        { content }
      </DataLink>
    );
  }

  renderBuildStatus(fullName, isBuilt, latestBuild) {
    return (
      <DataLink col="30" to={ isBuilt ? `/user/${fullName}` : null }>
        { isBuilt
          ? (
            <BuildStatus
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
      </DataLink>
    );
  }

  renderDelete() {
    return (
      <DataLink col="6"
        expandable={true}
        centered={true}
        active={ this.state.removeDropdownExpanded  }
        onClick={ this.onToggleRemoveClick.bind(this) }
      >
        <DeleteIcon />
      </DataLink>
    );
  }
}

const snapNameIsMismatched = (snap) => {
  const { snapcraftData, storeName } = snap;

  return snapcraftData && storeName && snapcraftData.name !== storeName;
};

const snapIsConfigured = (snap) => !!snap.snapcraftData;

RepositoryRowView.propTypes = {
  snap: PropTypes.shape({
    gitRepoUrl: PropTypes.string,
    storeName: PropTypes.string,
    snapcraftData: PropTypes.object
  }),
  latestBuild: PropTypes.shape({
    buildId: PropTypes.string,
    buildLogUrl: PropTypes.string,
    colour: PropTypes.string,
    dateStarted: PropTypes.string,
    statusMessage: PropTypes.string
  }),
  isPublished: PropTypes.bool,
  fullName: PropTypes.string,
  authStore: PropTypes.shape({
    isFetching: PropTypes.bool,
    authenticated: PropTypes.bool,
    userName: PropTypes.string
  }),
  registerNameStatus: PropTypes.shape({
    success: PropTypes.bool,
    error: PropTypes.object
  }),
  nameOwnership: PropTypes.object.isRequired,
  registerNameIsOpen: PropTypes.bool,
  configureIsOpen: PropTypes.bool,
  checkNameOwnership: PropTypes.func,
  authActions: PropTypes.object,
  nameActions: PropTypes.object,
  snapActions: PropTypes.object
};

function mapDispatchToProps(dispatch) {
  return {
    authActions: bindActionCreators(authStoreActionCreators, dispatch),
    nameActions: bindActionCreators(registerNameActionCreators, dispatch),
    snapActions: bindActionCreators(snapActionCreators, dispatch),
    checkNameOwnership: bindActionCreators(checkNameOwnership, dispatch)
  };
}

export default connect(null, mapDispatchToProps)(RepositoryRowView);
