# NVIDIA Skill for OceanOS

Integration with NVIDIA models (Nemotron) and secure execution environment (NemoClaw) for OceanOS.

## Features

- **Nemotron Routing**: Send prompts to high-performance Nemotron models
- **Real API Integration**: Uses NVIDIA's official inference endpoint
- **NemoClaw Support**: Structured client for future secure agent execution
- **Centralized Config**: All settings managed in `config.py`

## Environment Variables

```bash
export NVIDIA_API_KEY=***
export NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

## Available Tools

| Tool | Description |
|------|-------------|
| `route_to_nemotron` | Send prompts to Nemotron models |
| `execute_in_nemoclaw` | Run tasks inside NemoClaw (placeholder) |

## Current Status

- **Nemotron**: Fully functional with real API calls and error handling
- **NemoClaw**: Well-structured client ready for future integration (`nemoclaw_enabled=False` by default)

## Configuration

All settings are centralized in `config.py`:

- Default model
- Supported models list
- Request parameters (max tokens, temperature, timeout)
- NemoClaw toggle and safety level

## Security

- API key validation before every call
- Structured error handling
- Logging for auditability
- NemoClaw designed with security-first mindset

## Version

- Current: v0.2.0 (Improved error handling + package structure)