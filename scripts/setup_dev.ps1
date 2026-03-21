$DevPath = "$env:APPDATA\NeuroScribe"
$ProdPath = "$env:APPDATA\app.neuroscribe.desktop"

# Create directories if they don't exist
if (!(Test-Path $DevPath)) { New-Item -ItemType Directory -Path $DevPath }
if (!(Test-Path $ProdPath)) { New-Item -ItemType Directory -Path $ProdPath }

# --- Models Linking (Using Junctions for better Windows compatibility) ---
$DevModels = Join-Path $DevPath "models"
$ProdModels = Join-Path $ProdPath "models"

if (!(Test-Path $ProdModels) -and !(Test-Path $DevModels)) {
    New-Item -ItemType Directory -Path $ProdModels
}

if (!(Test-Path $DevModels)) {
    # Usar Junction para directorios es más compatible en Windows
    cmd /c mklink /j "$DevModels" "$ProdModels"
    Write-Host "Carpeta de modelos vinculada exitosamente."
}

# --- Database Linking (Hard Link for the file) ---
$DevDB = Join-Path $DevPath "neuroscribe.db"
$ProdDB = Join-Path $ProdPath "neuroscribe.db"

if (!(Test-Path $ProdDB) -and !(Test-Path $DevDB)) {
    New-Item -ItemType File -Path $ProdDB
}

if (!(Test-Path $DevDB)) {
    # Usar Hard Link para el archivo .db
    cmd /c mklink /h "$DevDB" "$ProdDB"
    Write-Host "Base de datos vinculada exitosamente."
}

Write-Host "`n¡Listo! Ahora puedes usar 'npm run tauri:dev' y verás tus datos reales."
