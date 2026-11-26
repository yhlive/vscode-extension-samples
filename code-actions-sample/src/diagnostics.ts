import * as vscode from 'vscode';
import { scanReleaseNotes } from './releaseRules';


export const releaseSource = 'Release Checklist';
export function isChangelog(document: vscode.TextDocument): boolean {
	return document.languageId === 'markdown' &&
		/(?:^|\/)CHANGELOG\.md$/i.test(document.uri.path);
}

export interface ScanEntry {
	uri: vscode.Uri;
	diagnostics: readonly vscode.Diagnostic[];
}

export function diagnosticsForText(text: string): vscode.Diagnostic[] {
	const lines = text.split(/\r?\n/);
	return scanReleaseNotes(text).map((issue) => {
		const diagnostic = new vscode.Diagnostic(
			new vscode.Range(issue.line, 0, issue.line, lines[issue.line].length),
			issue.message,
			issue.warning ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error
		);
		diagnostic.code = issue.code;
		diagnostic.source = releaseSource;
		return diagnostic;
	});
}

export class ReleaseDiagnostics implements vscode.Disposable {
	private readonly collection = vscode.languages.createDiagnosticCollection('release-checklist');
	private snapshots = new Map<string, ScanEntry>();
	private readonly subscription: vscode.Disposable[];
	constructor() {
		this.subscription = [
			vscode.workspace.onDidOpenTextDocument((document) => this.refresh(document)),
			vscode.workspace.onDidChangeTextDocument((event) => this.refresh(event.document)),
			vscode.workspace.onDidCloseTextDocument((document) => this.collection.delete(document.uri)),
		];
		vscode.workspace.textDocuments.forEach((document) => this.refresh(document));
	}

	replaceWorkspaceScan(entries: readonly ScanEntry[]): void {
		const open = new Map(vscode.workspace.textDocuments
			.filter(isChangelog)
			.map((document) => [document.uri.toString(), document]));
		const previous = this.snapshots;
		this.snapshots = new Map(entries.map((entry) => [entry.uri.toString(), entry]));
		for (const [key, entry] of previous) {
			if (!this.snapshots.has(key) && !open.has(key)) {
				this.collection.delete(entry.uri);
			}
		}
		for (const [key, entry] of this.snapshots) {
			const document = open.get(key);
			if (document) {
				this.refresh(document);
			} else {
				this.collection.set(entry.uri, entry.diagnostics);
			}
		}
	}

	dispose(): void {
		this.subscription.forEach((disposable) => disposable.dispose());
		this.collection.dispose();
	}

	private refresh(document: vscode.TextDocument): void {
		if (isChangelog(document)) {
			this.collection.set(document.uri, diagnosticsForText(document.getText()));
		}
	}

	private onSave(document: vscode.TextDocument): void {
		const key = document.uri.toString();
		if (isChangelog(document) && this.snapshots.has(key)) {
			const diagnostics = diagnosticsForText(document.getText());
			this.snapshots.set(key, { uri: document.uri, diagnostics });
			this.collection.set(document.uri, diagnostics);
		}
	}

	private onClose(document: vscode.TextDocument): void {
		const snapshot = this.snapshots.get(document.uri.toString());
		if (snapshot) {
			this.collection.set(snapshot.uri, snapshot.diagnostics);
		} else if (isChangelog(document)) {
			this.collection.delete(document.uri);
		}
	}
}