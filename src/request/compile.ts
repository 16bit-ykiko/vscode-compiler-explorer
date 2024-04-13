
import axios from "axios";
import { CompileResult, ExecuteResult } from "./CompileResult";
import { CompileRequest } from "./CompileRequest";
import { CompilerInstance } from "../view/instance";

let compilers = new Map<string, string>();

export async function GetCompilers() {
    if (compilers.size === 0) {
        const response = await axios.get('https://godbolt.org/api/compilers/c++?fields=id,name');
        for (const compiler of response.data) {
            compilers.set(compiler.name, compiler.id);
        }
    }
    return compilers;
}

/**
 * get compile result from given instance
 * @param instance 
 * @returns compile result
 */
export async function Compile(instance: CompilerInstance): Promise<{ compileResult: CompileResult, executeResult?: ExecuteResult }> {
    const request = await CompileRequest.from(instance);
    const url = "https://godbolt.org/api/compiler/" + instance.compilerId + "/compile";
    const headers = {
        'Content-Type': 'application/json; charset=utf-8'
    };

    const compileResult = await axios.post(url, JSON.stringify(request), { headers: headers });
    if (request.options?.filters?.execute) {
        request.options.compilerOptions = { executorRequest: true, skipAsm: true };
        const executeResult = await axios.post(url, JSON.stringify(request), { headers: headers });
        return { compileResult: compileResult.data, executeResult: executeResult.data };
    }
    return { compileResult: compileResult.data };
}



