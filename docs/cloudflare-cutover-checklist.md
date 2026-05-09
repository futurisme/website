# Cloudflare Full Cutover Checklist (No Vercel)

If browser shows `DNS_PROBE_FINISHED_NXDOMAIN` for `https://fadhil.dev`, this is a DNS/delegation issue outside app code.

## 1) Domain DNS at registrar
- Set nameservers to the two Cloudflare nameservers shown in your Cloudflare dashboard for `fadhil.dev`.
- Wait propagation (typically minutes, may take up to 24h).

## 2) Cloudflare DNS records
- Add `CNAME` record:
  - `Name`: `@`
  - `Target`: `website.<your-subdomain>.workers.dev`
  - Proxy status: **Proxied** (orange cloud)
- Optional: add `CNAME` for `www` -> `@` (or directly to workers.dev), proxied.

## 3) Worker domain binding
- In Cloudflare Dashboard > Workers & Pages > website > Settings > Domains & Routes:
  - Add Custom Domain `fadhil.dev`
  - (Optional) add `www.fadhil.dev`

## 4) SSL/TLS
- SSL/TLS mode: **Full (strict)**.
- Edge Certificates: enable Universal SSL.

## 5) Verify routes
- Confirm these URLs return 200:
  - `/`
  - `/hype`
  - `/rpg`
  - `/home`
  - `/portfolio`
  - `/shareideas`
  - `/mindmapmaker`

## 6) Troubleshooting
- If `workers.dev` works but `fadhil.dev` fails: DNS/Custom Domain is not fully attached yet.
- If only subpaths fail: check Worker deploy version and route mapping in `src/index.js`.
