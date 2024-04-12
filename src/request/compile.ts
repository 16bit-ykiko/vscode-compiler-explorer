
import axios from "axios";
import { CompileResult } from "./CompileResult";
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

export async function Compile(instance: CompilerInstance): Promise<CompileResult> {
    const request = await CompileRequest.from(instance);
    const url = "https://godbolt.org/api/compiler/" + instance.compilerId + "/compile";
    const headers = {
        'Content-Type': 'application/json; charset=utf-8'
    };
    const response = await axios.post(url, JSON.stringify(request), { headers: headers });
    return response.data;
}

