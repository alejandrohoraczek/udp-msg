const dgram = require('node:dgram')
const server = dgram.createSocket('udp4')

server.on('listening', () => {
  const address = server.address()
  console.log(`server listening ${address.address}:${address.port}`)
})

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`)
  server.close()
})

server.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`)
  server.send('llego', 7373, `${rinfo.address}`, (err) => {})
})

server.bind(7373, '192.168.0.104')
// Prints: server listening 0.0.0.0:41234
