/* Copyright 2016 Canonical Ltd.  This software is licensed under the
 * GNU Affero General Public License version 3 (see the file LICENSE).
 */

import { conf } from '../helpers/config';
import { Launchpad } from './client';

export function getLaunchpad() {
  return new Launchpad(
    conf.get('LP_API_URL'), conf.get('LP_API_CONSUMER_KEY'),
    conf.get('LP_API_TOKEN'), conf.get('LP_API_TOKEN_SECRET'));
}

export default getLaunchpad;
