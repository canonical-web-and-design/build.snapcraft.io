import React, { PropTypes } from 'react';

import { conf } from '../../helpers/config';
const BASE_URL = conf.get('BASE_URL');

import { CopyToClipboard } from '../share';

import style from './badge.css';

const getBadgeUrl = (fullName) => `${BASE_URL}/badge/${fullName}.svg`;
const getRepoPageUrl = (fullName) => `${BASE_URL}/user/${fullName}`;
const getBadgeMarkdown = (fullName) => `[![Snap Status](${getBadgeUrl(fullName)})](${getRepoPageUrl(fullName)})`;

export default function Badge({ fullName }) {
  return (
    <div>
      <img src={getBadgeUrl(fullName)} alt={`Snap build status for ${fullName}`} />

      <span className={style.copyIcon}>
        <CopyToClipboard
          tooltip="Copy Markdown code to clipboard"
          copyme={getBadgeMarkdown(fullName)}
        />
      </span>
    </div>
  );
}

Badge.propTypes = {
  fullName: PropTypes.string.isRequired
};
