import './style-meteoblue.css'
import { WeatherApp } from './weather-app.js'

// Initialize the weather app
const app = new WeatherApp()

// Make app globally accessible for error retry button
window.weatherApp = app

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init())
} else {
  app.init()
}

// Register service worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed, app will work without offline capabilities
    })
  })
}