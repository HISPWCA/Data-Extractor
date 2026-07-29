# Changelog

## [1.0.7] - 2026-07-28

### Added
- **Internationalisation (i18n)** : Support EN/FR complet avec sélecteur de langue dans la barre latérale
- **Dark Mode** : Mode sombre avec bascule et persistance dans localStorage
- **Drag & Drop** : Réordonnancement des mappings par glisser-déposer dans le tableau
- **Éditeur de contenu** : Réorganisation des lignes (monter/descendre) dans les onglets Mappings et Options
- **Validation** : Détection des cellules vides avant sauvegarde du contenu avec option "Save Anyway"
- **Notifications Undo** : Fenêtre d'annulation de 8 secondes après suppression d'un mapping
- **CHANGELOG** : Fichier CHANGELOG.md avec historique des versions
- **Animations** : Fade-in, slide-up, scale-in sur les composants de l'interface
- **Traçabilité** : Colonnes Uploaded By, Upload Date, Updated By, Last Update dans le tableau des mappings

### Changed
- **Tableau des mappings** : Passage à un tableau HTML personnalisé avec meilleur rendu
- **Page About** : Design amélioré avec cartes de fonctionnalités, badges tech stack et notes de version
- **Icônes** : Icônes plus distinctives dans la colonne Actions (FaTable, FaPen, FaFileExport, FaTrashAlt)

### Fixed
- Bug de suppression : le modal de confirmation ne s'ouvre plus que pour le mapping ciblé

## [1.0.5] - 2026-07-05

### Added
- Global API fields configuration for tracked entities and events (stored in DataStore)
- New "API Fields" tab in Settings to customize DHIS2 API field parameters
- Tracker export now uses configurable API fields
- Export existing mappings to Excel from the Mappings Management screen
- Shared Excel utilities for mapping import and export

## [1.0.4] - 2024-10-21

### Changed
- Updated d2.config.js with minimum DHIS2 version requirement

## [1.0.3] - 2024-10-16

### Changed
- Embedded babel-polyfill, ExcelJS, and FileSaver locally instead of CDN

## [1.0.2] - 2024-10-01

### Added
- Tailwind CSS installed and configured locally
- App renamed to Data Extractor
- Dynamic version display on the About page
