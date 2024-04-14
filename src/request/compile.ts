
import axios from "axios";
import * as vscode from "vscode";
import { CompileResult, ExecuteResult } from "./CompileResult";
import { CompileRequest } from "./CompileRequest";
import { CompilerInstance } from "../view/Instance";
import { log } from "./Logger";

/**
 * get compile result from given instance
 * @param instance 
 * @returns compile result
 */
export async function Compile(instance: CompilerInstance): Promise<{ compileResult: CompileResult, executeResult?: ExecuteResult }> {
    const request = await CompileRequest.from(instance);
    const url = "https://godbolt.org/api/compiler/" + instance.compilerInfo?.id + "/compile";
    const headers = {
        'Content-Type': 'application/json'
    };

    try {
        const compileResult = await axios.post(url, JSON.stringify(request), { headers: headers });
        log(`Compile Request: ${instance.compilerInfo?.name}`);
        if (request.options?.filters?.execute) {
            request.options.compilerOptions = { executorRequest: true, skipAsm: true };
            const executeResult = await axios.post(url, JSON.stringify(request), { headers: headers });
            return { compileResult: compileResult.data, executeResult: executeResult.data };
        }
        return { compileResult: compileResult.data };

    }
    catch (e) {
        console.error(e);
        throw e;
    }
}



