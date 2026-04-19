#!/usr/bin/env python3
import json
import re
import time
import urllib.request
import urllib.parse
from pathlib import Path

BASE_URL = 'https://fadhil.dev'
TIMEOUT = 20


def collect_paths(vercel_path: Path):
    data = json.loads(vercel_path.read_text())
    paths = set(['/'])
    for route in data.get('routes', []):
        src = route.get('src')
        if not isinstance(src, str):
            continue
        if not src.startswith('/'):
            continue
        if src in ('/$',):
            paths.add('/')
            continue
        # skip regex-heavy patterns and add only deterministic paths
        if any(token in src for token in ['(.*)', '([0-9]+)', '$']):
            continue
        paths.add(src.rstrip('/') or '/')
    # sampled dynamic routes that are known active
    paths.update([
        '/mindmapmaker/editor/1',
        '/shareideas/page/1',
        '/Books/Editor',
    ])
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
        return {
            'path': path,
            'url': url,
            'status': 'ERR',
            'error': str(exc),
            'time_ms': round((time.perf_counter() - started) * 1000, 1),
        }

    duration_ms = round((time.perf_counter() - started) * 1000, 1)
    title_match = re.search(r'<title[^>]*>(.*?)</title>', body, re.I | re.S)
    title = re.sub(r'\s+', ' ', title_match.group(1)).strip() if title_match else ''

    has_meta_desc = bool(re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=', body, re.I))
    has_canonical = bool(re.search(r'<link[^>]+rel=["\']canonical["\']', body, re.I))

    deprecated_markers = []
    if re.search(r'<(font|center|marquee)\b', body, re.I):
        deprecated_markers.append('deprecated-html-tag')
    if re.search(r'jquery[-.]1\.|jquery[-.]2\.', body, re.I):
        deprecated_markers.append('legacy-jquery')

    js_bundle_count = len(re.findall(r'<script\b', body, re.I))
    css_bundle_count = len(re.findall(r'<link[^>]+stylesheet', body, re.I))

    return {
        'path': path,
        'url': url,
        'status': status,
        'final_url': final_url,
        'time_ms': duration_ms,
        'content_type': content_type,
        'title': title,
        'seo_basics': {
            'meta_description': has_meta_desc,
            'canonical': has_canonical,
        },
        'processing_hints': {
            'script_tags': js_bundle_count,
            'stylesheet_links': css_bundle_count,
        },
        'deprecated_flags': deprecated_markers,
    }


def main():
    root = Path(__file__).resolve().parents[1]
    paths = collect_paths(root / 'vercel.json')
    results = [fetch_path(path) for path in paths]

    summary = {
        'base_url': BASE_URL,
        'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'active_ok_count': sum(1 for row in results if row.get('status') == 200),
        'error_count': sum(1 for row in results if row.get('status') != 200),
        'paths_checked': len(results),
    }

    report = {'summary': summary, 'results': results}
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

    out_md = root / 'reports' / 'fadhil-dev-audit.md'
    out_md.write_text('\n'.join(lines) + '\n')
    print(f'Wrote {out_json}')
    print(f'Wrote {out_md}')


if __name__ == '__main__':
    main()
