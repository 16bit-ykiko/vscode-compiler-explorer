import * as vscode from "vscode";
import { CompilerInfo } from "../request/CompilerInfo";
import { compilerConfig } from "../request/Setting";
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
        Object.assign(this, compilerConfig.filters);
    }

    copy(): Filter {
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

/**
 * Represents a compiler instance
 */
export class CompilerInstance {
    compilerInfo?: CompilerInfo;
    /** Input file, default is the active editor */
    inputFile: string = "active";
    /** Output file, default is webview */
    outputFile: string = "webview";
    /** Compile options, default is empty */
    options: string = "";
    /** Execute arguments, default is empty */
    exec: string = "";
    /** Standard input, default is empty */
    stdin: string = "";
    filters: Filter = new Filter();

    static async create() {
        const result = new CompilerInstance();
        const config = compilerConfig;
        result.compilerInfo = await QueryCompilerInfo(config.compiler);
        result.options = config.options;
        result.exec = config.exec;
        result.stdin = config.stdin;
        result.filters = new Filter();
        return result;
    }

    copy(): CompilerInstance {
        let result = new CompilerInstance();
        Object.assign(result, this);
        result.filters = this.filters.copy();
        return result;
    }
}