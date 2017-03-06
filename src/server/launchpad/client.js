/* Copyright 2009-2016 Canonical Ltd.  This software is licensed under the
 * GNU Affero General Public License version 3 (see the file LICENSE).
 *
 * Utility methods and classes to deal with the Launchpad API using
 * Javascript.
 */

import 'es6-promise/auto';
import 'isomorphic-fetch';
import { OAuth } from 'oauth';
import qs from 'qs';

import { Collection, Entry, Root } from './resources';
import { normalizeURI } from './uri';

const HTTP_CREATED = 201;

export class ResourceError extends Error {
  constructor(response, client, uri, method) {
    super(`${uri} returned HTTP status ${response.status}`);
    this.response = response;
    this.client = client;
    this.uri = uri;
    this.method = method;
  }
}

/** A client that makes HTTP requests to Launchpad's web service. */
export class Launchpad {
  constructor(base_uri, consumer_key, token_key, token_secret) {
    this.base_uri = base_uri;
    this.consumer_key = consumer_key;
    this.token_key = token_key;
    this.token_secret = token_secret;
  }

  makeHeaders() {
    const headers = {};
    if (this.consumer_key !== undefined &&
        this.token_key !== undefined && this.token_secret !== undefined) {
      // We leave a lot of the parameters null or empty here because
      // Launchpad uses the PLAINTEXT method which really doesn't care.
      const oauth = new OAuth(
        null, null, this.consumer_key, '', '1.0', null, 'PLAINTEXT');
      headers['Authorization'] = oauth.authHeader(
        '', this.token_key, this.token_secret);
    }
    return headers;
  }

  /**
   * Get the current state of a resource.
   * @returns {Promise<Resource|Object, ResourceError>}
   */
  async get(uri, config) {
    if (config === undefined) {
      config = {};
    }
    const start = config.start;
    const size = config.size;
    const headers = {
      ...this.makeHeaders(),
      'Accept': config.accept || 'application/json'
    };
    const parameters = { ...config.parameters };
    if (start !== undefined) {
      parameters['ws.start'] = start;
    }
    if (size !== undefined) {
      parameters['ws.size'] = size;
    }
    uri = normalizeURI(this.base_uri, uri);
    if (Object.keys(parameters).length !== 0) {
      uri += '?' + qs.stringify(parameters, { indices: false });
    }

    const response = await fetch(uri, { headers: headers });
    if (Math.floor(response.status / 100) == 2) {
      return this.wrap_resource_on_success(response, uri, 'GET');
    } else {
      throw new ResourceError(response, this, uri, 'GET');
    }
  }

  /**
   * Retrieve the value of a named GET operation on the given URI.
   * @returns {Promise<Resource|Object, ResourceError>}
   */
  named_get(uri, operation_name, config) {
    if (config === undefined) {
      config = {};
    }
    config.parameters = { 'ws.op': operation_name, ...config.parameters };
    return this.get(uri, config);
  }

  /**
   * Perform a named POST operation on the given URI.
   * @returns {Promise<Resource|Object, ResourceError>}
   */
  async named_post(uri, operation_name, config) {
    if (config === undefined) {
      config = {};
    }
    uri = normalizeURI(this.base_uri, uri);
    const headers = {
      ...this.makeHeaders(),
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    };
    const parameters = { 'ws.op': operation_name, ...config.parameters };

    const response = await fetch(uri, {
      method: 'POST',
      headers: headers,
      body: qs.stringify(parameters, { indices: false })
    });
    if (response.status === HTTP_CREATED) {
      // A new object was created as a result of the operation.  Get that
      // object instead.
      var new_location = response.headers.get('Location');
      return this.get(new_location, {});
    } else if (Math.floor(response.status / 100) == 2) {
      return this.wrap_resource_on_success(response, uri, 'POST');
    } else {
      throw new ResourceError(response, this, uri, 'POST');
    }
  }

  /**
   * Patch the resource at the given URI with an updated representation.
   * @returns {Promise<Resource|Object, ResourceError>}
   */
  async patch(uri, representation, config) {
    if (config === undefined) {
      config = {};
    }
    uri = normalizeURI(this.base_uri, uri);

    const headers = {
      ...this.makeHeaders(),
      'Accept': config.accept || 'application/json',
      'X-HTTP-Method-Override': 'PATCH',
      'Content-Type': 'application/json',
      'X-Content-Type-Override': 'application/json'
    };

    const response = await fetch(uri, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(representation)
    });
    if (Math.floor(response.status / 100) == 2) {
      return this.wrap_resource_on_success(response, uri, 'PATCH');
    } else {
      throw new ResourceError(response, this, uri, 'PATCH');
    }
  }

  /**
   * Delete the resource at the given URI.
   * @returns {Promise<Resource|Object, ResourceError>}
   */
  async delete(uri) {
    uri = normalizeURI(this.base_uri, uri);

    const headers = this.makeHeaders();

    const response = await fetch(uri, {
      method: 'DELETE',
      headers: headers
    });
    if (Math.floor(response.status / 100) == 2) {
      return this.wrap_resource_on_success(response, uri, 'DELETE');
    } else {
      throw new ResourceError(response, this, uri, 'DELETE');
    }
  }

  /** Given a representation, turn it into a subclass of Resource. */
  wrap_resource(uri, representation) {
    if (representation === null || representation === undefined) {
      return representation;
    }
    if (representation.resource_type_link === undefined) {
      // This is a non-entry object returned by a named operation.  It's
      // either a list or a random JSON object.
      if (representation.total_size !== undefined
        || representation.total_size_link !== undefined) {
        // It's a list.  Treat it as a collection; it should be sliceable.
        return new Collection(this, uri, representation);
      } else if (typeof representation === 'object') {
        // It's an Array or mapping.  Recurse into it.
        let new_representation;
        if (Array.isArray(representation)) {
          new_representation = [];
        } else {
          new_representation = {};
        }
        for (const key of Object.keys(representation)) {
          let value = representation[key];
          if (value !== null && value !== undefined) {
            value = this.wrap_resource(value.self_link, value);
          }
          new_representation[key] = value;
        }
        return new_representation;
      } else {
        // It's a random JSON object. Leave it alone.
        return representation;
      }
    } else if (representation.resource_type_link.search(
        /\/#service-root$/) !== -1) {
      return new Root(this, uri, representation);
    } else if (representation.total_size === undefined) {
      return new Entry(this, uri, representation);
    } else {
      return new Collection(this, uri, representation);
    }
  }

  /** Common handler for successful responses, wrapping as appropriate. */
  async wrap_resource_on_success(response, uri, method) {
    const media_type = response.headers.get('Content-Type');
    if (media_type.startsWith('application/json')) {
      const representation = await response.json();
      // If the object fetched has a self_link, make that the object's uri
      // for use in other api methods off of that object.  During a PATCH
      // request the caller is the object.  Leave the original_uri alone.
      // Otherwise make the uri the object coming back.
      if (representation && representation.self_link && method !== 'PATCH') {
        uri = representation.self_link;
      }
      return this.wrap_resource(uri, representation);
    } else {
      return response.text();
    }
  }
}
