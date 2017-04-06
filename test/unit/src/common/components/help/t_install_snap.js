import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';

import HelpInstallSnap from '../../../../../../src/common/components/help/install-snap';

describe('<HelpInstallSnap />', function() {

  let wrapper;
  const heading='This is just a test';

  context('when rendered with name and revision', () => {
    const name = 'needleinhaystack';
    const revision = 14159265358979;

    beforeEach(function() {
      wrapper = shallow(<HelpInstallSnap heading={heading} name={ name } revision={ revision } />);
    });

    it('should include snap name', function() {
      expect(wrapper.text()).toInclude(name);
    });

    it('should include revision number', function() {
      expect(wrapper.text()).toInclude(revision);
    });

    it('should include help link', function() {
      expect(wrapper.text()).toInclude('Don’t have snapd installed?');
    });

    it('should include no-auto-update warning', function() {
      expect(wrapper.text()).toInclude(
        'The installed snap will not be auto-updated.');
    });
  });

  context('when rendered with children', () => {
    beforeEach(function() {
      wrapper = shallow(<HelpInstallSnap heading={heading}>command test</HelpInstallSnap>);
    });

    it('should include command passed as children', function() {
      expect(wrapper.text()).toInclude('command test');
    });

    it('should not include snap install instructions', function() {
      expect(wrapper.text()).toNotInclude('snap install');
    });

    it('should include help link', function() {
      expect(wrapper.text()).toInclude('Don’t have snapd installed?');
    });

    it('should not include no-auto-update warning', function() {
      expect(wrapper.text()).toNotInclude(
        'The installed snap will not be auto-updated.');
    });
  });
});
