#!/usr/bin/env python3
"""High-confidence audit for static files that appear unreferenced in the deployed website."""

from __future__ import annotations

import fnmatch
import json
import subprocess
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REPORT_JSON = ROOT / 'reports' / 'unused-files-audit.json'
REPORT_MD = ROOT / 'reports' / 'unused-files-audit.md'

# Focus only on static-delivery scopes to avoid false positives from framework conventions.
TRACKED_PREFIXES = (
    'website/home/',
    'website/portfolio/',
    'website/shareideas/',
    'website/archives/',
    'website/website/',
    'games/',
    'assets/public/images/',
    'extension/',
)

CANDIDATE_EXTENSIONS = {
    '.html',
    '.css',
    '.js',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.gif',
    '.ico',
}

EXCLUDED_GLOBS = (
    'reports/*',
    'scripts/*',
    '**/*.test.*',
    '**/*-test.*',
)


def git_tracked_files() -> list[str]:
    out = subprocess.check_output(['git', 'ls-files'], cwd=ROOT, text=True)
    return [line.strip() for line in out.splitlines() if line.strip()]


def safe_read_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding='utf-8')
    except Exception:
        return None


def is_candidate_file(rel_path: str) -> bool:
    if not rel_path.startswith(TRACKED_PREFIXES):
        return False
    if any(fnmatch.fnmatch(rel_path, pattern) for pattern in EXCLUDED_GLOBS):
        return False
    ext = Path(rel_path).suffix.lower()
    return ext in CANDIDATE_EXTENSIONS


def collect_routed_files(files: list[str]) -> set[str]:
    routed: set[str] = set()
    vercel_path = ROOT / 'vercel.json'
    data = json.loads(vercel_path.read_text(encoding='utf-8'))

    for route in data.get('routes', []):
        dest = route.get('dest')
        if not isinstance(dest, str) or not dest.startswith('/'):
            continue
        normalized = dest.lstrip('/')

        # Dynamic route targets (e.g. /games/rpg/$1) still imply the folder is reachable.
        if '$' in normalized:
            static_prefix = normalized.split('$', 1)[0].rstrip('/')
            if static_prefix:
                for rel in files:
                    if rel.startswith(static_prefix + '/'):
                        routed.add(rel)
            continue

        if normalized in files:
            routed.add(normalized)

    for build in data.get('builds', []):
        src = build.get('src')
        if not isinstance(src, str):
            continue
        for rel in files:
            if fnmatch.fnmatch(rel, src):
                routed.add(rel)

    return routed


def build_reference_corpus(files: list[str]) -> list[tuple[str, str]]:
    corpus: list[tuple[str, str]] = []
    for rel in files:
        text = safe_read_text(ROOT / rel)
        if text is None:
            continue
        corpus.append((rel, text))
    return corpus


def count_exact_path_references(target: str, corpus: list[tuple[str, str]]) -> int:
    count = 0
    for rel, text in corpus:
        if rel == target:
            continue
        count += text.count(target)
    return count


def main() -> None:
    started_at = time.time()
    files = git_tracked_files()
    routed_files = collect_routed_files(files)
    corpus = build_reference_corpus(files)

    candidates = [rel for rel in files if is_candidate_file(rel)]

    potential_unused: list[dict[str, Any]] = []
    used_directly_count = 0
    referenced_count = 0

    for rel in candidates:
        exact_refs = count_exact_path_references(rel, corpus)
        used_by_route = rel in routed_files

        if used_by_route:
            used_directly_count += 1
            continue
        if exact_refs > 0:
            referenced_count += 1
            continue

        potential_unused.append(
            {
                'path': rel,
                'exact_reference_count': exact_refs,
                'extension': Path(rel).suffix.lower(),
            }
        )

    potential_unused.sort(key=lambda item: (item['extension'], item['path']))
    by_extension: dict[str, int] = defaultdict(int)
    for item in potential_unused:
        by_extension[item['extension']] += 1

    report = {
        'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(started_at)),
        'summary': {
            'tracked_files': len(files),
            'candidate_files': len(candidates),
            'used_via_vercel_config': used_directly_count,
            'used_via_exact_references': referenced_count,
            'potential_unused_files': len(potential_unused),
        },
        'potential_unused_by_extension': dict(sorted(by_extension.items())),
        'potential_unused_files': potential_unused,
        'notes': [
            'Audit scope is intentionally limited to static delivery folders to minimize false positives.',
            'A file is considered used when matched by vercel routes/builds or referenced by exact repository path.',
            'Dynamic runtime fetches may not be detected; validate before deletion.',
        ],
    }

    REPORT_JSON.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    md_lines = [
        '# Unused File Audit (Potential Candidates)',
        '',
        f"Generated: {report['generated_at']}",
        '',
        f"- Tracked files: {report['summary']['tracked_files']}",
        f"- Candidate files scanned: {report['summary']['candidate_files']}",
        f"- Used via Vercel routes/builds: {report['summary']['used_via_vercel_config']}",
        f"- Used via exact path references: {report['summary']['used_via_exact_references']}",
        f"- Potential unused files: {report['summary']['potential_unused_files']}",
        '',
        '## Potential unused by extension',
        '',
        '| Extension | Count |',
        '|---|---:|',
    ]

    for ext, count in report['potential_unused_by_extension'].items():
        md_lines.append(f'| `{ext}` | {count} |')

    md_lines.extend(['', '## Potential unused files', '', '| File | Exact path refs |', '|---|---:|'])

    for item in potential_unused:
        md_lines.append(f"| `{item['path']}` | {item['exact_reference_count']} |")

    md_lines.extend(['', '## Notes', ''])
    for note in report['notes']:
        md_lines.append(f'- {note}')

    REPORT_MD.write_text('\n'.join(md_lines) + '\n', encoding='utf-8')

    print(f'Wrote {REPORT_JSON}')
    print(f'Wrote {REPORT_MD}')


if __name__ == '__main__':
    main()
