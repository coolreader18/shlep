export type Node =
  | Script
  | Pipeline
  | LogicalExpression
  | Command
  | Function
  | Name
  | CompoundList
  | Subshell
  | For
  | Case
  | CaseItem
  | If
  | While
  | Until
  | Redirect
  | Word
  | AssignmentWord
  | ArithmeticExpansion
  | CommandExpansion
  | ParameterExpansion;

interface Location {
  col: number;
  row: number;
  char: number;
}

interface NodeBaseSansLoc {
  type: string;
  readonly source: string;
}

interface NodeBase extends NodeBaseSansLoc {
  loc: {
    start: Location;
    end: Location;
  };
}

/**
 * `Script` is the root node of the AST. It simply represent a list of commands
 * that form the body of the script.
 */
export interface Script extends NodeBase {
  type: "Script";
  commands: Array<
    | LogicalExpression
    | Pipeline
    | Command
    | Function
    | Subshell
    | For
    | Case
    | If
    | While
    | Until
  >;
}

/**
 * `Pipeline` represents a list of commands concatenated with pipes.
 * Commands are executed in parallel and the output of each one become the input of
 * the subsequent.
 */
export interface Pipeline extends NodeBase {
  type: "Pipeline";
  commands: Array<
    Command | Function | Subshell | For | Case | If | While | Until
  >;
}

/**
 * Represents two commands (left and right) concateneted in a `and` (&&) or `or`
 * (||) operation.
 * In the `and` Case, the right command is executed only if the left one is
 * executed successfully. In the `or` Case, the right command is executed only if
 * the left one fails.
 */
export interface LogicalExpression extends NodeBase {
  type: "LogicalExpression";
  op: string;
  left:
    | LogicalExpression
    | Pipeline
    | Command
    | Function
    | Subshell
    | For
    | Case
    | If
    | While
    | Until;
  right:
    | LogicalExpression
    | Pipeline
    | Command
    | Function
    | Subshell
    | For
    | Case
    | If
    | While
    | Until;
}

/**
 * Represents a builtin or external command to execute. It could optionally have a
 * list of arguments, stream redirection operation and environment variable
 * assignments. `name` properties is a Word that represents the name of the command
 * to execute. It is optional because Command could represents bare assignment,
 * e.g. `VARNAME = 42;`. In this case, the command node has no name.
 */
export interface Command extends NodeBase {
  type: "Command";
  name?: Word;
  prefix: Array<AssignmentWord | Redirect>;
  suffix: Array<Word | Redirect>;
}

/**
 * `Function` represents the definition of a Function.
 * It is formed by the name of the Function  itself and a list of all command that
 * forms the body of the Function. It can also contains a list of redirection that
 * applies to all commands of the function body.
 */
export interface Function extends NodeBase {
  type: "Function";
  name: Name;
  redirections: Array<Redirect>;
  body: CompoundList;
}

/**
 * Represents the Name of a Function or a `for` variable.
 * Valid Name values should be formed by one or more alphanumeric characters or
 * underscores, and the could not start with a digit.
 */
export interface Name extends NodeBase {
  type: "Name";
  text: string;
}

/**
 * `CompoundList` represent a group of commands that form the body of `for`,
 * `until` `while`, `if`, `else`, `case` items and `function` command. It can also
 * represent a simple group of commands, with an optional list of redirections.
 */
export interface CompoundList extends NodeBase {
  type: "CompoundList";
  commands: Array<
    | LogicalExpression
    | Pipeline
    | Command
    | Function
    | Subshell
    | For
    | Case
    | If
    | While
    | Until
  >;
  redirections: Array<Redirect>;
}

/**
 * `Subshell` node represents a Subshell command. It consist of a group of one or
 * more commands to execute in a separated shell environment.
 */
export interface Subshell extends NodeBase {
  type: "Subshell";
  list: CompoundList;
}

/**
 * A for statement. The for loop shall execute a sequence of commands for each
 * member in a list of items.
 */
export interface For extends NodeBase {
  type: "For";
  name: Name;
  wordlist: Array<Word>;
  do: CompoundList;
}

/**
 * A Case statement. The conditional construct Case shall execute the CompoundList
 * corresponding to the first one of several patterns that is matched by the
 * `clause` Word.
 */
export interface Case extends NodeBase {
  type: "Case";
  clause: Word;
  cases: Array<CaseItem>;
}

/**
 * Represents a single pattern item in a `Cases` list of a Case. It's formed by the
 * pattern to match against and the corresponding set of statements to execute if
 * it is matched.
 */
export interface CaseItem extends NodeBase {
  type: "CaseItem";
  pattern: Array<Word>;
  body: CompoundList;
}

/**
 * If statement. The if command shall execute a CompoundList and use its exit
 * status to determine whether to execute the `then` CompoundList or the optional
 * `else` one.
 */
export interface If extends NodeBase {
  type: "If";
  clause: CompoundList;
  then: CompoundList;
  else: CompoundList;
}

/**
 * While statement. The While loop shall continuously execute one CompoundList as
 * long as another CompoundList has a zero exit status.
 */
export interface While extends NodeBase {
  type: "While";
  clause: CompoundList;
  do: CompoundList;
}

/**
 * Until statement. The Until loop shall continuously execute one CompoundList as
 * long as another CompoundList has a non-zero exit status.
 */
export interface Until extends NodeBase {
  type: "Until";
  clause: CompoundList;
  do: CompoundList;
}

/**
 * Represents the redirection of input or output stream of a command to or from a
 * filename or another stream.
 */
export interface Redirect extends NodeBase {
  type: "Redirect";
  op: string;
  file: Word;
  numberIo: Number;
}

/**
 * A `Word` node could appear various part of the AST. It's formed by a series of
 * characters, and is subjected to `tilde expansion`, `parameter expansion`,
 * `command substitution`, `arithmetic expansion`, `pathName expansion`, `field
 * splitting` and `quote removal`.
 */
export interface Word extends NodeBase {
  type: "Word";
  text: string;
  expansion: Array<ArithmeticExpansion | CommandExpansion | ParameterExpansion>;
}

/**
 * A special kind of Word that represents assignment of a value to an environment
 * variable.
 * Word and AssignmentWord could optionally contain a list of expansion to perform
 * on the token.
 */
export interface AssignmentWord extends NodeBase {
  type: "AssignmentWord";
  text: string;
  expansion: Array<ArithmeticExpansion | CommandExpansion | ParameterExpansion>;
}

/**
 * Represent an arithmetic expansion operation to perform in the Word.
 * The parsing of the arithmetic expression is done using [Babel
 * parser](https://github.com/babel/babylon). See there for the `arithmeticAST`
 * node specification.
 * The `loc.start` property contains the index of the character in the Word text
 * where the substitution starts. The `loc.end` property contains the index where
 * it the ends.
 */
export interface ArithmeticExpansion extends NodeBaseSansLoc {
  type: "ArithmeticExpansion";
  expression: string;
  resolved: boolean;
  /** Babel's BinaryOperator */
  arithmeticAST: any;
  loc: {
    start: number;
    end: number;
  };
}

/**
 * Represent a command substitution operation to perform on the Word.
 * The parsing of the command is done recursively using `bash-parser` itself.
 * The `loc.start` property contains the index of the character in the Word text
 * where the substitution starts. The `loc.end` property contains the index where
 * it the ends.
 */
export interface CommandExpansion extends NodeBaseSansLoc {
  type: "CommandExpansion";
  command: string;
  resolved: boolean;
  commandAST: Script;

  loc: {
    start: number;
    end: number;
  };
}

/**
 * Represent a parameter expansion operation to perform on the Word.
 * The `op` and `Word` properties represents, in the case of special parameters,
 * respectively the operator used and the right Word of the special parameter.
 * The `loc.start` property contains the index of the character in the Word text
 * where the substitution starts. The `loc.end` property contains the index where
 * it the ends.
 * TODO: add some details on special parameters and kinds
 */
export interface ParameterExpansion extends NodeBaseSansLoc {
  type: "ParameterExpansion";
  parameter: string;
  kind?: string;
  word?: string;
  op?: string;
  loc: {
    start: number;
    end: number;
  };
}
