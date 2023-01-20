const config = require('./config') //! IMPORTING MESSAGES CONFIG
const { Buffer } = require('node:buffer') //! para calcular el tamaño en bytes del mensaje a recibir

const receivedMsg =
  '>RPF151222180559-3436968-058760820002342008048;ID=6838;#IP0:A17D;*6A<' //* recibimos el mensaje del dispositivo
const theOtherMsg = `+RESP:GTSTT,500203,135790246811220,,16,0,4.3,92,70.0,121.354335,31.222073,20090214013254,0460,0000,18d8,6141,00,20090214093254,11F0$`

// función que extrae el mensaje UDP y devuelve un objeto con toda la información detallada
function deconstructMessage(buffer) {
  let msg = buffer.toString().trim()
  const device = msg.charAt(0) //diferenciamos el equipo (TRAX o QUECLINK)
  let brand //aca guardamos la marca del equipo

  //obtenemos la marca del equipo, esto sirve para procedimientos posteriores con la data
  if (device === '>') brand = 'TRAX'
  else if (device === '+') brand = 'QUECLINK'

  let eventType //tipo de mensaje
  let descriptor
  let data = {} // donde vamos a guardar lo que vamos a devolver
  //asignamos la marca para luego utilizarla en el parseo del body
  data.deviceBrand = brand

  switch (brand) {
    case 'TRAX':
      eventType = msg.slice(1, 4) // extraemos el tipo de mensaje
      const eventMessage = msg.slice(4) // extraemos el mensaje completo
      const eventChecksum = msg.slice(-3, -1) // extramos el checksum del mensaje
      const calculatedCheckSum = GetCheckSum(msg) // nuestro cálculo del checksum
      const id = msg.split(';')[1].slice(3) // extramos el ID del equipo
      const destination = {
        // extramos el destino y la secuencia del mensaje
        identifier: msg.split(';')[2].slice(0, 4),
        sequence: parseInt(msg.split(';')[2].slice(5, 9), 16),
        // sequence: msg.split(';')[2].slice(5, 9),
      }
      descriptor = Object.getOwnPropertyDescriptor(config.TRAX, eventType) //descriptor nos permite obtener propiedades del mensaje que llega (RPF, RPG, etc...)
      const msgSize = Buffer.byteLength(msg, 'utf-8') // obtenemos el tamaño del mensaje para compararlo con el tamaño por defecto según el tipo de mensaje

      // manejo de errores
      try {
        if (!descriptor) {
          // ¿está el tipo de mensaje en la variable config?
          throw new Error('¡No existe ese tipo de mensaje!')
        }
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

      eventProperties.forEach((key) => {
        // por aca propiedad voy a:

        const getValues = eventMessage.slice(
          // 1) determinar el valor de esa propiedad
          descriptor.value[key].start,
          descriptor.value[key].end
        )
        Object.defineProperty(data, key, {
          // 2) definir esas propiedades en el objeto `data`
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
        },
      })

      delete data.positionDate //borramos todo lo que no necesitamos
      delete data.positionTime
      delete data.msgChars

      // freezado para mejorar el rendimiento
      Object.freeze(data)
      console.table(data)
      return data

    case 'QUECLINK':
      const msgFields = msg.replace('$', '').split(',') //quitamos el caracter $ del final del string y dividimos cada campo
      eventType = msgFields[0].split(':')[1]

      //filtrado si el mensaje es del tipo GTFRI
      if (eventType === 'GTFRI') {
        //como lo es, buscamos los fields correspondientes al largo del mensaje (22 o 30 fields)
        descriptor = Object.getOwnPropertyDescriptor(config.QUECLINK, eventType)
          .value[msgFields.length]
      } else {
        // en caso de que sea cualquier otro diferente a GTFRI
        descriptor = Object.getOwnPropertyDescriptor(
          config.QUECLINK,
          eventType
        ).value
      }

      try {
        if (!descriptor) {
          // ¿está el tipo de mensaje en la variable config?
          throw new Error('¡No existe ese tipo de mensaje!')
        }
      } catch (e) {
        //? informo error o descarto todo procedimiento y espero al siguiente mensaje?
        console.error(e)
        return null //devuelvo null si hay error. después compruebo si esta función dió null, entonces es que hubo error y no debería enviar el body a la API
      }

      const fieldsNames = Object.keys(descriptor) //array con la ubicación númerica de los campos de información que debemos obtener
      const fields = Object.values(descriptor) //array con la ubicación númerica de los campos de información que debemos obtener
      fields.forEach((field, index) => {
        if (fieldsNames[index] === 'Evento') {
          Object.defineProperty(data, fieldsNames[index], {
            value: field,
            writable: true,
            enumerable: true,
            configurable: true,
          })
          return
        }

        Object.defineProperty(data, fieldsNames[index], {
          value: msgFields[field],
          writable: true,
          enumerable: true,
          configurable: true,
        })
      })

      //creando objeto Date() para timestamp
      let ts = data.GNSSUTC
      data.GNSSUTC = createTimestamp(ts, brand)

      if (data.hasOwnProperty('HARSH')) {
        // si el mensaje envía reportes de 'harsh behaviour', los extraemos
        //! todavia no hacemos nada con esto, y posiblemente tampoco hagamos algo
        let harshBehaviour = {
          speedLevel: data.HARSH[0],
          harshEvent: data.HARSH[1],
        }
      }

      //! switch como para añadir más condiciones a futuro, si no cambiar por if
      switch (true) {
        case data.hasOwnProperty('Motion') && eventType === 'GTSTT':
          let motionStatus = {
            // STATUS : EVENTO
            11: 15, //11 Sin ignicion quieto
            12: 15, //12 Sin ignicion moviendose pero todavia no remolcado
            16: 14, //16 Remolcado sin ignicion
            21: 16, //21 Detenido con ignicion
            22: 17, //22Ignicion y en movimiento
            41: 18, //41 rest (quieto y sin ignicion)
            42: 19, //42 motion (moviendose pero sin ignicion)
          }
          data.Evento = motionStatus[parseInt(data.Motion)]
          break
      }

      //   if (data.hasOwnProperty('Motion')) {
      //     // vamos a definir el tipo de evento según el 'motion status of the device'
      //     const motionStatus = {
      //       // STATUS : EVENTO
      //       11: 15, //11 Sin ignicion quieto
      //       12: 15, //12 Sin ignicion moviendose pero todavia no remolcado
      //       16: 14, //16 Remolcado sin ignicion
      //       21: 16, //21 Detenido con ignicion
      //       22: 17, //22Ignicion y en movimiento
      //       41: 18, //41 rest (quieto y sin ignicion)
      //       42: 19, //42 motion (moviendose pero sin ignicion)
      //     }
      //     data.Evento = motionStatus[parseInt(data.Motion)]
      //   }

      console.table(data)
      Object.freeze(data)
      return data
  }
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

function parseCoordinates(coor, brand) {
  let coordinates
  switch (brand) {
    case 'TRAX':
      coordinates = {
        int: coor.slice(0, -5), //extraemos la parte entera
        decimals: coor.slice(-5), //y la decimal
      }

    case 'QUECLINK':
      let queclinkCoor = coor.replace('.', '') //le quitamos el punto porque nos molesta
      coordinates = {
        int: queclinkCoor.slice(0, -6),
        decimals: queclinkCoor.slice(-6),
      }
  }
  return +`${coordinates.int}.${coordinates.decimals}` //lo devolvemos como número
}

//función que devuelve el objecto parseado para enviar a la API
function parseBodyObject(obj, brand) {
  switch (brand) {
    case 'TRAX':
      return {
        id: obj.deviceID,
        lat: parseCoordinates(obj.positionLat, brand),
        lng: parseCoordinates(obj.positionLon, brand),
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
    case 'QUECLINK':
      return {
        id: parseInt(obj.IMEI),
        lat: parseCoordinates(obj.Lat, brand),
        lng: parseCoordinates(obj.Lon, brand),
        speed: parseInt(obj.Speed),
        event: parseInt(obj.Event),
        direction: parseInt(obj.Heading),
        battery: parseInt(obj.Battery) || null,
        hdop: parseInt(obj.hdop) || null,
        nro: obj.Nro || null,
        timestamp: Date.parse(obj.timestamp),
        satelites: parseInt(obj.satelitesQuantity) || null,
        temp: parseInt(obj.temperature) || null,
      }
  }
}

function createTimestamp(data, brand) {
  switch (brand) {
    case 'TRAX':
      return new Date( // ahora creamos el timestamp en formato "yyyy-mm-ddThh:mm:ss.mmm UTC"
        `20${data.positionDate[4] + data.positionDate[5]}-${
          data.positionDate[2] + data.positionDate[3]
        }-${data.positionDate[0] + data.positionDate[1]}T${
          data.positionTime[0] + data.positionTime[1]
        }:${data.positionTime[2] + data.positionTime[3]}:${
          data.positionTime[4] + data.positionTime[5]
        }.000Z`
      )
    case 'QUECLINK':
      return new Date(
        `${data.slice(0, 4)}-${data.slice(4, 6)}-${data.slice(
          6,
          8
        )}T${data.slice(8, 10)}:${data.slice(10, 12)}:${data.slice(
          12,
          14
        )}.000Z`
      )
  }
}

module.exports = {
  deconstructMessage,
  GetCheckSum,
  parseCoordinates,
  parseBodyObject,
}

deconstructMessage(theOtherMsg)
