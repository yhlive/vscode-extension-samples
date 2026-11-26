import assert from 'node:assert/strict';
import { test } from 'node:test';
import { unreleasedInsertion } from '../out/releaseFix.js';

test('inserts after the title with the document line endings', () => {
	const input = '# Changelog\r\n\r\n## [1.1.0]';
	const edit = unreleasedInsertion(input, '\r\n');
	assert.equal(edit.offset, '# Changelog'.length);
	assert.equal(edit.text, '\r\n\r\n## [Unreleased]\r\n');
	assert.equal(edit.newText, undefined);
});

test('creates a heading for an empty document', () => {
	assert.deepEqual(unreleasedInsertion('', '\n'), {
		offset: 0,
		text: '## [Unreleased]\n',
	});
});

test('does not propose a second edit after a live heading already exists', () => {
	const input = '# Changelog\n\n## [Unreleased]\n\n## [1.0.0]';
	assert.equal(unreleasedInsertion(input, '\n'), undefined);
	assert.equal(unreleasedInsertion('## [Unreleased]', '\n'), undefined);
});