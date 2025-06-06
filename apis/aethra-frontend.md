# Aethra Frontend Documentation

## Overview
- **Name**: Aethra Frontend (formerly Epsilon)
- **Type**: Next.js Application
- **Technology**: Next.js, React, TypeScript
- **Port**: 3000
- **URL**: https://aethra.dev
- **Service**: aethra-frontend.service

## Configuration
- **Source Directory**: `/home/sellinios/development/projects/intranet/epsilon/`
- **Config Files**: 
  - `next.config.ts`
  - `package.json`
  - `.env` (if exists)

## Pages/Routes
Based on the directory structure:
- `/` - Homepage
- `/about-us` - About Us page
- `/services` - Services overview
  - `/services/crew-management`
  - `/services/crew-manning`
  - `/services/pre-vetting-inspections`
  - `/services/technical-services`
  - `/services/training`
- `/locations` - Office locations
  - `/locations/greece`
  - `/locations/cyprus`
  - `/locations/georgia`
  - `/locations/indonesia`
  - `/locations/romania`
  - `/locations/russia`
  - `/locations/the-philippines`
  - `/locations/turkey`
  - `/locations/ukraine`
  - `/locations/vietnam`
- `/careers-at-sea` - Career opportunities
- `/contact` - Contact page
- `/facts` - Company facts
- `/news` - News and articles

## API Integration
- Integrates with Intranet API for:
  - Career applications submission
  - News/articles display
  - Contact form submissions

## Service Management

### Start/Stop Service
```bash
sudo systemctl start aethra-frontend
sudo systemctl stop aethra-frontend
sudo systemctl restart aethra-frontend
sudo systemctl status aethra-frontend
```

### Development Mode
```bash
cd /home/sellinios/development/projects/intranet/epsilon
npm run dev
```

### Build and Deploy
```bash
cd /home/sellinios/development/projects/intranet/epsilon
npm run build
npm start
```

### View Logs
```bash
sudo journalctl -u aethra-frontend -f
```

## Technology Stack
- **Framework**: Next.js 14+
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Next.js built-in

## Assets
- Company logos and images in `/public/`
- Partner logos in `/public/partners/`
- Service images in `/public/services/`

## Recent Updates
- June 6, 2025: Renamed from Epsilon to Aethra
- Migrated domain from site.epsilonhellas.com to aethra.dev

## Related Services
- Works in conjunction with Intranet API
- Shares authentication with Intranet system
- Submits career applications to Intranet database

## Notes
- Main company website
- Public-facing frontend
- SEO optimized with Next.js
- Mobile responsive design