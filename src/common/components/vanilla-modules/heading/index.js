import React, { PropTypes } from 'react';
import classNames from 'classnames';

import styles from '../../../style/vanilla/css/headings.css';

const Heading = (props) => {
  const H = props.heading;
  const headingClassnames = {
    h1: 'p-heading--one',
    h2: 'p-heading--two',
    h3: 'p-heading--three',
    h4: 'p-heading--four',
    h5: 'p-heading--five',
    h6: 'p-heading--six'
  };
  const className = props.className;
  const headingClass = classNames({
    [styles[headingClassnames[H]]]: true,
    [className]: className
  });
  return (
    <H className={ headingClass }>
      { props.children }
    </H>
  );
};

Heading.defaultProps = {
  heading: 'h1',
  className: ''
};

Heading.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  heading: PropTypes.oneOf(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
};

const HeadingOne = (props) => Heading({
  ...props,
  heading: 'h1'
});

const HeadingTwo = (props) => Heading({
  ...props,
  heading: 'h2'
});

const HeadingThree = (props) => Heading({
  ...props,
  heading: 'h3'
});

const HeadingFour = (props) => Heading({
  ...props,
  heading: 'h4'
});

const HeadingFive = (props) => Heading({
  ...props,
  heading: 'h5'
});

const HeadingSix = (props) => Heading({
  ...props,
  heading: 'h6'
});

export {
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  HeadingFour,
  HeadingFive,
  HeadingSix
};
