' Inicia o servidor do controle remoto 100% invisivel (sem janela preta).
' Usado pela tarefa agendada e por clique duplo. Espera o servidor terminar e devolve o codigo de saida
' (assim a tarefa agendada consegue reiniciar o servidor se ele cair).
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
ScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = ScriptDir
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & ScriptDir & "\scripts\Iniciar-Servidor.ps1"""
rc = WshShell.Run(cmd, 0, True)
WScript.Quit rc
