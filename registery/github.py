from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import subprocess
import json
import os

github = FastAPI(title='OceanOS GitHub')

class IssueCreate(BaseModel):
    title: str
    body: str = ""
    assignees: Optional[List[str]] = None
    labels: Optional[List[str]] = None

def _run_gh(args: List[str]) -> Dict[str, Any]:
    """Run gh CLI and return parsed JSON on success."""
    result = subprocess.run(
        ["gh"] + args,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        stderr = result.stderr.lower()
        if "not logged in" in stderr or "authentication" in stderr or "login" in stderr:
            raise HTTPException(
                status_code=503,
                detail="GitHub CLI (gh) is not logged in. Run 'gh auth login'.",
            )
        raise HTTPException(
            status_code=500,
            detail=f"gh CLI failed: {result.stderr.strip()}",
        )
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"raw": result.stdout.strip()}

@github.get('/health')
def health():
    return {'status': 'ok', 'module': 'github-integration'}

@github.get('/user')
def get_user():
    return _run_gh(["api", "user", "--jq", "."])

@github.get('/repos')
def list_repos():
    data = _run_gh([
        "repo", "list",
        "--json", "nameWithOwner,url,private,updatedAt",
        "--limit", "100",
    ])
    if isinstance(data, dict) and "raw" in data:
        return []
    return data

@github.post('/repos/{owner}/{repo}/issues')
def create_issue(owner: str, repo: str, issue: IssueCreate):
    repo_id = f"{owner}/{repo}"
    data = _run_gh([
        "issue", "create",
        "--repo", repo_id,
        "--title", issue.title,
        "--body", issue.body,
    ])
    return {
        "created": True,
        "owner": owner,
        "repo": repo,
        "issue": data,
    }
