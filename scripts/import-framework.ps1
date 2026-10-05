param([Parameter(Mandatory=$true)][string]$Source)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$destination = Join-Path $PSScriptRoot '../framework-model'
[IO.Directory]::CreateDirectory($destination) | Out-Null
$zip = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Source))
try {
    $reader = [IO.StreamReader]::new($zip.GetEntry('content.json').Open(), [Text.Encoding]::UTF8)
    try { $sheets = $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
    $script:count = 0
    function Convert-Topic($topic) {
        $script:count++
        $children = @()
        foreach ($group in $topic.children.PSObject.Properties) {
            foreach ($child in $group.Value) { $children += Convert-Topic $child }
        }
        $result = [ordered]@{ id=$topic.id; title=$topic.title; children=$children }
        foreach ($key in @('notes', 'labels', 'href')) {
            if ($topic.$key) { $result[$key] = $topic.$key }
        }
        return $result
    }
    $roots = @($sheets | ForEach-Object { Convert-Topic $_.rootTopic })
    $data = [ordered]@{
        sourceName=[IO.Path]::GetFileName($Source)
        sourceSha256=(Get-FileHash -LiteralPath $Source -Algorithm SHA256).Hash.ToLowerInvariant()
        nodeCount=$script:count
        sheets=@($sheets | ForEach-Object { $_.title })
        relationships=@($sheets | ForEach-Object { $_.relationships })
        roots=$roots
    }
    $json = $data | ConvertTo-Json -Depth 100
    [IO.File]::WriteAllText((Join-Path $destination 'source-data.js'), 'window.FRAMEWORK_SOURCE = ' + $json + ';' + "`n", [Text.UTF8Encoding]::new($false))
    [IO.Compression.ZipFileExtensions]::ExtractToFile($zip.GetEntry('Thumbnails/thumbnail.png'), (Join-Path $destination 'original-map.png'), $true)
    Copy-Item -LiteralPath $Source -Destination (Join-Path $destination 'trading-system.xmind')
    Write-Output ('Imported nodes: ' + $script:count)
} finally { $zip.Dispose() }
