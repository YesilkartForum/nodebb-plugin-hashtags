'use strict';

const db = require.main.require('./src/database');
const topics = require.main.require('./src/topics');
const posts = require.main.require('./src/posts');
const main = require('../library');

module.exports = {
	name: 'Re-index tagged posts list',
	timestamp: Date.UTC(2020, 8, 22),
	method: async () => {
		// Take existing tags, index their mainpids
		const tags = await db.getSortedSetRange('tags:topic:count', 0, -1);
		let pids = await Promise.all(tags.map(async (tag) => {
			const tids = await db.getSortedSetRange('tag:' + tag + ':topics', 0, -1);
			return topics.getMainPids(tids);
		}));

		// Join all the arrays
		pids = pids.reduce((memo, cur) => memo.concat(cur), []);

		// Turn them pids into pseudo post objects
		const payload = await posts.getPostsFields(pids, ['pid', 'content']);

		await Promise.allSettled(payload.map(async post => main.indexPost({ post })));
	},
};
