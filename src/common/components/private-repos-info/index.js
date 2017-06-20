import React, { Component, PropTypes } from 'react';

import Popover from '../popover';

import PrivateReposInfo from './private-repos-info';
import styles from './private-repos-info.css';

export default class PrivateReposInfoPopover extends Component {
  constructor() {
    super();

    this.state = {
      showPopover: false,
      popoverOffsetLeft: 0,
      popoverOffsetTop: 0,
    };
  }

  componentDidMount() {
    this.onBoundDocumentClick = this.onDocumentClick.bind(this);
    document.addEventListener('click', this.onBoundDocumentClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onBoundDocumentClick);
  }

  onDocumentClick() {
    this.setState({
      showPopover: false
    });
  }

  onHelpClick(event) {
    // prevent help click from triggering document click
    event.nativeEvent.stopImmediatePropagation();

    const { target } = event;

    this.setState({
      showPopover: !this.state.showPopover,
      popoverOffsetLeft: target.offsetLeft + (target.offsetWidth / 2),
      popoverOffsetTop: target.offsetTop + target.offsetHeight
    });
  }

  onPopoverClick(event) {
    // prevent popover from closing when it's clicked
    event.nativeEvent.stopImmediatePropagation();
  }

  render() {
    return (
      <div className={ styles.info }>
        <p>(<a onClick={this.onHelpClick.bind(this)}>Any repos missing from this list?</a>)</p>
        { this.state.showPopover &&
          <Popover
            left={this.state.popoverOffsetLeft}
            top={this.state.popoverOffsetTop}
            onClick={this.onPopoverClick.bind(this)}
          >
            <PrivateReposInfo
              user={this.props.user}
              onRefreshClick={this.props.onRefreshClick}
            />
          </Popover>
        }
      </div>
    );
  }

  onRefreshClick() {
    this.setState({
      showPopover: false
    });
    this.props.onRefreshClick();
  }
}

PrivateReposInfoPopover.propTypes = {
  user: PropTypes.shape({
    orgs: PropTypes.array
  }).isRequired,
  onRefreshClick: PropTypes.func
};
