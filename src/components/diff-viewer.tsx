"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  FilePlus,
  FileMinus,
  FileEdit,
  FileText,
  Copy,
  Check,
  FolderTree,
  AlertCircle,
  Search,
  X,
  Eye,
  EyeOff,
  AlignJustify,
  Columns3,
  WrapText,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DiffFile {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previousFilename?: string;
}

interface DiffViewerProps {
  files: DiffFile[];
}

type ViewMode = "unified" | "split";
type FileStatusFilter = "all" | "added" | "modified" | "removed" | "renamed";

interface DiffSegment {
  text: string;
  type: "common" | "added" | "removed";
}

function tokenize(str: string): string[] {
  return str.match(/[a-zA-Z0-9_$]+|[^\s]|\s+/g) || [];
}

function computeWordDiff(
  oldStr: string,
  newStr: string,
): { oldSegments: DiffSegment[]; newSegments: DiffSegment[] } {
  const oldTokens = tokenize(oldStr);
  const newTokens = tokenize(newStr);
  const m = oldTokens.length;
  const n = newTokens.length;

  // Bail out for very long lines to avoid O(m*n) overhead
  if (m * n > 50000) {
    return {
      oldSegments: [{ text: oldStr, type: "removed" }],
      newSegments: [{ text: newStr, type: "added" }],
    };
  }

  // LCS dynamic-programming table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldTokens[i - 1] === newTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff segments
  const oldResult: DiffSegment[] = [];
  const newResult: DiffSegment[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
      oldResult.unshift({ text: oldTokens[i - 1], type: "common" });
      newResult.unshift({ text: newTokens[j - 1], type: "common" });
      i--;
      j--;
    } else if (i > 0 && (j === 0 || dp[i - 1][j] >= dp[i][j - 1])) {
      oldResult.unshift({ text: oldTokens[i - 1], type: "removed" });
      i--;
    } else {
      newResult.unshift({ text: newTokens[j - 1], type: "added" });
      j--;
    }
  }

  return {
    oldSegments: mergeSegments(oldResult),
    newSegments: mergeSegments(newResult),
  };
}

function mergeSegments(segments: DiffSegment[]): DiffSegment[] {
  if (segments.length === 0) return segments;
  const merged: DiffSegment[] = [{ ...segments[0] }];
  for (let i = 1; i < segments.length; i++) {
    const last = merged[merged.length - 1];
    if (last.type === segments[i].type) {
      last.text += segments[i].text;
    } else {
      merged.push({ ...segments[i] });
    }
  }
  return merged;
}

// Color palette shortcuts for DRY language map
const LANG_BLUE = "bg-blue-500/15 text-blue-600 dark:text-blue-400";
const LANG_YELLOW = "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400";
const LANG_GREEN = "bg-green-500/15 text-green-600 dark:text-green-400";
const LANG_PURPLE = "bg-purple-500/15 text-purple-600 dark:text-purple-400";
const LANG_PINK = "bg-pink-500/15 text-pink-600 dark:text-pink-400";
const LANG_ORANGE = "bg-orange-500/15 text-orange-600 dark:text-orange-400";
const LANG_RED = "bg-red-500/15 text-red-600 dark:text-red-400";
const LANG_GRAY = "bg-gray-500/15 text-gray-600 dark:text-gray-400";
const LANG_CYAN = "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400";
const LANG_VIOLET = "bg-violet-500/15 text-violet-600 dark:text-violet-400";
const LANG_INDIGO = "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400";
const LANG_EMERALD = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
const LANG_AMBER = "bg-amber-500/15 text-amber-600 dark:text-amber-400";
const LANG_TEAL = "bg-teal-500/15 text-teal-600 dark:text-teal-400";
const LANG_ROSE = "bg-rose-500/15 text-rose-600 dark:text-rose-400";
const LANG_SKY = "bg-sky-500/15 text-sky-600 dark:text-sky-400";
const LANG_LIME = "bg-lime-500/15 text-lime-600 dark:text-lime-400";
const LANG_FUCHSIA = "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400";

const LANGUAGE_MAP: Record<string, { lang: string; color: string }> = {
  ts: { lang: "TypeScript", color: LANG_BLUE },
  tsx: { lang: "TSX", color: LANG_BLUE },
  mts: { lang: "TypeScript", color: LANG_BLUE },
  cts: { lang: "TypeScript", color: LANG_BLUE },
  js: { lang: "JavaScript", color: LANG_YELLOW },
  jsx: { lang: "JSX", color: LANG_YELLOW },
  mjs: { lang: "JavaScript", color: LANG_YELLOW },
  cjs: { lang: "JavaScript", color: LANG_YELLOW },

  html: { lang: "HTML", color: LANG_ORANGE },
  htm: { lang: "HTML", color: LANG_ORANGE },
  css: { lang: "CSS", color: LANG_PURPLE },
  scss: { lang: "SCSS", color: LANG_PINK },
  sass: { lang: "Sass", color: LANG_PINK },
  less: { lang: "Less", color: LANG_INDIGO },
  styl: { lang: "Stylus", color: LANG_LIME },
  vue: { lang: "Vue", color: LANG_EMERALD },
  svelte: { lang: "Svelte", color: LANG_ORANGE },
  astro: { lang: "Astro", color: LANG_ORANGE },
  mdx: { lang: "MDX", color: LANG_YELLOW },
  wasm: { lang: "WebAssembly", color: LANG_VIOLET },

  py: { lang: "Python", color: LANG_GREEN },
  pyx: { lang: "Cython", color: LANG_GREEN },
  pyi: { lang: "Python Stub", color: LANG_GREEN },
  pyw: { lang: "Python", color: LANG_GREEN },
  ipynb: { lang: "Jupyter", color: LANG_ORANGE },

  java: { lang: "Java", color: LANG_RED },
  kt: { lang: "Kotlin", color: LANG_VIOLET },
  kts: { lang: "Kotlin Script", color: LANG_VIOLET },
  scala: { lang: "Scala", color: LANG_RED },
  groovy: { lang: "Groovy", color: LANG_TEAL },
  gradle: { lang: "Gradle", color: LANG_TEAL },
  clj: { lang: "Clojure", color: LANG_GREEN },
  cljs: { lang: "ClojureScript", color: LANG_GREEN },

  c: { lang: "C", color: LANG_BLUE },
  h: { lang: "C Header", color: LANG_BLUE },
  cpp: { lang: "C++", color: LANG_BLUE },
  cxx: { lang: "C++", color: LANG_BLUE },
  cc: { lang: "C++", color: LANG_BLUE },
  hpp: { lang: "C++ Header", color: LANG_BLUE },
  hxx: { lang: "C++ Header", color: LANG_BLUE },
  m: { lang: "Objective-C", color: LANG_BLUE },
  mm: { lang: "Objective-C++", color: LANG_BLUE },

  cs: { lang: "C#", color: LANG_VIOLET },
  csx: { lang: "C# Script", color: LANG_VIOLET },
  fs: { lang: "F#", color: LANG_SKY },
  fsx: { lang: "F# Script", color: LANG_SKY },
  vb: { lang: "VB.NET", color: LANG_BLUE },
  xaml: { lang: "XAML", color: LANG_BLUE },
  razor: { lang: "Razor", color: LANG_PURPLE },
  cshtml: { lang: "Razor", color: LANG_PURPLE },
  csproj: { lang: "MSBuild", color: LANG_VIOLET },
  sln: { lang: "Solution", color: LANG_VIOLET },

  go: { lang: "Go", color: LANG_CYAN },
  mod: { lang: "Go Module", color: LANG_CYAN },
  sum: { lang: "Go Sum", color: LANG_CYAN },
  templ: { lang: "Go Templ", color: LANG_CYAN },

  rs: { lang: "Rust", color: LANG_ORANGE },

  rb: { lang: "Ruby", color: LANG_RED },
  erb: { lang: "ERB", color: LANG_RED },
  rake: { lang: "Rake", color: LANG_RED },
  gemspec: { lang: "Gemspec", color: LANG_RED },

  php: { lang: "PHP", color: LANG_VIOLET },
  blade: { lang: "Blade", color: LANG_ROSE },
  twig: { lang: "Twig", color: LANG_GREEN },

  swift: { lang: "Swift", color: LANG_ORANGE },

  dart: { lang: "Dart", color: LANG_BLUE },

  sh: { lang: "Shell", color: LANG_GREEN },
  bash: { lang: "Bash", color: LANG_GREEN },
  zsh: { lang: "Zsh", color: LANG_GREEN },
  fish: { lang: "Fish", color: LANG_GREEN },
  ps1: { lang: "PowerShell", color: LANG_BLUE },
  psm1: { lang: "PowerShell", color: LANG_BLUE },
  psd1: { lang: "PowerShell", color: LANG_BLUE },
  bat: { lang: "Batch", color: LANG_GRAY },
  cmd: { lang: "Batch", color: LANG_GRAY },

  ex: { lang: "Elixir", color: LANG_VIOLET },
  exs: { lang: "Elixir", color: LANG_VIOLET },
  eex: { lang: "EEx", color: LANG_VIOLET },
  heex: { lang: "HEEx", color: LANG_VIOLET },
  leex: { lang: "LEEx", color: LANG_VIOLET },
  erl: { lang: "Erlang", color: LANG_RED },
  hrl: { lang: "Erlang", color: LANG_RED },

  hs: { lang: "Haskell", color: LANG_VIOLET },
  lhs: { lang: "Haskell", color: LANG_VIOLET },
  ml: { lang: "OCaml", color: LANG_ORANGE },
  mli: { lang: "OCaml", color: LANG_ORANGE },
  elm: { lang: "Elm", color: LANG_TEAL },

  lua: { lang: "Lua", color: LANG_BLUE },

  r: { lang: "R", color: LANG_BLUE },
  rmd: { lang: "R Markdown", color: LANG_BLUE },

  pl: { lang: "Perl", color: LANG_TEAL },
  pm: { lang: "Perl", color: LANG_TEAL },

  zig: { lang: "Zig", color: LANG_AMBER },
  nim: { lang: "Nim", color: LANG_YELLOW },
  v: { lang: "V", color: LANG_BLUE },
  cr: { lang: "Crystal", color: LANG_GRAY },
  jl: { lang: "Julia", color: LANG_VIOLET },

  sql: { lang: "SQL", color: LANG_BLUE },
  psql: { lang: "PostgreSQL", color: LANG_BLUE },
  prisma: { lang: "Prisma", color: LANG_INDIGO },

  json: { lang: "JSON", color: LANG_GRAY },
  jsonc: { lang: "JSONC", color: LANG_GRAY },
  json5: { lang: "JSON5", color: LANG_GRAY },
  yaml: { lang: "YAML", color: LANG_RED },
  yml: { lang: "YAML", color: LANG_RED },
  toml: { lang: "TOML", color: LANG_GRAY },
  ini: { lang: "INI", color: LANG_GRAY },
  cfg: { lang: "Config", color: LANG_GRAY },
  conf: { lang: "Config", color: LANG_GRAY },
  env: { lang: "Env", color: LANG_YELLOW },
  properties: { lang: "Properties", color: LANG_GRAY },
  xml: { lang: "XML", color: LANG_ORANGE },
  svg: { lang: "SVG", color: LANG_ORANGE },
  plist: { lang: "Plist", color: LANG_GRAY },
  csv: { lang: "CSV", color: LANG_GREEN },

  md: { lang: "Markdown", color: LANG_GRAY },
  markdown: { lang: "Markdown", color: LANG_GRAY },
  rst: { lang: "reStructuredText", color: LANG_GRAY },
  adoc: { lang: "AsciiDoc", color: LANG_GRAY },
  tex: { lang: "LaTeX", color: LANG_TEAL },
  latex: { lang: "LaTeX", color: LANG_TEAL },
  txt: { lang: "Text", color: LANG_GRAY },

  graphql: { lang: "GraphQL", color: LANG_PINK },
  gql: { lang: "GraphQL", color: LANG_PINK },
  proto: { lang: "Protobuf", color: LANG_GREEN },

  tf: { lang: "Terraform", color: LANG_VIOLET },
  hcl: { lang: "HCL", color: LANG_VIOLET },
  bicep: { lang: "Bicep", color: LANG_BLUE },
  nix: { lang: "Nix", color: LANG_SKY },

  xib: { lang: "Interface Builder", color: LANG_BLUE },
  storyboard: { lang: "Storyboard", color: LANG_BLUE },

  hbs: { lang: "Handlebars", color: LANG_ORANGE },
  handlebars: { lang: "Handlebars", color: LANG_ORANGE },
  mustache: { lang: "Mustache", color: LANG_ORANGE },
  ejs: { lang: "EJS", color: LANG_GREEN },
  pug: { lang: "Pug", color: LANG_AMBER },
  jade: { lang: "Jade", color: LANG_AMBER },
  njk: { lang: "Nunjucks", color: LANG_GREEN },
  liquid: { lang: "Liquid", color: LANG_TEAL },

  cmake: { lang: "CMake", color: LANG_RED },
  mk: { lang: "Makefile", color: LANG_GRAY },
  mak: { lang: "Makefile", color: LANG_GRAY },
  just: { lang: "Justfile", color: LANG_GRAY },

  snap: { lang: "Snapshot", color: LANG_GRAY },
  spec: { lang: "Spec", color: LANG_GREEN },

  lock: { lang: "Lock", color: LANG_GRAY },
  log: { lang: "Log", color: LANG_GRAY },
  diff: { lang: "Diff", color: LANG_AMBER },
  patch: { lang: "Patch", color: LANG_AMBER },
  sol: { lang: "Solidity", color: LANG_GRAY },
  vy: { lang: "Vyper", color: LANG_TEAL },
  wgsl: { lang: "WGSL", color: LANG_RED },
  glsl: { lang: "GLSL", color: LANG_GREEN },
  hlsl: { lang: "HLSL", color: LANG_GREEN },
};

/** Well-known filenames without extensions */
const BASENAME_MAP: Record<string, { lang: string; color: string }> = {
  dockerfile: { lang: "Docker", color: LANG_BLUE },
  "dockerfile.dev": { lang: "Docker", color: LANG_BLUE },
  "dockerfile.prod": { lang: "Docker", color: LANG_BLUE },
  "docker-compose.yml": { lang: "Docker Compose", color: LANG_BLUE },
  "docker-compose.yaml": { lang: "Docker Compose", color: LANG_BLUE },
  ".gitignore": { lang: "Git", color: LANG_ORANGE },
  ".gitattributes": { lang: "Git", color: LANG_ORANGE },
  ".gitmodules": { lang: "Git", color: LANG_ORANGE },
  ".editorconfig": { lang: "EditorConfig", color: LANG_GRAY },
  ".prettierrc": { lang: "Prettier", color: LANG_FUCHSIA },
  ".prettierignore": { lang: "Prettier", color: LANG_FUCHSIA },
  ".eslintrc": { lang: "ESLint", color: LANG_VIOLET },
  ".eslintignore": { lang: "ESLint", color: LANG_VIOLET },
  ".babelrc": { lang: "Babel", color: LANG_YELLOW },
  ".npmrc": { lang: "npm", color: LANG_RED },
  ".nvmrc": { lang: "nvm", color: LANG_GREEN },
  ".env": { lang: "Env", color: LANG_YELLOW },
  ".env.local": { lang: "Env", color: LANG_YELLOW },
  ".env.development": { lang: "Env", color: LANG_YELLOW },
  ".env.production": { lang: "Env", color: LANG_YELLOW },
  ".env.test": { lang: "Env", color: LANG_YELLOW },
  ".env.example": { lang: "Env", color: LANG_YELLOW },
  makefile: { lang: "Makefile", color: LANG_GRAY },
  rakefile: { lang: "Rakefile", color: LANG_RED },
  gemfile: { lang: "Gemfile", color: LANG_RED },
  "gemfile.lock": { lang: "Gemfile", color: LANG_RED },
  "cargo.toml": { lang: "Cargo", color: LANG_ORANGE },
  "cargo.lock": { lang: "Cargo", color: LANG_ORANGE },
  "go.mod": { lang: "Go Module", color: LANG_CYAN },
  "go.sum": { lang: "Go Sum", color: LANG_CYAN },
  "package.json": { lang: "npm", color: LANG_RED },
  "package-lock.json": { lang: "npm", color: LANG_RED },
  "pnpm-lock.yaml": { lang: "pnpm", color: LANG_AMBER },
  "pnpm-workspace.yaml": { lang: "pnpm", color: LANG_AMBER },
  "yarn.lock": { lang: "Yarn", color: LANG_BLUE },
  "bun.lockb": { lang: "Bun", color: LANG_AMBER },
  "deno.json": { lang: "Deno", color: LANG_BLUE },
  "deno.lock": { lang: "Deno", color: LANG_BLUE },
  "tsconfig.json": { lang: "TypeScript", color: LANG_BLUE },
  "jsconfig.json": { lang: "JavaScript", color: LANG_YELLOW },
  "tailwind.config.js": { lang: "Tailwind", color: LANG_CYAN },
  "tailwind.config.ts": { lang: "Tailwind", color: LANG_CYAN },
  "postcss.config.js": { lang: "PostCSS", color: LANG_RED },
  "postcss.config.mjs": { lang: "PostCSS", color: LANG_RED },
  "next.config.js": { lang: "Next.js", color: LANG_GRAY },
  "next.config.ts": { lang: "Next.js", color: LANG_GRAY },
  "next.config.mjs": { lang: "Next.js", color: LANG_GRAY },
  "vite.config.ts": { lang: "Vite", color: LANG_VIOLET },
  "vite.config.js": { lang: "Vite", color: LANG_VIOLET },
  "vitest.config.ts": { lang: "Vitest", color: LANG_GREEN },
  "jest.config.js": { lang: "Jest", color: LANG_ROSE },
  "jest.config.ts": { lang: "Jest", color: LANG_ROSE },
  "webpack.config.js": { lang: "Webpack", color: LANG_BLUE },
  "rollup.config.js": { lang: "Rollup", color: LANG_RED },
  "turbo.json": { lang: "Turborepo", color: LANG_ROSE },
  "vercel.json": { lang: "Vercel", color: LANG_GRAY },
  "netlify.toml": { lang: "Netlify", color: LANG_TEAL },
  "fly.toml": { lang: "Fly.io", color: LANG_VIOLET },
  procfile: { lang: "Procfile", color: LANG_GRAY },
  "requirements.txt": { lang: "pip", color: LANG_GREEN },
  "pyproject.toml": { lang: "Python", color: LANG_GREEN },
  "setup.py": { lang: "Python", color: LANG_GREEN },
  "setup.cfg": { lang: "Python", color: LANG_GREEN },
  pipfile: { lang: "Pipfile", color: LANG_GREEN },
  "pipfile.lock": { lang: "Pipfile", color: LANG_GREEN },
  "poetry.lock": { lang: "Poetry", color: LANG_VIOLET },
  "mix.exs": { lang: "Mix", color: LANG_VIOLET },
  "mix.lock": { lang: "Mix", color: LANG_VIOLET },
  "pubspec.yaml": { lang: "Dart", color: LANG_BLUE },
  "pubspec.lock": { lang: "Dart", color: LANG_BLUE },
  "build.gradle": { lang: "Gradle", color: LANG_TEAL },
  "settings.gradle": { lang: "Gradle", color: LANG_TEAL },
  "pom.xml": { lang: "Maven", color: LANG_RED },
  "cmakelists.txt": { lang: "CMake", color: LANG_RED },
  justfile: { lang: "Justfile", color: LANG_GRAY },
  vagrantfile: { lang: "Vagrant", color: LANG_BLUE },
  jenkinsfile: { lang: "Jenkins", color: LANG_RED },
  license: { lang: "License", color: LANG_GRAY },
  "license.md": { lang: "License", color: LANG_GRAY },
  readme: { lang: "Readme", color: LANG_GRAY },
  "readme.md": { lang: "Readme", color: LANG_GRAY },
  changelog: { lang: "Changelog", color: LANG_GRAY },
  "changelog.md": { lang: "Changelog", color: LANG_GRAY },
};

function getLanguageInfo(
  filename: string,
): { lang: string; color: string } | null {
  const basename = filename.split("/").pop()?.toLowerCase() || "";

  if (BASENAME_MAP[basename]) return BASENAME_MAP[basename];

  if (basename.startsWith("dockerfile"))
    return { lang: "Docker", color: LANG_BLUE };

  const ext = basename.split(".").pop()?.toLowerCase();
  if (ext && LANGUAGE_MAP[ext]) return LANGUAGE_MAP[ext];

  const parts = basename.split(".");
  if (parts.length >= 3) {
    const secondExt = parts[parts.length - 2]?.toLowerCase();
    if (secondExt === "stories" || secondExt === "story")
      return { lang: "Storybook", color: LANG_PINK };
    if (secondExt === "test" || secondExt === "spec")
      return ext ? LANGUAGE_MAP[ext] || null : null;
    if (secondExt === "module" && ext === "css")
      return { lang: "CSS Module", color: LANG_PURPLE };
    if (secondExt === "d" && ext === "ts")
      return { lang: "TypeScript Decl", color: LANG_BLUE };
  }

  return null;
}

interface ParsedLine {
  content: string;
  type: "addition" | "deletion" | "context" | "hunk" | "info";
  oldNum: number | null;
  newNum: number | null;
}

interface ParsedHunk {
  header: string;
  lines: ParsedLine[];
  oldStart: number;
  newStart: number;
}

function parsePatch(patch: string): ParsedHunk[] {
  const lines = patch.split("\n");
  const hunks: ParsedHunk[] = [];
  let currentHunk: ParsedHunk | null = null;
  let oldNum = 0;
  let newNum = 0;

  for (const line of lines) {
    if (line.startsWith("@@")) {
      const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      const oldStart = match?.[1] ? parseInt(match[1], 10) : 0;
      const newStart = match?.[2] ? parseInt(match[2], 10) : 0;
      oldNum = oldStart - 1;
      newNum = newStart - 1;
      currentHunk = { header: line, lines: [], oldStart, newStart };
      hunks.push(currentHunk);
      currentHunk.lines.push({
        content: line,
        type: "hunk",
        oldNum: null,
        newNum: null,
      });
    } else if (line.startsWith("\\")) {
      currentHunk?.lines.push({
        content: line,
        type: "info",
        oldNum: null,
        newNum: null,
      });
    } else if (currentHunk) {
      if (line.startsWith("+")) {
        newNum++;
        currentHunk.lines.push({
          content: line.slice(1),
          type: "addition",
          oldNum: null,
          newNum,
        });
      } else if (line.startsWith("-")) {
        oldNum++;
        currentHunk.lines.push({
          content: line.slice(1),
          type: "deletion",
          oldNum,
          newNum: null,
        });
      } else {
        oldNum++;
        newNum++;
        currentHunk.lines.push({
          content: line.slice(1) || " ",
          type: "context",
          oldNum,
          newNum,
        });
      }
    }
  }
  return hunks;
}

interface DiffGroup {
  type: "context" | "hunk" | "change" | "info";
  lines: ParsedLine[];
  deletions: ParsedLine[];
  additions: ParsedLine[];
}

function groupLines(hunks: ParsedHunk[]): DiffGroup[] {
  const allLines = hunks.flatMap((h) => h.lines);
  const groups: DiffGroup[] = [];
  let i = 0;

  while (i < allLines.length) {
    const line = allLines[i];

    if (line.type === "hunk") {
      groups.push({
        type: "hunk",
        lines: [line],
        deletions: [],
        additions: [],
      });
      i++;
    } else if (line.type === "info") {
      groups.push({
        type: "info",
        lines: [line],
        deletions: [],
        additions: [],
      });
      i++;
    } else if (line.type === "context") {
      const contextLines: ParsedLine[] = [];
      while (i < allLines.length && allLines[i].type === "context") {
        contextLines.push(allLines[i]);
        i++;
      }
      groups.push({
        type: "context",
        lines: contextLines,
        deletions: [],
        additions: [],
      });
    } else {
      // Collect consecutive deletions followed by additions
      const deletions: ParsedLine[] = [];
      const additions: ParsedLine[] = [];
      while (i < allLines.length && allLines[i].type === "deletion") {
        deletions.push(allLines[i]);
        i++;
      }
      while (i < allLines.length && allLines[i].type === "addition") {
        additions.push(allLines[i]);
        i++;
      }
      groups.push({
        type: "change",
        lines: [...deletions, ...additions],
        deletions,
        additions,
      });
    }
  }
  return groups;
}

export function DiffViewer({ files }: DiffViewerProps) {
  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);
  const totalChanges = totalAdditions + totalDeletions;

  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
    new Set(files.slice(0, 3).map((f) => f.sha)),
  );
  const [viewMode, setViewMode] = useState<ViewMode>("unified");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FileStatusFilter>("all");
  const [wordDiffEnabled, setWordDiffEnabled] = useState(true);
  const [wrapLines, setWrapLines] = useState(false);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: files.length };
    for (const f of files) {
      const normalized = f.status === "changed" ? "modified" : f.status;
      counts[normalized] = (counts[normalized] || 0) + 1;
    }
    return counts;
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch =
        searchQuery === "" ||
        f.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const normalized = f.status === "changed" ? "modified" : f.status;
      const matchesStatus =
        statusFilter === "all" || normalized === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [files, searchQuery, statusFilter]);

  const toggleFile = useCallback((sha: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(sha)) next.delete(sha);
      else next.add(sha);
      return next;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "e" && !e.ctrlKey && !e.metaKey) {
        setExpandedFiles(new Set(filteredFiles.map((f) => f.sha)));
      } else if (e.key === "w" && !e.ctrlKey && !e.metaKey) {
        setWrapLines((p) => !p);
      } else if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>("[data-diff-search]")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filteredFiles]);

  const addPercent =
    totalChanges > 0 ? (totalAdditions / totalChanges) * 100 : 50;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <FolderTree className="size-4 text-primary" />
              </div>
              <div>
                <span className="text-base font-semibold tabular-nums">
                  {files.length}
                </span>
                <span className="text-sm text-muted-foreground ml-1.5">
                  {files.length === 1 ? "file" : "files"} changed
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-border" />

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                <Plus className="size-3.5" />
                <span className="tabular-nums">{totalAdditions}</span>
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium text-sm">
                <Minus className="size-3.5" />
                <span className="tabular-nums">{totalDeletions}</span>
              </span>
            </div>

            {/* Change ratio bar */}
            {totalChanges > 0 && (
              <>
                <div className="h-5 w-px bg-border hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${addPercent}%` }}
                    />
                    <div
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: `${100 - addPercent}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* View mode toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "unified" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-none gap-1.5 text-xs h-8"
                onClick={() => setViewMode("unified")}
                title="Unified view"
              >
                <AlignJustify className="size-3.5" />
                <span className="hidden md:inline">Unified</span>
              </Button>
              <Button
                variant={viewMode === "split" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-none gap-1.5 text-xs h-8"
                onClick={() => setViewMode("split")}
                title="Side-by-side view"
              >
                <Columns3 className="size-3.5" />
                <span className="hidden md:inline">Split</span>
              </Button>
            </div>

            <div className="h-5 w-px bg-border" />

            <Button
              variant={wordDiffEnabled ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => setWordDiffEnabled(!wordDiffEnabled)}
              title="Toggle word-level diff highlighting"
            >
              {wordDiffEnabled ? (
                <Eye className="size-3.5" />
              ) : (
                <EyeOff className="size-3.5" />
              )}
              <span className="hidden md:inline">Word diff</span>
            </Button>

            <Button
              variant={wrapLines ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => setWrapLines(!wrapLines)}
              title="Toggle line wrapping"
            >
              <WrapText className="size-3.5" />
              <span className="hidden md:inline">Wrap</span>
            </Button>

            <div className="h-5 w-px bg-border" />

            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={() =>
                setExpandedFiles(new Set(filteredFiles.map((f) => f.sha)))
              }
            >
              Expand all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={() => setExpandedFiles(new Set())}
            >
              Collapse all
            </Button>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-50 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              data-diff-search
              placeholder="Filter files…"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="pl-9 pr-8 h-8 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {(
              [
                "all",
                "added",
                "modified",
                "removed",
                "renamed",
              ] as FileStatusFilter[]
            ).map((status) => {
              const count = statusCounts[status] || 0;
              if (status !== "all" && count === 0) return null;

              const configs: Record<
                FileStatusFilter,
                { label: string; activeClass: string }
              > = {
                all: {
                  label: "All",
                  activeClass: "bg-primary/10 text-primary",
                },
                added: {
                  label: "Added",
                  activeClass:
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                },
                modified: {
                  label: "Modified",
                  activeClass:
                    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                },
                removed: {
                  label: "Deleted",
                  activeClass: "bg-red-500/10 text-red-600 dark:text-red-400",
                },
                renamed: {
                  label: "Renamed",
                  activeClass:
                    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                },
              };
              const cfg = configs[status];

              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    statusFilter === status
                      ? cfg.activeClass
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  {cfg.label}
                  <span className="ml-1 tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* File Cards */}
      <div className="space-y-3">
        {filteredFiles.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <Search className="size-8 mx-auto mb-2 opacity-50" />
            <p>No files match your filter criteria.</p>
          </div>
        ) : (
          filteredFiles.map((file) => (
            <DiffFileCard
              key={file.sha}
              file={file}
              expanded={expandedFiles.has(file.sha)}
              onToggle={() => toggleFile(file.sha)}
              viewMode={viewMode}
              wordDiffEnabled={wordDiffEnabled}
              wrapLines={wrapLines}
            />
          ))
        )}
      </div>

      {/* Keyboard Shortcut Hints */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/60 pt-2 select-none">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border/50">
            /
          </kbd>
          Search
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border/50">
            E
          </kbd>
          Expand
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border/50">
            W
          </kbd>
          Wrap
        </span>
      </div>
    </div>
  );
}

function DiffFileCard({
  file,
  expanded,
  onToggle,
  viewMode,
  wordDiffEnabled,
  wrapLines,
}: {
  file: DiffFile;
  expanded: boolean;
  onToggle: () => void;
  viewMode: ViewMode;
  wordDiffEnabled: boolean;
  wrapLines: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const statusIcon = getStatusIcon(file.status);
  const statusConfig = getStatusConfig(file.status);
  const langInfo = getLanguageInfo(file.filename);

  const copyFilename = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(file.filename);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pathParts = file.filename.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow duration-200",
        expanded && "shadow-sm",
      )}
    >
      {/* Sticky file header */}
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors",
          "hover:bg-muted/50 group",
          expanded &&
            "sticky top-0 z-10 bg-card border-b border-border/30 backdrop-blur-sm",
        )}
      >
        <div className="shrink-0 transition-transform duration-200">
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </div>

        <div className={cn("p-1.5 rounded-md shrink-0", statusConfig.bg)}>
          {React.createElement(statusIcon, {
            className: cn("size-4", statusConfig.color),
          })}
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          {directory && (
            <span className="text-sm text-muted-foreground font-mono truncate">
              {directory}/
            </span>
          )}
          <span className="text-sm font-medium font-mono truncate">
            {fileName}
          </span>

          {/* Language badge */}
          {langInfo && (
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0",
                langInfo.color,
              )}
            >
              {langInfo.lang}
            </span>
          )}

          {file.previousFilename && (
            <Badge variant="outline" className="text-xs shrink-0">
              ← {file.previousFilename.split("/").pop()}
            </Badge>
          )}

          {file.changes > 300 && (
            <Badge
              variant="outline"
              className="text-[10px] shrink-0 gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            >
              <AlertCircle className="size-3" />
              Large diff
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Copy filename (visible on hover) */}
          <div
            role="button"
            tabIndex={-1}
            onClick={copyFilename}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5 text-muted-foreground" />
            )}
          </div>

          {/* Mini change bar */}
          <div className="hidden sm:flex items-center gap-0.5">
            {Array.from({ length: Math.min(5, file.additions) }).map((_, i) => (
              <div
                key={`add-${i}`}
                className="w-1.5 h-3 rounded-sm bg-emerald-500"
              />
            ))}
            {Array.from({ length: Math.min(5, file.deletions) }).map((_, i) => (
              <div
                key={`del-${i}`}
                className="w-1.5 h-3 rounded-sm bg-red-500"
              />
            ))}
            {file.additions + file.deletions === 0 && (
              <div className="w-1.5 h-3 rounded-sm bg-muted-foreground/30" />
            )}
          </div>

          <div className="flex items-center gap-2 text-xs tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              +{file.additions}
            </span>
            <span className="text-red-600 dark:text-red-400 font-medium">
              -{file.deletions}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded diff content */}
      {expanded && (
        <CardContent className="p-0 border-t border-border/60">
          {file.patch ? (
            <DiffContentRouter
              patch={file.patch}
              viewMode={viewMode}
              wordDiffEnabled={wordDiffEnabled}
              wrapLines={wrapLines}
            />
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <FileText className="size-8 mx-auto mb-2 opacity-50" />
              <p>No diff available for this file.</p>
              <p className="text-xs mt-1">
                Binary file or too large to display.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function DiffContentRouter({
  patch,
  viewMode,
  wordDiffEnabled,
  wrapLines,
}: {
  patch: string;
  viewMode: ViewMode;
  wordDiffEnabled: boolean;
  wrapLines: boolean;
}) {
  const hunks = useMemo(() => parsePatch(patch), [patch]);
  const groups = useMemo(() => groupLines(hunks), [hunks]);

  if (viewMode === "split") {
    return (
      <DiffContentSplit
        groups={groups}
        wordDiffEnabled={wordDiffEnabled}
        wrapLines={wrapLines}
      />
    );
  }
  return (
    <DiffContentUnified
      groups={groups}
      wordDiffEnabled={wordDiffEnabled}
      wrapLines={wrapLines}
    />
  );
}

const CONTEXT_COLLAPSE_THRESHOLD = 8;

function DiffContentUnified({
  groups,
  wordDiffEnabled,
  wrapLines,
}: {
  groups: DiffGroup[];
  wordDiffEnabled: boolean;
  wrapLines: boolean;
}) {
  const [expandedContexts, setExpandedContexts] = useState<Set<number>>(
    new Set(),
  );

  const toggleContext = useCallback((index: number) => {
    setExpandedContexts((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <tbody>
          {groups.map((group, gi) => {
            if (group.type === "hunk") {
              return (
                <tr key={gi} className="bg-blue-500/8">
                  <td
                    colSpan={3}
                    className="px-4 py-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-500/5 select-none font-medium"
                  >
                    {group.lines[0].content}
                  </td>
                </tr>
              );
            }

            if (group.type === "info") {
              return (
                <tr key={gi} className="bg-muted/30">
                  <td
                    colSpan={3}
                    className="px-4 py-1 text-xs text-muted-foreground italic select-none"
                  >
                    {group.lines[0].content}
                  </td>
                </tr>
              );
            }

            if (group.type === "context") {
              const { lines } = group;
              const shouldCollapse =
                lines.length > CONTEXT_COLLAPSE_THRESHOLD &&
                !expandedContexts.has(gi);

              if (shouldCollapse) {
                const topLines = lines.slice(0, 3);
                const bottomLines = lines.slice(-3);
                const hiddenCount = lines.length - 6;
                return (
                  <React.Fragment key={gi}>
                    {topLines.map((line, li) => (
                      <UnifiedContextRow
                        key={`top-${li}`}
                        line={line}
                        wrapLines={wrapLines}
                      />
                    ))}
                    <tr>
                      <td colSpan={3} className="text-center py-1.5">
                        <button
                          onClick={() => toggleContext(gi)}
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted px-3 py-1 rounded-full border border-border/40"
                        >
                          <ChevronsUpDown className="size-3" />
                          Show {hiddenCount} hidden lines
                        </button>
                      </td>
                    </tr>
                    {bottomLines.map((line, li) => (
                      <UnifiedContextRow
                        key={`bot-${li}`}
                        line={line}
                        wrapLines={wrapLines}
                      />
                    ))}
                  </React.Fragment>
                );
              }

              return (
                <React.Fragment key={gi}>
                  {lines.map((line, li) => (
                    <UnifiedContextRow
                      key={li}
                      line={line}
                      wrapLines={wrapLines}
                    />
                  ))}
                </React.Fragment>
              );
            }

            // Change group — deletions then additions with word diff
            if (group.type === "change") {
              const { deletions, additions } = group;
              const maxPairs = Math.min(deletions.length, additions.length);
              const wordDiffs = wordDiffEnabled
                ? Array.from({ length: maxPairs }, (_, i) =>
                    computeWordDiff(deletions[i].content, additions[i].content),
                  )
                : [];

              return (
                <React.Fragment key={gi}>
                  {deletions.map((line, li) => {
                    const wd =
                      wordDiffEnabled && li < maxPairs ? wordDiffs[li] : null;
                    return (
                      <tr key={`del-${li}`} className="bg-red-500/8 group/line">
                        <td className="w-12 px-2 py-0.5 text-right select-none border-r border-border/30 bg-red-500/5 text-red-600/70 dark:text-red-400/70">
                          {line.oldNum || ""}
                        </td>
                        <td className="w-12 px-2 py-0.5 text-right select-none border-r border-border/30 bg-red-500/5 text-red-600/70 dark:text-red-400/70" />
                        <td
                          className={cn(
                            "px-4 py-0.5 text-red-700 dark:text-red-300",
                            wrapLines
                              ? "whitespace-pre-wrap break-all"
                              : "whitespace-pre",
                          )}
                        >
                          <span className="select-none text-red-500/50 mr-1">
                            −
                          </span>
                          {wd ? (
                            <WordDiffSegments
                              segments={wd.oldSegments}
                              side="old"
                            />
                          ) : (
                            line.content || " "
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {additions.map((line, li) => {
                    const wd =
                      wordDiffEnabled && li < maxPairs ? wordDiffs[li] : null;
                    return (
                      <tr
                        key={`add-${li}`}
                        className="bg-emerald-500/8 group/line"
                      >
                        <td className="w-12 px-2 py-0.5 text-right select-none border-r border-border/30 bg-emerald-500/5 text-emerald-600/70 dark:text-emerald-400/70" />
                        <td className="w-12 px-2 py-0.5 text-right select-none border-r border-border/30 bg-emerald-500/5 text-emerald-600/70 dark:text-emerald-400/70">
                          {line.newNum || ""}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-0.5 text-emerald-700 dark:text-emerald-300",
                            wrapLines
                              ? "whitespace-pre-wrap break-all"
                              : "whitespace-pre",
                          )}
                        >
                          <span className="select-none text-emerald-500/50 mr-1">
                            +
                          </span>
                          {wd ? (
                            <WordDiffSegments
                              segments={wd.newSegments}
                              side="new"
                            />
                          ) : (
                            line.content || " "
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            }

            return null;
          })}
        </tbody>
      </table>
    </div>
  );
}

function UnifiedContextRow({
  line,
  wrapLines,
}: {
  line: ParsedLine;
  wrapLines: boolean;
}) {
  return (
    <tr className="group/line hover:bg-muted/30 transition-colors">
      <td className="w-12 px-2 py-0.5 text-right select-none border-r border-border/30 text-muted-foreground/50">
        {line.oldNum || ""}
      </td>
      <td className="w-12 px-2 py-0.5 text-right select-none border-r border-border/30 text-muted-foreground/50">
        {line.newNum || ""}
      </td>
      <td
        className={cn(
          "px-4 py-0.5 text-foreground",
          wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre",
        )}
      >
        <span className="select-none text-transparent mr-1"> </span>
        {line.content || " "}
      </td>
    </tr>
  );
}

interface SplitRow {
  left: { line: ParsedLine | null; segments?: DiffSegment[] };
  right: { line: ParsedLine | null; segments?: DiffSegment[] };
  isHunk?: boolean;
  isInfo?: boolean;
  hunkContent?: string;
}

function buildSplitRows(
  groups: DiffGroup[],
  wordDiffEnabled: boolean,
): SplitRow[] {
  const rows: SplitRow[] = [];

  for (const group of groups) {
    if (group.type === "hunk") {
      rows.push({
        left: { line: null },
        right: { line: null },
        isHunk: true,
        hunkContent: group.lines[0].content,
      });
    } else if (group.type === "info") {
      rows.push({
        left: { line: null },
        right: { line: null },
        isInfo: true,
        hunkContent: group.lines[0].content,
      });
    } else if (group.type === "context") {
      for (const line of group.lines) {
        rows.push({ left: { line }, right: { line } });
      }
    } else if (group.type === "change") {
      const { deletions, additions } = group;
      const maxLen = Math.max(deletions.length, additions.length);
      const minLen = Math.min(deletions.length, additions.length);

      const wordDiffs = wordDiffEnabled
        ? Array.from({ length: minLen }, (_, i) =>
            computeWordDiff(deletions[i].content, additions[i].content),
          )
        : [];

      for (let i = 0; i < maxLen; i++) {
        const del = i < deletions.length ? deletions[i] : null;
        const add = i < additions.length ? additions[i] : null;
        const wd = wordDiffEnabled && i < minLen ? wordDiffs[i] : null;
        rows.push({
          left: { line: del, segments: wd?.oldSegments },
          right: { line: add, segments: wd?.newSegments },
        });
      }
    }
  }

  return rows;
}

function DiffContentSplit({
  groups,
  wordDiffEnabled,
  wrapLines,
}: {
  groups: DiffGroup[];
  wordDiffEnabled: boolean;
  wrapLines: boolean;
}) {
  const rows = useMemo(
    () => buildSplitRows(groups, wordDiffEnabled),
    [groups, wordDiffEnabled],
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse table-fixed">
        <colgroup>
          <col className="w-12" />
          <col />
          <col className="w-12" />
          <col />
        </colgroup>
        <tbody>
          {rows.map((row, ri) => {
            if (row.isHunk) {
              return (
                <tr key={ri} className="bg-blue-500/8">
                  <td
                    colSpan={4}
                    className="px-4 py-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-500/5 select-none text-center font-medium"
                  >
                    {row.hunkContent}
                  </td>
                </tr>
              );
            }

            if (row.isInfo) {
              return (
                <tr key={ri} className="bg-muted/30">
                  <td
                    colSpan={4}
                    className="px-4 py-1 text-xs text-muted-foreground italic select-none text-center"
                  >
                    {row.hunkContent}
                  </td>
                </tr>
              );
            }

            const leftLine = row.left.line;
            const rightLine = row.right.line;
            const leftIsChange = leftLine?.type === "deletion";
            const rightIsChange = rightLine?.type === "addition";

            return (
              <tr key={ri} className="group/line">
                {/* Left (old) */}
                <td
                  className={cn(
                    "w-12 px-2 py-0.5 text-right select-none border-r border-border/30",
                    leftIsChange
                      ? "bg-red-500/5 text-red-600/70 dark:text-red-400/70"
                      : "text-muted-foreground/50",
                  )}
                >
                  {leftLine?.oldNum || leftLine?.newNum || ""}
                </td>
                <td
                  className={cn(
                    "px-3 py-0.5 border-r border-border/50",
                    leftIsChange
                      ? "bg-red-500/8 text-red-700 dark:text-red-300"
                      : leftLine
                        ? "hover:bg-muted/30"
                        : "bg-muted/20",
                    wrapLines
                      ? "whitespace-pre-wrap break-all"
                      : "whitespace-pre",
                  )}
                >
                  {leftLine ? (
                    row.left.segments ? (
                      <WordDiffSegments
                        segments={row.left.segments}
                        side="old"
                      />
                    ) : (
                      leftLine.content || " "
                    )
                  ) : null}
                </td>

                {/* Right (new) */}
                <td
                  className={cn(
                    "w-12 px-2 py-0.5 text-right select-none border-r border-border/30",
                    rightIsChange
                      ? "bg-emerald-500/5 text-emerald-600/70 dark:text-emerald-400/70"
                      : "text-muted-foreground/50",
                  )}
                >
                  {rightLine?.newNum || rightLine?.oldNum || ""}
                </td>
                <td
                  className={cn(
                    "px-3 py-0.5",
                    rightIsChange
                      ? "bg-emerald-500/8 text-emerald-700 dark:text-emerald-300"
                      : rightLine
                        ? "hover:bg-muted/30"
                        : "bg-muted/20",
                    wrapLines
                      ? "whitespace-pre-wrap break-all"
                      : "whitespace-pre",
                  )}
                >
                  {rightLine ? (
                    row.right.segments ? (
                      <WordDiffSegments
                        segments={row.right.segments}
                        side="new"
                      />
                    ) : (
                      rightLine.content || " "
                    )
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function WordDiffSegments({
  segments,
  side,
}: {
  segments: DiffSegment[];
  side: "old" | "new";
}) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "common") {
          return <span key={i}>{seg.text}</span>;
        }
        const cls =
          side === "old"
            ? "bg-red-500/25 rounded-sm px-px dark:bg-red-400/20"
            : "bg-emerald-500/25 rounded-sm px-px dark:bg-emerald-400/20";
        return (
          <span key={i} className={cls}>
            {seg.text}
          </span>
        );
      })}
    </>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case "added":
      return FilePlus;
    case "removed":
      return FileMinus;
    case "modified":
    case "changed":
      return FileEdit;
    case "renamed":
      return FileEdit;
    default:
      return FileText;
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case "added":
      return {
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
      };
    case "removed":
      return {
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-500/10",
      };
    case "modified":
    case "changed":
      return {
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
      };
    case "renamed":
      return {
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-500/10",
      };
    default:
      return {
        color: "text-muted-foreground",
        bg: "bg-muted",
      };
  }
}
