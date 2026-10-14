"""The same behavioral checks run against native Windows and Linux binaries."""
import html
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
BINARY = Path(sys.argv.pop(1)).resolve() if len(sys.argv) > 1 else ROOT / (
    "ccompiler.exe" if os.name == "nt" else "ccompiler")


class CompilerRegressionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="compiler tests ")
        self.directory = Path(self.temp.name)
        self.source = self.directory / "source with spaces.c"
        self.source.write_text("int main(){int x=10-3;return 0;}")

    def tearDown(self):
        self.temp.cleanup()

    def run_cli(self, *args, stdin=None):
        return subprocess.run([str(BINARY), *map(str, args)], input=stdin,
                              capture_output=True, text=True, timeout=20,
                              cwd=self.directory)

    def test_examples(self):
        for source in sorted((ROOT / "examples").glob("*.c")):
            with self.subTest(source=source.name):
                result = self.run_cli("-q", source)
                if source.name.startswith("error_"):
                    self.assertEqual(result.returncode, 1, result.stderr)
                else:
                    self.assertEqual(result.returncode, 0, result.stderr)

    def test_tokens_have_content(self):
        result = self.run_cli("--tokens", self.source)
        self.assertEqual(result.returncode, 0)
        self.assertIn("TOKEN line 1 INT", result.stdout)
        self.assertIn("SUBTRACT", result.stdout)

    def test_quiet_errors_are_visible(self):
        result = self.run_cli("-q", ROOT / "examples/error_undeclared.c")
        self.assertEqual(result.returncode, 1)
        self.assertIn("not declared", result.stderr)

    def test_arithmetic(self):
        for expression, expected in [("10-3", "7"), ("2*3+4", "10"),
                                     ("10-3-2", "5"), ("7/2", "3"),
                                     ("1<<3", "8"), ("8>>2", "2"),
                                     ("7&3", "3"), ("4|1", "5"),
                                     ("7^3", "4"), ("2+3*4", "14"),
                                     ("(2+3)*4", "20"), ("-3+1", "-2")]:
            with self.subTest(expression=expression):
                self.source.write_text(f"int main(){{int x={expression};return 0;}}")
                result = self.run_cli("--symbols", self.source)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertRegex(result.stdout, rf"(?m)^x\s+int\s+Variable\s+\d+\s+{re.escape(expected)}\s*$")

    def test_zero_division(self):
        for expression in ["1/0", "1%0"]:
            with self.subTest(expression=expression):
                self.source.write_text(f"int main(){{int x={expression};return 0;}}")
                result = self.run_cli("--semantic", self.source)
                self.assertEqual(result.returncode, 1)
                self.assertIn("zero", result.stdout)

    def test_run_absolute_output_and_exit_code(self):
        output = self.directory / ("run program.exe" if os.name == "nt" else "run program")
        self.source.write_text('#include <stdio.h>\nint main(){printf("runtime-marker");return 7;}')
        result = self.run_cli("-r", "-o", output, self.source)
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertIn("runtime-marker", result.stdout)
        self.assertIn("exit code: 7", result.stdout)

    def test_run_relative_output(self):
        result = self.run_cli("-r", "-o", "relative program.exe" if os.name == "nt" else "relative program", self.source)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("exit code: 0", result.stdout)

    def test_run_stdin(self):
        result = self.run_cli("-r", ROOT / "examples/even_odd.c", stdin="7\n")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Odd", result.stdout)

    def test_backend_failure(self):
        self.source.write_text("int main(){missing_backend_function();return 0;}")
        result = self.run_cli("-b", self.source)
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertIn("Backend compiler", result.stderr)

    def test_analysis_does_not_execute(self):
        self.source.write_text('#include <stdio.h>\nint main(){printf("runtime-marker");return 0;}')
        result = self.run_cli(self.source)
        self.assertEqual(result.returncode, 0)
        self.assertNotIn("PHASE 5", result.stdout)
        self.assertFalse((self.directory / "temp_run.exe").exists())
        self.assertFalse((self.directory / "temp_run.out").exists())

    def test_cli_errors(self):
        for args in [("--unknown",), ("-o",), ("--ir",), ("missing.c",),
                     (self.source, self.source), ("--explore", "-r", self.source)]:
            with self.subTest(args=args):
                result = self.run_cli(*args)
                self.assertEqual(result.returncode, 1)

    def test_source_is_not_overwritten(self):
        original = self.source.read_bytes()
        for flag in ["--explore", "--ir", "-b"]:
            with self.subTest(flag=flag):
                result = self.run_cli(flag, "-o", self.source, self.source)
                self.assertEqual(result.returncode, 1)
                self.assertEqual(self.source.read_bytes(), original)

    def test_report(self):
        report = self.directory / "explorer report.html"
        result = self.run_cli("--explore", "-o", report, self.source)
        self.assertEqual(result.returncode, 0, result.stderr)
        text = report.read_text()
        for marker in ["Compiler Explorer", "Symbol detective", "Syntax tree", "IR microscope", "Diagnostics"]:
            self.assertIn(marker, text)
        self.assertIn("10 - 3", text)
        self.assertNotIn("PHASE 5", result.stdout)

    def test_report_escaping(self):
        payload = '</script><img src=x onerror=alert(1)>'
        self.source.write_text('int main(){printf("' + payload + '");return 0;}')
        result = self.run_cli("--explore", self.source)
        self.assertEqual(result.returncode, 0, result.stderr)
        text = (self.directory / "compiler-explorer.html").read_text()
        self.assertNotIn(payload, text)
        self.assertIn(html.escape(payload), text)

    def test_report_on_error(self):
        report = self.directory / "errors.html"
        result = self.run_cli("--explore", "-o", report, ROOT / "examples/error_undeclared.c")
        self.assertEqual(result.returncode, 1)
        self.assertIn("not declared", report.read_text())
        result = self.run_cli("--explore", "-o", report, ROOT / "examples/error_syntax.c")
        self.assertEqual(result.returncode, 1)
        self.assertIn("Syntax analysis failed", report.read_text())

    def test_unwritable_report(self):
        result = self.run_cli("--explore", "-o", self.directory / "missing/report.html", self.source)
        self.assertEqual(result.returncode, 1)

    def test_line_endings(self):
        for newline in ["\n", "\r\n"]:
            with self.subTest(newline=newline):
                self.source.write_bytes(("int main(){" + newline + "int x=5;" + newline + "return 0;}").encode())
                self.assertEqual(self.run_cli("-q", self.source).returncode, 0)

    def test_long_token_is_rejected(self):
        self.source.write_text("int main(){int " + "x" * 200 + "=1;return 0;}")
        result = self.run_cli("-q", self.source)
        self.assertEqual(result.returncode, 1)
        self.assertIn("Lexical Error", result.stderr)

    def test_long_comment_is_allowed(self):
        self.source.write_text("/*" + "x" * 1000 + "*/int main(){return 0;}")
        self.assertEqual(self.run_cli("-q", self.source).returncode, 0)

    def test_capacity_limits(self):
        for body in ["".join(f"int x{i}={i};" for i in range(350)),
                     "int x=0;" + "x=x+1;" * 550]:
            with self.subTest(body_length=len(body)):
                self.source.write_text("int main(){" + body + "return 0;}")
                result = self.run_cli("--semantic", self.source)
                self.assertEqual(result.returncode, 1)
                self.assertIn("capacity", result.stdout)

    def test_repeated_interactive_analysis(self):
        result = self.run_cli(stdin=f"1\n{self.source}\n\n1\n{self.source}\n\n6\n")
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout.count("Frontend Analysis completed successfully"), 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
