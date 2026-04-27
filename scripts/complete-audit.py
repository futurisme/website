#!/usr/bin/env python3
"""Complete audit for fadhil.dev domain quality + repository efficiency signals.

This script merges the legacy domain-audit and unused-file-audit workflows into one
fast executable with unified outputs:
- reports/complete-audit.json
- reports/complete-audit.md
"""

from __future__ import annotations

import argparse
import fnmatch
import hashlib
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

DEFAULT_BASE_URL = 'https://fadhil.dev'
DEFAULT_TIMEOUT = 20
DEFAULT_MAX_BODY_BYTES = 450_000
DEFAULT_TOP_DUPLICATE_GROUPS = 25
SECURITY_HEADERS = (
    'content-security-policy',
    'strict-transport-security',
    'x-content-type-options',
    'referrer-policy',
)

ACTIVE_PREFIXES = ('website/', 'games/', 'assets/public/images/', 'library/')
STATIC_AUDIT_PREFIXES = (
    'website/home/',
    'website/portfolio/',
    'website/shareideas/',
    'website/archives/',
    'website/website/',
    'games/',
    'assets/public/images/',
    'extension/',
)
STATIC_AUDIT_EXTENSIONS = {
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
STATIC_AUDIT_EXCLUDED_GLOBS = (
    'reports/*',
    'scripts/*',
    '**/*.test.*',
    '**/*-test.*',
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Run complete domain + repository audit.')
    parser.add_argument('--base-url', default=DEFAULT_BASE_URL, help='Base URL to audit.')
    parser.add_argument('--timeout', type=int, default=DEFAULT_TIMEOUT, help='HTTP timeout in seconds.')
    parser.add_argument('--max-body-bytes', type=int, default=DEFAULT_MAX_BODY_BYTES, help='Max HTML bytes to read per path.')
    parser.add_argument('--top-duplicate-groups', type=int, default=DEFAULT_TOP_DUPLICATE_GROUPS, help='Max duplicate groups in report.')
    parser.add_argument('--workers', type=int, default=max(4, min(24, (os.cpu_count() or 8) * 2)), help='Parallel workers for network/domain audit.')
    return parser.parse_args()


def normalize_path(path: str) -> str:
    if not path.startswith('/'):
        path = '/' + path
    return path.rstrip('/') or '/'


def is_dynamic_route(src: str) -> bool:
    if '$' in src and src not in {'/$', '/'}:
        return True
    if re.search(r'\((?:\.\*|\[0-9\]\+|\[\^\)\]\+)\)', src):
        return True
    return bool(re.search(r'[\(\)\[\]\+\*\?]', src))


def collect_paths(vercel_path: Path) -> list[str]:
    data = json.loads(vercel_path.read_text(encoding='utf-8'))
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
        if candidate == '/404':
            continue
        if re.search(r'\.[a-zA-Z0-9]{2,20}$', candidate):
            continue
        paths.add(candidate)

    # Dynamic route smoke samples.
    paths.update({'/mindmapmaker/editor/1', '/shareideas/page/1', '/books/editor'})
    return sorted(paths)


def fetch_path(base_url: str, path: str, timeout: int, max_body_bytes: int) -> dict[str, Any]:
    url = f'{base_url}{path}'
    started = time.perf_counter()
    req = urllib.request.Request(url, headers={'User-Agent': 'futurisme-complete-audit/1.0'})

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
        return {'path': path, 'url': url, 'status': exc.code, 'error': str(exc), 'time_ms': duration_ms}
    except Exception as exc:  # noqa: BLE001
        duration_ms = round((time.perf_counter() - started) * 1000, 1)
        return {'path': path, 'url': url, 'status': 'ERR', 'error': str(exc), 'time_ms': duration_ms}

    duration_ms = round((time.perf_counter() - started) * 1000, 1)
    title_match = re.search(r'<title[^>]*>(.*?)</title>', body, re.I | re.S)
    canonical_match = re.search(r'<link[^>]+rel=[\'\"]canonical[\'\"][^>]*href=[\'\"]([^\'\"]+)', body, re.I)

    parsed_final = urllib.parse.urlparse(final_url)
    final_path = normalize_path(parsed_final.path or '/')
    redirected = final_path != normalize_path(path)

    return {
        'path': path,
        'url': url,
        'status': status,
        'time_ms': duration_ms,
        'final_url': final_url,
        'final_path': final_path,
        'is_https_final': parsed_final.scheme.lower() == 'https',
        'redirected': redirected,
        'redirect_target': final_url if redirected else '',
        'content_type': content_type,
        'content_length': content_length,
        'cache_control': headers.get('cache-control', ''),
        'security_headers': {name: bool(headers.get(name)) for name in SECURITY_HEADERS},
        'title': re.sub(r'\s+', ' ', title_match.group(1)).strip() if title_match else '',
        'seo_basics': {
            'meta_description': bool(re.search(r"<meta[^>]+name=['\"]description['\"][^>]+content=", body, re.I)),
            'canonical': bool(canonical_match),
            'canonical_href': canonical_match.group(1).strip() if canonical_match else '',
            'has_h1': bool(re.search(r'<h1\b', body, re.I)),
            'noindex': bool(re.search(r'<meta[^>]+name=[\'\"]robots[\'\"][^>]+content=[\'\"][^\"\']*noindex', body, re.I)),
            'html_lang': bool(re.search(r'<html[^>]+lang=[\'\"][^\'\"]+[\'\"]', body, re.I)),
            'og_title': bool(re.search(r"<meta[^>]+property=['\"]og:title['\"][^>]+content=", body, re.I)),
            'og_description': bool(re.search(r"<meta[^>]+property=['\"]og:description['\"][^>]+content=", body, re.I)),
            'twitter_card': bool(re.search(r"<meta[^>]+name=['\"]twitter:card['\"][^>]+content=", body, re.I)),
            'json_ld': bool(re.search(r"<script[^>]+type=['\"]application/ld\\+json['\"]", body, re.I)),
        },
        'processing_hints': {
            'script_tags': len(re.findall(r'<script\b', body, re.I)),
            'stylesheet_links': len(re.findall(r'<link[^>]+stylesheet', body, re.I)),
        },
        'deprecated_flags': [
            marker
            for marker, present in (
                ('deprecated-html-tag', bool(re.search(r'<(font|center|marquee)\b', body, re.I))),
                ('legacy-jquery', bool(re.search(r'jquery[-.]1\.|jquery[-.]2\.', body, re.I))),
            )
            if present
        ],
    }


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    idx = int((len(ordered) - 1) * p)
    return ordered[idx]


def fetch_text_endpoint(url: str, timeout: int) -> dict[str, Any]:
    started = time.perf_counter()
    req = urllib.request.Request(url, headers={'User-Agent': 'futurisme-complete-audit/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            status = response.getcode()
            body = response.read().decode('utf-8', 'ignore')
            headers = {k.lower(): v for k, v in response.headers.items()}
            duration_ms = round((time.perf_counter() - started) * 1000, 1)
            return {'url': url, 'status': status, 'body': body, 'headers': headers, 'time_ms': duration_ms}
    except urllib.error.HTTPError as exc:
        duration_ms = round((time.perf_counter() - started) * 1000, 1)
        return {'url': url, 'status': exc.code, 'error': str(exc), 'body': '', 'headers': {}, 'time_ms': duration_ms}
    except Exception as exc:  # noqa: BLE001
        duration_ms = round((time.perf_counter() - started) * 1000, 1)
        return {'url': url, 'status': 'ERR', 'error': str(exc), 'body': '', 'headers': {}, 'time_ms': duration_ms}


def find_duplicate_files(root: Path, top_n: int) -> tuple[list[dict[str, Any]], int]:
    files = subprocess.check_output(['git', 'ls-files'], cwd=root, text=True).splitlines()
    hashed: dict[str, list[str]] = {}
    sizes: dict[str, int] = {}
    text_corpus: list[tuple[str, str]] = []

    for rel in files:
        p = root / rel
        if not p.is_file():
            continue
        raw = p.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        hashed.setdefault(digest, []).append(rel)
        sizes[rel] = len(raw)
        text = safe_read_text(p)
        if text is not None:
            text_corpus.append((rel, text))

    duplicate_groups = [group for group in hashed.values() if len(group) > 1]

    analyses: list[dict[str, Any]] = []
    for group in duplicate_groups:
        items = []
        safe_candidates = []
        for rel in sorted(group):
            basename = Path(rel).name
            basename_refs = 0
            exact_refs = 0
            for scan_rel, scan_text in text_corpus:
                if scan_rel == rel:
                    continue
                basename_refs += scan_text.count(basename)
                exact_refs += scan_text.count(rel)
            in_active_scope = rel.startswith(ACTIVE_PREFIXES)
            can_delete = (exact_refs == 0) and (not in_active_scope)
            if can_delete:
                safe_candidates.append(rel)
            items.append(
                {
                    'path': rel,
                    'size_bytes': sizes.get(rel, 0),
                    'reference_count_exact_path': exact_refs,
                    'reference_count_basename': basename_refs,
                    'in_active_scope': in_active_scope,
                    'safe_delete_candidate': can_delete,
                }
            )

        analyses.append(
            {
                'group_size': len(group),
                'group_total_bytes': sum(i['size_bytes'] for i in items),
                'safe_delete_candidates': safe_candidates,
                'items': items,
            }
        )

    analyses.sort(key=lambda g: (-g['group_total_bytes'], -g['group_size']))
    return analyses[:top_n], len(duplicate_groups)


def safe_read_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding='utf-8')
    except Exception:
        return None


def is_static_candidate(rel_path: str) -> bool:
    if not rel_path.startswith(STATIC_AUDIT_PREFIXES):
        return False
    if any(fnmatch.fnmatch(rel_path, pattern) for pattern in STATIC_AUDIT_EXCLUDED_GLOBS):
        return False
    return Path(rel_path).suffix.lower() in STATIC_AUDIT_EXTENSIONS


def collect_routed_files(files: list[str], vercel_data: dict[str, Any]) -> set[str]:
    routed: set[str] = set()

    for route in vercel_data.get('routes', []):
        dest = route.get('dest')
        if not isinstance(dest, str) or not dest.startswith('/'):
            continue
        normalized = dest.lstrip('/')

        if '$' in normalized:
            static_prefix = normalized.split('$', 1)[0].rstrip('/')
            if static_prefix:
                for rel in files:
                    if rel.startswith(static_prefix + '/'):
                        routed.add(rel)
            continue

        if normalized in files:
            routed.add(normalized)

    for build in vercel_data.get('builds', []):
        src = build.get('src')
        if not isinstance(src, str):
            continue
        for rel in files:
            if vercel_glob_match(rel, src):
                routed.add(rel)

    return routed


def count_exact_path_references(target: str, corpus: list[tuple[str, str]]) -> int:
    count = 0
    for rel, text in corpus:
        if rel == target:
            continue
        count += text.count(target)
    return count


def find_potential_unused_static_files(root: Path, vercel_data: dict[str, Any]) -> dict[str, Any]:
    files = subprocess.check_output(['git', 'ls-files'], cwd=root, text=True).splitlines()
    candidates = [rel for rel in files if is_static_candidate(rel)]
    routed_files = collect_routed_files(files, vercel_data)
    corpus = [(rel, text) for rel in files if (text := safe_read_text(root / rel)) is not None]

    potential_unused: list[dict[str, Any]] = []
    used_via_vercel = 0
    used_via_refs = 0

    for rel in candidates:
        refs = count_exact_path_references(rel, corpus)
        if rel in routed_files:
            used_via_vercel += 1
            continue
        if refs > 0:
            used_via_refs += 1
            continue
        potential_unused.append({'path': rel, 'exact_reference_count': refs, 'extension': Path(rel).suffix.lower()})

    potential_unused.sort(key=lambda x: (x['extension'], x['path']))
    by_extension: dict[str, int] = defaultdict(int)
    for item in potential_unused:
        by_extension[item['extension']] += 1

    return {
        'summary': {
            'tracked_files': len(files),
            'candidate_files': len(candidates),
            'used_via_vercel_config': used_via_vercel,
            'used_via_exact_references': used_via_refs,
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


def audit_vercel_targets(root: Path, vercel_data: dict[str, Any]) -> dict[str, Any]:
    files = subprocess.check_output(['git', 'ls-files'], cwd=root, text=True).splitlines()
    file_set = set(files)

    route_issues: list[dict[str, str]] = []
    build_issues: list[dict[str, str]] = []

    for route in vercel_data.get('routes', []):
        src = route.get('src')
        dest = route.get('dest')
        if not isinstance(src, str) or not isinstance(dest, str) or not dest.startswith('/'):
            continue
        dest_rel = dest.lstrip('/')

        if '$' in dest_rel:
            prefix = dest_rel.split('$', 1)[0].rstrip('/')
            matched = any(rel.startswith(prefix + '/') for rel in files) if prefix else False
            if not matched:
                route_issues.append({'src': src, 'dest': dest, 'reason': 'dynamic-target-prefix-has-no-files'})
            continue

        if dest_rel not in file_set:
            route_issues.append({'src': src, 'dest': dest, 'reason': 'target-file-not-found'})

    for build in vercel_data.get('builds', []):
        src = build.get('src')
        if not isinstance(src, str):
            continue
        if not any(vercel_glob_match(rel, src) for rel in files):
            build_issues.append({'src': src, 'reason': 'build-glob-has-no-matches'})

    return {
        'summary': {
            'route_target_issues': len(route_issues),
            'build_glob_issues': len(build_issues),
        },
        'route_target_issues': route_issues,
        'build_glob_issues': build_issues,
    }


def vercel_glob_match(path: str, pattern: str) -> bool:
    if fnmatch.fnmatch(path, pattern):
        return True
    # Vercel-style globs frequently use `**/*` while Python fnmatch can miss
    # single-level files for some patterns depending on shell-style semantics.
    if '/**/*' in pattern:
        prefix = pattern.split('/**/*', 1)[0].rstrip('/')
        if prefix and path.startswith(prefix + '/'):
            return True
    if '/**/' in pattern:
        single_level_pattern = pattern.replace('/**/', '/')
        if fnmatch.fnmatch(path, single_level_pattern):
            return True
    return False


def build_markdown(report: dict[str, Any], top_duplicates: int) -> str:
    summary = report['summary']
    domain = report['domain']
    static = report['static_unused_audit']
    vercel_cfg = report['vercel_target_audit']
    crawl = report['crawl_support_audit']
    local_crawl = report['local_crawl_audit']
    local_html = report['local_html_audit']

    lines = [
        '# Complete Audit — fadhil.dev',
        '',
        f"Generated: {summary['generated_at']}",
        '',
        '## Executive Summary',
        '',
        f"- Base URL: `{summary['base_url']}`",
        f"- Paths checked: {domain['summary']['paths_checked']}",
        f"- HTTP 200: {domain['summary']['http_200_count']}",
        f"- Errors (non-200/redirect): {domain['summary']['error_count']}",
        f"- Missing meta description: {domain['summary']['missing_meta_description_count']}",
        f"- Missing canonical: {domain['summary']['missing_canonical_count']}",
        f"- Missing H1: {domain['summary']['missing_h1_count']}",
        f"- Missing HTML lang: {domain['summary']['missing_html_lang_count']}",
        f"- Missing OG title: {domain['summary']['missing_og_title_count']}",
        f"- Missing OG description: {domain['summary']['missing_og_description_count']}",
        f"- Missing twitter:card: {domain['summary']['missing_twitter_card_count']}",
        f"- Missing JSON-LD: {domain['summary']['missing_json_ld_count']}",
        f"- Duplicate file groups (all): {summary['duplicate_groups_total']}",
        f"- Potential unused static files: {static['summary']['potential_unused_files']}",
        f"- Missing security headers (CSP/HSTS/XCTO/Referrer): {domain['summary']['missing_security_headers_count']}",
        f"- Avg response time (ms): {domain['summary']['avg_response_time_ms']}",
        f"- P95 response time (ms): {domain['summary']['p95_response_time_ms']}",
        f"- Vercel route target issues: {vercel_cfg['summary']['route_target_issues']}",
        f"- Vercel build glob issues: {vercel_cfg['summary']['build_glob_issues']}",
        f"- robots.txt status: {crawl['robots']['status']}",
        f"- sitemap.xml status: {crawl['sitemap']['status']}",
        f"- Sitemap URL count: {crawl['summary']['sitemap_url_count']}",
        f"- Sitemap coverage gap (audited routes not in sitemap): {crawl['summary']['audited_route_not_in_sitemap_count']}",
        f"- Local robots/sitemap ready: {'yes' if (local_crawl['summary']['robots_exists'] and local_crawl['summary']['sitemap_exists']) else 'no'}",
        f"- Local sitemap coverage gap: {local_crawl['summary']['audited_route_not_in_sitemap_count']}",
        f"- Local HTML files audited: {local_html['summary']['html_files_audited']}",
        f"- Local HTML missing robots meta: {local_html['summary']['missing_robots_count']}",
        f"- Local HTML missing OG title: {local_html['summary']['missing_og_title_count']}",
        f"- Local HTML missing twitter:card: {local_html['summary']['missing_twitter_card_count']}",
        '',
        '## Domain Route Audit',
        '',
        '| Path | Status | Redirect | Time (ms) | Meta Desc | Canonical | H1 | OG | Tw | JSON-LD | HTTPS | SecHdr | Deprecated |',
        '|---|---:|:---:|---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|',
    ]

    for row in domain['results']:
        seo = row.get('seo_basics', {})
        lines.append(
            f"| `{row.get('path')}` | {row.get('status')} | {'↪️' if row.get('redirected') else '—'} | {row.get('time_ms')} | "
            f"{'✅' if seo.get('meta_description') else '❌'} | {'✅' if seo.get('canonical') else '❌'} | "
            f"{'✅' if seo.get('has_h1') else '❌'} | {'✅' if seo.get('og_title') else '❌'} | "
            f"{'✅' if seo.get('twitter_card') else '❌'} | {'✅' if seo.get('json_ld') else '❌'} | "
            f"{'✅' if row.get('is_https_final') else '❌'} | "
            f"{'✅' if all(row.get('security_headers', {}).values()) else '❌'} | "
            f"{'⚠️' if row.get('deprecated_flags') else '✅'} |"
        )

    error_rows = [row for row in domain['results'] if row.get('status') not in {200, 301, 302, 307, 308}]
    if error_rows:
        lines.extend(['', '### Route Errors', '', '| Path | Status | Error |', '|---|---:|---|'])
        for row in error_rows:
            lines.append(f"| `{row.get('path')}` | {row.get('status')} | `{row.get('error', '')}` |")

    lines.extend([
        '',
        '## Security Header Coverage (HTTP 200 pages)',
        '',
        '| Header | Missing Count |',
        '|---|---:|',
    ])
    for header, missing_count in domain['summary']['missing_security_header_details'].items():
        lines.append(f'| `{header}` | {missing_count} |')

    lines.extend([
        '',
        '## Vercel Target Integrity',
        '',
        f"- Route target issues: {vercel_cfg['summary']['route_target_issues']}",
        f"- Build glob issues: {vercel_cfg['summary']['build_glob_issues']}",
    ])
    if vercel_cfg['route_target_issues']:
        lines.extend(['', '| Route src | Route dest | Reason |', '|---|---|---|'])
        for issue in vercel_cfg['route_target_issues']:
            lines.append(f"| `{issue['src']}` | `{issue['dest']}` | `{issue['reason']}` |")
    if vercel_cfg['build_glob_issues']:
        lines.extend(['', '| Build src | Reason |', '|---|---|'])
        for issue in vercel_cfg['build_glob_issues']:
            lines.append(f"| `{issue['src']}` | `{issue['reason']}` |")

    lines.extend([
        '',
        '## Crawl Support Audit (robots + sitemap)',
        '',
        '| Endpoint | Status | Time (ms) | Notes |',
        '|---|---:|---:|---|',
        f"| `/robots.txt` | {crawl['robots']['status']} | {crawl['robots']['time_ms']} | `{crawl['summary']['robots_note']}` |",
        f"| `/sitemap.xml` | {crawl['sitemap']['status']} | {crawl['sitemap']['time_ms']} | `{crawl['summary']['sitemap_note']}` |",
    ])
    if crawl['audited_routes_missing_in_sitemap']:
        lines.extend(['', '| Audited route missing in sitemap |', '|---|'])
        for route in crawl['audited_routes_missing_in_sitemap']:
            lines.append(f'| `{route}` |')

    lines.extend([
        '',
        '## Local Crawl Asset Audit (Repository)',
        '',
        f"- robots.txt exists: {'yes' if local_crawl['summary']['robots_exists'] else 'no'}",
        f"- sitemap.xml exists: {'yes' if local_crawl['summary']['sitemap_exists'] else 'no'}",
        f"- robots user-agent wildcard: {'yes' if local_crawl['summary']['robots_has_user_agent_wildcard'] else 'no'}",
        f"- robots sitemap directive: {'yes' if local_crawl['summary']['robots_has_sitemap_directive'] else 'no'}",
        f"- local sitemap URL count: {local_crawl['summary']['sitemap_url_count']}",
        f"- local sitemap coverage gap: {local_crawl['summary']['audited_route_not_in_sitemap_count']}",
    ])
    if local_crawl['audited_routes_missing_in_sitemap']:
        lines.extend(['', '| Local sitemap missing route |', '|---|'])
        for route in local_crawl['audited_routes_missing_in_sitemap']:
            lines.append(f'| `{route}` |')

    lines.extend([
        '',
        f'## Duplicate File Analysis (Top {top_duplicates})',
        '',
    ])

    for idx, group in enumerate(report['duplicate_analysis'], start=1):
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

    lines.extend([
        '## Static Unused File Audit (High Confidence)',
        '',
        f"- Candidate files scanned: {static['summary']['candidate_files']}",
        f"- Used via vercel config: {static['summary']['used_via_vercel_config']}",
        f"- Used via exact references: {static['summary']['used_via_exact_references']}",
        f"- Potential unused files: {static['summary']['potential_unused_files']}",
        '',
        '| Extension | Count |',
        '|---|---:|',
    ])

    for ext, count in static['potential_unused_by_extension'].items():
        lines.append(f'| `{ext}` | {count} |')

    lines.extend(['', '| Potential unused file | Exact path refs |', '|---|---:|'])
    for item in static['potential_unused_files']:
        lines.append(f"| `{item['path']}` | {item['exact_reference_count']} |")

    lines.extend([
        '',
        '## Local HTML Metadata Coverage Audit',
        '',
        f"- HTML files audited: {local_html['summary']['html_files_audited']}",
        f"- Missing `<title>`: {local_html['summary']['missing_title_count']}",
        f"- Missing meta description: {local_html['summary']['missing_description_count']}",
        f"- Missing canonical: {local_html['summary']['missing_canonical_count']}",
        f"- Missing robots: {local_html['summary']['missing_robots_count']}",
        f"- Missing Open Graph title: {local_html['summary']['missing_og_title_count']}",
        f"- Missing Open Graph description: {local_html['summary']['missing_og_description_count']}",
        f"- Missing Twitter card: {local_html['summary']['missing_twitter_card_count']}",
        f"- Missing JSON-LD: {local_html['summary']['missing_json_ld_count']}",
        f"- Missing HTML lang: {local_html['summary']['missing_html_lang_count']}",
        f"- Missing H1: {local_html['summary']['missing_h1_count']}",
        '',
        '| Missing check | Count |',
        '|---|---:|',
    ])
    for key, count in local_html['summary']['missing_by_check'].items():
        lines.append(f'| `{key}` | {count} |')
    if local_html['top_files_with_most_gaps']:
        lines.extend(['', '| File | Gap Count | Missing checks |', '|---|---:|---|'])
        for item in local_html['top_files_with_most_gaps']:
            lines.append(f"| `{item['path']}` | {item['gap_count']} | `{', '.join(item['missing_checks'])}` |")

    lines.extend(['', '### Notes', ''])
    for note in static['notes']:
        lines.append(f'- {note}')
    lines.append('- Local HTML metadata coverage audit is static repository inspection and should be paired with live deployment checks.')

    return '\n'.join(lines) + '\n'


def audit_crawl_support(base_url: str, timeout: int, audited_paths: list[str]) -> dict[str, Any]:
    robots = fetch_text_endpoint(f'{base_url}/robots.txt', timeout)
    sitemap = fetch_text_endpoint(f'{base_url}/sitemap.xml', timeout)

    robots_body = robots.get('body', '')
    sitemap_body = sitemap.get('body', '')

    has_user_agent = bool(re.search(r'(?im)^User-agent\s*:\s*\*', robots_body))
    has_sitemap_line = bool(re.search(r'(?im)^Sitemap\s*:\s*https?://', robots_body))
    sitemap_urls = sorted(set(re.findall(r'<loc>(https?://[^<]+)</loc>', sitemap_body)))
    sitemap_paths = {normalize_path(urllib.parse.urlparse(url).path or '/') for url in sitemap_urls}

    expected_paths = {
        path for path in audited_paths
        if path not in {'/archives/([^/.]+)', '/mindmapmaker/editor/1', '/shareideas/page/1'}
    }
    missing_in_sitemap = sorted(path for path in expected_paths if path not in sitemap_paths)

    robots_note_parts = []
    robots_note_parts.append('user-agent-ok' if has_user_agent else 'user-agent-missing')
    robots_note_parts.append('sitemap-ok' if has_sitemap_line else 'sitemap-missing')
    sitemap_note = f'url-count={len(sitemap_urls)}'

    return {
        'robots': {
            'status': robots.get('status'),
            'time_ms': robots.get('time_ms', 0),
            'has_user_agent_wildcard': has_user_agent,
            'has_sitemap_directive': has_sitemap_line,
        },
        'sitemap': {
            'status': sitemap.get('status'),
            'time_ms': sitemap.get('time_ms', 0),
            'url_count': len(sitemap_urls),
        },
        'sitemap_urls': sitemap_urls,
        'audited_routes_missing_in_sitemap': missing_in_sitemap,
        'summary': {
            'robots_note': ','.join(robots_note_parts),
            'sitemap_note': sitemap_note,
            'sitemap_url_count': len(sitemap_urls),
            'audited_route_not_in_sitemap_count': len(missing_in_sitemap),
        },
    }


def audit_local_crawl_assets(root: Path, audited_paths: list[str]) -> dict[str, Any]:
    robots_path = root / 'website' / 'robots.txt'
    sitemap_path = root / 'website' / 'sitemap.xml'

    robots_text = robots_path.read_text(encoding='utf-8') if robots_path.exists() else ''
    sitemap_text = sitemap_path.read_text(encoding='utf-8') if sitemap_path.exists() else ''

    robots_has_user_agent = bool(re.search(r'(?im)^User-agent\s*:\s*\*', robots_text))
    robots_has_sitemap = bool(re.search(r'(?im)^Sitemap\s*:\s*https?://', robots_text))
    local_sitemap_urls = sorted(set(re.findall(r'<loc>(https?://[^<]+)</loc>', sitemap_text)))
    local_sitemap_paths = {normalize_path(urllib.parse.urlparse(url).path or '/') for url in local_sitemap_urls}

    expected_paths = {
        path for path in audited_paths
        if path not in {'/archives/([^/.]+)', '/mindmapmaker/editor/1', '/shareideas/page/1'}
    }
    missing_paths = sorted(path for path in expected_paths if path not in local_sitemap_paths)

    return {
        'summary': {
            'robots_exists': robots_path.exists(),
            'sitemap_exists': sitemap_path.exists(),
            'robots_has_user_agent_wildcard': robots_has_user_agent,
            'robots_has_sitemap_directive': robots_has_sitemap,
            'sitemap_url_count': len(local_sitemap_urls),
            'audited_route_not_in_sitemap_count': len(missing_paths),
        },
        'audited_routes_missing_in_sitemap': missing_paths,
    }


def audit_local_html_metadata(root: Path) -> dict[str, Any]:
    files = subprocess.check_output(['git', 'ls-files', '*.html'], cwd=root, text=True).splitlines()
    scoped_files = [f for f in files if f.startswith(('website/', 'games/'))]

    checks = {
        'title': re.compile(r'<title[^>]*>.+?</title>', re.I | re.S),
        'meta_description': re.compile(r'<meta[^>]+name=["\']description["\'][^>]+content=', re.I),
        'canonical': re.compile(r'<link[^>]+rel=["\']canonical["\'][^>]+href=', re.I),
        'robots': re.compile(r'<meta[^>]+name=["\']robots["\'][^>]+content=', re.I),
        'og_title': re.compile(r'<meta[^>]+property=["\']og:title["\'][^>]+content=', re.I),
        'og_description': re.compile(r'<meta[^>]+property=["\']og:description["\'][^>]+content=', re.I),
        'twitter_card': re.compile(r'<meta[^>]+(?:name|property)=["\']twitter:card["\'][^>]+content=', re.I),
        'json_ld': re.compile(r'<script[^>]+type=["\']application/ld\+json["\']', re.I),
        'html_lang': re.compile(r'<html[^>]+lang=["\'][^"\']+["\']', re.I),
        'h1': re.compile(r'<h1\b', re.I),
    }

    missing_counts: dict[str, int] = {name: 0 for name in checks}
    files_with_gaps: list[dict[str, Any]] = []

    for rel in scoped_files:
        text = (root / rel).read_text(encoding='utf-8', errors='ignore')
        missing = [name for name, pattern in checks.items() if not pattern.search(text)]
        for name in missing:
            missing_counts[name] += 1
        if missing:
            files_with_gaps.append({'path': rel, 'gap_count': len(missing), 'missing_checks': missing})

    files_with_gaps.sort(key=lambda item: (-item['gap_count'], item['path']))
    return {
        'summary': {
            'html_files_audited': len(scoped_files),
            'missing_title_count': missing_counts['title'],
            'missing_description_count': missing_counts['meta_description'],
            'missing_canonical_count': missing_counts['canonical'],
            'missing_robots_count': missing_counts['robots'],
            'missing_og_title_count': missing_counts['og_title'],
            'missing_og_description_count': missing_counts['og_description'],
            'missing_twitter_card_count': missing_counts['twitter_card'],
            'missing_json_ld_count': missing_counts['json_ld'],
            'missing_html_lang_count': missing_counts['html_lang'],
            'missing_h1_count': missing_counts['h1'],
            'missing_by_check': missing_counts,
        },
        'top_files_with_most_gaps': files_with_gaps[:30],
    }


def main() -> None:
    args = parse_args()
    root = Path(__file__).resolve().parents[1]
    vercel_data = json.loads((root / 'vercel.json').read_text(encoding='utf-8'))

    started = time.time()
    paths = collect_paths(root / 'vercel.json')
    domain_results: list[dict[str, Any]] = []
    path_order = {path: idx for idx, path in enumerate(paths)}
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        future_map = {
            executor.submit(fetch_path, args.base_url, path, args.timeout, args.max_body_bytes): path
            for path in paths
        }
        for future in as_completed(future_map):
            domain_results.append(future.result())
    domain_results.sort(key=lambda row: path_order.get(row.get('path', '/'), 10**9))

    duplicate_analysis, duplicate_groups_total = find_duplicate_files(root, args.top_duplicate_groups)
    static_unused = find_potential_unused_static_files(root, vercel_data)
    vercel_target_audit = audit_vercel_targets(root, vercel_data)
    crawl_support_audit = audit_crawl_support(args.base_url, args.timeout, paths)
    local_crawl_audit = audit_local_crawl_assets(root, paths)
    local_html_audit = audit_local_html_metadata(root)

    successful_rows = [row for row in domain_results if row.get('status') == 200]
    response_times = [float(row.get('time_ms', 0.0)) for row in domain_results if isinstance(row.get('time_ms'), (int, float))]
    missing_security_header_details = {
        header: sum(1 for row in successful_rows if not row.get('security_headers', {}).get(header))
        for header in SECURITY_HEADERS
    }
    domain_summary = {
        'paths_checked': len(domain_results),
        'http_200_count': sum(1 for row in domain_results if row.get('status') == 200),
        'redirect_count': sum(1 for row in domain_results if row.get('redirected') is True),
        'error_count': sum(1 for row in domain_results if row.get('status') not in {200, 301, 302, 307, 308}),
        'missing_meta_description_count': sum(1 for row in domain_results if row.get('status') == 200 and not row.get('seo_basics', {}).get('meta_description')),
        'missing_canonical_count': sum(1 for row in domain_results if row.get('status') == 200 and not row.get('seo_basics', {}).get('canonical')),
        'missing_h1_count': sum(1 for row in domain_results if row.get('status') == 200 and not row.get('seo_basics', {}).get('has_h1')),
        'missing_html_lang_count': sum(1 for row in domain_results if row.get('status') == 200 and not row.get('seo_basics', {}).get('html_lang')),
        'missing_og_title_count': sum(1 for row in domain_results if row.get('status') == 200 and not row.get('seo_basics', {}).get('og_title')),
        'missing_og_description_count': sum(1 for row in domain_results if row.get('status') == 200 and not row.get('seo_basics', {}).get('og_description')),
        'missing_twitter_card_count': sum(1 for row in domain_results if row.get('status') == 200 and not row.get('seo_basics', {}).get('twitter_card')),
        'missing_json_ld_count': sum(1 for row in domain_results if row.get('status') == 200 and not row.get('seo_basics', {}).get('json_ld')),
        'non_https_final_count': sum(1 for row in domain_results if row.get('status') == 200 and not row.get('is_https_final', False)),
        'avg_response_time_ms': round(sum(response_times) / len(response_times), 1) if response_times else 0.0,
        'p95_response_time_ms': round(percentile(response_times, 0.95), 1),
        'max_response_time_ms': round(max(response_times), 1) if response_times else 0.0,
        'missing_security_headers_count': sum(missing_security_header_details.values()),
        'missing_security_header_details': missing_security_header_details,
    }

    report = {
        'summary': {
            'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(started)),
            'base_url': args.base_url,
            'duplicate_groups_total': duplicate_groups_total,
            'elapsed_seconds': round(time.time() - started, 2),
        },
        'domain': {'summary': domain_summary, 'results': domain_results},
        'duplicate_analysis': duplicate_analysis,
        'static_unused_audit': static_unused,
        'vercel_target_audit': vercel_target_audit,
        'crawl_support_audit': crawl_support_audit,
        'local_crawl_audit': local_crawl_audit,
        'local_html_audit': local_html_audit,
    }

    out_json = root / 'reports' / 'complete-audit.json'
    out_md = root / 'reports' / 'complete-audit.md'
    out_json.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    out_md.write_text(build_markdown(report, args.top_duplicate_groups), encoding='utf-8')

    print(f'Wrote {out_json}')
    print(f'Wrote {out_md}')


if __name__ == '__main__':
    main()
