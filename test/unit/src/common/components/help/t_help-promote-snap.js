import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';

import { HelpPromoteSnap } from '../../../../../../src/common/components/help';

describe('<HelpPromoteSnap />', function() {

  let wrapper;
  const name = 'needleinhaystack';
  const revision = 14159265358979;

  context('when rendered with headline', () => {
    const headline='This is just a test';

    beforeEach(function() {
      wrapper = shallow(<HelpPromoteSnap headline={headline} name={ name } revision={ revision } />);
    });

    it('should include passed headling', function() {
      expect(wrapper.find('HeadingThree').shallow().text()).toInclude(headline);
    });
  });

  context('when rendered with devmode confinement', () => {
    beforeEach(function() {
      wrapper = shallow(<HelpPromoteSnap name={ name } revision={ revision } confinement="devmode"/>);
    });

    it('should render heading only for beta channel', function() {
      expect(wrapper.find('HeadingThree').shallow().text()).toInclude('beta?');
    });

    it('should render instructions only for beta channel', function() {
      expect(wrapper.text()).toInclude(`snapcraft release ${name} ${revision} beta`);
      expect(wrapper.text()).toExclude(`snapcraft release ${name} ${revision} candidate`);
      expect(wrapper.text()).toExclude(`snapcraft release ${name} ${revision} stable`);
    });

    it('should render link to channels help', function() {
      expect(wrapper.containsMatchingElement(<a>confinement: devmode</a>)).toBe(true);
    });
  });

  context('when rendered with non-devmode confinement', () => {
    beforeEach(function() {
      wrapper = shallow(<HelpPromoteSnap name={ name } revision={ revision } confinement="strict"/>);
    });

    it('should render heading only for beta channel', function() {
      expect(wrapper.find('HeadingThree').shallow().text()).toInclude('beta, candidate or stable?');
    });

    it('should render instructions only for beta channel', function() {
      expect(wrapper.text()).toInclude(`snapcraft release ${name} ${revision} beta`);
      expect(wrapper.text()).toInclude(`snapcraft release ${name} ${revision} candidate`);
      expect(wrapper.text()).toInclude(`snapcraft release ${name} ${revision} stable`);
    });

    it('should not render link to channels help', function() {
      expect(wrapper.containsMatchingElement(<a>confinement: devmode</a>)).toBe(false);
    });
  });
});
