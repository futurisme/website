#!/usr/bin/env python3
"""Generate crawl assets (robots.txt and sitemap.xml) from vercel routes.

Keeps SEO crawl artifacts deterministic and aligned with deployed routing.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

BASE_URL = 'https://fadhil.dev'
ROOT = Path(__file__).resolve().parents[1]
VERCEL_PATH = ROOT / 'vercel.json'
ROBOTS_PATH = ROOT / 'website' / 'robots.txt'
SITEMAP_PATH = ROOT / 'website' / 'sitemap.xml'


def normalize_path(path: str) -> str:
    if not path.startswith('/'):
        path = '/' + path
    return path.rstrip('/') or '/'


def is_dynamic_route(src: str) -> bool:
    return bool(re.search(r'\((?:\.\*|\[0-9\]\+|\[\^\)\]\+)\)|\$\d+', src)) or any(ch in src for ch in '()[]+^')


def route_paths() -> list[str]:
    data = json.loads(VERCEL_PATH.read_text(encoding='utf-8'))
    paths = {'/'}

    for route in data.get('routes', []):
        src = route.get('src')
        if not isinstance(src, str) or not src.startswith('/'):
            continue
        if src in {'/$', '/'}:
            paths.add('/')
            continue
        if is_dynamic_route(src) or src.startswith('/api'):
            continue
        if re.search(r'\.[a-zA-Z0-9]{2,20}$', src):
            continue
        paths.add(normalize_path(src))

    # High-value canonical pages that are represented by dynamic route handlers.
    paths.update({'/books/editor', '/shareideas/page/1'})

    # Non-canonical alias to skip in sitemap.
    blacklist = {'/shareideas/page/1'}
    paths = {p for p in paths if p not in blacklist}

    return sorted(paths)


def build_sitemap_xml(paths: list[str]) -> str:
    def priority_for(path: str) -> str:
        if path == '/':
            return '1.0'
        if path in {'/home', '/portfolio'}:
            return '0.9'
        if path.startswith('/games/') or path in {'/animeindustry', '/rpg'}:
            return '0.7'
        return '0.8'

    def changefreq_for(path: str) -> str:
        if path in {'/', '/home', '/shareideas'}:
            return 'daily'
        return 'weekly'

    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path in paths:
        lines.extend([
            '  <url>',
            f'    <loc>{BASE_URL}{path}</loc>',
            f'    <changefreq>{changefreq_for(path)}</changefreq>',
            f'    <priority>{priority_for(path)}</priority>',
            '  </url>',
        ])
    lines.append('</urlset>')
    return '\n'.join(lines) + '\n'


def build_robots_txt() -> str:
    return '\n'.join([
        'User-agent: *',
        'Allow: /',
        '',
        '# Keep crawl budget focused on canonical public URLs.',
        'Disallow: /api/',
        'Disallow: /extension/',
        '',
        f'Sitemap: {BASE_URL}/sitemap.xml',
        '',
    ])


def main() -> None:
    paths = route_paths()
    ROBOTS_PATH.write_text(build_robots_txt(), encoding='utf-8')
    SITEMAP_PATH.write_text(build_sitemap_xml(paths), encoding='utf-8')
    print(f'Wrote {ROBOTS_PATH}')
    print(f'Wrote {SITEMAP_PATH}')
    print(f'Canonical sitemap URLs: {len(paths)}')


if __name__ == '__main__':
    main()
