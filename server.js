// Importando el módulo y creando el socket para recibir mensajes UDP
const dgram = require('node:dgram')
const server = dgram.createSocket('udp4')
// Importando `enviroment variables`
require('dotenv').config()
// Importando el módulo para hacer fetch()
const fetch = require('node-fetch')
// Importando el archivo con la configuración de cada mensaje
const config = require('./config')
// Importando el módulo para calcular el tamaño del buffer del mensaje
const { Buffer } = require('node:buffer') //! para calcular el tamaño en bytes del mensaje a recibir
// Importando las functiones utilitarias
const { deconstructMessage, parseCoordinates, parseBodyObject } = require('./functions')
const { table } = require('node:console')

server.on('listening', () => {
  const address = server.address()
  console.log(`server listening ${address.address}:${address.port}`)
})

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`)
  server.close()
})

server.on('message', async (msg, rinfo) => {
  const message = deconstructMessage(msg) // deconstruímos el mensaje y retornamos un objeto
  const body = parseBodyObject(message) // armamos el body JSON que pide la API

  try { // enviamos los datos del body a la API
    const sendingBodyToAPI = await fetch(process.env.API_URI, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {'Content-Type': 'application/json'}
    })
      if(sendingBodyToAPI.ok) { // si devuelve cualquier código 2** entonces enviaremos la respuesta AK
        const response = `>SAK;ID=${body.id};${message.destination.identifier}:${body.nro};*${message.checksum}<`
        server.send(response, rinfo.port, rinfo.address, (err) => {
          if (err)
          console.log(err)

          console.log(rinfo.port, rinfo.address);
        }) 
      }
  } catch (error) {
    console.error(error)
    }
})

server.bind(7373, '192.168.0.104')
// Prints: server listening 0.0.0.0:41234
