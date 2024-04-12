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

// TODO:
//export class ClientStateExecutor {
//    compilerVisible = false;
//    compilerOutputVisible = false;
//    arguments: any[] = [];
//    argumentsVisible = false;
//    stdin = '';
//    stdinVisible = false;
//    compiler: ClientStateCompiler = new ClientStateCompiler();
//    wrap?: boolean;
//
//}
//
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
    //TODO: executors: ClientStateExecutor[] = [];
    //TODO: filename?: string = undefined;

    addCompiler(instance: CompilerInstance) {
        const compiler = new ClientStateCompiler();
        compiler.id = instance.compilerId;
        compiler.options = instance.options;
        compiler.filters = instance.filters;
        // TODO: libs and tools
        this.compilers.push(compiler);
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

    async toInstances(): Promise<CompilerInstance[]> {
        // TODO: I am not sure where to place the source code
        let instances: CompilerInstance[] = [];
        for (const session of this.sessions) {
            for (const compiler of session.compilers) {
                const instance = new CompilerInstance();
                instance.compilerId = compiler.id;
                instance.options = compiler.options;

                instance.filters = new Filter();
                Object.assign(instance.filters, compiler.filters);
            }
        }
        return instances;
    }
}