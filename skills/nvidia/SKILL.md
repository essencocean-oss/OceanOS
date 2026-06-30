---
name: nvidia
description: NVIDIA integration for OceanOS. Provides access to Nemotron models for high-quality reasoning and NemoClaw for secure agent execution.
version: 0.2.0
author: OceanOS Team
tags: [nvidia, nemotron, nemoclaw, inference, security]
---

# NVIDIA Skill for OceanOS

## Overview
This skill integrates NVIDIA’s powerful models and secure runtime into OceanOS.

## Components
- **Nemotron**: High-performance reasoning models (Nemotron 3 Ultra and others)
- **NemoClaw**: Secure sandboxed execution environment for agents

## Key Principles
- High-quality reasoning via Nemotron models
- Safe execution through NemoClaw
- Clear configuration and model selection
- Production-grade security and auditability

## Environment Variables
```bash
NVIDIA_API_KEY=***
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

## Available Tools
- `route_to_nemotron` — Send prompts to Nemotron models
- `execute_in_nemoclaw` — Run tasks inside NemoClaw (future)

## Current Status (v0.2.0)
- Nemotron routing now has real API integration
- NemoClaw remains a structured placeholder pending runtime integration

This skill is foundational for running advanced, trustworthy agents in OceanOS.