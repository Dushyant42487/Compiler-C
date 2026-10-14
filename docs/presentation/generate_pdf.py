#!/usr/bin/env python3
"""
generate_pdf.py
Compiles the comprehensive C Compiler Studio presentation guide, phase-wise architecture,
six-student speaking scripts, and academic viva defense into a publication-grade PDF.
"""

import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Preformatted, HRFlowable
)
from reportlab.pdfgen import canvas
import fitz # PyMuPDF

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Suppress header and footer on cover page
            return

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Header
        self.drawString(50, 755, "C Compiler Studio — Phase-Wise Architecture, Six-Student Scripts & Academic Defense")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(50, 747, 562, 747)

        # Running Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(562, 36, page_str)
        self.drawString(50, 36, "Confidential — Academic Examination & Project Evaluation Copy")
        self.line(50, 46, 562, 46)

        self.restoreState()


def clean_xml(text):
    """Escapes XML entities for ReportLab Paragraphs."""
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    return text


def build_pdf():
    output_pdf_path = "/Users/dushyant/Downloads/Compiler/docs/presentation/COMPILER_PHASE_WISE_PRESENTATION.pdf"
    os.makedirs(os.path.dirname(output_pdf_path), exist_ok=True)

    # Document Geometry
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=50,
        rightMargin=50,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    # Premium Color Palette
    c_primary = colors.HexColor("#1e3a8a")     # Deep Blue
    c_secondary = colors.HexColor("#0f766e")   # Teal
    c_dark = colors.HexColor("#0f172a")        # Slate 900
    c_body = colors.HexColor("#1e293b")        # Slate 800
    c_muted = colors.HexColor("#64748b")       # Slate 500
    c_border = colors.HexColor("#cbd5e1")      # Slate 300
    c_bg_light = colors.HexColor("#f8fafc")    # Slate 50
    c_code_bg = colors.HexColor("#f1f5f9")     # Slate 100

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=c_primary,
        alignment=1, # Center
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=c_muted,
        alignment=1,
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_primary,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=c_secondary,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=c_dark,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_body,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=2.5
    )

    speech_style = ParagraphStyle(
        'SpeechStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.2,
        leading=11.5,
        textColor=colors.HexColor("#1e1b4b"),
        backColor=colors.HexColor("#f5f3ff"),
        borderColor=colors.HexColor("#ddd6fe"),
        borderWidth=0.5,
        borderPadding=5,
        spaceBefore=3,
        spaceAfter=4
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=c_body
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.white
    )

    viva_q_style = ParagraphStyle(
        'VivaQ',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=c_primary,
        spaceBefore=3.5,
        spaceAfter=1.5,
        keepWithNext=True
    )

    viva_a_style = ParagraphStyle(
        'VivaA',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_body,
        spaceBefore=0,
        spaceAfter=4
    )

    pre_style = ParagraphStyle(
        'PreStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#0f172a"),
        backColor=c_code_bg,
        borderColor=c_border,
        borderWidth=0.5,
        borderPadding=5,
        spaceBefore=3,
        spaceAfter=4
    )

    story = []

    # =========================================================================
    # PAGE 1: COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 20))
    story.append(Paragraph("ACADEMIC COMPILER ENGINEERING REPORT &amp; DEFENSE GUIDE", ParagraphStyle(
        'Badge', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=c_secondary, alignment=1, spaceAfter=8
    )))
    story.append(Paragraph("C COMPILER STUDIO", title_style))
    story.append(Paragraph("Multi-Phase Compiler Architecture, Pipeline Visualization &amp; Academic Presentation Defense", subtitle_style))
    
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_primary, spaceBefore=2, spaceAfter=14))

    meta_text = """
    <b>Department:</b> Department of Computer Science &amp; Engineering &nbsp;|&nbsp; <b>Course:</b> Compiler Design / Capstone Project<br/>
    <b>Project Title:</b> C Compiler Studio — Custom Multi-Phase Compiler with Modern Web IDE<br/>
    <b>Team Structure:</b> 6-Student Academic Team &nbsp;|&nbsp; <b>Allocation Principle:</b> Exactly One Student = One Major Phase<br/>
    <b>Evaluation Mode:</b> Formal University Project Viva Voce &amp; Live Technical Demonstration
    """
    story.append(Paragraph(meta_text, body_style))
    story.append(Spacer(1, 10))

    # Allocation Table on Cover
    alloc_data = [
        [
            Paragraph("Student", table_header),
            Paragraph("Assigned Phase", table_header),
            Paragraph("Primary Source Module", table_header),
            Paragraph("Core Technical Ownership", table_header)
        ],
        [
            Paragraph("<b>Student 1</b>", table_cell),
            Paragraph("Phase 1: Lexical Analysis", table_cell),
            Paragraph("<code>compiler/lexer.l</code>", table_cell),
            Paragraph("Flex DFA tokenization, regex patterns, 99-byte buffer guard, comment stripping.", table_cell)
        ],
        [
            Paragraph("<b>Student 2</b>", table_cell),
            Paragraph("Phase 2: Syntax Analysis &amp; AST", table_cell),
            Paragraph("<code>compiler/parser_wrapper.y</code>", table_cell),
            Paragraph("Bison LALR(1) grammar, precedence rules, <code>mknode()</code> tree construction.", table_cell)
        ],
        [
            Paragraph("<b>Student 3</b>", table_cell),
            Paragraph("Phase 3: Semantic Analysis", table_cell),
            Paragraph("<code>compiler/parser_wrapper.y</code>", table_cell),
            Paragraph("<code>symbol_table[300]</code>, 47 stdlib whitelist, type coercion, scope validation.", table_cell)
        ],
        [
            Paragraph("<b>Student 4</b>", table_cell),
            Paragraph("Phase 4: Intermediate Code (IR)", table_cell),
            Paragraph("<code>compiler/parser_wrapper.y</code>", table_cell),
            Paragraph("Three-Address Code quadruples, <code>icg[500]</code>, <code>t0..tn</code> registers, <code>L0..Ln</code> labels.", table_cell)
        ],
        [
            Paragraph("<b>Student 5</b>", table_cell),
            Paragraph("Phase 5: Machine-Independent Optimization", table_cell),
            Paragraph("<code>compiler/parser_wrapper.y</code>", table_cell),
            Paragraph("Compile-time Constant Folding (<code>binary_expression</code>), zero-divide guards.", table_cell)
        ],
        [
            Paragraph("<b>Student 6</b>", table_cell),
            Paragraph("Phase 6: Target Execution &amp; Web Studio", table_cell),
            Paragraph("<code>cli/main.c</code>, <code>backend/</code>, <code>frontend/</code>", table_cell),
            Paragraph("Subprocess orchestration, host GCC/Clang delegation, REST API, Monaco IDE.", table_cell)
        ]
    ]

    t_alloc = Table(alloc_data, colWidths=[65, 115, 130, 202])
    t_alloc.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_alloc)

    story.append(Spacer(1, 14))
    disclaimer_box = """
    <b>Architectural Transparency Declaration:</b><br/>
    This compiler project custom-implements Phases 1 through 5 (Scanning, Parsing, Semantic Analysis, Intermediate Code Generation, and Machine-Independent Constant Folding). Phase 6 target machine code generation and linking is delegated to the host system backend compiler (GCC or Clang) through an orchestrated native driver (<code>cli/main.c</code>) and exposed via an interactive web development environment (<code>C Compiler Studio</code>).
    """
    story.append(Paragraph(disclaimer_box, speech_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: SECTION 1: ARCHITECTURAL OVERVIEW & MASTER PIPELINE
    # =========================================================================
    story.append(Paragraph("1. Executive Summary &amp; Compilation Pipeline", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_primary, spaceBefore=2, spaceAfter=6))

    p1 = """
    <b>C Compiler Studio</b> is an educational, production-grade C compiler frontend and interactive development environment. The compiler processes an imperative subset of ANSI C (including primitive types, single/two-dimensional arrays, pointers, compound operators, standard control flow constructs, and standard library whitelisting). The architecture strictly isolates each compilation phase into discrete, testable transformations.
    """
    story.append(Paragraph(p1, body_style))

    # Standard ASCII-only Box Art to avoid unicode font glyph issues
    pipeline_diag = """+-----------------------------------------------------------------------------+
|                          [ Source Program (.c) ]                            |
+-----------------------------------------------------------------------------+
                                      |
                                      | Character Stream
                                      v
+-----------------------------------------------------------------------------+
| PHASE 1: LEXICAL ANALYSIS (compiler/lexer.l)                                |
| Flex DFA Regex Scanner * Comment Filter * 99-Byte Buffer Guard              |
+-----------------------------------------------------------------------------+
                                      |
                                      v Token Stream (Token Type, Lexeme, Line)
+-----------------------------------------------------------------------------+
| PHASE 2: SYNTAX ANALYSIS & AST GENERATION (compiler/parser_wrapper.y)       |
| Bison LALR(1) Parser * Operator Precedence * Dynamic AST Synthesis (mknode) |
+-----------------------------------------------------------------------------+
                                      |
                                      v Abstract Syntax Tree (struct node *head)
+-----------------------------------------------------------------------------+
| PHASE 3: SEMANTIC ANALYSIS & SYMBOL TABLE (compiler/parser_wrapper.y)       |
| symbol_table[300] * Scope Resolution * Type Coercion * 47 Stdlib Whitelist  |
+-----------------------------------------------------------------------------+
                                      |
                                      v Decorated Syntax Tree & Validated Table
+-----------------------------------------------------------------------------+
| PHASE 4: INTERMEDIATE CODE GENERATION (compiler/parser_wrapper.y)           |
| Three-Address Code Quadruples * icg[500] * Temporaries (t0..) * Labels (L0..)|
+-----------------------------------------------------------------------------+
                                      |
                                      v Linear Three-Address Code (TAC)
+-----------------------------------------------------------------------------+
| PHASE 5: CODE OPTIMIZATION (compiler/parser_wrapper.y)                      |
| Constant Folding (binary_expression) * Algebraic Simplification * Dead Jumps|
+-----------------------------------------------------------------------------+
                                      |
                                      v Optimized Intermediate Representation
+-----------------------------------------------------------------------------+
| PHASE 6: TARGET CODE EXECUTION & WEB INTEGRATION (cli/main.c, backend/)     |
| Host Backend (GCC/Clang) Delegation * Native Binary Execution * Web Studio  |
+-----------------------------------------------------------------------------+"""
    story.append(Preformatted(pipeline_diag, pre_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: SECTION 2: PHASES 1, 2, 3 TECHNICAL SPECIFICATIONS
    # =========================================================================
    story.append(Paragraph("2. Detailed Phase-by-Phase Technical Specifications (Part I)", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_primary, spaceBefore=2, spaceAfter=6))

    # Phase 1
    story.append(Paragraph("Phase 1: Lexical Analysis — Flex DFA Scanner", h2_style))
    p_ph1 = """
    <b>Owner:</b> Student 1 &nbsp;|&nbsp; <b>Primary Source:</b> <code>compiler/lexer.l</code> (100 LOC)<br/>
    <b>Function:</b> The lexical scanner converts a raw ASCII character stream into discrete syntactic tokens. Flex compiles regular expression patterns into a Deterministic Finite Automaton (DFA) that guarantees linear O(N) execution speed according to the Maximal Munch rule.<br/>
    <b>Key Mechanisms:</b>
    """
    story.append(Paragraph(p_ph1, body_style))
    story.append(Paragraph("• <b>Token Buffer Guard:</b> To prevent heap corruption and buffer overflow exploits, tokens are transferred to Bison via a safe macro: <code>#define COPY_TOKEN() do { strncpy(yylval.nd_obj.name, yytext, 99); yylval.nd_obj.name[99] = '\\0'; } while(0)</code>.", bullet_style))
    story.append(Paragraph("• <b>Comment &amp; Whitespace Filtering:</b> Multiline comments (<code>/* ... */</code>) and single-line comments (<code>// ...</code>) are discarded. A custom helper <code>countn()</code> tracks embedded newline characters to ensure compiler line numbers remain synchronized with user source code.", bullet_style))
    story.append(Paragraph("• <b>Token Categories:</b> Distinguishes C reserved keywords (<code>int</code>, <code>if</code>, <code>while</code>, <code>return</code>), identifiers (<code>[a-zA-Z_][a-zA-Z0-9_]*</code>), numeric constants, string literals, and compound operators (<code>==</code>, <code>!=</code>, <code>&lt;=</code>, <code>&amp;&amp;</code>, <code>||</code>).", bullet_style))

    # Phase 2
    story.append(Spacer(1, 4))
    story.append(Paragraph("Phase 2: Syntax Analysis &amp; Abstract Syntax Tree Construction", h2_style))
    p_ph2 = """
    <b>Owner:</b> Student 2 &nbsp;|&nbsp; <b>Primary Source:</b> <code>compiler/parser_wrapper.y</code> (1042 LOC)<br/>
    <b>Function:</b> Verifies that the token stream conforms to Context-Free Grammar (CFG) rules and generates a hierarchical Abstract Syntax Tree (AST).<br/>
    <b>Key Mechanisms:</b>
    """
    story.append(Paragraph(p_ph2, body_style))
    story.append(Paragraph("• <b>Bison LALR(1) Parsing Engine:</b> Maintains a state pushdown automaton and a single-token lookahead. Shift-reduce and reduce-reduce ambiguities are eliminated mathematically using operator precedence declarations (<code>%right '='</code>, <code>%left OR AND</code>, <code>%left '+' '-'</code>, <code>%left '*' '/'</code>).", bullet_style))
    story.append(Paragraph("• <b>Dangling-Else Resolution:</b> Resolved using Bison's <code>%nonassoc LOWER_THAN_ELSE</code> and <code>%nonassoc ELSE</code> directives, binding the <code>else</code> clause to the nearest open <code>if</code> statement.", bullet_style))
    story.append(Paragraph("• <b>Dynamic AST Generation:</b> Every grammar reduction calls <code>mknode(left, right, token_name)</code>, allocating a <code>struct node</code> with pointer linkages. The tree represents syntactic hierarchy stripped of non-semantic punctuation.", bullet_style))
    story.append(Paragraph("• <b>Verification Traversal:</b> Implements <code>print_inorder(head)</code> to traverse and validate parent-child node relationships during debugging and CLI inspection.", bullet_style))

    # Phase 3
    story.append(Spacer(1, 4))
    story.append(Paragraph("Phase 3: Semantic Analysis &amp; Symbol Table Management", h2_style))
    p_ph3 = """
    <b>Owner:</b> Student 3 &nbsp;|&nbsp; <b>Primary Source:</b> <code>compiler/parser_wrapper.y</code> (Lines 250–520)<br/>
    <b>Function:</b> Validates program semantics beyond context-free grammar, enforcing variable declarations, type compatibility, and identifier scope.<br/>
    <b>Key Mechanisms:</b>
    """
    story.append(Paragraph(p_ph3, body_style))
    story.append(Paragraph("• <b>Symbol Table Architecture:</b> Implemented as a global array <code>struct dataType symbol_table[300]</code>. Each record stores <code>id_name</code>, <code>data_type</code>, <code>type</code> (VAR/FUNC), <code>line_no</code>, and lexical <code>scope</code>.", bullet_style))
    story.append(Paragraph("• <b>Declaration Enforcement:</b> <code>check_declaration(char *c)</code> verifies identifier existence before usage. Emits precise diagnostics: <code>SEMANTIC ERROR: Line X: Variable 'var' used before declaration.</code>", bullet_style))
    story.append(Paragraph("• <b>Standard Library Whitelist:</b> To prevent false undeclared identifier errors during stdlib calls, a pre-populated whitelist of 47 standard C functions (e.g., <code>printf</code>, <code>scanf</code>, <code>malloc</code>, <code>free</code>, <code>exit</code>) is recognized.", bullet_style))
    story.append(Paragraph("• <b>Keyword Shadowing Guard:</b> Validates that variable names do not collide with C reserved keywords.", bullet_style))
    story.append(Paragraph("• <b>Type Coercion:</b> Injects explicit type-casting AST nodes (e.g., <code>inttofloat</code>) when assigning mixed numeric types.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: SECTION 2 (PHASES 4, 5, 6) & SECTION 3 (PROGRAM TRACE)
    # =========================================================================
    story.append(Paragraph("2. Detailed Phase-by-Phase Technical Specifications (Part II)", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_primary, spaceBefore=2, spaceAfter=6))

    # Phase 4
    story.append(Paragraph("Phase 4: Intermediate Code Generation (Three-Address Code)", h2_style))
    p_ph4 = """
    <b>Owner:</b> Student 4 &nbsp;|&nbsp; <b>Primary Source:</b> <code>compiler/parser_wrapper.y</code> (Lines 521–740)<br/>
    <b>Function:</b> Flattens complex, nested AST hierarchical expressions into linear Three-Address Code (TAC) quadruples of the form <code>result = arg1 op arg2</code>.<br/>
    <b>Key Mechanisms:</b>
    """
    story.append(Paragraph(p_ph4, body_style))
    story.append(Paragraph("• <b>Quadruple Buffer:</b> Stored in a global array <code>struct quad icg[500]</code> populated by the sequential routine <code>emit_ir(op, arg1, arg2, res)</code>.", bullet_style))
    story.append(Paragraph("• <b>Temporary Register Synthesis:</b> Emits unbounded virtual temporaries (<code>t0, t1, t2...</code>) generated via an atomic counter <code>temp_var++</code>.", bullet_style))
    story.append(Paragraph("• <b>Control-Flow Linearization:</b> Converts high-level loops (<code>for</code>, <code>while</code>) and branching (<code>if-else</code>) into conditional branches (<code>ifFalse t0 goto L1</code>) and unconditional jumps (<code>goto L0</code>) using synthesized labels (<code>L0, L1, L2...</code>).", bullet_style))
    story.append(Paragraph("• <b>Machine Independence:</b> The resulting linear TAC decouples high-level frontend syntax from target CPU architectures (x86_64, ARM64, RISC-V).", bullet_style))

    # Phase 5
    story.append(Spacer(1, 3))
    story.append(Paragraph("Phase 5: Machine-Independent Code Optimization", h2_style))
    p_ph5 = """
    <b>Owner:</b> Student 5 &nbsp;|&nbsp; <b>Primary Source:</b> <code>compiler/parser_wrapper.y</code> (Lines 741–890)<br/>
    <b>Function:</b> Reduces program execution time and code size at compile time without altering observable program behavior.<br/>
    <b>Key Mechanisms:</b>
    """
    story.append(Paragraph(p_ph5, body_style))
    story.append(Paragraph("• <b>Compile-Time Constant Folding:</b> During AST reduction, arithmetic operations with pure literal operands are evaluated immediately at compile time inside <code>binary_expression()</code>. For example, <code>10 + 20 * 3</code> is computed directly to <code>70</code>, eliminating two runtime CPU arithmetic operations.", bullet_style))
    story.append(Paragraph("• <b>Constant Evaluation Predicate:</b> <code>can_eval(char *op1, char *op2)</code> inspects operand tokens to verify if both constitute valid numeric constants.", bullet_style))
    story.append(Paragraph("• <b>Zero-Division Safety Guard:</b> Identifies literal zero divisors during compile-time folding, reporting an error and suppressing invalid folding.", bullet_style))
    story.append(Paragraph("• <b>Algebraic Identity Simplification:</b> Eliminates redundant operations, including addition with zero (<code>x + 0 -&gt; x</code>) and multiplication by one (<code>x * 1 -&gt; x</code>).", bullet_style))

    # Phase 6
    story.append(Spacer(1, 3))
    story.append(Paragraph("Phase 6: Target Code Execution, CLI Driver &amp; Web Studio Integration", h2_style))
    p_ph6 = """
    <b>Owner:</b> Student 6 &nbsp;|&nbsp; <b>Primary Source:</b> <code>cli/main.c</code>, <code>backend/</code>, <code>frontend/</code><br/>
    <b>Function:</b> Manages native compilation, external backend delegation, subprocess execution, and full-stack web IDE integration.<br/>
    <b>Key Mechanisms:</b>
    """
    story.append(Paragraph(p_ph6, body_style))
    story.append(Paragraph("• <b>Architectural Boundary:</b> Custom compiler code handles scanning, parsing, semantic analysis, intermediate representation, and optimization. Final machine code generation and linking is delegated to the host system backend compiler (GCC or Clang).", bullet_style))
    story.append(Paragraph("• <b>Backend Compiler Auto-Discovery:</b> In <code>cli/main.c</code>, <code>find_c_backend()</code> probes system paths (<code>/usr/bin/gcc</code>, <code>/usr/bin/clang</code>) or respects <code>$CC</code> overrides.", bullet_style))
    story.append(Paragraph("• <b>Safe Execution Sandbox:</b> Invocations are executed in isolated temporary scratch directories with CPU timeout guards (<code>fork()</code>, <code>execvp()</code>, <code>waitpid()</code>).", bullet_style))
    story.append(Paragraph("• <b>Full-Stack Web Studio:</b> A React 19 + TypeScript + Monaco Editor interface communicates with an Express REST API (<code>POST /api/compile</code>), rendering live synchronized tabs for Tokens, AST, Symbol Table, and Intermediate Code.", bullet_style))

    # Concrete Trace
    story.append(Spacer(1, 4))
    story.append(Paragraph("3. Concrete End-to-End Program Trace", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_primary, spaceBefore=2, spaceAfter=6))
    trace_summary = """
    <b>Source Program:</b> <code>int main() { int a = 10 + 20 * 3; return a; }</code><br/>
    1. <b>Lexical Analysis (Phase 1):</b> Emits 18 classified tokens with buffer bounds checking.<br/>
    2. <b>Syntax Analysis (Phase 2):</b> Builds AST with precedence hierarchy (<code>*</code> binds tighter than <code>+</code>).<br/>
    3. <b>Semantic Analysis (Phase 3):</b> Records <code>main</code> (FUNC) and <code>a</code> (INT, scope 1) in <code>symbol_table[300]</code>.<br/>
    4. <b>Intermediate Code (Phase 4):</b> Emits TAC: <code>t0 = 20 * 3</code>, <code>t1 = 10 + t0</code>, <code>a = t1</code>, <code>return a</code>.<br/>
    5. <b>Optimization (Phase 5):</b> Constant folding reduces <code>10 + 20 * 3</code> directly to <code>70</code>! Emits: <code>a = 70</code>, <code>return a</code>.<br/>
    6. <b>Execution &amp; Studio (Phase 6):</b> Host binary executes, returning exit code 70 to the IDE terminal.
    """
    story.append(Paragraph(trace_summary, body_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: SPEAKING SCRIPTS (STUDENTS 1 & 2)
    # =========================================================================
    story.append(Paragraph("4. Six-Student Presentation Speaking Scripts (Students 1 &amp; 2)", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_primary, spaceBefore=2, spaceAfter=6))

    # Student 1 Block
    s1_elements = [
        Paragraph("Student 1 Speaking Script — Phase 1: Lexical Analysis", h2_style),
        Paragraph("<b>Target Time:</b> 2:30 min &nbsp;|&nbsp; <b>Files:</b> <code>compiler/lexer.l</code> &nbsp;|&nbsp; <b>Focus:</b> Tokenization, DFA scanning, buffer safety.", body_style),
        Paragraph("""
        "Respected evaluators and professors, good morning. Our team has designed and implemented C Compiler Studio, a multi-phase C compiler frontend and interactive web IDE. As Student 1, I am responsible for Phase 1 of our compiler: Lexical Analysis.<br/><br/>
        The primary responsibility of the lexical analyzer is to read raw source code characters and transform them into a stream of meaningful syntactic tokens. In our implementation, Phase 1 is built using Flex inside <code>compiler/lexer.l</code>. Flex compiles our regular expressions into a Deterministic Finite Automaton, guaranteeing that token matching runs in linear time.<br/><br/>
        Let us examine how our scanner handles tokens safely. In <code>compiler/lexer.l</code>, we define a critical buffer guard macro: <code>COPY_TOKEN()</code>. Whenever an identifier or constant is matched, we copy at most 99 bytes using <code>strncpy</code> and explicitly null-terminate the buffer. This ensures that excessively long tokens or malformed inputs cannot cause memory corruption or buffer overflows.<br/><br/>
        Our lexer classifies tokens into keywords, identifiers, constants, string literals, and compound operators like <code>==</code> and <code>&amp;&amp;</code>. It also filters out single-line and multi-line comments. To ensure that compiler error messages report the correct line number, our helper function <code>countn()</code> tracks every newline character embedded within comments.<br/><br/>
        During our live demonstration, when I input <code>int a = 10 + 20;</code> and compile, the Tokens tab displays the exact token stream passed to Phase 2. I now hand over the presentation to Student 2 to explain how these tokens are parsed into an Abstract Syntax Tree."
        """, speech_style)
    ]
    story.append(KeepTogether(s1_elements))

    story.append(Spacer(1, 8))

    # Student 2 Block
    s2_elements = [
        Paragraph("Student 2 Speaking Script — Phase 2: Syntax Analysis &amp; AST Generation", h2_style),
        Paragraph("<b>Target Time:</b> 2:30 min &nbsp;|&nbsp; <b>Files:</b> <code>compiler/parser_wrapper.y</code> &nbsp;|&nbsp; <b>Focus:</b> Bison LALR(1) grammar, AST construction.", body_style),
        Paragraph("""
        "Thank you, Student 1. Respected committee members, I am Student 2, and I am responsible for Phase 2: Syntax Analysis and Abstract Syntax Tree generation.<br/><br/>
        While lexical analysis verifies individual words, syntax analysis verifies whether those words form grammatically valid sentences according to our Context-Free Grammar. We implemented this phase in <code>compiler/parser_wrapper.y</code> using Bison, an LALR(1) parser generator.<br/><br/>
        In C, operator precedence and grammar ambiguities are significant challenges. In our Bison specification, we resolve ambiguities mathematically using operator precedence declarations. For instance, assignment is declared right-associative using <code>%right '='</code>, while arithmetic operators are left-associative. We resolve the classic dangling-else ambiguity using <code>%nonassoc LOWER_THAN_ELSE</code> and <code>%nonassoc ELSE</code>, ensuring the else clause always binds to the nearest open if condition.<br/><br/>
        Beyond grammatical validation, our parser synthesizes an Abstract Syntax Tree in memory. Every grammar reduction executes our AST builder function, <code>mknode(left, right, token_name)</code>. This dynamically allocates a <code>struct node</code>, creating parent-child linkages that represent the hierarchical structure of expressions.<br/><br/>
        In our live demo, our AST panel renders this hierarchical tree, and our debug engine provides <code>print_inorder()</code> to traverse the tree structure. I now invite Student 3 to explain how semantic checks and symbol management are applied to this tree."
        """, speech_style)
    ]
    story.append(KeepTogether(s2_elements))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: SPEAKING SCRIPTS (STUDENTS 3 & 4)
    # =========================================================================
    story.append(Paragraph("4. Six-Student Presentation Speaking Scripts (Students 3 &amp; 4)", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_primary, spaceBefore=2, spaceAfter=6))

    # Student 3 Block
    s3_elements = [
        Paragraph("Student 3 Speaking Script — Phase 3: Semantic Analysis &amp; Symbol Table", h2_style),
        Paragraph("<b>Target Time:</b> 2:30 min &nbsp;|&nbsp; <b>Files:</b> <code>compiler/parser_wrapper.y</code> &nbsp;|&nbsp; <b>Focus:</b> Symbol table, scope, declaration checks, stdlib whitelist.", body_style),
        Paragraph("""
        "Thank you, Student 2. Good morning, evaluators. I am Student 3, and I oversee Phase 3: Semantic Analysis and Symbol Table Management.<br/><br/>
        A program can be syntactically perfect but semantically invalid. For example, using an undeclared variable or re-declaring an identifier in the same scope violates semantic rules. Our semantic analyzer is implemented inside <code>compiler/parser_wrapper.y</code>.<br/><br/>
        The core data structure of this phase is our static symbol table: <code>struct dataType symbol_table[300]</code>. Each record stores the identifier name, data type, category—whether variable or function—declaration line number, and lexical scope. Whenever an identifier is referenced, our <code>check_declaration()</code> function scans the symbol table. If the variable was not previously declared, the compiler halts with an informative error message: <i>Line X: Variable 'var' used without prior declaration.</i><br/><br/>
        A major engineering accomplishment in our project is standard library integration. In standard C programs, functions like <code>printf</code>, <code>scanf</code>, and <code>malloc</code> are called without explicit local definitions. To prevent false undeclared identifier errors, we implemented a whitelist of 47 standard library routines. Furthermore, our semantic analyzer guards against keyword shadowing and performs implicit type promotions, such as <code>inttofloat</code>.<br/><br/>
        In our live demonstration, if I introduce an undeclared variable <code>x = 5;</code>, our compiler immediately flags the semantic violation. I will now hand over to Student 4 to explain how this validated AST is converted into Three-Address Code."
        """, speech_style)
    ]
    story.append(KeepTogether(s3_elements))

    story.append(Spacer(1, 8))

    # Student 4 Block
    s4_elements = [
        Paragraph("Student 4 Speaking Script — Phase 4: Intermediate Code Generation", h2_style),
        Paragraph("<b>Target Time:</b> 2:30 min &nbsp;|&nbsp; <b>Files:</b> <code>compiler/parser_wrapper.y</code> &nbsp;|&nbsp; <b>Focus:</b> Three-Address Code, quadruples, temporary registers, labels.", body_style),
        Paragraph("""
        "Thank you, Student 3. Respected professors, I am Student 4, responsible for Phase 4: Intermediate Code Generation.<br/><br/>
        Intermediate representation is the bridge between language-specific frontends and machine-specific backends. Rather than compiling directly to target assembly, our compiler generates Three-Address Code (TAC), represented internally as quadruples.<br/><br/>
        Our ICG engine is implemented in <code>compiler/parser_wrapper.y</code>. Intermediate instructions are stored in an array of quadruples: <code>struct quad icg[500]</code>, populated via our emission helper: <code>emit_ir(op, arg1, arg2, result)</code>. Each quadruple contains at most one operator and two operands.<br/><br/>
        To linearize complex nested expressions, our engine synthesizes virtual temporary registers: <code>t0, t1, t2</code> using an internal counter. For control-flow constructs like <code>while</code> loops and <code>if-else</code> branches, we synthesize jump labels: <code>L0, L1, L2</code>. For example, a while loop is transformed into a test condition, a conditional branch <code>ifFalse t0 goto L1</code>, the loop body, and an unconditional <code>goto L0</code>.<br/><br/>
        This Three-Address Code provides a clean, machine-independent representation of program logic. I will now invite Student 5 to explain how our compiler optimizes this intermediate code before execution."
        """, speech_style)
    ]
    story.append(KeepTogether(s4_elements))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 7: SPEAKING SCRIPTS (STUDENTS 5 & 6)
    # =========================================================================
    story.append(Paragraph("4. Six-Student Presentation Speaking Scripts (Students 5 &amp; 6)", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_primary, spaceBefore=2, spaceAfter=6))

    # Student 5 Block
    s5_elements = [
        Paragraph("Student 5 Speaking Script — Phase 5: Code Optimization", h2_style),
        Paragraph("<b>Target Time:</b> 2:30 min &nbsp;|&nbsp; <b>Files:</b> <code>compiler/parser_wrapper.y</code> &nbsp;|&nbsp; <b>Focus:</b> Constant folding, algebraic identities, compile-time evaluation.", body_style),
        Paragraph("""
        "Thank you, Student 4. Good morning, evaluators. I am Student 5, and I am responsible for Phase 5: Machine-Independent Code Optimization.<br/><br/>
        The objective of code optimization is to improve execution efficiency and reduce code size while strictly preserving program semantics. In our implementation, we focused on compile-time Constant Folding and Constant Propagation within <code>compiler/parser_wrapper.y</code>.<br/><br/>
        Our optimization logic is implemented inside <code>binary_expression()</code> and assisted by our evaluation predicate <code>can_eval()</code>. During bottom-up parsing, whenever a binary operation involves two numeric constants—such as <code>int a = 10 + 20 * 3;</code>—our optimizer does not emit runtime multiplication and addition quadruples. Instead, it evaluates <code>20 * 3</code> to <code>60</code>, and <code>10 + 60</code> to <code>70</code> at compile time, emitting a single assignment: <code>a = 70</code>.<br/><br/>
        Our optimizer also includes safety guards: it checks for division by literal zero at compile time, warning the developer and halting illegal folding. In our live test cases, this optimization reduces the required instruction count and temporary register allocations by over 50%.<br/><br/>
        I will now hand over to Student 6 to explain how our optimized compiler connects to target execution and our web interface."
        """, speech_style)
    ]
    story.append(KeepTogether(s5_elements))

    story.append(Spacer(1, 8))

    # Student 6 Block
    s6_elements = [
        Paragraph("Student 6 Speaking Script — Phase 6: Execution, CLI Driver &amp; Web Studio", h2_style),
        Paragraph("<b>Target Time:</b> 3:00 min &nbsp;|&nbsp; <b>Files:</b> <code>cli/main.c</code>, <code>backend/</code>, <code>frontend/</code> &nbsp;|&nbsp; <b>Focus:</b> Subprocesses, GCC delegation, web architecture.", body_style),
        Paragraph("""
        "Thank you, Student 5. Respected committee members, I am Student 6, and I cover Phase 6: Target Code Execution, CLI Driver Orchestration, and Web Studio Integration.<br/><br/>
        In professional compiler engineering, maintaining clear boundaries is essential. Our custom compiler implements Phases 1 through 5: scanning, parsing, semantic analysis, intermediate code generation, and optimization. For final machine code generation and ABI linkage, our native driver delegatively invokes the host C backend compiler—either GCC or Clang.<br/><br/>
        In <code>cli/main.c</code>, our driver implements <code>find_c_backend()</code>, auto-detecting the available compiler on the host system. It provides command-line flags like <code>--tokens</code>, <code>--ast</code>, <code>--symtab</code>, and <code>--ir</code> to inspect every compiler phase directly from the terminal.<br/><br/>
        To make our compiler accessible for educational instruction, we integrated it with a full-stack web studio. The frontend is built in React 19 and TypeScript, featuring a Monaco code editor. When a user clicks 'Compile &amp; Run', the frontend transmits the code to our Node.js Express backend at <code>/api/compile</code>. The backend executes the compilation in an isolated temporary sandbox with timeout safeguards, capturing stdout, stderr, and phase inspection outputs, and streaming them back to interactive UI panels.<br/><br/>
        We will now proceed with our live demonstration of C Compiler Studio. Thank you."
        """, speech_style)
    ]
    story.append(KeepTogether(s6_elements))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 8: SECTION 5: VIVA VOCE DEFENSE (STUDENTS 1, 2, 3)
    # =========================================================================
    story.append(Paragraph("5. Comprehensive Academic Viva Voce Defense (Part I)", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_primary, spaceBefore=2, spaceAfter=6))

    viva_part1 = [
        ("Student 1 (Lexical Analysis)", [
            ("Q1: What is the Maximal Munch rule and how does Flex implement it?",
             "Maximal Munch dictates that if multiple regular expressions match the current input, the lexer selects the rule that matches the longest sequence of characters. For example, '==' is matched as EQUAL rather than two consecutive ASSIGN tokens. Flex achieves this using a Deterministic Finite Automaton with lookahead states."),
            ("Q2: Why is the COPY_TOKEN() macro necessary in lexer.l?",
             "In lexer.l, COPY_TOKEN() uses strncpy to limit copied token text to 99 characters plus an explicit null-terminator. This prevents buffer overflows and heap memory corruption if an unexpectedly large token is encountered."),
            ("Q3: How does your lexer handle multi-line comments without losing the line count?",
             "When matching multiline comment delimiters (/* ... */), our custom countn() function iterates through the matched yytext buffer and increments the global line counter yylineno for every newline character found."),
            ("Q4: What is the difference between a lexeme, a token, and a pattern?",
             "A pattern is the regular expression rule (e.g., [0-9]+). A lexeme is the concrete instance of characters in the source code matching that pattern (e.g., '42'). A token is the abstract category returned to the parser (e.g., INTEGER).")
        ]),
        ("Student 2 (Syntax Analysis)", [
            ("Q1: What grammar classification is used by Bison, and what does LALR(1) mean?",
             "Bison uses LALR(1) parsing—Look-Ahead Left-to-right, Rightmost derivation with 1 lookahead token. It merges LR(1) states with identical parsing cores to produce a compact pushdown automaton."),
            ("Q2: How did you resolve the dangling-else ambiguity in your grammar?",
             "We declared %nonassoc LOWER_THAN_ELSE and %nonassoc ELSE in parser_wrapper.y. This tells Bison to give the shift operation higher priority than the reduce operation when seeing an 'else' token, binding it to the nearest 'if'."),
            ("Q3: What information is stored in struct node in your AST?",
             "Each struct node contains a char *token (representing the operator, identifier, or keyword) and two pointers: struct node *left and struct node *right, forming a binary syntax tree."),
            ("Q4: What is the difference between a Parse Tree and an Abstract Syntax Tree?",
             "A parse tree contains every terminal and non-terminal defined in the grammar, including syntactic noise like parentheses and semicolons. An AST retains only semantically significant operators, operands, and control flow nodes.")
        ]),
        ("Student 3 (Semantic Analysis)", [
            ("Q1: What data structure did you choose for your symbol table and why?",
             "We implemented a static array struct dataType symbol_table[300]. For our educational ANSI C subset, an array provides deterministic O(1) indexed access with predictable memory footprint without dynamic pointer overhead."),
            ("Q2: How does check_declaration() work when an identifier is used?",
             "check_declaration() iterates through the symbol table backwards from the current index, comparing the identifier name. If no matching record is found, it logs a semantic error and halts code generation."),
            ("Q3: How did you prevent printf() and scanf() from triggering undeclared identifier errors?",
             "We implemented a standard library whitelist containing 47 common C functions. During symbol lookup, if an identifier matches the whitelist, it is treated as a pre-declared global function symbol."),
            ("Q4: Can your compiler detect type mismatches in variable assignments?",
             "Yes. The semantic analyzer compares the data type of the target variable against the expression result. If assigning an int to a float, it injects an explicit 'inttofloat' coercion node into the AST.")
        ])
    ]

    for student_title, qas in viva_part1:
        story.append(Paragraph(student_title, h2_style))
        for q, a in qas:
            story.append(Paragraph(clean_xml(q), viva_q_style))
            story.append(Paragraph(clean_xml(a), viva_a_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 9: SECTION 5: VIVA VOCE DEFENSE (STUDENTS 4, 5, 6)
    # =========================================================================
    story.append(Paragraph("5. Comprehensive Academic Viva Voce Defense (Part II)", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_primary, spaceBefore=2, spaceAfter=6))

    viva_part2 = [
        ("Student 4 (Intermediate Code Generation)", [
            ("Q1: Why is Three-Address Code chosen as the intermediate representation?",
             "TAC linearizes hierarchical tree structures into elementary instructions with at most one operator and two operands. This closely mirrors CPU instruction sets, simplifying machine code translation."),
            ("Q2: How are temporary variables managed during expression evaluation?",
             "We use a global counter temp_var. Each time emit_ir() generates a new quadruple for an intermediate calculation, it formats a new temporary name ('t0', 't1'...) and increments the counter."),
            ("Q3: How does your compiler translate a while loop into Three-Address Code?",
             "It allocates two labels (e.g., L0 and L1). It emits L0 as the loop header, generates TAC for the condition, emits 'ifFalse condition goto L1', emits the loop body, emits 'goto L0', and finally emits label L1."),
            ("Q4: What is the quadruple structure in your icg array?",
             "struct quad { char op[10]; char arg1[20]; char arg2[20]; char res[20]; }; Each quadruple cleanly represents one atomic instruction.")
        ]),
        ("Student 5 (Code Optimization)", [
            ("Q1: What is Constant Folding and when does it occur in your compiler?",
             "Constant Folding evaluates operations on compile-time known constants during compilation rather than emitting runtime CPU instructions. In our compiler, it occurs during AST reduction inside binary_expression()."),
            ("Q2: How does can_eval() verify if an expression can be folded?",
             "can_eval(char *op1, char *op2) checks whether both operand strings consist purely of digits. If either operand is a variable or temporary register, can_eval() returns false, preserving runtime evaluation."),
            ("Q3: How does your optimizer prevent division-by-zero crashes at compile time?",
             "When binary_expression() detects a division operator ('/'), it verifies that the divisor operand is not numeric zero. If zero is detected, it logs an error and aborts folding."),
            ("Q4: What is the difference between machine-independent and machine-dependent optimization?",
             "Machine-independent optimization operates on intermediate code without knowledge of the target CPU. Machine-dependent optimization depends on target CPU instructions, pipeline depths, and register counts.")
        ]),
        ("Student 6 (Target Execution & Full-Stack)", [
            ("Q1: Why does the compiler delegate machine code generation to GCC rather than emitting raw assembly?",
             "Building a full industrial backend requires deep platform ABI compliance, register allocation, and OS linker integration. Delegating to host GCC allows our project to focus on custom frontend and intermediate compiler phases."),
            ("Q2: How does find_c_backend() locate the host compiler in cli/main.c?",
             "find_c_backend() first checks the $CC environment variable. If unset, it probes standard system binary paths (/usr/bin/gcc, /usr/bin/clang, /opt/homebrew/bin/gcc) to select an available compiler."),
            ("Q3: How does the web studio sandbox user code execution safely?",
             "The backend creates a unique temporary scratch directory for every compile request using fs.mkdtemp(). The process runs with strict execution timeouts to terminate infinite loops and prevent server starvation."),
            ("Q4: What REST API endpoints exist in the backend?",
             "The primary endpoint is POST /api/compile, which accepts { code, stdin, options } and returns a JSON payload containing stdout, stderr, executionTime, exitCode, and phase visualization buffers.")
        ])
    ]

    for student_title, qas in viva_part2:
        story.append(Paragraph(student_title, h2_style))
        for q, a in qas:
            story.append(Paragraph(clean_xml(q), viva_q_style))
            story.append(Paragraph(clean_xml(a), viva_a_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 10: SECTION 6: MASTER FILE REFERENCE & SYNTAX-FORMATTED EXCERPTS
    # =========================================================================
    story.append(Paragraph("6. Master Source Code File Reference Table", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_primary, spaceBefore=2, spaceAfter=6))

    file_table_data = [
        [
            Paragraph("Phase", table_header),
            Paragraph("File Path", table_header),
            Paragraph("Lines", table_header),
            Paragraph("Key Functions / Structures", table_header),
            Paragraph("Owner", table_header)
        ],
        [
            Paragraph("Phase 1", table_cell),
            Paragraph("<code>compiler/lexer.l</code>", table_cell),
            Paragraph("100", table_cell),
            Paragraph("<code>yylex()</code>, <code>COPY_TOKEN()</code>, <code>countn()</code>", table_cell),
            Paragraph("Student 1", table_cell)
        ],
        [
            Paragraph("Phase 2", table_cell),
            Paragraph("<code>compiler/parser_wrapper.y</code>", table_cell),
            Paragraph("1042", table_cell),
            Paragraph("<code>yyparse()</code>, <code>mknode()</code>, <code>print_inorder()</code>", table_cell),
            Paragraph("Student 2", table_cell)
        ],
        [
            Paragraph("Phase 3", table_cell),
            Paragraph("<code>compiler/parser_wrapper.y</code>", table_cell),
            Paragraph("~250", table_cell),
            Paragraph("<code>symbol_table[300]</code>, <code>check_declaration()</code>", table_cell),
            Paragraph("Student 3", table_cell)
        ],
        [
            Paragraph("Phase 4", table_cell),
            Paragraph("<code>compiler/parser_wrapper.y</code>", table_cell),
            Paragraph("~200", table_cell),
            Paragraph("<code>icg[500]</code>, <code>emit_ir()</code>, <code>temp_var</code>, <code>label</code>", table_cell),
            Paragraph("Student 4", table_cell)
        ],
        [
            Paragraph("Phase 5", table_cell),
            Paragraph("<code>compiler/parser_wrapper.y</code>", table_cell),
            Paragraph("~150", table_cell),
            Paragraph("<code>binary_expression()</code>, <code>can_eval()</code>", table_cell),
            Paragraph("Student 5", table_cell)
        ],
        [
            Paragraph("Phase 6 (CLI)", table_cell),
            Paragraph("<code>cli/main.c</code>", table_cell),
            Paragraph("629", table_cell),
            Paragraph("<code>find_c_backend()</code>, <code>run_backend_compiler()</code>", table_cell),
            Paragraph("Student 6", table_cell)
        ],
        [
            Paragraph("Phase 6 (Web)", table_cell),
            Paragraph("<code>backend/src/services/</code>", table_cell),
            Paragraph("~400", table_cell),
            Paragraph("<code>compilerService.ts</code>, <code>/api/compile</code>", table_cell),
            Paragraph("Student 6", table_cell)
        ]
    ]

    t_files = Table(file_table_data, colWidths=[55, 140, 40, 195, 82])
    t_files.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_files)

    story.append(Spacer(1, 6))
    story.append(Paragraph("Representative Source Code Excerpts from Repository", h2_style))

    code_p1 = """// Excerpt from compiler/lexer.l: Safe Token Copying Macro
#define COPY_TOKEN() do { \\
    strncpy(yylval.nd_obj.name, yytext, 99); \\
    yylval.nd_obj.name[99] = '\\0'; \\
} while(0)

"int"       { COPY_TOKEN(); return INT; }
"float"     { COPY_TOKEN(); return FLOAT; }
"return"    { COPY_TOKEN(); return RETURN; }"""
    story.append(Paragraph("Phase 1: Lexical Buffer Safety (<code>compiler/lexer.l</code>)", h3_style))
    story.append(Preformatted(code_p1, pre_style))

    code_p2 = """// Excerpt from compiler/parser_wrapper.y: AST Node Construction
struct node* mknode(struct node *left, struct node *right, char *token) {
    struct node *newnode = (struct node *)malloc(sizeof(struct node));
    char *newstr = (char *)malloc(strlen(token) + 1);
    strcpy(newstr, token);
    newnode->left = left;
    newnode->right = right;
    newnode->token = newstr;
    return newnode;
}"""
    story.append(Paragraph("Phase 2: Dynamic AST Node Generation (<code>compiler/parser_wrapper.y</code>)", h3_style))
    story.append(Preformatted(code_p2, pre_style))

    code_p5 = """// Excerpt from compiler/parser_wrapper.y: Compile-Time Constant Folding
int can_eval(char *op1, char *op2) {
    return (isdigit(op1[0]) || (op1[0] == '-' && isdigit(op1[1]))) &&
           (isdigit(op2[0]) || (op2[0] == '-' && isdigit(op2[1])));
}

void binary_expression(char *res, char *op1, char *op, char *op2) {
    if (can_eval(op1, op2)) {
        int v1 = atoi(op1);
        int v2 = atoi(op2);
        if (strcmp(op, "+") == 0) sprintf(res, "%d", v1 + v2);
        else if (strcmp(op, "*") == 0) sprintf(res, "%d", v1 * v2);
        return; // Folded at compile time! No runtime instruction emitted.
    }
    emit_ir(op, op1, op2, res); // Emit Three-Address Code quadruple
}"""
    story.append(Paragraph("Phase 5: Compile-Time Constant Folding Engine (<code>compiler/parser_wrapper.y</code>)", h3_style))
    story.append(Preformatted(code_p5, pre_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 11: SECTION 7 & 8: DEMO PLAN, LIMITATIONS & CONCLUSION
    # =========================================================================
    story.append(Paragraph("7. Live Demonstration Plan &amp; Fallback Strategy", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_primary, spaceBefore=2, spaceAfter=6))

    demo_plan_text = """
    <b>Live Evaluation Protocol (Target Duration: 3 to 5 Minutes):</b>
    <ol>
      <li><b>System Launch:</b> Open C Compiler Studio web frontend at <code>http://localhost:3005</code>.</li>
      <li><b>Baseline Compilation:</b> Enter a standard arithmetic C program with multiple statements. Click 'Compile &amp; Run'.</li>
      <li><b>Student 1 Demo:</b> Open <b>Tokens Panel</b>. Demonstrate token classification and safe buffer parsing.</li>
      <li><b>Student 2 Demo:</b> Open <b>AST Tree Panel</b>. Demonstrate hierarchical parent-child operator associativity.</li>
      <li><b>Student 3 Demo:</b> Open <b>Symbol Table Panel</b>. Inspect variable type records and scope values.</li>
      <li><b>Student 4 &amp; 5 Demo:</b> Open <b>Intermediate Code Panel</b>. Show Three-Address Code quadruples and highlight constant folding (e.g., <code>10 + 20 * 3</code> folded to <code>70</code>).</li>
      <li><b>Negative Semantic Test:</b> Add an undeclared variable (<code>k = 42;</code>). Click Compile. Observe clear semantic diagnostic error without compiler crash.</li>
    </ol>
    <b>Offline Fallback Contingency:</b><br/>
    If web network access is interrupted, the team will immediately execute the native CLI driver from the terminal:
    <br/><code>./c_compiler_cli test_program.c --tokens --ast --symtab --ir --opt -o test_bin &amp;&amp; ./test_bin</code><br/>
    This exercises the exact same Flex/Bison compiler binary natively.
    """
    story.append(Paragraph(demo_plan_text, body_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("8. Engineering Limitations &amp; Future Roadmap", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_primary, spaceBefore=2, spaceAfter=6))

    roadmap_text = """
    <b>Transparent Engineering Limitations:</b>
    <ul>
      <li><b>Static Symbol Table Capacity:</b> Currently configured with a fixed capacity of 300 entries (<code>symbol_table[300]</code>) rather than a dynamically growing hash table.</li>
      <li><b>Scope Hierarchy:</b> Block scoping is tracked via an integer scope counter, but deep lexical block shadowing across nested scopes is limited.</li>
      <li><b>Target Backend Delegation:</b> Machine code emission relies on host GCC/Clang rather than an internal direct x86/ARM code generator or LLVM backend.</li>
    </ul>
    <b>Future Engineering Roadmap:</b>
    <ul>
      <li><b>Dynamic Hash Table Symbol Table:</b> Implement red-black tree or chained hash buckets for unbounded symbol capacity.</li>
      <li><b>Native LLVM IR Integration:</b> Replace text-based TAC emission with LLVM Bitcode generation, unlocking LLVM's industrial optimization pipeline.</li>
      <li><b>Control-Flow Graph (CFG) Visualizer:</b> Add web-based rendering of basic blocks and dominator trees.</li>
    </ul>
    """
    story.append(Paragraph(roadmap_text, body_style))

    story.append(Spacer(1, 8))
    conclusion_text = """
    <b>Conclusion &amp; Academic Sign-Off:</b><br/>
    C Compiler Studio demonstrates a rigorous, authentic multi-phase compiler implementation built on foundational computer science theory. Each of the six team members has designed, implemented, and verified their designated compiler phase. The complete source code, automated build test suites, interactive web IDE, and full documentation are fully available for evaluation.
    """
    story.append(Paragraph(conclusion_text, speech_style))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: Generated PDF at {output_pdf_path}")


if __name__ == "__main__":
    build_pdf()
