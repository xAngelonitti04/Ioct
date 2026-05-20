from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import asset, project, ioct_node, project_ioct, asset_contains, asset_project, scene_object
from database import Base, engine
import os

Base.metadata.create_all(bind=engine)

os.makedirs("uploads/models", exist_ok=True)

app = FastAPI(title="IOCT API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/models", StaticFiles(directory="uploads/models"), name="models")

@app.get("/")
def root():
    return {"message": "API IOCT funzionante"}

app.include_router(asset.router)
app.include_router(project.router)
app.include_router(ioct_node.router)
app.include_router(project_ioct.router)
app.include_router(asset_contains.router)
app.include_router(asset_project.router)
app.include_router(scene_object.router)