import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { HeadingOne, HeadingThree } from '../vanilla-modules/heading';
import styles from './user-avatar.css';

export class UserAvatarView extends Component {

  render() {
    const { auth, user } = this.props;

    if (!auth.authenticated) return null;

    return (
      <div className={ styles.container }>
        <div className={ styles.avatar }>
          <img src={ user.avatar_url } />
        </div>
        <div className={ styles.headings }>
          <HeadingOne>{ user.name || user.login }</HeadingOne>
          { user.name &&
            <div className={ styles.login }>
              <HeadingThree>{ user.login }</HeadingThree>
            </div>
          }
        </div>
      </div>
    );
  }
}

UserAvatarView.propTypes = {
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

export default connect(mapStateToProps)(UserAvatarView);
