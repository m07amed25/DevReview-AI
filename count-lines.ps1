Get-ChildItem -Path 'N:\React\NextJS\DevReview-AI\src' -Recurse -Include '*.ts','*.tsx','*.css' |
  Where-Object { $_.FullName -notmatch 'db.client' } |
  ForEach-Object {
    $l = (Get-Content $_.FullName | Measure-Object -Line).Lines
    if ($l -gt 500) {
      Write-Host ("{0,5} {1}" -f $l, $_.FullName.Replace('N:\React\NextJS\DevReview-AI\', ''))
    }
  }
