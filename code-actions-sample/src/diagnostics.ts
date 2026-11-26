import * as vscode from 'vscode';
import { scanReleaseNotes } from './releaseRules';


export const releaseSource = 'Release Checklist';
export function isChangelog(document: vscode.TextDocument): boolean {
	return document.languageId === 'markdown' &&
		/(?:^|\/)CHANGELOG\.md$/i.test(document.uri.path);
}

export function subscribeToDocumentChanges(context: vscode.ExtensionContext, collection: vscode.DiagnosticCollection): void {
	function refresh(document: vscode.TextDocument): void {
		if (!isChangelog(document)) {
			collection.delete(document.uri);
			return;
		}
		const diagnostics = scanReleaseNotes(document.getText()).map((issue) => {
			const diagnostic = new vscode.Diagnostic(
				document.lineAt(issue.line).range,
				issue.message,
				issue.warning ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error
			);
			diagnostic.code = issue.code;
			diagnostic.source = releaseSource;
			return diagnostic;
		});
		collection.set(document.uri, diagnostics);
	}

	vscode.workspace.textDocuments.forEach(refresh);
	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(refresh),
		vscode.workspace.onDidChangeTextDocument((event) => refresh(event.document)),
		vscode.workspace.onDidCloseTextDocument((document) => collection.delete(document.uri))
	);
}
