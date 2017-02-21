import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';

import { Row, Data, Dropdown } from '../vanilla/table-interactive';
import BuildStatus from '../build-status';

import { parseGitHubRepoUrl } from '../../helpers/github-url';

class RepositoryRow extends Component {

  constructor(props) {
    super(props);

    this.state = {
      unconfiguredDropdownExpanded: false
    };
  }

  onConfiguredClick() {
    this.setState({
      unconfiguredDropdownExpanded: !this.state.unconfiguredDropdownExpanded
    });
  }

  renderNotConfiguredDropdown() {
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

  render() {
    const { snap, latestBuild } = this.props;
    const { fullName } = parseGitHubRepoUrl(snap.git_repository_url);

    const notConfigured = true;
    const showNotConfiguredDropdown = notConfigured && this.state.unconfiguredDropdownExpanded;

    const isActive = showNotConfiguredDropdown; // TODO (or any other dropdown)
    return (
      <Row isActive={isActive}>
        <Data col="30"><Link to={ `/${fullName}/builds` }>{ fullName }</Link></Data>
        <Data col="20">
          { this.renderConfiguredStatus.call(this, snap.snapcraft_data) }
        </Data>
        <Data col="20">
          { this.renderSnapName.call(this, snap.snapcraft_data) }
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
        { showNotConfiguredDropdown && this.renderNotConfiguredDropdown() }
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

  renderSnapName(snapcraftData) {
    if (snapcraftData && snapcraftData.name) {
      return (<div>{ snapcraftData.name }</div>);
    }

    return (<a>Not registered</a>);
  }
}

RepositoryRow.propTypes = {
  snap: PropTypes.shape({
    resource_type_link: PropTypes.string,
    git_repository_url: PropTypes.string,
    self_link: PropTypes.string
  }),
  latestBuild: PropTypes.shape({
    buildId: PropTypes.string,
    status: PropTypes.string,
    statusMessage: PropTypes.string
  })
};

export default RepositoryRow;
