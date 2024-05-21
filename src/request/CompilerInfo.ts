import * as vscode from "vscode";
import axios from "axios";

import { retry } from "./Utility";
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

const compilerInfos = new Map<string, CompilerInfo>();
const idToName = new Map<string, string>();

export async function GetCompilerInfos() {
    if (compilerInfos.size === 0) {
        const fieldNames = Object.keys(new CompilerInfo()).join(",");
        const url = "https://godbolt.org/api/compilers/c++?fields=" + fieldNames;
        const proxy = vscode.workspace.getConfiguration().get('http.proxy');
        let axiosConfig = {};
        if (proxy) {
            const proxyParts = proxy.split('@');
            if (proxyParts.length === 2) {
                const [auth, proxyHost] = proxyParts;
                const [username, password] = auth.split(':');
                const [protocol, host] = proxyHost.split('://');
                axiosConfig = {
                    proxy: {
                        protocol,
                        host,
                        port: parseInt(host.split(':')[1] || '80'),
                        auth: {
                            username,
                            password,
                        },
                    },
                };
            } else {
                const [protocol, host] = proxy.split('://');
                axiosConfig = {
                    proxy: {
                        protocol,
                        host,
                        port: parseInt(host.split(':')[1] || '80'),
                    },
                };
            }
        }

        await retry("CompilerInfo", async () => {
            logger.info(`Request for CompilerInfo from ${url}`);
            const response = await axios.get(url, axiosConfig);
            const infos = response.data as CompilerInfo[];
            infos.forEach((info) => {
                compilerInfos.set(info.name, info);
                idToName.set(info.id, info.name);
            });
        });
    }
    return compilerInfos;
}

export async function QueryCompilerInfo(name: string) {
    const infos = await GetCompilerInfos();
    if (infos.has(name)) {
        return infos.get(name)!;
    } else if (idToName.has(name)) {
        return infos.get(idToName.get(name)!)!;
    } else {
        throw Error("Unexcepted internal error: CompilerInfo not found, Please report this issue.");
    }
}
