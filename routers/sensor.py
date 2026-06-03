from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import SessionLocal
from sqlalchemy.orm import Session
import db_models

router = APIRouter(prefix="/sensors", tags=["Sensors"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class SensorCreate(BaseModel):
    ioct_node_id: int
    name: Optional[str] = None
    sensor_type: Optional[str] = None
    unit: Optional[str] = None
    sensor_key: Optional[str] = None

class SensorUpdate(BaseModel):
    name: Optional[str] = None
    sensor_type: Optional[str] = None
    unit: Optional[str] = None
    sensor_key: Optional[str] = None

@router.post("/")
def create_sensor(data: SensorCreate, db: Session = Depends(get_db)):
    item = db_models.Sensor(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/node/{ioct_node_id}")
def get_sensors_by_node(ioct_node_id: int, db: Session = Depends(get_db)):
    return db.query(db_models.Sensor).filter(
        db_models.Sensor.ioct_node_id == ioct_node_id
    ).all()

@router.put("/{sensor_id}")
def update_sensor(sensor_id: int, data: SensorUpdate, db: Session = Depends(get_db)):
    item = db.query(db_models.Sensor).filter(db_models.Sensor.sensor_id == sensor_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Sensore non trovato")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{sensor_id}")
def delete_sensor(sensor_id: int, db: Session = Depends(get_db)):
    item = db.query(db_models.Sensor).filter(db_models.Sensor.sensor_id == sensor_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Sensore non trovato")
    db.delete(item)
    db.commit()
    return {"message": "Sensore eliminato"}