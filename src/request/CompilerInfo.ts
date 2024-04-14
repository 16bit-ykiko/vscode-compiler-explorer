import axios from "axios";

import { retry } from "./Request";
import { logger } from "./Logger";

export class CompilerInfo {
    id: string = "";
    name: string = "";
    supportsDemangle?: boolean;
    supportsBinary?: boolean;
    supportsBinaryObject?: boolean;
    supportsIntel?: boolean;
    supportsExecute?: boolean;
    supportsLibraryCodeFilter?: boolean;
}

const compilerInfos = (async () => {
    const result = new Map<string, CompilerInfo>();
    const fieldNames = Object.keys(new CompilerInfo()).join(',');
    const url = 'https://godbolt.org/api/compilers/c++?fields=' + fieldNames;

    return retry("CompilerInfo", async () => {
        logger.info(`Start Request for CompilerInfo from ${url}`);
        const response = await axios.get(url);
        logger.info(`Request for CompilerInfo succeeded.`);
        const infos = response.data as CompilerInfo[];
        infos.forEach(info => { result.set(info.name!, info); });
        return result;
    });
})();

export async function GetCompilerInfos() {
    return compilerInfos;
}

export async function QueryCompilerInfo(name: string) {
    return (await compilerInfos).get(name)!;
}