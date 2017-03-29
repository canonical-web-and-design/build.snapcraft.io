import expect, { createSpy } from 'expect';
import React from 'react';
import { shallow } from 'enzyme';

import Notification from '../../../../../../src/common/components/vanilla/notification';

describe('The Notification component', () => {
  let element;

  context('when message prop is supplied', () => {
    beforeEach(() => {
      element = shallow(<Notification message="Message" />);
    });
    it('should render message', () => {
      expect(element.containsMatchingElement(<p>Message</p>)).toExist();
    });
  });

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

  context('when status prop is "success"', () => {
    beforeEach(() => {
      element = shallow(<Notification status="success" />);
    });

    it('should render a success status', () => {
      expect(element.text()).toMatch('Success');
    });
  });

  context('when status prop is "warning"', () => {
    beforeEach(() => {
      element = shallow(<Notification status="warning" />);
    });

    it('should render a warning status', () => {
      expect(element.text()).toMatch('Warning');
    });
  });

  context('when status prop is "error"', () => {
    beforeEach(() => {
      element = shallow(<Notification status="error" />);
    });

    it('should render a error status', () => {
      expect(element.text()).toMatch('Error');
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
