require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const si = require('systeminformation');

const HEARTBEAT_FILE = path.join(__dirname, 'last_seen.json');
const CHECK_INTERVAL = 60 * 1000; 

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

const toDiscordTime = (ms) => `<t:${Math.floor(ms / 1000)}:f>`;

// --- HEARTBEAT LOGIC ---
setInterval(() => {
    try {
        fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify({ timestamp: Date.now() }));
    } catch (err) {
        console.error("Disk Write Error:", err);
    }
}, CHECK_INTERVAL);

// --- STARTUP LOGIC ---
client.once('ready', async () => {
    console.log(`Home Server Monitor Online: ${client.user.tag}`);
    
    // 1. Check if the heartbeat file exists
    if (fs.existsSync(HEARTBEAT_FILE)) {
        try {
            // 2. Read the "Last Recorded Heartbeat" from the file
            const rawData = fs.readFileSync(HEARTBEAT_FILE);
            const lastSeenData = JSON.parse(rawData);
            const lastHeartbeat = lastSeenData.timestamp;
            
            const now = Date.now();
            
            // 3. Calculate total downtime in minutes
            const diffMs = now - lastHeartbeat;
            const downtimeMinutes = Math.floor(diffMs / 1000 / 60);

            // 4. Only notify if downtime was significant (e.g., more than 2 minutes)
            // This avoids spamming notifications during quick manual restarts.
            if (downtimeMinutes > 2) {
                const channel = await client.channels.fetch(process.env.CHANNEL_ID);
                if (channel) {
                    const recoveryEmbed = new EmbedBuilder()
                        .setTitle('System Power Recovery')
                        .setColor(0x2ecc71) // Professional Green
                        .addFields(
                            { name: 'Last Recorded Heartbeat', value: `<t:${Math.floor(lastHeartbeat / 1000)}:f>`, inline: false },
                            { name: 'Recovery Time', value: `<t:${Math.floor(now / 1000)}:f>`, inline: false },
                            { name: 'Total Downtime', value: `${downtimeMinutes} minutes`, inline: false }
                        )
                        .setFooter({ text: 'Home Server Node' });

                    await channel.send({ embeds: [recoveryEmbed] });
                    console.log(`Recovery alert sent: ${downtimeMinutes} mins downtime.`);
                }
            }
        } catch (err) {
            console.error("Error during recovery check:", err);
        }
    }

    // 5. Immediately write a fresh heartbeat to reset the cycle
    fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify({ timestamp: Date.now() }));
});

// --- STATUS COMMAND ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === '!status') {
        try {
            const cpuTemp = await si.cpuTemperature();
            const mem = await si.mem();
            const osInfo = await si.osInfo();
            const uptime = si.time().uptime;
            const disk = await si.fsSize(); // New: Fetch disk info

            const usedMem = (mem.active / 1024 / 1024 / 1024).toFixed(2);
            const totalMem = (mem.total / 1024 / 1024 / 1024).toFixed(2);
            
            // Calculate main disk usage (usually the first drive /)
            const mainDisk = disk[0];
            const diskUsed = (mainDisk.used / 1024 / 1024 / 1024).toFixed(2);
            const diskTotal = (mainDisk.size / 1024 / 1024 / 1024).toFixed(2);
            const diskPercent = mainDisk.use.toFixed(1);

            const hours = Math.floor(uptime / 3600);
            const mins = Math.floor((uptime % 3600) / 60);

            const statusEmbed = new EmbedBuilder()
                .setTitle('Home Server Status Report')
                .setColor(0x34495e)
                .addFields(
                    { name: 'CPU Temperature', value: `${cpuTemp.main || 'N/A'} Celsius`, inline: true },
                    { name: 'Memory Usage', value: `${usedMem}GB / ${totalMem}GB`, inline: true },
                    { name: 'System Uptime', value: `${hours}h ${mins}m`, inline: true },
                    { name: 'Storage Usage', value: `${diskUsed}GB / ${diskTotal}GB (${diskPercent}%)`, inline: false },
                    { name: 'Operating System', value: `${osInfo.distro}`, inline: true },
                    { name: 'Kernel Version', value: `${osInfo.kernel}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Home Server Node' });

            message.reply({ embeds: [statusEmbed] });
        } catch (error) {
            console.error("Status fetch error:", error);
            message.reply("Error fetching system metrics.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
