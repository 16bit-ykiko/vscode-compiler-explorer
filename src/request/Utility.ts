import * as path from "path";
import * as vscode from "vscode";
import axios from "axios";

import { existsSync } from "fs";
import { readFile, readdir, stat, mkdir, writeFile } from "fs/promises";

import { logger } from "./Logger";
import { Text } from "../view/Instance";

export function SetProxy() {
    const vscodeProxy = vscode.workspace.getConfiguration("http").get<string>("proxy");
    if (vscodeProxy) {
        axios.defaults.proxy = {
            host: new URL(vscodeProxy).hostname,
            port: parseInt(new URL(vscodeProxy).port),
            protocol: new URL(vscodeProxy).protocol,
        };
    }
}

export async function retry<T>(messgae: string, fn: () => Promise<T>, maxTries: number = 3): Promise<T> {
    let tries = 0;
    while (true) {
        try {
            return await fn();
        } catch (error: unknown) {
            if (tries !== maxTries && axios.isAxiosError(error)) {
                logger.info(`Request failed, retrying for the ${tries + 1} time.`);
                SetProxy();
                tries += 1;
            } else {
                logger.error(`Request failed for ${messgae}, after ${tries} tries`);
                throw error;
            }
        }
    }
}

export function GetEditor(path: string): vscode.TextEditor {
    if (path === "active") {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            return editor;
        }
        throw Error("No active editor found");
    } else {
        const uri = vscode.Uri.file(path);
        for (const editor of vscode.window.visibleTextEditors) {
            if (editor.document.uri.path === uri.path) {
                return editor;
            }
        }
        throw Error("File not found: " + path);
    }
}

export async function ReadSource(path: string) {
    if (path === "active") {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const fileName = editor.document.fileName;
            logger.info(`Read source from active editor, which is "${fileName}"`);
            return editor.document.getText();
        }
        throw new Error("No active editor found");
    } else {
        logger.info(`Read source from file "${path}"`);
        if (existsSync(path)) {
            return await readFile(path, "utf8");
        } else {
            const docs = vscode.workspace.textDocuments;
            for (const doc of docs) {
                if (doc.uri.fsPath === path) {
                    return doc.getText();
                }
            }
        }
        throw new Error("File not found: " + path);
    }
}

export async function ReadText(text: Text) {
    if (text.isPath) {
        return await ReadSource(text.value);
    } else {
        return text.value;
    }
}

export async function ReadCMakeSource(src: string) {
    let cmakeSource = "";
    let files: { filename: string; contents: string }[] = [];

    const cmake = path.join(src, "CMakeLists.txt");
    if (existsSync(cmake)) {
        cmakeSource = await ReadSource(cmake);
        for (const filename of await readdir(src, { recursive: true })) {
            const fullname = path.join(src, filename);
            const stats = await stat(fullname);
            if (stats.isFile()) {
                // TODO: Filters files according to the setting.json
                if (filename !== "CMakeLists.txt") {
                    files.push({ filename: filename, contents: await ReadSource(fullname) });
                }
            }
        }
        return { cmakeSource, files };
    } else {
        throw Error(`CMakeLists.txt not found in ${src}`);
    }
}

async function CreateTempDir() {
    const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspacePath) {
        throw Error("No workspace folder found");
    }

    const dir = path.join(workspacePath, ".compiler-explorer");
    if (!existsSync(dir)) {
        await mkdir(dir);
    }

    return dir;
}

export async function WriteFile(filename: string, content: string) {
    logger.info(`Write to file: "${filename}"`);
    await writeFile(filename, content, "utf8");
    return filename;
}

export async function WriteTemp(contents: string) {
    const dir = await CreateTempDir();

    let index = 1;
    while (existsSync(path.join(dir, `source${index}.cpp`))) {
        index += 1;
    }

    const filename = path.join(dir, `source${index}.cpp`);
    await WriteFile(filename, contents);

    vscode.workspace.openTextDocument(filename).then((doc) => vscode.window.showTextDocument(doc));

    return filename;
}

export async function WriteTemps(files: { filename: string; content: string }[]) {
    const dir = await CreateTempDir();

    let index = 1;
    while (existsSync(path.join(dir, `cmake${index}`))) {
        index += 1;
    }

    const src = path.join(dir, `cmake${index}`);
    await mkdir(src);

    for (const file of files) {
        const filename = path.normalize(file.filename);
        const fullname = path.join(src, filename);
        const dirname = path.dirname(fullname);
        if (!existsSync(dirname)) {
            await mkdir(dirname, { recursive: true });
        }
        await WriteFile(fullname, file.content);
    }

    vscode.workspace
        .openTextDocument(path.join(src, "CMakeLists.txt"))
        .then((doc) => vscode.window.showTextDocument(doc));

    return src;
}

export function SplitCommandArgs(commandLine: string): string[] {
    const args: string[] = [];
    let currentArg = "";
    let insideQuotes = false;

    for (let i = 0; i < commandLine.length; i++) {
        const char = commandLine[i];
        if (char === " " && !insideQuotes) {
            if (currentArg !== "") {
                args.push(currentArg);
                currentArg = "";
            }
        } else if (char === '"') {
            insideQuotes = !insideQuotes;
        } else {
            currentArg += char;
        }
    }

    if (currentArg !== "") {
        args.push(currentArg);
    }

    return args;
}
