import React from 'react'
import {
  FaTools, FaExternalLinkAlt, FaCodeBranch, FaCalendarAlt,
  FaExchangeAlt, FaCloud, FaFilter, FaFileImport,
  FaDownload, FaTrashAlt, FaDatabase, FaHistory,
  FaLayerGroup,
} from 'react-icons/fa'
import { RELEASE_NOTES } from '../utils/releaseNotes'

const CHANGELOG_URL = 'https://github.com/hispwca/data-extractor/blob/main/CHANGELOG.md'

const COLOR_MAP = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', cardBg: 'bg-blue-50/50', title: 'text-blue-800', desc: 'text-blue-600/80' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200', cardBg: 'bg-indigo-50/50', title: 'text-indigo-800', desc: 'text-indigo-600/80' },
  green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200', cardBg: 'bg-green-50/50', title: 'text-green-800', desc: 'text-green-600/80' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200', cardBg: 'bg-emerald-50/50', title: 'text-emerald-800', desc: 'text-emerald-600/80' },
  red: { bg: 'bg-red-100', text: 'text-red-500', border: 'border-red-200', cardBg: 'bg-red-50/50', title: 'text-red-800', desc: 'text-red-500/80' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200', cardBg: 'bg-purple-50/50', title: 'text-purple-800', desc: 'text-purple-600/80' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200', cardBg: 'bg-amber-50/50', title: 'text-amber-800', desc: 'text-amber-600/80' },
}

const About = () => {
  const FEATURES = [
    { icon: FaExchangeAlt, color: 'blue', title: 'Tracker Export', desc: 'Export tracked entities with mappings, options, formulas, and date filters.' },
    { icon: FaCloud, color: 'indigo', title: 'DataStore Integration', desc: 'All mappings, API fields, and settings stored in DHIS2 DataStore.' },
    { icon: FaFilter, color: 'green', title: 'API Fields Config', desc: 'Customize DHIS2 API fields for tracked entities and events.' },
    { icon: FaFileImport, color: 'emerald', title: 'Excel Import', desc: 'Import mappings from Excel with preview, validation, and confirmation.' },
    { icon: FaDownload, color: 'blue', title: 'Mapping Export', desc: 'Export mappings back to Excel for backup, sharing, or editing.' },
    { icon: FaTrashAlt, color: 'red', title: 'Safe Deletion', desc: 'Delete with text confirmation and 8-second undo window.' },
    { icon: FaDatabase, color: 'purple', title: 'Org Unit Filter', desc: 'Filter exports by organisation units with interactive tree selector.' },
    { icon: FaHistory, color: 'amber', title: 'Date Range Filter', desc: 'Filter events and entities by date ranges.' },
  ]
  const TECH_STACK = [
    { name: 'React', icon: FaTools },
    { name: 'DHIS2 Runtime', icon: FaCloud },
    { name: 'Tailwind CSS', icon: FaTools },
    { name: 'ExcelJS', icon: FaFileImport },
    { name: 'XLSX', icon: FaFileImport },
    { name: 'date-fns', icon: FaCalendarAlt },
  ]
  return (
  <main>
    {/* ═══════ HERO ═══════ */}
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 pb-14 pt-12">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-2xl px-4 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 transition-transform duration-500 hover:scale-110">
          <FaTools className="text-2xl text-blue-300" />
        </div>
        <h1 className="bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
          Data Extractor
        </h1>
        <p className="mt-2 text-sm text-blue-200/60">Version {process.env.REACT_APP_VERSION}</p>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gray-300">
          A powerful DHIS2 application for extracting, mapping, and exporting tracked entity data with flexible configuration options.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs text-gray-300 backdrop-blur-sm ring-1 ring-white/10">
            <FaExternalLinkAlt className="text-[10px]" /> By{' '}
            <a target="_blank" rel="noopener noreferrer" href="https://hispwca.org/hispwca" className="font-medium text-blue-300 transition-colors hover:text-blue-200">
              Hisp WCA
            </a>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs text-gray-300 backdrop-blur-sm ring-1 ring-white/10">
            <FaLayerGroup className="text-[10px]" /> DHIS2 App
          </span>
        </div>
      </div>
    </div>

    {/* ═══════ FEATURES ═══════ */}
    <div className="mx-auto max-w-5xl px-4 py-10 animate-fade-in">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Features</h2>
        <p className="mt-1 text-sm text-gray-400">Everything you need to manage and export DHIS2 data</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, color, title, desc }) => {
          const c = COLOR_MAP[color]
          return (
            <div key={title} className={`group rounded-xl border ${c.border} ${c.cardBg} p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}>
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${c.bg} ${c.text} transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="text-sm" />
              </div>
              <h4 className={`mb-1 text-sm font-semibold ${c.title}`}>{title}</h4>
              <p className={`text-xs leading-relaxed ${c.desc}`}>{desc}</p>
            </div>
          )
        })}
      </div>
    </div>

    {/* ═══════ TECH STACK ═══════ */}
    <div className="border-y border-gray-100 bg-gray-50/50 animate-fade-in">
      <div className="mx-auto max-w-3xl px-4 py-8 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Built With</span>
        <div className="mt-3 flex flex-wrap justify-center gap-2.5">
          {TECH_STACK.map(({ name, icon: Icon }) => (
            <span key={name} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow">
              <Icon className="text-[11px] text-gray-400" /> {name}
            </span>
          ))}
        </div>
      </div>
    </div>

    {/* ═══════ RELEASE NOTES ═══════ */}
    <div className="mx-auto max-w-2xl px-4 py-10 animate-fade-in">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Release Notes</h2>
        <p className="mt-1 text-sm text-gray-400">Track changes and updates across versions</p>
      </div>
      <div className="space-y-4">
        {RELEASE_NOTES.map(({ version, date, items }, i) => (
          <article key={version} className={`animate-fade-in rounded-xl border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${i === 0 ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'}`} style={{ animationDelay: `${i * 100}ms` }}>
            <header className="mb-3 flex flex-wrap items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${i === 0 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <FaCodeBranch className="text-sm" />
              </div>
              <div>
                <span className={`font-semibold ${i === 0 ? 'text-blue-700' : 'text-gray-800'}`}>v{version}</span>
                {i === 0 && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">Latest</span>}
              </div>
              <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                <FaCalendarAlt className="text-[10px]" /> {date}
              </span>
            </header>
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${i === 0 ? 'bg-blue-400' : 'bg-gray-300'}`} />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="mt-8 text-center text-[11px] text-gray-400">
        <FaCodeBranch className="mr-1 inline-block" /> Data Extractor &copy; {new Date().getFullYear()} Hisp WCA
      </div>
    </div>

    {/* ═══════ CHANGELOG ═══════ */}
    <div className="mx-auto max-w-2xl px-4 pb-10 animate-fade-in">
      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <FaCodeBranch className="text-sm" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">CHANGELOG</h3>
            <p className="text-xs text-gray-400">Full version history on GitHub</p>
          </div>
          <a href={CHANGELOG_URL} target="_blank" rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:text-indigo-600 hover:shadow">
            <FaExternalLinkAlt className="text-[10px]" /> View on GitHub
          </a>
        </div>
      </div>
    </div>
  </main>
  )
}

export default About
