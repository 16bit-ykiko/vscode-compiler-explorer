import * as vscode from "vscode";

import { logger } from "../request/Logger";
import { WebviewPanel } from "./WebView";
import { GetEditor, WriteFile } from "../request/Utility";
import { TreeViewProvider, TreeNode } from "./TreeView";
import { GetCompilerInfos, QueryCompilerInfo } from "../request/CompilerInfo";
import { Compile, GetShortLink, LoadShortLink } from "../request/Request";
import { CompilerInstance, SingleFileInstance, MultiFileInstance } from "./Instance";

let provider: TreeViewProvider;
let treeView: vscode.TreeView<TreeNode>;

export async function Register(context: vscode.ExtensionContext) {
    provider = await TreeViewProvider.create();
    treeView = vscode.window.createTreeView("compiler-explorer.view", { treeDataProvider: provider });

    // checkbox api is available since vscode 1.80.0
    // if the version is lower than 1.80.0, use command to toggle checkbox
    if (vscode.version >= "1.80.0") {
        treeView.onDidChangeCheckboxState(async (event) => {
            const [[node]] = event.items;
            const { attr, instance } = node;
            //@ts-ignore
            instance.filters[attr] = !instance.filters[attr];
            provider.refresh();
        });
    } else {
        vscode.commands.registerCommand("compiler-explorer.toggleCheckbox", async (node: TreeNode) => {
            const { attr, instance } = node;
            //@ts-ignore
            instance.filters[attr] = !instance.filters[attr];
            provider.refresh();
        });
    }

    RegisterView(context);
    RegisterInstance(context);
    RegisterSelect(context);
    RegisterText(context);
    RegisterItem(context);

    context.subscriptions.push(treeView);

    return { provider, treeView };
}

async function Resolve(context: vscode.ExtensionContext, instance: CompilerInstance) {
    if (instance.output === "webview") {
        const editor = instance instanceof SingleFileInstance ? GetEditor(instance.input) : GetEditor("active");
        const panel = new WebviewPanel({ context, editor });

        while (!panel.ready) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const result = await Compile(instance);
        panel.postMessage(result);
    } else {
        const result = await Compile(instance);
        const asm = result?.compileResult?.asm?.map((asm) => asm.text).join("\n") || "";
        WriteFile(instance.output, asm);
    }
}

/**
 * Register commands for the view
 * see that "menus": "view/title" in package.json
 */
function RegisterView(context: vscode.ExtensionContext) {
    const AddSingleInstance = vscode.commands.registerCommand("compiler-explorer.AddSingleInstance", async () => {
        provider.instances.push(await SingleFileInstance.create());
        provider.refresh();
    });

    const AddMultiInstance = vscode.commands.registerCommand("compiler-explorer.AddMultiInstance", async () => {
        provider.instances.push(await MultiFileInstance.create());
        provider.refresh();
    });

    const CompileAll = vscode.commands.registerCommand("compiler-explorer.CompileAll", async () => {
        const instances = provider.instances;
        try {
            const compilePromises = instances.map(async (instance) => {
                await Resolve(context, instance);
            });
            await Promise.all(compilePromises);
        } catch (error: unknown) {
            logger.error(`Compile failed while compile all, error: ${error}`);
        }
    });

    const GetLink = vscode.commands.registerCommand("compiler-explorer.GetLink", async () => {
        const instances = provider.instances;
        const link = await GetShortLink(instances);
        vscode.env.clipboard.writeText(link);
        logger.info(`The link has been copied to the clipboard: "${link}"`);
    });

    const LoadLink = vscode.commands.registerCommand("compiler-explorer.LoadLink", async () => {
        const link = await vscode.window.showInputBox({ placeHolder: "Enter link" });
        if (link) {
            try {
                const instances = await LoadShortLink(link);
                provider.instances = instances;
                provider.refresh();
            } catch (error: unknown) {
                logger.error(`Load link failed while load link, error: ${error}`);
            }
        }
    });

    const RemoveAll = vscode.commands.registerCommand("compiler-explorer.RemoveAll", async () => {
        provider.instances = [];
        provider.refresh();
    });

    const Clear = vscode.commands.registerCommand("compiler-explorer.Clear", async () => {
        WebviewPanel.clear();
    });

    context.subscriptions.push(AddSingleInstance);
    context.subscriptions.push(CompileAll);
    context.subscriptions.push(GetLink);
    context.subscriptions.push(AddMultiInstance);
    context.subscriptions.push(LoadLink);
    context.subscriptions.push(RemoveAll);
    context.subscriptions.push(Clear);
}

/**
 * Register commands for the instance
 * see that "menus": "view/item/context", "when": viewItem == instance, in package.json
 */
function RegisterInstance(context: vscode.ExtensionContext) {
    const Compile_ = vscode.commands.registerCommand("compiler-explorer.Compile", async (node: TreeNode) => {
        const instance = node.instance as CompilerInstance;
        try {
            await Resolve(context, instance);
        } catch (error: unknown) {
            logger.error(
                `Compile failed while compile for ${instance.compilerInfo?.name}, error: ${(error as Error).message}`
            );
        }
    });

    const Clone = vscode.commands.registerCommand("compiler-explorer.Clone", async (node: TreeNode) => {
        const instance = node.instance as CompilerInstance;
        provider.instances.push(instance.copy());
        provider.refresh();
    });

    const Remove = vscode.commands.registerCommand("compiler-explorer.Remove", async (node: TreeNode) => {
        const index = provider.instances.indexOf(node.instance as CompilerInstance);
        provider.instances.splice(index, 1);
        provider.refresh();
    });

    context.subscriptions.push(Compile_);
    context.subscriptions.push(Clone);
    context.subscriptions.push(Remove);
}
/**
 * Register commands for the select
 * see that "menus": "view/item/context", "when": viewItem == select, in package.json
 */
function RegisterSelect(context: vscode.ExtensionContext) {
    const SelectCompiler = vscode.commands.registerCommand(
        "compiler-explorer.SelectCompiler",
        async (node: TreeNode) => {
            const infos = await GetCompilerInfos();
            const options = Array.from(infos.keys()).map((name) => ({ label: name }));

            const selectedOption = await vscode.window.showQuickPick(options, {
                placeHolder: "Select a compiler",
            });

            if (selectedOption) {
                const instance = node.instance as CompilerInstance;
                instance.compilerInfo = await QueryCompilerInfo(selectedOption.label);
                provider.refresh();
            }
        }
    );

    context.subscriptions.push(SelectCompiler);
}

/**
 * Register commands for the text,
 * see that "menus": "view/item/context", "when": viewItem == text, in package.json
 */
function RegisterText(context: vscode.ExtensionContext) {
    const GetInput = vscode.commands.registerCommand("compiler-explorer.GetInput", async (node: TreeNode) => {
        const { attr, instance } = node;
        //@ts-ignore
        const last = instance[attr].value as string;
        const userInput = await vscode.window.showInputBox({
            placeHolder: "Enter the text",
            value: last,
        });

        if (userInput) {
            //@ts-ignore
            instance[attr] = { value: userInput, isPath: false };
            provider.refresh();
        }
    });

    const ClearInput = vscode.commands.registerCommand("compiler-explorer.ClearInput", async (node: TreeNode) => {
        const { attr, instance } = node;
        //@ts-ignore
        instance[attr].value = "";
        provider.refresh();
    });

    const CopyText = vscode.commands.registerCommand("compiler-explorer.CopyText", async (node: TreeNode) => {
        vscode.env.clipboard.writeText(node.label as string);
    });

    const OpenTempFile = vscode.commands.registerCommand("compiler-explorer.OpenTempFile", async (node: TreeNode) => {
        const { attr, instance, context } = node;
        if (context === "text") {
            //@ts-ignore
            await vscode.commands.executeCommand("workbench.action.files.newUntitledFile");
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const path = editor.document.uri.fsPath;
                //@ts-ignore
                instance[attr] = { value: path, isPath: true };
                provider.refresh();
            } else {
                logger.error("No active editor found");
            }
        }
    });

    context.subscriptions.push(GetInput);
    context.subscriptions.push(ClearInput);
    context.subscriptions.push(CopyText);
    context.subscriptions.push(OpenTempFile);
}

/**
 * Register commands for the item, see that "menus": "view/item/context" in package.json
 */
function RegisterItem(context: vscode.ExtensionContext) {
    const SelectFile = vscode.commands.registerCommand("compiler-explorer.SelectFile", async (node: TreeNode) => {
        const uri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            canSelectFiles: true,
            canSelectFolders: false,
        });

        if (uri) {
            const { attr, instance, context } = node;
            if (context === "file") {
                //@ts-ignore
                instance[attr] = uri[0].fsPath;
            } else if (context === "text") {
                //@ts-ignore
                instance[attr] = { value: uri[0].fsPath, isPath: true };
            }
            provider.refresh();
        }
    });

    const SelectFolder = vscode.commands.registerCommand("compiler-explorer.SelectFolder", async (node: TreeNode) => {
        const uri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
        });
        if (uri) {
            const { attr, instance, context } = node;
            if (context === "folder") {
                //@ts-ignore
                instance[attr] = uri[0].fsPath;
            }
            provider.refresh();
        }
    });

    context.subscriptions.push(SelectFile);
    context.subscriptions.push(SelectFolder);
}
