import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { fetchBuilds, fetchSnap } from '../actions/snap-builds';
import { snapBuildsInitialStatus } from '../reducers/snap-builds';

function withSnapBuilds(WrappedComponent) {

  class WithSnapBuilds extends Component {

    fetchInterval = null

    fetchData({ snap, repository }) {
      if (snap && snap.selfLink) {
        this.props.dispatch(fetchBuilds(repository.url, snap.selfLink));
      } else if (repository) {
        this.props.dispatch(fetchSnap(repository.url));
      }
    }

    componentDidMount() {
      this.fetchData(this.props);

      this.fetchInterval = setInterval(() => {
        this.fetchData(this.props);
      }, 15000);
    }

    componentWillUnmount() {
      clearInterval(this.fetchInterval);
    }

    componentWillReceiveProps(nextProps) {
      const currentSnap = this.props.snap;
      const nextSnap = nextProps.snap;
      const currentRepository = this.props.repository.fullName;
      const nextRepository = nextProps.repository.fullName;

      if ((currentSnap !== nextSnap) || (currentRepository !== nextRepository)) {
        // if snap or repo changed, fetch new data
        this.fetchData(nextProps);
      }
    }

    render() {
      return (this.props.snapBuilds.success || this.props.snapBuilds.error
        ? <WrappedComponent {...this.props} />
        : null
      );
    }
  }
  WithSnapBuilds.displayName = `WithSnapBuilds(${getDisplayName(WrappedComponent)})`;

  WithSnapBuilds.propTypes = {
    repository: PropTypes.object,
    snap: PropTypes.object,
    snapBuilds: PropTypes.object,
    dispatch: PropTypes.func.isRequired
  };

  const mapStateToProps = (state) => {
    const repository = state.repository;

    // get snap for given repo
    const snap = state.entities.snaps[repository.url];

    // get builds for given repo from the store or set default empty values
    const snapBuilds = state.snapBuilds[repository.fullName] || snapBuildsInitialStatus;

    return {
      repository,
      snap,
      snapBuilds
    };
  };

  return connect(mapStateToProps)(WithSnapBuilds);
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export default withSnapBuilds;
