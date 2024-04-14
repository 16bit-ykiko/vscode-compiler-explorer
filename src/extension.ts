import * as vscode from 'vscode';
import { register } from './view/command';
import { AxiosInit } from './request/init';
import { initLogger,log } from './request/Logger';

export function activate(context: vscode.ExtensionContext) {
	initLogger(context);
	AxiosInit();
	register(context);
	log("Compiler Explorer is now active!");
}

export function deactivate() { }
