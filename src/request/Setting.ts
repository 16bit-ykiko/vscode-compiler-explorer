import * as vscode from "vscode";

export type CompilerConfig = {
    "compiler": "x86-64 gcc 13.2",
    "language": "c++",
    "options": "-O2 -Wall",
    "exec": "",
    "stdin": "",
    "filters": {
        "binaryObject": false,
        "binary": false,
        "execute": false,
        "intel": true,
        "demangle": true,
        "labels": true,
        "libraryCode": true,
        "directives": true,
        "commentOnly": true,
        "trim": false,
        "debugCalls": false
    };
};

export const compilerConfig = vscode.workspace
    .getConfiguration("compiler-explorer")
    .get<CompilerConfig>("compiler.config")!;