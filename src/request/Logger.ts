import * as vscode from 'vscode';

class Logger {
    readonly logger: vscode.OutputChannel;

    constructor() {
        this.logger = vscode.window.createOutputChannel("Compiler Explorer");
        this.logger.show();
        this.logger.appendLine("Compiler Explorer is now active!");
    }

    info(message: string) {
        this.logger.appendLine(message);
    }

    error(message: string) {
        this.logger.appendLine(`Error: ${message}`);
        this.logger.show();
    }

    dispose() {
        this.logger.dispose();
    }
}

export const logger = new Logger();