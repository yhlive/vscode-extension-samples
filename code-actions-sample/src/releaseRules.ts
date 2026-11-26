export const missingUnreleased = 'missing-unreleased';
export const duplicateUnreleased = 'duplicate-unreleased';

export interface ReleaseIssue {
	line: number;
	code: string;
	message: string;
	warning: boolean;
}

export function scanReleaseNotes(text: string): ReleaseIssue[] {
	const headings: number[] = [];
	let fence = '';
	text.split(/\r?\n/).forEach((line, index) => {
		const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
		if (marker) {
			if (!fence) {
				fence = marker[1];
			} else if (
				marker[1][0] === fence[0] &&
				marker[1].length >= fence.length &&
				!marker[2].trim()
			) {
				fence = '';
			}
			return;
		}
		if (!fence && /^ {0,3}##\s+(?:\[Unreleased\]|Unreleased)(?:\s+#+)?\s*$/i.test(line)) {
			headings.push(index);
		}
	});
	if (headings.length === 0) {
		return [{
			line: 0,
			code: missingUnreleased,
			message: 'Add an Unreleased section',
			warning: true
		}];
	}
	return headings.slice(1).map(line => ({
		line,
		code: duplicateUnreleased,
		message: 'Keep a single Unreleased section.',
		warning: false
	}));
}
