$Port = 3000
$Path = "c:\Users\Paragon NP\Desktop\letter-to-osagyefo"

$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")
$Listener.Start()

Write-Host "✓ Server running at http://localhost:$Port/" -ForegroundColor Green
Write-Host "✓ Press Ctrl+C to stop" -ForegroundColor Green

while ($Listener.IsListening) {
    try {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response
        
        $LocalPath = $Request.Url.LocalPath
        if ($LocalPath -eq "/") { $LocalPath = "/index.html" }
        
        $FilePath = Join-Path $Path ($LocalPath -replace '^/', '')
        
        if (Test-Path $FilePath -PathType Leaf) {
            $Content = [System.IO.File]::ReadAllBytes($FilePath)
            
            # Set content type
            $ContentType = "application/octet-stream"
            if ($FilePath -match '\.html$') { $ContentType = "text/html" }
            elseif ($FilePath -match '\.css$') { $ContentType = "text/css" }
            elseif ($FilePath -match '\.js$') { $ContentType = "application/javascript" }
            elseif ($FilePath -match '\.png$') { $ContentType = "image/png" }
            elseif ($FilePath -match '\.jpg$|\.jpeg$') { $ContentType = "image/jpeg" }
            
            $Response.StatusCode = 200
            $Response.ContentType = $ContentType
            $Response.ContentLength64 = $Content.Length
            $Response.OutputStream.Write($Content, 0, $Content.Length)
        } else {
            $Response.StatusCode = 404
            $NotFound = [Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found</h1>")
            $Response.ContentType = "text/html"
            $Response.ContentLength64 = $NotFound.Length
            $Response.OutputStream.Write($NotFound, 0, $NotFound.Length)
        }
        
        $Response.Close()
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

$Listener.Stop()
