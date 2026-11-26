import * as vscode from 'vscode';
import { ReleaseQuickFix } from './releaseQuickFix';
import { ReleaseSidebar } from './releaseSidebar';
import { ReleaseDiagnostics } from './diagnostics';
import { registerWrokspaceScan } from './workspaceScan';

export function activate(context: vscode.ExtensionContext) {
	const diagnostics = new ReleaseDiagnostics();
	context.subscriptions.push(diagnostics, registerWrokspaceScan(diagnostics));
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
	// subscribeToDocumentChanges(context, collection);
	const sidebar = new ReleaseSidebar();
	context.subscriptions.push(
		sidebar,
		vscode.window.registerTreeDataProvider('release-checklist', sidebar)
	);
}
