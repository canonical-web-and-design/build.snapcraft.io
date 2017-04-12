import 'isomorphic-fetch';
import url from 'url';
import sanitizeHtml from 'sanitize-html';

import { conf } from '../helpers/config';

export const MAILCHIMP_FORM_URL = 'https://canonical.us3.list-manage.com/subscribe/post-json';
export const MAILCHIMP_FORM_U = '56dac47c206ba0f58ec25f314';
export const MAILCHIMP_FORM_ID = '381f5c55f1';
const HTTP_PROXY = conf.get('HTTP_PROXY');

export const privateRepos = async (req, res) => {
  const formUrl = url.parse(MAILCHIMP_FORM_URL);
  const submitUrl = url.format({
    ...formUrl,
    query: {
      u: MAILCHIMP_FORM_U,
      id: MAILCHIMP_FORM_ID,
      EMAIL: req.query.email
    }
  });

  const response = await fetch(submitUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    proxy: HTTP_PROXY
  });
  const json = await response.json();

  json.msg = sanitizeHtml(json.msg, {
    transformTags: {
      'a': (tagName, attribs) => {
        return {
          tagName: 'a',
          attribs: {
            href: attribs.href,
            target: '_blank',
            rel: 'noreferrer noopener'
          }
        };
      }
    },
    allowedTags: [ 'b', 'i', 'em', 'strong', 'a' ],
    allowedAttributes: {
      'a': [ 'href', 'target', 'rel' ]
    }
  });


  return res.status(response.status).send(json);
};
