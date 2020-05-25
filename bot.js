const Discord = require('discord.js');
require('dotenv').config();
const express = require('express');
const app = express();
const config = require('./config.js');
const Airtable = require('airtable');
const base = new Airtable({apiKey: process.env.API_KEY}).base(
	'apprEDMBB2pnH11HZ'
);

function msleep(n) {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

function sleep(n) {
	msleep(n * 1000);
}

app.listen(() => console.log('Server started'));

app.use('/', (request, res) => {
	res.send('Online.');
});

const client = new Discord.Client();

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('ready', async () => {
	const logChannel = client.guilds.cache
		.get(config.guildID)
		.channels.cache.get(config.logChannelID);

	setInterval(async () => {
		await logChannel.send('bt5 records');

		// Department channels
		base('Course Subjects')
			.select({
				view: 'Grid view'
			})
			.eachPage(
				function page(records, fetchNextPage) {
					const data = [];
					records.forEach(record => {
						data.push({
							channel: record.get('Discord Channel ID')
						});
					});
					fetchNextPage();

					data.map(d => {
						d.channel.split(', ').map(async c => {
							await logChannel.send('bt5 update <#' + c + '> teachers');
							sleep(10);
						});
					});
				},
				async function done(err) {
					if (err) {
						console.error(err);
					}
				}
			);

		// Course channels
		base('Course Catalog')
			.select({
				view: 'Grid view'
			})
			.eachPage(
				function page(records, fetchNextPage) {
					const data = [];
					records.forEach(record => {
						data.push({
							channel: record.get('Discord Channel ID')
						});
					});
					fetchNextPage();

					data.map(d => {
						d.channel.split(', ').map(async c => {
							await logChannel.send('bt5 update <#' + c + '>');
							sleep(10);
						});
					});
				},
				async function done(err) {
					if (err) {
						console.error(err);
					}
				}
			);
	}, 21600000); // 6 hours
});

client.login(process.env.token);
