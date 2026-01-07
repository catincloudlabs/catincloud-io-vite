# catincloud.io

A React-based data visualization dashboard and single-page application (SPA). This repository contains the frontend source code and static asset configuration for [catincloud.io](https://catincloud.io).

## 🚀 Development

### Prerequisites

* Node.js (v18+)
* npm

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
# Proxies /data requests to S3 (see vite.config.js)
npm run dev
```
Build for Production
```bash
# Generates the /dist folder for deployment
npm run build
```

☁️ Architecture Documentation

Status: Migrated from AWS (S3/CloudFront) to Cloudflare Pages

Stack: React (Vite) Single Page Application

Last Updated: January 5, 2026
1. High-Level Overview

The site is a static React application hosted on Cloudflare Pages. It relies on client-side fetching of JSON data files located in the /data directory. The architecture is "serverless" and leverages Cloudflare's Edge Network for global distribution, SSL, and caching logic.

    Hosting: Cloudflare Pages ("Direct Upload" Project)

    DNS: Cloudflare DNS (Proxied / Orange Cloud)

    SSL/TLS: Cloudflare Universal (TLS 1.2 Minimum, TLS 1.3 Enabled)

    Data Source: Static JSON Files (Hosted in public/data, fetched by React)

    Analytics: Cloudflare Web Analytics (Privacy-first, no cookies)

2. DNS & Domain Configuration

Records

    CNAME @ (Root): Points to [project-name].pages.dev (✅ Proxied) - Serves the main site.

    CNAME www: Points to [project-name].pages.dev (✅ Proxied) - Redirects to root (auto-handled).

Critical Verification

    HSTS (Strict Transport Security): DISABLED (To prevent accidental lockout on Free Tier).

    Always Use HTTPS: ENABLED (Forces insecure HTTP requests to HTTPS).

3. Cloudflare Configuration
⚡ Performance Settings (Speed)

    Rocket Loader: 🔴 OFF (Critical: Prevents conflict with Vite/React hydration).

    Auto Minify: 🔴 OFF (Handled by npm run build).

    HTTP/3 (QUIC): 🟢 ON.

    0-RTT Connection Resumption: 🟢 ON.

    Early Hints: 🟢 ON.

    Speed Brain: 🟢 ON.

    Cloudflare Fonts: 🟢 ON.

🔒 Security Settings

    Minimum TLS Version: 1.2

    TLS 1.3: Enabled

    Automatic HTTPS Rewrites: Enabled

    Email Address Obfuscation: Enabled

    Hotlink Protection: Enabled

    Bot Fight Mode: Enabled

💾 Caching Strategy

    Browser Cache TTL: "Respect Existing Headers"

        Why: Allows the _headers file to strictly control the caching of data vs. code.

    Always Online™: Enabled (Internet Archive fallback).

    Crawler Hints: Enabled.

4. Special Configuration Files

These files reside in the public/ folder and are deployed to the root of the site.
A. _redirects (SPA Routing)

Handles the Single Page App "fallback" so refreshing pages like /dashboard works without 404s.
```plaintext
# 1. Canonicalize
/index.html   /   301

# 2. SPA Fallback (Critical for React)
/* /index.html   200
```
B. _headers (Security & Caching Rules)

Controls browser behavior and ensures data freshness.

```plaintext
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' [https://static.cloudflareinsights.com](https://static.cloudflareinsights.com); connect-src 'self' [https://cloudflareinsights.com](https://cloudflareinsights.com) https://*.cloudflareinsights.com; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests
  Vary: Accept-Encoding
  Cache-Control: no-cache

# STANDARD FILES (1 Day Cache)
/robots.txt
  Cache-Control: public, max-age=86400
/sitemap.xml
  Cache-Control: public, max-age=86400
/.well-known/security.txt
  Cache-Control: public, max-age=86400

# DASHBOARD DATA (0 Seconds - Always Fresh)
# Forces browser to revalidate data files on every load
/data/*.json
  Cache-Control: no-cache, must-revalidate

# VITE ASSETS (1 Year Cache - Immutable)
# Safe because Vite generates unique filenames (index-Ab12.js)
/assets/*.js
  Cache-Control: public, max-age=31536000, immutable
  Content-Type: application/javascript; charset=utf-8
/assets/*.css
  Cache-Control: public, max-age=31536000, immutable
  Content-Type: text/css; charset=utf-8
/assets/*.svg
  Cache-Control: public, max-age=31536000, immutable
  Content-Type: image/svg+xml; charset=utf-8
/assets/*.png
  Cache-Control: public, max-age=31536000, immutable
  Content-Type: image/png
/assets/*.jpg
  Cache-Control: public, max-age=31536000, immutable
  Content-Type: image/jpeg
/assets/*.woff2
  Cache-Control: public, max-age=31536000, immutable
  Content-Type: font/woff2
```

5. Deployment Workflow

Current Method: Manual Direct Upload

Local Build: Run npm run build to create the dist folder (containing index.html, assets/, and data/).

Upload: Go to Cloudflare Dashboard > Pages > [Project] and drag & drop the dist folder.

Cache Purge (Optional): If _headers or critical data changed, go to Caching > Configuration > Purge Everything.




