import * as path from "path";
import * as vscode from "vscode";

export interface FilterConfig {
    skipASM: boolean;
    binaryObject: boolean;
    binary: boolean;
    execute: boolean;
    intel: boolean;
    demangle: boolean;
    labels: boolean;
    libraryCode: boolean;
    directives: boolean;
    commentOnly: boolean;
    trim: boolean;
    debugCalls: boolean;
}

export interface OptionsConfig {
    compiler: string;
    language: string;
    options: string;
    exec: string;
    stdin: string;
    cmakeArgs: string;
    src: string;
    input: string;
    output: string;
    filters: FilterConfig;
}

export interface ColorConfig {
    symbol: string;
    string: string;
    number: string;
    register: string;
    instruction: string;
    comment: string;
    operator: string;
}

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

const readResourse = (name: string) => {
    return path.join(__filename, "..", "..", "resources", name);
};

export const Icon = vscode.Uri.file(readResourse("icon.svg"));
export const cmakeIcon = vscode.Uri.file(readResourse("cmake.svg"));
export const singleIcon = vscode.Uri.file(readResourse("single.png"));
export const filtersIcon = vscode.Uri.file(readResourse("filters.svg"));
export const trueIcon = vscode.Uri.file(readResourse("true.png"));
export const falseIcon = vscode.Uri.file(readResourse("false.png"));
