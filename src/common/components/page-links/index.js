import React, { Component, PropTypes } from 'react';

import styles from './styles.css';

const LINK_LABEL_OPTIONS = ['first', 'prev', 'next', 'last'];

export default class PageLinks extends Component {

  render() {
    const renderLink = this.renderLink.bind(this);

    let links = LINK_LABEL_OPTIONS.map((item) => {
      return renderLink(
        this.props[item],
        item
      );
    });

    return (
      <ul className={ styles.container }>
        { links }
      </ul>
    );
  }

  renderLink(item, label) {
    let url;

    if (typeof item == 'string') {
      url = item;
    }

    if (typeof item == 'undefined') {
      return (
        <li key={ label } className={ styles.link }>
          <div>
            { label }
          </div>
        </li>
      );
    }

    return (
      <li key={ label } className={ styles.link }>
        <a href={ url } onClick={ this.onClick.bind(this, item) }>
          { label }
        </a>
      </li>
    );
  }

  onClick(item) {
    this.props.onClick(item);
  }
}

PageLinks.propTypes = {
  first: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  prev: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  next: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  last: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onClick: PropTypes.func
};
