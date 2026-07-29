export const RELEASE_NOTES = [
  {
    version: '1.0.8',
    date: '2026-07-28',
    items: [
      'Removed dark mode to simplify the UI and reduce code complexity.',
      'Removed internationalisation (i18n) — English only, no language selector.',
      'Mapping clone: duplicate any existing mapping with one click (purple copy icon).',
      'Performance: memoized EditableTable with React.memo and useCallback handlers.',
      'Performance: useMemo for filtered mappings, pagination, and derived state.',
      'Performance: readAsArrayBuffer for faster XLSX parsing during import.',
      'Export formats: improved labels and added descriptions for each file format in the dropdown.',
      'Streamlined sidebar: removed dark mode toggle and language selector for a cleaner UI.',
      'Cleaned up App.css: removed all dark mode CSS overrides for third-party libraries.',
    ],
  },
  {
    version: '1.0.7',
    date: '2026-07-28',
    items: [
      'Internationalisation (i18n) complete with EN/FR support and language selector.',
      'Dark Mode toggle in the sidebar.',
      'Drag & drop to reorder mappings in the table.',
      'Content editor with row reordering (move up/down).',
      'Empty cell validation before saving content.',
      'Undo notifications after deletion (8-second window).',
      'Animations: fade-in, slide-up, scale-in on components.',
      'CHANGELOG.md and dynamic release notes in the About page.',
      'Full traceability: creator, upload date, last editor, last update date.',
    ],
  },
  {
    version: '1.0.5',
    date: '2026-07-05',
    items: [
      'Global API fields configuration for tracked entities and events (stored in DataStore).',
      'New "API Fields" tab in Settings to customize DHIS2 API field parameters.',
      'Tracker export now uses configurable API fields.',
      'Export existing mappings to Excel from the Mappings Management screen.',
      'Shared Excel utilities for mapping import and export.',
    ],
  },
  {
    version: '1.0.4',
    date: '2024-10-21',
    items: [
      'Updated d2.config.js with minimum DHIS2 version requirement.',
    ],
  },
  {
    version: '1.0.3',
    date: '2024-10-16',
    items: [
      'Embedded babel-polyfill, ExcelJS, and FileSaver locally instead of CDN.',
    ],
  },
  {
    version: '1.0.2',
    date: '2024-10-01',
    items: [
      'Tailwind CSS installed and configured locally.',
      'App renamed to Data Extractor.',
      'Dynamic version display on the About page.',
    ],
  },
]
