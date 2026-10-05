# LoanPulse Local Web Server for Mobile Phone Access
$port = 8080
$localIP = "localhost"

# Detect active Wi-Fi IPv4 address
$detectedIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*" } | Select-Object -First 1).IPAddress
if ($detectedIP) { $localIP = $detectedIP }

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

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".png"  = "image/png"
    ".ics"  = "text/calendar; charset=utf-8"
}

$root = $PSScriptRoot

while ($true) {
    try {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = [System.IO.StreamReader]::new($stream)
        
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
        $localPath = Join-Path $root ($path.TrimStart('/').Replace('/', '\'))

        if (Test-Path $localPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            $mime = $mimeTypes[$ext]
            if (-not $mime) { $mime = "application/octet-stream" }

            $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
            
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
        } else {
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("HTTP/1.1 404 Not Found`r`nContent-Length: 9`r`n`r`nNot Found")
            $stream.Write($notFound, 0, $notFound.Length)
        }
        $stream.Flush()
        $client.Close()
    } catch {
        # Continue loop on error
    }
}
