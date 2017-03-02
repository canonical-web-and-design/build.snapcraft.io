import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';

import Header from '../../../../../../src/common/components/header';
import { Link } from 'react-router';

describe('<Header />', function() {
  let element;

  context('when user is not authenticated', () => {
    beforeEach(() => {
      element = shallow(<Header authenticated={false} user={null} />);
    });

    it('should render logo link', () => {
      expect(element.findWhere(isLinkTo('/')).length).toBe(1);
    });

    it('should not render dashboard link', () => {
      expect(element.findWhere(isLinkTo('/dashboard')).length).toBe(0);
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
      expect(element.findWhere(isLinkTo('/')).length).toBe(1);
    });

    it('should render user name', () => {
      expect(element.html().indexOf('Hi, Joe Doe')).toBeGreaterThan(0);
    });

    it('should render dashboard link', () => {
      expect(element.findWhere(isLinkTo('/dashboard')).length).toBe(1);
    });

    it('should render sign out link', () => {
      expect(element.containsMatchingElement(<a>Sign out</a>)).toBe(true);
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

const isLinkTo = (to) => {
  return (element) => element.is(Link) && (element.prop('to') === to);
};
