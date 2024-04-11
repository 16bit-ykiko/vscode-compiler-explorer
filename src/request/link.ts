import axios from "axios";
import { CompilerInstance } from "../view/instance";
import { readSource } from "./compile";

export class ClientStateCompilerOptions {
    binary = false;
    binaryObject = false;
    commentOnly = true;
    demangle = true;
    directives = true;
    execute = false;
    intel = true;
    labels = true;
    libraryCode = false;
    trim = false;
    debugCalls = false;
}

export class ClientStateCompiler {
    _internalid: any = undefined;
    id = '';
    options = '';
    filters: ClientStateCompilerOptions = new ClientStateCompilerOptions();
    libs: any[] = [];
    specialoutputs: any[] = [];
    tools: any[] = [];
}

export class ClientStateExecutor {
    compilerVisible = false;
    compilerOutputVisible = false;
    arguments: any[] = [];
    argumentsVisible = false;
    stdin = '';
    stdinVisible = false;
    compiler: ClientStateCompiler = new ClientStateCompiler();
    wrap?: boolean;

}

export class MultifileFile {
    id: any = undefined;
    fileId = 0;
    isIncluded = false;
    isOpen = false;
    isMainSource = false;
    filename: string | undefined = '';
    content = '';
    editorId = -1;
    langId = 'c++';
}

export class ClientStateTree {
    id = 1;
    cmakeArgs = '';
    customOutputFilename = '';
    isCMakeProject = false;
    compilerLanguageId = 'c++';
    files: MultifileFile[] = [];
    newFileId = 1;
    compilers: ClientStateCompiler[] = [];
    executors: ClientStateExecutor[] = [];
}

export class ClientStateSession {
    id: number | false = false;
    language = '';
    source = '';
    compilers: ClientStateCompiler[] = [];
    executors: ClientStateExecutor[] = [];
    filename?: string = undefined;
}

export class Session {
    id: number | false = false;
    language = 'c++';
    source = '';
    compilers: ClientStateCompiler[] = [];
    executors: ClientStateExecutor[] = [];
    filename?: string = undefined;

    addCompiler(instance: CompilerInstance) {
        const compiler = new ClientStateCompiler();
        compiler.id = instance.compilerId;
        compiler.options = instance.options;
        compiler.filters = instance.fitter;
        this.compilers.push(compiler);
    }

    static async from(instance: CompilerInstance) {
        const session = new Session();
        session.source = await readSource(instance.inputFile);
        session.addCompiler(instance);
        return session;
    }
}

export class ClientState {
    sessions: Session[] = [];
    trees?: ClientStateTree[] = [];

    static async from(instances: CompilerInstance[]) {
        const clientState = new ClientState();
        let filesCache = new Map<string, number>();
        for (const instance of instances) {
            const index = filesCache.get(instance.inputFile);
            if (index === undefined) {
                filesCache.set(instance.inputFile, clientState.sessions.length);
                clientState.sessions.push(await Session.from(instance));
            }
            else {
                clientState.sessions[index].addCompiler(instance);
            }
        }
        return clientState;
    }
}

export async function GetShortLink(input: CompilerInstance[]): Promise<string> {
    const request = await ClientState.from(input);
    const response = await axios.post('https://godbolt.org/api/shortener', JSON.stringify(request));
    return response.data.url;
}

export async function LoadShortLink(url: string): Promise<CompilerInstance[]> {
    const response = await axios.get("https://godbolt.org/api/shortlinkinfo/" + url.split('/').pop());
    return response.data;
}





