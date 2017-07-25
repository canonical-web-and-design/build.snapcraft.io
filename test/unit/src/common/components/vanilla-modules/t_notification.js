import expect, { createSpy } from 'expect';
import React from 'react';
import { shallow } from 'enzyme';

import Notification from '../../../../../../src/common/components/vanilla-modules/notification';

describe('The Notification component', () => {
  let element;

  context('when children prop is supplied', () => {
    beforeEach(() => {
      element = shallow((
        <Notification>Message</Notification>)
      );
    });

    it('should render message', () => {
      expect(element.text()).toInclude('Message');
    });
  });

  context('when status prop is not supplied', () => {
    beforeEach(() => {
      element = shallow(<Notification />);
    });

    it('should not render a status', () => {
      expect(element.text()).toNotMatch(/Error|Warning|Success/);
    });
  });

  context('when status is supplied', () => {
    beforeEach(() => {
      element = shallow(<Notification status="success" />);
    });

    it('should render a success status', () => {
      expect(element.text()).toMatch('Success');
    });
  });

  context('when onRemoveClick callback is supplied', () => {
    let callback = createSpy();

    beforeEach(() => {
      element = shallow(
        <Notification
          onRemoveClick={ callback }
        />
      );
    });

    it('should render remove icon', () => {
      expect(element.containsMatchingElement(<a tabIndex="0" onClick={callback} />)).toBe(true);
    });
  });
});
