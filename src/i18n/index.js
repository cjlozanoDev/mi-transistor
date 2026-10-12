import es from './es'
import ca from './ca'
import eu from './eu'
import gl from './gl'
import en from './en'

export const DEFAULT_LOCALE = 'es'

// Cada idioma se muestra siempre escrito en su propio idioma, para que quien
// lo necesite lo reconozca aunque la app esté en otro.
export const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'ca', label: 'Català' },
  { value: 'eu', label: 'Euskara' },
  { value: 'gl', label: 'Galego' },
  { value: 'en', label: 'English' },
]

export default { es, ca, eu, gl, en }
