export default async function env(env, args) {
    for(let key in env.ENV) {
        env.fd[1].emit('data', key.toString() + '=' + env.ENV[key].toString() + '\r\n')
    }

    return 0
}
