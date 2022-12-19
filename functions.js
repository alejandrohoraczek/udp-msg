const config = require('./config') //! IMPORTING MESSAGES CONFIG
const { Buffer } = require('node:buffer') //! para calcular el tamaño en bytes del mensaje a recibir

const receivedMsg =
  '>RPF151222180559-3436968-058760820002342008048;ID=6838;#IP0:A17D;*6A<' //* recibimos el mensaje del dispositivo

// función que extrae el mensaje UDP y devuelve un objeto con toda la información detallada
function deconstructMessage(buffer) {
  let msg = buffer.toString().trim()
  let data = {}
  const eventType = msg.slice(1, 4) // extraemos el tipo de mensaje
  const eventMessage = msg.slice(4) // extraemos el mensaje completo
  const eventChecksum = msg.slice(-3, -1) // extramos el checksum del mensaje
  const calculatedCheckSum = GetCheckSum(msg) // nuestro cálculo del checksum
  const id = msg.split(';')[1].slice(3) // extramos el ID del equipo
  const destination = { // extramos el destino y la secuencia del mensaje
    identifier: msg.split(';')[2].slice(0, 4),
    sequence: parseInt(msg.split(';')[2].slice(5, 9), 16),
    // sequence: msg.split(';')[2].slice(5, 9),
  }
  const descriptor = Object.getOwnPropertyDescriptor(config, eventType) //descriptor nos permite obtener propiedades del mensaje que llega (RPF, RPG, etc...)
  const msgSize = Buffer.byteLength(msg, 'utf-8') // obtenemos el tamaño del mensaje para compararlo con el tamaño por defecto según el tipo de mensaje
  
  // manejo de errores
  try {
    if (!descriptor) // ¿está el tipo de mensaje en la variable config?
      throw new Error('¡No existe ese tipo de mensaje!')
    //? le pregunto al equipo "che, ¿me pasaste mal el mensaje?" con una query?

    if (
      msgSize !== descriptor.value['msgChars'] &&
      eventChecksum !== calculatedCheckSum
    )
      // ¿se respetan la cantidad de caracteres que debe tener el mensaje?
      throw new Error('El mensaje está corrupto.') // si no, dar error
    //? enviar query al equipo solicitandole de nuevo la info?? se puede??
  } catch (e) {
    //? informo error o descarto todo procedimiento y espero al siguiente mensaje?
    console.error(e)
    return null //devuelvo null si hay error. después compruebo si esta función dió null, entonces es que hubo error y no debería enviar el body a la API
  }

  const eventProperties = Object.keys(descriptor.value) // extraigo las propiedades que me comunica el evento

  eventProperties.forEach((key) => { // por aca propiedad voy a:

    const getValues = eventMessage.slice( // 1) determinar el valor de esa propiedad
      descriptor.value[key].start,
      descriptor.value[key].end
    )
    Object.defineProperty(data, key, { // 2) definir esas propiedades en el objeto `data`
      value: getValues,
      writable: true, //necesario para poder escribir sobre la propiedad
      enumerable: true, //necesario para que funcione dentro del bucle
      configurable: true, //necesario para luego poder modificarla o eliminarla
    })
  })

  const timestamp = new Date( // ahora creamos el timestamp en formato "yyyy-mm-ddThh:mm:ss.mmm UTC"
    `20${data.positionDate[4] + data.positionDate[5]}-${
      data.positionDate[2] + data.positionDate[3]
    }-${data.positionDate[0] + data.positionDate[1]}T${
      data.positionTime[0] + data.positionTime[1]
    }:${data.positionTime[2] + data.positionTime[3]}:${
      data.positionTime[4] + data.positionTime[5]
    }.000Z`
  )

  Object.defineProperties(data, {
    timestamp: {
      value: timestamp,
      writable: true,
      enumerable: true,
      configurable: true,
    },
    deviceID: {
      value: id,
      writable: true,
      enumerable: true,
      configurable: true,
    },
    destination: {
      value: destination,
      writable: true,
      enumerable: true,
      configurable: true,
    },
    checksum: {
      value: calculatedCheckSum,
      writable: true,
      enumerable: true,
      configurable: true,
    }
  })

  delete data.positionDate //borramos todo lo que no necesitamos
  delete data.positionTime
  delete data.msgChars

  // freezado para mejorar el rendimiento
  Object.freeze(data)
  console.table(data)
  return data
}

function GetCheckSum(msg) {
  let len = msg.length
  let checksum = 0

  for (let i = 0; i < len; i++) {
    checksum ^= msg.charCodeAt(i)
    if (msg[i - 1] == ';' && msg[i] == '*') break
  }

  return checksum.toString(16).toUpperCase()
}

function parseCoordinates(coor){
  const coordinates = {
    int: coor.slice(0, -5), //extraemos la parte entera
    decimals: coor.slice(-5) //y la decimal 
  }
  return +`${coordinates.int}.${coordinates.decimals}` //lo devolvemos como número
}

function parseBodyObject(obj){ //función que devuelve el objecto parseado para enviar a la API
  return {
    id: obj.deviceID,
    lat: parseCoordinates(obj.positionLat),
    lng: parseCoordinates(obj.positionLon),
    speed: parseInt(obj.speed),
    event: parseInt(obj.reportEvent),
    direction: parseInt(obj.direction),
    battery: parseInt(obj.battery) || null,
    hdop: parseInt(obj.hdop) || null,
    nro: obj.destination.sequence || null,
    timestamp: Date.parse(obj.timestamp),
    satelites: parseInt(obj.satelitesQuantity) || null,
    temp: parseInt(obj.temperature) || null,
  }
}

parseCoordinates('-13076082')
parseCoordinates('-3436968')

module.exports = { deconstructMessage, GetCheckSum, parseCoordinates, parseBodyObject }

