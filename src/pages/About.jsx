import React from 'react'
import { FaTools, FaExternalLinkAlt, FaCodeBranch, FaCalendarAlt } from 'react-icons/fa'
import { RELEASE_NOTES } from '../utils/releaseNotes'

const About = () => {
  return (
    <main>
      {/* ═══════════ HERO ═══════════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 pb-12 pt-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-xl px-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <FaTools className="text-xl text-blue-300" />
          </div>
          <h1 className="bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
            Data Extractor
          </h1>
          <p className="mt-1 text-sm text-blue-200/70">
            Version {process.env.REACT_APP_VERSION}
          </p>
          <p className="mx-auto mt-3 max-w-lg text-xs leading-relaxed text-gray-300">
            A DHIS2 application for extracting, mapping, and exporting tracked entity data.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300 backdrop-blur-sm">
            <FaExternalLinkAlt className="text-[10px]" />
            <span>By</span>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://hispwca.org/hispwca"
              className="font-medium text-blue-300 transition-colors hover:text-blue-200"
            >
              Hisp WCA
            </a>
          </div>
        </div>
      </div>

      {/* ═══════════ FEATURES ═══════════ */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            <h4 className="mb-1 text-sm font-semibold text-blue-800">Tracker Export</h4>
            <p className="text-xs text-blue-600/80">
              Export tracked entities with mappings, options, formulas, and date filters.
            </p>
          </div>
          <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4">
            <h4 className="mb-1 text-sm font-semibold text-purple-800">Mapping Manager</h4>
            <p className="text-xs text-purple-600/80">
              Import, export, and manage Excel-based mappings with confirmation and undo.
            </p>
          </div>
          <div className="rounded-lg border border-green-100 bg-green-50/50 p-4">
            <h4 className="mb-1 text-sm font-semibold text-green-800">API Fields Config</h4>
            <p className="text-xs text-green-600/80">
              Customize DHIS2 API fields for tracked entities and events in Settings.
            </p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4">
            <h4 className="mb-1 text-sm font-semibold text-amber-800">Org Unit Filter</h4>
            <p className="text-xs text-amber-600/80">
              Filter exports by organisation units with an interactive tree selector.
            </p>
          </div>
        </div>

        {/* ═══════════ TECH STACK ═══════════ */}
        <div className="mb-8 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Tech Stack</span>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {['React', 'DHIS2 App Runtime', 'Tailwind CSS', 'ExcelJS', 'XLSX', 'date-fns'].map((tech) => (
              <span key={tech} className="rounded-md bg-gray-100 px-2.5 py-1 text-[11px] text-gray-500 shadow-sm">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* ═══════════ RELEASE NOTES ═══════════ */}
        <section>
          <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">Release Notes</h3>
          <div className="space-y-4">
            {RELEASE_NOTES.map(({ version, date, items }) => (
              <article key={version} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
                <header className="mb-2 flex flex-wrap items-center gap-2">
                  <FaCodeBranch className="text-xs text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-800">v{version}</h4>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <FaCalendarAlt className="text-[10px]" />
                    {date}
                  </span>
                </header>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-6 text-center text-[10px] text-gray-400">
          <FaCodeBranch className="mr-1 inline-block" />
          Data Extractor &copy; {new Date().getFullYear()} Hisp WCA
        </div>
      </div>
    </main>
  )
}

export default About
