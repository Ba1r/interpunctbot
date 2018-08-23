/*global Promise*/

const Usage = require("command-parser");
const o = require("../options");

let timeout = (time) => new Promise(resolve => setTimeout(resolve, time));

let ping = new Usage({
	description: "Ping the bot to see if it can respond",
	callback: async(data) => {
		let reply = await data.msg.reply("<a:pingpong:482012177725653003>");
		await timeout(1000);
		reply.edit("Pong!");
	}
});

module.exports = ping;
