const Discord = require('discord.js');
require('dotenv').config();
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

const client = new Discord.Client();

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

const fullPass = async () => {
	const logChannel = client.guilds.cache
		.get(config.guildID)
		.channels.cache.get(config.logChannelID);
	await logChannel.send('bt5 records');
	sleep(5);
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
};

client.on('ready', async () => {
	setInterval(async () => {
		await fullPass();
	}, 21600000); // 6 hours
});

const classPing = (message, channelID) => {
	base('Course Catalog')
		.select({
			view: 'Grid view'
		})
		.eachPage(
			function page(records, fetchNextPage) {
				const data = [];
				records.forEach(record => {
					data.push({
						channel: record.get('Discord Channel ID').split(', '),
						teachers: record.get('Teacher Discord User IDs'),
						students: record.get('Student Discord User IDs')
					});
				});
				fetchNextPage();

				data.map(i => {
					i.channel.map(c => {
						if (c == channelID) {
							let m = '';
							const everyone = [...i.teachers, ...i.students];
							everyone.map(e => {
								m += '<@' + e + '> ';
							});
							if (
								message.member.hasPermission('ADMINISTRATOR') ||
                i.teachers.includes(message.author.id)
							) {
								return message.channel.send(m);
							}

							return message.channel.send(
								'You don\'t have sufficient permissions to do that silly!'
							);
						}
					});
				});
			},
			async function done(err) {
				if (err) {
					console.error(err);
				}
			}
		);
};

client.on('message', async message => {
	const contents = message.content.toLowerCase().split(' ');
	const cmd = contents[1];
	const args = contents.slice(2);
	if (contents[0] === config.prefix) {
		if (cmd === 'ping') {
			if (args[0] != null) {
				return classPing(message, args[0].substring(2, args[0].length - 1));
			}

			return message.channel.send('Invalid class channel.');
		}

		if (cmd === 'fullpass') {
			if (message.channel.id == config.logChannelID) {
				return fullPass();
			}

		  return message.channel.send('You can\'t do that here buddy.');
		}
	}
});

client.login(process.env.token);
