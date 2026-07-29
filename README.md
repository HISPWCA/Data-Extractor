# Data Extractor

> A powerful DHIS2 application for extracting, mapping, and exporting tracked entity data.

## Features

### 📊 Data Export
- Export tracked entities with configurable mappings, options, formulas, and date filters
- Multiple export formats: **CSV**, **Excel (.xls)**, **Excel (.xlsx)**, **Empres-i Specific**
- Organisation unit tree selector with level-based filtering
- Date range picker for filtered exports
- Attribute-based filtering

### 📋 Mappings Management
- **Import** Excel files with dedicated Mapping and Options sheets
- **Preview** before import: review name, program, row counts
- **Edit** mapping metadata (name, program) and **content** (Excel-like inline editor)
- **Export** mappings back to Excel for backup or sharing
- **Drag & drop** to reorder mappings in the table
- **Search** mappings by name or program in real-time
- **Pagination** with first/prev/next/last navigation (10 items per page)
- **Undo** deletion with 8-second notification window
- **Validation** of empty cells before saving content

### 🌍 Internationalization (i18n)
- **5 languages supported**:
  - 🇬🇧 **English** (default)
  - 🇫🇷 **Français**
  - 🇪🇸 **Español**
  - 🇧🇷 **Português**
  - 🇩🇪 **Deutsch**
- Language selector dropdown in sidebar toolbar
- Auto-detection of browser language on first visit

### 🌗 Dark Mode
- Toggle light/dark mode from the sidebar toolbar
- Persisted preference in localStorage
- Full support for all custom components and third-party libraries

### ⚙️ API Fields Configuration
- Customize DHIS2 API fields for tracked entities and events
- Reset to defaults with one click

### 📱 Mobile Support
- Responsive sidebar with hamburger menu on small screens (< 768px)
- Slide-out overlay sidebar with backdrop blur

## Tech Stack

| Technology | Purpose |
|---|---|
| **React** | UI Framework |
| **DHIS2 App Runtime** | DHIS2 integration |
| **Tailwind CSS** | Styling with dark mode |
| **ExcelJS / XLSX** | Excel file parsing and generation |
| **date-fns** | Date formatting |
| **@dhis2/d2-i18n** | Internationalization |
| **react-icons** | Icon library |

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Menu.jsx         # Sidebar navigation + toggles
│   ├── MenuItem.jsx     # Navigation menu item
│   └── OrganisationUnitsTree.jsx
├── hooks/               # Custom React hooks
├── locales/             # i18n translations
│   ├── en/              # English
│   ├── fr/              # Français
│   ├── es/              # Español
│   ├── pt/              # Português
│   └── de/              # Deutsch
├── pages/               # Route pages
│   ├── DataExport.jsx   # Main export page
│   ├── Settings.jsx     # Settings with tabs
│   ├── About.jsx        # About + release notes + changelog
│   ├── Error.jsx        # 404 page
│   └── settings/        # Sub-pages
│       ├── MappingUpload.jsx  # Mappings management
│       └── ApiFieldsConfig.jsx
├── utils/               # Utilities and helpers
│   ├── SidebarContext.jsx
│   ├── DarkModeContext.jsx
│   ├── LanguageContext.jsx
│   └── app.constants.js
└── App.js               # Root app component
```

## Available Scripts

### `yarn start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### `yarn test`

Launches the test runner and runs all tests in `/src`.

### `yarn build`

Builds the app for production to the `build` folder. A deployable `.zip` file is in `build/bundle`.

### `yarn deploy`

Deploys the built app to a running DHIS2 instance (requires App Management authority).

## Version

Current version: **1.0.7** — See [CHANGELOG.md](./CHANGELOG.md) for full history.

Built by [Hisp WCA](https://hispwca.org/hispwca)
