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
const fetch = require('node-fetch');
const db = require('./db.json');
logger.level = 'debug';

// Initialisation du Discord bot
const bot = new Discord.Client();
bot.login(auth.token);

// Logger à la connexion
bot.on('ready', function(evt) {
    logger.info('Connecté');
    // bot.user.setPresence({
    //     status: 'online',
    //     game: {name: 'Limite Limite', type: 'PLAYING'}
    // });
    //
    // reset();
});


bot.on('message', message => {
    var checks = message.author.id !== bot.id; //&& msg.content.substring(0, 2) === 'c!';
    var is_command = message.content.startsWith('!limite!');
    var is_in_main = message.channel.type === 'text';

    if (checks && is_command && is_in_main) {
        var command = message.content.substring(8, message.content.length).split(' ');
        iterateCommands(message, command);
    };

    if (
        message.content.toLowerCase().search(/alco+l/g) > -1 && (message.author.id !== bot.user.id)
    || message.content.toLowerCase().search(/bière/g) > -1 && (message.author.id !== bot.user.id)
    || message.content.toLowerCase().search(/biere/g) > -1 && (message.author.id !== bot.user.id)
    || message.content.toLowerCase().search(/vodka/g) > -1 && (message.author.id !== bot.user.id)
    || message.content.toLowerCase().search(/ vin/g) > -1 && (message.author.id !== bot.user.id)
    || message.content.toLowerCase().search(/rhum/g) > -1 && (message.author.id !== bot.user.id)
    || message.content.toLowerCase().search(/ bu/g) > -1 && (message.author.id !== bot.user.id)
    || message.content.toLowerCase().search(/gin/g) > -1 && (message.author.id !== bot.user.id)
    || message.content.toLowerCase().search(/ricard/g) > -1 && (message.author.id !== bot.user.id)
    || message.content.toLowerCase().search(/boire/g) > -1 && (message.author.id !== bot.user.id)) {
        message.channel.send(`ALCOOOL !`).then(mess => {
            mess.react('🍺');
            mess.react('🍻');
            mess.react('🍸');
            message.react('🍺');
            message.react('🍻');
            message.react('🍸');
        });
    }

    if (message.content.toLocaleLowerCase() === "!casino" && message.channel.type === "DMChannel") {
       if (bot.guild.get("492625920872677376").members.get(message.author.id).roles.find("name", "Prison")) {
           const slotOptions = ['🍐', '🌮', '🍇', '🍎', '🍅', '🍓', '🍉', '🍋', '🍪'];
           const slot1 = slotOptions[randomInt(0, 8)];
           JSON.stringify(slot1);
           const slot2 = slotOptions[randomInt(0, 8)];
           JSON.stringify(slot2);
           const slot3 = slotOptions[randomInt(0, 8)];
           JSON.stringify(slot3);
           message.channel.send(`**${message.author.username}** lance la machine à sous.`).then(msg => {
               msg.edit(`**${message.author.username}** lance la machine à sous.\n\n | |`);
               msg.edit(`**${message.author.username}** lance la machine à sous.\n\n${slot1}| |`);
               msg.edit(`**${message.author.username}** lance la machine à sous.\n\n${slot1} | ${slot2} |`);
               msg.edit(`**${message.author.username}** lance la machine à sous.\n\n${slot1} | ${slot2} | ${slot3}`);
               if (slot1 === slot2 && slot1 === slot3 && slot2 === slot3) {
                   msg.edit(`**${message.author.username}** lance la machine à sous.\n\n${slot1} | ${slot2} | ${slot3}\n\nGagné !`);
                   bot.guild.get("492625920872677376").members.get(message.author.id).removeRole("name", "Prison");
               } else {
                   msg.edit(`**${message.author.username}** lance la machine à sous.\n\n${slot1} | ${slot2} | ${slot3}\n\nPerdu, gros naze.`);
               }
           });
       } else {
           message.channel.send("T'es pas en prison ! Va jouer sur #babyfoot !");
       }
    }

    if (message.content.toLowerCase().substring(0, 1) === '!' && auth.channel_id.includes(message.channel.id)) {
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
                        Faut-il mettre ${votedUser} en prison pendant ${prisonTime} minutes ?  
                        ${requiredVotings} votes sont nécessaires.
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
                    if (auth.auth_ids.includes(authorMess.id)) {
                        message.channel.send(`Le shérif t'a libéré, cowboy ${votedUser} ...`).then((mess) => {
                            mess.guild.members.get(votedUser.id).removeRole(mess.guild.roles.find(x => x.name === rolePrison));
                        });
                    } else {
                        message.channel.send(`- @everyone : **Appel au jury** !
                            Faut-il libérer ${votedUser} ?
                            ${requiredVotings} votes sont nécessaires.
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
            case "blague":
                let randomNumber = Math.floor(Math.random() * 115);
                fetch("https://bridge.buddyweb.fr/api/blagues/blagues/" + randomNumber)
                    .then(blg => blg.json())
                    .then(b => message.channel.send(b.blagues));
                break;
            case "casino":
                const slotOptions = ['🍐', '🌮', '🍇', '🍎', '🍅', '🍓', '🍉', '🍋', '🍪'];
                const slot1 = slotOptions[randomInt(0, 8)];
                JSON.stringify(slot1);
                const slot2 = slotOptions[randomInt(0, 8)];
                JSON.stringify(slot2);
                const slot3 = slotOptions[randomInt(0, 8)];
                JSON.stringify(slot3);
                message.channel.send(`**${message.author.username}** lance la machine à sous.`).then(msg => {
                    msg.edit(`**${message.author.username}** lance la machine à sous.\n\n | |`);
                    msg.edit(`**${message.author.username}** lance la machine à sous.\n\n${slot1}| |`);
                    msg.edit(`**${message.author.username}** lance la machine à sous.\n\n${slot1} | ${slot2} |`);
                    msg.edit(`**${message.author.username}** lance la machine à sous.\n\n${slot1} | ${slot2} | ${slot3}`);
                    if (slot1 === slot2 && slot1 === slot3 && slot2 === slot3) {
                        msg.edit(`**${message.author.username}** lance la machine à sous.\n\n${slot1} | ${slot2} | ${slot3}\n\nGagné !`);
                    } else {
                        msg.edit(`**${message.author.username}** lance la machine à sous.\n\n${slot1} | ${slot2} | ${slot3}\n\nPerdu, gros naze.`);
                    }
                });
                break;
            case "cаsino":
                function randomInt(min, max) {
                    return Math.floor(Math.random() * (max - min + 1) + min);
                }
                const newSlotOptions = ['🍐', '🌮', '🍇', '🍎', '🍅', '🍓', '🍉', '🍋', '🍪'];
                const newDlotRandom = newSlotOptions[randomInt(0, 8)];
                const newSlot1 = newDlotRandom;
                JSON.stringify(newSlot1);
                const newSlot2 = newDlotRandom;
                JSON.stringify(newSlot2);
                const newSlot3 = newDlotRandom;
                JSON.stringify(newSlot3);
                message.channel.send(`**${message.author.username}** lance la machine à sous.`).then(msg => {
                    msg.edit(`**${message.author.username}** lance la machine à sous.\n\n | |`);
                    msg.edit(`**${message.author.username}** lance la machine à sous.\n\n${newSlot1}| |`);
                    msg.edit(`**${message.author.username}** lance la machine à sous.\n\n${newSlot1} | ${newSlot2} |`);
                    msg.edit(`**${message.author.username}** lance la machine à sous.\n\n${newSlot1} | ${newSlot2} | ${newSlot3}`);
                    msg.edit(`**${message.author.username}** lance la machine à sous.\n\n${newSlot1} | ${newSlot2} | ${newSlot3}\n\nGagné !`);
                });
                break;
            case "noter":
                const student = message.guild.members.random();
                const digit = (Math.floor(Math.random() * (21)));
                message.channel.send(`${student} est noté pour son diplôme : \n \n ${digit} / 20 \n \n Ce qui est bien mais pas top.`);
                break;
            case "bite":
                let random = (Math.floor(Math.random() * db.dicks.length));
                message.channel.send(db.dicks[random].drawing);
                break;
            case "film" :
                let randomCitation = (Math.floor(Math.random() * db.citations.length));
                message.channel.send(`${db.citations[randomCitation].text}
                        *${db.citations[randomCitation].film}*`);
                break;
            case "niquetoi":
                let votedUser = message.mentions.users.first();
                if (auth.auth_ids.includes(authorMess.id)) {
                    message.channel.send(`Dégage en taule, pourriture communiste ${votedUser} ...`).then((mess) => {
                        mess.guild.members.get(votedUser.id).addRole(mess.guild.roles.find(x => x.name === rolePrison));
                    });
                } else {
                    message.channel.send(`Tu t'es cru shérif ${message.author.username} ou quoi ?`);
                }
        }
    }
});

bot.on('raw', event => {
    if (event.t === 'MESSAGE_REACTION_ADD') {
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
                            ${requiredVoting} votes sont nécessaires.
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

                                    channel.send({embed: {color: 3447003, "image": {"url": "https://66.media.tumblr.com/22b23291747319d693a2e8d029b1c59a/tumblr_o5afscBOLE1rb2l1co1_400.gif"}}});
                                    channel.send(`***@everyone*** : ${votedUser}, les membres de La Piscine ont décidé de vous éliminer, et leur sentence est irrévocable. (enfin ... pas pendant `+prisonTime+` minutes.)`).then(() => {
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
                                channel.send({embed: {color: 3447003, "image": {"url": "https://66.media.tumblr.com/1517c2ab08e08ffb2ad96dc2af3fedea/tumblr_nnn9o1mZJQ1rb2l1co1_500.gif"}}});
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
                if (votedUser && (votedUser.id !== bot.user.id)) {

                    // si le compte de 👍 est de minimum 5
                    if (countThumbsUp >= requiredVotings) {

                        channel.fetchMessage(event.d.message_id).then(mg => {
                            msg.guild.members.get(votedUser.id).removeRole(msg.guild.roles.find(x => x.name === rolePrison)).then(() => {
                                channel.send({embed: {color: 3447003, "image": {"url": "https://66.media.tumblr.com/02c5ec43344c6ce200f8ecf102bc23c7/tumblr_nnrypiSVwo1rb2l1co1_500.gif"}}});
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

var Cah = require('./classes/CAH.js');
var path = require('path');
var config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));

var _local = {reactables: new Array(), temp: {}};

var actions = new Object();

actions.startGame = async function (mr, user) {
    var channel = bot.channels.get(config["active-channel"]);
    var userx = user.id;

    if (!_local.lobby.inGame(userx)) {
        mr.remove(user);
        return null;
    };

    if (mr.count >= _local.lobby.players.length + 1/*mr.count >= Math.ceil(_local.lobby.players.length / 2) + 1*/) {
        startGame();
    };
};

actions.triggerFlag = async function (mr, user) {

    var channel = bot.channels.get(config["active-channel"]);
    var userx = user.id;

    if (_local.lobby.inGame(userx)) {
        //mr.message.channel.send(name + " has left the game.");
        _local.lobby.kick(userx);

        removePlayer(userx);

        if (_local.temp.pycx !== undefined) {
            _local.temp.pycx.reactions.get("🏁").remove(user);
        };

        var current_players = _local.lobby.players.join(', ').length === 0 ? ' ' : toUserX(_local.lobby.players).join(', ');

        _local.temp.pycm.edit("Joueurs actifs :\n```" + current_players + "```");

        if (_local.lobby.players.length < 3 && _local.temp.pycx !== undefined) {
            await removeReactables(_local.temp.pycx, clearReactions=false, deleteMessage=true);
            _local.temp.pycx === undefined;
        };

        if (_local.lobby.players.length === 0 && _local.temp.timeoutOpt !== undefined) {
            // Clear TO
            clearTimeout(_local.temp.timeoutOpt);
        };

    } else {

        if (_local.lobby.join(userx) === false) {
            user.send("La partie est pleine, désolé. Tente une prochaine fois (ou vire un designer)");
        } else {

            addPlayer(userx);

            var current_players = _local.lobby.players.join(', ').length === 0 ? ' ' : toUserX(_local.lobby.players).join(', ');

            _local.temp.pycm.edit("Joueurs actifs : \n```" + current_players + "```");

            if (_local.lobby.players.length === 3) {
                _local.temp.pycx = await channel.send("Réagissez à ce message pour commencer la partie. [Tout le monde doit voter pour commencer]");
                _local.temp.pycx.react("🏁");

                addReactable(_local.temp.pycx, actions.startGame, "🏁");

            };

            if (_local.lobby.players.length === 1) {
                _local.temp.timeoutOpt = setTimeout(function () {
                    for (var i = 0; i < _local.lobby.players.length; i++) {
                        channel.members.get(_local.lobby.players[i]).send("Hey... J'ai du relancer le Limite Limite parce qu'il était lancé depuis trop longtemps. Rejoingez de nouveau et relancez si vous voulez jouer.");
                    };
                    reset();
                }, 10*60*1000);
            };

        };
    };

    if (mr !== null) {
        mr.remove(user);
    };
};

bot.on("messageReactionAdd", function (mr, user) {

    var message = mr.message;

    if (user.id === bot.user.id) {
        return null;
    };

    for (var i = 0; i < _local.reactables.length; i++) {
        if (_local.reactables[i].message.id === message.id && _local.reactables[i].emote === mr.emoji.toString()) {
            _local.reactables[i].action(mr, user);
            return null;
        };
    };

});

function toUserX (arx) {
    var ret = new Array();
    for (var i = 0; i < arx.length; i++) {
        ret.push(fetchUserX(arx[i]));
    };
    return ret;
};

function fetchUserX (id) {
    var channel = bot.channels.get(config["active-channel"]);
    var member = channel.members.get(id);

    return member.user.username + '#' + member.user.discriminator;
};

async function iterateCommands (msg, command) {

    switch (command[0]) {
        case "start":
            if (_local.lobby.status !== 'waiting') {
                msg.channel.send("Tu ne peux pas lancer de partie maintenant.");
                return null;
            }
            // } else if (_local.lobby.players.length < 3) {
            //     msg.channel.send("Je ne peux pas lancer de partie avec moins de 3 joueurs");
            //     return null;
            // };
            msg.channel.send("J'essaye de lancer la partie.");
            startGame();
            msg.channel.send("Partie lancée. Enjoyez vos daronnes.");
            break;

        case "reset":
            await reset();
            break;

        case "config":
            var conf = _local.lobby.configuration;
            msg.channel.send("Configuration actuelle : \n```js\n" + JSON.stringify(conf) + "```");
            break;

        case "forceGame":
            _local.lobby.start();
            break;

        case "presets":
            msg.channel.send("Available presets:\n```py\n" + fs.readFileSync(__dirname + "/" + config["directories"]["presets"]) + "```");
            break;

        case "kick":
            break;

        case "deck":
            break;

    };

};

async function reset () {

    if (_local.temp.timeoutOpt !== undefined) {
        clearTimeout(_local.temp.timeoutOpt);
    };

    if (_local.temp.delayedReset !== undefined) {
        clearTimeout(_local.temp.delayedReset);
    };

    _local.temp = new Object();
    await setLobby();
    await purgeMessages();
    await purgeChatMessages();

    await new Promise(function(resolve, reject) {
        setTimeout(function () {
            resolve();
        }, 1000);
    });

    await sendIntro();
    await unblockMain();
    await removePlayers();
};

async function blockMain () {
    var channel = bot.channels.get(config["active-channel"]);
    var role = channel.guild.roles.find(x => x.name === "@everyone");

    var perms = {
        READ_MESSAGES: false,
    };

    await channel.overwritePermissions(role, perms, "[Auto] Limite limite start");

};

async function unblockMain () {
    var channel = bot.channels.get(config["active-channel"]);
    var role = channel.guild.roles.find(x => x.name === "@everyone");

    var perms = {
        READ_MESSAGES: true,
        SEND_MESSAGES: false,
        EMBED_LINKS: false,
        ATTACH_FILES: false,
        ADD_REACTIONS: false
    };

    await channel.overwritePermissions(role, perms, "[Auto] Reset");
};

async function addPlayer (userx) {
    var channel = bot.channels.get(config["active-channel"]);
    var role = channel.guild.roles.find(x => x.name === config["roles"]["player"]);

    await channel.members.get(userx).addRole(role, "[Auto] Game join");

};

async function removePlayer (userx) {
    var channel = bot.channels.get(config["active-channel"]);
    var role = channel.guild.roles.find(x => x.name === config["roles"]["player"]);

    await channel.members.get(userx).removeRole(role, "[Auto] Game kick/leave");

};

async function removePlayers () {
    var channel = bot.channels.get(config["active-channel"]);
    var role = channel.guild.roles.find(x => x.name === config["roles"]["player"]);

    var members = role.members.array();

    for (var i = 0; i < members.length; i++) {
        members[i].removeRole(role);
    };

};

async function sendIntro () {
    var channel = bot.channels.get(config["active-channel"]);
    var attachment = new Discord.Attachment(fs.readFileSync(path.join(__dirname, "assets/banner.png")), 'banner.png');

    await channel.send(attachment);
    var react_to = await channel.send("**Limite Limite**\n\n*Réagisser à ce message pour jouer.*");

    var current_players = _local.lobby.players.join(', ') === '' ? ' ' : _local.lobby.players.join(', ');

    _local.temp.pycm = await channel.send("Joueurs actifs :\n```" + current_players + "```");
    _local.temp.pycr = react_to;

    await react_to.react("🚩");
    addReactable(react_to, actions.triggerFlag, "🚩");
};

async function purgeMessages () {

    var channel = bot.channels.get(config["active-channel"]);

    while ((await channel.fetchMessages({ limit: 1 })).array().length >= 1) {
        console.log("Attempting to purge max 100.");
        var forced_message = (await channel.fetchMessages({ limit: 1 })).array()[0];

        await forced_message.delete();

        await channel.bulkDelete(100, false);
    };
};

async function purgeChatMessages () {

    var channel = bot.channels.get(config["chat-channel"]);

    while ((await channel.fetchMessages({ limit: 1 })).array().length >= 1) {
        console.log("Attempting to purge max 100 on chat.");
        var forced_message = (await channel.fetchMessages({ limit: 1 })).array()[0];

        await forced_message.delete();

        await channel.bulkDelete(100, false);
    };
};

async function removeReactables (message, clearReactions=false, deleteMessage=false) {
    for (var i = 0; i < _local.reactables.length; i++) {
        if (message.id === _local.reactables[i].message.id) {
            _local.reactables.splice(i, 1);
        };
    };

    if (deleteMessage && message !== undefined) {
        await message.delete();
    } else if (clearReactions) {
        await message.clearReactions();
    };

};

function addReactable (message, action, emote) {
    _local.reactables.push({message: message, action: action, emote: emote});
};

function setLobby () {
    var def_config = {
        max_players: 6
    };

    _local.lobby = new Cah.Lobby(def_config);
};

async function startGame () {
    var channel = bot.channels.get(config["active-channel"]);

    if (_local.temp.timeoutOpt !== undefined) {
        clearTimeout(_local.temp.timeoutOpt);
    };

    await blockMain();

    removeReactables(_local.temp.pycr, clearReactions=true);
    removeReactables(_local.temp.pycx, clearReactions=false, deleteMessage=true);

    _local.temp.pycr.edit("**Limite Limite**");

    // var game_begin = new Discord.Attachment(fs.readFileSync(__dirname + "/assets/Game-begin.jpg"), 'Game-begin.jpg');
    await channel.send("**C'est parti !**");

    // Initialise game - assign cards
    _local.temp.game = _local.lobby.start();

    // Assign cards
    round();

};

async function nextRound () {
    var channel = bot.channels.get(config["active-channel"]);

    if (_local.temp.timeoutOpt !== undefined) {
        clearTimeout(_local.temp.timeoutOpt);
    };

    // var attachment = new Discord.Attachment(fs.readFileSync(path.join(__dirname, "assets/Next-round.jpg")), 'Next-round.jpg');
    await channel.send("**Manche suivante**");

    round();

};

async function round () {

    var channel = bot.channels.get(config["active-channel"]);

    var game = _local.temp.game;
    var actions = game.next();

    game.assignCards(actions.draw, [actions.czar]);

    channel.send("**Manche " + game.round + " !**");
    _local.temp.blackCard = sendCard(channel, actions.prompt, 'BLACK', false);
    channel.send("**" + fetchUserX(actions.czar) + "** est le Boss pour cette manche");

    var picks = new Array();

    // PM every player with their cards (except Czar since they don't need to pick)
    for (var i = 0; i < game.players.length; i++) {

        if (game.players[i].id !== actions.czar) {

            var message = "Tu as `" + game.players[i].cards.length + "` cartes réponses.";

            if (actions.pick > 1) {
                var concatable = "\nChoisis " + actions.pick + " cartes en entrant leurs numéros séparés par une virgule*.";
            } else {
                var concatable = "\nChoisis une carte en entrant son numéro.";
            };

            var avails = "```";

            var cards = game.players[i].cards;
            for (var j = 0; j < cards.length; j++) {
                avails += "\n" + (j + 1) + ": " + cards[j];
            };

            avails += "```\n**Tu as 60 secondes pour choisir ta carte.**";

            var user = channel.members.get(game.players[i].id).user;

            sendCard(user, actions.prompt, 'BLACK', false);

            user.send(message + concatable + avails);
            var dmc = await user.createDM();

            function filter (x) {

                if (x.author.id === bot.user.id) {
                    return false;
                };

                var content = x.content.split(',').map(x => x.trim()).filter(function (value, index, self) {
                    return self.indexOf(value) === index;
                });

                if (content.length !== actions.pick) {
                    x.channel.send("Pas le bon nombre de cartes !");
                    return false;
                };

                if (verifyContent(content)) {
                    x.channel.send("OK !");
                    return true;
                } else {
                    return false;
                };

                function verifyContent (a) {

                    for (var i = 0; i < a.length; i++) {

                        var index = parseInt(a[i]);

                        if (isNaN(index) || a[i] % 1 !== 0) {
                            x.channel.send("Invalide.");
                            return false;
                        };

                        if (game.getPlayer(x.author.id).cards[index - 1] === undefined) {
                            x.channel.send("Y'a une couille dans la pâté.");
                            return false;
                        };
                    };

                    return true;

                };

            };

            picks.push({id: game.players[i].id, promise: dmc.awaitMessages(filter, {max: 1, time: 60*1000})});

        };
    };

    for (var i = 0; i < picks.length; i++) {
        var colx = (await picks[i].promise).array()[0];

        colx = colx !== undefined ? colx.content.split(',').map(x => x.trim()) : new Array();

        if (colx.length < 1) {

            channel.members.get(picks[i].id).user.send("T'as pas répondu à temps, alors j'ai choisi une carte au hasard pour toi. :yum:");

            var pick = shuffle(createArx(game.getPlayer(picks[i].id).cards.length));

            var arx = pick.slice(0, actions.pick);

            function shuffle (x) {
                // Using standard Fisher-Yates shuffling
                for (var i = 0; i < x.length; i++) {
                    var jumble = Math.floor(Math.random() * i);
                    var cache = x[i];
                    x[i] = x[jumble];
                    x[jumble] = cache;
                };
                return x;
            };

            function createArx (x) {
                var ret = new Array();

                for (var i = 0; i < x; i++) {
                    ret.push(i);
                };

                return ret;
            };

        } else {

            var arx = colx.map(x => x - 1);

        };

        game.appendResponse(picks[i].id, arx, true);

    };

    czarPick(actions.czar);

};

async function czarPick (czar) {
    var game = _local.temp.game;
    var channel = bot.channels.get(config["active-channel"]);

    var presentables = game.presentResponses();

    _local.temp.czarPicks = new Array();

    for (var i = 0; i < presentables.length; i++) {
        // Await
        await sendReactableCard(channel, presentables[i].response, [255, 255, 255], "✅", presentables[i].id);
    };

    await new Promise(function(resolve, reject) {
        setTimeout(function () {
            resolve();
        }, 3*1000);
    });

    channel.send("<@" + czar + "> choisis ta réponse !");

    var timeout = 60*1000;

    warnAndKick();

    function warnAndKick () {
        _local.temp.timeoutWarn = setTimeout(function () {
            channel.send("!!! **<@" + czar + ">, tu as " + Math.round((timeout - .75*timeout)/1000) + " secondes restantes pour choisir une carte, sinon j't'envoie en prison** !!!");
        }, .75*timeout);

        _local.temp.timeoutKick = setTimeout(function() {
            removePlayer(czar);
            channel.send("**" + fetchUserX(czar) + " a été banni du jeu pour être un flemmard trop lent à choisir !**.");
            clearReactionsAndEdit();
            game.kick(czar);
            verifyWin();
        }, timeout);

    };

    async function sendReactableCard (channel, contents, colour, reaction, id) {
        var message = await sendMultiCard(channel, contents, colour);
        message.react(reaction);

        async function done (mx) {

            clearTimeout(_local.temp.timeoutWarn);
            clearTimeout(_local.temp.timeoutKick);

            clearReactionsAndEdit();

            for (var i = 0; i < _local.temp.czarPicks.length; i++) {
                if (_local.temp.czarPicks[i].message.id === mx.id) {
                    var winner = _local.temp.czarPicks[i];
                    game.score(winner.id);
                    break;
                };
            };

            // Announce winner of round, print scores
            channel.send("**" + fetchUserX(winner.id) + "** a gagné la manche ! " + wittyQuote());

            _local.temp.czarPicks = new Array();

            await new Promise(function(resolve, reject) {
                setTimeout(function () {
                    resolve();
                }, 2*1000);
            });

            verifyWin();

        };

        function filter (mr, user) {

            if (user.id === bot.user.id) {
                return false;
            };

            if (user.id !== czar) {
                mr.remove(user);
                return false;
            };

            done(mr.message);
            return true;

        };

        // Using await reactables instead of in-built system;
        var collector = message.awaitReactions(filter, {time: timeout, max: 1});

        _local.temp.czarPicks.push({collector: collector, id: id, message: message, contents: contents});

        //addReactable(message, actions.czarReact, reaction);
    };

    async function clearReactionsAndEdit() {
        for (var i = 0; i < _local.temp.czarPicks.length; i++) {
            _local.temp.czarPicks[i].message.clearReactions();
            // Edit cards to show username

            _local.temp.czarPicks[i].message.edit(makeMultiCard(channel, _local.temp.czarPicks[i].contents, [255, 255, 255], _local.temp.czarPicks[i].id));

        };

        function makeMultiCard (channel, contents, colour, id) {
            var embed = new Discord.RichEmbed({title: "Carte Blanche"});

            embed.setColor(colour);
            embed.setAuthor(fetchUserX(id), channel.members.get(id).user.avatarURL);

            for (var i = 0; i < contents.length; i++) {
                embed.addField("Carte " + (i+1), contents[i], false);
            };

            return embed;
        };

    };

};

async function verifyWin () {

    var channel = bot.channels.get(config["active-channel"]);
    var game = _local.temp.game;

    // Continue the game where viable
    var verif = game.verifyWin();
    if (verif.win) {

        // var attachment = new Discord.Attachment(fs.readFileSync(path.join(__dirname, "assets/Game-over.jpg")), 'Game-over.jpg');
        await channel.send("**FINI**");

        await new Promise(function(resolve, reject) {
            setTimeout(function () {
                resolve();
            }, 5000);
        });

        if (verif.true_win) {
            await channel.send("**" + fetchUserX(verif.winner.id) + "** a gagné la partie ! " + wittyQuote());
        } else {
            await channel.send("**" + toUserX(verif.winner.map(x => x.id)).join(", ") + "** a gagné la partie (mais bon, c'est juste parce que tout le monde dormait ou a été kick en prison). " + wittyQuote());
        };
        await channel.send("Score final :\n" + createScorePres(false));

        delayedReset(channel);

        // Autoreset
    } else {
        // Fetch scores
        await channel.send("Score actuel :\n" + createScorePres(true));

        await new Promise(function(resolve, reject) {
            setTimeout(function () {
                resolve();
            }, 8000);
        });

        nextRound();

    };

    function createScorePres (append=true) {
        var scores = game.getScoreCard();

        var ret = new String();
        for (var i = 0; i < scores.length; i++) {
            ret += "\n" + (i + 1) + ": " + fetchUserX(scores[i].id) + " [" + scores[i].score + "]";
        };

        ret = "```" + ret + "```";

        if (append) {
            ret += "\n**Il faut `" + game.win_score + "` points pour gagner la partie.**";
        }

        return ret;

    };

};

function sendMultiCard (channel, contents, colour) {
    var embed = new Discord.RichEmbed({title: "Carte blanche"});

    embed.setThumbnail("https://i.imgur.com/A8A5EI3.jpg");
    embed.setColor(colour);

    for (var i = 0; i < contents.length; i++) {
        embed.addField("Carte " + (i+1), contents[i], false);
    };

    return channel.send(embed);
};

function delayedReset (channel, time=2*60*1000) {
    channel.send("Le channel est détruit dans " + Math.round(time/1000) + " secondes.");
    _local.temp.delayedReset = setTimeout(reset, time);
};

async function sendCard (channel, content, colour, pin=false) {
    var embed = new Discord.RichEmbed({title: "Carte Noire", description: content});

    embed.setThumbnail("https://i.imgur.com/WQAzJ5k.jpg");
    embed.setColor(colour);

    var message = await channel.send(embed);
    if (pin) {
        message.pin();
    };

    return message;
};

function wittyQuote () {
    var wits = fs.readFileSync(__dirname + '/' + config["directories"]["witty-quotes"], 'utf8').split('\n').filter(x => x.length > 0);

    return wits[Math.floor(Math.random() * wits.length)];
};

function adventOfCode(user) {
    user.send({embed: {color: 3447003, title: "Bienvenue en taule !", description: "Heureusement, tu peux sortir plus tôt. Joue au casino. Si tu gagnes, tu sors."}}).then();
}