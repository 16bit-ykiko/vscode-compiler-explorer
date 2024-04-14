import axios from "axios";

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

export async function GetCompilerInfos() {
    return compilerInfos;
}

export async function QueryCompilerInfo(name: string) {
    return (await compilerInfos).get(name)!;
}