// Middleware to restrict a route to trusted networks.

import ipaddr from 'ipaddr.js';

import { conf } from '../helpers/config';

const rawNetworks = conf.get('TRUSTED_NETWORKS', '').split(',')
  .filter((ip) => ip);
const networks = rawNetworks.map((cidr) => ipaddr.parseCIDR(cidr));

export default (req, res, next) => {
  const addr = ipaddr.parse(req.ip);
  if (addr.range() === 'loopback' ||
      ipaddr.subnetMatch(addr, { trusted: networks }) === 'trusted') {
    next();
  } else {
    res.status(403).send(`IP address ${req.ip} not in trusted network.`);
  }
};
