import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';

import Header from '../../../../../../src/common/components/header';

describe('<Header />', function() {
  let element;

  context('when user is not authenticated', () => {
    beforeEach(() => {
      element = shallow(<Header authenticated={false} user={null} />);
    });

    it('should render logo link', () => {
      expect(element.find({ href: 'https://snapcraft.io' }).length).toBe(1);
    });

    it('should render sign in link', () => {
      expect(element.find({ href: '/auth/authenticate' }).length).toBe(1);
    });
  });

  context('when user is authenticated', () => {
    const user = {
      name: 'Joe Doe',
      login: 'jdoe'
    };

    beforeEach(() => {
      element = shallow(<Header authenticated={true} user={user} />);
    });

    it('should render logo link', () => {
      expect(element.find({ href: 'https://snapcraft.io' }).length).toBe(1);
    });

    it('should render user name', () => {
      expect(element.html().indexOf('Hi, Joe Doe')).toBeGreaterThan(0);
    });

    context('when user has no name', () => {
      const user = {
        login: 'jdoe'
      };

      beforeEach(() => {
        element = shallow(<Header authenticated={true} user={user} />);
      });

      it('should render login as user name', () => {
        expect(element.html().indexOf('Hi, jdoe')).toBeGreaterThan(0);
      });
    });
  });

});
