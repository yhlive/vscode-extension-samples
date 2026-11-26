import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scanReleaseNotes } from '../out/releaseRules.js';

test('flags missing heading on the first line', () => {
	const [issue] = scanReleaseNotes('# Changelog\n## [1.0.0]');
	assert.equal(issue.code, 'missing-unreleased');
	assert.equal(issue.line, 0);
});

test('accepts one live heading and ignores fenced examples', () => {
	assert.deepEqual(scanReleaseNotes('# Changelog\n## [Unreleased]\n\n```ts\n// code example\n```\n## [1.0.0]'), []);
});

test('flages each extra heading on its own line, including CRLF documents', () => {
	const issues = scanReleaseNotes('# Changelog\r\n## [Unreleased]\r\n## [Unreleased]');
	assert.deepEqual(issues.map(({ line, code }) => [ line, code ]),
		[[2, 'duplicate-unreleased']],
	);
});