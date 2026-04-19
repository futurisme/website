#!/usr/bin/env python3
import hashlib
import json
import re
import subprocess
import time
import urllib.request
from pathlib import Path

BASE_URL = 'https://fadhil.dev'
TIMEOUT = 20
ACTIVE_PREFIXES = ('website/', 'games/', 'Assets/Public/Images/', 'library/')


def collect_paths(vercel_path: Path):
    data = json.loads(vercel_path.read_text())
    paths = set(['/'])
    for route in data.get('routes', []):
        src = route.get('src')
        if not isinstance(src, str) or not src.startswith('/'):
            continue
        if src == '/$':
            paths.add('/')
            continue
        if any(token in src for token in ['(.*)', '([0-9]+)', '$']):
            continue
        candidate = src.rstrip('/') or '/'
        if candidate.startswith('/api'):
            continue
        if re.search(r'\.[a-zA-Z0-9]{2,5}$', candidate):
            continue
        paths.add(candidate)

    paths.update(['/mindmapmaker/editor/1', '/shareideas/page/1', '/Books/Editor'])
    return sorted(paths)


def fetch_path(path: str):
    url = f"{BASE_URL}{path}"
    started = time.perf_counter()
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
            status = response.getcode()
            final_url = response.geturl()
            headers = {k.lower(): v for k, v in response.headers.items()}
            content_type = headers.get('content-type', '')
            body = response.read(450_000).decode('utf-8', 'ignore') if 'text/html' in content_type.lower() else ''
    except Exception as exc:
        return {'path': path, 'url': url, 'status': 'ERR', 'error': str(exc), 'time_ms': round((time.perf_counter() - started) * 1000, 1)}

    duration_ms = round((time.perf_counter() - started) * 1000, 1)
    title_match = re.search(r'<title[^>]*>(.*?)</title>', body, re.I | re.S)
    title = re.sub(r'\s+', ' ', title_match.group(1)).strip() if title_match else ''

    has_meta_desc = bool(re.search(r"<meta[^>]+name=['\"]description['\"][^>]+content=", body, re.I))
    has_canonical = bool(re.search(r"<link[^>]+rel=['\"]canonical['\"]", body, re.I))

    deprecated_markers = []
    if re.search(r'<(font|center|marquee)\b', body, re.I):
        deprecated_markers.append('deprecated-html-tag')
    if re.search(r'jquery[-.]1\.|jquery[-.]2\.', body, re.I):
        deprecated_markers.append('legacy-jquery')

    return {
        'path': path,
        'url': url,
        'status': status,
        'final_url': final_url,
        'time_ms': duration_ms,
        'content_type': content_type,
        'title': title,
        'seo_basics': {'meta_description': has_meta_desc, 'canonical': has_canonical},
        'processing_hints': {
            'script_tags': len(re.findall(r'<script\b', body, re.I)),
            'stylesheet_links': len(re.findall(r'<link[^>]+stylesheet', body, re.I)),
        },
        'deprecated_flags': deprecated_markers,
    }


def safe_rg_count(root: Path, pattern: str, file_self: str):
    proc = subprocess.run(['rg', '-n', pattern, '--', '.'], cwd=root, text=True, capture_output=True)
    lines = proc.stdout.splitlines() if proc.stdout else []
    return sum(1 for line in lines if not line.startswith(file_self + ':'))


def find_duplicate_files(root: Path):
    files = subprocess.check_output(['git', 'ls-files'], cwd=root, text=True).splitlines()
    hashed = {}
    sizes = {}
    for rel in files:
        p = root / rel
        if not p.is_file():
            continue
        raw = p.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        hashed.setdefault(digest, []).append(rel)
        sizes[rel] = len(raw)

    duplicate_groups = [group for group in hashed.values() if len(group) > 1]
    duplicate_groups.sort(key=lambda g: (-len(g), g[0]))

    analyses = []
    for group in duplicate_groups:
        items = []
        safe_candidates = []
        for rel in group:
            basename = re.escape(Path(rel).name)
            ref_count = safe_rg_count(root, basename, rel)
            in_active_scope = rel.startswith(ACTIVE_PREFIXES)
            can_delete = (ref_count == 0) and (not in_active_scope)
            if can_delete:
                safe_candidates.append(rel)
            items.append({
                'path': rel,
                'size_bytes': sizes.get(rel, 0),
                'reference_count': ref_count,
                'in_active_scope': in_active_scope,
                'safe_delete_candidate': can_delete,
            })

        analyses.append({
            'group_size': len(group),
            'group_total_bytes': sum(i['size_bytes'] for i in items),
            'safe_delete_candidates': safe_candidates,
            'items': items,
        })

    return analyses


def main():
    root = Path(__file__).resolve().parents[1]
    paths = collect_paths(root / 'vercel.json')
    results = [fetch_path(path) for path in paths]
    duplicate_analyses = find_duplicate_files(root)

    summary = {
        'base_url': BASE_URL,
        'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'paths_checked': len(results),
        'active_ok_count': sum(1 for row in results if row.get('status') == 200),
        'error_count': sum(1 for row in results if row.get('status') != 200),
        'duplicate_groups': len(duplicate_analyses),
        'safe_delete_candidate_groups': sum(1 for g in duplicate_analyses if g['safe_delete_candidates']),
    }

    report = {'summary': summary, 'results': results, 'duplicate_analysis': duplicate_analyses[:25]}
    out_json = root / 'reports' / 'fadhil-dev-audit.json'
    out_json.write_text(json.dumps(report, indent=2, ensure_ascii=False))

    lines = [
        '# fadhil.dev URL Audit',
        '',
        f"Generated: {summary['generated_at']}",
        '',
        f"- Paths checked: {summary['paths_checked']}",
        f"- HTTP 200: {summary['active_ok_count']}",
        f"- Non-200/Errors: {summary['error_count']}",
        f"- Duplicate file groups (top 25 shown): {summary['duplicate_groups']}",
        f"- Safe delete candidate groups: {summary['safe_delete_candidate_groups']}",
        '',
        '| Path | Status | Time (ms) | Meta Desc | Canonical | Deprecated |',
        '|---|---:|---:|:---:|:---:|:---:|',
    ]

    for row in results:
        seo = row.get('seo_basics', {})
        lines.append(
            f"| `{row.get('path')}` | {row.get('status')} | {row.get('time_ms')} | "
            f"{'✅' if seo.get('meta_description') else '❌'} | {'✅' if seo.get('canonical') else '❌'} | "
            f"{'⚠️' if row.get('deprecated_flags') else '✅'} |"
        )

    lines.extend(['', '## Duplicate analysis (top 25)', ''])
    for idx, group in enumerate(duplicate_analyses[:25], start=1):
        lines.append(f"### Group {idx} — files: {group['group_size']}, bytes: {group['group_total_bytes']}")
        lines.append('| File | Refs | Active Scope | Safe Delete Candidate |')
        lines.append('|---|---:|:---:|:---:|')
        for item in group['items']:
            lines.append(
                f"| `{item['path']}` | {item['reference_count']} | "
                f"{'✅' if item['in_active_scope'] else '❌'} | {'✅' if item['safe_delete_candidate'] else '❌'} |"
            )
        if group['safe_delete_candidates']:
            lines.append('Safe candidates: ' + ', '.join(f"`{x}`" for x in group['safe_delete_candidates']))
        lines.append('')

    out_md = root / 'reports' / 'fadhil-dev-audit.md'
    out_md.write_text('\n'.join(lines) + '\n')
    print(f'Wrote {out_json}')
    print(f'Wrote {out_md}')


if __name__ == '__main__':
    main()
