import { missingUnreleased, scanReleaseNotes } from './releaseRules';

export function unreleasedInsertion(text: string, eol: string): { offset: number; text: string } | undefined {
	if (!scanReleaseNotes(text).some((issue) => issue.code === missingUnreleased)) {
		return;
	}
	const heading = /^# [^\r\n]+/.exec(text);
	const offset = heading ? heading[0].length : 0;
	const prefix = heading ? eol + eol : '';
	const suffix = !heading && text ? eol + eol : eol;
	return { offset, text: prefix + '## [Unreleased]' + suffix };
}
