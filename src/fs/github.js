/*
 * HTTP GitHub project access.
 */

import { Base, Stat, StatNotFoundError, File, FileNotFoundError, IsDirectoryError } from './base.js'
import * as util from '../util.js'
import * as cache from '../cache.js'

export default class Filesystem extends Base {
  constructor(path, options) {
    super('github', path, options)

    if(!options.repo && options.base)
      options.repo = options.base

    if(options.repo) {
      this.repo = options.repo
    } else {
      throw new Error("[github] repo option required")
    }

    if(options.token) {
      this.token = options.token
    }

    if(options.branch) {
      this.branch = options.branch
    }
  }

  async statinfo(json) {
    delete json['content']
    delete json['encoding']

    let type = 'file'

    if(json['type'] === 'dir')
      type = 'directory'

    return {
      type: type,
      name: json['name'],
      size: json['size']
    }
  }

  async stat(path, no_cache=false) {
    let githubHeaders = new Headers()
    if (this.token) {
      githubHeaders.append('Authorization', 'token ' + this.token)
    }

    let branchParam = ''
    if (this.branch) {
      branchParam = '?ref=' + this.branch
    }

    let request = new Request('https://api.github.com/repos/' + this.repo + '/contents/' + path + branchParam, {headers: githubHeaders})

    let response = undefined

    if (!no_cache) {
      response = await cache.match(request)
    } else {
      cache.purge(request);
    }

    if (response === undefined) {
      response = await self.fetch(request)
      cache.put(request, response)
    }

    util.responseOk(response, StatNotFoundError)

    let json  = await response.json()
    let dir = false
    let contents = do {
      if(Array.isArray(json)) {
        dir = true
        await Promise.all(Array.from(json, item => this.statinfo(item)))
      } else {
        await this.statinfo(json)
      }
    }

    return new Stat(dir, contents, ['GET', 'OPTIONS'])
  }

  async read(path, no_cache=false) {
    let githubHeaders = new Headers()
    if (this.token) {
      githubHeaders.append('Authorization', 'token ' + this.token)
    }

    let branchParam = ''
    if (this.branch) {
      branchParam = '?ref=' + this.branch
    }

    let request = new Request('https://api.github.com/repos/' + this.repo + '/contents/' + path + branchParam, {headers: githubHeaders})

    let response = undefined

    if (!no_cache) {
      response = await cache.match(request)
    } else {
      cache.purge(request);
    }

    if (response === undefined) {
      response = await self.fetch(request)
      cache.put(request, response)
    }

    util.responseOk(response, FileNotFoundError)

    let json = await response.json()

    if(Array.isArray(json)) {
      throw new IsDirectoryError()
    } else {
      return new File(atob(json['content']))
    }
  }

  async write(path, fileContent) {
    if(!this.token) {
      return new Response(null, {
        status: 401,
        statusMessage: 'TOKEN REQUIRED',
        headers: {'Allow': 'GET,OPTIONS'}
      })
    }
    let githubHeaders = new Headers()
    githubHeaders.append('Authorization', 'token ' + this.token)

    let getResponse = await self.fetch('https://api.github.com/repos/' + this.repo + '/contents' + path, {headers: githubHeaders})

    if (getResponse.status != 200) {
      throw new Error(getResponse.statusText)
    }

    let getJson = await getResponse.json()

    if (Array.isArray(getJson)) {
      throw new Error('What you are trying to overwrite is not a file. It\'s a directory.')
    }

    if (getJson['type'] != 'file') {
      throw new Error('What you are trying to overwrite is not a file. It\'s a ' + getJson['type'] + '.')
    }

    let request = {
      message: 'Update file ' + path + ' with webclient file backend',
      sha: getJson['sha'],
      content: btoa(await fileContent)
    }

    if (this.branch) {
      request['branch'] = this.branch
    }

    let response = await self.fetch('https://api.github.com/repos/' + this.repo + '/contents/' + path, {
      headers: githubHeaders,
      body: JSON.stringify(request),
      method: 'PUT'})

    if(response.status < 200 || response.status >= 300) {
      throw new Error(response.statusText)
    }

    return fileContent
  }
}

// class GHFile extends File
