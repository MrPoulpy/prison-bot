// Settings
const reactionsArray = ["👍", "👎"];
const rolePrison = "Prison";
const defaultPrisonTime = 30; // temps en minutes
const requiredVotings = 5; // nombre de votes nécessaires
const re_duree = /pendant (?<duree>\d+) minutes/;

// Loaders require
const Discord = require('discord.js');
const logger = require('winston');
const fs = require('fs');
const schedule = require('node-schedule');
const auth = require('./auth.json');
logger.level = 'debug';


// Initialisation du Discord bot
const bot = new Discord.Client();
bot.login(auth.token);

// Logger à la connexion
bot.on('ready', function(evt) {
    logger.info('Connecté');
});


bot.on('message', message => {

    if (message.content.toLowerCase().substring(0, 1) === '!') {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];

        let authorMess = message.author;

        args = args.splice(1);
        switch(cmd) {
            case 'prison':
                if (args.length === 0) {
                    message.channel.send(`Vous devez mentionner un utilisateur à mettre en prison, ${authorMess}.`);
                } else {
                    let votedUser = message.mentions.users.first();
                    if (votedUser === undefined) {
                        message.channel.send(`Vous devez mentionner quelqu'un de ce salon, pardi ${authorMess} !`);
                    } else {
                        let prisonTime = args[1] ? parseInt(args[1]) : defaultPrisonTime;
                        prisonTime = (prisonTime > 180) ? 180 : prisonTime;

                        if (auth.auth_ids.includes(votedUser.id)) {
                            message.channel.send(`On n'envoie pas le shérif en prison, cowboy ${authorMess} ...`).then((mess) => {
                                mess.guild.members.get(authorMess.id).addRole(mess.guild.roles.find(x => x.name === rolePrison));
                            });
                        } else if (votedUser.id === auth.spe_id) {
                            message.channel.send(`Non.`).then((mess) => {
                                mess.guild.members.get(authorMess.id).addRole(mess.guild.roles.find(x => x.name === rolePrison));
                            });
                        } else {
                            fs.readFile('tries.json', 'utf8', (err, data) => {
                                data = JSON.parse(data);
                                if (data.tries.includes(authorMess.id) && !auth.auth_ids.includes(authorMess.id)) {
                                    message.channel.send(`T'as déjà fait appel au jury aujourd'hui ${authorMess}, non ? Prison pour délation !`).then((mess) => {
                                        mess.guild.members.get(authorMess.id).addRole(mess.guild.roles.find(x => x.name === rolePrison));
                                    });
                                } else {
                                    data.tries.push(authorMess.id);
                                    fs.writeFile('tries.json', JSON.stringify(data), 'utf8', (err, data) => {
                                        if (err) console.log(err);
                                        message.channel.send(`+ @everyone : 🔔 **Appel au jury** !
                        Faut-il mettre ${votedUser} en prison pendant ` + prisonTime + ` minutes ?  
                        ` + requiredVotings + ` votes sont nécessaires.
                        **Au bûcher !** : pour voter oui, réagissez avec 👍,
                        **Tentative de baise** : pour voter non, réagissez avec 👎.`
                                        ).then(message => {
                                            for (let r of reactionsArray) {
                                                message.react(r);
                                            }
                                        });
                                    });
                                }
                            });
                        }
                    }
                }
                break;
            case 'free':
                if (args.length === 0) {
                    message.channel.send(`Vous devez mentionner un utilisateur à libérer de prison, ${authorMess}.`);
                } else {
                    let votedUser = message.mentions.users.first();
                    if (auth.auth_ids.includes(votedUser.id)) {
                        message.channel.send(`Le shérif t'as libéré, cowboy ${votedUser} ...`).then((mess) => {
                            mess.guild.members.get(votedUser.id).removeRole(mess.guild.roles.find(x => x.name === rolePrison));
                        });
                    } else {
                        message.channel.send(`- @everyone : **Appel au jury** !
                            Faut-il libérer ${votedUser} ?
                            ` + requiredVotings + ` votes sont nécessaires.
                            **Désolé !** : pour voter oui, réagissez avec 👍,
                            **Nique-toi bien !** : pour voter non, réagissez avec 👎.`
                        ).then(message => {
                            for (let r of reactionsArray) {
                                message.react(r);
                            }
                        });
                    }
                }
                break;
        }
    }
});

bot.on('raw', event => {
    if (event.t === 'MESSAGE_REACTION_ADD' || event.t === "MESSAGE_REACTION_REMOVE") {
        let channel = bot.channels.get(event.d.channel_id);
        let message = channel.fetchMessage(event.d.message_id).then(msg => {

            // Check que les mentions des messages émis par le bot uniquement & qu'il s'agisse d'un voteban
            if ((msg.author.id === bot.user.id) && (msg.content.substring(0, 1) === "+")) {

                let votedUser = msg.mentions.users.first();
                let countThumbsUp = msg.reactions.filter((reaction) => reactionsArray[0] === reaction.emoji.name).map(
                    reaction => reaction.count)[0];
                let countThumbsDown = msg.reactions.filter((reaction) => reactionsArray[1] === reaction.emoji.name).map(
                    reaction => reaction.count)[0];

                // Check de pas prison le bot
                if (votedUser.id !== bot.user.id) {

                    // si le compte de 👍 est de minimum 5
                    if (countThumbsUp >= requiredVotings) {
                        msg.guild.members.get(votedUser.id).addRole(msg.guild.roles.find(x => x.name === rolePrison)).then(
                            () => {
                                // récup de la durée du ban
                                channel.fetchMessage(event.d.message_id).then(mg => {

                                    let prisonTime = re_duree.exec(mg.content) !== undefined ? re_duree.exec(mg.content).groups.duree : defaultPrisonTime;

                                    setTimeout(() => {
                                        channel.send(`- @everyone : **Appel au jury** !
                            La peine de ${votedUser} est finie ... Doit-il vraiment sortir ?
                            ` + requiredVotings + ` votes sont nécessaires.
                            **Allez... ça va !** : pour voter oui, réagissez avec 👍,
                            **Non. Nique-toi bien !** : pour voter non, réagissez avec 👎.`
                                        ).then(message => {
                                            for (let r of reactionsArray) {
                                                message.react(r);
                                            }
                                        });
                                        /*msg.guild.members.get(votedUser.id).removeRole(msg.guild.roles.find(x => x.name === rolePrison)).then(() => {
                                            channel.send(`***@everyone*** : ${votedUser} est sorti(e) de prison. Attention à vos yeux.`);
                                        });*/
                                    }, prisonTime*60000);

                                    channel.send(`***@everyone*** : ${votedUser} a été banni(e) `+prisonTime+` minutes. Alleluïa !`).then(() => {
                                        channel.fetchMessage(event.d.message_id).then(mg => {
                                            mg.delete();
                                        });
                                    });
                                });
                            }
                        );
                    }

                    // si le compte de 👎 est de minimum 5, delete le message
                    if (countThumbsDown >= requiredVotings) {
                        channel.fetchMessage(event.d.message_id).then(mg => {
                            mg.delete().then(() => {
                                channel.send(`***@everyone*** : ${votedUser} a été gracié(e).`);
                            });
                        });
                    }
                }
            } else if (msg.content.substring(0, 1) === "-") {
                let votedUser = msg.mentions.users.first();
                let countThumbsUp = msg.reactions.filter((reaction) => reactionsArray[0] === reaction.emoji.name).map(
                    reaction => reaction.count)[0];
                let countThumbsDown = msg.reactions.filter((reaction) => reactionsArray[1] === reaction.emoji.name).map(
                    reaction => reaction.count)[0];

                // Check de pas prison le bot
                if (votedUser.id !== bot.user.id) {

                    // si le compte de 👍 est de minimum 5
                    if (countThumbsUp >= requiredVotings) {

                        channel.fetchMessage(event.d.message_id).then(mg => {
                            msg.guild.members.get(votedUser.id).removeRole(msg.guild.roles.find(x => x.name === rolePrison)).then(() => {
                                channel.send(`***@everyone*** : ${votedUser} est sorti(e) de prison. Attention à vos yeux.`);
                                mg.delete();
                            });
                        });

                    }

                    // si le compte de 👎 est de minimum 5, delete le message
                    if (countThumbsDown >= requiredVotings) {
                        channel.fetchMessage(event.d.message_id).then(mg => {
                            mg.delete().then(() => {
                                channel.send(`***@everyone*** : ${votedUser} reste à croupir en taule.`);
                            });
                        });
                    }
                }
            }
        })
    }
});

// reset les compteurs chaque nuit à minuit.
schedule.scheduleJob('0 0 * * *', () => {
    fs.readFile('tries.json', 'utf8', (err, data) => {
        data = JSON.parse(data);
        data.tries = [];
        fs.writeFile('tries.json', JSON.stringify(data), 'utf8', (err, data) => {
            if (err) console.log(err);
        });
    });
});