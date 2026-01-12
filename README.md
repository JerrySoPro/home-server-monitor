# Home Server Power & Health Monitor

A resilient Node.js monitoring solution deployed on an ARM-based Tanix TX3 Mini, designed to track system availability and provide real-time hardware metrics via Discord.

## Overview

This project repurposes an idle TX3 Mini TV Box into a dedicated Linux server. The primary challenge was monitoring uptime in an environment prone to power cuts. To solve this, I developed a **"Blackbox Heartbeat"** system that records system states to disk, allowing the server to calculate and report downtime durations immediately upon power recovery.

## Technical Features

- **Blackbox Heartbeat**: Writes a persistent Unix timestamp to local storage every 60 seconds.
- **Automated Recovery Reports**: On boot, the system calculates the delta between the "last seen" timestamp and current time to report total downtime to a Discord channel.
- **On-Demand Metrics**: Custom `!status` command provides real-time data on CPU temperature, RAM usage, and disk storage.
- **Process Persistence**: Managed by PM2 to ensure the service survives crashes and starts automatically on system boot.

## Hardware Specifications

| Component  | Details                                          |
| ---------- | ------------------------------------------------ |
| **Device** | Tanix TX3 Mini (Amlogic S905W)                   |
| **OS**     | Armbian (Debian 13 "Trixie")                     |
| **CPU**    | Quad-core ARM Cortex-A53 (Low power consumption) |
| **Memory** | 2GB DDR3                                         |

## Project Purpose

The TX3 Mini was chosen for its low power consumption and high efficiency as an "always-on" node. By installing a headless Linux distribution, I transformed a consumer entertainment device into a robust DevOps tool capable of hosting a website and an Uptime Kuma instance.

## Software Stack

| Technology            | Purpose           |
| --------------------- | ----------------- |
| **Node.js v20+**      | Runtime           |
| **Discord.js**        | API Communication |
| **systeminformation** | System Metrics    |
| **PM2**               | Process Manager   |

## Installation & Setup

### 1. OS Setup

Follow these steps to flash Armbian onto the TX3 Mini:

1. **Download Armbian**: Get the latest Armbian image for Amlogic S905W from the [Armbian Archive](https://www.armbian.com/download/).

2. **Flash the Image**: Use [balenaEtcher](https://etcher.balena.io/) or `dd` to write the image to a microSD card.

   ```bash
   sudo dd if=Armbian_*.img of=/dev/sdX bs=4M status=progress
   ```

3. **Prepare the Device**: Insert the microSD card into the TX3 Mini. Connect via Ethernet for initial setup.

4. **Boot into Armbian**: Power on the device while holding the reset button (located inside the AV port) to boot from the SD card instead of internal storage.

5. **Initial Configuration**: On first boot, Armbian will prompt you to:

   - Set a root password
   - Create a new user account
   - Configure locale and timezone

6. **Install to eMMC (Optional)**: For better performance, install Armbian to internal storage:
   ```bash
   sudo armbian-install
   ```

### 2. Environment Configuration

Create a `.env` file in the project root with your credentials:

```env
DISCORD_TOKEN=your_discord_bot_token
CHANNEL_ID=your_discord_channel_id
```

### 3. Deployment

```bash
# Install dependencies
npm install

# Start with PM2
pm2 start index.js --name "home-server"

# Save PM2 process list for auto-restart on boot
pm2 save
```

## License

MIT
