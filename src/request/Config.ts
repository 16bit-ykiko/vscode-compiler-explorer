import * as path from "path";
import * as vscode from "vscode";

export type OptionsConfig = {
    "compiler": "x86-64 gcc 13.2",
    "language": "c++",
    "options": "-std=c++17",
    "exec": "",
    "stdin": "",
    "cmakeArgs": "",
    "src": "workplace",
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

export class Config {
    static _config = vscode.workspace.getConfiguration("compiler-explorer");

    static defaultOptions() {
        return Config._config.get<OptionsConfig>("default.options")!;
    }

    static defaultColor() {
        return Config._config.get<ColorConfig>("default.color")!;
    }

    static defaultURL() {
        return Config._config.get<string>("default.url")!;
    }
}

const readResourse = (name: string) => { return path.join(__filename, '..', '..', 'resources', name); };

export const Icon = vscode.Uri.file(readResourse("icon.svg"));
export const cmakeIcon = vscode.Uri.file(readResourse("cmake.svg"));
export const singleIcon = vscode.Uri.file(readResourse("single.png"));
export const filtersIcon = vscode.Uri.file(readResourse("filters.svg"));