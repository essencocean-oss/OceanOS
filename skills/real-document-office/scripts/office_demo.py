from create_doc import main
import sys

sys.argv = [
    "create_doc.py",
    "--title", "Agent Demo",
    "--body", "This document was generated from a Windows-native Hermes skill.",
    "--out", "agent_demo.pdf",
]
main()
