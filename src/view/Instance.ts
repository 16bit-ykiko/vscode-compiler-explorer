import { Config } from "../request/Config";
import { CompilerInfo } from "../request/CompilerInfo";
import { QueryCompilerInfo } from "../request/CompilerInfo";

export class Filter {
    /** Compile to binary object and show the binary code */
    binaryObject? = false;
    /** Link to binary and show the binary code */
    binary? = false;
    /** Execute the code and show the output */
    execute? = false;
    /** Use Intel assembly syntax */
    intel? = true;
    /** Demangle the symbols */
    demangle? = true;
    /** Remove unused labels in the assembly */
    labels? = true;
    /** Remove functions from other libraries in the assembly */
    libraryCode? = true;
    /** Remove all assembler directives in the assembly */
    directives? = true;
    /** Remove comment only lines in the assembly */
    commentOnly? = true;
    /** Remove whitespace within each line of assembly code */
    trim? = false;

    debugCalls? = false;

    constructor() {
        Object.assign(this, Config.defaultOptions().filters);
    }

    copy() {
        const filters = new Filter();
        Object.assign(filters, this);
        return filters;
    }
}

export class Library {
    // TODO: add library support
};

export class Tool {
    // TODO: add tool support
};

export class CompilerInstance {
    exec: string = "";
    stdin: string = "";
    options: string = "";
    output: string = "webview";
    filters: Filter = new Filter();
    compilerInfo: CompilerInfo = new CompilerInfo();

    static async create() {
        const result = new CompilerInstance();
        const config = Config.defaultOptions();
        result.compilerInfo = await QueryCompilerInfo(config.compiler);

        result.options = config.options;
        result.exec = config.exec;
        result.stdin = config.stdin;
        result.filters = new Filter();
        return result;
    }

    copy() {
        let result = new CompilerInstance();
        Object.assign(result, this);
        result.filters = this.filters.copy();
        return result;
    }
}

export class SingleFileInstance extends CompilerInstance {
    input: string = "active";

    static async create() {
        const result = new SingleFileInstance();
        Object.assign(result, await CompilerInstance.create());
        return result;
    }

    copy() {
        const result = new SingleFileInstance();
        Object.assign(result, this);
        result.filters = this.filters.copy();
        return result;
    }
}

export class MultiFileInstance extends CompilerInstance {
    src: string = "workplace";
    cmakeArgs: string = "";

    static async create() {
        const result = new MultiFileInstance();
        Object.assign(result, await CompilerInstance.create());
        return result;
    }

    copy() {
        const result = new MultiFileInstance();
        Object.assign(result, this);
        result.filters = this.filters.copy();
        return result;
    }
}