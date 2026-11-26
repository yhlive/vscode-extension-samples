import * as vscode from 'vscode';
import { releaseSource } from './diagnostics';

interface FileNode {
	kind: 'file';
	uri: vscode.Uri;
	diagnostics: vscode.Diagnostic[];
}

interface ProblemNode {
	kind: 'problem';
	uri: vscode.Uri;
	diagnostic: vscode.Diagnostic;
}

type ReleaseNode = FileNode | ProblemNode;

export class ReleaseSidebar implements vscode.TreeDataProvider<ReleaseNode>, vscode.Disposable {
	private readonly changed = new vscode.EventEmitter<void>();
	readonly onDidChangeTreeData = this.changed.event;

	private readonly subscription = vscode.languages.onDidChangeDiagnostics(({ uris }) => {
		if (uris.some(uri => /(?:^|\/)CHANGELOG\.md$/i.test(uri.path))) {
			this.changed.fire();
		}
	});

	getChildren(node?: ReleaseNode): ReleaseNode[] {
		if (node?.kind === 'problem') {
			return [];
		}
		if (node?.kind === 'file') {
			return node.diagnostics.map((diagnostic) => ({
				kind: 'problem',
				uri: node.uri,
				diagnostic
			}));
		}

		const files: FileNode[] = [];
		for (const [uri, diagnostics] of vscode.languages.getDiagnostics()) {
			const findings = diagnostics
				.filter(({ source }) => source === releaseSource);
			if (findings.length) {
				files.push({
					kind: 'file',
					uri,
					diagnostics: findings
				});
			}
		}
		return files.sort((a, b) => this.relativePath(a.uri).localeCompare(this.relativePath(b.uri)));
	}

	getTreeItem(node: ReleaseNode): vscode.TreeItem {
		if (node.kind === 'file') {
			const lable = this.relativePath(node.uri);
			const item = new vscode.TreeItem(lable, vscode.TreeItemCollapsibleState.Expanded);
			item.id = 'file:' + node.uri.toString();
			item.resourceUri = node.uri;
			item.description = node.diagnostics.length === 1 ? '1 issue' : `${node.diagnostics.length} issues`;
			item.tooltip = lable;
			return item;
		}
		const { uri, diagnostic } = node;
		const line = diagnostic.range.start.line + 1;
		const item = new vscode.TreeItem(diagnostic.message);
		item.id = `issue:${uri.toString()}:${diagnostic.code}:${line}`;
		item.description = `Line ${line}`;
		item.tooltip = `${this.relativePath(uri)}:${line}`;
		item.iconPath = new vscode.ThemeIcon(
			diagnostic.severity === vscode.DiagnosticSeverity.Error ? 'warning' : 'error'
		);
		item.command = {
			title: 'Open changelog',
			command: 'vscode.open',
			arguments: [uri, { selection: diagnostic.range }]
		};
		return item;
	}

	dispose(): void {
		this.subscription.dispose();
		this.changed.dispose();
	}

	private relativePath(uri: vscode.Uri): string {
		return vscode.workspace.asRelativePath(uri);
	}
}