from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import db_models, schemas

router = APIRouter(prefix="/has", tags=["Has"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_has(data: schemas.AssetProjectCreate, db: Session = Depends(get_db)):
    new_has = db_models.AssetProject(**data.dict())
    db.add(new_has)
    db.commit()
    db.refresh(new_has)
    return new_has


@router.get("/")
def get_all_has(db: Session = Depends(get_db)):
    return db.query(db_models.AssetProject).all()


@router.get("/{has_id}")
def get_has_by_id(has_id: int, db: Session = Depends(get_db)):
    has = db.query(db_models.AssetProject).filter(
        db_models.AssetProject.asset_project_id == has_id
    ).first()

    if not has:
        raise HTTPException(status_code=404, detail="Relazione HAS non trovata")

    return has


@router.put("/{has_id}")
def update_has(
    has_id: int,
    data: schemas.AssetProjectUpdate,
    db: Session = Depends(get_db)
):
    has = db.query(db_models.AssetProject).filter(
        db_models.AssetProject.asset_project_id == has_id
    ).first()

    if not has:
        raise HTTPException(status_code=404, detail="Relazione HAS non trovata")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(has, key, value)

    db.commit()
    db.refresh(has)
    return has


@router.delete("/{has_id}")
def delete_has(has_id: int, db: Session = Depends(get_db)):
    has = db.query(db_models.AssetProject).filter(
        db_models.AssetProject.asset_project_id == has_id
    ).first()

    if not has:
        raise HTTPException(status_code=404, detail="Relazione HAS non trovata")

    db.delete(has)
    db.commit()
    return {"message": "Relazione HAS eliminata correttamente"}

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class AssetContainsCreate(BaseModel):
    parent_asset_id: int
    child_asset_id: int
    position: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None


class AssetContainsUpdate(BaseModel):
    parent_asset_id: Optional[int] = None
    child_asset_id: Optional[int] = None
    position: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None


class AssetProjectCreate(BaseModel):
    asset_id: int
    project_id: int
    created_at: Optional[datetime] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None


class AssetProjectUpdate(BaseModel):
    asset_id: Optional[int] = None
    project_id: Optional[int] = None
    created_at: Optional[datetime] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None