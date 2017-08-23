import expect from 'expect';
import { shallow } from 'enzyme';

import { BuildHistory } from '../../../../../../src/common/components/build-history';

describe('<BuildHistory />', function() {

  let testProps;

  beforeEach(function() {
    testProps = {
      success: true,
      repository: 'http://example.com/foo',
      builds: [{
        buildId: '0'
      }, {
        buildId: '5'
      }, {
        buildId: '17'
      }, {
        buildId: '10'
      }]
    };
  });

  it('should return null if success is falsey', function() {
    const props = Object.assign({}, testProps, { success: false });

    expect(BuildHistory(props)).toBe(null);
  });

  it('should message if has no builds', function() {
    const props = Object.assign({}, testProps, { builds: [] });

    expect(shallow(BuildHistory(props)).html())
      .toContain('This snap has not been built yet.');
  });

  it('should message if has falsey builds', function() {
    const props = Object.assign({}, testProps, { builds: false });

    expect(shallow(BuildHistory(props)).html())
      .toContain('This snap has not been built yet.');
  });

  it('should sort builds by id', function() {
    const children = shallow(BuildHistory(testProps)).find('Body').children();

    const keys = children.map((child) => child.key());

    expect(keys).toEqual(['17', '10', '5', '0']);
  });

});
