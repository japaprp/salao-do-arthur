Param(
  [string]$WebBaseUrl = "http://127.0.0.1:3001",
  [string]$ApiBaseUrl = "http://127.0.0.1:3100/api",
  [string]$TenantSubdomain = "barbearia-do-artur",
  [string]$ClientEmail = "cliente.demo@barbeariadoartur.app",
  [string]$ClientPassword = "Cliente123!",
  [int]$TimeoutSeconds = 90
)

$ErrorActionPreference = "Stop"

function Write-Ok {
  param([string]$Message)
  Write-Host "[OK] $Message" -ForegroundColor Green
}

function Invoke-SmokeRequest {
  param(
    [string]$Method,
    [string]$Uri,
    [object]$Body = $null,
    [hashtable]$Headers = @{},
    [int]$ExpectedStatus = 200
  )

  $request = @{
    Method = $Method
    Uri = $Uri
    TimeoutSec = $TimeoutSeconds
    Headers = $Headers
    UseBasicParsing = $true
  }

  if ($null -ne $Body) {
    $request.ContentType = "application/json"
    $request.Body = ($Body | ConvertTo-Json -Depth 8)
  }

  try {
    $response = Invoke-WebRequest @request
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
      throw "Falha em $Method $Uri. Status recebido: $statusCode. Esperado: $ExpectedStatus."
    }

    throw "Falha em $Method $Uri. $($_.Exception.Message)"
  }

  if ([int]$response.StatusCode -ne $ExpectedStatus) {
    throw "Falha em $Method $Uri. Status recebido: $($response.StatusCode). Esperado: $ExpectedStatus."
  }

  return $response
}

function Read-JsonContent {
  param([string]$Content)

  if ([string]::IsNullOrWhiteSpace($Content)) {
    return @{}
  }

  return $Content | ConvertFrom-Json
}

Write-Host "Smoke local Barbearia do Artur" -ForegroundColor Cyan
Write-Host "Web: $WebBaseUrl"
Write-Host "API: $ApiBaseUrl"

$loginPage = Invoke-SmokeRequest -Method "GET" -Uri "$WebBaseUrl/auth/login"
Write-Ok "WEB /auth/login -> $($loginPage.StatusCode)"

$clientPage = Invoke-SmokeRequest -Method "GET" -Uri "$WebBaseUrl/client"
Write-Ok "WEB /client -> $($clientPage.StatusCode)"

$health = Invoke-SmokeRequest -Method "GET" -Uri "$ApiBaseUrl/health"
Write-Ok "API /health -> $($health.StatusCode)"

$loginBody = @{
  tenantSubdomain = $TenantSubdomain
  email = $ClientEmail
  password = $ClientPassword
}

$loginResponse = Invoke-SmokeRequest `
  -Method "POST" `
  -Uri "$ApiBaseUrl/auth/login" `
  -Body $loginBody `
  -ExpectedStatus 201
$login = Read-JsonContent $loginResponse.Content

if ([string]::IsNullOrWhiteSpace($login.accessToken)) {
  throw "Login cliente retornou sem accessToken."
}

if ($login.user.role -ne "CLIENT") {
  throw "Login cliente retornou role '$($login.user.role)', esperado CLIENT."
}

Write-Ok "API login cliente -> $($login.user.role)"

$profileHeaders = @{
  Authorization = "Bearer $($login.accessToken)"
}

$profileResponse = Invoke-SmokeRequest -Method "GET" -Uri "$ApiBaseUrl/auth/profile" -Headers $profileHeaders
$profile = Read-JsonContent $profileResponse.Content

if ($profile.role -ne "CLIENT") {
  throw "Profile cliente retornou role '$($profile.role)', esperado CLIENT."
}

if ([string]::IsNullOrWhiteSpace($profile.tenantId)) {
  throw "Profile cliente retornou sem tenantId."
}

Write-Ok "API /auth/profile -> $($profile.role)"
Write-Ok "Tenant confirmado -> $($profile.tenantId)"
Write-Host "Smoke local concluido." -ForegroundColor Cyan
