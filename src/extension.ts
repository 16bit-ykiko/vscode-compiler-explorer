import * as vscode from "vscode";

import { logger, initLogger } from "./request/Logger";
import { Register } from "./view/Command";
import { SetProxy } from "./request/Utility";
import { WebviewPanel } from "./view/WebView";

export function activate(context: vscode.ExtensionContext) {
    initLogger();
    SetProxy();
    Register(context);
}

export function deactivate() {
    logger.dispose();
    WebviewPanel.clear();
}
