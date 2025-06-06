// Using native fetch instead of axios for smaller bundle size

export class WeatherApp {
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_URL || 'https://api.kairos.gr'
    this.currentCity = this.getCityFromUrl() || 'Athens'
    this.currentData = null
    this.searchTimeout = null
    this.majorCities = [
      'Athens', 'Thessaloniki', 'Patras', 'Heraklion', 
      'Larissa', 'Volos', 'Rhodes', 'Ioannina', 
      'Chania', 'Chalcis', 'Agrinio', 'Katerini'
    ]
    
    // Greek display names for cities
    this.cityDisplayNames = {
      'Athens': 'Αθήνα',
      'Thessaloniki': 'Θεσσαλονίκη', 
      'Patras': 'Πάτρα',
      'Heraklion': 'Ηράκλειο',
      'Larissa': 'Λάρισα',
      'Volos': 'Βόλος',
      'Rhodes': 'Ρόδος',
      'Ioannina': 'Ιωάννινα',
      'Chania': 'Χανιά',
      'Chalcis': 'Χαλκίδα',
      'Agrinio': 'Αγρίνιο',
      'Katerini': 'Κατερίνη'
    }
    this.weatherIcons = {
      'clear': '☀️',
      'partly_cloudy': '⛅',
      'cloudy': '☁️',
      'overcast': '☁️',
      'rain': '🌧️',
      'snow': '❄️',
      'thunderstorm': '⛈️',
      'mist': '🌫️',
      'fog': '🌫️'
    }
    this.refreshInterval = null
    this.lastUpdate = null
    this.preferences = this.loadPreferences()
  }
  
  // Get Greek display name for a city
  getCityDisplayName(englishName) {
    return this.cityDisplayNames[englishName] || englishName
  }
  
  // Get English name from Greek name (for URL generation)
  getEnglishCityName(cityName) {
    // If it's already in English, return it
    if (this.cityDisplayNames[cityName]) {
      return cityName
    }
    
    // Find English key for Greek value
    for (const [english, greek] of Object.entries(this.cityDisplayNames)) {
      if (greek === cityName) {
        return english
      }
    }
    
    // Fallback: return as-is
    return cityName
  }

  getCityFromUrl() {
    const path = window.location.pathname.toLowerCase()
    const segments = path.split('/').filter(Boolean)
    
    if (segments.length > 0) {
      const cityName = segments[0]
      // Capitalize first letter
      return cityName.charAt(0).toUpperCase() + cityName.slice(1)
    }
    return null
  }

  updateUrl(city) {
    // Always use English name for URL
    const englishCityName = this.getEnglishCityName(city)
    const citySlug = englishCityName.toLowerCase()
    const newUrl = `/${citySlug}`
    
    if (window.location.pathname !== newUrl) {
      window.history.pushState({ city: englishCityName }, '', newUrl)
      document.title = `Καιρός ${this.getCityDisplayName(englishCityName)} - Καιρός Ελλάδας`
    }
    
    // Update canonical URL to match current page
    const canonicalUrl = document.getElementById('canonical-url') || document.querySelector('link[rel="canonical"]')
    if (canonicalUrl) {
      canonicalUrl.href = `https://kairos.gr${newUrl}`
    }
  }

  init() {
    this.renderApp()
    this.applyInitialTheme() // Apply saved theme on load
    this.attachEventListeners()
    this.setupUrlRouting()
    this.updateUrl(this.currentCity) // Set initial canonical URL
    this.loadWeatherData(this.currentCity)
    this.startAutoRefresh()
    // Removed automatic geolocation request
    this.initializeAnimations()
    this.initializeAnalytics()
  }
  
  applyInitialTheme() {
    const theme = this.preferences.theme || 'dark'
    document.body.setAttribute('data-theme', theme)
  }

  setupUrlRouting() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.city) {
        this.currentCity = event.state.city
        this.loadWeatherData(this.currentCity)
        this.updateActiveCity()
      }
    })

    // Set initial state
    window.history.replaceState({ city: this.currentCity }, '', window.location.pathname)
  }

  updateActiveCity() {
    // Update active state on city buttons
    document.querySelectorAll('.city-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.city === this.currentCity)
    })
  }

  loadPreferences() {
    const saved = localStorage.getItem('weatherPreferences')
    return saved ? JSON.parse(saved) : {
      units: 'celsius',
      theme: 'dark',
      autoRefresh: true,
      notifications: false
    }
  }

  savePreferences() {
    localStorage.setItem('weatherPreferences', JSON.stringify(this.preferences))
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `notification notification-${type}`
    notification.textContent = message
    
    // Add to page
    document.body.appendChild(notification)
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10)
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show')
      setTimeout(() => notification.remove(), 300)
    }, 3000)
  }

  startAutoRefresh() {
    if (this.preferences.autoRefresh) {
      this.refreshInterval = setInterval(() => {
        this.loadWeatherData(this.currentCity, true)
      }, 300000) // 5 minutes
    }
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }

  async detectLocation() {
    if ('geolocation' in navigator) {
      try {
        // Show loading state on button
        const locationBtn = document.getElementById('locationButton')
        if (locationBtn) {
          locationBtn.classList.add('loading')
          locationBtn.disabled = true
        }

        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true
          })
        })
        
        const { latitude, longitude } = position.coords
        
        // Load weather for the detected coordinates
        // Note: You'll need to implement coordinate-based weather loading
        // For now, we'll show a message
        this.showNotification('Η τοποθεσία εντοπίστηκε! Η λειτουργία έρχεται σύντομα.')
        console.log('User location:', latitude, longitude)
        
      } catch (error) {
        console.log('Location detection failed:', error)
        this.showNotification('Δεν μπορούμε να εντοπίσουμε την τοποθεσία σας. Παρακαλώ αναζητήστε μια πόλη.')
      } finally {
        // Remove loading state
        const locationBtn = document.getElementById('locationButton')
        if (locationBtn) {
          locationBtn.classList.remove('loading')
          locationBtn.disabled = false
        }
      }
    } else {
      this.showNotification('Οι υπηρεσίες τοποθεσίας δεν είναι διαθέσιμες στο πρόγραμμα περιήγησης σας.')
    }
  }

  initializeAnimations() {
    // Initialize GSAP or other animation libraries if needed
    // Particle effects removed for performance
  }

  // Analytics lazy-loaded for better performance
  initializeAnalytics() {
    // Delay analytics loading to not block initial render
    setTimeout(() => {
      if (window.location.hostname !== 'localhost') {
        // Use the existing gtag function from index.html
        if (typeof gtag !== 'undefined') {
          // Update consent to allow analytics
          gtag('consent', 'update', {
            'analytics_storage': 'granted'
          })
        }
        
        // Load the analytics script
        const script = document.createElement('script')
        script.async = true
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-QW21NJBW7K'
        script.onload = () => {
          // Configure analytics after script loads
          if (typeof gtag !== 'undefined') {
            gtag('js', new Date())
            gtag('config', 'G-QW21NJBW7K')
          }
        }
        document.head.appendChild(script)
      }
    }, 3000)
  }

  // Particle effects removed for better performance

  renderApp() {
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="animated-bg" id="animatedBg">
        <div class="gradient-orb"></div>
        <div class="gradient-orb"></div>
        <div class="gradient-orb"></div>
      </div>

      <header class="header">
        <div class="container">
          <div class="header-content">
            <h1 class="logo">KAIROS</h1>
            <div class="search-container">
              <input 
                type="text" 
                class="search-input" 
                placeholder="Αναζήτηση πόλης..."
                id="citySearch"
                autocomplete="off"
              >
              <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <div class="search-suggestions" id="searchSuggestions" style="display: none;"></div>
            </div>
            <div class="header-actions">
              <button class="location-button" id="locationButton" aria-label="Χρήση τοποθεσίας μου">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </button>
              <button class="theme-toggle" id="themeToggle" aria-label="Αλλαγή θέματος">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </button>
              <button class="refresh-button" id="refreshButton" aria-label="Ανανέωση καιρού">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="main">
        <div class="container">
          <div class="quick-cities">
            <h2 class="section-title">Δημοφιλείς Προορισμοί</h2>
            <div class="cities-grid" id="citiesGrid">
              ${this.majorCities.map(city => `
                <button class="city-button ${city === this.currentCity ? 'active' : ''}" data-city="${city}">${city}</button>
              `).join('')}
            </div>
          </div>

          <div id="weatherContent">
            <div class="loading-container">
              <div class="loader">
                <div class="loader-sun"></div>
              </div>
              <p class="loading-text">Φόρτωση δεδομένων καιρού...</p>
            </div>
          </div>
        </div>
      </main>
    `
  }

  attachEventListeners() {
    // City buttons
    document.getElementById('citiesGrid').addEventListener('click', (e) => {
      if (e.target.classList.contains('city-button')) {
        const city = e.target.dataset.city
        
        // Update URL
        this.updateUrl(city)
        
        // Update active state
        document.querySelectorAll('.city-button').forEach(btn => {
          btn.classList.remove('active')
        })
        e.target.classList.add('active')
        
        this.loadWeatherData(city)
      }
    })

    // Search input
    const searchInput = document.getElementById('citySearch')
    const suggestions = document.getElementById('searchSuggestions')

    searchInput.addEventListener('input', (e) => {
      clearTimeout(this.searchTimeout)
      const query = e.target.value.trim()

      if (query.length < 2) {
        suggestions.style.display = 'none'
        return
      }

      this.searchTimeout = setTimeout(() => {
        this.searchCities(query)
      }, 300)
    })

    // Enter key in search
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim()
        if (query) {
          this.updateUrl(query)
          this.loadWeatherData(query)
          suggestions.style.display = 'none'
        }
      }
    })

    // Click outside to close suggestions
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        suggestions.style.display = 'none'
      }
    })

    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      this.toggleTheme()
    })

    // Refresh button
    document.getElementById('refreshButton')?.addEventListener('click', () => {
      this.refreshWeather()
    })

    // Location button
    document.getElementById('locationButton')?.addEventListener('click', () => {
      this.detectLocation()
    })

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'k':
            e.preventDefault()
            searchInput.focus()
            break
          case 'r':
            e.preventDefault()
            this.refreshWeather()
            break
        }
      }
    })
  }

  toggleTheme() {
    const body = document.body
    const currentTheme = body.getAttribute('data-theme') || 'dark'
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    body.setAttribute('data-theme', newTheme)
    this.preferences.theme = newTheme
    this.savePreferences()
  }

  refreshWeather() {
    const refreshButton = document.getElementById('refreshButton')
    refreshButton?.classList.add('spinning')
    
    this.loadWeatherData(this.currentCity, true).finally(() => {
      refreshButton?.classList.remove('spinning')
    })
  }

  async searchCities(query) {
    try {
      const url = new URL(`${this.apiBaseUrl}/api/places/search`)
      url.searchParams.append('q', query)
      url.searchParams.append('limit', '5')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const suggestions = document.getElementById('searchSuggestions')
      
      if (data.results && data.results.length > 0) {
        suggestions.innerHTML = data.results.map(city => `
          <div class="suggestion-item" data-city="${city.name_en || city.name}">
            ${city.name_en || city.name}
          </div>
        `).join('')
        
        suggestions.style.display = 'block'

        // Add click handlers
        suggestions.querySelectorAll('.suggestion-item').forEach(item => {
          item.addEventListener('click', () => {
            const cityName = item.dataset.city
            document.getElementById('citySearch').value = cityName
            suggestions.style.display = 'none'
            this.updateUrl(cityName)
            this.loadWeatherData(cityName)
          })
        })
      } else {
        suggestions.style.display = 'none'
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Search request timed out')
      } else {
        console.error('Search error:', error)
      }
    }
  }

  async loadWeatherData(city, silent = false) {
    // Always use English name for API calls and internal storage
    const englishCityName = this.getEnglishCityName(city)
    this.currentCity = englishCityName
    
    const weatherContent = document.getElementById('weatherContent')
    
    if (!silent) {
      weatherContent.innerHTML = `
        <div class="loading-container">
          <div class="loader">
            <div class="loader-sun"></div>
          </div>
          <p class="loading-text">Φόρτωση καιρού για ${this.getCityDisplayName(englishCityName)}...</p>
        </div>
      `
    }

    try {
      const url = new URL(`${this.apiBaseUrl}/api/v1/weather`)
      url.searchParams.append('city', englishCityName)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      this.currentCity = englishCityName
      this.currentData = data
      this.lastUpdate = new Date()
      this.displayWeatherData(data)
      this.updateBackgroundTheme(data)
      this.addWeatherParticles(data)
      this.updateActiveCity()
      
      // Update page title with Greek display name
      document.title = `Καιρός ${this.getCityDisplayName(englishCityName)} - Καιρός Ελλάδας`
      
      // Save to local storage for offline access
      this.saveToCache(englishCityName, data)
      
    } catch (error) {
      // Try to load from cache if available
      const cached = this.loadFromCache(englishCityName)
      if (cached && !silent) {
        this.displayWeatherData(cached)
        this.showOfflineNotice()
      } else {
        this.displayError(error)
      }
    }
  }

  saveToCache(city, data) {
    const cache = {
      data: data,
      timestamp: Date.now(),
      city: city
    }
    localStorage.setItem(`weather_${city}`, JSON.stringify(cache))
  }

  loadFromCache(city) {
    const cached = localStorage.getItem(`weather_${city}`)
    if (!cached) return null
    
    const { data, timestamp } = JSON.parse(cached)
    const age = Date.now() - timestamp
    
    // Cache valid for 30 minutes
    if (age < 1800000) {
      return data
    }
    return null
  }

  showOfflineNotice() {
    const notice = document.createElement('div')
    notice.className = 'offline-notice'
    notice.textContent = 'Εμφάνιση αποθηκευμένων δεδομένων - λειτουργία χωρίς σύνδεση'
    document.body.appendChild(notice)
    
    setTimeout(() => {
      notice.remove()
    }, 5000)
  }

  displayWeatherData(data) {
    const weatherContent = document.getElementById('weatherContent')
    
    if (!data || !data.location) {
      this.displayError({ message: 'Λήφθηκαν μη έγκυρα δεδομένα καιρού' })
      return
    }

    const location = data.location
    const current = data.current || (data.hourly && data.hourly[0])
    
    if (!current) {
      this.displayError({ message: 'Δεν υπάρχουν διαθέσιμα δεδομένα καιρού' })
      return
    }

    const weatherCondition = this.getWeatherCondition(current)
    const weatherIcon = this.getWeatherIcon(weatherCondition)
    const temp = Math.round(current.temperature?.value || current.temperature || 0)
    const feelsLike = Math.round(current.feels_like || temp)
    const humidity = current.humidity || 0
    const windSpeed = (current.wind?.speed || 0).toFixed(1)
    const windDir = current.wind?.direction || 0
    const pressure = Math.round(current.pressure?.value || current.pressure || 0)
    const visibility = current.visibility ? (current.visibility / 1000).toFixed(1) : 'N/A'
    const uvIndex = current.uv_index || 0
    
    weatherContent.innerHTML = `
      <div class="current-weather" data-weather="${weatherCondition}">
        <div class="weather-header">
          <h2 class="location-name">${location.name}</h2>
          <div class="location-coords">${location.latitude?.toFixed(2)}°N, ${location.longitude?.toFixed(2)}°E</div>
          <div class="last-update">Ενημερώθηκε ${this.formatLastUpdate()}</div>
        </div>
        
        <div class="weather-main">
          <div class="weather-icon-large weather-icon-${weatherCondition}">${weatherIcon}</div>
          <div class="current-temp" data-temp="${temp}°">${temp}°</div>
          <p class="weather-description">${current.weather?.description || weatherCondition}</p>
        </div>
        
        <div class="weather-details">
          <div class="detail-item">
            <div class="detail-icon">🌡️</div>
            <div class="detail-label">Αίσθηση Θερμοκρασίας</div>
            <div class="detail-value">${feelsLike}°</div>
          </div>
          <div class="detail-item">
            <div class="detail-icon">💧</div>
            <div class="detail-label">Υγρασία</div>
            <div class="detail-value">${humidity}%</div>
          </div>
          <div class="detail-item">
            <div class="detail-icon">💨</div>
            <div class="detail-label">Άνεμος</div>
            <div class="detail-value">${windSpeed} m/s</div>
            <div class="wind-compass">
              <div class="wind-compass-needle" style="transform: rotate(${windDir}deg)"></div>
              <div class="wind-speed-label">${this.getWindDirection(windDir)}</div>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-icon">🔘</div>
            <div class="detail-label">Πίεση</div>
            <div class="detail-value">${pressure} hPa</div>
          </div>
          <div class="detail-item">
            <div class="detail-icon">👁️</div>
            <div class="detail-label">Ορατότητα</div>
            <div class="detail-value">${visibility} km</div>
          </div>
          <div class="detail-item">
            <div class="detail-icon">☀️</div>
            <div class="detail-label">Δείκτης UV</div>
            <div class="detail-value">${uvIndex}</div>
            ${this.renderUVIndex(uvIndex)}
          </div>
        </div>
      </div>
      
      ${this.renderWeatherAlerts(data.alerts)}
      ${this.renderHourlyForecast(data.hourly)}
      ${this.renderDailyForecast(data.daily)}
      <!-- Charts and sun/moon info removed for performance -->
    `
    
    // Animate elements on load
    this.animateWeatherElements()
  }

  getWeatherCondition(current) {
    const desc = (current.weather?.description || '').toLowerCase()
    if (desc.includes('clear')) return 'clear'
    if (desc.includes('cloud')) return 'clouds'
    if (desc.includes('rain')) return 'rain'
    if (desc.includes('snow')) return 'snow'
    if (desc.includes('thunder')) return 'thunderstorm'
    if (desc.includes('mist') || desc.includes('fog')) return 'mist'
    return 'clear'
  }

  getWeatherIcon(condition) {
    return this.weatherIcons[condition] || '🌤️'
  }

  getWindDirection(degrees) {
    const directions = ['Β', 'ΒΑ', 'Α', 'ΝΑ', 'Ν', 'ΝΔ', 'Δ', 'ΒΔ']
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  formatLastUpdate() {
    if (!this.lastUpdate) return 'Just now'
    
    const diff = Date.now() - this.lastUpdate.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'μόλις τώρα'
    if (minutes === 1) return 'πριν από 1 λεπτό'
    if (minutes < 60) return `πριν από ${minutes} λεπτά`
    
    const hours = Math.floor(minutes / 60)
    if (hours === 1) return 'πριν από 1 ώρα'
    return `πριν από ${hours} ώρες`
  }

  renderUVIndex(uv) {
    const level = Math.min(Math.floor(uv), 11)
    return `
      <div class="uv-scale">
        ${Array.from({length: 11}, (_, i) => `
          <div class="uv-bar ${i < level ? 'active' : ''}"></div>
        `).join('')}
      </div>
    `
  }

  renderWeatherAlerts(alerts) {
    if (!alerts || alerts.length === 0) return ''
    
    return `
      <div class="weather-alerts">
        ${alerts.map(alert => `
          <div class="weather-alert">
            <div class="weather-alert-icon">⚠️</div>
            <div class="weather-alert-content">
              <div class="weather-alert-title">${alert.title}</div>
              <div class="weather-alert-desc">${alert.description}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `
  }

  renderHourlyForecast(hourly) {
    if (!hourly || hourly.length === 0) return ''

    const next24Hours = hourly.slice(0, 24)

    return `
      <div class="forecast-section">
        <h3 class="section-title">Πρόγνωση 24 Ωρών</h3>
        <div class="forecast-tabs">
          <button class="tab-button active" data-view="grid">Προβολή Πλέγματος</button>
          <button class="tab-button" data-view="chart">Προβολή Γραφήματος</button>
          <button class="tab-button" data-view="detailed">Λεπτομερής</button>
        </div>
        <div class="forecast-content" data-view="grid">
          <div class="forecast-grid">
            ${next24Hours.filter((_, index) => index % 3 === 0).map((hour, idx) => `
              <div class="forecast-card" data-hour="${idx}">
                <div class="forecast-time">${this.formatTime(hour.time)}</div>
                <div class="forecast-icon">${this.getWeatherIcon(this.getWeatherCondition(hour))}</div>
                <div class="forecast-temp">${Math.round(hour.temperature)}°</div>
                <div class="forecast-desc">${hour.weather.description}</div>
                <div class="forecast-details">
                  <span>💨 ${hour.wind.speed.toFixed(1)} m/s</span>
                  <span>💧 ${hour.humidity}%</span>
                </div>
                ${hour.precipitation_probability > 0 ? `
                  <div class="precipitation-chance">
                    🌧️ ${hour.precipitation_probability}%
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="forecast-content" data-view="chart" style="display: none;">
          <div class="temp-graph">
            ${next24Hours.map((hour, idx) => {
              const maxTemp = Math.max(...next24Hours.map(h => h.temperature))
              const minTemp = Math.min(...next24Hours.map(h => h.temperature))
              const height = ((hour.temperature - minTemp) / (maxTemp - minTemp)) * 100
              return `
                <div class="temp-bar" style="height: ${height}%" data-hour="${idx}">
                  <div class="temp-bar-label">${Math.round(hour.temperature)}°</div>
                </div>
              `
            }).join('')}
          </div>
        </div>
        <div class="forecast-content" data-view="detailed" style="display: none;">
          <div class="mini-weather-grid">
            ${next24Hours.map((hour, idx) => `
              <div class="mini-weather-card" data-hour="${idx}">
                <div class="mini-weather-time">${this.formatTime(hour.time)}</div>
                <div class="mini-weather-icon">${this.getWeatherIcon(this.getWeatherCondition(hour))}</div>
                <div class="mini-weather-temp">${Math.round(hour.temperature)}°</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `
  }

  renderDailyForecast(daily) {
    if (!daily || daily.length === 0) return ''

    return `
      <div class="forecast-section">
        <h3 class="section-title">Εβδομαδιαία Πρόγνωση</h3>
        <div class="forecast-grid">
          ${daily.slice(0, 7).map((day, idx) => `
            <div class="forecast-card daily-card" data-day="${idx}">
              <div class="forecast-time">${this.formatDate(day.date)}</div>
              <div class="forecast-day">${this.formatDayName(day.date)}</div>
              <div class="forecast-icon">${this.getWeatherIcon(this.getWeatherCondition(day))}</div>
              <div class="forecast-temp">
                <span class="temp-high">${Math.round(day.temperature.max)}°</span>
                <span class="temp-low">${Math.round(day.temperature.min)}°</span>
              </div>
              <div class="forecast-desc">${day.weather.description}</div>
              <div class="forecast-details">
                <span>💧 ${day.humidity}%</span>
                <span>💨 ${day.wind?.speed?.toFixed(1) || 0} m/s</span>
              </div>
              ${day.precipitation_probability > 0 ? `
                <div class="precipitation-bar">
                  <div class="precipitation-fill" style="width: ${day.precipitation_probability}%"></div>
                  <span class="precipitation-label">${day.precipitation_probability}% βροχή</span>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  formatDayName(dateString) {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return 'Σήμερα'
    if (date.toDateString() === tomorrow.toDateString()) return 'Αύριο'
    
    const greekDays = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο']
    return greekDays[date.getDay()]
  }

  formatTime(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      const hours = date.getHours()
      if (hours === now.getHours()) return 'Τώρα'
    }
    
    const hours = date.getHours()
    const isAfternoon = hours >= 12
    const displayHour = hours % 12 || 12
    const period = isAfternoon ? 'ΜΜ' : 'ΠΜ'
    return `${displayHour} ${period}`
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    const greekMonths = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαϊ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ']
    return `${date.getDate()} ${greekMonths[date.getMonth()]}`
  }

  // Chart rendering removed - was dead code with no implementation

  // Sun/moon info removed - was placeholder with hardcoded values

  displayError(error) {
    const weatherContent = document.getElementById('weatherContent')
    let message = 'Αποτυχία φόρτωσης δεδομένων καιρού'
    
    if (error.name === 'AbortError') {
      message = 'Η αίτηση έληξε. Παρακαλώ δοκιμάστε ξανά.'
    } else if (error.message.includes('HTTP error!')) {
      message = `Σφάλμα διακομιστή: ${error.message}`
    } else {
      message = error.message || 'Αποτυχία φόρτωσης δεδομένων καιρού'
    }
    
    weatherContent.innerHTML = `
      <div class="error-message">
        <div class="error-icon">⚠️</div>
        <h3>Αδυναμία Φόρτωσης Καιρού</h3>
        <p>${message}</p>
        <p>Παρακαλώ ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.</p>
        <button class="retry-button" onclick="window.weatherApp.loadWeatherData('${this.currentCity}')">
          Επανάληψη
        </button>
      </div>
    `
  }

  updateBackgroundTheme(data) {
    const body = document.body
    const bg = document.getElementById('animatedBg')
    
    if (!data.current && !data.hourly) return
    
    const current = data.current || data.hourly[0]
    const condition = this.getWeatherCondition(current)
    const hour = new Date().getHours()
    const isNight = hour < 6 || hour > 20
    
    // Remove all weather classes
    body.className = body.className.replace(/weather-\w+/g, '')
    
    // Add new weather class
    const weatherClass = isNight && condition === 'clear' ? 'weather-clear-night' : `weather-${condition}`
    body.classList.add(weatherClass)
    
    // Update gradient orbs based on weather
    this.updateGradientOrbs(condition)
  }

  updateGradientOrbs(condition) {
    const orbs = document.querySelectorAll('.gradient-orb')
    const colors = {
      clear: ['#fbbf24', '#f59e0b', '#dc2626'],
      clouds: ['#64748b', '#475569', '#334155'],
      rain: ['#1e40af', '#1e3a8a', '#60a5fa'],
      snow: ['#e0e7ff', '#c7d2fe', '#a5b4fc'],
      thunderstorm: ['#581c87', '#312e81', '#a78bfa'],
      mist: ['#9ca3af', '#6b7280', '#4b5563']
    }
    
    const weatherColors = colors[condition] || colors.clear
    
    orbs.forEach((orb, index) => {
      if (weatherColors[index]) {
        orb.style.background = `radial-gradient(circle, ${weatherColors[index]} 0%, transparent 70%)`
      }
    })
  }

  addWeatherParticles(data) {
    const container = document.querySelector('.weather-particles')
    if (!container) return
    
    // Clear existing particles
    container.innerHTML = ''
    
    const current = data.current || data.hourly?.[0]
    if (!current) return
    
    const condition = this.getWeatherCondition(current)
    
    switch(condition) {
      // Particle effects removed for performance
    }
  }

  // Particle creation functions removed for better performance

  animateWeatherElements() {
    // Add stagger animation to forecast cards
    const cards = document.querySelectorAll('.forecast-card')
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`
      card.classList.add('fade-in-up')
    })
    
    // Add hover interactions
    cards.forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('selected')
      })
    })
    
    // Setup tab switching
    const tabs = document.querySelectorAll('.tab-button')
    const contents = document.querySelectorAll('.forecast-content')
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.dataset.view
        
        tabs.forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        
        contents.forEach(content => {
          content.style.display = content.dataset.view === view ? 'block' : 'none'
        })
      })
    })
  }

  // Helper function to insert ad containers
  insertAdContainer(elementId, adClass = 'ad-container') {
    const adContainer = document.createElement('div')
    adContainer.className = adClass
    adContainer.innerHTML = `
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="ca-pub-3131616609445146"
           data-ad-slot="YOUR_AD_SLOT_ID"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    `
    
    const targetElement = document.getElementById(elementId)
    if (targetElement) {
      targetElement.appendChild(adContainer)
      
      // Push ad if AdSense is loaded
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    }
  }

  // Example: Call this after rendering weather content
  // this.insertAdContainer('weatherContent', 'ad-container')
}