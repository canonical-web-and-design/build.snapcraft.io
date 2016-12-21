import openid from 'openid';
import { conf } from '../helpers/config';
import { Macaroon, Teams } from './extensions';

openid['Macaroon'] = Macaroon;
openid['Teams'] = Teams;

const BASE_URL = conf.get('BASE_URL');

const saveAssociation = (session) => {
  return (provider, type, handle, secret, expiry_time_in_seconds, callback) => {
    setTimeout(() => {
      openid.removeAssociation(handle);
    }, expiry_time_in_seconds * 1000);

    session.association = {
      provider,
      type,
      secret
    };
    callback(null); // Custom implementations may report error as first argument
  };
};

const loadAssociation = (session) => {
  return (handle, callback) => {
    if (session.association) {
      callback(null, session.association);
    } else {
      callback(null, null);
    }
  };
};

const removeAssociation = (session) => {
  return () => {
    delete session.association;
    return true;
  };
};


const RelyingPartyFactory = (session, returnUrl, caveatId) => {

  openid.saveAssociation = saveAssociation(session);
  openid.loadAssociation = loadAssociation(session);
  openid.removeAssociation = removeAssociation(session);

  const extensions = [
    new openid.SimpleRegistration({
      'email' : 'required',
      'fullname' : 'required'
    })
  ];

  if (caveatId) {
    extensions.push(new openid.Macaroon(caveatId));
  }

  const teams = JSON.parse(conf.get('OPENID_TEAMS') || 'null');
  if (teams && teams.length) {
    extensions.push(new openid.Teams(teams));
  }

  return new openid.RelyingParty(
    returnUrl,
    BASE_URL,
    false, // Use stateless verification
    false, // Strict mode
    extensions
  );
};

export { RelyingPartyFactory as default,
  loadAssociation,
  saveAssociation,
  removeAssociation
};
