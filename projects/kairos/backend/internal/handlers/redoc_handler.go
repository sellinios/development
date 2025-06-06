package handlers

import (
	"net/http"
)

// RedocHandler serves the Redoc API documentation
type RedocHandler struct{}

// NewRedocHandler creates a new RedocHandler
func NewRedocHandler() *RedocHandler {
	return &RedocHandler{}
}

// ServeHTTP serves the Redoc HTML
func (h *RedocHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(redocHTML))
}

const redocHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <title>Kairos Weather API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
        }
        
        .docs-header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            color: white;
            padding: 60px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .docs-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
        }
        
        .header-content {
            position: relative;
            z-index: 1;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .docs-header h1 {
            font-size: clamp(2rem, 4vw, 3rem);
            font-weight: 800;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .docs-header p {
            font-size: 1.125rem;
            opacity: 0.9;
            margin-bottom: 30px;
        }
        
        .nav-links {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .nav-link {
            display: inline-flex;
            align-items: center;
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            font-size: 0.875rem;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .nav-link:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.4);
            transform: translateY(-1px);
        }
        
        .docs-container {
            background: white;
            margin: 0;
            border-radius: 0;
            box-shadow: none;
        }
        
        /* Custom Redoc styling */
        .redoc-container {
            margin: 0;
        }
        
        @media (max-width: 768px) {
            .docs-header {
                padding: 40px 0;
            }
            
            .nav-links {
                flex-direction: column;
                align-items: center;
            }
            
            .nav-link {
                width: 100%;
                max-width: 200px;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="docs-header">
        <div class="header-content">
            <h1>API Documentation</h1>
            <p>Comprehensive guide to the Kairos Weather API endpoints and usage</p>
            <div class="nav-links">
                <a href="/" class="nav-link">← Back to Home</a>
                <a href="#section/Authentication" class="nav-link">Quick Start</a>
                <a href="#tag/Weather" class="nav-link">Weather API</a>
                <a href="#tag/Locations" class="nav-link">Locations</a>
            </div>
        </div>
    </div>
    
    <div class="docs-container">
        <redoc spec-url='/api/openapi.json' 
               theme='{
                   "colors": {
                       "primary": {
                           "main": "#3b82f6"
                       },
                       "success": {
                           "main": "#10b981"
                       },
                       "warning": {
                           "main": "#f59e0b"
                       },
                       "error": {
                           "main": "#ef4444"
                       },
                       "text": {
                           "primary": "#1e293b",
                           "secondary": "#64748b"
                       },
                       "border": {
                           "dark": "#e2e8f0",
                           "light": "#f1f5f9"
                       },
                       "responses": {
                           "success": {
                               "color": "#10b981",
                               "backgroundColor": "#ecfdf5",
                               "tabTextColor": "#065f46"
                           },
                           "error": {
                               "color": "#ef4444",
                               "backgroundColor": "#fef2f2",
                               "tabTextColor": "#991b1b"
                           },
                           "redirect": {
                               "color": "#f59e0b",
                               "backgroundColor": "#fffbeb",
                               "tabTextColor": "#92400e"
                           },
                           "info": {
                               "color": "#3b82f6",
                               "backgroundColor": "#eff6ff",
                               "tabTextColor": "#1d4ed8"
                           }
                       }
                   },
                   "typography": {
                       "fontSize": "16px",
                       "lineHeight": "1.6",
                       "fontFamily": "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
                       "headings": {
                           "fontFamily": "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
                           "fontWeight": "600"
                       },
                       "code": {
                           "fontSize": "14px",
                           "fontFamily": "\"Monaco\", \"Menlo\", \"Ubuntu Mono\", monospace",
                           "color": "#1e293b",
                           "backgroundColor": "#f8fafc",
                           "wrap": true
                       }
                   },
                   "sidebar": {
                       "backgroundColor": "#f8fafc",
                       "textColor": "#1e293b",
                       "activeTextColor": "#3b82f6",
                       "groupItems": {
                           "textTransform": "none"
                       },
                       "level1Items": {
                           "textTransform": "none"
                       }
                   },
                   "rightPanel": {
                       "backgroundColor": "#0f172a",
                       "textColor": "#e2e8f0"
                   },
                   "codeBlock": {
                       "backgroundColor": "#1e293b"
                   }
               }'
               options='{
                   "nativeScrollbars": true,
                   "scrollYOffset": 0,
                   "hideDownloadButton": false,
                   "disableSearch": false,
                   "pathInMiddlePanel": true,
                   "menuToggle": true,
                   "sortPropsAlphabetically": true,
                   "expandResponses": "200,201",
                   "showExtensions": true,
                   "hideHostname": true,
                   "hideLoading": true,
                   "noAutoAuth": false,
                   "expandSingleSchemaField": true,
                   "jsonSampleExpandLevel": 2,
                   "hideSingleRequestSampleTab": true,
                   "unstable_ignoreMimeTypeParameters": true
               }'>
        </redoc>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/redoc@2.1.4/bundles/redoc.standalone.js"></script>
    
    <script>
        // Smooth scrolling for anchor links
        document.addEventListener('DOMContentLoaded', function() {
            const links = document.querySelectorAll('a[href^="#"]');
            links.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        });
    </script>
</body>
</html>`