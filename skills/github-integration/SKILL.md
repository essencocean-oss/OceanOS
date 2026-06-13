---
name: github-integration
description: GitHub auth, repo lifecycle, PR flow, CI monitoring, and webhook sync.
author: OceanOS
tags:
  - github
  - ci
  - git
price_cents: 0
license_key_required: false
entrypoints:
  - command: python registery/github.py
    port: 8011
    protocol: http
---

# GitHub Integration Skill

Full GitHub integration layer:
- Auth via gh CLI
- Repo create / clone / fork / releases
- PR lifecycle, CI status
- Issue management
- Webhook-to-registry sync
