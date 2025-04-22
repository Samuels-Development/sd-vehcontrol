# sd-vehcontrol

sd‑vehcontrol is a sleek, fully customizable vehicle control menu that gives players one‑click access to change seats and manipulate engine, doors, windows, lights, and more. Its built‑in settings panel lets each user adjust UI color, scale, and on‑screen position—which is persisted via KVP so their layout “sticks” across sessions.

## Video Preview
https://www.youtube.com/watch?v=4LZn28siX-4

## UI Preview
![Discord_vQz6S1qJ52](https://github.com/user-attachments/assets/0032a6ba-6632-445a-92b2-803c41df1c15)
![Discord_p3aRPIWrW8](https://github.com/user-attachments/assets/3720f62b-4fab-4f13-aeb5-f2d662bd4224)
![Discord_SIFKFuGyZL](https://github.com/user-attachments/assets/772eeb9b-c0cb-42f1-8049-24b4f7e553f1)


## 🔔 Contact

Author: Samuel#0008  
Discord: [Join the Discord](https://discord.gg/FzPehMQaBQ)  
Store: [Click Here](https://fivem.samueldev.shop)

## 💾 Installation

1. Download the latest release from the [GitHub repository](https://github.com/Samuels-Development/sd-vehcontrol/releases).
2. Extract the downloaded file and rename the folder to `sd-vehcontrol`.
3. Place the `sd-vehcontrol` folder into your server's `resources` directory.
4. Add `ensure sd-vehcontrol` to your `server.cfg` to ensure the resource starts with your server.


## 📖 Dependencies
- None

## 📖 Usage

### Command
You can use `/vehcontrol` to open the UI. This can be modified in the config.

### Keybinds
You can use the F7 (default) keybind to open the menu. This can be modified in the config.

### Export
exports['sd-vehcontrol']:OpenMenu()

### Event
TriggerEvent('sd-vehcontrol:client:openMenu')