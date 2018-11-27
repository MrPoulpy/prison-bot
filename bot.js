// Settings
const reactionsArray = ["👍", "👎"];
const rolePrison = "Prison";
const prisonTime = 30; // temps en minutes
const requiredVotings = 5; // nombre de votes nécessaires

// Loaders require
const Discord = require('discord.js');
const logger = require('winston');
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

        args = args.splice(1);
        switch(cmd) {
            case 'prison':
                if (args.length === 0) {
                    message.channel.send('Vous devez mentionner un utilisateur à mettre en prison.');
                } else if (args.length > 1) {
                    message.channel.send('Vous ne devez voter que pour un seul détenu à la fois.');
                } else {
                    let votedUser = message.mentions.users.first();
                    if (votedUser === undefined) {
                        message.channel.send(`Vous devez mentionner quelqu'un de ce salon, pardi !`);
                    } else {

                        // Impossible de récupérer les mentions sur les embed :/
                        /*message.channel.send({embed :{
                            color: 3447003,
                            title: `🔔 **Appel au jury** !`,
                            fields: [
                                { name: "Accusé ! ", value: `Faut-il mettre ${votedUser} en prison pendant 30 minutes ?` },
                                { name: "Pendez-le !", value: "Pour voter oui, réagissez avec 👍" },
                                { name: "Tentative de baise", value: "Pour voter non, réagissez avec 👎" }
                            ]
                        }}*/

                        message.channel.send(`@everyone : 🔔 **Appel au jury** !
                        Faut-il mettre ${votedUser} en prison pendant `+prisonTime+` minutes ?
                        `+requiredVotings+` votes sont nécessaires
                        **Au bûcher !** : pour voter oui, réagissez avec 👍
                        **Tentative de baise** : pour voter non, réagissez avec 👎`
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

            // Check que les mentions des messages émis par le bot uniquement
            if (msg.author.id === bot.user.id) {

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
                                setTimeout(() => {
                                    msg.guild.members.get(votedUser.id).removeRole(msg.guild.roles.find(x => x.name === rolePrison)).then(() => {
                                        channel.send(`***@everyone*** : ${votedUser} est sorti de prison. Attention à vos yeux.`);
                                    });
                                }, prisonTime*60000);

                                channel.send(`***@everyone*** : ${votedUser} a été banni. Alleluïa !`).then(() => {
                                    channel.fetchMessage(event.d.message_id).then(mg => {
                                        mg.delete();
                                    });
                                });
                            }
                        );
                    }

                    // si le compte de 👎 est de minimum 5, delete le message
                    if (countThumbsDown >= requiredVotings) {
                        channel.fetchMessage(event.d.message_id).then(mg => {
                            mg.delete().then(() => {
                                channel.send(`***@everyone*** : ${votedUser} a été gracié.`);
                            });
                        });
                    }
                }
            }
        })
    }
});

//@TODO : créer automatiquement le rôle Prison ?