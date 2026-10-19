<#
.SYNOPSIS
    git-automator.ps1 - Professional Git workflow script with Cloud Sync & Multi-Environment Support.
.DESCRIPTION
    Streamlines common Git tasks: new branches with cloud sync, environment merging (prd/test/dev), 
    and automatic cleanup of feature branches from GitHub.
#>

param (
    [Alias("n")][switch]$NewBranch,
    [Alias("c")][switch]$Commit,
    [Alias("m")][switch]$Merge,
    [Alias("r")][switch]$Rollback,
    [Alias("s")][switch]$SmartSwitch,
    [Alias("i")][switch]$Ignore,
    [Alias("h")][switch]$Help,
    [Parameter(Position = 0)][string]$InputArg
)

# --- Helpers ---

function Assert-GitRepo {
    git rev-parse --is-inside-work-tree 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Not a Git repository." -ForegroundColor Red
        exit 1
    }
}

function Assert-CleanTree {
    $status = git status --porcelain
    if ($status) {
        Write-Host "Warning: You have uncommitted changes." -ForegroundColor Yellow
        $choice = Read-Host "Proceed anyway? (y/N)"
        if ($choice -notmatch '^[Yy]$') {
            Write-Host "Operation cancelled. Please commit or stash your changes." -ForegroundColor Cyan
            exit 1
        }
    }
}

function Show-HelpMenu {
    Write-Host "`nGit Automator - Cloud Edition" -ForegroundColor Cyan
    Write-Host "-------------------------------"
    Write-Host "-n [name]  Smart Branch (Interactive + Auto Cloud Push)"
    Write-Host "-c         Smart Commit (Stages + Suggested Msg + Optional Cloud Sync)"
    Write-Host "-m         Smart Merge (Environment selection + Cloud Cleanup)"
    Write-Host "-r [hash]  Smart Rollback (Commit revert + Cloud Sync)"
    Write-Host "-s [name]  Smart Switch (Interactive local branch switcher)"
    Write-Host "-i         Smart Ignore (Updates .gitignore and .geminiignore)"
    Write-Host "-h         Show this help menu`n"
}

function Invoke-EnsureEnvironmentBranch {
    param([string]$name)
    $localExists = git branch --list $name
    $remoteExists = git branch -r --list "origin/$name"

    if (-not $localExists) {
        if ($remoteExists) {
            Write-Host "Fetching env branch $name from origin..." -ForegroundColor Cyan
            git checkout -b $name "origin/$name"
        } else {
            Write-Host "Environment branch $name does not exist. Create from main? (y/N)" -NoNewline
            if ((Read-Host) -match '^[Yy]$') {
                git checkout main
                git pull origin main
                git checkout -b $name
                git push -u origin $name
            } else {
                return $false
            }
        }
    }
    return $true
}

# --- Main Logic ---

Assert-GitRepo

# 1. New Branch
if ($NewBranch) {
    $branchName = $InputArg
    if ([string]::IsNullOrWhiteSpace($branchName)) {
        Write-Host "`n--- Smart Branch Generator ---" -ForegroundColor Yellow
        $desc = Read-Host "Workflow description (e.g., 'Fix auth hang')"
        $type = Read-Host "Type (feat/fix/chore)"
        if ([string]::IsNullOrWhiteSpace($type)) { $type = "feat" }
        $formatted = $desc.ToLower().Trim() -replace '[^a-z0-9\s_]', '' -replace '[\s_]+', '-'
        $branchName = "$($type.ToLower())/$formatted"
    }

    Write-Host "`nSuggested branch: " -NoNewline; Write-Host $branchName -ForegroundColor Green
    if ((Read-Host "Confirm creation? (Y/N)") -match '^[Yy]$') {
        $doSync = Read-Host "Sync with main first? (y/N)"
        if ($doSync -match '^[Yy]$') {
            Assert-CleanTree
            Write-Host "`nSyncing main and creating branch..." -ForegroundColor Cyan
            git checkout main
            git pull origin main
            git checkout -b $branchName
        } else {
            Write-Host "`nCreating branch from current state..." -ForegroundColor Cyan
            git checkout -b $branchName
        }
        
        Write-Host "Pushing branch to cloud (origin)..." -ForegroundColor Cyan
        git push -u origin $branchName
        Write-Host "Success! $branchName is live on GitHub." -ForegroundColor Green
    }
}

# 2. Smart Commit
elseif ($Commit) {
    git add .
    $staged = @((git diff --staged --name-only))
    if ($staged.Count -eq 0) {
        Write-Host "Nothing to commit." -ForegroundColor Yellow
        return
    }
    $suggestion = "fix: update $($staged[0])"
    Write-Host "Suggested: " -NoNewline; Write-Host $suggestion -ForegroundColor Green
    $msg = Read-Host "Message (Enter for suggested)"
    $finalMsg = if ([string]::IsNullOrWhiteSpace($msg)) { $suggestion } else { $msg }
    git commit -m $finalMsg
    
    if ((Read-Host "Push to cloud immediately? (y/N)") -match '^[Yy]$') {
        $currentBranch = git rev-parse --abbrev-ref HEAD
        git push origin $currentBranch
        Write-Host "Pushed to $currentBranch." -ForegroundColor Green
    }
}

# 3. Smart Merge (Environment Aware)
elseif ($Merge) {
    Assert-CleanTree
    
    # Select Environment
    Write-Host "`n--- Select Target Environment ---" -ForegroundColor Yellow
    Write-Host "[0] Production (main)"
    Write-Host "[1] Testing (test)"
    Write-Host "[2] Development (dev)"
    $envChoice = Read-Host "Select index"
    $envBranch = switch ($envChoice) {
        "0" { "main" }
        "1" { "test" }
        "2" { "dev" }
        default { "main" }
    }

    if (-not (Invoke-EnsureEnvironmentBranch $envBranch)) {
        Write-Host "Operation cancelled: Target environment $envBranch not available." -ForegroundColor Red
        return
    }

    # Select Branch to merge
    Write-Host "`n--- Select Feature Branch to Merge into $envBranch ---" -ForegroundColor Yellow
    $branches = @((git branch --format="%(refname:short)") | Where-Object { $_ -ne "main" -and $_ -ne "test" -and $_ -ne "dev" })
    
    if ($branches.Count -eq 0) {
        Write-Host "No feature branches found." -ForegroundColor Red
        return
    }

    for ($i = 0; $i -lt $branches.Count; $i++) { Write-Host "[$i] $($branches[$i])" }
    $choice = Read-Host "`nSelect index"
    
    if ($choice -match '^\d+$' -and $choice -lt $branches.Count) { 
        $target = $branches[$choice] 
        Write-Host "`nMerging $target -> $envBranch..." -ForegroundColor Cyan
        git checkout $envBranch
        git pull origin $envBranch
        git merge $target
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Merge successful. Pushing $envBranch to Cloud..." -ForegroundColor Cyan
            git push origin $envBranch
            
            Write-Host "`nMerge Complete! Cleanup feature branch (Local & Cloud)? (Y/n)" -NoNewline
            if ((Read-Host) -notmatch '^[Nn]$') {
                Write-Host "Deleting $target from Cloud..." -ForegroundColor Cyan
                git push origin --delete $target 2>$null
                Write-Host "Deleting $target locally..." -ForegroundColor Cyan
                git branch -d $target 2>$null
            }
        } else {
            Write-Host "Conflict! Resolve manually." -ForegroundColor Red
        }
    }
}

# 4. Smart Rollback
elseif ($Rollback) {
    Assert-CleanTree
    $hash = $InputArg
    if ([string]::IsNullOrWhiteSpace($hash)) {
        Write-Host "`n--- Recent Commits ---" -ForegroundColor Yellow
        $logs = @((git log -n 5 --pretty=format:"%h | %s (%cr)") -split "`n")
        for ($i = 0; $i -lt $logs.Length; $i++) { Write-Host "[$i] $($logs[$i])" }
        $choice = Read-Host "`nSelect index to revert"
        if ($choice -match '^\d$') { $hash = ($logs[$choice] -split " \| ")[0] }
    }

    if ($hash) {
        Write-Host "Reverting $hash..." -ForegroundColor Cyan
        git revert --no-edit $hash
        if ($LASTEXITCODE -eq 0) { 
            $current = git rev-parse --abbrev-ref HEAD
            git push origin $current
            Write-Host "Revert pushed to $current." -ForegroundColor Green
        }
    }
}

# 5. Smart Switch
elseif ($SmartSwitch) {
    Assert-CleanTree
    $target = $InputArg
    if ([string]::IsNullOrWhiteSpace($target)) {
        Write-Host "`n--- Local Branches ---" -ForegroundColor Yellow
        $branches = @((git branch --format="%(refname:short)"))
        $current = git rev-parse --abbrev-ref HEAD
        for ($i = 0; $i -lt $branches.Count; $i++) { 
            $color = if ($branches[$i] -eq $current) { "Cyan" } else { "White" }
            Write-Host "[$i] $($branches[$i])" -ForegroundColor $color
        }
        $choice = Read-Host "`nSelect index to switch to"
        if ($choice -match '^\d+$' -and $choice -lt $branches.Count) { $target = $branches[$choice] }
    }

    if ($target) {
        Write-Host "Switching to $target..." -ForegroundColor Cyan
        git checkout $target
    }
}

# 6. Smart Ignore
elseif ($Ignore) {
    Write-Host "Updating ignore files..." -ForegroundColor Cyan
    $patterns = @("node_modules/", "dist/", ".env*", "*.log")
    @(".gitignore", ".geminiignore") | ForEach-Object {
        $file = $_
        if (-not (Test-Path $file)) { New-Item $file -ItemType File | Out-Null }
        $content = Get-Content $file -ErrorAction SilentlyContinue
        
        $newPatterns = $patterns | Where-Object { $content -notcontains $_ }
        if ($newPatterns) {
            Add-Content $file "`n# Auto-updated patterns`n$($newPatterns -join "`n")"
            Write-Host "Added new patterns to $file" -ForegroundColor Cyan
        } else {
            Write-Host "$file is already up to date." -ForegroundColor Gray
        }
    }
    Write-Host "Done." -ForegroundColor Green
}

# 7. Help / Default
else {
    Show-HelpMenu
}
