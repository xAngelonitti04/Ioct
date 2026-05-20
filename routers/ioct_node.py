from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import db_models, schemas

router = APIRouter(prefix="/ioct-nodes", tags=["IOCT Nodes"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def create_ioct_node(data: schemas.IoctNodeCreate, db: Session = Depends(get_db)):
    item = db_models.IoctNode(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/")
def search_ioct_nodes(db: Session = Depends(get_db)):
    return db.query(db_models.IoctNode).all()

@router.get("/{ioct_node_id}")
def get_ioct_node(ioct_node_id: int, db: Session = Depends(get_db)):
    item = db.query(db_models.IoctNode).filter(db_models.IoctNode.ioct_node_id == ioct_node_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Nodo IOCT non trovato")
    return item

@router.put("/{ioct_node_id}")
def update_ioct_node(ioct_node_id: int, data: schemas.IoctNodeUpdate, db: Session = Depends(get_db)):
    item = db.query(db_models.IoctNode).filter(db_models.IoctNode.ioct_node_id == ioct_node_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Nodo IOCT non trovato")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{ioct_node_id}")
def delete_ioct_node(ioct_node_id: int, db: Session = Depends(get_db)):
    item = db.query(db_models.IoctNode).filter(db_models.IoctNode.ioct_node_id == ioct_node_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Nodo IOCT non trovato")

    db.delete(item)
    db.commit()
    return {"message": "Nodo IOCT eliminato"}