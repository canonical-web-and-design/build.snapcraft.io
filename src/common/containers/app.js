import React, { PropTypes, Component } from 'react';
import Helmet from 'react-helmet';

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
        { this.props.children }
      </div>
    );
  }
}

App.propTypes = {
  children: PropTypes.node
};

export default App;
