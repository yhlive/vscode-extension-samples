import * as vscode from 'vscode';
import { subscribeToDocumentChanges } from './diagnostics';

export function activate(context: vscode.ExtensionContext) {
	const collection = vscode.languages.createDiagnosticCollection('release-checklist');
	context.subscriptions.push(collection);
	subscribeToDocumentChanges(context, collection);
}
