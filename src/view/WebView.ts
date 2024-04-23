import * as path from 'path';
import * as vscode from 'vscode';

import { throttle } from 'lodash';
import { singleIcon, Config } from '../request/Config';
import { CompileResult, ExecuteResult } from "../request/CompileResult";

interface ShowWebviewParams {
    context: vscode.ExtensionContext;
    editor: vscode.TextEditor;
    result: Promise<{ compileResult: CompileResult, executeResult?: ExecuteResult }>
};

const panels: vscode.WebviewPanel[] = [];

export async function ShowWebview(params: ShowWebviewParams) {
    const { context, editor, result } = params;

    const panel = vscode.window.createWebviewPanel(
        'compiler-explorer-webview',
        'Compiler Explorer',
        vscode.ViewColumn.Beside,
        { enableScripts: true, enableFindWidget: true }
    );

    panels.push(panel);
    panel.iconPath = singleIcon;
    panel.webview.html = getWebviewHtml(context.extensionPath, panel);
    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'ready': {
                panel.webview.postMessage({ command: 'setResults', results: await result });
            } return;
            case 'gotoLine': {
                const lineNo = message.lineNo as number;
                if (lineNo < 0 || lineNo === editor.selection.active.line || lineNo >= editor.document.lineCount) {
                    break;
                }
                editor.selection = new vscode.Selection(lineNo, 0, lineNo, 0);
                editor.revealRange(
                    new vscode.Range(lineNo, 0, lineNo, 0),
                    vscode.TextEditorRevealType.InCenter
                );
            } return;
        }
    });

    const selectionChangedHandler = (event: vscode.TextEditorSelectionChangeEvent) => {
        if (event.textEditor === editor) {
            const lineNo = editor.selection.active.line;
            panel.webview.postMessage({ command: 'gotoLine', lineNo });
        }
    };

    const disposable = vscode.window.onDidChangeTextEditorSelection(throttle(selectionChangedHandler, 100));
    context.subscriptions.push(disposable);
};

export function ClearWebview() {
    for (const panel of panels) {
        panel.dispose();
    }
    panels.length = 0;
}

function getWebviewHtml(extensionPath: string, panel: vscode.WebviewPanel): string {
    const buildPath = path.join(extensionPath, 'webview-ui', 'build');
    const scriptPath = path.join(buildPath, 'assets', 'index.js');
    const stylePath = path.join(buildPath, 'assets', 'index.css');

    let colorStyle = "";
    for (const [key, value] of Object.entries(Config.defaultColor())) {
        colorStyle += `.compiler-explorer-${key} { 
            color: ${value}; 
            font-family: var(--vscode-editor-font-family); 
            font-size: var(--vscode-editor-font-size); 
        }\n`;
    }

    return `<!DOCTYPE html>
    <html lang="en">
        <head>
            <style> 
                .compiler-explorer-output {
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                }
                ${colorStyle} 
            </style>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="${panel.webview.asWebviewUri(vscode.Uri.file(stylePath))}">
            <title>React Webview</title>
        </head>
        <body>
            <div id="root"></div>
            <script src="${panel.webview.asWebviewUri(vscode.Uri.file(scriptPath))}"></script>
        </body>
    </html>`;
}
