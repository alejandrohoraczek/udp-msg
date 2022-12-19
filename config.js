
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
      msgChars: 69,
      },
      RPG: {
      positionDate: { lenght: 6, start: 0, end:6 },
      positionTime: { lenght: 6, start: 6, end: 12},
      positionLat: { lenght: 8, start: 12, end: 20},
      positionLon: { lenght: 8, start: 20, end: 29},
      speed: { lenght: 3, start: 29, end: 32},
      direction: { lenght: 3, start: 32, end: 35},
      satelitesQuantity: { lenght: 1, start: 35, end: 36},
      age: { lenght: 2, start: 36, end: 38},
      reportState: { lenght: 2, start: 38, end: 40},
      reportEvent: { lenght: 2, start: 40, end: 42},
      },
    }

    module.exports = config