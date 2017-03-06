import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { setGitHubRepository } from '../actions/create-snap';

function withRepository(WrappedComponent) {

  class WithRepository extends Component {

    componentDidMount() {
      if ((!this.props.repository && this.props.fullName) ||
          (this.props.repository.fullName !== this.props.fullName)) {
        this.props.dispatch(setGitHubRepository(this.props.fullName));
      }
    }

    componentWillReceiveProps(nextProps) {
      if (this.props.fullName !== nextProps.fullName) {
        this.props.dispatch(setGitHubRepository(nextProps.fullName));
      }
    }

    render() {
      const { fullName, ...passThroughProps } = this.props; // eslint-disable-line no-unused-vars

      // only render if current repo in the store matches repo in URL params
      const { repository } = this.props;
      const isReady = repository && repository.fullName === fullName;

      return (isReady
        ? <WrappedComponent {...passThroughProps} />
        : null
      );
    }
  }
  WithRepository.displayName = `WithRepository(${getDisplayName(WrappedComponent)})`;

  WithRepository.propTypes = {
    fullName: PropTypes.string.isRequired,
    repository: PropTypes.object,
    dispatch: PropTypes.func.isRequired
  };

  const mapStateToProps = (state, ownProps) => {
    const owner = ownProps.params.owner.toLowerCase();
    const name = ownProps.params.name.toLowerCase();
    const fullName = `${owner}/${name}`;
    const repository = state.repository;

    return {
      fullName,
      repository
    };
  };

  return connect(mapStateToProps)(WithRepository);
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export default withRepository;
