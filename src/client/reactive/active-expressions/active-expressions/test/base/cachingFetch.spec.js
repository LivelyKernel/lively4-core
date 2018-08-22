'use strict';

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import CachingFetch from './../../src/base/caching-fetch.js';

describe('CachingFetch', () => {
  describe('requestToString', () => {
    it('works with basic attributes', () => {
      let cachingFetch = new CachingFetch();
      
      expect(
        cachingFetch.requestToString("http://example.invalid", {
          method: 'GET'
        })
      ).to.eq(`request:http://example.invalid
method:GET`)
    });

    it('works with headers', () => {
      let cachingFetch = new CachingFetch();
      let formData = new FormData();
      formData.append("name", "value");

      expect(
        cachingFetch.requestToString("http://example.invalid", {
          body: formData
        })
      ).to.eq(`request:http://example.invalid
body:{"name":"value"}`)
    });

    it('works with FormData', () => {
      let cachingFetch = new CachingFetch();

      expect(
        cachingFetch.requestToString("http://example.invalid", {
          headers: {'X-Some-Header': 'value'}
        })
      ).to.eq(`request:http://example.invalid
headers:{"X-Some-Header":"value"}`)
    });
  });
});
