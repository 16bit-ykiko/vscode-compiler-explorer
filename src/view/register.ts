import * as vscode from 'vscode';
import { ShowWebview, ClearWebview } from './webview';
import { CompilerInstance, Filter } from './instance';
import { TreeViewProvider, TreeItem } from './treeview';
import { Compile, GetCompilers } from '../request/compile';
import { GetShortLink, LoadShortLink } from '../request/link';

export async function register(context: vscode.ExtensionContext) {

    let provider = new TreeViewProvider();
    const treeView = vscode.window.createTreeView('compiler-explorer.view', { treeDataProvider: provider });

    treeView.onDidChangeCheckboxState(async (event) => {
        const [[node]] = event.items;
        const attr = node.attr as keyof Filter;
        const filters = node.instance?.filters as Filter;
        (filters[attr] as boolean) = !(filters[attr] as boolean);
        provider.refresh();
    });

    context.subscriptions.push(treeView);

    const AddCompiler = vscode.commands.registerCommand('compiler-explorer.AddCompiler', async () => {
        provider.instances.push(new CompilerInstance());
        provider.refresh();
    });

    const CompileAll = vscode.commands.registerCommand('compiler-explorer.CompileAll', async () => {
        const instances = provider.instances;

        const responses = instances.map(async instance => {
            return await Compile(instance);
        });

        for (const response of responses) {
            ShowWebview(await response);
        }
    });

    const GetLink = vscode.commands.registerCommand('compiler-explorer.GetLink', async () => {
        const instances = provider.instances;
        const link = await GetShortLink(instances);
        vscode.env.clipboard.writeText(link);
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
    context.subscriptions.push(LoadLink);
    context.subscriptions.push(RemoveAll);
    context.subscriptions.push(Clear);

    const Compile_ = vscode.commands.registerCommand('compiler-explorer.Compile', async () => {
        const instance = provider.instances[0];
        const response = await Compile(instance);
        ShowWebview(response);
    });

    const Clone = vscode.commands.registerCommand('compiler-explorer.Clone', async (node: TreeItem) => {
        const instance = node.instance as CompilerInstance;
        provider.instances.push(instance.copy());
        provider.refresh();
    });

    const Remove = vscode.commands.registerCommand('compiler-explorer.Remove', async (node: TreeItem) => {
        const index = provider.instances.indexOf(node.instance as CompilerInstance);
        provider.instances.splice(index, 1);
        provider.refresh();
    });

    const SelectCompiler = vscode.commands.registerCommand('compiler-explorer.SelectCompiler', async (node: TreeItem) => {
        const compilers = await GetCompilers();
        const options = Array.from(compilers.keys()).map(label => ({ label }));

        const selectedOption = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select a compiler',
        });

        if (selectedOption) {
            const instance = node.instance as CompilerInstance;
            instance.compiler = selectedOption.label;
            instance.compilerId = compilers.get(selectedOption.label) as string;
            provider.refresh();
        }
    });

    const GetInputFile = vscode.commands.registerCommand('compiler-explorer.GetInput', async (node: TreeItem) => {
        const userInput = await vscode.window.showInputBox({ placeHolder: "Enter The text" });
        if (userInput) {
            const instance = node.instance as CompilerInstance;
            const attr = node.attr as keyof CompilerInstance;
            (instance[attr] as string) = userInput;
            provider.refresh();
        }
    });

    context.subscriptions.push(Compile_);
    context.subscriptions.push(Clone);
    context.subscriptions.push(Remove);
    context.subscriptions.push(SelectCompiler);
    context.subscriptions.push(GetInputFile);
}


