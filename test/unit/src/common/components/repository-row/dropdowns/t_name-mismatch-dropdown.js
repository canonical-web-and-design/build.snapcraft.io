import { shallow } from 'enzyme';
import expect from 'expect';
import React from 'react';
import url from 'url';

import {
  NAME_OWNERSHIP_NOT_REGISTERED,
  NAME_OWNERSHIP_REGISTERED_BY_OTHER_USER
} from '../../../../../../../src/common/actions/name-ownership';
import NameMismatchDropdown from '../../../../../../../src/common/components/repository-row/dropdowns/name-mismatch-dropdown';

describe('<NameMismatchDropdown />', () => {
  const baseProps = {
    snap: {
      gitRepoUrl: 'https://github.com/anowner/aname',
      gitBranch: 'dev',
      snapcraftData: { name: 'snap-name', path: 'snap/snapcraft.yaml' },
      storeName: 'store-name'
    }
  };
  let view;

  context('if there is no name ownership data', function() {
    beforeEach(function() {
      const props = { ...baseProps, nameOwnership: {} };
      view = shallow(<NameMismatchDropdown { ...props } />);
    });

    it('renders only main paragraph', function() {
      expect(view.find('p').text()).toInclude(
        'The snapcraft.yaml uses the snap name “snap-name”, but you’ve ' +
        'registered the name “store-name”.'
      );
    });

    it('does not render any links', function() {
      expect(view.find('a')).toNotExist();
    });
  });

  context('if the store name is unregistered', function() {
    beforeEach(function() {
      const props = {
        ...baseProps,
        nameOwnership: {
          'snap-name': { 'status': NAME_OWNERSHIP_NOT_REGISTERED }
        }
      };
      view = shallow(<NameMismatchDropdown { ...props } />);
    });

    it('renders main paragraph', function() {
      expect(view.find('p').first().text()).toInclude(
        'The snapcraft.yaml uses the snap name “snap-name”, but you’ve ' +
        'registered the name “store-name”.'
      );
    });

    it('renders link to edit snapcraft.yaml', function() {
      expect(url.parse(view.find('a').at(0).prop('href'))).toMatch({
        protocol: 'https:',
        host: 'github.com',
        pathname: '/anowner/aname/edit/dev/snap/snapcraft.yaml'
      });
    });

    it('renders link to register name', function() {
      expect(view.find('a').at(1).text()).toBe('Register the name');
    });
  });

  context('if the store name is registered by someone else', function() {
    beforeEach(function() {
      const props = {
        ...baseProps,
        nameOwnership: {
          'snap-name': { 'status': NAME_OWNERSHIP_REGISTERED_BY_OTHER_USER }
        }
      };
      view = shallow(<NameMismatchDropdown { ...props } />);
    });

    it('renders main paragraph', function() {
      expect(view.find('p').first().text()).toInclude(
        'The snapcraft.yaml uses the snap name “snap-name”, but you’ve ' +
        'registered the name “store-name”.'
      );
    });

    it('renders link to edit snapcraft.yaml', function() {
      expect(url.parse(view.find('a').at(0).prop('href'))).toMatch({
        protocol: 'https:',
        host: 'github.com',
        pathname: '/anowner/aname/edit/dev/snap/snapcraft.yaml'
      });
    });

    it('does not render link to register name', function() {
      expect(view.find((node) => {
        return (
          node.type() === 'a' &&
          node.text() === 'Register the name');
      })).toNotExist();
    });

    it('renders explanatory text', function() {
      const helpText = view.find('p').at(1).text();
      expect(helpText).toInclude('“snap-name” is registered to someone else.');
      expect(helpText).toInclude('to use “store-name” instead');
    });
  });
});
