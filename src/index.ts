// / <reference path="../typings/bash-parser/index.d.ts" />

import parse, { AST } from "bash-parser";
import fs from "fs";
import path from "path";
import traverse from "./traverse";
import codegen from "./codegen";

const file = process.argv[2];
// const file = arg && arg !== "-" ? path.resolve(arg) : "/proc/self/fd/0";

class Context {
  constructor(public filename: string, opts?: parse.ParseOptions) {
    this.ast = parse(fs.readFileSync(filename, "utf8"), opts);
  }
  ast: AST.Script;

  process() {
    const outAst = traverse(this.ast, this);
    const out = codegen(outAst);
    return out;
  }

  Command(cmd: AST.Command) {
    if (!cmd.name) return;
    switch (cmd.name.text) {
      case "import":
        return this.Import(cmd);
    }
  }
  Import(cmd: AST.Command): AST.Function[] {
    const argv = cmd.suffix.filter(cur => cur.type === "Word") as AST.Word[];
    let file = path.resolve(path.dirname(this.filename), argv[0].text);
    if (!fs.existsSync(file)) file += ".sh";
    const ast = parse(fs.readFileSync(file, "utf8"));
    const funcs = ast.commands.filter(
      cur => cur.type === "Function"
    ) as AST.Function[];
    const mod = path.basename(file, path.extname(file));
    for (const func of funcs) {
      func.name.text = `${mod}::${func.name.text}`;
    }
    return funcs;
  }
}

const ctx = new Context(file);
console.log(ctx.process().toString());
