// Novedades y cambios que se muestran al usuario en un popup al entrar a la
// app, una sola vez por versión (ver useChangelogStore.js).
//
// Para publicar una nueva entrada: añade un objeto NUEVO al principio del
// array con una "version" distinta a la anterior (no tiene por qué coincidir
// con versionName de Android, es solo un identificador de esta lista).
export const CHANGELOG = [
  {
    version: '1',
    title: 'Novedades',
    items: [{ icon: '⭐', text: 'Tus emisoras favoritas ya no se pierden al actualizar la app.' }],
  },
]
