const config = require('./config') //! IMPORTING MESSAGES CONFIG
const { Buffer } = require('node:buffer') //! para calcular el tamaño en bytes del mensaje a recibir

const receivedMsg = 'RPF241207150026-3460180-05847823018156300F400' //* recibimos el mensaje del dispositivo

//INFO función que extrae el mensaje UDP y devuelve un objeto con toda la información detallada
function deconstructMessage(receivedMsg) {
  let data = {}
  const queryType = receivedMsg.slice(0, 3) //* extraemos el tipo de mensaje

  //INFO descriptor nos permite obtener los 'keys' del objeto según el tipo de mensaje que llegue (RPF, RPG, etc...)
  const descriptor = Object.getOwnPropertyDescriptor(config, queryType)

  //INFO obtenemos el tamaño del mensaje y lo comparamos con el tamaño por defecto según el tipo de mensaje
  const receivedMsgSize = Buffer.byteLength(receivedMsg, 'utf-8')

  //INFO manejo de errores
  try {
    if (!descriptor) throw new Error('¡No existe ese tipo de mensaje!')

    if (receivedMsgSize !== descriptor.value['defaultSize'])
      throw new Error('El mensaje está corrupto.')
  } catch (e) {
    console.error(e)
    return
  }

  const message = receivedMsg.slice(3) //* extraemos el mensaje completo
  const messageKeys = Object.keys(descriptor.value)

  messageKeys.forEach((key) => {
    const getValues = message.slice(
      descriptor.value[key].start,
      descriptor.value[key].end
    )
    Object.defineProperty(data, key, {
      value: getValues,
      writable: true, //default es false
      enumerable: true, //default es false
      configurable: true, //default es false
    })
  })
  //INFO creamos el timestamp en formato "yyyy-mm-ddThh:mm:ss.mmm-03:00"

  const timestamp = new Date(
    `20${data.positionDate[4] + data.positionDate[5]}-${
      data.positionDate[2] + data.positionDate[3]
    }-${data.positionDate[0] + data.positionDate[1]}T${
      data.positionTime[0] + data.positionTime[1]
    }:${data.positionTime[2] + data.positionTime[3]}:${
      data.positionTime[4] + data.positionTime[5]
    }.000-03:00`
  )

  //INFO lo definimos en el objeto 'data'
  Object.defineProperty(data, 'timestamp', {
    value: timestamp,
    writable: true, //default es false
    enumerable: true, //default es false
    configurable: true, //default es false
  })

  //INFO borramos las propiedades de fecha y hora que obtuvimos originalmente del mensaje para dejar únicamente el timestamp
  //INFO tambien borramos el defaultSize que se nos crea en el forEach
  delete data.positionDate
  delete data.positionTime
  delete data.defaultSize

  //INFO freezado para mejorar el rendimiento
  Object.freeze(data)

  return data
}

console.log(deconstructMessage(receivedMsg))
