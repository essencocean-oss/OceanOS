from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os, json

app = FastAPI(title='HermesOS Registry')
app.mount('/processes', __import__('registery.processes').processes.procs)

REGISTRY_PATH = 'skills'
USERS_PATH = 'users'
WORKSPACES_PATH = 'workspaces'

