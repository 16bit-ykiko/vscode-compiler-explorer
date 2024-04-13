import * as vscode from 'vscode';
import { register } from './view/register';
import { AxiosInit } from './request/init';

export function activate(context: vscode.ExtensionContext) {
	AxiosInit();
	register(context);
}

export function deactivate() { }
