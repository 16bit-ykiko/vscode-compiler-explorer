import * as vscode from 'vscode';

let logger: vscode.OutputChannel | undefined = undefined;

export function initLogger(context: vscode.ExtensionContext) {
    logger = vscode.window.createOutputChannel("Compiler Explorer");
    context.subscriptions.push(logger);
}

export function log(message: string) {
    if (logger) {
        logger.appendLine(message);
    }
}