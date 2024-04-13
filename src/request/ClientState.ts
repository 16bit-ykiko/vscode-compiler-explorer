import * as vscode from 'vscode';
import { ReadSource } from "./CompileRequest";
import { CompilerInstance, Filter, Tool, Library } from "../view/instance";

export class ClientStateCompiler {
    _internalid: any = undefined;
    id = '';
    options = '';
    filters?: Filter;
    libs?: Library[];
    specialoutputs: any[] = [];
    tools?: Tool[];
}

export class ClientStateExecutor {
    compilerVisible = true;
    compilerOutputVisible = true;
    arguments: any[] = [];
    argumentsVisible = true;
    stdin = '';
    stdinVisible = true;
    compiler: ClientStateCompiler = new ClientStateCompiler();
    wrap?: boolean;
}

// TODO:
//export class MultifileFile {
//    id: any = undefined;
//    fileId = 0;
//    isIncluded = false;
//    isOpen = false;
//    isMainSource = false;
//    filename: string | undefined = '';
//    content = '';
//    editorId = -1;
//    langId = 'c++';
//}
//
//export class ClientStateTree {
//    id = 1;
//    cmakeArgs = '';
//    customOutputFilename = '';
//    isCMakeProject = false;
//    compilerLanguageId = 'c++';
//    files: MultifileFile[] = [];
//    newFileId = 1;
//    compilers: ClientStateCompiler[] = [];
//    executors: ClientStateExecutor[] = [];
//}

export class ClientStateSession {
    id: number | false = false;
    language = 'c++';
    source = '';
    compilers: ClientStateCompiler[] = [];
    executors: ClientStateExecutor[] = [];
    //TODO: filename?: string = undefined;

    addCompiler(instance: CompilerInstance) {
        const compiler = new ClientStateCompiler();
        const { compilerId, options, filters, exec, stdin } = instance;
        compiler.id = compilerId;
        compiler.options = options;
        compiler.filters = filters;
        this.compilers.push(compiler);

        if (filters.execute && (exec !== "" || stdin !== "")) {
            const executor = new ClientStateExecutor();
            executor.compiler = compiler;
            executor.stdin = instance.stdin;
            executor.arguments = instance.exec.split(" ");
            this.executors.push(executor);
        }

        // TODO: libs and tools
    }

    static async from(id: number, instance: CompilerInstance) {
        const session = new ClientStateSession();
        session.id = id;
        session.source = await ReadSource(instance.inputFile);
        session.addCompiler(instance);
        return session;
    }
}

export class ClientState {
    sessions: ClientStateSession[] = [];
    //TODO: trees?: ClientStateTree[] = [];

    static async from(instances: CompilerInstance[]) {
        const clientState = new ClientState();
        let filesCache = new Map<string, number>();
        for (const instance of instances) {
            const index = filesCache.get(instance.inputFile);
            if (index === undefined) {
                const id = clientState.sessions.length;
                filesCache.set(instance.inputFile, id);
                const session = await ClientStateSession.from(id, instance);
                clientState.sessions.push(session);
            }
            else {
                clientState.sessions[index].addCompiler(instance);
            }
        }
        return clientState;
    }

    // FIXME: Now, it can not resolve the link with executor only instance
    static async toInstances(clientState: ClientState): Promise<CompilerInstance[]> {
        // TODO: I am not sure where to place the source code
        let instances: CompilerInstance[] = [];
        for (const session of clientState.sessions) {

            vscode.workspace.openTextDocument({ content: session.source, language: "cpp" }).then((document) => {
                vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });

                console.log(document.uri);
                for (const compiler of session.compilers) {
                    const instance = new CompilerInstance();
                    instance.compilerId = compiler.id;
                    instance.options = compiler.options;
                    instance.filters = new Filter();
                    Object.assign(instance.filters, compiler.filters);
                    instance.inputFile = document.uri.fsPath;
                    instances.push(instance);
                }
            });
        }
        return instances;
    }
}