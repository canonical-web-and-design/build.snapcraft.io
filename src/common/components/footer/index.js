import React, { Component } from 'react';

import style from '../../style/vanilla/css/footer.css';
import gridStyle from '../../style/vanilla/css/grid.css';

export default class Footer extends Component {

  backToTop(event) {
    event.preventDefault();
    document.body.scrollTo(0,0);
  }

  render() {
    return (
      <footer className={`${style['p-footer']} ${style['p-strip--light']} ${style['p-sticky-footer']}`}>
        <div className={ gridStyle['row'] }>
          <div className={ gridStyle['col-8'] }>
            <nav className={ style['p-footer__nav'] }>
              <ul className={ style['p-footer__links'] }>
                <li className={ style['p-footer__item'] }>
                  <a
                    className={ style['p-footer__link'] }
                    href="#content"
                    onClick={this.backToTop.bind(this)}
                  >
                    Back to top<i className={ style['p-icon--top'] }></i>
                  </a>
                </li>
              </ul>
            </nav>
            <p>&copy; 2018 Canonical Ltd. <br/> Ubuntu and Canonical are registered trademarks of Canonical Ltd.</p>
            <p>
              You can contribute to, or report problems with,
              {' '}
              <a
                className={ style['p-link--external'] }
                href="https://bugs.launchpad.net/snappy"
              >snapd</a>,
              {' '}
              <a
                className={ style['p-link--external'] }
                href="https://github.com/snapcore/snapcraft/issues"
              >Snapcraft</a>,
              {' '}
              or
              {' '}
              <a
                className={ style['p-link--external'] }
                href="https://github.com/canonical-websites/build.snapcraft.io/issues"
              >this site</a>.
              <br />
              Powered by <a href="https://www.ubuntu.com/kubernetes">the Canonical Distribution of Kubernetes</a>
              {' '}&#183;{' '}
              <a href="https://status.snapcraft.io/">Service status</a>
            </p>
          </div>
          <div className={ gridStyle['col-4'] }>
            <ul className={ style['p-inline-list--compact'] }>
              <li className={ style['p-inline-list__item'] }>
                <a href="https://twitter.com/snapcraftio" className={ style['p-social-icon--twitter'] }>Share on Twitter</a>
              </li>
              <li className={ style['p-inline-list__item'] }>
                <a href="https://plus.google.com/+SnapcraftIo" className={ style['p-social-icon--google'] }>Share on Google plus</a>
              </li>
              <li className={ style['p-inline-list__item'] }>
                <a href="https://www.facebook.com/snapcraftio" className={ style['p-social-icon--facebook'] }>Share on Facebook</a>
              </li>
              <li className={ style['p-inline-list__item'] }>
                <a href="https://www.youtube.com/snapcraftio" className={ style['p-social-icon--youtube'] }>Share on YouTube</a>
              </li>
            </ul>
          </div>
        </div>
      </footer>

    );
  }
}
