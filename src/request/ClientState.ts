import { QueryCompilerInfo } from "./CompilerInfo";
import { ReadSource, ReadText, ReadCMakeSource, WriteTemp, WriteTemps } from "./Utility";
import { CompilerInstance, SingleFileInstance, MultiFileInstance, Filter, Tool, Library } from "../view/Instance";

export class ClientStateCompiler {
    id = "";
    options = "";
    tools: Tool[] = [];
    libs: Library[] = [];
    filters?: Filter;
    specialoutputs: any[] = [];
    _internalid: any = undefined;
}

export class ClientStateExecutor {
    stdin = "";
    wrap?: boolean;
    arguments = "";
    stdinVisible = true;
    argumentsVisible = true;
    compilerVisible = true;
    compilerOutputVisible = true;
    compiler: ClientStateCompiler = new ClientStateCompiler();
}

export class ClientStateSession {
    source = "";
    filename = "";
    language = "c++";
    conformanceview = false;
    id: number | false = false;
    compilers: ClientStateCompiler[] = [];
    executors: ClientStateExecutor[] = [];

    static async from(id: number, instance: SingleFileInstance) {
        const session = new ClientStateSession();
        session.id = id;
        session.source = await ReadSource(instance.input);
        await pushc(session, instance);
        return session;
    }
}

export class MultifileFile {
    id: any = undefined;
    fileId = 0;
    content = "";
    editorId = -1;
    langId = "c++";
    isOpen = false;
    isIncluded = true;
    isMainSource = false;
    filename: string = "";
}

export class ClientStateTree {
    id = 1;
    cmakeArgs = "";
    newFileId = 1;
    isCMakeProject = true;
    customOutputFilename = "main";
    compilerLanguageId = "c++";
    files: MultifileFile[] = [];
    compilers: ClientStateCompiler[] = [];
    executors: ClientStateExecutor[] = [];

    static async from(editorId: number, instances: MultiFileInstance[]) {
        const session = new ClientStateSession();
        const tree = new ClientStateTree();

        const src = instances[0].src;
        for (const instance of instances) {
            if (instance.src !== src) {
                throw new Error("All CMake instances should have the same src");
            }
        }

        const { cmakeSource, files } = await ReadCMakeSource(src);
        session.source = cmakeSource;
        session.filename = "CMakeLists.txt";
        session.language = "cmake";
        session.id = editorId;

        const cmakeFile = new MultifileFile();
        cmakeFile.isOpen = true;
        cmakeFile.editorId = editorId;
        cmakeFile.isMainSource = true;
        cmakeFile.content = cmakeSource;
        cmakeFile.filename = "CMakeLists.txt";
        tree.files.push(cmakeFile);

        files.forEach((file) => {
            const multifile = new MultifileFile();
            multifile.fileId = tree.newFileId++;
            multifile.filename = file.filename;
            multifile.content = file.contents;
            tree.files.push(multifile);
        });

        for (const instance of instances) {
            pushc(tree, instance);
        }

        return { session, tree };
    }
}

export class ClientState {
    sessions: ClientStateSession[] = [];
    trees: ClientStateTree[] = [];

    static async from(instances: CompilerInstance[]) {
        const clientState = new ClientState();
        const filesCache = new Map<string, number>();

        internalId = 1;

        // FIXME:
        // Missing compilers for normal editors when tree editor is present.
        // See [issue 6380](https://github.com/compiler-explorer/compiler-explorer/issues/6380)

        for (const instance of instances) {
            if (instance instanceof SingleFileInstance) {
                if (filesCache.has(instance.input)) {
                    const index = filesCache.get(instance.input)!;
                    const session = clientState.sessions[index];
                    pushc(session, instance);
                } else {
                    const index = clientState.sessions.length;
                    const session = await ClientStateSession.from(index + 1, instance);
                    clientState.sessions.push(session);
                    filesCache.set(instance.input, index);
                }
            }
        }

        // FIXME:
        // Currently, the Compiler Explorer only supports a single TreeEditor instance, which might change in the future.
        // So, at the moment, we only consider the case that there is only one tree.

        const multis = instances.filter((instance) => instance instanceof MultiFileInstance);
        if (multis.length > 0) {
            const editorId = filesCache.size + 1;
            const { session, tree } = await ClientStateTree.from(editorId, multis as MultiFileInstance[]);
            clientState.sessions.push(session);
            clientState.trees.push(tree);
        }

        return clientState;
    }

    async toInstances() {
        let instances: CompilerInstance[] = [];
        for (const session of this.sessions) {
            if (session.language === "c++") {
                const toSingle = async (compiler: ClientStateCompiler) => {
                    const path = await WriteTemp(session.source);
                    const instance = await SingleFileInstance.create();
                    instance.input = path;
                    instance.compilerInfo = await QueryCompilerInfo(compiler.id);
                    instance.options = { value: compiler.options, isPath: false };
                    if (compiler.filters) {
                        instance.filters = Filter.fromJSON(compiler.filters);
                    }
                    return instance;
                };

                await process(instances, session, toSingle);
            }
        }

        // FIXME:
        // Currently, the Compiler Explorer only supports a single TreeEditor instance, which might change in the future.
        // So, at the moment, we only consider the case that there is only one tree.

        if (this.trees.length > 0) {
            const tree = this.trees[0];
            const path = await WriteTemps(tree.files);

            const toMulti = async (compiler: ClientStateCompiler) => {
                const instance = await MultiFileInstance.create();
                instance.src = path;
                instance.cmakeArgs = { value: tree.cmakeArgs, isPath: false };
                instance.options = { value: compiler.options, isPath: false };
                instance.compilerInfo = await QueryCompilerInfo(compiler.id);
                if (compiler.filters) {
                    instance.filters = Filter.fromJSON(compiler.filters);
                }
                return instance;
            };

            await process(instances, tree, toMulti);
        }
        return instances;
    }
}

type SessionLike = { compilers: ClientStateCompiler[]; executors: ClientStateExecutor[] };
type Callback = (_: ClientStateCompiler) => Promise<CompilerInstance>;

let internalId = 0;

async function pushc(session: SessionLike, instance: CompilerInstance) {
    const compiler = new ClientStateCompiler();
    const { compilerInfo, options, filters, exec, stdin } = instance;
    compiler.id = compilerInfo.id;
    compiler._internalid = internalId++;
    compiler.options = await ReadText(options);
    compiler.filters = filters.copy();
    session.compilers.push(compiler);

    const execText = await ReadText(exec);
    const stdinText = await ReadText(stdin);

    if (compilerInfo.supportsExecute && filters.execute && (execText !== "" || stdinText !== "")) {
        const executor = new ClientStateExecutor();
        executor.compiler = compiler;
        executor.stdin = stdinText;
        executor.arguments = execText;
        session.executors.push(executor);
    }

    // TODO: libs and tools
}

function merge(instance: CompilerInstance, executor: ClientStateExecutor[]) {
    const index = executor.findIndex((executor) => executor.compiler.id === instance.compilerInfo.id);
    if (index !== -1) {
        const exec = executor[index];
        instance.filters.execute = true;
        instance.stdin = { value: exec.stdin, isPath: false };
        instance.exec = { value: exec.arguments, isPath: false };
        executor.splice(index, 1);
    }
}

async function process(instances: CompilerInstance[], session: SessionLike, callback: Callback) {
    const { compilers, executors } = session;

    await Promise.all(
        compilers.map(async (compiler) => {
            const instance = await callback(compiler);
            merge(instance, executors);
            instances.push(instance);
        })
    );

    await Promise.all(
        executors.map(async (executor) => {
            const instance = await callback(executor.compiler);
            instance.filters.execute = true;
            instance.filters.skipASM = true;
            instance.stdin = { value: executor.stdin, isPath: false };
            instance.exec = { value: executor.arguments, isPath: false };
            instances.push(instance);
        })
    );
}
