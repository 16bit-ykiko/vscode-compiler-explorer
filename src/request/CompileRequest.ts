import * as vscode from 'vscode';
import { CompilerInstance, Filter, Tool, Library } from "../view/instance";

export class ExecuteParameter {
    args?: string[];
    stdin?: string;
};

export class CompilerOption {

}

export class CompileOptions {
    userArguments?: string;
    executeParameters?: ExecuteParameter;
    compilerOptions?: CompilerOption;
    filters?: Filter;
    tools?: Tool[];
    libraries?: Library[];
};

export class CompileRequest {
    source?: string;
    compiler?: string;
    options?: CompileOptions;
    lang: string = "c++";
    allowStoreCodeDebug: boolean = true;

    static async from(instance: CompilerInstance) {
        let request = new CompileRequest();
        request.source = await ReadSource(instance.inputFile);
        request.compiler = instance.compilerId;
        request.options = {
            userArguments: instance.options,
            filters: instance.filters,
            executeParameters: {
                args: instance.exec === "" ? undefined : instance.exec.split(" "),
                stdin: instance.stdin
            }
        };
        return request;
    }
}

export async function ReadSource(path: string): Promise<string> {
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