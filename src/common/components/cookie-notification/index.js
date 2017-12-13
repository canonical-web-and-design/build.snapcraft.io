import React, { Component } from 'react';

// importing styles directly from cookie-policy module
import styles from '../../../../node_modules/cookie-policy/build/css/cookie-policy.css';

// Quick React-friendly reimplementation of cookie-policy script:
// https://github.com/canonical-webteam/cookie-policy/blob/master/src/js/cookie-policy.js
// Note: it doesn't support any settings (like custom content or delay)
export default class CookieNotification extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: false
    };
  }

  componentDidMount() {
    this.setState({
      isOpen: (this.getCookie('_cookies_accepted') !== 'true')
    });
  }

  closeCookie() {
    if (this.state.isOpen) {
      this.setState({ isOpen: false });
      this.setCookie('_cookies_accepted', 'true', 3000);
    }
  }

  setCookie(name, value, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    var expires = 'expires=' + d.toUTCString();
    document.cookie = name + '=' + value + '; ' + expires;
  }

  getCookie(name) {
    name = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return '';
  }

  onCloseClick(event) {
    event.preventDefault();
    this.closeCookie();
  }

  render() {
    return !this.state.isOpen ? null : (
      <dialog
        tabIndex="0"
        open="open"
        role="alertdialog"
        className={ styles['p-notification--cookie-policy'] }
        aria-labelledby="cookie-policy-title"
        aria-describedby="cookie-policy-content"
      >
        <h1 id="cookie-policy-title" className={ styles['u-off-screen'] }>
          Cookie policy notification
        </h1>
        <p
          className={ styles['p-notification__content'] }
          id="cookie-policy-content"
          role="document"
          tabIndex="0"
        >
          We use cookies to improve your experience. By your continued
          use of this site you accept such use. To change your settings
          please
          {' '}
          <a
            href="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy#cookies"
            target="_blank"
            rel="noopener noreferrer"
          >
            see our policy
          </a>.
          <button
            className={ styles['p-notification__close'] }
            aria-label="Close this cookie policy notification"
            onClick={ this.onCloseClick.bind(this) }
          >
            Close
          </button>
        </p>
      </dialog>
    );
  }
}
