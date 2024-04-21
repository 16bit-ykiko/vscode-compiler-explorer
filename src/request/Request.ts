import axios from "axios";

import { logger } from "./Logger";
import { retry } from "./Utility";
import { ClientState } from "./ClientState";
import { CompileRequest } from "./CompileRequest";
import { CompileResult, ExecuteResult } from "./CompileResult";
import { CompilerInstance, SingleFileInstance } from "../view/Instance";

export async function Compile(instance: CompilerInstance): Promise<{ compileResult: CompileResult, executeResult?: ExecuteResult }> {
    const request = await CompileRequest.from(instance);
    const headers = { 'Content-Type': 'application/json' };
    const url = "https://godbolt.org/api/compiler/" + instance.compilerInfo.id +
        (instance instanceof SingleFileInstance ? "/compile" : "/cmake");

    return retry("Compiling", async () => {
        logger.info(`Start Request for Compile from "${url}"`);
        const compileResult = await axios.post(url, JSON.stringify(request), { headers: headers });
        logger.info(`Request for Compile succeeded.`);

        if (instance.compilerInfo.supportsExecute && request.options?.filters?.execute) {

            // set for executor only request
            request.options.compilerOptions.skipAsm = true;
            request.options.compilerOptions.executorRequest = true;

            logger.info(`Start Request for Execute from "${url}"`);
            const executeResult = await axios.post(url, JSON.stringify(request), { headers: headers });
            logger.info(`Request for Execute succeeded.`);
            return { compileResult: compileResult.data, executeResult: executeResult.data };
        }

        return { compileResult: compileResult.data };
    });

}

export async function GetShortLink(instances: CompilerInstance[]): Promise<string> {
    const request = await ClientState.from(instances);
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    const url = 'https://godbolt.org/api/shortener';

    return retry("Get Short Link", async () => {
        logger.info(`Start Request for short link from "${url}"`);
        const response = await axios.post(url, JSON.stringify(request), { headers: headers });
        logger.info(`Request for short link succeeded, the url is: ${response.data.url}`);
        return response.data.url;
    });
}

export async function LoadShortLink(link: string): Promise<CompilerInstance[]> {
    const url = "https://godbolt.org/api/shortlinkinfo/" + link.split('/').pop();

    return retry("Loading ShortLink", async () => {
        logger.info(`Start Request for short link info from "${url}"`);
        const response = await axios.get(url);
        logger.info(`Request for short link info succeeded.`);
        const state = new ClientState();
        Object.assign(state, response.data);
        return state.toInstances();
    });
}








