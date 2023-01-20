const dgram = require('node:dgram')
const client = dgram.createSocket('udp4')

const string =
  '+RESP:GTSTT,500203,135790246811220,,16,0,4.3,92,70.0,121.354335,31.222073,20090214013254,0460,0000,18d8,6141,00,20090214093254,11F0$'
const message = Buffer.from(string)

client.send(message, 7373, '190.188.222.12', (err) => {
  client.close()
})

client.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`)
  client.close()
})
