import axios from "axios";
import { CompilerInfo } from "./CompilerInfo";
import { CompileRequest } from "./CompileRequest";
import { CompilerInstance } from "../view/instance";
import { CompileResult, ExecuteResult } from "./CompileResult";

const compilerInfos = (async () => {
    const result = new Map<string, CompilerInfo>();
    const fieldNames = Object.keys(new CompilerInfo()).join(',');
    try {
        const url = 'https://godbolt.org/api/compilers/c++?fields=' + fieldNames;
        const response = await axios.get(url);
        const infos = response.data as CompilerInfo[];
        infos.forEach(info => { result.set(info.name!, info); });
        return result;
    }
    catch (e) {
        // TODO:
        throw e;
    }
})();

export async function QueryCompilerInfo(name: string) {
    return (await compilerInfos).get(name);
}

