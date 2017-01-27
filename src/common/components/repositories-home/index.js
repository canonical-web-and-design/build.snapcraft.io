import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { fetchUserRepositories } from '../../actions/repositories';
import { Anchor } from '../button';
import Step from '../step';
import RepositoriesList from '../repositories-list';

class RepositoriesHome extends Component {
  componentDidMount() {
    const { authenticated } = this.props.auth;

    if (authenticated) {
      this.props.dispatch(fetchUserRepositories());
    }
  }

  render() {
    return (
      <div>
        <h2>Welcome</h2>
        <p>To get started building snaps, sign in with GitHub and tell us about your repository.</p>
        <ol>
          { this.step1.call(this) }
          { this.step2.call(this) }
        </ol>
      </div>
    );
  }

  step1() {
    const { authenticated } = this.props.auth;

    return (
      <Step number="1" complete={ authenticated }>
        <Anchor href="/auth/authenticate">Log in with GitHub</Anchor>
      </Step>
    );
  }

  step2() {
    return (
      <Step number="2">
        Choose one of your repositories
        <RepositoriesList />
      </Step>
    );
  }
}

RepositoriesHome.propTypes = {
  auth: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    auth
  } = state;

  return {
    auth
  };
}

export default connect(mapStateToProps)(RepositoriesHome);
