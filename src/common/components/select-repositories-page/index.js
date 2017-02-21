import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { fetchUserRepositories } from '../../actions/repositories';
import SelectRepositoryList from '../select-repository-list';
import { HeadingThree } from '../vanilla/heading';
import FirstTimeHeading from '../first-time-heading';
import { CardHighlighted } from '../vanilla/card';

class SelectRepositoriesPage extends Component {
  componentDidMount() {
    const { authenticated } = this.props.auth;

    if (authenticated) {
      this.props.dispatch(fetchUserRepositories());
    }
  }

  render() {
    const { snaps, snapBuilds } = this.props;
    return (
      <div>
        <FirstTimeHeading  snaps={snaps} snapBuilds={snapBuilds} />
        <CardHighlighted>
          <HeadingThree>
            Choose repos to add
          </HeadingThree>
          <SelectRepositoryList/>
        </CardHighlighted>
      </div>
    );
  }
}

SelectRepositoriesPage.propTypes = {
  auth: PropTypes.object.isRequired,
  snaps: PropTypes.object.isRequired,
  snapBuilds: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    auth,
    snaps,
    snapBuilds
  } = state;

  return {
    auth,
    snaps,
    snapBuilds
  };
}

export default connect(mapStateToProps)(SelectRepositoriesPage);
