# Kairos Weather Frontend

Modern weather dashboard for Greece using the Kairos Weather API.

## Features

- Live weather data for Greek cities
- City search with autocomplete
- 24-hour and 5-day forecasts
- Responsive design for mobile and desktop
- Quick access to major Greek cities

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Deployment

The `dist` folder can be deployed to:
- Vercel
- Netlify
- CloudFlare Pages
- Any static hosting service

## Technology Stack

- Vite (build tool)
- Vanilla JavaScript (no framework)
- Axios (HTTP client)
- CSS3 with CSS Variables
- Responsive design