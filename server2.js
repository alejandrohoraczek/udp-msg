const dgram = require('node:dgram')
const client = dgram.createSocket('udp4')

const string = '>RPF151222180559-3436968-058760820002342008048;ID=6838;#IP0:A17D;*6A<'
const message = Buffer.from(string)

client.send(message, 7373, '190.188.222.12', (err) => {
  client.close()
}) 

client.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`)
  client.close()
})
