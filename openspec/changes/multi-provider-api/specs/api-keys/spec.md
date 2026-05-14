# API-Keys Specification

## Purpose

Este dominio define el comportamiento para que el usuario pueda gestionar sus propias API keys de servicios de transcripción e investigación. Las claves son ingresadas por el usuario, cifradas en reposo, y nunca hardcodeadas en el backend.

## Requirements

### Requirement: API Key Storage

El sistema DEBE permitir al usuario guardar, visualizar (enmascaradas) y eliminar API keys para servicios externos.

#### Scenario: Save a new API key
- GIVEN the user is on `/settings/api-keys`.
- WHEN the user enters an API key for "Gladia" and clicks Save.
- THEN the key MUST be encrypted with AES-256-GCM and persisted in the `api_keys` table.
- AND the UI MUST show the provider as "Configured" with a masked key (e.g., `****-abcd`).

#### Scenario: View configured providers
- GIVEN the user has saved API keys for Gladia and DeepGram.
- WHEN the user navigates to the transcription page.
- THEN the provider selector dropdown MUST show "Gladia" and "DeepGram" as available options.
- AND providers without saved keys MUST NOT appear (except "Offline Whisper" which is always available).

#### Scenario: Delete an API key
- GIVEN the user has a saved API key for AssemblyAI.
- WHEN the user clicks "Remove" on the AssemblyAI key.
- THEN the key MUST be permanently deleted from the database.
- AND AssemblyAI MUST disappear from the provider selector.

#### Scenario: Masked key display
- GIVEN the user has saved API keys.
- WHEN viewing `/settings/api-keys`.
- THEN the keys MUST be displayed masked (first 4 and last 4 characters visible, middle replaced with `****`).
- AND there MUST be a toggle to temporarily reveal the full key.

### Requirement: Encryption at Rest

Las API keys DEBEN cifrarse antes de persistirse en SQLite.

#### Scenario: Key derivation
- GIVEN the application starts.
- WHEN an API key needs to be encrypted or decrypted.
- THEN an encryption key MUST be derived using PBKDF2 with the hardware ID as input and a fixed application salt.
- AND the derived key MUST NOT be persisted to disk.

#### Scenario: Decryption failure
- GIVEN the application is running on different hardware than when the keys were saved.
- WHEN trying to decrypt an API key.
- THEN the system MUST return a clear error: "Las claves fueron cifradas en otro equipo. Debes reingresarlas."
- AND the user MUST be prompted to reconfigure their keys.

### Requirement: Provider Types

El sistema DEBE soportar los siguientes tipos de provider:

| Provider Key | Display Name | Category | Required |
|--------------|-------------|----------|----------|
| `gladia` | Gladia | transcription | API Key |
| `deepgram` | DeepGram | transcription | API Key |
| `assemblyai` | AssemblyAI | transcription | API Key |
| `pubmed` | PubMed / NCBI | research | API Key (optional) |
| `semantic_scholar` | Semantic Scholar | research | API Key (optional) |
| `crossref` | Crossref | research | Email (politeness) |

#### Scenario: Research APIs with configurable keys
- GIVEN the user has configured a PubMed API key.
- WHEN the research module makes a request to PubMed.
- THEN the request MUST include the user's API key for higher rate limits.
- AND if no key is configured, the request MUST proceed without authentication (lower rate limit).

### Requirement: Provider Selection for Transcription

El usuario DEBE poder elegir qué provider usar al momento de transcribir.

#### Scenario: Select provider before transcription
- GIVEN the user has configured Gladia and DeepGram API keys.
- WHEN the user opens the Audio Uploader.
- THEN a dropdown MUST show: "Offline (Whisper)", "Gladia ☁️", "DeepGram ☁️".
- AND "Offline (Whisper)" MUST be the default selection.

#### Scenario: No cloud providers configured
- GIVEN the user has NOT configured any cloud API keys.
- WHEN the user opens the Audio Uploader.
- THEN the provider dropdown MUST show only "Offline (Whisper)".
- AND a small link "Configurar APIs cloud" MUST navigate to `/settings/api-keys`.
