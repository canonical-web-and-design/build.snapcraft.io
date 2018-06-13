import openid from 'openid';
import { conf } from '../helpers/config';
import { Macaroon, Teams } from './extensions';
import logging from '../logging';

const logger = logging.getLogger('login');

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

    // make sure session is saved before proceeding
    session.save((err) => {
      if (session.user) {
        logger.info(`Saving association handle for user ${session.user.login}`);
      }

      callback(err);
    });
  };
};

const loadAssociation = (session) => {
  return (handle, callback) => {
    session.reload((err) => {
      if (session.association) {
        if (session.user) {
          logger.info(`Loading association handle for user ${session.user.login}`);
        }

        callback(err, session.association);
      } else {
        if (session.user) {
          logger.error(`No association handle found for user ${session.user.login}`);
        } else {
          logger.error('No association handle found, no user found in session');
        }

        callback(err, null);
      }
    });
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
      'email': 'required',
      'fullname': 'required',
      'nickname': 'required'
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
