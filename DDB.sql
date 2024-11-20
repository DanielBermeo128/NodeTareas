-- Crear la base de datos
CREATE DATABASE Pendientes;
USE Pendientes;

-- Tabla para el catálogo de importancia
CREATE TABLE catalogo_importancia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_importancia VARCHAR(50) NOT NULL
);

-- Insertar registros iniciales en el catálogo de importancia
INSERT INTO catalogo_importancia (tipo_importancia)
VALUES 
    ('Trivial'),
    ('Importante'),
    ('Vital');

-- Tabla para el catálogo de urgencia
CREATE TABLE catalogo_urgencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nivel_urgencia VARCHAR(50) NOT NULL
);

-- Insertar registros iniciales en el catálogo de urgencia
INSERT INTO catalogo_urgencia (nivel_urgencia)
VALUES 
    ('Para ayer'),
    ('Urgente'),
    ('Procrastinado'),
    ('Aliviado');

-- Tabla para el catálogo de estado
CREATE TABLE catalogo_estado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estado VARCHAR(50) NOT NULL
);

-- Insertar registros iniciales en el catálogo de estado
INSERT INTO catalogo_estado (estado)
VALUES 
    ('Espera'),
    ('En proceso'),
    ('Finalizada');

-- Tabla principal de tareas
CREATE TABLE tareas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    importancia_id INT NOT NULL,
    urgencia_id INT NOT NULL,
    dependencia VARCHAR(255) NOT NULL,
    fecha_llegada DATE NOT NULL,
    fecha_limite DATE NOT NULL,
    estado_id INT NOT NULL,
    FOREIGN KEY (importancia_id) REFERENCES catalogo_importancia(id),
    FOREIGN KEY (urgencia_id) REFERENCES catalogo_urgencia(id),
    FOREIGN KEY (estado_id) REFERENCES catalogo_estado(id)
);
