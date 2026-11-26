import * as vscode from 'vscode';
import { isChangelog, releaseSource } from './diagnostics';

import { unreleasedInsertion } from './releaseFix';
import { missingUnreleased } from './releaseRules';

export class ReleaseQuickFix implements vscode.CodeActionProvider {
	static readonly kind = vscode.CodeActionKind.QuickFix;
	provideCodeActions(
		document: vscode.TextDocument,
		_range: vscode.Range,
		context: vscode.CodeActionContext,
	): vscode.CodeAction[] {
		const diagnostics = context.diagnostics.find(
			(issue) => issue.source === releaseSource && issue.code === missingUnreleased
		);
		if (!diagnostics || !isChangelog(document)) {
			return [];
		}
		const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
		const insertion = unreleasedInsertion(document.getText(), eol);
		if (!insertion) {
			return [];
		}
		const action = new vscode.CodeAction(
			'Add an Unreleased section',
			ReleaseQuickFix.kind
		);
		action.diagnostics = [diagnostics];
		action.isPreferred = true;
		action.edit = new vscode.WorkspaceEdit();
		action.edit.insert(document.uri, document.positionAt(insertion.offset), insertion.text);
		return [action];
	}
}
