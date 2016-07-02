import * as path from '../src/external/path.js'
import * as kernel from 'kernel'

function fprint(fd, str) {
    fd.emit('data', str)
}

async function mount(env, args) {
    if(args.length < 3) {
        fprint(env.fd[2], 'Error: Arguments missing.\r\n')
        fprint(env.fd[2], 'Usage: ' + argv[0] + ' <uri> <target>\r\n')
        return 1
    }

    let url  = new URL(args[1])
    let type = url.protocol.slice(0, url.protocol.length - 1)
    let base = url.pathname.match(/^\/*(.*)$/)[1]
    let mp   = path.join(env.ENV.PWD, args[2])
    let options = {}

    url.search.slice(1).split('&').forEach((each) => {
        let arg = each.split('=').map((str) => decodeURIComponent(str))
        options[arg[0]] = arg[1]
    })

    fprint(env.fd[1], 'Type: ' + type + '\r\n')
    fprint(env.fd[1], 'Base: ' + base + '\r\n')
    fprint(env.fd[1], 'Target: ' + mp + '\r\n')

    let response = await fetch(kernel.resolve('/sys/fs/mount'), {
        method: 'PUT',
        body: JSON.stringify({
            path: mp,
            name: type,
            options: Object.assign({}, options, {
                base: base
            })
        })
    })

    if(response.status < 200 || response.stats > 399) {
        try {
            let json = await response.json()

            fprint(env.fd[2], json['message'] || response.statusText)
        } catch(err) {
            fprint(env.fd[2], err)
            fprint(env.fd[2], response.statusText)
        }

        return 1
    }

    return 0
}
export default mount
