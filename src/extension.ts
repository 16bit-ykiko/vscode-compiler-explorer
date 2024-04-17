import * as vscode from 'vscode';

import { logger } from './request/Logger';
import { register } from './view/Command';
import { SetProxy } from './request/Setting';
import { InitCompilerInfo } from './request/CompilerInfo';

export function activate(context: vscode.ExtensionContext) {
	SetProxy();
	InitCompilerInfo()
		.then(() => register(context));
	context.subscriptions.push(logger);
}

export function deactivate() { }
