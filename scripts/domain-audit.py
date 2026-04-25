#!/usr/bin/env python3
import argparse
import hashlib
import json
import re
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

DEFAULT_BASE_URL = 'https://fadhil.dev'
DEFAULT_TIMEOUT = 20
DEFAULT_MAX_BODY_BYTES = 450_000
ACTIVE_PREFIXES = ('website/', 'games/', 'assets/public/images/', 'library/')


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Run domain and repository duplicate audit.')
    parser.add_argument('--base-url', default=DEFAULT_BASE_URL, help='Base URL to audit.')
    parser.add_argument('--timeout', type=int, default=DEFAULT_TIMEOUT, help='HTTP timeout in seconds.')
    parser.add_argument('--max-body-bytes', type=int, default=DEFAULT_MAX_BODY_BYTES, help='Max HTML bytes to read per path.')
    return parser.parse_args()


def is_dynamic_route(src: str) -> bool:
    return bool(re.search(r'\((?:\.\*|\[0-9\]\+|\[\^\)\]\+)\)|\$\d+', src))


def normalize_path(path: str) -> str:
    if not path.startswith('/'):
        path = '/' + path
    return path.rstrip('/') or '/'


def collect_paths(vercel_path: Path) -> list[str]:
    data = json.loads(vercel_path.read_text())
    routes = data.get('routes', [])
    paths = {'/'}

    for route in routes:
        src = route.get('src')
        if not isinstance(src, str) or not src.startswith('/'):
            continue
        if src in {'/$', '/'}:
            paths.add('/')
            continue
        if is_dynamic_route(src):
            continue
        candidate = normalize_path(src)
        if candidate.startswith('/api'):
            continue
        if re.search(r'\.[a-zA-Z0-9]{2,8}$', candidate):
            continue
        paths.add(candidate)

    # Dynamic route smoke samples.
    paths.update({'/mindmapmaker/editor/1', '/shareideas/page/1', '/books/editor'})
    return sorted(paths)


def extract_host(url: str) -> str:
    return urllib.parse.urlparse(url).netloc.lower()


def fetch_path(base_url: str, path: str, timeout: int, max_body_bytes: int) -> dict[str, Any]:
    url = f"{base_url}{path}"
    started = time.perf_counter()
    req = urllib.request.Request(url, headers={'User-Agent': 'futurisme-domain-audit/2.0'})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            status = response.getcode()
            final_url = response.geturl()
            headers = {k.lower(): v for k, v in response.headers.items()}
            content_type = headers.get('content-type', '')
            content_length = int(headers.get('content-length', '0') or 0)
            is_html = 'text/html' in content_type.lower()
            body = response.read(max_body_bytes).decode('utf-8', 'ignore') if is_html else ''
    except urllib.error.HTTPError as exc:
        duration_ms = round((time.perf_counter() - started) * 1000, 1)
        return {
            'path': path,
            'url': url,
            'status': exc.code,
            'error': str(exc),
            'time_ms': duration_ms,
        }
    except Exception as exc:
        duration_ms = round((time.perf_counter() - started) * 1000, 1)
        return {
            'path': path,
            'url': url,
            'status': 'ERR',
            'error': str(exc),
            'time_ms': duration_ms,
        }

    duration_ms = round((time.perf_counter() - started) * 1000, 1)
    title_match = re.search(r'<title[^>]*>(.*?)</title>', body, re.I | re.S)
    title = re.sub(r'\s+', ' ', title_match.group(1)).strip() if title_match else ''

    canonical_match = re.search(r'<link[^>]+rel=[\'\"]canonical[\'\"][^>]*href=[\'\"]([^\'\"]+)', body, re.I)
    canonical_href = canonical_match.group(1).strip() if canonical_match else ''

    has_meta_desc = bool(re.search(r"<meta[^>]+name=['\"]description['\"][^>]+content=", body, re.I))
    has_h1 = bool(re.search(r'<h1\b', body, re.I))
    noindex = bool(re.search(r'<meta[^>]+name=[\'\"]robots[\'\"][^>]+content=[\'\"][^\"\']*noindex', body, re.I))

    deprecated_markers: list[str] = []
    if re.search(r'<(font|center|marquee)\b', body, re.I):
        deprecated_markers.append('deprecated-html-tag')
    if re.search(r'jquery[-.]1\.|jquery[-.]2\.', body, re.I):
        deprecated_markers.append('legacy-jquery')

    parsed_final = urllib.parse.urlparse(final_url)
    final_path = parsed_final.path or '/'
    redirected = normalize_path(final_path) != normalize_path(path)
    final_scheme = parsed_final.scheme.lower()
    final_host = parsed_final.netloc.lower()
    redirect_target = final_url if redirected else ''

    return {
        'path': path,
        'url': url,
        'status': status,
        'final_url': final_url,
        'final_host': final_host,
        'final_scheme': final_scheme,
        'final_path': normalize_path(final_path),
        'is_https_final': final_scheme == 'https',
        'redirected': redirected,
        'redirect_target': redirect_target,
        'time_ms': duration_ms,
        'content_type': content_type,
        'content_length': content_length,
        'title': title,
        'seo_basics': {
            'meta_description': has_meta_desc,
            'canonical': bool(canonical_href),
            'canonical_href': canonical_href,
            'has_h1': has_h1,
            'noindex': noindex,
        },
        'processing_hints': {
            'script_tags': len(re.findall(r'<script\b', body, re.I)),
            'stylesheet_links': len(re.findall(r'<link[^>]+stylesheet', body, re.I)),
        },
        'deprecated_flags': deprecated_markers,
    }


def safe_rg_count(root: Path, pattern: str, file_self: str, fixed: bool = False) -> int:
    cmd = ['rg', '-n']
    if fixed:
        cmd.append('--fixed-strings')
    cmd.extend([pattern, '--', '.'])
    proc = subprocess.run(cmd, cwd=root, text=True, capture_output=True)
    lines = proc.stdout.splitlines() if proc.stdout else []
    return sum(1 for line in lines if not line.startswith(file_self + ':'))


def find_duplicate_files(root: Path) -> list[dict[str, Any]]:
    files = subprocess.check_output(['git', 'ls-files'], cwd=root, text=True).splitlines()
    hashed: dict[str, list[str]] = {}
    sizes: dict[str, int] = {}
    for rel in files:
        p = root / rel
        if not p.is_file():
            continue
        raw = p.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        hashed.setdefault(digest, []).append(rel)
        sizes[rel] = len(raw)

    duplicate_groups = [group for group in hashed.values() if len(group) > 1]

    analyses: list[dict[str, Any]] = []
    for group in duplicate_groups:
        items = []
        safe_candidates = []
        for rel in sorted(group):
            basename = Path(rel).name
            ref_count_by_basename = safe_rg_count(root, basename, rel, fixed=True)
            ref_count_by_exact_path = safe_rg_count(root, rel, rel, fixed=True)
            in_active_scope = rel.startswith(ACTIVE_PREFIXES)
            can_delete = (ref_count_by_exact_path == 0) and (not in_active_scope)
            if can_delete:
                safe_candidates.append(rel)
            items.append({
                'path': rel,
                'size_bytes': sizes.get(rel, 0),
                'reference_count_exact_path': ref_count_by_exact_path,
                'reference_count_basename': ref_count_by_basename,
                'in_active_scope': in_active_scope,
                'safe_delete_candidate': can_delete,
            })

        analyses.append({
            'group_size': len(group),
            'group_total_bytes': sum(i['size_bytes'] for i in items),
            'safe_delete_candidates': safe_candidates,
            'items': items,
        })

    analyses.sort(key=lambda g: (-g['group_total_bytes'], -g['group_size']))
    return analyses


def main() -> None:
    args = parse_args()
    root = Path(__file__).resolve().parents[1]
    paths = collect_paths(root / 'vercel.json')
    results = [fetch_path(args.base_url, path, args.timeout, args.max_body_bytes) for path in paths]
    duplicate_analyses = find_duplicate_files(root)

    meta_desc_missing = sum(1 for row in results if row.get('status') == 200 and not row.get('seo_basics', {}).get('meta_description'))
    canonical_missing = sum(1 for row in results if row.get('status') == 200 and not row.get('seo_basics', {}).get('canonical'))
    h1_missing = sum(1 for row in results if row.get('status') == 200 and not row.get('seo_basics', {}).get('has_h1'))
    non_https_final = sum(1 for row in results if row.get('status') == 200 and not row.get('is_https_final', False))

    summary = {
        'base_url': args.base_url,
        'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'paths_checked': len(results),
        'http_200_count': sum(1 for row in results if row.get('status') == 200),
        'redirect_count': sum(1 for row in results if row.get('redirected') is True),
        'error_count': sum(1 for row in results if row.get('status') not in {200, 301, 302, 307, 308}),
        'missing_meta_description_count': meta_desc_missing,
        'missing_canonical_count': canonical_missing,
        'missing_h1_count': h1_missing,
        'non_https_final_count': non_https_final,
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
        f"- Base URL: `{summary['base_url']}`",
        f"- Paths checked: {summary['paths_checked']}",
        f"- HTTP 200: {summary['http_200_count']}",
        f"- Redirects detected: {summary['redirect_count']}",
        f"- Non-200/Redirect errors: {summary['error_count']}",
        f"- Missing meta description (200 pages): {summary['missing_meta_description_count']}",
        f"- Missing canonical (200 pages): {summary['missing_canonical_count']}",
        f"- Missing H1 (200 pages): {summary['missing_h1_count']}",
        f"- Final URL not HTTPS (200 pages): {summary['non_https_final_count']}",
        f"- Duplicate file groups (top 25 shown): {summary['duplicate_groups']}",
        f"- Safe delete candidate groups: {summary['safe_delete_candidate_groups']}",
        '',
        '| Path | Status | Redirect | Redirect target | Time (ms) | Meta Desc | Canonical | H1 | Noindex | HTTPS Final | Deprecated |',
        '|---|---:|:---:|---|---:|:---:|:---:|:---:|:---:|:---:|:---:|',
    ]

    for row in results:
        seo = row.get('seo_basics', {})
        redirect_target = row.get('redirect_target') or '—'
        lines.append(
            f"| `{row.get('path')}` | {row.get('status')} | {'↪️' if row.get('redirected') else '—'} | `{redirect_target}` | {row.get('time_ms')} | "
            f"{'✅' if seo.get('meta_description') else '❌'} | {'✅' if seo.get('canonical') else '❌'} | "
            f"{'✅' if seo.get('has_h1') else '❌'} | {'⚠️' if seo.get('noindex') else '✅'} | "
            f"{'✅' if row.get('is_https_final') else '❌'} | {'⚠️' if row.get('deprecated_flags') else '✅'} |"
        )

    redirect_rows = [row for row in results if row.get('redirected')]
    if redirect_rows:
        lines.extend(['', '## Redirect details', '', '| Source Path | Final URL |', '|---|---|'])
        for row in redirect_rows:
            lines.append(f"| `{row.get('path')}` | `{row.get('final_url')}` |")

    error_rows = [row for row in results if row.get('status') not in {200, 301, 302, 307, 308}]
    if error_rows:
        lines.extend(['', '## Error details', '', '| Path | Status | Error |', '|---|---:|---|'])
        for row in error_rows:
            lines.append(f"| `{row.get('path')}` | {row.get('status')} | `{row.get('error', '')}` |")

    lines.extend(['', '## Duplicate analysis (top 25 by total bytes)', ''])
    for idx, group in enumerate(duplicate_analyses[:25], start=1):
        lines.append(f"### Group {idx} — files: {group['group_size']}, bytes: {group['group_total_bytes']}")
        lines.append('| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |')
        lines.append('|---|---:|---:|:---:|:---:|')
        for item in group['items']:
            lines.append(
                f"| `{item['path']}` | {item['reference_count_exact_path']} | {item['reference_count_basename']} | "
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
