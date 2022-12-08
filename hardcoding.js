const config = {
  //*  indicar tipo de reporte, con sus respectivos elementos, la extensión en caracteres
  //*  y la posición en que comienzan. 
    RPF: {
    positionDate: { lenght: 6, start: 0, end:6 },
    positionTime: { lenght: 6, start: 6, end: 12},
    positionLat: { lenght: 8, start: 12, end: 20},
    positionLon: { lenght: 8, start: 20, end: 29},
    speed: { lenght: 3, start: 29, end: 32},
    direction: { lenght: 3, start: 32, end: 35},
    positionDimension: { lenght: 1, start: 35, end: 36},
    age: { lenght: 2, start: 36, end: 38},
    reportState: { lenght: 2, start: 38, end: 40},
    reportEvent: { lenght: 2, start: 40, end: 42},
    },
  }

const receivedMsg = 'RPF241207150026-3460180-05847823018156300F400' //* recibimos el mensaje del dispositivo

//INFO función que extrae el mensaje UDP y devuelve un objeto con toda la información detallada
function deconstructMessage(receivedMsg) {
  let data //* variable donde guardaremos la información

  const queryType = receivedMsg.slice(0, 3) //* extraemos el tipo de mensaje

  const message = receivedMsg.slice(3) //* extraemos el mensaje completo
  
  //+ deconstruímos los datos del mensaje
  const positionDate = message.slice(config.RPF.positionDate.start, config.RPF.positionDate.end)
  const positionTime = message.slice(config.RPF.positionTime.start, config.RPF.positionTime.end)
  const positionLat = message.slice(config.RPF.positionLat.start, config.RPF.positionLat.end)
  const positionLon = message.slice(config.RPF.positionLon.start, config.RPF.positionLon.end)
  const speed = message.slice(config.RPF.speed.start, config.RPF.speed.end)
  const direction = message.slice(config.RPF.direction.start, config.RPF.direction.end)
  const positionDimension = message.slice(config.RPF.positionDimension.start, config.RPF.positionDimension.end)
  const age = message.slice(config.RPF.age.start, config.RPF.age.end)
  const reportState = message.slice(config.RPF.reportState.start, config.RPF.reportState.end)
  const reportEvent = message.slice(config.RPF.reportEvent.start, config.RPF.reportEvent.end)

  //* Guardamos la información y la devolvemos 
  
  data = {
    positionDate: {
      day: positionDate[0] + positionDate[1],
      month: positionDate[2] + positionDate[3],
      year: positionDate[4] + positionDate[5],
      full: positionDate,
    },
    positionTime: {
      hour: positionTime[0] + positionTime[1],
      minute: positionTime[2] + positionTime[3],
      second: positionTime[4] + positionTime[5],
      full: positionTime,
    },
    positionLat: {
      degree: positionLat[0] + positionLat[1] + positionLat[2],
      decimal: positionLat[3] + positionLat[4] + positionLat[5] + positionLat[6] + positionLat[7],
      full: positionLat,
    },
    positionLon: {
      degree: positionLon[0] + positionLon[1] + positionLon[2] + positionLon[3],
      decimal: positionLon[4] + positionLon[5] + positionLon[6] + positionLon[7] + positionLon[8],
      full: positionLon,
    },
    speed: Math.floor(speed[0] + speed[1] + speed[2]),
    direction: Math.floor(direction[0] + direction[1] + direction[2]),
    positionDimension,
    age: age[0] + age[1],
    reportState: reportState[0] + reportState[1],
    reportEvent: reportEvent[0] + reportEvent[1],
  }

  return data
}

console.log(deconstructMessage(receivedMsg))
