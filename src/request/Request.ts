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

    return retry("Compiling", async () => {
        logger.info(`Request for Compile from "${url}"`);
        const compileResult = await axios.post(url, JSON.stringify(request), { headers: headers });

        if (instance.compilerInfo.supportsExecute && instance.filters.execute) {
            request.options.fitExecute();

            logger.info(`Request for Execute from "${url}"`);
            const executeResult = await axios.post(url, JSON.stringify(request), { headers: headers });
            return { compileResult: compileResult.data, executeResult: executeResult.data };
        }

        return { compileResult: compileResult.data };
    });
}

export async function GetShortLink(instances: CompilerInstance[]): Promise<string> {
    const request = await ClientState.from(instances);
    const headers = { "Content-Type": "application/json; charset=utf-8" };
    const url = "https://godbolt.org/api/shortener";

    return retry("Get Short Link", async () => {
        logger.info(`Request for short link from "${url}"`);
        const response = await axios.post(url, JSON.stringify(request), { headers: headers });
        return response.data.url;
    });
}

export async function LoadShortLink(link: string): Promise<CompilerInstance[]> {
    const url = "https://godbolt.org/api/shortlinkinfo/" + link.split("/").pop();

    return retry("Loading ShortLink", async () => {
        logger.info(`Request for short link info from "${url}"`);
        const response = await axios.get(url);
        const state = new ClientState();
        Object.assign(state, response.data);
        return state.toInstances();
    });
}
