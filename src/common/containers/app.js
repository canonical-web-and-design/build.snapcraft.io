import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';

import Header from '../components/header';
import Footer from '../components/footer';
import CookieNotification from '../components/cookie-notification';
import Notification from '../components/vanilla-modules/notification';

import styles from './container.css';

export class App extends Component {
  render() {
    return (
      <div>
        <Helmet
          htmlAttributes={{ 'lang': 'en' }}
          titleTemplate='build.snapcraft.io - %s'
          defaultTitle='build.snapcraft.io'
          meta={[
            { 'name': 'description', 'content': 'build.snapcraft.io' },
          ]}
        />
        <Header
          authenticated={this.props.auth.authenticated}
          user={this.props.user}
          dispatch={this.props.dispatch}
        />
        <div className={ styles.container }>
          <Notification appearance='negative'>
            The build farm is disabled pending maintenance; we do not yet have an ETA. We apologise for the inconvenience.
          </Notification>
        </div>
        { this.props.children }
        <Footer />
        <CookieNotification />
      </div>
    );
  }
}

App.propTypes = {
  children: PropTypes.node,
  auth: PropTypes.object,
  user: PropTypes.object,
  dispatch: PropTypes.func
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

export default connect(mapStateToProps)(App);
