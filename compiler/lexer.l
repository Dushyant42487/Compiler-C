%{
    #include "y.tab.h"
    #include <string.h>
    int countn = 0;
    extern int show_tokens, quiet_mode;
%}
%option yylineno
%{
    /* Every textual token lives in a 100-byte semantic-value buffer. */
    #define COPY_TOKEN() do { if (yyleng >= sizeof(yylval.nd_obj.name)) { \
        fprintf(stderr, "Lexical Error: token exceeds 99 bytes at line %d\n", countn+1); \
        return 257; \
    } strcpy(yylval.nd_obj.name, yytext); } while (0)
    #define RETURN_TOKEN(token) do { COPY_TOKEN(); \
        if (show_tokens && !quiet_mode) printf("TOKEN line %d %-12s %s\n", countn+1, #token, yytext); \
        return token; } while (0)
%}

alpha [a-zA-Z_]
digit [0-9]
unary "++"|"--"

%%

"printf"                    { RETURN_TOKEN(PRINTFF); }
"scanf"                     { RETURN_TOKEN(SCANFF); }
"int"                       { RETURN_TOKEN(INT); }
"float"                     { RETURN_TOKEN(FLOAT); }
"double"                    { RETURN_TOKEN(DOUBLE); }
"char"                      { RETURN_TOKEN(CHAR); }
"void"                      { RETURN_TOKEN(VOID); }
"long"                      { RETURN_TOKEN(LONG); }
"short"                     { RETURN_TOKEN(SHORT); }
"unsigned"                  { RETURN_TOKEN(UNSIGNED); }
"signed"                    { RETURN_TOKEN(SIGNED); }
"const"                     { RETURN_TOKEN(CONST); }
"return"                    { RETURN_TOKEN(RETURN); }
"for"	                    { RETURN_TOKEN(FOR); }
"while"                     { RETURN_TOKEN(WHILE); }
"do"                        { RETURN_TOKEN(DO); }
"if"	                    { RETURN_TOKEN(IF); }
"else"	                    { RETURN_TOKEN(ELSE); }
"switch"                    { RETURN_TOKEN(SWITCH); }
"case"                      { RETURN_TOKEN(CASE); }
"default"                   { RETURN_TOKEN(DEFAULT); }
"break"                     { RETURN_TOKEN(BREAK); }
"continue"                  { RETURN_TOKEN(CONTINUE); }
"sizeof"                    { RETURN_TOKEN(SIZEOF); }
"true"                      { RETURN_TOKEN(TRUE); }
"false"                     { RETURN_TOKEN(FALSE); }
"NULL"                      { RETURN_TOKEN(NULL_TOKEN); }
[ \t]*"#include"[ \t]*[<"][^>\r\n\"]+[>"] { RETURN_TOKEN(INCLUDE); }
[ \t]*"#define"[^\r\n]*     { ; }
{digit}+                { RETURN_TOKEN(NUMBER); }
{digit}+\.{digit}{1,6}  { RETURN_TOKEN(FLOAT_NUM); }
{alpha}({alpha}|{digit})*   { RETURN_TOKEN(ID); }
{unary}                     { RETURN_TOKEN(UNARY); }
"<="                        { RETURN_TOKEN(LE); }
">="                        { RETURN_TOKEN(GE); }
"=="                        { RETURN_TOKEN(EQ); }
"!="                        { RETURN_TOKEN(NE); }
"+="                        { RETURN_TOKEN(ADD_ASSIGN); }
"-="                        { RETURN_TOKEN(SUB_ASSIGN); }
"*="                        { RETURN_TOKEN(MUL_ASSIGN); }
"/="                        { RETURN_TOKEN(DIV_ASSIGN); }
"%="                        { RETURN_TOKEN(MOD_ASSIGN); }
">"	                        { RETURN_TOKEN(GT); }
"<"	                        { RETURN_TOKEN(LT); }
"&&"	                    { RETURN_TOKEN(AND); }
"||"	                    { RETURN_TOKEN(OR); }
"<<"                        { RETURN_TOKEN(LSHIFT); }
">>"                        { RETURN_TOKEN(RSHIFT); }
"+"                         { RETURN_TOKEN(ADD); }
"-"                         { RETURN_TOKEN(SUBTRACT); }
"/"                         { RETURN_TOKEN(DIVIDE); }
"*"                         { RETURN_TOKEN(MULTIPLY); }
"%"                         { RETURN_TOKEN(MODULO); }
"&"                         { RETURN_TOKEN(AMPERSAND); }
"|"                         { RETURN_TOKEN(BITOR); }
"^"                         { RETURN_TOKEN(BITXOR); }
"~"                         { RETURN_TOKEN(BITNOT); }
"!"                         { RETURN_TOKEN(NOT); }
\/\/[^\r\n]*                { ; }
\/\*([^*]|\*+[^*/])*\*+\/   { 
                                for(int i = 0; yytext[i]; i++) {
                                    if(yytext[i] == '\n') countn++;
                                }
                            }
[ \t\r]+                    { ; }
\n                          { countn++; }
\"([^\"\\]|\\.)*\"          { RETURN_TOKEN(STR); }
\'([^\'\\]|\\.)\'           { RETURN_TOKEN(CHARACTER); }
.	                        { if (show_tokens && !quiet_mode) printf("TOKEN line %d CHAR         %s\n", countn+1, yytext); return *yytext; }

%%

int yywrap() {
    return 1;
}
