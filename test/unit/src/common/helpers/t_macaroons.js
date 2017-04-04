import expect from 'expect';
import { MacaroonsBuilder } from 'macaroons.js';

import { getCaveats } from '../../../../../src/common/helpers/macaroons';

describe('macaroons helpers', () => {
  context('getCaveats', () => {
    it('generates a sequence of caveats', () => {
      const macaroon = new MacaroonsBuilder('location', 'key', 'id')
        .add_first_party_caveat('caveat 1')
        .add_third_party_caveat('external', 'external key', 'caveat 2')
        .add_first_party_caveat('caveat 3')
        .getMacaroon();
      const caveats = [];
      for (const caveat of getCaveats(macaroon)) {
        caveats.push(caveat);
      }
      expect(caveats).toMatch([
        {
          caveatId: 'caveat 1',
          verificationKeyId: '',
          location: ''
        },
        {
          caveatId: 'caveat 2',
          verificationKeyId: /./,
          location: 'external'
        },
        {
          caveatId: 'caveat 3',
          verificationKeyId: '',
          location: ''
        }
      ]);
    });
  });
});
