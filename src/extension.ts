import * as vscode from 'vscode';
import { register } from './view/register';

export function activate(context: vscode.ExtensionContext) {
	register(context);
}

export function deactivate() { }
