import React from "react";
import { RELEASE_NOTES } from "../utils/releaseNotes";

export default () => {
  return (
    <main>
      <div className="max-w-screen-xl mx-auto px-4 py-8 md:px-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-3 text-center">
          <h3 className="text-gray-800 text-4xl font-semibold sm:text-5xl">
            Data Extractor
          </h3>

          <p className="text-gray-600">Version {process.env.REACT_APP_VERSION}</p>

          <p className="text-gray-600">
            By{" "}
            <a
              target="_blank"
              href="https://hispwca.org/hispwca"
              className="text-indigo-600 duration-150 hover:text-indigo-400 font-medium inline-flex items-center gap-x-1"
            >
              Hisp WCA
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </p>
          </div>

          <section className="text-left">
            <h4 className="text-gray-800 text-xl font-semibold mb-4">Release notes</h4>
            <div className="space-y-6">
              {RELEASE_NOTES.map(({ version, date, items }) => (
                <article key={version} className="rounded-lg bg-white p-4 shadow-sm">
                  <header className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h5 className="text-gray-800 font-medium">Version {version}</h5>
                    <span className="text-sm text-gray-500">{date}</span>
                  </header>
                  <ul className="list-disc space-y-1 pl-5 text-gray-600">
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};
