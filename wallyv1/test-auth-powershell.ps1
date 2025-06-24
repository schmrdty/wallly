# Quick test of auth endpoint
$body = @{
    fid = 213310
    username = "schmidtiest.eth"
    displayName = "Schmidtiest"
    pfpUrl = ""
    custody = "0x1234567890123456789012345678901234567890"
    verifications = @()
    message = "Test message"
    signature = "profile-based-auth"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/farcaster" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing

Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
