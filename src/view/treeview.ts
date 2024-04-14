import * as vscode from 'vscode';
import { CompilerInstance, Filter } from './Instance';


class TreeNode {
    attr?: string; // Store the attribute name of the instance
    label?: string; // The label to display in the tree view
    context?: string; // The Tag to identify different nodes
    children?: TreeNode[];
    instance?: CompilerInstance;

    static async from(instance: CompilerInstance) {
        const info = instance.compilerInfo!;

        let result: TreeNode = {
            label: info.name,
            context: "instance",
            instance: instance,
            children: [
                { label: `Compiler: ${info.name}`, context: "select" },
                { label: "Input file", attr: "inputFile", context: "text" },
                { label: "Output file", attr: "outputFile", context: "text" },
                { label: "Options", attr: "options", context: "text" },
            ]
        };

        if (info.supportsExecute) {
            result.children?.push({ label: "Exec", attr: "exec", context: "text" },);
            result.children?.push({ label: "Stdin", attr: "stdin", context: "text" },);
        }

        for (const child of result.children as TreeNode[]) {
            child.instance = instance;
        }

        const filters: TreeNode[] = [];
        if (info?.supportsBinaryObject) {
            filters.push({ label: "Compile to binary object", attr: "binaryObject" });
        }

        if (info?.supportsBinary) {
            filters.push({ label: "Compile to binary", attr: "binary" });
        }

        if (info?.supportsExecute) {
            filters.push({ label: "Execute the code", attr: "execute" });
        }

        if (info?.supportsIntel) {
            filters.push({ label: "Use Intel assembly syntax", attr: "intel" });
        }

        if (info?.supportsDemangle) {
            filters.push({ label: "Demangle the symbols", attr: "demangle" });
        }

        filters.push({ label: "Hide unused labels", attr: "labels" });

        if (info?.supportsLibraryCodeFilter) {
            filters.push({ label: "Hide library code", attr: "libraryCode" });
        }

        filters.push({ label: "Hide directives", attr: "directives" });
        filters.push({ label: "Hide comment only lines", attr: "commentOnly" });
        filters.push({ label: "Horizontal whitespace", attr: "trim" });
        filters.push({ label: "Debug calls", attr: "debugCalls" });

        for (const child of filters) {
            child.context = "checkbox";
            child.instance = instance;
        }

        result.children?.push({ label: "Filter", context: "filter", children: filters });
        return result;
    }
}

export class TreeItem implements vscode.TreeItem {
    attr?: string;
    contextValue?: string;
    label?: string | vscode.TreeItemLabel | undefined;
    instance?: CompilerInstance;
    checkboxState?: vscode.TreeItemCheckboxState;
    collapsibleState?: vscode.TreeItemCollapsibleState;

    constructor(node: TreeNode) {
        const { label, context, children, attr, instance } = node;
        this.label = label as string;

        if (instance && attr) {
            const value = instance[attr as keyof CompilerInstance];
            if (typeof value === "string") {
                this.label = `${label}: "${value}"`;
            }
        }

        this.attr = attr;
        this.instance = instance;
        this.contextValue = context as string;
        this.collapsibleState = children ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None;

        if (node.context === "checkbox") {
            const value = instance?.filters[node.attr as keyof Filter] as boolean;
            this.checkboxState = value ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
        }

    }
}

export class TreeViewProvider implements vscode.TreeDataProvider<TreeNode> {
    private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    instances: CompilerInstance[] = [];

    static async create() {
        const provider = new TreeViewProvider();
        provider.instances = [await CompilerInstance.create()];
        return provider;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    async getTreeItem(element: TreeNode) {
        return new TreeItem(element);
    }

    async getChildren(element?: TreeNode) {
        return element ? element.children : await Promise.all(this.instances.map(TreeNode.from));
    }
}