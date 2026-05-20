from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import db_models, schemas

router = APIRouter(prefix="/contains", tags=["Contains"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_contains(data: schemas.AssetContainsCreate, db: Session = Depends(get_db)):
    new_contains = db_models.AssetContains(**data.dict())
    db.add(new_contains)
    db.commit()
    db.refresh(new_contains)
    return new_contains


@router.get("/")
def get_all_contains(db: Session = Depends(get_db)):
    return db.query(db_models.AssetContains).all()


@router.get("/{contains_id}")
def get_contains_by_id(contains_id: int, db: Session = Depends(get_db)):
    contains = db.query(db_models.AssetContains).filter(
        db_models.AssetContains.asset_contains_id == contains_id
    ).first()

    if not contains:
        raise HTTPException(status_code=404, detail="Relazione CONTAINS non trovata")

    return contains


@router.put("/{contains_id}")
def update_contains(
    contains_id: int,
    data: schemas.AssetContainsUpdate,
    db: Session = Depends(get_db)
):
    contains = db.query(db_models.AssetContains).filter(
        db_models.AssetContains.asset_contains_id == contains_id
    ).first()

    if not contains:
        raise HTTPException(status_code=404, detail="Relazione CONTAINS non trovata")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(contains, key, value)

    db.commit()
    db.refresh(contains)
    return contains


@router.delete("/{contains_id}")
def delete_contains(contains_id: int, db: Session = Depends(get_db)):
    contains = db.query(db_models.AssetContains).filter(
        db_models.AssetContains.asset_contains_id == contains_id
    ).first()

    if not contains:
        raise HTTPException(status_code=404, detail="Relazione CONTAINS non trovata")

    db.delete(contains)
    db.commit()
    return {"message": "Relazione CONTAINS eliminata correttamente"}