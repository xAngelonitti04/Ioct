CREATE DATABASE IF NOT EXISTS ioct_cultural_db;

USE ioct_cultural_db;

-- =========================
-- ASSET
-- =========================
CREATE TABLE asset (
    asset_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    asset_type VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    artist_name VARCHAR(100),
    creation_date VARCHAR(50),
    conservation_state VARCHAR(100)
);

-- =========================
-- PROJECT
-- =========================
CREATE TABLE project (
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50)
);

-- =========================
-- IOCT_NODE
-- =========================
CREATE TABLE ioct_node (
    ioct_node_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    sensor_type VARCHAR(100),
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    status VARCHAR(50),
    installation_date DATE,
    last_communication DATETIME,
    notes TEXT,
    artemis_node_id VARCHAR(100)
);

-- =========================
-- SENSOR
-- =========================
CREATE TABLE sensor (
    sensor_id INT AUTO_INCREMENT PRIMARY KEY,
    ioct_node_id INT NOT NULL,
    name VARCHAR(100),
    sensor_type VARCHAR(50),
    unit VARCHAR(20),
    sensor_key VARCHAR(100),
    CONSTRAINT fk_sensor_node
        FOREIGN KEY (ioct_node_id)
        REFERENCES ioct_node(ioct_node_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- ASSET_PROJECT
-- =========================
CREATE TABLE asset_project (
    asset_project_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    project_id INT NOT NULL,
    created_at DATETIME,
    purpose VARCHAR(100),
    notes TEXT,
    CONSTRAINT fk_asset_project_asset
        FOREIGN KEY (asset_id)
        REFERENCES asset(asset_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_asset_project_project
        FOREIGN KEY (project_id)
        REFERENCES project(project_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- ASSET_CONTAINS
-- =========================
CREATE TABLE asset_contains (
    asset_contains_id INT AUTO_INCREMENT PRIMARY KEY,
    parent_asset_id INT NOT NULL,
    child_asset_id INT NOT NULL,
    position VARCHAR(100),
    start_date DATE,
    end_date DATE,
    notes TEXT,
    CONSTRAINT fk_asset_contains_parent
        FOREIGN KEY (parent_asset_id)
        REFERENCES asset(asset_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_asset_contains_child
        FOREIGN KEY (child_asset_id)
        REFERENCES asset(asset_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- PROJECT_IOCT
-- =========================
CREATE TABLE project_ioct (
    project_ioct_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    ioct_node_id INT NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME,
    notes TEXT,
    CONSTRAINT fk_project_ioct_project
        FOREIGN KEY (project_id)
        REFERENCES project(project_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_project_ioct_node
        FOREIGN KEY (ioct_node_id)
        REFERENCES ioct_node(ioct_node_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- SCENE_OBJECT
-- =========================
CREATE TABLE scene_object (
    scene_object_id INT AUTO_INCREMENT PRIMARY KEY,
    glb_filename VARCHAR(255),
    glb_base64 TEXT,
    ioct_node_id INT,
    project_id INT,
    asset_id INT,
    pos_x FLOAT DEFAULT 0,
    pos_y FLOAT DEFAULT 0,
    pos_z FLOAT DEFAULT 0,
    rot_x FLOAT DEFAULT 0,
    rot_y FLOAT DEFAULT 0,
    rot_z FLOAT DEFAULT 0,
    scale_x FLOAT DEFAULT 1,
    scale_y FLOAT DEFAULT 1,
    scale_z FLOAT DEFAULT 1,
    object_type VARCHAR(20) DEFAULT 'asset',
    artemis_node_id VARCHAR(100),
    CONSTRAINT fk_scene_object_node
        FOREIGN KEY (ioct_node_id)
        REFERENCES ioct_node(ioct_node_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_scene_object_project
        FOREIGN KEY (project_id)
        REFERENCES project(project_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_scene_object_asset
        FOREIGN KEY (asset_id)
        REFERENCES asset(asset_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);
