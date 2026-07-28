Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c ""set PATH=C:\Program Files\nodejs;%PATH% && cd /d ""C:\Users\welli\Downloads\projeto dashboard\dashboard"" && npm run dev""", 0, False
