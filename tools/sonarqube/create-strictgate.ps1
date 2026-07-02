param(
    [string]$SonarUrl = "http://localhost:9000",
    [Parameter(Mandatory = $true)]
    [string]$Token,
    [string]$GateName = "StrictGate",
    [string]$ProjectKey = "reservas-ec",
    [string]$ProjectName = "ReservasEC"
)

$ErrorActionPreference = "Stop"

$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${Token}:"))
$headers = @{ Authorization = "Basic $auth" }

function Invoke-SonarPost {
    param(
        [string]$Path,
        [hashtable]$Body
    )

    Invoke-RestMethod -Method Post -Uri "$SonarUrl$Path" -Headers $headers -Body $Body
}

$existing = Invoke-RestMethod -Method Get -Uri "$SonarUrl/api/qualitygates/list" -Headers $headers
$gate = $existing.qualitygates | Where-Object { $_.name -eq $GateName } | Select-Object -First 1

if (-not $gate) {
    $gate = Invoke-SonarPost -Path "/api/qualitygates/create" -Body @{ name = $GateName }
}

$conditions = @(
    @{ metric = "blocker_violations"; op = "GT"; error = "0" },
    @{ metric = "critical_violations"; op = "GT"; error = "0" },
    @{ metric = "major_violations"; op = "GT"; error = "5" },
    @{ metric = "security_hotspots_reviewed"; op = "LT"; error = "100" },
    @{ metric = "coverage"; op = "LT"; error = "80" },
    @{ metric = "duplicated_lines_density"; op = "GT"; error = "3" },
    @{ metric = "sqale_debt_ratio"; op = "GT"; error = "2.5" },
    @{ metric = "complexity"; op = "GT"; error = "50" },
    @{ metric = "cognitive_complexity"; op = "GT"; error = "30" }
)

$gateDetails = Invoke-RestMethod -Method Get -Uri "$SonarUrl/api/qualitygates/show?name=$([uri]::EscapeDataString($GateName))" -Headers $headers
$managedMetrics = $conditions | ForEach-Object { $_.metric }

foreach ($existingCondition in $gateDetails.conditions) {
    if ($managedMetrics -contains $existingCondition.metric) {
        Invoke-SonarPost -Path "/api/qualitygates/delete_condition" -Body @{
            id = $existingCondition.id
        } | Out-Null
    }
}

foreach ($condition in $conditions) {
    Invoke-SonarPost -Path "/api/qualitygates/create_condition" -Body @{
        gateName = $GateName
        metric = $condition.metric
        op = $condition.op
        error = $condition.error
    } | Out-Null
}

$projectSearch = Invoke-RestMethod -Method Get -Uri "$SonarUrl/api/projects/search?projects=$([uri]::EscapeDataString($ProjectKey))" -Headers $headers
if (-not ($projectSearch.components | Where-Object { $_.key -eq $ProjectKey })) {
    Invoke-SonarPost -Path "/api/projects/create" -Body @{
        project = $ProjectKey
        name = $ProjectName
    } | Out-Null
}

Invoke-SonarPost -Path "/api/qualitygates/select" -Body @{
    gateName = $GateName
    projectKey = $ProjectKey
} | Out-Null

Write-Host "Quality Gate '$GateName' configured and assigned to project $ProjectKey."
