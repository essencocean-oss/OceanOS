---
name: real-document-office
description: "Create real office documents on Windows: DOCX via python-docx, PDF via reportlab or fpdf2, and ODT via simple OpenDocument packaging. Runs natively without Office installed."
version: 0.1.0
author: essencocean-oss
tags:
  - office
  - docx
  - pdf
  - odt
  - documents
  - windows
---

# Real Document Office (Windows)

Generate real documents without requiring Microsoft Office installation.

## Scripts
- `scripts/create_doc.py` — create a DOCX/PDF/ODT from simple inputs
- `scripts/office_demo.py` — minimal runtime demo

## Run
```powershell
python skills\real-document-office\scripts\create_doc.py --title "Report" --body "Hello from HermesOS" --out report.docx
python skills\real-document-office\scripts\create_doc.py --title "Report" --body "Hello from HermesOS" --out report.pdf
```
