import { ReadSource, ReadText, ReadCMakeSource, SplitCommandArgs } from "./Utility";
import { CompilerInstance, SingleFileInstance, MultiFileInstance, Filter, Tool, Library } from "../view/Instance";

export class ExecuteParameter {
    args?: string[];
    stdin?: string;
}

export class CompilerOption {
    skipAsm?: boolean;
    cmakeArgs?: string;
    executorRequest?: boolean;
    customOutputFilename?: string;
}

export class CompileOptions {
    tools?: Tool[];
    filters: Filter = new Filter();
    libraries?: Library[];
    userArguments?: string;
    executeParameters?: ExecuteParameter;
    compilerOptions: CompilerOption = new CompilerOption();

    static async from(instance: CompilerInstance) {
        let result = new CompileOptions();
        const { filters, options, exec, stdin } = instance;
        result.filters = filters.copy();
        result.filters.execute = false;
        result.userArguments = await ReadText(options);

        if (filters.skipASM) {
            result.compilerOptions.skipAsm = true;
        }

        if (instance.compilerInfo.supportsExecute) {
            result.executeParameters = {
                args: SplitCommandArgs(await ReadText(exec)),
                stdin: await ReadText(stdin),
            };
        }

        if (instance instanceof MultiFileInstance) {
            result.compilerOptions.cmakeArgs = await ReadText(instance.cmakeArgs);
            result.compilerOptions.customOutputFilename = "main";
        }

        return result;
    }

    fitExecute() {
        this.filters.execute = true;
        this.compilerOptions.skipAsm = true;
        this.compilerOptions.executorRequest = true;
    }
}

export class CompileRequest {
    constructor(
        public lang: string,
        public source: string,
        public compiler: string,
        public bypassCache: number,
        public options: CompileOptions,
        public allowStoreCodeDebug: number,
        public files: { filename: string; contents: string }[]
    ) {}

    static async from(instance: CompilerInstance) {
        const compiler = instance.compilerInfo.id;
        const options = await CompileOptions.from(instance);

        if (instance instanceof SingleFileInstance) {
            const source = await ReadSource(instance.input);
            return new CompileRequest("c++", source, compiler, 0, options, 0, []);
        } else if (instance instanceof MultiFileInstance) {
            const { cmakeSource, files } = await ReadCMakeSource(instance.src);
            return new CompileRequest("c++", cmakeSource, compiler, 0, options, 0, files);
        }

        throw Error("Unknown instance type");
    }
}
