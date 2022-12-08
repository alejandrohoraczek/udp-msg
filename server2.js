const dgram = require('node:dgram')
const client = dgram.createSocket('udp4')

const string = 'DAME TODOS TUS DÓLARES'
const message = Buffer.from(string)

client.send(message, 7373, '190.188.222.12', (err) => {
  client.close()
})

client.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`)
  client.close()
})
