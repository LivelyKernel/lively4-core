import * as path from '../src/external/path.js'
import * as kernel from 'kernel'

async function cat(env, args) {
    let file = path.join(env.ENV.PWD, args[1])

    let response = await fetch(kernel.resolve(file))

    if(response.status < 200 || response.status > 399) {
        env.fd[2].emit('data', 'Error: ' + response.statusText)
        return -1
    }

    let content  = await response.text()
    content = content.split(/\r?\n/).join("\r\n")
    env.fd[1].emit('data', content)

    return 0
}



export default cat;
