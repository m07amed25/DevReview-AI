const languages = [
  { name: "JavaScript", color: "text-yellow-400" },
  { name: "TypeScript", color: "text-blue-400" },
  { name: "Python", color: "text-green-400" },
  { name: "Go", color: "text-cyan-400" },
  { name: "Rust", color: "text-orange-400" },
  { name: "Java", color: "text-red-400" },
  { name: "C++", color: "text-blue-500" },
  { name: "Ruby", color: "text-red-500" },
  { name: "PHP", color: "text-purple-400" },
  { name: "Swift", color: "text-orange-500" },
  { name: "Kotlin", color: "text-purple-500" },
  { name: "Scala", color: "text-red-400" },
];

export function LanguagesSection() {
  return (
    <section
      className="relative border-t border-white/5 bg-zinc-950 overflow-hidden"
      aria-labelledby="languages-heading"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center mb-16 sm:mb-20">
          <h2
            id="languages-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-100"
          >
            Supports 50+ languages
          </h2>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            From modern web frameworks to low-level systems programming, our AI
            understands your tech stack.
          </p>
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-3xl mx-auto"
          role="list"
          aria-label="Supported programming languages"
        >
          {languages.map((lang) => (
            <span
              key={lang.name}
              className={`lang-badge px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 text-sm font-medium transition-all duration-300 hover:scale-105 hover:bg-white/[0.08] hover:border-white/20 cursor-default shadow-lg shadow-black/20 ${lang.color}`}
              role="listitem"
            >
              {lang.name}
            </span>
          ))}
          <span className="lang-badge px-5 py-2.5 rounded-full bg-transparent border border-dashed border-white/20 text-zinc-500 text-sm font-medium">
            + 40 more
          </span>
        </div>
      </div>

      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
    </section>
  );
}
