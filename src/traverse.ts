"use strict";

const DescendVisitor = require("./descend-visitor")(traverseNode);
import { AST } from "bash-parser";

/*
 *  Execute a visitor object method that has the same name
 *  of an AST node type.
 *
 *  The visitor method receive as arguments the AST node,
 *  and the execution context.
 */
function visit(node, context, visitor) {
  if (node === null || node === undefined) {
    return null;
  }

  if (Array.isArray(visitor)) {
    return visitor.reduce((n, v) => {
      const newNode = visit(n, context, v);
      return newNode;
    }, node);
  }

  let out;

  if (typeof visitor[node.type] === "function") {
    out = visitor[node.type](node, ...context);
  } else if (typeof visitor.defaultMethod === "function") {
    out = visitor.defaultMethod(node, ...context);
  } else {
    out = node;
  }

  return out === undefined ? node : out;
}

function traverseNode(parent, ast, visitor) {
  return node => visit(node, [parent, ast, visitor], [DescendVisitor, visitor]);
}

type VisitorFunc<T extends AST.Node> = (
  node: T
) => AST.Node | AST.Node[] | void;
type Visitor = {
  [k in AST.Node["type"]]?: VisitorFunc<Extract<AST.Node, { type: k }>>
} & {
  defaultMethod?: VisitorFunc<AST.Node>;
};

const traverse = (ast: AST.Node, visitor: Visitor) => {
  return traverseNode(null, ast, visitor)(ast);
};

export { visit };
export default traverse;
