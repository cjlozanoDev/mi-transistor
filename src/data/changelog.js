// Novedades y cambios que se muestran al usuario en un popup al entrar a la
// app, una sola vez por versión (ver useChangelogStore.js).
//
// Para publicar una nueva entrada: añade un objeto NUEVO al principio del
// array con una "version" distinta a la anterior (no tiene por qué coincidir
// con versionName de Android, es solo un identificador de esta lista).
// El texto de cada novedad va en todos los idiomas de la app (ver src/i18n);
// si falta alguno se muestra en español.
export const CHANGELOG = [
  {
    version: '5',
    items: [
      {
        icon: '🌙⏱️',
        text: {
          es: 'Nuevo temporizador de apagado: pulsa el reloj ⏱️ junto al botón de reproducir, elige dentro de cuánto tiempo quieres que se apague la radio y podrás dormirte escuchándola sin preocuparte.',
          ca: "Nou temporitzador d'apagada: prem el rellotge ⏱️ al costat del botó de reproduir, tria d'aquí a quant de temps vols que s'apagui la ràdio i podràs adormir-te escoltant-la sense preocupar-te.",
          eu: 'Itzaltzeko tenporizadore berria: sakatu ⏱️ erlojua erreproduzitzeko botoiaren ondoan, aukeratu noiz itzali nahi duzun irratia, eta lasai lo egin ahal izango duzu entzuten.',
          gl: 'Novo temporizador de apagado: preme o reloxo ⏱️ xunto ao botón de reproducir, escolle dentro de canto tempo queres que se apague a radio e poderás durmir escoitándoa sen preocuparte.',
          en: 'New sleep timer: tap the clock ⏱️ next to the play button, choose how long until the radio turns off, and fall asleep listening without worrying.',
        },
      },
    ],
  },
  {
    version: '4',
    items: [
      {
        icon: '🗣️',
        text: {
          es: 'Mi Transistor ya está disponible en catalán, euskera, gallego e inglés. Puedes cambiar el idioma desde el menú ☰ de arriba a la derecha, en Ajustes.',
          ca: "Mi Transistor ja està disponible en català, basc, gallec i anglès. Pots canviar l'idioma des del menú ☰ de dalt a la dreta, a Configuració.",
          eu: 'Mi Transistor katalanez, euskaraz, galegoz eta ingelesez ere erabil daiteke orain. Hizkuntza goian eskuinean dagoen ☰ menuan alda dezakezu, Ezarpenak atalean.',
          gl: 'Mi Transistor xa está dispoñible en catalán, éuscaro, galego e inglés. Podes cambiar o idioma desde o menú ☰ de arriba á dereita, en Axustes.',
          en: 'Mi Transistor is now available in Catalan, Basque, Galician and English. You can change the language from the ☰ menu at the top right, under Settings.',
        },
      },
    ],
  },
  {
    version: '3',
    items: [
      {
        icon: '🇪🇺📻',
        text: {
          es: 'Ya puedes escuchar emisoras de Europa: Alemania, Francia, Italia, Reino Unido, Portugal y muchos países más. Elige "Europa" en el listado de emisoras.',
          ca: 'Ja pots escoltar emissores d\'Europa: Alemanya, França, Itàlia, el Regne Unit, Portugal i molts països més. Tria "Europa" a la llista d\'emissores.',
          eu: 'Europako irratiak entzun ditzakezu orain: Alemania, Frantzia, Italia, Erresuma Batua, Portugal eta beste herrialde asko. Aukeratu "Europa" irratien zerrendan.',
          gl: 'Xa podes escoitar emisoras de Europa: Alemaña, Francia, Italia, Reino Unido, Portugal e moitos países máis. Escolle "Europa" na listaxe de emisoras.',
          en: 'You can now listen to stations from Europe: Germany, France, Italy, the United Kingdom, Portugal and many more countries. Choose "Europe" in the station list.',
        },
      },
    ],
  },
  {
    version: '2',
    items: [
      {
        icon: '📻🌐',
        text: {
          es: 'Ya puedes acceder a Mi Transistor desde cualquier navegador, además podrás instalarla en tu ordenador: https://mitransistor.com',
          ca: "Ja pots accedir a Mi Transistor des de qualsevol navegador, i a més la podràs instal·lar a l'ordinador: https://mitransistor.com",
          eu: 'Orain edozein nabigatzailetatik sar zaitezke Mi Transistor-era, eta ordenagailuan ere instala dezakezu: https://mitransistor.com',
          gl: 'Xa podes acceder a Mi Transistor desde calquera navegador, e ademais poderás instalala no teu ordenador: https://mitransistor.com',
          en: 'You can now use Mi Transistor from any browser, and you can also install it on your computer: https://mitransistor.com',
        },
      },
    ],
  },
  {
    version: '1',
    items: [
      {
        icon: '⭐',
        text: {
          es: 'Tus emisoras favoritas ya no se pierden al actualizar la app.',
          ca: "Les teves emissores preferides ja no es perden en actualitzar l'app.",
          eu: 'Zure irrati gogokoak ez dira gehiago galtzen aplikazioa eguneratzean.',
          gl: 'As túas emisoras favoritas xa non se perden ao actualizar a app.',
          en: 'Your favourite stations are no longer lost when you update the app.',
        },
      },
    ],
  },
]
