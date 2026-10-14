/* Offline explorer: read-only views of frontend artifacts, never executes IR. */
#ifndef COMPILER_EXPLORER_H
#define COMPILER_EXPLORER_H
struct node { struct node *left, *right; char *token; };
struct dataType { char *id_name, *data_type, *type; int line_no; char *value; };
extern struct node *head;
extern struct dataType symbol_table[300];
extern int count, ic_idx;
extern char errors[100][100], icg[500][512];

static void html_text(FILE *out, const char *s) {
    if (!s) return;
    for (; *s; ++s) {
        switch (*s) {
        case '&': fputs("&amp;", out); break;
        case '<': fputs("&lt;", out); break;
        case '>': fputs("&gt;", out); break;
        case '"': fputs("&quot;", out); break;
        case '\'': fputs("&#39;", out); break;
        default: fputc((unsigned char)*s, out);
        }
    }
}
static void html_tree(FILE *out, const struct node *n, int depth) {
    if (!n) return;
    fputs(depth < 2 ? "<li><details open><summary>" : "<li><details><summary>", out);
    html_text(out, n->token);
    fputs("</summary><ul>", out);
    html_tree(out, n->left, depth+1); html_tree(out, n->right, depth+1);
    fputs("</ul></details></li>", out);
}
static int write_explorer(const char *source, const char *path, int parse_status) {
    FILE *in = fopen(source, "r");
    if (!in) return 1;
    FILE *out = fopen(path, "w");
    if (!out) { fclose(in); return 1; }
    fputs("<!doctype html><html lang='en'><meta charset='utf-8'>"
          "<meta name='viewport' content='width=device-width,initial-scale=1'>"
          "<title>Compiler Explorer</title><style>"
          "body{font:16px system-ui;background:#101827;color:#e5edf9;margin:0}"
          "main{max-width:1100px;margin:auto;padding:30px}h1{color:#7ce4c8}"
          "section{overflow-x:auto;background:#1b293e;padding:22px;border-radius:14px;margin:20px 0}"
          "pre{white-space:pre-wrap;overflow-wrap:anywhere}button,input{padding:9px;margin:5px}"
          "table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:8px;border-bottom:1px solid #42536b}"
          "summary,button{cursor:pointer}li{margin:6px 0}#ir .active{background:#345b6d;color:#fff}"
          "#ir li{padding:6px;font:14px monospace;white-space:pre-wrap}</style><main>"
          "<h1>Compiler Explorer</h1><p>An offline journey from source to intermediate code.</p><p>Source: ", out);
    html_text(out, source);
    fprintf(out, "</p><p>Syntax: %s | Semantic errors: %d | Symbols: %d | IR entries: %d</p>",
            parse_status ? "failed" : "accepted", sem_errors, count, ic_idx);
    fputs("<section><h2>1. Source</h2><pre>", out);
    char line[1024];
    while (fgets(line, sizeof(line), in)) html_text(out, line);
    int read_failed = ferror(in);
    fclose(in);
    fputs("</pre></section><section><h2>2. Symbol detective</h2>"
          "<p>Search a name, type, or value. Values are frontend estimates, not runtime state.</p>"
          "<input id='search' aria-label='Filter symbols' placeholder='Find a symbol...'>"
          "<table id='symbols'><thead><tr><th>Name</th><th>Type</th><th>Kind</th><th>Line</th><th>Estimate</th></tr></thead><tbody>", out);
    for (int i = 0; i < count; ++i) {
        fputs("<tr><td>", out); html_text(out, symbol_table[i].id_name);
        fputs("</td><td>", out); html_text(out, symbol_table[i].data_type);
        fputs("</td><td>", out); html_text(out, symbol_table[i].type);
        fprintf(out, "</td><td>%d</td><td>", symbol_table[i].line_no + 1);
        html_text(out, symbol_table[i].value); fputs("</td></tr>", out);
    }
    fputs("</tbody></table></section><section><h2>3. Syntax tree</h2>"
          "<p>Click a node to fold or unfold its children. This is the frontend's main-function tree.</p><ul>", out);
    html_tree(out, head, 0);
    fputs("</ul></section><section><h2>4. Diagnostics</h2><pre>", out);
    if (parse_status) fputs("Syntax analysis failed. See the CLI diagnostic for the location.\n", out);
    for (int i = 0; i < sem_errors; ++i) html_text(out, errors[i]);
    if (!parse_status && !sem_errors) fputs("No frontend errors detected.\n", out);
    fputs("</pre></section><section><h2>5. IR microscope</h2>"
          "<p>Step through emitted instructions in source order. This view explains IR; it does not simulate execution or follow jumps. The educational IR is approximate for complex control flow.</p>"
          "<button id='prev'>Previous</button><button id='next'>Next</button><button id='reset'>Reset</button>"
          "<p id='position' aria-live='polite'></p><p id='explain'></p><ol id='ir'>", out);
    for (int i = 0; i < ic_idx; ++i) {
        fputs("<li>", out); html_text(out, icg[i]); fputs("</li>", out);
    }
    fputs("</ol></section><script>"
          "const rows=[...document.querySelectorAll('#symbols tbody tr')];"
          "document.querySelector('#search').oninput=e=>rows.forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(e.target.value.toLowerCase()));"
          "const instructions=[...document.querySelectorAll('#ir li')];let step=0;"
          "function render(){instructions.forEach((r,i)=>r.classList.toggle('active',i===step));"
          "document.querySelector('#position').textContent=instructions.length?'Instruction '+(step+1)+' of '+instructions.length:'No IR emitted';"
          "const t=instructions[step]?.textContent||'';"
          "document.querySelector('#explain').textContent=t.includes('RETURN')?'Return a value to the caller.':t.includes('LABEL')?'A destination for control flow.':/GOTO|JUMP/.test(t)?'Transfer control, possibly depending on a condition.':t.includes('call ')?'Call a function; its effects are determined at runtime.':t.includes('=')?'Compute or assign a value.':'An emitted IR entry.';"
          "document.querySelector('#prev').disabled=step===0;document.querySelector('#next').disabled=step>=instructions.length-1;}"
          "document.querySelector('#next').onclick=()=>{step=Math.min(step+1,instructions.length-1);render()};"
          "document.querySelector('#prev').onclick=()=>{step=Math.max(0,step-1);render()};"
          "document.querySelector('#reset').onclick=()=>{step=0;render()};render();"
          "</script></main></html>", out);
    int failed = ferror(out) || read_failed;
    if (fclose(out) != 0) failed = 1;
    return failed;
}
#endif
