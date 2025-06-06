package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/lib/pq"
	"github.com/sellinios/aethra/internal/config"
	"github.com/sellinios/aethra/internal/database"
	"github.com/sellinios/aethra/internal/handlers"
	"github.com/sellinios/aethra/internal/middleware"
)

func main() {
	// Load environment variables
	if err := config.LoadEnv(); err != nil {
		log.Printf("Warning: Could not load .env file: %v", err)
	}
	
	// Load configuration
	cfg := config.NewConfig()
	
	// Set up logger
	logger := log.New(os.Stdout, "[KAIROS] ", log.LstdFlags|log.Lshortfile)
	
	// Connect to database
	dbConn, err := database.NewDBConnection(cfg)
	if err != nil {
		logger.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbConn.Close()
	
	// Run migrations
	if err := dbConn.RunMigrations(); err != nil {
		logger.Printf("Warning: Migration failed: %v", err)
	}
	
	// Initialize handlers
	weatherHandler := handlers.NewWeatherHandler(dbConn.DB)
	geoHandler := handlers.NewGeoEntityHandler(dbConn.DB)
	systemHandler := handlers.NewSystemHandler(dbConn.DB)
	iconHandler := handlers.NewICONHandler(dbConn.DB)
	
	// Set up routes
	mux := http.NewServeMux()
	
	// Apply middleware chain: CORS -> Gzip -> Routes
	handler := middleware.CORS(middleware.Gzip(mux))
	
	// API routes
	setupRoutes(mux, weatherHandler, geoHandler, systemHandler, iconHandler)
	
	// Set up server
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  120 * time.Second,
	}
	
	// Start server
	go func() {
		logger.Printf("Starting Kairos Weather API on %s", addr)
		logger.Printf("Model: %s | Region: %s | Resolution: %.1fkm", 
			cfg.Weather.Model, cfg.Weather.Region, cfg.Weather.Resolution * 111)
			
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatalf("Server error: %v", err)
		}
	}()
	
	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit
	
	// Graceful shutdown
	logger.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatalf("Server forced to shutdown: %v", err)
	}
	
	logger.Println("Server stopped")
}

func setupRoutes(mux *http.ServeMux, weather *handlers.WeatherHandler, geo *handlers.GeoEntityHandler, system *handlers.SystemHandler, icon *handlers.ICONHandler) {
	// Health & System
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/system", system.GetSystemHealth)
	
	// Weather API v1
	mux.HandleFunc("/api/v1/weather", weather.HandleWeather)
	mux.HandleFunc("/api/v1/weather/current", weather.HandleCurrentWeather)
	mux.HandleFunc("/api/v1/weather/forecast", weather.HandleForecast)
	mux.HandleFunc("/api/v1/weather/bulk", weather.HandleBulkWeather)
	mux.HandleFunc("/api/v1/weather/map", weather.HandleWeatherMap)
	mux.HandleFunc("/api/v1/weather/alerts", weather.HandleWeatherAlerts)
	
	// Geographic API
	mux.HandleFunc("/api/places", geo.GetEntities)
	mux.HandleFunc("/api/places/search", geo.SearchEntities)
	mux.HandleFunc("/api/places/coordinates", geo.GetEntitiesByCoordinates)
	
	// ICON Weather API
	mux.HandleFunc("/api/icon/weather/forecast", icon.GetForecastByDateRange)
	mux.HandleFunc("/api/icon/weather/cities", icon.GetCitiesWithTemperatures)
	mux.HandleFunc("/api/icon/weather/precipitation", icon.GetPlacesWithPrecipitation)
	
	// Default route
	mux.HandleFunc("/", handleHome)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"healthy","service":"kairos-weather"}`))
}

func handleHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kairos Weather API</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        /* Header */
        .hero {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            color: white;
            padding: 80px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
        }
        
        .hero-content {
            position: relative;
            z-index: 1;
        }
        
        .hero h1 {
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: 800;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .hero p {
            font-size: 1.25rem;
            opacity: 0.9;
            margin-bottom: 40px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .cta-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            padding: 14px 28px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        
        .btn-primary {
            background: #3b82f6;
            color: white;
            box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);
        }
        
        .btn-primary:hover {
            background: #2563eb;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.4);
        }
        
        .btn-secondary {
            background: transparent;
            color: white;
            border-color: rgba(255, 255, 255, 0.3);
        }
        
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-2px);
        }
        
        /* Main Content */
        .main {
            padding: 80px 0;
        }
        
        .section {
            margin-bottom: 60px;
        }
        
        .section h2 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 30px;
            color: #1e293b;
            text-align: center;
        }
        
        /* Features Grid */
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 50px;
        }
        
        .feature-card {
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            border: 1px solid #e2e8f0;
        }
        
        .feature-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
        .feature-card h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 15px;
            color: #1e293b;
        }
        
        .feature-card p {
            color: #64748b;
            margin-bottom: 20px;
        }
        
        /* API Endpoints */
        .endpoints {
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
        }
        
        .endpoint-group {
            margin-bottom: 30px;
        }
        
        .endpoint-group h3 {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 15px;
            color: #374151;
        }
        
        .endpoint {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.875rem;
            overflow-x: auto;
        }
        
        .method {
            display: inline-block;
            padding: 4px 8px;
            background: #10b981;
            color: white;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-right: 12px;
        }
        
        /* Code Example */
        .code-example {
            background: #1e293b;
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            overflow-x: auto;
        }
        
        .code-example pre {
            color: #e2e8f0;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.875rem;
            line-height: 1.5;
        }
        
        .code-example .key {
            color: #7dd3fc;
        }
        
        .code-example .string {
            color: #86efac;
        }
        
        .code-example .number {
            color: #fbbf24;
        }
        
        /* Stats */
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 50px 0;
        }
        
        .stat {
            text-align: center;
            padding: 30px 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: 800;
            color: #3b82f6;
            margin-bottom: 8px;
        }
        
        .stat-label {
            color: #64748b;
            font-weight: 500;
        }
        
        /* Footer */
        .footer {
            background: #1e293b;
            color: white;
            padding: 40px 0;
            text-align: center;
        }
        
        .footer p {
            opacity: 0.8;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .hero {
                padding: 60px 0;
            }
            
            .main {
                padding: 60px 0;
            }
            
            .cta-buttons {
                flex-direction: column;
                align-items: center;
            }
            
            .btn {
                width: 100%;
                max-width: 300px;
                justify-content: center;
            }
            
            .features {
                grid-template-columns: 1fr;
            }
            
            .endpoints {
                padding: 20px;
            }
            
            .code-example {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="hero">
        <div class="container">
            <div class="hero-content">
                <h1>Kairos Weather API</h1>
                <p>High-resolution weather forecasts for Greece powered by ICON-EU model with 7km resolution</p>
                <div class="cta-buttons">
                    <a href="#quickstart" class="btn btn-primary">Quick Start Guide</a>
                    <a href="#endpoints" class="btn btn-secondary">View API Endpoints</a>
                </div>
            </div>
        </div>
    </div>

    <div class="main">
        <div class="container">
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">7km</div>
                    <div class="stat-label">Grid Resolution</div>
                </div>
                <div class="stat">
                    <div class="stat-number">8x</div>
                    <div class="stat-label">Daily Updates</div>
                </div>
                <div class="stat">
                    <div class="stat-number">120h</div>
                    <div class="stat-label">Forecast Range</div>
                </div>
                <div class="stat">
                    <div class="stat-number">100%</div>
                    <div class="stat-label">Greece Coverage</div>
                </div>
            </div>

            <div class="section" id="quickstart">
                <h2>Get Started in Seconds</h2>
                <div class="code-example">
                    <pre>curl <span class="string">"https://api.kairos.gr/api/v1/weather?city=Athens"</span></pre>
                </div>
            </div>

            <div class="section">
                <h2>Powerful Features</h2>
                <div class="features">
                    <div class="feature-card">
                        <h3>Real-time Data</h3>
                        <p>Get current weather conditions updated every 3 hours using the latest ICON-EU model runs from DWD.</p>
                    </div>
                    <div class="feature-card">
                        <h3>Detailed Forecasts</h3>
                        <p>Access hourly forecasts up to 120 hours ahead with temperature, wind, humidity, and precipitation data.</p>
                    </div>
                    <div class="feature-card">
                        <h3>Location Flexibility</h3>
                        <p>Query by city name or precise coordinates. Bulk requests supported for multiple locations.</p>
                    </div>
                    <div class="feature-card">
                        <h3>High Resolution</h3>
                        <p>7km grid spacing provides detailed local weather variations across all of Greece.</p>
                    </div>
                    <div class="feature-card">
                        <h3>Easy Integration</h3>
                        <p>RESTful JSON API with comprehensive documentation and consistent response formats.</p>
                    </div>
                    <div class="feature-card">
                        <h3>Geographic Search</h3>
                        <p>Find locations by name or coordinates with built-in Greek place database.</p>
                    </div>
                </div>
            </div>

            <div class="section" id="endpoints">
                <h2>API Endpoints</h2>
                <div class="endpoints">
                    <div class="endpoint-group">
                        <h3>Weather Data</h3>
                        <div class="endpoint">
                            <span class="method">GET</span>
                            /api/v1/weather?city={city}
                        </div>
                        <div class="endpoint">
                            <span class="method">GET</span>
                            /api/v1/weather/current?city={city}
                        </div>
                        <div class="endpoint">
                            <span class="method">GET</span>
                            /api/v1/weather/forecast?city={city}&hours=48
                        </div>
                        <div class="endpoint">
                            <span class="method">GET</span>
                            /api/v1/weather/bulk?cities=Athens,Thessaloniki
                        </div>
                    </div>
                    
                    <div class="endpoint-group">
                        <h3>Location Services</h3>
                        <div class="endpoint">
                            <span class="method">GET</span>
                            /api/places/search?q={query}
                        </div>
                        <div class="endpoint">
                            <span class="method">GET</span>
                            /api/places/coordinates?lat={lat}&lng={lng}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="footer">
        <div class="container">
            <p>Powered by ICON-EU Numerical Weather Model • German Weather Service (DWD)</p>
        </div>
    </div>
</body>
</html>
	`))
}