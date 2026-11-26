import * as vscode from 'vscode';
import { diagnosticsForText, ReleaseDiagnostics, ScanEntry } from './diagnostics';
import { TextDecoder } from 'node:util';

export const scanCommand = 'releaseChecklist.scanWorkspace';
const maxFiles = 200;
const maxBytes = 1024 * 1024;

export interface ScanSummary {
	scanned: number;
	skipped: number;
	limited: boolean;
}

export function registerWrokspaceScan(diagnostics: ReleaseDiagnostics): vscode.Disposable {
	let busy = false;
	return vscode.commands.registerCommand(scanCommand, async (): Promise<ScanSummary | undefined> => {
		if (busy) {
			return;
		}
		if (!vscode.workspace.workspaceFolders?.length) {
			void vscode.window.showInformationMessage('No workspace is open.');
			return;
		}
		busy = true;
		try {
			const result = await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: 'Scanning workspace for changelog issues',
				cancellable: false
			}, async (progress, token) => {
				const files = await vscode.workspace.findFiles(
					'**/CHANGELOG.md',
					'**/node_modules/**',
					maxFiles + 1,
					token
				);
				const entries: ScanEntry[] = [];
				let skipped = 0;
				const batch = files.slice(0, maxFiles);
				for (const uri of batch) {
					if (token.isCancellationRequested) {
						break;
					}
					progress.report({ message: vscode.workspace.asRelativePath(uri), increment: 100 / batch.length });
					try {
						const info = await vscode.workspace.fs.stat(uri);
						if (info.size > maxBytes) {
							skipped++;
							continue;
						}
						const bytes = await vscode.workspace.fs.readFile(uri);
						const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
						entries.push({ uri, diagnostics: diagnosticsForText(text) });
					} catch {
						skipped++;
					}
				}
				if (token.isCancellationRequested) {
					return;
				}
				diagnostics.replaceWorkspaceScan(entries);
				return {
					scanned: batch.length,
					skipped,
					limited: files.length > maxFiles
				};
			});
			if (result) {
				const limit = result.limited ? ` (limited to ${maxFiles} files)` : '';
				void vscode.window.showInformationMessage(
					`Scanned ${result.scanned} changelog files${limit}, skipped ${result.skipped} files.`
				);
			}
			return result;
		} catch (err) {
			void vscode.window.showErrorMessage(`Failed to scan workspace: ${err}`);
		} finally {
			busy = false;
		}
	});
}