from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import db_models, schemas

router = APIRouter(prefix="/projects", tags=["Projects"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def create_project(data: schemas.ProjectCreate, db: Session = Depends(get_db)):
    item = db_models.Project(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/")
def search_projects(db: Session = Depends(get_db)):
    return db.query(db_models.Project).all()

@router.get("/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    item = db.query(db_models.Project).filter(db_models.Project.project_id == project_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Project non trovato")
    return item

@router.put("/{project_id}")
def update_project(project_id: int, data: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    item = db.query(db_models.Project).filter(db_models.Project.project_id == project_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Project non trovato")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    # Prima elimina i scene_object collegati
    db.query(db_models.SceneObject).filter(
        db_models.SceneObject.project_id == project_id
    ).delete()

    item = db.query(db_models.Project).filter(db_models.Project.project_id == project_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Project non trovato")

    db.delete(item)
    db.commit()
    return {"message": "Project eliminato"}