import React, { PropTypes } from 'react';

import styles from './step.css';
import completeIcon from './complete.svg';

const Step = (props) => {
  const { number, complete, children } = props;

  return (
    <li className={ [styles.step, complete && styles.complete ].join(' ') }>
      <div className={ styles.number }>
        { number }.
      </div>
      <div className={ styles.content }>
        { children }
      </div>
      <div className={ styles.indicatorWrapper }>
        { complete &&
          <img src={ completeIcon } className={ styles.indicator } alt="Complete" />
        }
      </div>
    </li>
  );
};

Step.propTypes = {
  number: PropTypes.string,
  complete: PropTypes.bool,
  children: PropTypes.node,
};

export default Step;
