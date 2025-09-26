import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import App from './App.vue'
import './style.css'
import { churchtoolsClient } from '@churchtools/churchtools-client'

// Import the FontAwesome core
import { library } from '@fortawesome/fontawesome-svg-core'
// Import specific icons
import {
  faEye,
  faCalendarPlus,
  faSyncAlt,
  faSpinner,
  faExclamationTriangle,
  faRedo,
  faCalendarCheck,
  faCalendarAlt,
  faFlagCheckered,
  faInfoCircle,
  faChevronUp,
  faChevronDown,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons'
// Import the FontAwesome Vue component
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Add icons to the library
library.add(
  faEye,
  faCalendarPlus,
  faSyncAlt,
  faSpinner,
  faExclamationTriangle,
  faRedo,
  faCalendarCheck,
  faCalendarAlt,
  faFlagCheckered,
  faInfoCircle,
  faChevronUp,
  faChevronDown,
  faArrowRight
)

// i18n configuration
const i18n = createI18n({
  legacy: false, // you must set `false`, to use Composition API
  locale: 'de', // set locale
  fallbackLocale: 'de', // set fallback locale
  messages: {
    de: {
      // Add your German translations here
      expiringAppointments: 'auslaufende Terminserien',
      refresh: 'Aktualisieren',
      manageExpiringAppointments: 'Verwalten Sie auslaufende Terminserien',
      showAppointmentsEndingIn: 'Zeige Termine, die in den nächsten',
      days: 'Tagen enden',
      loadingAppointments: 'Lade Termine...',
      retry: 'Erneut versuchen',
      totalAppointments: 'Gesamte Termine',
      expiringSoon: 'Laufen bald ab',
      expired: 'Abgelaufen',
      searchAppointments: 'Termine durchsuchen...',
      status: 'Status',
      calendar: 'Kalender',
      noAppointmentsFound: 'Keine Termine gefunden',
      title: 'Titel',
      nextOccurrence: 'Nächstes Vorkommen',
      lastOccurrence: 'Letztes Vorkommen',
      actions: 'Aktionen',
      noEndDate: 'Kein Enddatum',
      extend: 'Verlängern',
      viewDetails: 'Details',
    },
  },
})

declare const window: Window &
  typeof globalThis & {
    settings: {
      base_url?: string
    }
  }

const baseUrl = window.settings?.base_url ?? import.meta.env.VITE_BASE_URL
churchtoolsClient.setBaseUrl(baseUrl)

const username = import.meta.env.VITE_USERNAME
const password = import.meta.env.VITE_PASSWORD
if (import.meta.env.MODE === 'development' && username && password) {
  try {
    console.log('🔐 Attempting ChurchTools login...')
    await churchtoolsClient.post('/login', { username, password })
    console.log('✅ ChurchTools login successful')

    // Test a simple API call
    const whoami = await churchtoolsClient.get('/whoami')
    console.log('👤 Current user:', whoami)
  } catch (error) {
    console.error('❌ ChurchTools login failed in development mode:', error)
  }
}

const KEY = import.meta.env.VITE_KEY
export { KEY }

// Create QueryClient with optimized defaults for ChurchTools data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache time (formerly cacheTime)
      retry: 3,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
})

const app = createApp(App)

// Register the FontAwesomeIcon component globally
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(i18n)
app.use(VueQueryPlugin, { queryClient })
app.mount('#app')
