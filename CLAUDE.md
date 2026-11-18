# karthiksurkanti.in: rules for agents and contributors

This repository **and** the site it builds (karthiksurkanti.in) are **public**.

## Rule 1: nothing that helps someone attack the home server

The site is served from the owner's home server. Never put any of the following in a page, a commit, a code comment or a commit message:

- IP addresses of any kind, the tailnet name or any `*.ts.net` hostname, internal hostnames.
- SSH usernames or targets, ports, tunnel IDs, device tags, API server endpoints.
- File paths of keys, tokens, certificates, backups, sudoers rules or root-owned scripts.
- Security posture: firewall state, what is exposed and how, missing encryption, weak spots.
- Exact versions of the server's OS, kernel or k3s; server hardware specs.
- Secret values of any kind.

Describe the home server only at the level of "a single-node k3s cluster at home, behind a Cloudflare Tunnel and Tailscale". Engineering detail lives at book.karthiksurkanti.in, under the same rule.

## Rule 2: personal details need the owner's yes

Phone number, email address, LinkedIn, education, grades, location and anything else from the owner's resume appear only after the owner approves each item.

## Rule 3: results are quoted, never rounded or invented

Every number on a case-study page comes from the project's own README or results files, with the same conditions. If a project hasn't measured something, the page says so instead of estimating.

## Enforcement and conventions

- `npm run check:confidential` runs before every build (CI fails too). It uses generic patterns only: never add a real value to it.
- Commits are authored by the owner only: no `Co-Authored-By` or "Generated with" lines.
- Changes go through pull requests for the owner to merge.
