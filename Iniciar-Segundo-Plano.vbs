Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
ScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = ScriptDir
' O parametro 0 faz rodar 100% invisivel em segundo plano (sem janela do Prompt)
WshShell.Run "node server.js", 0, False
