import * as vscode from 'vscode';
import { register } from './view/Command';
import { AxiosInit } from './request/Init';
import { initLogger,log } from './request/Logger';

export function activate(context: vscode.ExtensionContext) {
	initLogger(context);
	AxiosInit();
	register(context);
	log("Compiler Explorer is now active!");
}

export function deactivate() { }
