import axios from "axios";
import * as vscode from "vscode";

export type CompilerConfig = {
    "compiler": "x86-64 gcc 13.2",
    "language": "c++",
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

export type ColorConfig = {
    "symbol": string;
    "string": string;
    "number": string;
    "register": string;
    "instruction": string;
    "comment": string;
    "operator": string;
};

type CompilerOptions = { pattern: RegExp, context: string }[];

export const compilerConfig = vscode.workspace
    .getConfiguration("compiler-explorer")
    .get<CompilerConfig>("compiler.config")!;

export const compilerOptions = vscode.workspace
    .getConfiguration("compiler-explorer")
    .get<CompilerOptions>("compiler.options")!;

export const colorConfig = vscode.workspace
    .getConfiguration("compiler-explorer")
    .get<ColorConfig>("color.config")!;