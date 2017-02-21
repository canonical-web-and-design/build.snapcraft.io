import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { HeadingOne, HeadingThree } from '../vanilla/heading';
import styles from './user-avatar.css';

class UserAvatar extends Component {

  render() {
    const { auth, user } = this.props;

    if (!auth.authenticated) return;

    return (
      <div className={ styles.container }>
        <div className={ styles.avatar }>
          <img src={ user.avatar_url } />
        </div>
        <div className={ styles.headings }>
          <HeadingOne>{ user.name }</HeadingOne>
          <HeadingThree>{ user.login }</HeadingThree>
        </div>
      </div>
    );
  }
}

UserAvatar.propTypes = {
  auth: PropTypes.object,
  user: PropTypes.object
};

function mapStateToProps(state) {
  const {
    auth,
    user
  } = state;

  return {
    auth,
    user
  };
}

export default connect(mapStateToProps)(UserAvatar);
