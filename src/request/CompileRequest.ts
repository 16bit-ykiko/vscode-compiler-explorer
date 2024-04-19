import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { CompilerInstance, SingleFileInstance, MultiFileInstance, Filter, Tool, Library } from "../view/Instance";

export class ExecuteParameter {
    args?: string[];
    stdin?: string;
};

export class CompilerOption {
    skipAsm?: boolean;
    cmakeArgs?: string;
    executorRequest?: boolean;
    customOutputFilename?: string;
}

export class CompileOptions {
    tools?: Tool[];
    filters?: Filter;
    libraries?: Library[];
    userArguments?: string;
    executeParameters?: ExecuteParameter;
    compilerOptions: CompilerOption = new CompilerOption();

    static from(instance: CompilerInstance): CompileOptions {
        let options = new CompileOptions();

        options.userArguments = instance.options;
        options.filters = instance.filters;

        if (instance.compilerInfo?.supportsExecute) {
            options.executeParameters = {
                args: instance.exec === "" ? undefined : instance.exec.split(" "),
                stdin: instance.stdin
            };
        }

        if (instance instanceof MultiFileInstance) {
            options.compilerOptions.cmakeArgs = instance.cmakeArgs;
            options.compilerOptions.customOutputFilename = "main";
        }

        return options;
    }
};

export class CompileRequest {
    lang = "c++";
    bypassCache = 0;
    allowStoreCodeDebug = true;

    source?: string;
    compiler?: string;
    options?: CompileOptions;
    files?: { filename: string, contents: string }[];

    static async from(instance: CompilerInstance) {
        let request = new CompileRequest();

        if (instance instanceof SingleFileInstance) {
            request.source = await ReadSource(instance.input);
        } else if (instance instanceof MultiFileInstance) {
            const cmake = path.join(instance.src, "CMakeLists.txt");
            if (fs.existsSync(cmake)) {
                request.source = await ReadSource(cmake);
                request.files = [];
                const files = fs.readdirSync(instance.src);
                for (const file of files) {
                    if (file !== "CMakeLists.txt") {
                        request.files.push({ filename: file, contents: fs.readFileSync(path.join(instance.src, file), 'utf8') });
                    }
                    // TODO: recursive search for files in subdirectories
                }
            }
            else {
                vscode.window.showErrorMessage(`CMakeLists.txt not found in ${instance.src}`);
                throw Error(`CMakeLists.txt not found in ${instance.src}`);
            }
        }

        request.compiler = instance.compilerInfo?.id;
        request.options = CompileOptions.from(instance);
        return request;
    }
}

export function GetEditor(path: string): vscode.TextEditor {
    if (path === 'active') {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            return editor;
        }
        throw Error("No active editor found");
    } else {
        const uri = vscode.Uri.file(path);
        for (const editor of vscode.window.visibleTextEditors) {
            if (editor.document.uri.path === uri.path) {
                return editor;
            }
        }
        throw Error("File not found: " + path);
    }
}

export async function ReadSource(path: string): Promise<string> {
    if (path === "active") {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            return editor.document.getText();
        }
        vscode.window.showErrorMessage("No active editor found");
        throw Error("No active editor found");
    }

    const uri = vscode.Uri.file(path);
    return await vscode.workspace.openTextDocument(uri).then(doc => doc.getText(), () => {
        const openDocuments = vscode.workspace.textDocuments;
        for (const doc of openDocuments) {
            if (doc.fileName === path) {
                return doc.getText();
            }
        }
        vscode.window.showErrorMessage(`File not found: ${path}`);
        throw Error(`File not found: ${path}`);
    });
}