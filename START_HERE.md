# Start here

Extract the ZIP before using the compiler.

## Windows

Double-click `ccompiler.exe` for the interactive menu, or open PowerShell in this
folder and run:

```powershell
.\ccompiler.exe examples\simple.c
.\ccompiler.exe --explore -o explorer.html examples\arithmetic.c
Start-Process .\explorer.html
```

Analysis and Explorer reports work with the included executable on Windows 10/11.
To build and run your C programs, install native GCC or Clang and add it to PATH:

```powershell
.\ccompiler.exe -r examples\simple.c
```

To rebuild the compiler, run `.\build-windows.ps1` or `.\build-windows.bat`.
GCC is required; generated lexer/parser sources are included. Flex/Bison or
WinFlexBison is needed when changing the grammar or lexer.

## Linux

Build from source; this ZIP does not include an outdated Linux executable.

```bash
sudo apt install flex bison gcc make python3
make
./ccompiler examples/simple.c
./ccompiler -r examples/simple.c
./ccompiler --explore -o explorer.html examples/arithmetic.c
```

Open `explorer.html` in your browser. A ready-made demonstration is included at
`ui/explorer-example.html`.

## Tests and details

See `README.md` for options and `tests/VALIDATION.md` for results and limitations.
This is an educational C subset frontend. Windows tests passed; native Linux
validation is pending.
