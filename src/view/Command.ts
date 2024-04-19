import * as vscode from 'vscode';

import { logger } from '../request/Logger';
import { GetEditor } from '../request/CompileRequest';
import { CompilerInstance, SingleFileInstance, MultiFileInstance } from './Instance';
import { ShowWebview, ClearWebview } from './WebView';
import { TreeViewProvider, TreeNode } from './TreeView';
import { GetCompilerInfos, QueryCompilerInfo } from '../request/CompilerInfo';
import { Compile, GetShortLink, LoadShortLink } from '../request/Request';


export async function register(context: vscode.ExtensionContext) {

    let provider = await TreeViewProvider.create();
    const treeView = vscode.window.createTreeView('compiler-explorer.view', { treeDataProvider: provider });

    treeView.onDidChangeCheckboxState(async (event) => {
        const [[node]] = event.items;
        const { attr, instance } = node;
        //@ts-ignore
        instance.filters[attr] = !instance.filters[attr];
        provider.refresh();
    });

    context.subscriptions.push(treeView);

    const AddCompiler = vscode.commands.registerCommand('compiler-explorer.AddCompiler', async () => {
        provider.instances.push(await SingleFileInstance.create());
        provider.refresh();
    });

    const CompileAll = vscode.commands.registerCommand('compiler-explorer.CompileAll', async () => {
        const instances = provider.instances;
        try {
            const results = await Promise.all(instances.map(instances => Compile(instances)));
            const editors = instances.map(instance => {
                if (instance instanceof SingleFileInstance) {
                    return GetEditor(instance.input);
                }
                return GetEditor("active");
            });
            for (const i in instances) {
                ShowWebview({ context, result: results[i], editor: editors[i] });
            }
        } catch (error: unknown) {
            logger.error(`Compile failed while compile all, error: ${error}`);
        }
    });

    const GetLink = vscode.commands.registerCommand('compiler-explorer.GetLink', async () => {
        const instances = provider.instances;
        const link = await GetShortLink(instances);
        vscode.env.clipboard.writeText(link);
    });

    const AddCMake = vscode.commands.registerCommand('compiler-explorer.AddCMake', async () => {
        provider.instances.push(await MultiFileInstance.create());
        provider.refresh();
    });

    const LoadLink = vscode.commands.registerCommand('compiler-explorer.LoadLink', async () => {
        const link = await vscode.window.showInputBox({ placeHolder: "Enter link" });
        if (link) {
            const instances = await LoadShortLink(link);
            provider.instances = instances;
            provider.refresh();
        }
    });

    const RemoveAll = vscode.commands.registerCommand('compiler-explorer.RemoveAll', async () => {
        provider.instances = [];
        provider.refresh();
    });

    const Clear = vscode.commands.registerCommand('compiler-explorer.Clear', async () => {
        ClearWebview();
    });

    context.subscriptions.push(AddCompiler);
    context.subscriptions.push(CompileAll);
    context.subscriptions.push(GetLink);
    context.subscriptions.push(AddCMake);
    context.subscriptions.push(LoadLink);
    context.subscriptions.push(RemoveAll);
    context.subscriptions.push(Clear);

    const Compile_ = vscode.commands.registerCommand('compiler-explorer.Compile', async (node: TreeNode) => {
        const instance = node.instance as CompilerInstance;
        try {
            const result = await Compile(instance);

            if (instance instanceof SingleFileInstance) {
                const editor = GetEditor(instance.input);
                ShowWebview({ context, result, editor });
            }
            
            console.log(result); // TODO: Show the result of CMake Build
        } catch (error: unknown) {
            logger.error(`Compile failed while compile for ${instance.compilerInfo?.name}, error: ${(error as Error).message}`);
        }
    });

    const Clone = vscode.commands.registerCommand('compiler-explorer.Clone', async (node: TreeNode) => {
        const instance = node.instance as CompilerInstance;
        provider.instances.push(instance.copy());
        provider.refresh();
    });

    const Remove = vscode.commands.registerCommand('compiler-explorer.Remove', async (node: TreeNode) => {
        const index = provider.instances.indexOf(node.instance as CompilerInstance);
        provider.instances.splice(index, 1);
        provider.refresh();
    });

    const SelectCompiler = vscode.commands.registerCommand('compiler-explorer.SelectCompiler', async (node: TreeNode) => {
        const infos = await GetCompilerInfos();
        const options = Array.from(infos.keys()).map(name => ({ label: name }));

        const selectedOption = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select a compiler',
        });

        if (selectedOption) {
            const instance = node.instance as CompilerInstance;
            instance.compilerInfo = await QueryCompilerInfo(selectedOption.label);
            provider.refresh();
        }
    });

    const GetInput = vscode.commands.registerCommand('compiler-explorer.GetInput', async (node: TreeNode) => {
        const userInput = await vscode.window.showInputBox({ placeHolder: "Enter The text" });
        if (userInput) {
            const { attr, instance } = node;
            //@ts-ignore
            instance[attr] = userInput;
            provider.refresh();
        }
    });

    const ClearInput = vscode.commands.registerCommand('compiler-explorer.ClearInput', async (node: TreeNode) => {
        const { attr, instance } = node;
        //@ts-ignore
        instance[attr] = '';
        provider.refresh();
    });

    const CopyText = vscode.commands.registerCommand('compiler-explorer.CopyText', async (node: TreeNode) => {
        vscode.env.clipboard.writeText(node.label as string);
    });

    context.subscriptions.push(Compile_);
    context.subscriptions.push(Clone);
    context.subscriptions.push(Remove);
    context.subscriptions.push(SelectCompiler);
    context.subscriptions.push(GetInput);
    context.subscriptions.push(ClearInput);
    context.subscriptions.push(CopyText);

    const SelectFile = vscode.commands.registerCommand('compiler-explorer.SelectFile', async (node: TreeNode) => {
        const uri = await vscode.window.showOpenDialog({ canSelectMany: false, canSelectFiles: true, canSelectFolders: false });
        if (uri) {
            const { attr, instance } = node;
            //@ts-ignore
            instance[attr] = uri[0].fsPath;
            provider.refresh();
        }
    });

    const SelectFolder = vscode.commands.registerCommand('compiler-explorer.SelectFolder', async (node: TreeNode) => {
        const uri = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, canSelectMany: false });
        if (uri) {
            const { attr, instance } = node;
            //@ts-ignore
            instance[attr] = uri[0].fsPath;
            provider.refresh();
        }
    });

    context.subscriptions.push(SelectFile);
    context.subscriptions.push(SelectFolder);
}


