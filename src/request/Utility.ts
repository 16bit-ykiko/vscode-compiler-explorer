import * as vscode from 'vscode';
import { logger } from './Logger';

export async function retry<T>(messgae: string, fn: () => Promise<T>, maxTries: number = 5): Promise<T> {
    let tries = 0;
    while (true) {
        try {
            return await fn();
        } catch (error) {
            if (tries !== maxTries) {
                logger.info(`Request failed, retrying for the ${tries + 1} time.`);
                tries += 1;
            } else {
                logger.error(`Request failed for ${messgae}, after ${tries} tries, error: ${error}`);
                vscode.window.showErrorMessage(`Request failed for ${messgae}, after ${tries} tries, check output channel for more details.`);
                throw error;
            }
        }
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