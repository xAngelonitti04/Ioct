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


@router.get("/children/{asset_id}")
def get_children(asset_id: int, db: Session = Depends(get_db)):
    relations = db.query(db_models.AssetContains).filter(
        db_models.AssetContains.parent_asset_id == asset_id
    ).all()
    result = []
    for rel in relations:
        child = db.query(db_models.Asset).filter(
            db_models.Asset.asset_id == rel.child_asset_id
        ).first()
        if child:
            result.append({
                "contains_id": rel.asset_contains_id,
                "asset": {
                    "asset_id": child.asset_id,
                    "title": child.title,
                    "asset_type": child.asset_type,
                    "location": child.location,
                    "artist_name": child.artist_name,
                    "creation_date": child.creation_date,
                    "conservation_state": child.conservation_state,
                    "description": child.description,
                },
                "position": rel.position,
                "start_date": str(rel.start_date) if rel.start_date else None,
                "end_date": str(rel.end_date) if rel.end_date else None,
                "notes": rel.notes,
            })
    return result


@router.get("/parents/{asset_id}")
def get_parents(asset_id: int, db: Session = Depends(get_db)):
    relations = db.query(db_models.AssetContains).filter(
        db_models.AssetContains.child_asset_id == asset_id
    ).all()
    result = []
    for rel in relations:
        parent = db.query(db_models.Asset).filter(
            db_models.Asset.asset_id == rel.parent_asset_id
        ).first()
        if parent:
            result.append({
                "contains_id": rel.asset_contains_id,
                "asset": {
                    "asset_id": parent.asset_id,
                    "title": parent.title,
                    "asset_type": parent.asset_type,
                    "location": parent.location,
                    "artist_name": parent.artist_name,
                    "creation_date": parent.creation_date,
                    "conservation_state": parent.conservation_state,
                    "description": parent.description,
                },
                "position": rel.position,
                "start_date": str(rel.start_date) if rel.start_date else None,
                "end_date": str(rel.end_date) if rel.end_date else None,
                "notes": rel.notes,
            })
    return result