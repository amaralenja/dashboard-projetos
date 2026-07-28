Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c ""taskkill /f /im node.exe""", 0, False
