# SimpLib

A modern, lightweight, and offline-first personal book library web application built with Vue 3, TypeScript, Pinia, and Vite. SimpLib allows you to manage your reading collection, look up book metadata via ISBN, scan barcodes using your camera, and securely export/import your data—all directly in your browser.

---

## Features

- **Book Management:** Track reading statuses (*Read*, *Unread*, *Wishlist*), favorite items, categories, prices, and release dates.
- **ISBN Lookup:** Automatically fetch titles, authors, and cover images from **Open Library** and **Google Books**.
- **Barcode Scanner:** Scan ISBN-13 barcodes using your device's live camera stream or by uploading a photo.
- **Offline-First:** Works completely offline once loaded, with local persistence powered by **IndexedDB** (`idb`).
- **Data Backup & Restore:** Export your entire library as a JSON backup file or import existing backups with flexible **Merge** or **Replace** modes.
- **Localization:** Full multi-language support for **English** and **German** via `vue-i18n`.
- **Responsive Design:** Clean, accessible user interface optimized for both desktop and mobile devices.

---

## Tech Stack

- **Framework:** [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **State Management:** [Pinia](https://pinia.vuejs.org/)
- **Routing:** [Vue Router](https://router.vuejs.org/)
- **Internationalization:** [Vue I18n](https://vue-i18n.intlify.dev/)
- **Database:** IndexedDB (via `idb`)
- **Barcode Detection:** `barcode-detector` / `zxing-wasm`
- **Build Tool:** [Vite](https://vitejs.dev/)

---

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your system.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PatLiCoding/simplib.git
   cd simplib
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## Building for Production

To build the application for production, run:

```bash
npm run build
```

The output files will be generated in the `dist/` directory, ready to be deployed to any static hosting service (e.g., GitHub Pages, Netlify, Vercel). Note that live camera barcode scanning requires a secure **HTTPS** connection in production.

---

## Privacy & Data Storage

- **No Accounts:** SimpLib does not require user accounts or registration.
- **Local Storage:** All book records and cover images are stored locally in your browser using IndexedDB. 
- **API Requests:** Network requests are only made when performing active ISBN lookups (sent to Open Library and Google Books). Camera images are processed entirely on-device and are never uploaded.

---

## Author

Developed by Patricia Linne
