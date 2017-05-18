import React, { Component, PropTypes } from 'react';

import styles from './styles.css';

// https://dev.twitter.com/web/tweet-button/web-intent
export class Tweet extends Component {
  render() {
    const { text } = this.props;
    // a valid snap name should not need encoding, but belt and braces ...
    let encodedText =  encodeURIComponent(text);

    return (
      <a
        className={ `${styles.share} ${styles.tweet}`}
        href={`https://twitter.com/intent/tweet?text=${encodedText}`}
      />
    );
  }
}

Tweet.propTypes = {
  text: PropTypes.string.isRequired
};
