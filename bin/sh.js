import * as path from '../src/external/path.js'
import * as kernel from 'kernel'

String.prototype.hexEncode = function(){
  var hex, i;

  var result = "";
  for (i=0; i<this.length; i++) {
    hex = this.charCodeAt(i).toString(16);
    result += ("000"+hex).slice(-4);
  }

  return result
}

class Stream {
  constructor(fd) {
    this.fd = fd
  }

  write(data) {
    this.fd.emit('data', data)
  }

  read() {
    return new Promise((resolve, reject) => {
      this.fd.once('data', resolve)
    })
  }

  readLine(cb) {
    return new Promise((resolve, reject) => {
      let buffer = ''
      let fn = (data) => {
        if(data[0] === '\x1b') {
          // Control sequence
          // Ignore for now
          return
        }

        if(data == "\x0a" || data == "\x0d") {
          this.fd.off('data', fn)
          resolve(buffer)
          return
        }

        if(data == "\b" || data == "\x7f") {
          buffer = buffer.slice(0, buffer.length - 1)
        } else {
          buffer += data
        }

        if(cb)
          cb(buffer)
      }

      this.fd.on('data', fn)
    })
  }
}

class Shell {
  constructor(env, argv) {
    this.env = env
    this.argv = argv

    this.env.ENV = Object.assign(this.env.ENV || {}, {
      PATH: '/bin:/usr/bin',
      PATH_SEPARATOR: ':'
    })

    this.hash   = {}
    this.pwd    = this.env.pwd || '/'
    this.stdin  = new Stream(this.env.fd[0])
    this.stdout = new Stream(this.env.fd[1])
    this.buildins = {
      'cd': this._cd,
      'rehash': this._rehash,
      'env': this._env
    }
  }

  async run() {
    while(true) {
      this.stdout.write('\r\n')
      this.stdout.write(this.pwd + ' $ ')
      this.stdout.write('\x1b[?25h') // Show cursor

      let input = await this.stdin.readLine((buf) => {
        this.stdout.write('\x1b[2K\r' + this.pwd + ' $ ' + buf)
      })

      this.stdout.write('\x1b[?25l') // Hide cursor
      this.stdout.write('\r\n')

      let argv = input.match(/('(\\'|[^'])*'|"(\\"|[^"])*"|(\\ |[^ ])+|[\w-]+)/g)

      if(argv == null)
        continue;

      argv = argv.map((str) => {
        let match = str.match(/(^"(.*)"$)|(^'(.*)'$)/)

        if(match) {
          return match[4] || match[2]
        }

        return str
      })

      let buildin = this.buildins[argv[0]]

      if(buildin === 'exit') {
        return 0
      }

      if(buildin) {
        await buildin.call(this, argv)
        continue
      }

      await this._runcmd(argv)
    }
  }

  async _cd(argv) {
    try {
      let pathname = path.join(this.pwd, argv[1])

      let response = await fetch(kernel.resolve(pathname), {method: 'OPTIONS'})

      if(response.status < 200 || response.status > 399)
        throw new Error('Request failed: ' + response.statusText)

      let fstat = await response.json()

      if(fstat['type'] !== 'directory')
        throw new Error('Not a directory')

      this.pwd = pathname
    } catch(err) {
      this.stdout.write('Error: ' + err + '\r\n')
      console.log(err)
    }
  }

  async _rehash() {
    this.hash = {}
  }

  async _runcmd(argv) {
    try {
      let app = await this._lookupPath(argv[0])
      let env = {
        fd: this.env.fd,
        ENV: Object.assign({}, this.env.ENV, {
          PWD: this.pwd
        })
      }

      return await app.default(env, argv)
    } catch(err) {
      this.stdout.write('Error: ' + err + '\r\n')
      console.error(err)
    }
  }

  async _lookupPath(binary) {
    if(binary.indexOf('/') >= 0) {
      return await System.import(kernel.realpath(path.normalize('/' + binary)))
    } else {
      if(this.hash && this.hash[binary]) {
        return this.hash[binary];
      }

      let imports = this.env.ENV.PATH
        .split(this.env.ENV.PATH_SEPARATOR)
        .filter((str) => str.length > 0)
        .map((str) => kernel.realpath(path.normalize('/' + path.join(str, binary + '.js'))))
        .map((str) => System.import(str).catch((err) => undefined))

      let matches = await Promise.all(imports)

      for(let match of matches) {
        if(match && match.default) {
          this.hash[binary] = match
          return match
        }
      }
    }

    throw new Error('Executable not found: ' + binary)
  }
}

export default function sh(env, argv) {
  return new Shell(env, argv).run()
}
