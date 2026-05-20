from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import db_models, schemas

router = APIRouter(prefix="/project-ioct", tags=["Project IOCT"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def create_project_ioct(data: schemas.ProjectIoctCreate, db: Session = Depends(get_db)):
    item = db_models.ProjectIoct(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/")
def search_project_ioct(db: Session = Depends(get_db)):
    return db.query(db_models.ProjectIoct).all()

@router.get("/{project_ioct_id}")
def get_project_ioct(project_ioct_id: int, db: Session = Depends(get_db)):
    item = db.query(db_models.ProjectIoct).filter(
        db_models.ProjectIoct.project_ioct_id == project_ioct_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Relazione PROJECT_IOCT non trovata")
    return item

@router.put("/{project_ioct_id}")
def update_project_ioct(project_ioct_id: int, data: schemas.ProjectIoctUpdate, db: Session = Depends(get_db)):
    item = db.query(db_models.ProjectIoct).filter(
        db_models.ProjectIoct.project_ioct_id == project_ioct_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Relazione PROJECT_IOCT non trovata")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{project_ioct_id}")
def delete_project_ioct(project_ioct_id: int, db: Session = Depends(get_db)):
    item = db.query(db_models.ProjectIoct).filter(
        db_models.ProjectIoct.project_ioct_id == project_ioct_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Relazione PROJECT_IOCT non trovata")

    db.delete(item)
    db.commit()
    return {"message": "Relazione PROJECT_IOCT eliminata"}