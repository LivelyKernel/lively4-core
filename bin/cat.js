import * as path from '/src/swx/path.jsx'

export default async function cat(env, args) {
    let file = path.join(env.pwd, args[1])

    let response = await fetch('https://lively4/' + file)

    if(response.status < 200 || response.status > 399) {
        env.fd[2].emit('data', 'Error: ' + response.statusText)
        return -1
    }

    let content  = await response.text()
    content = content.split(/\r?\n/).join("\r\n")
    env.fd[1].emit('data', content)

    return 0
}
