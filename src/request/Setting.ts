import axios from "axios";
import * as vscode from "vscode";

export function SetProxy() {
    const vscodeProxy = vscode.workspace.getConfiguration('https').get<string>('proxy');
    if (vscodeProxy) {
        axios.defaults.proxy = {
            host: new URL(vscodeProxy).hostname,
            port: parseInt(new URL(vscodeProxy).port),
            protocol: new URL(vscodeProxy).protocol,
        };
    }
}

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

type CompilerOptions = { pattern: RegExp, context: string }[];

export const compilerConfig = vscode.workspace
    .getConfiguration("compiler-explorer")
    .get<CompilerConfig>("compiler.config")!;

export const compilerOptions = vscode.workspace
    .getConfiguration("compiler-explorer")
    .get<CompilerOptions>("compiler.options")!;