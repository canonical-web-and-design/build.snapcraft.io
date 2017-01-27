import React, { Component, PropTypes } from 'react';

import { setGitHubRepository } from '../actions/create-snap';

function withRepository(WrappedComponent) {

  class WithRepository extends Component {

    componentDidMount() {
      if (!this.props.repository && this.props.fullName) {
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

      return (this.props.repository
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

  return WithRepository;
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export default withRepository;
