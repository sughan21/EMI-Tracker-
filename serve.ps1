# LoanPulse Local Web Server for Mobile Phone Access
$port = 8080
$localIP = "localhost"

# Detect active Wi-Fi / LAN IPv4 address (prioritizing active Wi-Fi adapters)
try {
    $allIPs = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue
    $wifi = $allIPs | Where-Object { ($_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Wireless*") -and ($_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*") } | Select-Object -First 1
    if ($wifi) {
        $localIP = $wifi.IPAddress
    } else {
        $lan = $allIPs | Where-Object { ($_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*") -and $_.IPAddress -notlike "192.168.56.*" } | Select-Object -First 1
        if ($lan) {
            $localIP = $lan.IPAddress
        }
    }
} catch {
    # Keep localhost fallback
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
try {
    $listener.Start()
} catch {
    $port = 8081
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
    $listener.Start()
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  LoanPulse Mobile Local Server is RUNNING!" -ForegroundColor Cyan
Write-Host "  Open this on your mobile phone (connected to same Wi-Fi):" -ForegroundColor Yellow
Write-Host "  👉 http://${localIP}:${port}/" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  (Press Ctrl+C to stop the server anytime)" -ForegroundColor Gray

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".png"  = "image/png"
    ".svg"  = "image/svg+xml"
    ".ics"  = "text/calendar; charset=utf-8"
}

$root = $PSScriptRoot

while ($true) {
    try {
        $client = $listener.AcceptTcpClient()
        $client.ReceiveTimeout = 3000
        $client.SendTimeout = 3000
        $stream = $client.GetStream()
        
        # Wait up to 150ms for data in case of speculative pre-connect
        $waited = 0
        while (-not $stream.DataAvailable -and $waited -lt 15) {
            Start-Sleep -Milliseconds 10
            $waited++
        }

        if (-not $stream.DataAvailable) {
            $client.Close()
            continue
        }

        $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8)
        $requestLine = $reader.ReadLine()
        if (-not $requestLine) {
            $client.Close()
            continue
        }

        while (($line = $reader.ReadLine()) -and $line.Length -gt 0) {}

        $tokens = $requestLine.Split(" ")
        if ($tokens.Length -lt 2) {
            $client.Close()
            continue
        }

        $path = $tokens[1]
        if ($path -eq "/" -or $path -eq "") {
            $path = "/index.html"
        }

        $path = $path.Split("?")[0]
        $cleanPath = $path.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $localPath = Join-Path $root $cleanPath

        if (Test-Path $localPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            $mime = $mimeTypes[$ext]
            if (-not $mime) { $mime = "application/octet-stream" }

            $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`nCache-Control: no-cache`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
            
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
        } else {
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("HTTP/1.1 404 Not Found`r`nContent-Length: 9`r`nConnection: close`r`n`r`nNot Found")
            $stream.Write($notFound, 0, $notFound.Length)
        }
        $stream.Flush()
        $client.Close()
    } catch {
        # Continue loop on error
    }
}

