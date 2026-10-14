%{
    #include <stdio.h>
    #include <string.h>
    #include <stdlib.h>
    #include <ctype.h>
    #include <limits.h>
    #include <math.h>
    #include <stdarg.h>
    void emit_ir(const char *, ...);
    void add_error(const char *, ...);
    struct var_name;
    struct var_name binary_expression(struct var_name, const char *, struct var_name);
    
    struct node { 
        struct node *left; 
        struct node *right; 
        char *token; 
    };

    #include "lex.yy.c"

    void yyerror(const char *s);
    int yylex();
    int yywrap();
    void add(char);
    void add_symbol(char c, const char *name);
    void set_symbol_value(const char *name, const char *val);
    char *get_symbol_value(const char *name);
    int is_num(const char *s);
    double get_num_val(const char *s);
    int can_eval(const char *s);
    void reset_compiler_state();
    void insert_type();
    int search(char *);
    void print_tree(struct node*);
    void print_tree_util(struct node*, int);
    void print_inorder(struct node *);
    void check_declaration(char *);
    void check_return_type(char *);
    int check_types(char *, char *);
    char *get_type(char *);
    struct node* mknode(struct node *left, struct node *right, const char *token);

    // External flags from CLI
    extern int show_tokens;
    extern int show_symbols;
    extern int show_parse_tree;
    extern int show_semantic;
    extern int show_ir;
    extern int quiet_mode;

    struct dataType {
        char * id_name;
        char * data_type;
        char * type;
        int line_no;
        char * value;
	} symbol_table[300];

    int count=0;
    int q;
	char type[30];
    extern int countn;
	struct node *head = NULL;
	int sem_errors=0;
	int ic_idx=0;
	int temp_var=0;
	int label=0;
	int is_for=0;
	char buff[512];
	char errors[100][100];
	char reserved[20][15] = {"int", "float", "double", "char", "void", "long", "short", "unsigned", "signed", "const", "if", "else", "for", "while", "do", "switch", "case", "default", "main", "return"};
	char icg[500][512];
%}

%union { 
    struct var_name { 
        char name[100]; 
        struct node* nd;
        char type[20];
    } nd_obj; 

    struct var_name3 {
        char name[100];
        struct node* nd;
        char if_body[10];
        char else_body[10];
    } nd_obj3;
} 

%token VOID 
%token <nd_obj> CHARACTER PRINTFF SCANFF INT FLOAT DOUBLE CHAR LONG SHORT UNSIGNED SIGNED CONST FOR WHILE DO IF ELSE SWITCH CASE DEFAULT BREAK CONTINUE SIZEOF TRUE FALSE NUMBER FLOAT_NUM ID LE GE EQ NE GT LT AND OR STR ADD MULTIPLY DIVIDE SUBTRACT MODULO UNARY INCLUDE RETURN NULL_TOKEN ADD_ASSIGN SUB_ASSIGN MUL_ASSIGN DIV_ASSIGN MOD_ASSIGN LSHIFT RSHIFT AMPERSAND BITOR BITXOR BITNOT NOT

%type <nd_obj> headers header program body statement_list statement_or_block for_header for_init for_update switch_body switch_case else datatype type_specifier statement id_list declarator direct_declarator pointer_opt assignment_op relop scanf_arg scanf_args printf_arg printf_args call_arg call_args function_call array_access param param_list main_func function_def functions global_declarations global_declaration init init_list value expression
%type <nd_obj3> condition

%right '=' ADD_ASSIGN SUB_ASSIGN MUL_ASSIGN DIV_ASSIGN MOD_ASSIGN
%right '?' ':'
%left OR
%left AND
%left BITOR
%left BITXOR
%left AMPERSAND
%left EQ NE
%left LT GT LE GE
%left LSHIFT RSHIFT
%left ADD SUBTRACT
%left MULTIPLY DIVIDE MODULO
%right NOT BITNOT UNARY CAST
%left '[' ']' '(' ')'

%%

program: headers global_declarations main_func functions { 
	head = $3.nd; 
	$$.nd = mknode($1.nd, $3.nd, "program"); 
}
;

headers: headers header { $$.nd = mknode($1.nd, $2.nd, "headers"); }
| /* empty */ { $$.nd = NULL; }
;

header: INCLUDE { add_symbol('H', $1.name); $$.nd = mknode(NULL, NULL, $1.name); }
;

global_declarations: global_declarations global_declaration { $$.nd = mknode($1.nd, $2.nd, "globals"); }
| /* empty */ { $$.nd = NULL; }
;

global_declaration: statement ';' { $$.nd = $1.nd; }
| expression ';' { $$.nd = $1.nd; }
;

functions: functions function_def { $$.nd = mknode($1.nd, $2.nd, "functions"); }
| /* empty */ { $$.nd = NULL; }
;

function_def: datatype ID '(' param_list ')' '{' body '}' { 
	add_symbol('F', $2.name); 
	$$.nd = mknode($7.nd, NULL, $2.name);
}
| datatype ID '(' ')' '{' body '}' { 
	add_symbol('F', $2.name); 
	$$.nd = mknode($6.nd, NULL, $2.name);
}
;

main_func: datatype ID '(' param_list ')' '{' body '}' { 
	add_symbol('F', $2.name); 
	$$.nd = mknode($7.nd, NULL, "main"); 
}
| datatype ID '(' ')' '{' body '}' { 
	add_symbol('F', $2.name); 
	$$.nd = mknode($6.nd, NULL, "main"); 
}
;

param_list: param_list ',' param { $$.nd = mknode($1.nd, $3.nd, "params"); }
| param { $$.nd = $1.nd; }
| VOID { $$.nd = NULL; }
| /* empty */ { $$.nd = NULL; }
;

param: datatype ID { add_symbol('V', $2.name); $$.nd = mknode(NULL, NULL, $2.name); }
| datatype ID '[' ']' { add_symbol('V', $2.name); $$.nd = mknode(NULL, NULL, $2.name); }
| datatype MULTIPLY ID { add_symbol('V', $3.name); $$.nd = mknode(NULL, NULL, $3.name); }
| datatype { $$.nd = NULL; }
;

type_specifier: INT { insert_type(); strcpy(type, "int"); }
| FLOAT { insert_type(); strcpy(type, "float"); }
| DOUBLE { insert_type(); strcpy(type, "float"); }
| CHAR { insert_type(); strcpy(type, "char"); }
| VOID { insert_type(); strcpy(type, "void"); }
| LONG { insert_type(); strcpy(type, "int"); }
| SHORT { insert_type(); strcpy(type, "int"); }
| UNSIGNED type_specifier { strcpy(type, "int"); }
| SIGNED type_specifier { strcpy(type, "int"); }
| CONST type_specifier
| LONG type_specifier { strcpy(type, "int"); }
| type_specifier MULTIPLY { /* pointer type */ }
;

datatype: type_specifier { $$.nd = NULL; }
;

body: statement_list { $$.nd = $1.nd; }
| /* empty */ { $$.nd = NULL; }
;

statement_list: statement_list statement_or_block { $$.nd = mknode($1.nd, $2.nd, "statements"); }
| statement_or_block { $$.nd = $1.nd; }
;

statement_or_block: '{' body '}' { $$.nd = $2.nd; }
| FOR { is_for = 1; } '(' for_header ')' statement_or_block { 
	$$.nd = mknode($4.nd, $6.nd, "for"); 
	emit_ir( "JUMP to for_loop\n");
}
| WHILE { is_for = 0; } '(' condition ')' statement_or_block {
	$$.nd = mknode($4.nd, $6.nd, "while");
	emit_ir( "JUMP to %s\n", $4.if_body);
	emit_ir( "\nLABEL %s:\n", $4.else_body);
}
| DO statement_or_block WHILE '(' condition ')' ';' {
	$$.nd = mknode($2.nd, $5.nd, "do-while");
}
| IF { is_for = 0; } '(' condition ')' { emit_ir( "\nLABEL %s:\n", $4.if_body); } statement_or_block { emit_ir( "\nLABEL %s:\n", $4.else_body); } else { 
	struct node *iff = mknode($4.nd, $7.nd, "if"); 
	$$.nd = mknode(iff, $9.nd, "if-else"); 
	emit_ir( "GOTO next\n");
}
| SWITCH '(' expression ')' '{' switch_body '}' { $$.nd = mknode($3.nd, $6.nd, "switch"); }
| BREAK ';' { $$.nd = mknode(NULL, NULL, "break"); }
| CONTINUE ';' { $$.nd = mknode(NULL, NULL, "continue"); }
| RETURN expression ';' { 
	check_return_type($2.name); 
	$$.nd = mknode(mknode(NULL, NULL, "return"), $2.nd, "RETURN"); 
	emit_ir( "RETURN %s\n", $2.name); 
}
| RETURN ';' { 
	$$.nd = mknode(NULL, NULL, "return"); 
	emit_ir( "RETURN\n"); 
}
| statement ';' { $$.nd = $1.nd; }
| expression ';' { $$.nd = $1.nd; }
;

for_header: for_init ';' condition ';' for_update {
	struct node *temp = mknode($3.nd, $5.nd, "CONDITION"); 
	$$.nd = mknode($1.nd, temp, "for_header"); 
}
;

for_init: statement { $$.nd = $1.nd; }
| expression { $$.nd = $1.nd; }
| /* empty */ { $$.nd = NULL; }
;

for_update: statement { $$.nd = $1.nd; }
| expression { $$.nd = $1.nd; }
| /* empty */ { $$.nd = NULL; }
;

switch_body: switch_body switch_case { $$.nd = mknode($1.nd, $2.nd, "cases"); }
| switch_case { $$.nd = $1.nd; }
| /* empty */ { $$.nd = NULL; }
;

switch_case: CASE expression ':' body { $$.nd = mknode($2.nd, $4.nd, "case"); }
| DEFAULT ':' body { $$.nd = mknode(NULL, $3.nd, "default"); }
;

else: ELSE statement_or_block { $$.nd = mknode(NULL, $2.nd, "else"); }
| /* empty */ { $$.nd = NULL; }
;

condition: expression relop expression { 
	$$.nd = mknode($1.nd, $3.nd, $2.name); 
	if(is_for) {
		sprintf($$.if_body, "L%d", label++);
		emit_ir( "\nLABEL %s:\n", $$.if_body);
		emit_ir( "\nif NOT (%s %s %s) GOTO L%d\n", $1.name, $2.name, $3.name, label);
		sprintf($$.else_body, "L%d", label++);
	} else {
		emit_ir( "\nif (%s %s %s) GOTO L%d else GOTO L%d\n", $1.name, $2.name, $3.name, label, label+1);
		sprintf($$.if_body, "L%d", label++);
		sprintf($$.else_body, "L%d", label++);
	}
}
| expression {
	$$.nd = $1.nd;
	if(is_for) {
		sprintf($$.if_body, "L%d", label++);
		emit_ir( "\nLABEL %s:\n", $$.if_body);
		emit_ir( "\nif NOT (%s != 0) GOTO L%d\n", $1.name, label);
		sprintf($$.else_body, "L%d", label++);
	} else {
		emit_ir( "\nif (%s != 0) GOTO L%d else GOTO L%d\n", $1.name, label, label+1);
		sprintf($$.if_body, "L%d", label++);
		sprintf($$.else_body, "L%d", label++);
	}
}
| condition AND condition { $$.nd = mknode($1.nd, $3.nd, "&&"); }
| condition OR condition { $$.nd = mknode($1.nd, $3.nd, "||"); }
| TRUE { $$.nd = NULL; }
| FALSE { $$.nd = NULL; }
| { $$.nd = NULL; }
;

statement: datatype id_list { $$.nd = $2.nd; }
;

assignment_op: ADD_ASSIGN { strcpy($$.name, "+="); }
| SUB_ASSIGN { strcpy($$.name, "-="); }
| MUL_ASSIGN { strcpy($$.name, "*="); }
| DIV_ASSIGN { strcpy($$.name, "/="); }
| MOD_ASSIGN { strcpy($$.name, "%="); }
;

id_list: id_list ',' declarator { $$.nd = mknode($1.nd, $3.nd, "declarations"); }
| declarator { $$.nd = $1.nd; }
;

declarator: pointer_opt direct_declarator init {
	$2.nd = mknode(NULL, NULL, $2.name); 
	int t = check_types(type, $3.type); 
	if(t>0) { 
		if(t == 1) {
			struct node *temp = mknode(NULL, $3.nd, "floattoint"); 
			$$.nd = mknode($2.nd, temp, "declaration"); 
		} 
		else if(t == 2) { 
			struct node *temp = mknode(NULL, $3.nd, "inttofloat"); 
			$$.nd = mknode($2.nd, temp, "declaration"); 
		} 
		else if(t == 3) { 
			struct node *temp = mknode(NULL, $3.nd, "chartoint"); 
			$$.nd = mknode($2.nd, temp, "declaration"); 
		} 
		else if(t == 4) { 
			struct node *temp = mknode(NULL, $3.nd, "inttochar"); 
			$$.nd = mknode($2.nd, temp, "declaration"); 
		} 
		else if(t == 5) { 
			struct node *temp = mknode(NULL, $3.nd, "chartofloat"); 
			$$.nd = mknode($2.nd, temp, "declaration"); 
		} 
		else{
			struct node *temp = mknode(NULL, $3.nd, "floattochar"); 
			$$.nd = mknode($2.nd, temp, "declaration"); 
		}
	} 
	else { 
		$$.nd = mknode($2.nd, $3.nd, "declaration"); 
	} 
	set_symbol_value($2.name, $3.name);
	emit_ir( "%s = %s\n", $2.name, $3.name);
}
;

pointer_opt: MULTIPLY { strcpy($$.name, "*"); }
| /* empty */ { strcpy($$.name, ""); $$.nd = NULL; }
;

direct_declarator: ID { add_symbol('V', $1.name); strcpy($$.name, $1.name); $$.nd = mknode(NULL, NULL, $1.name); }
| ID '[' ']' { add_symbol('V', $1.name); strcpy($$.name, $1.name); $$.nd = mknode(NULL, NULL, $1.name); }
| ID '[' expression ']' { add_symbol('V', $1.name); strcpy($$.name, $1.name); $$.nd = mknode(NULL, NULL, $1.name); }
| ID '[' expression ']' '[' expression ']' { add_symbol('V', $1.name); strcpy($$.name, $1.name); $$.nd = mknode(NULL, NULL, $1.name); }
;

init: '=' expression { $$.nd = $2.nd; sprintf($$.type, "%s", $2.type); strcpy($$.name, $2.name); }
| '=' STR { $$.nd = mknode(NULL, NULL, $2.name); sprintf($$.type, "char"); strcpy($$.name, $2.name); }
| '=' '{' init_list '}' { $$.nd = $3.nd; sprintf($$.type, "array"); strcpy($$.name, "array"); }
| { sprintf($$.type, "null"); $$.nd = mknode(NULL, NULL, "NULL"); strcpy($$.name, "NULL"); }
;

init_list: init_list ',' expression { $$.nd = mknode($1.nd, $3.nd, "elem"); }
| expression { $$.nd = $1.nd; }
| STR { $$.nd = mknode(NULL, NULL, $1.name); }
;

expression: expression ADD expression { $$ = binary_expression($1, $2.name, $3); }
| expression SUBTRACT expression { $$ = binary_expression($1, $2.name, $3); }
| expression MULTIPLY expression { $$ = binary_expression($1, $2.name, $3); }
| expression DIVIDE expression { $$ = binary_expression($1, $2.name, $3); }
| expression MODULO expression { $$ = binary_expression($1, $2.name, $3); }
| expression AMPERSAND expression { $$ = binary_expression($1, $2.name, $3); }
| expression BITOR expression { $$ = binary_expression($1, $2.name, $3); }
| expression BITXOR expression { $$ = binary_expression($1, $2.name, $3); }
| expression LSHIFT expression { $$ = binary_expression($1, $2.name, $3); }
| expression RSHIFT expression { $$ = binary_expression($1, $2.name, $3); }
| SUBTRACT expression %prec UNARY {
	if (can_eval($2.name)) {
		double v = get_num_val($2.name);
		if (!strcmp($2.type, "int")) sprintf($$.name, "%ld", -(long)v);
		else sprintf($$.name, "%.2f", -v);
	} else {
		sprintf($$.name, "t%d", temp_var++);
	}
	sprintf($$.type, "%s", $2.type);
	$$.nd = mknode(NULL, $2.nd, "neg");
	emit_ir( "%s = - %s\n", $$.name, $2.name);
}
| ADD expression %prec UNARY {
	strcpy($$.name, $2.name);
	sprintf($$.type, "%s", $2.type);
	$$.nd = $2.nd;
}
| NOT expression %prec UNARY {
	if (can_eval($2.name)) {
		double v = get_num_val($2.name);
		sprintf($$.name, "%d", (v == 0) ? 1 : 0);
	} else {
		sprintf($$.name, "t%d", temp_var++);
	}
	sprintf($$.type, "int");
	$$.nd = mknode(NULL, $2.nd, "not");
	emit_ir( "%s = ! %s\n", $$.name, $2.name);
}
| BITNOT expression %prec UNARY {
	if (can_eval($2.name)) {
		long v = (long)get_num_val($2.name);
		sprintf($$.name, "%ld", ~v);
	} else {
		sprintf($$.name, "t%d", temp_var++);
	}
	sprintf($$.type, "%s", $2.type);
	$$.nd = mknode(NULL, $2.nd, "bitnot");
	emit_ir( "%s = ~ %s\n", $$.name, $2.name);
}
| '(' type_specifier ')' expression %prec CAST {
	if (can_eval($4.name)) {
		double v = get_num_val($4.name);
		if (!strcmp(type, "int") || !strcmp(type, "long") || !strcmp(type, "short")) {
			sprintf($$.name, "%ld", (long)v);
		} else {
			sprintf($$.name, "%.2f", v);
		}
	} else {
		strcpy($$.name, $4.name);
	}
	sprintf($$.type, "%s", type);
	$$.nd = mknode(NULL, $4.nd, "cast");
}
| SIZEOF '(' type_specifier ')' {
	sprintf($$.name, "4");
	sprintf($$.type, "int");
	$$.nd = mknode(NULL, NULL, "sizeof");
}
| SIZEOF '(' expression ')' {
	sprintf($$.name, "4");
	sprintf($$.type, "int");
	$$.nd = mknode(NULL, NULL, "sizeof");
}
| expression '?' expression ':' expression {
	if (can_eval($1.name)) {
		double cond = get_num_val($1.name);
		if (cond != 0) strcpy($$.name, $3.name);
		else strcpy($$.name, $5.name);
	} else {
		sprintf($$.name, "t%d", temp_var++);
	}
	sprintf($$.type, "%s", $3.type);
	$$.nd = mknode($1.nd, mknode($3.nd, $5.nd, ":"), "?");
}
| ID '=' expression {
	check_declaration($1.name);
	strcpy($$.name, $1.name);
	sprintf($$.type, "%s", $3.type);
	$$.nd = mknode(mknode(NULL, NULL, $1.name), $3.nd, "=");
	set_symbol_value($1.name, $3.name);
	emit_ir( "%s = %s\n", $1.name, $3.name);
}
| ID '[' expression ']' '=' expression {
	check_declaration($1.name);
	$$.nd = mknode(mknode(NULL, NULL, $1.name), $6.nd, "[]=");
	emit_ir( "%s[%s] = %s\n", $1.name, $3.name, $6.name);
}
| MULTIPLY ID '=' expression {
	check_declaration($2.name);
	$$.nd = mknode(mknode(NULL, NULL, $2.name), $4.nd, "*=");
	emit_ir( "*%s = %s\n", $2.name, $4.name);
}
| ID assignment_op expression {
	check_declaration($1.name);
	$$.nd = mknode(mknode(NULL, NULL, $1.name), $3.nd, $2.name);
	if (can_eval($1.name) && can_eval($3.name)) {
		double v1 = get_num_val($1.name);
		double v2 = get_num_val($3.name);
		double r = v1;
		if (!strcmp($2.name, "+=")) r = v1 + v2;
		else if (!strcmp($2.name, "-=")) r = v1 - v2;
		else if (!strcmp($2.name, "*=")) r = v1 * v2;
		else if (!strcmp($2.name, "/=")) r = (v2 != 0) ? (v1 / v2) : 0;
		else if (!strcmp($2.name, "%=")) r = (long)v1 % (long)(v2 != 0 ? v2 : 1);
		char tmp[50];
		sprintf(tmp, "%ld", (long)r);
		set_symbol_value($1.name, tmp);
	}
	emit_ir( "%s = %s %s %s\n", $1.name, $1.name, $2.name, $3.name);
}
| ID UNARY { 
	check_declaration($1.name); 
	$1.nd = mknode(NULL, NULL, $1.name); 
	$2.nd = mknode(NULL, NULL, $2.name); 
	$$.nd = mknode($1.nd, $2.nd, "ITERATOR");  
	if (can_eval($1.name)) {
		long v = (long)get_num_val($1.name);
		char tmp[50];
		if ($2.name[0] == '+') v++;
		else if ($2.name[0] == '-') v--;
		sprintf(tmp, "%ld", v);
		set_symbol_value($1.name, tmp);
	}
	sprintf(buff, "t%d = %s %c 1\n%s = t%d\n", temp_var, $1.name, $2.name[0], $1.name, temp_var);
	temp_var++;
}
| UNARY ID { 
	check_declaration($2.name); 
	$1.nd = mknode(NULL, NULL, $1.name); 
	$2.nd = mknode(NULL, NULL, $2.name); 
	$$.nd = mknode($1.nd, $2.nd, "ITERATOR"); 
	if (can_eval($2.name)) {
		long v = (long)get_num_val($2.name);
		char tmp[50];
		if ($1.name[0] == '+') v++;
		else if ($1.name[0] == '-') v--;
		sprintf(tmp, "%ld", v);
		set_symbol_value($2.name, tmp);
	}
	sprintf(buff, "t%d = %s %c 1\n%s = t%d\n", temp_var, $2.name, $1.name[0], $2.name, temp_var);
	temp_var++;
}
| PRINTFF '(' STR ')' {
	$$.nd = mknode(NULL, NULL, "printf");
	sprintf($$.type, "int");
	sprintf($$.name, "t%d", temp_var++);
	emit_ir( "%s = call printf\n", $$.name);
}
| PRINTFF '(' STR ',' printf_args ')' {
	$$.nd = mknode(NULL, $5.nd, "printf");
	sprintf($$.type, "int");
	sprintf($$.name, "t%d", temp_var++);
	emit_ir( "%s = call printf\n", $$.name);
}
| SCANFF '(' STR ',' scanf_args ')' {
	$$.nd = mknode(NULL, $5.nd, "scanf");
	sprintf($$.type, "int");
	sprintf($$.name, "t%d", temp_var++);
	emit_ir( "%s = call scanf\n", $$.name);
}
| SCANFF '(' STR ')' {
	$$.nd = mknode(NULL, NULL, "scanf");
	sprintf($$.type, "int");
	sprintf($$.name, "t%d", temp_var++);
	emit_ir( "%s = call scanf\n", $$.name);
}
| '(' expression ')' { strcpy($$.name, $2.name); sprintf($$.type, "%s", $2.type); $$.nd = $2.nd; }
| function_call { strcpy($$.name, $1.name); sprintf($$.type, "%s", $1.type); $$.nd = $1.nd; }
| array_access { strcpy($$.name, $1.name); sprintf($$.type, "%s", $1.type); $$.nd = $1.nd; }
| value { strcpy($$.name, $1.name); sprintf($$.type, "%s", $1.type); $$.nd = $1.nd; }
;

function_call: ID '(' call_args ')' {
	$$.nd = mknode(mknode(NULL, NULL, $1.name), $3.nd, "call");
	sprintf($$.name, "t%d", temp_var++);
	sprintf($$.type, "int");
	emit_ir( "%s = call %s\n", $$.name, $1.name);
}
| ID '(' ')' {
	$$.nd = mknode(mknode(NULL, NULL, $1.name), NULL, "call");
	sprintf($$.name, "t%d", temp_var++);
	sprintf($$.type, "int");
	emit_ir( "%s = call %s\n", $$.name, $1.name);
}
;

call_args: call_args ',' call_arg { $$.nd = mknode($1.nd, $3.nd, "arg"); }
| call_arg { $$.nd = $1.nd; }
| /* empty */ { $$.nd = NULL; }
;

call_arg: expression { $$.nd = $1.nd; }
| STR { $$.nd = mknode(NULL, NULL, $1.name); }
| AMPERSAND ID { check_declaration($2.name); $$.nd = mknode(NULL, NULL, $2.name); }
;

array_access: ID '[' expression ']' {
	check_declaration($1.name);
	$$.nd = mknode(mknode(NULL, NULL, $1.name), $3.nd, "[]");
	sprintf($$.name, "t%d", temp_var++);
	char *t = get_type($1.name);
	sprintf($$.type, "%s", t);
}
;

printf_arg: expression { $$.nd = $1.nd; }
| STR { $$.nd = mknode(NULL, NULL, $1.name); }
;

printf_args: printf_args ',' printf_arg { $$.nd = mknode($1.nd, $3.nd, "args"); }
| printf_arg { $$.nd = $1.nd; }
;

scanf_arg: AMPERSAND ID { check_declaration($2.name); $$.nd = mknode(NULL, NULL, $2.name); }
| '&' ID { check_declaration($2.name); $$.nd = mknode(NULL, NULL, $2.name); }
| ID { check_declaration($1.name); $$.nd = mknode(NULL, NULL, $1.name); }
;

scanf_args: scanf_args ',' scanf_arg { $$.nd = mknode($1.nd, $3.nd, "args"); }
| scanf_arg { $$.nd = $1.nd; }
;

relop: LT { strcpy($$.name, "<"); }
| GT { strcpy($$.name, ">"); }
| LE { strcpy($$.name, "<="); }
| GE { strcpy($$.name, ">="); }
| EQ { strcpy($$.name, "=="); }
| NE { strcpy($$.name, "!="); }
;

value: NUMBER { strcpy($$.name, $1.name); sprintf($$.type, "int"); add_symbol('C', $1.name); $$.nd = mknode(NULL, NULL, $1.name); }
| FLOAT_NUM { strcpy($$.name, $1.name); sprintf($$.type, "float"); add_symbol('C', $1.name); $$.nd = mknode(NULL, NULL, $1.name); }
| CHARACTER { strcpy($$.name, $1.name); sprintf($$.type, "char"); add_symbol('C', $1.name); $$.nd = mknode(NULL, NULL, $1.name); }
| STR { strcpy($$.name, $1.name); sprintf($$.type, "char"); add_symbol('C', $1.name); $$.nd = mknode(NULL, NULL, $1.name); }
| NULL_TOKEN { strcpy($$.name, "NULL"); sprintf($$.type, "null"); $$.nd = mknode(NULL, NULL, "NULL"); }
| ID { strcpy($$.name, $1.name); char *id_type = get_type($1.name); sprintf($$.type, "%s", id_type); check_declaration($1.name); $$.nd = mknode(NULL, NULL, $1.name); }
| AMPERSAND ID { check_declaration($2.name); sprintf($$.name, "&%s", $2.name); sprintf($$.type, "ptr"); $$.nd = mknode(NULL, NULL, $$.name); }
| MULTIPLY ID { check_declaration($2.name); sprintf($$.name, "*%s", $2.name); sprintf($$.type, "int"); $$.nd = mknode(NULL, NULL, $$.name); }
;

%%

void set_symbol_value(const char *name, const char *val) {
	if (!name || !val) return;
	for (int i = count - 1; i >= 0; i--) {
		if (strcmp(symbol_table[i].id_name, name) == 0) {
			if (symbol_table[i].value) free(symbol_table[i].value);
			symbol_table[i].value = strdup(val);
			return;
		}
	}
}

char *get_symbol_value(const char *name) {
	if (!name) return "NULL";
	for (int i = 0; i < count; i++) {
		if (strcmp(symbol_table[i].id_name, name) == 0) {
			return symbol_table[i].value ? symbol_table[i].value : "NULL";
		}
	}
	return "NULL";
}

int is_num(const char *s) {
	if (!s || !*s) return 0;
	int i = (s[0] == '-' || s[0] == '+') ? 1 : 0;
	int digits = 0;
	for (; s[i]; i++) {
		if (isdigit(s[i])) digits = 1;
		else if (s[i] == '.') {}
		else return 0;
	}
	return digits;
}

double get_num_val(const char *s) {
	if (is_num(s)) return atof(s);
	char *val = get_symbol_value(s);
	if (is_num(val)) return atof(val);
	return 0.0;
}

int can_eval(const char *s) {
	if (!s) return 0;
	if (is_num(s)) return 1;
	char *val = get_symbol_value(s);
	return (val && strcmp(val, "NULL") != 0 && is_num(val));
}



void add_error(const char *format, ...) {
    if (sem_errors >= 100) return;
    va_list args;
    va_start(args, format);
    vsnprintf(errors[sem_errors++], sizeof(errors[0]), format, args);
    va_end(args);
}
void emit_ir(const char *format, ...) {
    if (ic_idx >= 500) { add_error("IR capacity (500) exceeded!\n"); return; }
    va_list args;
    va_start(args, format);
    int size = vsnprintf(icg[ic_idx], sizeof(icg[0]), format, args);
    va_end(args);
    if (size < 0 || size >= sizeof(icg[0])) { add_error("IR instruction too long!\n"); return; }
    ++ic_idx;
}

struct var_name binary_expression(struct var_name left, const char *op, struct var_name right) {
    struct var_name result = {0};
 
	if(!strcmp(left.type, right.type)) {
		sprintf(result.type, "%s", left.type);
		result.nd = mknode(left.nd, right.nd, op); 
	}
	else {
		if(!strcmp(left.type, "int") && !strcmp(right.type, "float")) {
			struct node *temp = mknode(NULL, left.nd, "inttofloat");
			sprintf(result.type, "%s", right.type);
			result.nd = mknode(temp, right.nd, op);
		}
		else if(!strcmp(left.type, "float") && !strcmp(right.type, "int")) {
			struct node *temp = mknode(NULL, right.nd, "inttofloat");
			sprintf(result.type, "%s", left.type);
			result.nd = mknode(left.nd, temp, op);
		}
		else if(!strcmp(left.type, "int") && !strcmp(right.type, "char")) {
			struct node *temp = mknode(NULL, right.nd, "chartoint");
			sprintf(result.type, "%s", left.type);
			result.nd = mknode(left.nd, temp, op);
		}
		else if(!strcmp(left.type, "char") && !strcmp(right.type, "int")) {
			struct node *temp = mknode(NULL, left.nd, "chartoint");
			sprintf(result.type, "%s", right.type);
			result.nd = mknode(temp, right.nd, op);
		}
		else if(!strcmp(left.type, "float") && !strcmp(right.type, "char")) {
			struct node *temp = mknode(NULL, right.nd, "chartofloat");
			sprintf(result.type, "%s", left.type);
			result.nd = mknode(left.nd, temp, op);
		}
		else {
			struct node *temp = mknode(NULL, left.nd, "chartofloat");
			sprintf(result.type, "%s", right.type);
			result.nd = mknode(temp, right.nd, op);
		}
	}
	
    int folded = 0;
    if (can_eval(left.name) && can_eval(right.name)) {
        double a = get_num_val(left.name), b = get_num_val(right.name), r = 0;
        int integers = !strcmp(left.type, "int") && !strcmp(right.type, "int");
        if ((!strcmp(op, "/") || !strcmp(op, "%")) && b == 0) {
            add_error(
                "Line %d: Constant division or modulo by zero!\n", countn+1);
        } else {
            int valid = 1;
            if (!strcmp(op, "+")) r = a + b;
            else if (!strcmp(op, "-")) r = a - b;
            else if (!strcmp(op, "*")) r = a * b;
            else if (!strcmp(op, "/")) r = a / b;
            else if (!strcmp(op, "%") && integers && a >= INT_MIN && a <= INT_MAX && b >= INT_MIN && b <= INT_MAX && !(a == INT_MIN && b == -1)) r = (int)a % (int)b;
            else if (integers && a >= INT_MIN && a <= INT_MAX && b >= INT_MIN && b <= INT_MAX) {
                int x = (int)a, y = (int)b;
                if (!strcmp(op, "&")) r = x & y;
                else if (!strcmp(op, "|")) r = x | y;
                else if (!strcmp(op, "^")) r = x ^ y;
                else if (!strcmp(op, "<<") && x >= 0 && y >= 0 && y < 31 && x <= (INT_MAX >> y)) r = x << y;
                else if (!strcmp(op, ">>") && x >= 0 && y >= 0 && y < 32) r = x >> y;
                else valid = 0;
            } else valid = 0;
            if (valid && isfinite(r) && (!integers || (r >= INT_MIN && r <= INT_MAX))) {
                if (integers) snprintf(result.name, sizeof(result.name), "%d", (int)r);
                else snprintf(result.name, sizeof(result.name), "%.17g", r);
                folded = 1;
            }
        }
    }
    if (!folded) snprintf(result.name, sizeof(result.name), "t%d", temp_var++);
    emit_ir( "%s = %s %s %s\n", result.name, left.name, op, right.name);
    return result;
}

void reset_compiler_state() {
	for(int i=0; i<count; i++) {
		if(symbol_table[i].id_name) free(symbol_table[i].id_name);
		if(symbol_table[i].data_type) free(symbol_table[i].data_type);
		if(symbol_table[i].type) free(symbol_table[i].type);
		if(symbol_table[i].value) free(symbol_table[i].value);
	}
	count = 0;
	countn = 0;
	sem_errors = 0;
	ic_idx = 0;
	temp_var = 0;
	label = 0;
	is_for = 0;
	head = NULL;
	memset(type, 0, sizeof(type));
	memset(buff, 0, sizeof(buff));
	memset(errors, 0, sizeof(errors));
	memset(symbol_table, 0, sizeof(symbol_table));
	memset(icg, 0, sizeof(icg));
	yylineno = 1;
}

// This function is called after parsing completes successfully
void print_analysis_results() {
	int i;
	
	// Phase 1: Lexical Analysis (Symbol Table with Values)
	if(show_symbols && !quiet_mode) {
		printf("\n");
		printf("=========================================================================================\n");
		printf("  PHASE 1: LEXICAL ANALYSIS - SYMBOL TABLE (WITH CURRENT VALUES)\n");
		printf("=========================================================================================\n");
		printf("\n");
		printf("%-20s %-15s %-15s %-10s %-15s\n", "SYMBOL", "DATA TYPE", "TYPE", "LINE NO", "VALUE");
		printf("-----------------------------------------------------------------------------------------\n");
		for(i=0; i<count; i++) {
			char *val = (symbol_table[i].value && strcmp(symbol_table[i].value, "NULL") != 0) ? symbol_table[i].value : "-";
			printf("%-20s %-15s %-15s %-10d %-15s\n", 
				symbol_table[i].id_name, 
				symbol_table[i].data_type, 
				symbol_table[i].type, 
				symbol_table[i].line_no,
				val);
		}
		printf("\n");
	}
	
	// Phase 2: Syntax Analysis (Parse Tree)
	if(show_parse_tree && !quiet_mode) {
		printf("=========================================================================================\n");
		printf("  PHASE 2: SYNTAX ANALYSIS - PARSE TREE\n");
		printf("=========================================================================================\n");
		printf("\n");
		print_tree(head);
		printf("\n");
	}
	
	// Phase 3: Semantic Analysis
	if(show_semantic && !quiet_mode) {
		printf("=========================================================================================\n");
		printf("  PHASE 3: SEMANTIC ANALYSIS\n");
		printf("=========================================================================================\n");
		printf("\n");
		if(sem_errors>0) {
			printf("Semantic Errors Found: %d\n", sem_errors);
			for(int i=0; i<sem_errors; i++){
				printf("  - %s", errors[i]);
			}
		} else {
			printf("Semantic analysis completed successfully with no errors.\n");
		}
		printf("\n");
	}
	
	// Phase 4: Intermediate Code Generation
	if(show_ir && !quiet_mode) {
		printf("=========================================================================================\n");
		printf("  PHASE 4: INTERMEDIATE CODE GENERATION (THREE-ADDRESS CODE)\n");
		printf("=========================================================================================\n");
		printf("\n");
		for(int i=0; i<ic_idx; i++){
			printf("%s", icg[i]);
		}
		printf("\n");
	}
}

int search(char *type) {
	int i;
	for(i=count-1; i>=0; i--) {
		if(strcmp(symbol_table[i].id_name, type)==0) {
			return -1;
			break;
		}
	}
	return 0;
}

void check_declaration(char *c) {
    // Built-in C standard library functions are implicitly declared
    const char *stdlib_funcs[] = {
        "printf", "scanf", "strlen", "strcpy", "strncpy", "strcat", "strcmp", "strncmp",
        "atoi", "atof", "atol", "malloc", "calloc", "realloc", "free", "exit",
        "abs", "labs", "sqrt", "pow", "sin", "cos", "tan", "floor", "ceil",
        "getchar", "putchar", "gets", "puts", "fopen", "fclose", "fread", "fwrite",
        "fprintf", "fscanf", "sprintf", "sscanf", "time", "rand", "srand", "system",
        "isupper", "islower", "isalpha", "isdigit", "isalnum", "toupper", "tolower"
    };
    for(size_t i=0; i<sizeof(stdlib_funcs)/sizeof(stdlib_funcs[0]); i++) {
        if(strcmp(c, stdlib_funcs[i]) == 0) return;
    }
    
    q = search(c);
    if(!q) {
        add_error("Line %d: Variable \"%s\" not declared before use!\n", countn+1, c);
    }
}

void check_return_type(char *value) {
	char *main_datatype = get_type("main");
	char *return_datatype = get_type(value);

	if(!strcmp(main_datatype, "int") && (!strcmp(return_datatype, "CONST") || !strcmp(return_datatype, "int") || !strcmp(return_datatype, "unknown"))) {
		return ;
	}
	else if(!strcmp(main_datatype, "void")) {
		return ;
	}
	else {
		return ;
	}
}

int check_types(char *type1, char *type2){
	// declaration with no init
	if(!strcmp(type2, "null"))
		return -1;
	// both datatypes are same
	if(!strcmp(type1, type2))
		return 0;
	// array / pointer initialization
	if(!strcmp(type1, "char") && (!strcmp(type2, "char") || !strcmp(type2, "char*")))
		return 0;
	if(!strcmp(type1, "int") && !strcmp(type2, "int"))
		return 0;
	// both datatypes are different
	if(!strcmp(type1, "int") && !strcmp(type2, "float"))
		return 1;
	if(!strcmp(type1, "float") && !strcmp(type2, "int"))
		return 2;
	if(!strcmp(type1, "int") && !strcmp(type2, "char"))
		return 3;
	if(!strcmp(type1, "char") && !strcmp(type2, "int"))
		return 4;
	if(!strcmp(type1, "float") && !strcmp(type2, "char"))
		return 5;
	if(!strcmp(type1, "char") && !strcmp(type2, "float"))
		return 6;
	return -1;
}

char *get_type(char *var){
	for(int i=0; i<count; i++) {
		// Handle case of use before declaration
		if(!strcmp(symbol_table[i].id_name, var)) {
			return symbol_table[i].data_type;
		}
	}
	return "unknown";
}

void add(char c) {
    add_symbol(c, yytext);
}

void add_symbol(char c, const char *name) {
    if (count >= 300) { add_error("Line %d: Symbol capacity (300) exceeded!\n", countn+1); return; }
    if (!name || strlen(name) == 0) return;
    
	if(c == 'V'){
		for(int i=0; i<20; i++){
			if(!strcmp(reserved[i], name)){
        		add_error("Line %d: Variable name \"%s\" is a reserved keyword!\n", countn+1, name);
				return;
			}
		}
	}
    q = search((char*)name);
	if(!q) {
		if(c == 'H') {
			symbol_table[count].id_name=strdup(name);
			symbol_table[count].data_type=strdup(type);
			symbol_table[count].line_no=countn;
			symbol_table[count].type=strdup("Header");
			symbol_table[count].value=strdup("-");
			count++;
		}
		else if(c == 'K') {
			symbol_table[count].id_name=strdup(name);
			symbol_table[count].data_type=strdup("N/A");
			symbol_table[count].line_no=countn;
			symbol_table[count].type=strdup("Keyword");
			symbol_table[count].value=strdup("-");
			count++;
		}
		else if(c == 'V') {
			symbol_table[count].id_name=strdup(name);
			symbol_table[count].data_type=strdup(type);
			symbol_table[count].line_no=countn;
			symbol_table[count].type=strdup("Variable");
			symbol_table[count].value=strdup("NULL");
			count++;
		}
		else if(c == 'C') {
			symbol_table[count].id_name=strdup(name);
			symbol_table[count].data_type=strdup("CONST");
			symbol_table[count].line_no=countn;
			symbol_table[count].type=strdup("Constant");
			symbol_table[count].value=strdup(name);
			count++;
		}
		else if(c == 'F') {
			symbol_table[count].id_name=strdup(name);
			symbol_table[count].data_type=strdup(type);
			symbol_table[count].line_no=countn;
			symbol_table[count].type=strdup("Function");
			symbol_table[count].value=strdup("-");
			count++;
		}
    }
    else if(c == 'V' && q) {
        add_error("Line %d: Multiple declarations of \"%s\" not allowed!\n", countn+1, name);
    }
}

struct node* mknode(struct node *left, struct node *right, const char *token) {	
	struct node *newnode = (struct node *)malloc(sizeof(struct node));
	char *newstr = (char *)malloc(strlen(token)+1);
	strcpy(newstr, token);
	newnode->left = left;
	newnode->right = right;
	newnode->token = newstr;
	return(newnode);
}

void print_tree(struct node* tree) {
	if (!tree) return;
	printf("Inorder traversal: ");
	print_inorder(tree);
	printf("\n");
}

void print_inorder(struct node *tree) {
	if (!tree) return;
	if (tree->left) {
		print_inorder(tree->left);
	}
	printf("%s", tree->token);
	if(tree->left || tree->right) printf(", ");
	if (tree->right) {
		print_inorder(tree->right);
	}
}

void insert_type() {
	strcpy(type, yytext);
}

void yyerror(const char* msg) {
    fprintf(stderr, "Syntax Error: %s at line %d\n", msg, countn+1);
}

// Override the main function for library usage
#ifdef BUILD_AS_LIBRARY
// When building as library, we don't include main()
// The CLI wrapper will call yyparse() directly
#else
// Standalone mode for testing
int main() {
    yyparse();
    print_analysis_results();
    return (sem_errors > 0) ? 1 : 0;
}
#endif
