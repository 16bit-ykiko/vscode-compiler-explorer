import * as vscode from "vscode";
import axios from "axios";

import { logger } from "./Logger";
import { retry } from "./Utility";
import { Response } from "./CompileResult";
import { ClientState } from "./ClientState";
import { CompileRequest } from "./CompileRequest";
import { CompilerInstance, SingleFileInstance } from "../view/Instance";

export async function Compile(instance: CompilerInstance): Promise<Response> {
    const request = await CompileRequest.from(instance);
    const headers = { "Content-Type": "application/json; charset=utf-8" };
    const suffix = instance instanceof SingleFileInstance ? "/compile" : "/cmake";
    const url = `https://godbolt.org/api/compiler/${instance.compilerInfo.id}${suffix}`;
    const proxy = vscode.workspace.getConfiguration().get('http.proxy');
    let axiosConfig = { headers: headers };

    if (proxy) {
        const proxyParts = proxy.split('@');
        if (proxyParts.length === 2) {
            const [auth, proxyHost] = proxyParts;
            const [username, password] = auth.split(':');
            const [protocol, host] = proxyHost.split('://');

            axiosConfig = {
                headers: headers,
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
                headers: headers,
                proxy: {
                    protocol,
                    host,
                    port: parseInt(host.split(':')[1] || '80'),
                },
            };
        }
    }

    return retry("Compiling", async () => {
        logger.info(`Request for Compile from "${url}"`);
        const compileResult = await axios.post(url, JSON.stringify(request), axiosConfig);

        if (instance.compilerInfo.supportsExecute && instance.filters.execute) {
            request.options.fitExecute();

            logger.info(`Request for Execute from "${url}"`);
            const executeResult = await axios.post(url, JSON.stringify(request), axiosConfig);
            return { compileResult: compileResult.data, executeResult: executeResult.data };
        }

        return { compileResult: compileResult.data };
    });
}

export async function GetShortLink(instances: CompilerInstance[]): Promise<string> {
    const request = await ClientState.from(instances);
    const headers = { "Content-Type": "application/json; charset=utf-8" };
    const url = "https://godbolt.org/api/shortener";
    const proxy = vscode.workspace.getConfiguration().get('http.proxy');
    let axiosConfig = { headers: headers };
    if (proxy) {
        const proxyParts = proxy.split('@');
        if (proxyParts.length === 2) {
            const [auth, proxyHost] = proxyParts;
            const [username, password] = auth.split(':');
            const [protocol, host] = proxyHost.split('://');
            axiosConfig = {
                headers: headers,
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
                headers: headers,
                proxy: {
                    protocol,
                    host,
                    port: parseInt(host.split(':')[1] || '80'),
                },
            };
        }
    }

    return retry("Get Short Link", async () => {
        logger.info(`Request for short link from "${url}"`);
        const response = await axios.post(url, JSON.stringify(request), axiosConfig);
        return response.data.url;
    });
}

export async function LoadShortLink(link: string): Promise<CompilerInstance[]> {
    const url = "https://godbolt.org/api/shortlinkinfo/" + link.split("/").pop();

    return retry("Loading ShortLink", async () => {
        logger.info(`Request for short link info from "${url}"`);
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
        const response = await axios.get(url, axiosConfig);
        const state = new ClientState();
        Object.assign(state, response.data);
        return state.toInstances();
    });
}
