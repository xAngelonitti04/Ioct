from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Float
from database import Base

class Sensor(Base):
    __tablename__ = "sensor"

    sensor_id = Column(Integer, primary_key=True, index=True)
    ioct_node_id = Column(Integer, ForeignKey("ioct_node.ioct_node_id"), nullable=False)
    name = Column(String(100))
    sensor_type = Column(String(50))
    unit = Column(String(20))
    sensor_key = Column(String(100))
# =========================
# ASSET
# =========================

class Asset(Base):
    __tablename__ = "asset"

    asset_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    asset_type = Column(String(50), nullable=False)
    location = Column(String(100))
    artist_name = Column(String(100))
    creation_date = Column(String(50))
    conservation_state = Column(String(100))


# =========================
# PROJECT
# =========================

class Project(Base):
    __tablename__ = "project"

    project_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String(50))


# =========================
# IOCT_NODE
# =========================

class IoctNode(Base):
    __tablename__ = "ioct_node"

    ioct_node_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    serial_number = Column(String(100), unique=True, nullable=False)
    sensor_type = Column(String(100))
    model = Column(String(100))
    manufacturer = Column(String(100))
    status = Column(String(50))
    installation_date = Column(Date)
    last_communication = Column(DateTime)
    notes = Column(Text)
    artemis_node_id = Column(String(100), nullable=True)


# =========================
# HAS: ASSET - PROJECT
# =========================

class AssetProject(Base):
    __tablename__ = "asset_project"

    asset_project_id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("asset.asset_id"), nullable=False)
    project_id = Column(Integer, ForeignKey("project.project_id"), nullable=False)
    created_at = Column(DateTime)
    purpose = Column(String(100))
    notes = Column(Text)


# =========================
# CONTAINS: ASSET - ASSET
# =========================

class AssetContains(Base):
    __tablename__ = "asset_contains"

    asset_contains_id = Column(Integer, primary_key=True, index=True)
    parent_asset_id = Column(Integer, ForeignKey("asset.asset_id"), nullable=False)
    child_asset_id = Column(Integer, ForeignKey("asset.asset_id"), nullable=False)
    position = Column(String(100))
    start_date = Column(Date)
    end_date = Column(Date)
    notes = Column(Text)


# =========================
# PROJECT_IOCT
# =========================

class ProjectIoct(Base):
    __tablename__ = "project_ioct"

    project_ioct_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("project.project_id"), nullable=False)
    ioct_node_id = Column(Integer, ForeignKey("ioct_node.ioct_node_id"), nullable=False)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime)
    notes = Column(Text)


# =========================
# SCENE_OBJECT
# =========================

class SceneObject(Base):
    __tablename__ = "scene_object"

    scene_object_id = Column(Integer, primary_key=True, index=True)
    glb_filename = Column(String(255))
    glb_base64 = Column(Text)
    ioct_node_id = Column(Integer, ForeignKey("ioct_node.ioct_node_id"), nullable=True)
    project_id = Column(Integer, ForeignKey("project.project_id"), nullable=True)
    asset_id = Column(Integer, ForeignKey("asset.asset_id"), nullable=True)
    pos_x = Column(Float, default=0)
    pos_y = Column(Float, default=0)
    pos_z = Column(Float, default=0)
    rot_x = Column(Float, default=0)
    rot_y = Column(Float, default=0)
    rot_z = Column(Float, default=0)
    scale_x = Column(Float, default=1)
    scale_y = Column(Float, default=1)
    scale_z = Column(Float, default=1)
    object_type = Column(String(20), default='asset')
    artemis_node_id = Column(String(100), nullable=True)