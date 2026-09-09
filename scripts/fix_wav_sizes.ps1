# WAV RIFF header and data chunk size fixer
# Usage: powershell -ExecutionPolicy Bypass -File fix_wav_sizes.ps1 [-Path <directory>]
# Fixes all .wav files in the specified directory (recursively) where
# RIFF header size (offset 4) and/or data chunk size are incorrectly set to 0xFFFFFFFF.

param(
    [string]$Path = "D:\Sojourn\management\docs\game-design\assets\audio"
)

if (-not (Test-Path $Path)) {
    Write-Host "ERROR: Path not found: $Path"
    exit 1
}

$wavFiles = Get-ChildItem -Path $Path -Recurse -Filter "*.wav"
$fixed = 0
$alreadyOk = 0
$errors = 0

foreach ($f in $wavFiles) {
    try {
        $fs = [System.IO.File]::Open($f.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::ReadWrite)
        $fileSize = $f.Length
        $bufSize = [Math]::Min(512, $fileSize)
        $bytes = New-Object -TypeName byte[] -ArgumentList $bufSize
        [void]$fs.Read($bytes, 0, $bytes.Length)

        $needFix = $false

        # Fix RIFF header size (offset 4) = fileSize - 8
        $riffSize = [BitConverter]::ToUInt32($bytes, 4)
        $correctRiff = [uint32]($fileSize - 8)
        if ($riffSize -ne $correctRiff) {
            $fs.Seek(4, [System.IO.SeekOrigin]::Begin) | Out-Null
            $writer = New-Object System.IO.BinaryWriter($fs)
            $writer.Write($correctRiff)
            $writer.Flush()
            $needFix = $true
        }

        # Find data chunk and fix its size
        $dataOffset = -1
        for ($i = 12; $i -lt $bytes.Length - 4; $i++) {
            if ($bytes[$i] -eq 0x64 -and $bytes[$i+1] -eq 0x61 -and
                $bytes[$i+2] -eq 0x74 -and $bytes[$i+3] -eq 0x61) {
                $dataOffset = $i
                break
            }
        }

        if ($dataOffset -ge 0) {
            $dataSize = [BitConverter]::ToUInt32($bytes, $dataOffset + 4)
            $correctData = [uint32]($fileSize - $dataOffset - 8)
            if ($dataSize -ne $correctData) {
                $fs.Seek($dataOffset + 4, [System.IO.SeekOrigin]::Begin) | Out-Null
                $writer = New-Object System.IO.BinaryWriter($fs)
                $writer.Write($correctData)
                $writer.Flush()
                $needFix = $true
            }
        }

        if ($needFix) { $fixed++ } else { $alreadyOk++ }
        $fs.Close()
    } catch {
        $errors++
        Write-Host "  ERROR fixing $($f.Name): $_"
    }
}

Write-Host "WAV size fix complete:"
Write-Host "  Total: $($wavFiles.Count)"
Write-Host "  Fixed: $fixed"
Write-Host "  Already OK: $alreadyOk"
Write-Host "  Errors: $errors"
