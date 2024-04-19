import axios from "axios";
import * as vscode from "vscode";

import { logger } from "./Logger";
import { ClientState } from "./ClientState";
import { CompileRequest } from "./CompileRequest";
import { CompilerInstance, SingleFileInstance, MultiFileInstance } from "../view/Instance";
import { CompileResult, ExecuteResult } from "./CompileResult";


export async function retry<T>(messgae: string, fn: () => Promise<T>, maxTries: number = 5): Promise<T> {
    let tries = 0;
    while (true) {
        try {
            return await fn();
        } catch (error) {
            if (tries !== maxTries) {
                logger.info(`Request failed, retrying for the ${tries + 1} time.`);
                tries += 1;
            } else {
                logger.error(`Request failed for ${messgae}, after ${tries} tries, error: ${error}`);
                vscode.window.showErrorMessage(`Request failed for ${messgae}, after ${tries} tries, check output channel for more details.`);
                throw error;
            }
        }
    }
}

export async function Compile(instance: CompilerInstance): Promise<{ compileResult: CompileResult, executeResult?: ExecuteResult }> {
    const request = await CompileRequest.from(instance);
    const url = "https://godbolt.org/api/compiler/" + instance.compilerInfo?.id + (instance instanceof SingleFileInstance ? "/compile" : "/cmake");
    const headers = {
        'Content-Type': 'application/json'
    };

    return retry("Compiling", async () => {
        logger.info(`Start Request for Compile from ${url}`);
        const compileResult = await axios.post(url, JSON.stringify(request), { headers: headers });
        logger.info(`Request for Compile succeeded.`);

        if (instance.compilerInfo?.supportsExecute && request.options?.filters?.execute) {

            // set for executor only request
            request.options.compilerOptions.executorRequest = true;
            request.options.compilerOptions.skipAsm = true;

            logger.info(`Start Request for Execute from ${url}`);
            const executeResult = await axios.post(url, JSON.stringify(request), { headers: headers });
            logger.info(`Request for Execute succeeded.`);
            return { compileResult: compileResult.data, executeResult: executeResult.data };
        }

        return { compileResult: compileResult.data };
    });

}

export async function GetShortLink(input: CompilerInstance[]): Promise<string> {
    const request = await ClientState.from(input);
    const url = 'https://godbolt.org/api/shortener';
    const headers = {
        'Content-Type': 'application/json; charset=utf-8'
    };

    return retry("Get Short Link", async () => {
        logger.info(`Start Request for ShortLink from ${url}`);
        const response = await axios.post(url, JSON.stringify(request), { headers: headers });
        logger.info(`Request for ShortLink succeeded.`);
        return response.data.url;
    });
}

export async function LoadShortLink(url: string): Promise<CompilerInstance[]> {
    return retry("Loading ShortLink", async () => {
        logger.info(`Start Request for ShortLinkInfo from ${url}`);
        const response = await axios.get("https://godbolt.org/api/shortlinkinfo/" + url.split('/').pop());
        logger.info(`Request for ShortLinkInfo succeeded.`);
        return ClientState.toInstances(response.data);
    });
}








