# Database Specification

## Purpose

Este dominio define el comportamiento y los requisitos de la capa de persistencia local utilizando SQLite para garantizar la privacidad y el funcionamiento offline.

## Requirements

### Requirement: Automatic Database Initialization

El sistema DEBE inicializar automáticamente una base de datos SQLite local (`neuroscribe.db`) en el primer arranque si no existe.

#### Scenario: First launch of the application
- GIVEN the application is opened for the first time.
- WHEN the Tauri backend initializes.
- THEN the system MUST create the `neuroscribe.db` file.
- AND it MUST execute the initial migration scripts to create all necessary tables.

### Requirement: Data Integrity and Constraints

El sistema DEBE garantizar la integridad de los datos mediante el uso de claves foráneas y restricciones de base de datos.

#### Scenario: Deleting a folder with documents
- GIVEN a folder that contains multiple documents.
- WHEN the user deletes the folder.
- THEN the system MUST set the `folder_id` of the associated documents to `NULL` (SET NULL).
- OR it MUST delete the documents if they are configured for CASCADE deletion (según diseño).

### Requirement: Local Persistence for Folders and Documents

El sistema DEBE permitir el almacenamiento y recuperación de carpetas y documentos de forma persistente en el disco local.

#### Scenario: Creating a new folder
- GIVEN the application is running.
- WHEN the user creates a folder named "Paciente A".
- THEN the system MUST insert a record into the `folders` table.
- AND the record MUST be retrievable after restarting the application.

#### Scenario: Saving a document
- GIVEN an existing folder.
- WHEN the user saves a new transcript document.
- THEN the system MUST store the title, content (HTML), and metadata in the `documents` table.
- AND it MUST associate the document with the correct `folder_id`.
