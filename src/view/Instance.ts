import { Config } from "../request/Config";
import { CompilerInfo, QueryCompilerInfo } from "../request/CompilerInfo";

export class Filter {
    skipASM?: boolean = false;
    binaryObject = false;
    binary = false;
    execute = false;
    intel = false;
    demangle = false;
    labels = false;
    libraryCode = false;
    directives = false;
    commentOnly = false;
    trim = false;
    debugCalls = false;

    constructor() {
        const config = Config.defaultOptions().filters;
        Object.assign(this, config);
    }

    copy() {
        const filter = new Filter();
        Object.assign(filter, this);
        return filter;
    }
}
export interface Text {
    value: string;
    isPath: boolean;
}

export interface CompilerInstance {
    exec: Text;
    stdin: Text;
    options: Text;
    output: string;
    filters: Filter;
    compilerInfo: CompilerInfo;

    copy(): CompilerInstance;
}

export class SingleFileInstance implements CompilerInstance {
    constructor(
        public exec: Text,
        public stdin: Text,
        public options: Text,
        public output: string,
        public filters: Filter,
        public compilerInfo: CompilerInfo,
        public input: string
    ) {}

    static async create() {
        const config = Config.defaultOptions();
        return new SingleFileInstance(
            { value: config.stdin, isPath: false },
            { value: config.exec, isPath: false },
            { value: config.options, isPath: false },
            config.output,
            new Filter(),
            await QueryCompilerInfo(config.compiler),
            config.input
        );
    }

    copy() {
        return new SingleFileInstance(
            { ...this.stdin },
            { ...this.exec },
            { ...this.options },
            this.output,
            this.filters.copy(),
            this.compilerInfo,
            this.input
        );
    }
}

export class MultiFileInstance implements CompilerInstance {
    constructor(
        public exec: Text,
        public stdin: Text,
        public options: Text,
        public output: string,
        public filters: Filter,
        public compilerInfo: CompilerInfo,
        public cmakeArgs: Text,
        public src: string
    ) {}

    static async create() {
        const config = Config.defaultOptions();
        return new MultiFileInstance(
            { value: config.stdin, isPath: false },
            { value: config.exec, isPath: false },
            { value: config.options, isPath: false },
            config.output,
            new Filter(),
            await QueryCompilerInfo(config.compiler),
            { value: config.cmakeArgs, isPath: false },
            config.src
        );
    }

    copy() {
        return new MultiFileInstance(
            { ...this.stdin },
            { ...this.exec },
            { ...this.options },
            this.output,
            this.filters.copy(),
            this.compilerInfo,
            { ...this.cmakeArgs },
            this.src
        );
    }
}

export class Library {
    // TODO: add library support
}

export class Tool {
    // TODO: add tool support
}
