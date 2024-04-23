import * as vscode from 'vscode';

import { logger, initLogger } from './request/Logger';
import { register } from './view/Command';
import { SetProxy } from './request/Utility';
import { ClearWebview } from './view/WebView';

export function activate(context: vscode.ExtensionContext) {
	initLogger();
	SetProxy();
	register(context);
	context.subscriptions.push(logger);
}

export function deactivate() {
	ClearWebview();
}
