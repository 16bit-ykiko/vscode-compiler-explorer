import * as vscode from "vscode";

import { Register } from "./view/Command";
import { SetProxy } from "./request/Utility";
import { WebviewPanel } from "./view/WebView";
import { logger, initLogger } from "./request/Logger";
import { TreeViewProvider, TreeNode } from "./view/TreeView";

interface API {
    provider: TreeViewProvider;
    treeView: vscode.TreeView<TreeNode>;
    context: vscode.ExtensionContext;
    panels: vscode.WebviewPanel[];
}

export async function activate(context: vscode.ExtensionContext) {
    initLogger();
    SetProxy();
    const { provider, treeView } = await Register(context);
    const panels = WebviewPanel.panels;
    return { provider, treeView, context, panels };
}

export function deactivate() {
    logger.dispose();
    WebviewPanel.clear();
}
