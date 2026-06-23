from fastapi import FastAPI, HTTPException
import os, json, shutil, subprocess

sandbox = FastAPI(title='OceanOS Sandbox Registry')
REGISTRY_PATH = 'skills'
DEFAULT_IMAGE = os.environ.get('HERMES_SANDBOX_IMAGE', 'python:3.11-slim')
DOCKER_CMD = os.environ.get('HERMES_DOCKER_CMD', 'docker')


def _run(cmd, **kw):
    p = subprocess.run(cmd, capture_output=True, text=True, **kw)
    return p.returncode, p.stdout, p.stderr


def _docker_available() -> bool:
    rc, _, _ = _run([DOCKER_CMD, 'info'])
    return rc == 0


def _copy_skill_dir(src: str, dest: str) -> int:
    copied = 0
    for root, _dirs, files in os.walk(src):
        rel = os.path.relpath(root, src)
        target_root = os.path.join(dest, rel) if rel != '.' else dest
        os.makedirs(target_root, exist_ok=True)
        for name in files:
            src_file = os.path.join(root, name)
            dest_file = os.path.join(target_root, name)
            with open(src_file, 'rb') as fsrc, open(dest_file, 'wb') as fdst:
                fdst.write(fsrc.read())
            copied += 1
    return copied


def _skill_entrypoint(name: str):
    # Try manifest first, then common defaults
    manifest = os.path.join(REGISTRY_PATH, name, 'manifest.json')
    if os.path.isfile(manifest):
        try:
            with open(manifest, 'r', encoding='utf-8') as f:
                data = json.load(f)
            eps = data.get('entrypoints') or []
            if eps:
                ep = eps[0]
                cmd = ep.get('command')
                if cmd:
                    return cmd
        except Exception:
            pass
    sk = os.path.join(REGISTRY_PATH, name, 'SKILL.md')
    if os.path.isfile(sk):
        return 'python -m skills.' + name
    return None


@sandbox.get('/health')
def health():
    available = _docker_available() if shutil.which(DOCKER_CMD) else False
    return {'status': 'ok', 'docker_available': available, 'image': DEFAULT_IMAGE}


@sandbox.post('/run/{name}')
def run_skill_in_sandbox(name: str):
    src = os.path.join(REGISTRY_PATH, name)
    if not os.path.isdir(src):
        raise HTTPException(404, 'Skill not found in registry')
    if not shutil.which(DOCKER_CMD):
        raise HTTPException(500, 'Docker CLI not found on host; install Docker Desktop for Windows')
    if not _docker_available():
        raise HTTPException(500, 'Docker daemon not reachable; start Docker Desktop and retry')

    entry = _skill_entrypoint(name)
    if not entry:
        raise HTTPException(400, 'No runnable entrypoint for skill (need manifest.json entrypoints or a runnable module)')

    work = os.path.join('tmp', 'sandbox', name)
    if os.path.isdir(work):
        shutil.rmtree(work)
    os.makedirs(work, exist_ok=True)
    copied = _copy_skill_dir(src, work)
    if not copied:
        raise HTTPException(500, 'No files copied to sandbox workdir')

    cmd = [
        DOCKER_CMD, 'run', '--rm',
        '-v', os.path.abspath(work) + ':/app/skill',
        '-w', '/app/skill',
        DEFAULT_IMAGE,
        'sh', '-lc', entry,
    ]
    rc, out, err = _run(cmd)
    return {
        'skill': name,
        'entrypoint': entry,
        'rc': rc,
        'stdout': out,
        'stderr': err,
        'files_copied': copied,
    }
