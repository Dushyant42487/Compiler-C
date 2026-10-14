# Compiler tests

Windows:

```powershell
.\build-windows.ps1
.\tests\run-tests-win.ps1
python tests/test_regressions.py ccompiler.exe
```

Linux:

```bash
make test
```

The portable suite uses only Python 3 standard libraries. Pass the native binary
as the first argument; otherwise it selects the root binary for the current OS.
It tests real CLI behavior in isolated temporary directories with subprocess
timeouts. Tests cover arithmetic, build/run failures, stdin, exit codes, paths
with spaces, frontend limits, repeated parsing, and Explorer reports.

See [VALIDATION.md](VALIDATION.md) for results and known limitations.
