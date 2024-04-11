export class Fitter {
    binaryObject = false;
    binary = false;
    execute = false;
    intel = true;
    demangle = true;
    labels = true;
    libraryCode = true;
    directives = true;
    commentOnly = true;
    trim = false;
    debugCalls = false;

    copy(): Fitter {
        const fitter = new Fitter();
        Object.assign(fitter, this);
        return fitter;
    }
}

export class CompilerInstance {
    compiler: string = "x86-64 gcc 13.2";
    compilerId: string = "g132";
    inputFile: string = "active";
    outputFile: string = "webview";
    options: string = "";
    exec: string = "";
    stdin: string = "";
    fitter: Fitter = new Fitter();

    copy(): CompilerInstance {
        let result = new CompilerInstance();
        Object.assign(result, this);
        result.fitter = this.fitter.copy();
        return result;
    }
}