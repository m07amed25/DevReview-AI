const languages = [
  { name: "JavaScript", color: "yellow" },
  { name: "TypeScript", color: "blue" },
  { name: "Python", color: "green" },
  { name: "Go", color: "cyan" },
  { name: "Rust", color: "orange" },
  { name: "Java", color: "red" },
  { name: "C++", color: "blue" },
  { name: "Ruby", color: "red" },
  { name: "PHP", color: "purple" },
  { name: "Swift", color: "orange" },
  { name: "Kotlin", color: "purple" },
  { name: "Scala", color: "red" },
];

export function LanguagesSection() {
  return (
    <section
      className="border-b border-border/40"
      aria-labelledby="languages-heading"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="text-center mb-12 sm:mb-14">
          <h2
            id="languages-heading"
            className="text-2xl sm:text-3xl font-semibold tracking-tight"
          >
            Supports 50+ languages
          </h2>
          <p className="mt-2 text-muted-foreground">
            From JavaScript to Rust, we&apos;ve got you covered.
          </p>
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
          role="list"
          aria-label="Supported programming languages"
        >
          {languages.map((lang) => (
            <span
              key={lang.name}
              className="lang-badge px-4 py-2 rounded-full bg-muted/50 border border-border/60 text-sm font-medium transition-all duration-200 hover:scale-105 hover:bg-muted/80 hover:border-primary/30 cursor-default hover:shadow-lg hover:shadow-primary/10"
              role="listitem"
            >
              {lang.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
