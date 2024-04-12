import axios from "axios";
import { ClientState } from "./ClientState";
import { CompilerInstance } from "../view/instance";

export async function GetShortLink(input: CompilerInstance[]): Promise<string> {
    const request = await ClientState.from(input);
    console.log(request);
    const headers = {
        'Content-Type': 'application/json; charset=utf-8'
    };
    const response = await axios.post('https://godbolt.org/api/shortener', JSON.stringify(request), { headers: headers });
    return response.data.url;
}

export async function LoadShortLink(url: string): Promise<CompilerInstance[]> {
    const response = await axios.get("https://godbolt.org/api/shortlinkinfo/" + url.split('/').pop());
    return (response.data as ClientState).toInstances();
}





