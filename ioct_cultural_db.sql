CREATE DATABASE ioct_cultural_db;
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

    -- attributi artistici (solo per opere)
    artist_name VARCHAR(100),
    creation_date VARCHAR(50),
    conservation_state VARCHAR(100),

    -- relazione ricorsiva (contiene)
    parent_asset_id INT,

    CONSTRAINT fk_asset_parent
        FOREIGN KEY (parent_asset_id)
        REFERENCES asset(asset_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
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
    status VARCHAR(50),
    asset_id INT NOT NULL,

    CONSTRAINT fk_project_asset
        FOREIGN KEY (asset_id)
        REFERENCES asset(asset_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
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
    notes TEXT
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