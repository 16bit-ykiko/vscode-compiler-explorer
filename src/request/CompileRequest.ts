import * as vscode from 'vscode';

import { CompilerInstance, Filter, Tool, Library } from "../view/Instance";

export class ExecuteParameter {
    args?: string[];
    stdin?: string;
};

export class CompilerOption {
    executorRequest?: boolean;
    skipAsm?: boolean;
}

export class CompileOptions {
    userArguments?: string;
    executeParameters?: ExecuteParameter;
    compilerOptions?: CompilerOption;
    filters?: Filter;
    tools?: Tool[];
    libraries?: Library[];

    static from(instance: CompilerInstance): CompileOptions {
        let options = new CompileOptions();
        options.userArguments = instance.options;
        options.filters = instance.filters;
        options.executeParameters = {
            args: instance.exec === "" ? undefined : instance.exec.split(" "),
            stdin: instance.stdin
        };
        return options;
    }
};

export class CompileRequest {
    source?: string;
    compiler?: string;
    options?: CompileOptions;
    lang: string = "c++";
    allowStoreCodeDebug: boolean = true;
    bypassCache = 0;

    static async from(instance: CompilerInstance) {
        let request = new CompileRequest();
        request.source = await ReadSource(instance.inputFile);
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
            if (editor.document.uri === uri) {
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