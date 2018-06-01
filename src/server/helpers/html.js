import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom/server';
import Helmet from 'react-helmet';
import { Provider } from 'react-redux';

import { conf } from '../helpers/config';

import style from '../../common/style/vanilla/css/footer.css';

const GAID = conf.get('GOOGLE_ANALYTICS_ID');
const OPTID = conf.get('GOOGLE_OPTIMIZE_ID');
const GTMID = conf.get('GOOGLE_TAG_MANAGER_ID');
const SENTRY_DSN_PUBLIC = conf.get('SENTRY_DSN_PUBLIC');

const googleOptimizePageHideCss = GAID && OPTID ?
  <style
    dangerouslySetInnerHTML={{ __html: '.async-hide { opacity: 0 !important}' }}
  />
  : null;

const googleOptimizePageHide = GAID && OPTID ?
  <script
    dangerouslySetInnerHTML={{ __html: `
    (function(a,s,y,n,c,h,i,d,e){s.className+=' '+y;h.start=1*new Date;
    h.end=i=function(){s.className=s.className.replace(RegExp(' ?'+y),'')};
    (a[n]=a[n]||[]).hide=h;setTimeout(function(){i();h.end=null},c);h.timeout=c;
    })(window,document.documentElement,'async-hide','dataLayer',4000,
    {'${OPTID}':true});` }}
  />
 : null;

const googleAnalytics = GAID && OPTID ?
  <script
    dangerouslySetInnerHTML={{ __html: `
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
    ga('create', '${GAID}', 'auto', {'allowLinker': true});
    ga('require', 'linker');
    ga('linker:autoLink', ['snapcraft.io', 'build.snapcraft.io', 'dashboard.snapcraft.io',
    'conjure-up.io', 'login.ubuntu.com', 'www.ubuntu.com', 'ubuntu.com', 'insights.ubuntu.com',
    'developer.ubuntu.com', 'cn.ubuntu.com', 'design.ubuntu.com', 'maas.io', 'canonical.com',
    'landscape.canonical.com', 'pages.ubuntu.com', 'tutorials.ubuntu.com', 'docs.ubuntu.com']);
    ga('require', '${OPTID}');` }}
  />
 : null;

const googleTagManager = GTMID ?
  <script
    dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer', '${GTMID}')` }}
  /> : null;

const googleTagManagerNoScript = GTMID ?
  <noscript>
    <iframe
      src="https://www.googletagmanager.com/ns.html?id=${GTMID}"
      height="0"
      width="0"
      style={{
        display: 'none',
        visibility: 'hidden'
      }}
    />
  </noscript>
  : null;

export default class Html extends Component {
  render() {
    const { assets, store, component, config, csrfToken } = this.props;
    const preloadedState = store.getState();
    const content = component ? this.renderComponent(component, store) : '';

    // read Helmet props after component is rendered
    const head = Helmet.rewind();
    const attrs = head.htmlAttributes.toComponent();

    return (
      <html {...attrs}>
        <head>
          { googleOptimizePageHideCss }
          { googleOptimizePageHide }
          { googleAnalytics }
          { googleTagManager }
          {head.title.toComponent()}
          {head.meta.toComponent()}
          {head.link.toComponent()}
          {head.script.toComponent()}
          <link rel="icon" type="image/png" href="https://assets.ubuntu.com/v1/fdc99abe-ico_16px.png" sizes="16x16" />
          <link rel="icon" type="image/png" href="https://assets.ubuntu.com/v1/0f3c662c-ico_32px.png" sizes="32x32" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Ubuntu:300,400" />
          <link rel="stylesheet" href={ assets.main.css } />
          {
           /*
            Insert third party scripts (e.g. Stripe) here.
            Trying to load them with Helmet will make them
            load twice.
           */
          }
        </head>
        <body>
          { googleTagManagerNoScript }
          <div id="content" className={ style.content } dangerouslySetInnerHTML={{ __html: content }}/>
          {
            SENTRY_DSN_PUBLIC &&
            <script src="https://cdn.ravenjs.com/3.25.1/raven.min.js" crossOrigin="anonymous"></script>
          }
          {
            SENTRY_DSN_PUBLIC &&
            <script
              dangerouslySetInnerHTML={{ __html: `Raven.config('${ SENTRY_DSN_PUBLIC }').install();` }}
            />
          }
          <script
            dangerouslySetInnerHTML={{ __html: `window.__CONFIG__ = ${JSON.stringify(config)}` }}
          />
          <script
            dangerouslySetInnerHTML={{ __html: `window.__CSRF_TOKEN__ = ${JSON.stringify(csrfToken)}` }}
          />
          <script
            dangerouslySetInnerHTML={{ __html: `window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState)}` }}
          />
          <script src={ assets.main.js } />
        </body>
      </html>
    );
  }

  renderComponent(component, store) {
    return ReactDOM.renderToString(
      <Provider store={store} key="provider">
        { component }
      </Provider>
    );
  }
}

Html.propTypes = {
  config: PropTypes.object,
  component: PropTypes.node,
  store: PropTypes.object,
  csrfToken: PropTypes.string,
  assets: PropTypes.shape({
    main: PropTypes.shape({
      js: PropTypes.string,
      css: PropTypes.string
    })
  })
};
