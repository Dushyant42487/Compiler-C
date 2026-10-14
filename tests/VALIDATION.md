# Validation - 11 October 2026

## Executed locally on Windows

- Freshly regenerated lexer/parser; native GCC 16.2.0 (MinGW-w64 UCRT),
  WinFlexBison 2.5.25 generators.
- Original Windows suite: 27/27 passed.
- Portable regression suite: 21/21 methods passed, including parameterized checks
  for all 14 examples, 12 arithmetic expressions, CLI errors, and capacity limits.
- Coverage: subtraction without spaces, precedence/associativity, integer division,
  bitwise folding, constant divide/modulo by zero, LF/CRLF, tokens, quiet errors,
  repeated analysis, paths with spaces, absolute/relative binaries, stdin, backend
  failures, runtime exit codes, source overwrite protection, and report escaping.
- Linux shell entry points passed Bash syntax checks using Git Bash on Windows.
  This does not count as native Linux testing.

## Linux status

No Linux runtime, WSL distribution, or Docker is installed here. Native Linux
execution has **not** been verified. GitHub Actions builds and runs the original
Linux suite and portable regression suite on Ubuntu when pushed or dispatched.
It also rebuilds using the standalone Linux script. CI results are pending;
configuration is not proof of passing tests.

```bash
sudo apt install flex bison gcc make python3
make test
bash build-linux.sh
```

## Known frontend limitations

Regeneration reports 23 shift/reduce and 13 reduce/reduce conflicts. The flat
symbol table does not implement block/function scopes. Types, sizeof, function
signatures, and control-flow IR are simplified. Values calculated while parsing
branches/loops are estimates, not execution results. Explorer states these limits
and does not simulate IR. This is not a fully standards-compliant C compiler.
