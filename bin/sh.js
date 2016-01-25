import * as path from '/src/swx/path.jsx'

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
                if(cb)
                    cb(data)

                if(data == "\x0a" || data == "\x0d") {
                    this.fd.off('data', fn)
                    resolve(buffer)
                    return
                }

                if(data == "\b" || data == "\x7f") {
                    buffer = buffer.slice(0, buffer.length - 2)
                } else {
                    buffer += data
                }
            }

            this.fd.on('data', fn)
        })
    }
}

class Shell {
    constructor(args, env) {
        this.env = env
        this.args = args

        this.pwd    = this.env.pwd || '/'
        this.stdin  = new Stream(this.env.fd[0])
        this.stdout = new Stream(this.env.fd[1])
    }

    async run() {
        while(true) {
            this.stdout.write(this.pwd + ' $ ')

            let input = await this.stdin.readLine((data) => this.stdout.write(data))
            this.stdout.write('\r\n')

            let command = input.split(/\s+/)

            switch(command[0]) {
                case '':
                    break;
                case 'cd':
                    await this._cd(command.slice(1))
                    break;
                case 'exit':
                    return 0;
                default:
                    await this._runcmd(command)
            }
        }
    }

    async _cd(command) {
        try {
            let pathname = path.join(this.pwd, command[0])

            let response = await fetch('https://lively4/' + pathname, {method: 'OPTIONS'})

            if(response.status < 200 || response.status > 399)
                throw new Error('Request failed: ' + response.statusText)

            let fstat = await response.json()

            if(fstat['type'] !== 'directory')
                throw new Error('Not a directory')

            this.pwd = pathname
        } catch(err) {
            this.stdout.write('Error: ' + err + '\r\n')
        }
    }

    async _runcmd(command) {
        try {
            let app = await System.import('https://lively4/bin/' + command[0] + '.js')

            try {
                return await app.default(Object.assign({}, this.env, { pwd: this.pwd }), command)
            } catch(err) {
                this.stdout.write('Error: ' + err + '\r\n')
            }

        } catch(err) {
            this.stdout.write('Command not found: ' + command[0] + '\r\n')
        }
    }
}

export default function sh(args, env) {
    return new Shell(args, env).run()
}
