import * as vscode from 'vscode';
import { CompilerInstance, Filter } from './instance';

class TreeNode {
    attr?: string; // Store the attribute name of the instance
    label?: string; // The label to display in the tree view
    context?: string; // The Tag to identify different nodes
    children?: TreeNode[];
    instance?: CompilerInstance;

    static from(instance: CompilerInstance): TreeNode {
        let result: TreeNode = {
            label: instance.compiler,
            context: "instance",
            instance: instance,
            children: [
                { label: "Compiler", attr: "compiler", context: "select" },
                { label: "Input file", attr: "inputFile", context: "text" },
                { label: "Output file", attr: "outputFile", context: "text" },
                { label: "Options", attr: "options", context: "text" },
                { label: "Exec", attr: "exec", context: "text" },
                { label: "Stdin", attr: "stdin", context: "text" },
            ]
        };

        for (const child of result.children as TreeNode[]) {
            child.instance = instance;
        }

        const filters: TreeNode[] = [
            { label: "Compile to binary object", attr: "binaryObject" },
            { label: "Link to binary", attr: "binary" },
            { label: "Execute the code", attr: "execute" },
            { label: "Use Intel assembly syntax", attr: "intel" },
            { label: "Demangle the symbols", attr: "demangle" },
            { label: "Hide unused labels", attr: "labels" },
            { label: "Hide library code", attr: "libraryCode" },
            { label: "Hide directives", attr: "directives" },
            { label: "Hide comment only lines", attr: "commentOnly" },
            { label: "Horizontal whitespace", attr: "trim" },
            { label: "Debug calls", attr: "debugCalls" }
        ];

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
    private _onDidChangeTreeData: vscode.EventEmitter<TreeNode | undefined> = new vscode.EventEmitter<TreeNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined> = this._onDidChangeTreeData.event;

    instances = [new CompilerInstance()];

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: TreeNode): TreeItem {
        return new TreeItem(element);
    }

    getChildren(element?: TreeNode): TreeNode[] {
        return element ? element.children as TreeNode[] : this.instances.map(TreeNode.from);
    }
}