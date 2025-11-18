const { EmbedBuilder } = require('discord.js');

function twitchEmbed(username, title, url, thumbnail) {
    return new EmbedBuilder()
        .setTitle(`${username} está en vivo en Twitch!`)
        .setDescription(title)
        .setURL(url)
        .setColor(0x9146FF)
        .setThumbnail(thumbnail);
}

function kickEmbed(username, title, url) {
    return new EmbedBuilder()
        .setTitle(`${username} está en vivo en Kick!`)
        .setDescription(title || 'Transmisión en vivo')
        .setURL(url)
        .setColor(0xFF4500);
}

function youtubeEmbed(username, title, url, thumbnail) {
    return new EmbedBuilder()
        .setTitle(`Nuevo video de ${username} en YouTube!`)
        .setDescription(title)
        .setURL(url)
        .setColor(0xFF0000)
        .setThumbnail(thumbnail);
}

module.exports = { twitchEmbed, kickEmbed, youtubeEmbed };
