import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';

import Header from '../components/header';
import Footer from '../components/footer';
import CookieNotification from '../components/cookie-notification';
import SessionOverlay from '../components/session-overlay';

import style from '../style/vanilla/css/footer.css';

export class App extends Component {
  render() {
    return (
      <div className={style.hasStickyFooter}>
        <Helmet
          titleTemplate='build.snapcraft.io - %s'
          defaultTitle='build.snapcraft.io'
        >
          <html lang='en' />
          <meta name='description' content='build.snapcraft.io' />
        </Helmet>
        <Header
          authenticated={this.props.auth.authenticated}
          user={this.props.user}
          dispatch={this.props.dispatch}
        />
        { this.props.children }
        <Footer />
        <SessionOverlay />
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
