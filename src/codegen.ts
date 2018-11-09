import { AST } from "bash-parser";
import traverse from "./traverse";

const defSource = (node: AST.Node, fn: () => string) => {
  Object.defineProperty(node, "source", {
    get: fn
  });
  node.toString = () => node.source;
  return node;
};

const getSourceText = (node: AST.Node & { text: string }) =>
  defSource(node, () => node.text);

const codegen = (ast: AST.Node) => {
  return traverse(ast, {
    Script: node =>
      defSource(node, () => node.commands.map(cur => cur.source).join("\n")),
    Word: getSourceText,
    AssignmentWord: getSourceText,
    Name: getSourceText,
    CompoundList: node =>
      defSource(node, () => node.commands.map(cur => cur.source).join("\n")),
    Function: node =>
      defSource(
        node,
        () => `${node.name.text}() {
  ${node.body}
}`
      ),
    Command: node =>
      defSource(node, () => {
        const suffix = node.suffix
          ? node.suffix.map(s => s.source).join(" ")
          : "";
        const prefix = node.prefix
          ? node.prefix.map(s => s.source).join(" ")
          : "";
        const name = node.name ? node.name.source : "";
        return prefix + " " + name + " " + suffix;
      }),
    If: node =>
      defSource(node, () => {
        const _clause = node.clause
          ? node.clause.commands
              .map(c => {
                return c.source;
              })
              .join(" ")
          : "";
        const _then = node.then
          ? node.then.commands
              .map(c => {
                return c.source;
              })
              .join("\n")
          : "";
        const _else = node.else
          ? node.else.commands
              .map(c => {
                return c.source;
              })
              .join(" ")
          : "";

        return `if ${_clause}\n${_then && `then\n${_then}\n`}${_else &&
          `else\n${_else}\n`}\nfi`;
      })
  });
};

export default codegen;
