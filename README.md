# SimpLib

**Your personal book library: simple, private and offline-ready.**

SimpLib is a Progressive Web App (PWA) for managing your own book collection. Add books by typing or scanning the ISBN, keep a wishlist with prices and release dates, mark favorites and back up your library as a JSON file. There is no account and no server: all data stays on your device.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Backup Format](#backup-format)
- [Privacy](#privacy)
- [Browser Support](#browser-support)
- [Code Conventions](#code-conventions)

## Features

### Library management

- Add, edit and delete books (title, author, category, ISBN, status, cover)
- Reading status: **Read**, **Unread** or **Wish**
- Wishlist entries can have a **price** and a **release date**; a wish counts as *Available* once its release date is reached (or if it has none)
- Mark books as **favorites**
- Free-text categories with suggestions (16 predefined categories, translated in German and English)
- Confirmation dialog before deleting a book

### Finding books

- Search by title, author or ISBN
- Filter by status, favorites, available wishes and category
- Big and small card view with "Show more" pagination (24 / 60 books per page)
- Start page with overview tiles (wishlist, available, read, unread, favorites) that open the list with the matching filter

### ISBN lookup and scanner

- Automatic lookup of title, author and cover via **Open Library** and **Google Books** (second source as fallback)
- Barcode scanner with the live camera (continuous autofocus) or by taking a photo, powered by ZXing (WASM) and the Barcode Detector API
- Photo decoding uses multiple threshold binarizations for better recognition
- Only ISBN-13 barcodes (978/979) can be scanned; ISBN-10 can be typed in manually
- Local validation of ISBN length and characters

### Covers

- Upload your own cover photo (scaled down and re-encoded as JPEG)
- Found covers are downloaded and stored locally, so they also show offline
- Older remote cover links are migrated to local storage in the background (at most once per day, when online)

### Data and settings

- Export your library (including covers) as a JSON backup
- Import a backup and choose between **Add to library** (merge) and **Replace library**
- Delete all data from the device
- Language switch between **German** and **English** (auto-detected on first start)
- Built-in help page and version/build date display
- Example books on first start (only once)

### PWA and offline

- Installable on desktop and mobile
- Works fully offline once loaded (only the ISBN lookup needs a connection)
- Service worker caches all assets, including the scanner WASM and the Rubik font
- Automatic updates

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Build tool | [Vite](https://vite.dev/) |
| State management | [Pinia](https://pinia.vuejs.org/) |
| Routing | [Vue Router](https://router.vuejs.org/) |
| Internationalization | [Vue I18n](https://vue-i18n.intlify.dev/) |
| Storage | IndexedDB via [idb](https://github.com/jakearchibald/idb) |
| Barcode scanning | [barcode-detector](https://github.com/Sec-ant/barcode-detector) ponyfill + [zxing-wasm](https://github.com/Sec-ant/zxing-wasm) |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox) |
| Book data | [Open Library](https://openlibrary.org/developers/api) and [Google Books API](https://developers.google.com/books) |
| Formatting | [Prettier](https://prettier.io/) |

## Getting Started

### Prerequisites

- Node.js `^22.18.0` or `>=24.12.0`
- npm

### Installation

```sh
git clone https://github.com/PatLiCoding/simplib.git
cd simplib
npm install
```

### Run in development

```sh
npm run dev
```

### Build for production

```sh
npm run build
npm run preview
```

The build runs the type check (`vue-tsc`) and creates a static bundle in `dist/`. It can be hosted on any static web server.

> **Note:** The live camera scanner requires a secure context (HTTPS or `localhost`). On insecure connections, the "Take photo" option still works.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run build-only` | Build without the type check |
| `npm run preview` | Preview the production build locally |
| `npm run type-check` | Run `vue-tsc` |
| `npm run format` | Format `src/` with Prettier |

## Project Structure

```text
src
├── assets
│   ├── data          # example books (example.json)
│   ├── fonts         # Rubik variable font
│   ├── icon          # scanner and photo icons
│   ├── img           # logo, default book cover
│   └── main.css      # global styles and shared button/chip/dialog styles
├── components
│   ├── dialogs       # BookDialog, SettingsDialog, ImportDialog, ConfirmDialog,
│   │                 # IsbnField, IsbnScanner, CoverPicker
│   ├── booklist      # BookCard, FilterPanel, SearchBar
│   └── Header.vue
├── composables       # useBookDialog, useIsbnLookup, useLibraryTransfer, useSettingsDialog
├── db                # IndexedDB access (booksDb.ts)
├── i18n              # Vue I18n setup and locales (de, en)
├── router            # routes: home, booklist, help
├── services          # remote ISBN lookup (Open Library, Google Books)
├── stores            # Pinia store for the book collection
├── types             # shared TypeScript types
├── utils             # backup, barcode, camera, category, cover, image, isbn,
│                     # price, seed, status, version helpers
├── views             # HomeView, BooklistView, HelpView
├── App.vue
├── globals.d.ts      # build-time constants (__APP_VERSION__, __BUILD_DATE__)
└── main.ts
```

## How It Works

- **Storage:** Books are stored in an IndexedDB database named `simplib` (object store `books`). Small flags (selected language, "examples already seeded", last cover migration) are kept in `localStorage`.
- **Book model:** Each book has an `id`, `createdAt`, `title`, `author`, `cover`, `isbn`, `category`, `price`, `releaseDate`, `status` and `favorite`.
- **ISBN lookup:** Sources are queried one after another until a book is found. The error message distinguishes between "not found", "one source unavailable" and "offline".
- **Scanner:** In live mode, a code must be read in two consecutive frames before it is accepted, which reduces false reads.
- **Categories:** Categories are stored as stable keys (for example `thrillerCrime`) and displayed in the active language. Custom categories are stored as typed.
- **Offline:** A service worker precaches the app shell, fonts and the scanner WASM file.

## Backup Format

Exports are JSON files named `simplib-backup-YYYY-MM-DD.json`:

```json
{
  "app": "simplib",
  "version": 1,
  "exportedAt": "2026-11-10T12:00:00.000Z",
  "books": [
    {
      "id": "…",
      "createdAt": 1762776000000,
      "title": "Example Book",
      "author": "Author",
      "cover": null,
      "isbn": "9783161484100",
      "category": "fantasy",
      "price": "9.99",
      "releaseDate": "2027-03-15",
      "status": "wish",
      "favorite": false
    }
  ]
}
```

On import, every field is validated and sanitized. Invalid entries and duplicate IDs are skipped, files larger than 25 MB or created by a newer backup version are rejected, and a failed import leaves your library unchanged.

## Privacy

- No account, no tracking, no server of its own
- Your library never leaves your device
- Only the ISBN you look up is sent to Open Library and Google Books
- Camera images are processed locally and never uploaded

Because everything is stored in your browser, clearing the site data deletes your library. Export a backup regularly.

## Browser Support

SimpLib targets current Chromium-based browsers, Firefox and Safari. The customizable select styling (`appearance: base-select`) is currently only rendered in Chromium-based browsers; other browsers fall back to the native select. Live camera scanning depends on `getUserMedia` support and a secure context.

## Code Conventions

- Prettier: no semicolons, single quotes, print width 100
- No file longer than 400 lines, no function longer than 14 lines; shared logic is moved into `utils`
- All user-facing texts live in the locale files (`de.json`, `en.json`)

## Author

Developed by Patricia Linne
