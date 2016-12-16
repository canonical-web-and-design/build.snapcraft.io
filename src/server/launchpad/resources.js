/* Copyright 2009-2016 Canonical Ltd.  This software is licensed under the
 * GNU Affero General Public License version 3 (see the file LICENSE).
 *
 * The various resource types exposed on the Launchpad web service.
 */

import { normalizeURI } from './uri';

/** The base class for objects retrieved from Launchpad's web service. */
export class Resource {
  /** Initialize a resource with its representation and URI. */
  init(client, representation, uri) {
    this.lp_client = client;
    this.uri = uri;
    for (const key of Object.keys(representation)) {
      this[key] = representation[key];
    }
  }

  /** Get the result of a named GET operation on this resource. */
  named_get(operation_name, config) {
    return this.lp_client.named_get(this.uri, operation_name, config);
  }

  /** Trigger a named POST operation on this resource. */
  named_post(operation_name, config) {
    return this.lp_client.named_post(this.uri, operation_name, config);
  }
}

/** The root of the Launchpad web service. */
export class Root extends Resource {
  constructor(client, representation, uri) {
    super();
    this.init(client, representation, uri);
  }
}

/** A grouped collection of objects from the Launchpad web service. */
export class Collection extends Resource {
  constructor(client, representation, uri) {
    super();
    this.init(client, representation, uri);
    this.entries.forEach((entry, i) => {
      this.entries[i] = new Entry(client, entry, entry.self_link);
    });
  }

  /**
   * Retrieve a subset of the collection.
   * @param start - Where in the collection to start serving entries.
   * @param size - How many entries to serve.
   * @returns {Promise<Collection, ResourceError>}
   */
  lp_slice(start, size) {
    return this.lp_client.get(this.uri, { start: start, size: size });
  }

  async *[Symbol.asyncIterator]() {
    let collection = this;
    do {
      for (const entry of collection.entries) {
        yield entry;
      }
      if (collection.next_collection_link !== undefined) {
        collection = await this.lp_client.get(collection.next_collection_link);
      } else {
        collection = undefined;
      }
    } while (collection !== undefined);
  }
}

/** A single object from the Launchpad web service. */
export class Entry extends Resource {
  constructor(client, representation, uri) {
    super();
    this.lp_client = client;
    this.uri = uri;
    this.lp_attributes = {};
    this.dirty_attributes = [];

    // Copy the representation keys into our own set of attributes, and add
    // an attribute-change event listener for caching purposes.
    for (const key of Object.keys(representation)) {
      this.lp_attributes[key] = representation[key];
      Object.defineProperty(this, key, {
        configurable: false,
        enumerable: true,
        get: () => { return this.lp_attributes[key]; },
        set: value => {
          if (value !== this.lp_attributes[key]) {
            this.dirty_attributes.push(key);
          }
          this.lp_attributes[key] = value;
        }
      });
    }
  }

  /** Write modifications to this entry back to the web service. */
  lp_save(config) {
    const representation = {};
    for (const attribute of this.dirty_attributes) {
      representation[attribute] = this[attribute];
    }
    const headers = {};
    if (this['http_etag'] !== undefined) {
      headers['If-Match'] = this['http_etag'];
    }
    const uri = normalizeURI(this.lp_client.base_uri, this['self_link']);
    return this.lp_client.patch(uri, representation, config, headers)
      .then(() => { this.dirty_attributes = []; });
  }
}
