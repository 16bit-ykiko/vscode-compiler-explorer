import axios from "axios";
//import { CompilationResult, CompilationRequestOptions, CompilationRequest } from "../../compiler-explorer/types/compilation/compilation.interfaces.js";
import { CompilerInstance } from "../view/instance.js";
import * as vscode from 'vscode';

//export type { CompilationRequestOptions, CompilationResult, CompilationRequest };

let compilers = new Map<string, string>();


class CompileRequest {

    constructor(instance: CompilerInstance) {

    }
}

export async function readSource(path: string): Promise<string> {
    if (path === "active") {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            return editor.document.getText();
        }

        vscode.window.showErrorMessage("No active editor found");
        throw new Error("No active editor found");
    }

    const uri = vscode.Uri.file(path);
    return await vscode.workspace.openTextDocument(uri).then(doc => doc.getText(), () => {
        vscode.window.showErrorMessage("File not found: " + path);
        throw new Error("File not found: " + path);
    });
}

export async function GetCompilers() {
    if (compilers.size === 0) {
        const response = await axios.get('https://godbolt.org/api/compilers/c++?fields=id,name');
        for (const compiler of response.data) {
            compilers.set(compiler.name, compiler.id);
        }
    }
    return compilers;
}


export async function Compile(instance: CompilerInstance) {
    const request = new CompileRequest(instance);
    const url = 'https://godbolt.org/api/compiler/' + instance.compilerId + "/compile";
    const response = await axios.post(url, request);
    return response.data;
}

