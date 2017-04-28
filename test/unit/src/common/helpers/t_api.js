import expect from 'expect';

import { getMacaroonAuthHeader } from '../../../../../src/common/helpers/api';

describe('api helpers', () => {
  context('getMacaroonAuthHeader', () => {
    it('is a Macaroon with root and discharge', () => {
      const header = getMacaroonAuthHeader('root', 'discharge');
      expect(header).toEqual('Macaroon root="root", discharge="discharge"');
    });
  });
});
