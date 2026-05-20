from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import db_models, schemas

router = APIRouter(prefix="/assets", tags=["Assets"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def create_asset(data: schemas.AssetCreate, db: Session = Depends(get_db)):
    item = db_models.Asset(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/")
def search_assets(db: Session = Depends(get_db)):
    return db.query(db_models.Asset).all()

@router.get("/{asset_id}")
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    item = db.query(db_models.Asset).filter(db_models.Asset.asset_id == asset_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Asset non trovato")
    return item

@router.put("/{asset_id}")
def update_asset(asset_id: int, data: schemas.AssetUpdate, db: Session = Depends(get_db)):
    item = db.query(db_models.Asset).filter(db_models.Asset.asset_id == asset_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Asset non trovato")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    item = db.query(db_models.Asset).filter(db_models.Asset.asset_id == asset_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Asset non trovato")

    db.delete(item)
    db.commit()
    return {"message": "Asset eliminato"}