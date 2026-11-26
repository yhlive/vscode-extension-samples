import * as vscode from 'vscode';
import { ReleaseQuickFix } from './releaseQuickFix';
import { subscribeToDocumentChanges } from './diagnostics';

export function activate(context: vscode.ExtensionContext) {
	const collection = vscode.languages.createDiagnosticCollection('release-checklist');
	context.subscriptions.push(collection);
	const provider = new ReleaseQuickFix();
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(
			{
				language: 'markdown'
			},
			provider,
			{
				providedCodeActionKinds: [ReleaseQuickFix.kind]
			}
		)
	);
	subscribeToDocumentChanges(context, collection);
}
