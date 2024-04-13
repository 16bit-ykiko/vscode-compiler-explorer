import axios from 'axios';
import * as vscode from 'vscode';

export function AxiosInit() {
  // Retrieves the proxy configuration from the VS Code settings.
	const proxyConfig = (() => {
		const vscodeProxy = vscode.workspace.getConfiguration('http').get('proxy');
		if (typeof vscodeProxy !== 'string') {
			return undefined;
		}
		const url = new URL(vscodeProxy);
		return {
			host: url.hostname,
			port: parseInt(url.port),
			protocol: url.protocol,
		};
	}) ();

  if (proxyConfig) {
    axios.defaults.proxy = proxyConfig;
  }
}
