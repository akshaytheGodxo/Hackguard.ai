"use client"

import Editor, { type Monaco } from "@monaco-editor/react"
import { ArrowLeft, FlaskConical, Inbox, Loader2, Play, RotateCcw, Send, Terminal } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select"

export type SolveProblem = {
  id: string
  name: string
  description: string
  hackathonId: string
  eventName: string
  examples: { id: string; input: string; output: string }[]
}

type LangId = "javascript" | "python" | "java" | "cpp" | "go" | "rust"
type RunState = "idle" | "running" | "done"
type RunMode = "run" | "submit"

const LANGS: { id: LangId; label: string }[] = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
]

const LANG_IDS = LANGS.map((lang) => lang.id)

const LANG_LABELS = Object.fromEntries(LANGS.map((lang) => [lang.id, lang.label])) as Record<
  LangId,
  string
>

const TEMPLATES: Record<LangId, string> = {
  javascript: `// Input is read from stdin — print your answer to stdout.
const input = require("fs").readFileSync(0, "utf8").trim()

// TODO: solve
console.log(input)
`,
  python: `import sys

data = sys.stdin.read().strip()
# TODO: solve
print(data)
`,
  java: `import java.io.*;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        // TODO: solve
        System.out.println(line);
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string line;
    getline(cin, line);
    // TODO: solve
    cout << line << endl;
    return 0;
}
`,
  go: `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	scanner.Scan()
	line := scanner.Text()
	// TODO: solve
	fmt.Println(line)
}
`,
  rust: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let input = input.trim();
    // TODO: solve
    println!("{input}");
}
`,
}

const EDITOR_FONT = "ui-monospace, SFMono-Regular, 'Cascadia Code', Consolas, 'Liberation Mono', monospace"

function storageKey(problemId: string, lang: LangId): string {
  return `hg:solve:${problemId}:${lang}`
}

function loadSavedCodes(problemId: string): Record<LangId, string> {
  const saved: Record<LangId, string> = { ...TEMPLATES }
  if (typeof window === "undefined") return saved
  for (const id of LANG_IDS) {
    try {
      const value = window.localStorage.getItem(storageKey(problemId, id))
      if (value) saved[id] = value
      // storage may be unavailable (private mode, quota)
    } catch {}
  }
  return saved
}

function isLangId(value: unknown): value is LangId {
  return typeof value === "string" && (LANG_IDS as readonly string[]).includes(value)
}

function handleEditorWillMount(monaco: Monaco) {
  monaco.editor.defineTheme("hg-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [{ token: "comment", foreground: "6d7a8d", fontStyle: "italic" }],
    colors: {
      "editor.background": "#0b111b",
      "editor.foreground": "#f0f4fa",
      "editorLineNumber.foreground": "#3f4b60",
      "editorLineNumber.activeForeground": "#98a5b7",
      "editorCursor.foreground": "#69e4e7",
      "editor.selectionBackground": "#69e4e733",
      "editor.inactiveSelectionBackground": "#69e4e71a",
      "editor.lineHighlightBackground": "#0f1725",
      "editorIndentGuide.background1": "#182234",
      "editorWidget.background": "#0e1622",
      "editorWidget.border": "rgba(167, 187, 215, 0.13)",
      "editorSuggestWidget.background": "#0e1622",
      "editorSuggestWidget.border": "rgba(167, 187, 215, 0.13)",
      "scrollbarSlider.background": "#26324a66",
      "scrollbarSlider.hoverBackground": "#26324a99",
      "scrollbarSlider.activeBackground": "#26324acc",
    },
  })
}

export function SolveView({ problem }: { problem: SolveProblem }) {
  const [lang, setLang] = useState<LangId>("javascript")
  const [codes, setCodes] = useState<Record<LangId, string>>(() => loadSavedCodes(problem.id))
  const [runState, setRunState] = useState<RunState>("idle")
  const [runMode, setRunMode] = useState<RunMode>("run")
  const [activeExample, setActiveExample] = useState(0)

  const runStateRef = useRef<RunState>("idle")
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    runStateRef.current = runState
  }, [runState])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const begin = useCallback((mode: RunMode) => {
    if (runStateRef.current === "running") return
    setRunMode(mode)
    setRunState("running")
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setRunState("done"), 900)
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault()
        begin("run")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [begin])

  function updateCode(value: string) {
    setCodes((current) => ({ ...current, [lang]: value }))
    try {
      window.localStorage.setItem(storageKey(problem.id, lang), value)
      // storage may be unavailable (private mode, quota)
    } catch {}
  }

  function resetCode() {
    setCodes((current) => ({ ...current, [lang]: TEMPLATES[lang] }))
    try {
      window.localStorage.removeItem(storageKey(problem.id, lang))
      // storage may be unavailable (private mode, quota)
    } catch {}
    setRunState("idle")
  }

  const example = problem.examples[activeExample] ?? problem.examples[0]

  return (
    <main className="hg-fade-in flex h-dvh flex-col bg-[var(--hg-bg)] text-[var(--hg-text)]">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--hg-border)] bg-[var(--hg-bg-raised)] px-4 py-2">
        <Link
          href={`/rooms/${problem.hackathonId}`}
          aria-label="Back to room"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--hg-muted)] transition-colors hover:bg-white/5 hover:text-[var(--hg-text)]"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight">{problem.name}</p>
          <p className="truncate text-[11px] text-[var(--hg-dim)]">
            {problem.eventName} · {problem.examples.length}{" "}
            {problem.examples.length === 1 ? "test case" : "test cases"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Select items={LANG_LABELS} onValueChange={(value) => { if (isLangId(value)) setLang(value) }}>
            <SelectTrigger className="h-8 min-w-[8.5rem] rounded-md border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-3 text-[12px] text-[var(--hg-text)]">
              <span className="inline-flex items-center gap-1.5">
                <Terminal className="size-3.5 text-[var(--hg-dim)]" />
                {LANGS.find((item) => item.id === lang)?.label}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {LANGS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={resetCode}
            aria-label="Reset code to template"
            className="rounded-md! text-[var(--hg-dim)] hover:text-[var(--hg-text)]"
          >
            <RotateCcw />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => begin("run")}
            disabled={runState === "running"}
            className="rounded-md! border-[var(--hg-cyan)]/40 bg-[var(--hg-cyan)]/10 px-3.5 text-[12px] font-semibold text-[var(--hg-cyan)] hover:bg-[var(--hg-cyan)]/20 hover:text-[var(--hg-cyan)]"
          >
            {runState === "running" && runMode === "run" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Play />
            )}
            {runMode === "run" && runState === "running" ? "Running…" : "Run"}
          </Button>

          <Button
            size="sm"
            onClick={() => begin("submit")}
            disabled={runState === "running"}
            className="hg-gradient-bg rounded-md! px-3.5 text-[12px] font-bold text-[#101426] transition-all hover:-translate-y-px hover:brightness-105"
          >
            {runState === "running" && runMode === "submit" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Send />
            )}
            {runMode === "submit" && runState === "running" ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="flex max-h-[42dvh] shrink-0 flex-col overflow-y-auto border-b border-[var(--hg-border)] px-6 py-6 lg:h-full lg:max-h-none lg:w-[44%] lg:shrink lg:border-r lg:border-b-0 lg:px-8 lg:py-8">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hg-cyan)]">
            <FlaskConical className="size-3.5" /> Problem
          </span>
          <h1 className="mt-2 text-2xl font-bold leading-tight">{problem.name}</h1>
          <p className="mt-1.5 text-[12px] text-[var(--hg-dim)]">Hosted in {problem.eventName}</p>

          <p className="mt-5 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--hg-muted)]">
            {problem.description || "No description provided."}
          </p>

          <div className="mt-7 border-t border-[var(--hg-border)] pt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--hg-dim)]">
                Example test cases
              </span>
              {problem.examples.length > 1 && (
                <span className="text-[11px] text-[var(--hg-dim)]">
                  {activeExample + 1} / {problem.examples.length}
                </span>
              )}
            </div>

            {problem.examples.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-[var(--hg-border)] px-4 py-8 text-center text-[12px] text-[var(--hg-dim)]">
                No sample cases published for this problem yet.
              </p>
            ) : (
              <>
                {problem.examples.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {problem.examples.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveExample(index)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          index === activeExample
                            ? "border-[var(--hg-cyan)]/50 bg-[var(--hg-cyan)]/10 text-[var(--hg-cyan)]"
                            : "border-[var(--hg-border)] text-[var(--hg-dim)] hover:border-[var(--hg-border-strong)] hover:text-[var(--hg-muted)]"
                        }`}
                      >
                        Case {index + 1}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--hg-muted)]">Input</span>
                    <pre className="mt-1.5 max-h-44 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--hg-border)] bg-[var(--hg-bg)] px-3 py-2.5 font-mono text-[12px] leading-relaxed text-[var(--hg-text)]">
                      {example.input || "(empty input)"}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--hg-muted)]">
                      Expected output
                    </span>
                    <pre className="mt-1.5 max-h-44 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--hg-border)] bg-[var(--hg-bg)] px-3 py-2.5 font-mono text-[12px] leading-relaxed text-[var(--hg-text)]">
                      {example.output || "(empty output)"}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <Editor
              height="100%"
              language={lang}
              value={codes[lang]}
              path={`solve://${problem.id}/${lang}`}
              keepCurrentModel
              theme="hg-dark"
              beforeMount={handleEditorWillMount}
              onChange={(value) => updateCode(value ?? "")}
              loading={
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="size-4 animate-spin text-[var(--hg-dim)]" />
                </div>
              }
              options={{
                fontSize: 13,
                fontFamily: EDITOR_FONT,
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                automaticLayout: true,
                tabSize: 4,
                renderLineHighlight: "all",
                smoothScrolling: true,
                cursorBlinking: "smooth",
                wordWrap: "on",
                lineNumbersMinChars: 3,
                bracketPairColorization: { enabled: true },
                guides: { indentation: true, bracketPairs: false },
                scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
              }}
            />
          </div>

          <div className="flex h-44 shrink-0 flex-col lg:h-56">
            <div className="flex h-9 shrink-0 items-center justify-between border-y border-[var(--hg-border)] bg-[var(--hg-bg-raised)] px-4">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--hg-dim)]">
                <Terminal className="size-3.5" /> Output
              </span>
              <span className="text-[11px] text-[var(--hg-dim)]">Ctrl + Enter to run</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {runState === "idle" && (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                  <Inbox className="size-5 text-[var(--hg-dim)]" />
                  <p className="text-[12px] text-[var(--hg-dim)]">
                    Run your code against the sample cases to see results.
                  </p>
                </div>
              )}

              {runState === "running" && (
                <div className="flex h-full items-center justify-center gap-2 px-4">
                  <Loader2 className="size-4 animate-spin text-[var(--hg-cyan)]" />
                  <span className="text-[12px] text-[var(--hg-muted)]">
                    {runMode === "run" ? "Running sample cases…" : "Submitting solution…"}
                  </span>
                </div>
              )}

              {runState === "done" && (
                <div className="p-3">
                  <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11.5px] font-medium text-amber-300">
                    The judge isn&apos;t connected in this build yet — wire up the execution
                    service to stream live results here.
                  </div>
                  <div className="mt-2 overflow-hidden rounded-lg border border-[var(--hg-border)] divide-y divide-[var(--hg-border)]">
                    {problem.examples.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-3 px-3 py-2">
                        <span className="shrink-0 font-mono text-[11px] font-semibold text-[var(--hg-muted)]">
                          Case {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[var(--hg-dim)]">
                          {item.input.split("\n")[0] || "(empty input)"}
                        </span>
                        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--hg-dim)]">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}