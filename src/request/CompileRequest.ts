import { ReadSource, ReadCMakeSource } from './Utility';
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

    static from(instance: CompilerInstance) {
        let options = new CompileOptions();

        options.filters = instance.filters;
        options.userArguments = instance.options;

        if (instance.compilerInfo?.supportsExecute) {
            options.executeParameters = {
                args: instance.exec === "" ? [] : instance.exec.split(" "),
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
            const { cmakeSource, files } = await ReadCMakeSource(instance.src);
            request.source = cmakeSource;
            request.files = files;
        }

        request.compiler = instance.compilerInfo.id;
        request.options = CompileOptions.from(instance);

        return request;
    }
}

