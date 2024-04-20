import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { ReadSource } from './Utility';
import { CompilerInstance, SingleFileInstance, MultiFileInstance, Filter, Tool, Library } from "../view/Instance";

export class ExecuteParameter {
    args?: string[];
    stdin?: string;
};

export class CompilerOption {
    skipAsm?: boolean;
    cmakeArgs?: string;
    executorRequest?: boolean;
    customOutputFilename?: string;
}

export class CompileOptions {
    tools?: Tool[];
    filters?: Filter;
    libraries?: Library[];
    userArguments?: string;
    executeParameters?: ExecuteParameter;
    compilerOptions: CompilerOption = new CompilerOption();

    static from(instance: CompilerInstance): CompileOptions {
        let options = new CompileOptions();

        options.userArguments = instance.options;
        options.filters = instance.filters;

        if (instance.compilerInfo?.supportsExecute) {
            options.executeParameters = {
                args: instance.exec === "" ? undefined : instance.exec.split(" "),
                stdin: instance.stdin
            };
        }

        if (instance instanceof MultiFileInstance) {
            options.compilerOptions.cmakeArgs = instance.cmakeArgs;
            options.compilerOptions.customOutputFilename = "main";
        }

        return options;
    }
};

export class CompileRequest {
    lang = "c++";
    bypassCache = 0;
    allowStoreCodeDebug = true;

    source?: string;
    compiler?: string;
    options?: CompileOptions;
    files?: { filename: string, contents: string }[];

    static async from(instance: CompilerInstance) {
        let request = new CompileRequest();

        if (instance instanceof SingleFileInstance) {
            request.source = await ReadSource(instance.input);
        } else if (instance instanceof MultiFileInstance) {
            const cmake = path.join(instance.src, "CMakeLists.txt");
            if (fs.existsSync(cmake)) {
                request.source = await ReadSource(cmake);
                request.files = [];

                for (const name of fs.readdirSync(instance.src, { recursive: true })) {
                    const filename = name as string;
                    const fullname = path.join(instance.src, filename);
                    const stats = fs.statSync(fullname);
                    if (stats.isFile()) {
                        // TODO: Filters files according to the setting.json
                        if (filename !== "CMakeLists.txt") {
                            request.files.push({ filename: filename, contents: fs.readFileSync(fullname, 'utf8') });
                        }
                    }
                };
            }
            else {
                vscode.window.showErrorMessage(`CMakeLists.txt not found in ${instance.src}`);
                throw Error(`CMakeLists.txt not found in ${instance.src}`);
            }
        }

        request.compiler = instance.compilerInfo?.id;
        request.options = CompileOptions.from(instance);
        console.log(request);
        return request;
    }
}

