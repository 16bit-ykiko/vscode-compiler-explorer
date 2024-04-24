import * as vscode from 'vscode';

import { LoadShortLink } from '../request/Request';
import { singleIcon, cmakeIcon, filtersIcon, trueIcon, falseIcon, Config } from '../request/Config';
import { CompilerInstance, SingleFileInstance, MultiFileInstance } from './Instance';

export class TreeNode {
    attr?: string; // Store the attribute name of the instance
    label?: string; // The label to display in the tree view
    context?: string; // The Tag to identify different nodes
    iconPath?: string | vscode.Uri; // The icon to display in the tree view
    children?: TreeNode[];
    instance?: CompilerInstance;

    static as_filters(instance: CompilerInstance) {
        const info = instance.compilerInfo!;
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

        return filters;
    }

    static async from(instance: CompilerInstance) {
        const info = instance.compilerInfo;

        let result = {
            label: info.name,
            context: "instance",
            iconPath: (instance instanceof SingleFileInstance ? singleIcon : cmakeIcon),
            instance: instance,
            children: [{ label: `Compiler: ${info.name}`, context: "select" } as TreeNode]
        };

        if (instance instanceof SingleFileInstance) {
            result.children.push({ label: "Input file", attr: "input", context: "file" });
        }
        else if (instance instanceof MultiFileInstance) {
            result.children.push({ label: "CMake Arguments", attr: "cmakeArgs", context: "text" });
            result.children.push({ label: "Source", attr: "src", context: "folder" });
        }

        result.children.push({ label: "Output", attr: "output", context: "file" });
        result.children.push({ label: "Options", attr: "options", context: "text" });

        // if the compiler supports execute, add the exec and stdin fields
        if (info.supportsExecute) {
            result.children.push({ label: "Exec", attr: "exec", context: "text" },);
            result.children.push({ label: "Stdin", attr: "stdin", context: "text" },);
        }

        for (const child of result.children as TreeNode[]) {
            child.instance = instance;
        }

        result.children.push({
            label: "Filters",
            context: "filters",
            iconPath: filtersIcon,
            children: TreeNode.as_filters(instance),
            instance: instance
        });

        return result;
    }
}

export class TreeItem implements vscode.TreeItem {
    contextValue?: string;
    label?: string | vscode.TreeItemLabel | undefined;
    checkboxState?: vscode.TreeItemCheckboxState;
    collapsibleState?: vscode.TreeItemCollapsibleState;
    iconPath?: string | vscode.Uri | { light: string | vscode.Uri; dark: string | vscode.Uri };
    command?: vscode.Command | undefined;

    constructor(node: TreeNode) {
        const { attr, label, context, iconPath, instance } = node;

        this.label = label as string;
        if (instance && attr) {
            //@ts-ignore
            const value = instance[attr];
            if (typeof value === "string") {
                this.label = `${label}: "${value}"`;
            }
        }

        this.iconPath = iconPath;
        this.contextValue = context;

        if (context === "instance" || context === "filters") {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }

        if (context === "checkbox") {
            //@ts-ignore
            const value = instance.filters[attr] as boolean;
            // checkbox api is available since vscode 1.80.0
            // if the version is lower than 1.80.0, use command to toggle checkbox
            if (vscode.version >= "1.80.0") {
                this.checkboxState = value ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
            } else {
                this.iconPath = value ? trueIcon : falseIcon;
                this.command = {
                    title: "Toggle",
                    command: "compiler-explorer.toggleCheckbox",
                    arguments: [node]
                };
            }
        }
    }
}

export class TreeViewProvider implements vscode.TreeDataProvider<TreeNode> {
    private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    instances: CompilerInstance[] = [];

    static async create() {
        const provider = new TreeViewProvider();
        const url = Config.defaultURL();
        if (url !== "") {
            provider.instances = await LoadShortLink(Config.defaultURL());
        }
        else {
            provider.instances.push(await SingleFileInstance.create());
        }
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