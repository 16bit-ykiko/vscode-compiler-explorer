import * as vscode from 'vscode';
import { CompileResult, ExecuteResult } from "../request/CompileResult";

export async function ShowWebview(result: { compileResult: CompileResult, executeResult?: ExecuteResult }) {

    const asm = result.compileResult.asm?.map(line => line.text).join("\n");

    vscode.workspace.openTextDocument({ content: asm, language: "asm" }).then(doc => {
        vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
    });
};

export async function ClearWebview() {

}