param(
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateSet('commit','run','generate-image','generate-pdf','notify')]
    [string]$Action,
    [Parameter(Position=1)]
    [string]$Arg1
)

$ErrorActionPreference='SilentlyContinue'
$Root='C:\Users\anant\OneDrive\Desktop\NightlyBuilder\HermesOS'
$GitExe='C:\Program Files\Git\cmd\git.exe'
Set-Location $Root

function Invoke-Commit {
    param([string[]]$Files, [string]$Msg)
    if (-not $Files -or $Files.Count -eq 0) { throw "No files to stage" }
    foreach ($f in $Files) { if (-not (Test-Path $f)) { throw "Missing file: $f" } }
    & $GitExe add @Files | Out-Null
    $status = & $GitExe status -sb
    & $GitExe commit -m $Msg | Out-Null
    $push = & $GitExe push origin main 2>&1
    [pscustomobject]@{ status='ok'; push_output = ($push -join "`n") }
}

switch ($Action) {
    'notify' {
        if (-not $Arg1) { throw "Arg1 required: message text" }
        $envFile = Join-Path $env:USERPROFILE '.hermes\.env'
        if (-not (Test-Path $envFile)) { throw "Missing Hermes .env at $envFile" }
        $bot = Get-Content $envFile | Where-Object { $_ -match '^TELEGRAM_BOT_TOKEN=' } | ForEach-Object { ($_ -split '=',2)[1] }
        if (-not $bot) { throw "TELEGRAM_BOT_TOKEN not found in .env" }
        $chat = '6677764672'
        $body = @{ chat_id=$chat; text=$Arg1 } | ConvertTo-Json -Compress
        Invoke-RestMethod -Method Post -Uri "https://api.telegram.org/bot$bot/sendMessage" -ContentType 'application/json' -Body $body
    }
    'commit' {
        $files = @('build_report.py','hello.txt','make_image.py','assets/agent_flow.png')
        $has = @($files | Where-Object { Test-Path $_ })
        if ($has.Count -eq 0) { throw "Nothing to commit" }
        $result = Invoke-Commit -Files $has -Msg "chore: autonomous commit"
        if ($LASTEXITCODE -ne 0 -or $result.status -ne 'ok') { throw "Push failed`n$($result.push_output)" }
        try {
            powershell -ExecutionPolicy Bypass -File (Join-Path $Root 'Run-HermesTask.ps1') notify "HermesOS push: $(git rev-parse --short HEAD) — $(($has -join ', '))"
        } catch {}
        $result
    }
    'run' {
        if (-not $Arg1) { throw "Arg1 required: script path" }
        python $Arg1
    }
    'generate-image' {
        if (-not $Arg1) { throw "Arg1 required: prompt" }
        New-Item -ItemType Dir -Force assets | Out-Null
        $py = @'
import os
try:
    from PIL import Image, ImageDraw
except Exception:
    raise SystemExit("Pillow not installed")
os.makedirs("assets", exist_ok=True)
img = Image.new("RGB", (800,400), color="white")
d = ImageDraw.Draw(img)
d.rectangle([50,50,300,150], fill="#e0e0e0", outline="#333", width=3)
d.text((70,90), "' + ($Arg1 -replace '\"','\'"'"' ) + @'", fill="black")
d.rectangle([400,50,700,150], fill="#e0e0e0", outline="#333", width=3)
d.text((420,90), "Terminal", fill="black")
d.line((300,100,400,100), fill="#333", width=4)
d.polygon([(400,100),(380,85),(380,115)], fill="#333")
img.save("assets/agent_flow.png")
print("Wrote assets/agent_flow.png")
'@
        Set-Content make_image.py -Value $py -Encoding UTF8
        python make_image.py
    }
    'generate-pdf' {
        if (-not $Arg1) { throw "Arg1 required: report text" }
        $safe = $Arg1 -replace "'", "''"
        $py = @'
from fpdf import FPDF
class Report(FPDF):
    def header(self):
        self.set_font('Helvetica','B',14)
        self.cell(0,10,'Agent Build Report',ln=1,align='C')
        self.ln(4)
    def section(self,title,body):
        self.set_font('Helvetica','B',12)
        self.cell(0,8,title,ln=1)
        self.set_font('Helvetica','',11)
        self.multi_cell(0,6,body)
        self.ln(2)
pdf=Report()
pdf.add_page()
pdf.section('Status','$safe')
pdf.output('report.pdf')
print('Wrote report.pdf')
'@
        Set-Content make_report.py -Value $py -Encoding UTF8
        python make_report.py
    }
}
