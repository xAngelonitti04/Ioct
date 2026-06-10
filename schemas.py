from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


# =========================
# ASSET
# =========================

class AssetCreate(BaseModel):
    title: str
    description: Optional[str] = None
    asset_type: str
    location: Optional[str] = None
    artist_name: Optional[str] = None
    creation_date: Optional[str] = None
    conservation_state: Optional[str] = None


class AssetUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    asset_type: Optional[str] = None
    location: Optional[str] = None
    artist_name: Optional[str] = None
    creation_date: Optional[str] = None
    conservation_state: Optional[str] = None


# =========================
# PROJECT
# =========================

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None


# =========================
# SENSOR
# =========================

class SensorCreate(BaseModel):
    ioct_node_id: int
    name: Optional[str] = None
    sensor_type: Optional[str] = None
    unit: Optional[str] = None
    sensor_key: Optional[str] = None
    last_communication: Optional[datetime] = None


class SensorUpdate(BaseModel):
    name: Optional[str] = None
    sensor_type: Optional[str] = None
    unit: Optional[str] = None
    sensor_key: Optional[str] = None
    last_communication: Optional[datetime] = None


# =========================
# IOCT_NODE
# =========================

class IoctNodeCreate(BaseModel):
    name: str
    serial_number: str
    sensor_type: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    status: Optional[str] = None
    installation_date: Optional[date] = None
    notes: Optional[str] = None
    artemis_node_id: Optional[str] = None


class IoctNodeUpdate(BaseModel):
    name: Optional[str] = None
    serial_number: Optional[str] = None
    sensor_type: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    status: Optional[str] = None
    installation_date: Optional[date] = None
    notes: Optional[str] = None
    artemis_node_id: Optional[str] = None


# =========================
# HAS: ASSET - PROJECT
# =========================

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


# =========================
# CONTAINS: ASSET - ASSET
# =========================

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


# =========================
# PROJECT_IOCT
# =========================

class ProjectIoctCreate(BaseModel):
    project_id: int
    ioct_node_id: int
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    notes: Optional[str] = None


class ProjectIoctUpdate(BaseModel):
    project_id: Optional[int] = None
    ioct_node_id: Optional[int] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    notes: Optional[str] = None


# =========================
# SCENE_OBJECT
# =========================

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
