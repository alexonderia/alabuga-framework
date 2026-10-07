$ErrorActionPreference = 'Stop'
$workspace = Split-Path $PSScriptRoot -Parent
$runtimePath = Join-Path $workspace '.local/ollama'
$version = 'v0.35.0'
New-Item -ItemType Directory -Force $runtimePath | Out-Null
$archive = Join-Path $runtimePath 'ollama-windows-amd64.zip'
if (!(Test-Path (Join-Path $runtimePath 'installation.json'))) {
  & python (Join-Path $PSScriptRoot 'download-ollama.py')
  if ($LASTEXITCODE -ne 0) { throw 'Ollama download failed. Run ai:setup again to resume.' }
}
$env:OLLAMA_HOST = '127.0.0.1:11434'
$env:OLLAMA_MODELS = Join-Path $workspace '.local/models'
$env:OLLAMA_NUM_PARALLEL = '1'
$env:OLLAMA_MAX_LOADED_MODELS = '1'
$env:OLLAMA_CONTEXT_LENGTH = '4096'
$env:OLLAMA_NO_CLOUD = '1'
$env:OLLAMA_VULKAN = '1'
try { Invoke-RestMethod 'http://127.0.0.1:11434/api/version' | Out-Null } catch {
  Start-Process -FilePath (Join-Path $runtimePath 'ollama.exe') -ArgumentList 'serve' -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimePath 'server.log') -RedirectStandardError (Join-Path $runtimePath 'server-error.log')
  Start-Sleep -Seconds 3
}
$env:AF_OLLAMA_URL = 'http://127.0.0.1:11434'
$env:AF_OLLAMA_MODELS_DIR = $env:OLLAMA_MODELS
Push-Location $workspace
try {
  & node --import tsx apps/ai-server/src/bootstrap.ts
  if ($LASTEXITCODE -ne 0) { throw 'Pinned model preparation failed. See the initialization message.' }
} finally { Pop-Location }
Write-Output 'Ollama и Qwen3.5-2B готовы. Запуск редактора: npm run ai'
