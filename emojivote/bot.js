const Discord = require('discord.js');
const exportToCsv = require('export-to-csv').ExportToCsv;
const fs = require('fs')
require('dotenv').config()

/**
 * emojivote
 * A bot that count a chosen reaction of messages.
 */

/**
 * .env Sample
 * BOT_TOKEN=mVRlthiqnP0c6OShVEpoaTF3.8eZiB8.U3iYdym2rtyiE4Lm4ZOWZRo8PU2
 * ADMIN_ID=037879092225654814
 * EMOJI_ID=939433502967017770
*/

//---Settings---
const limit = 300; // Message Limit
const adminId = process.env.ADMIN_ID; // Discord ID of Admin to prevent spamming
const emojiId = process.env.EMOJI_ID; // Emoji ID of selected Emoji for voting

const options = { 
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalSeparator: '.',
    showLabels: true, 
    showTitle: true,
    title: 'Voting Result',
    useTextFile: false,
    useBom: true,
    useKeysAsHeaders: true,
  }; // export settings -> API (https://www.npmjs.com/package/export-to-csv)

//---End---

// Create an instance of a Discord client
const client = new Discord.Client();

// Data array for storing result
let data = [];

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Create an event listener for messages
client.on('message', async msg => {

    if (msg.content === "!end" && msg.author.id == adminId) {

        const messages = await fetchMore(msg.channel)

        messages.map(message => {
            try {               
                if (message.reactions.cache.get(emojiId).count > 0) {
                    data.push(
                        { 
                            id: message.id, 
                            attachment: message.attachments ? true : false,
                            content: message.content, 
                            author: message.author.id, 
                            username: message.author.username,
                            voteCount: message.reactions.cache.get(emojiId).count 
                        }
                    )

                }
            } catch (err) {
                // console.log(err)
            }
        })
    }

    else if (msg.content === "!export" && msg.author.id == adminId) {       
          const csvExporter = new exportToCsv(options);
          const csvData  = csvExporter.generateCsv(data, true);
          fs.writeFileSync('result.csv', csvData)
    }
});

async function fetchMore(channel) {
    if (!channel) {
        throw new Error(`Expected channel, got ${typeof channel}.`);
    }

    if (limit <= 100) {
      return channel.messages.fetch({ limit });
    }
  
    let collection = new Discord.Collection();
    let lastId = null;
    let options = {};
    let remaining = limit;
  
    while (remaining > 0) {
      options.limit = remaining > 100 ? 100 : remaining;
      remaining = remaining > 100 ? remaining - 100 : 0;
  
      if (lastId) {
        options.before = lastId;
      }
  
      let messages = await channel.messages.fetch(options);
  
      if (!messages.last()) {
        break;
      }
  
      collection = collection.concat(messages);
      lastId = messages.last().id;
    }
  
    return collection;
  }

// Log our bot in using the token from https://discord.com/developers/applications
client.login(process.env.BOT_TOKEN);


