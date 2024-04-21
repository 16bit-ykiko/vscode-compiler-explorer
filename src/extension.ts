import * as vscode from 'vscode';

import { logger } from './request/Logger';
import { register } from './view/Command';
import { SetProxy } from './request/Utility';

export function activate(context: vscode.ExtensionContext) {
	SetProxy();
	register(context);
	context.subscriptions.push(logger);
}

export function deactivate() { }
