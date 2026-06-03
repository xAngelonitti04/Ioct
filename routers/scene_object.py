import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from database import SessionLocal
from sqlalchemy.orm import Session
import db_models

UPLOAD_DIR = "uploads/models"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/scene-objects", tags=["Scene Objects"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class SceneObjectCreate(BaseModel):
    glb_filename: Optional[str] = None
    ioct_node_id: Optional[int] = None
    project_id: Optional[int] = None
    asset_id: Optional[int] = None
    object_type: Optional[str] = 'asset'
    artemis_node_id: Optional[str] = None
    pos_x: Optional[float] = 0
    pos_y: Optional[float] = 0
    pos_z: Optional[float] = 0
    rot_x: Optional[float] = 0
    rot_y: Optional[float] = 0
    rot_z: Optional[float] = 0
    scale_x: Optional[float] = 1
    scale_y: Optional[float] = 1
    scale_z: Optional[float] = 1

class SceneObjectUpdate(BaseModel):
    glb_filename: Optional[str] = None
    ioct_node_id: Optional[int] = None
    project_id: Optional[int] = None
    asset_id: Optional[int] = None
    object_type: Optional[str] = None
    artemis_node_id: Optional[str] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    pos_z: Optional[float] = None
    rot_x: Optional[float] = None
    rot_y: Optional[float] = None
    rot_z: Optional[float] = None
    scale_x: Optional[float] = None
    scale_y: Optional[float] = None
    scale_z: Optional[float] = None

@router.post("/upload/{project_id}")
async def upload_glb(project_id: int, file: UploadFile = File(...)):
    project_dir = os.path.join(UPLOAD_DIR, str(project_id))
    os.makedirs(project_dir, exist_ok=True)
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    filepath = os.path.join(project_dir, unique_filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"filename": unique_filename}

@router.post("/")
def create_scene_object(data: SceneObjectCreate, db: Session = Depends(get_db)):
    item = db_models.SceneObject(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/")
def get_scene_objects(db: Session = Depends(get_db)):
    return db.query(db_models.SceneObject).all()

@router.get("/project/{project_id}")
def get_scene_objects_by_project(project_id: int, db: Session = Depends(get_db)):
    return db.query(db_models.SceneObject).filter(
        db_models.SceneObject.project_id == project_id
    ).all()

@router.get("/{scene_object_id}")
def get_scene_object(scene_object_id: int, db: Session = Depends(get_db)):
    item = db.query(db_models.SceneObject).filter(
        db_models.SceneObject.scene_object_id == scene_object_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Scene object non trovato")
    return item

@router.put("/{scene_object_id}")
def update_scene_object(scene_object_id: int, data: SceneObjectUpdate, db: Session = Depends(get_db)):
    item = db.query(db_models.SceneObject).filter(
        db_models.SceneObject.scene_object_id == scene_object_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Scene object non trovato")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{scene_object_id}")
def delete_scene_object(scene_object_id: int, db: Session = Depends(get_db)):
    item = db.query(db_models.SceneObject).filter(
        db_models.SceneObject.scene_object_id == scene_object_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Scene object non trovato")
    db.delete(item)
    db.commit()
    return {"message": "Scene object eliminato"}