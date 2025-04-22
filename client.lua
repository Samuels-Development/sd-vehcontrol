local isUIOpen = false -- Variable to track if the UI is open or not
local playerSettings = {} -- Table to store ui settings of the player opening it

--- Prints debug messages when debugging is enabled.
--- @param ... vararg Values to print.
--- @return nil
local DebugPrint = function(...)
    if Config.Debug then
        print(...)
    end
end

--- Retrieves vehicle data including doors, windows, and neon availability.
--- @param vehicle number The vehicle entity.
--- @return table Table with fields 'doors', 'windows', and 'hasNeons'.
local GetVehicleData = function(vehicle)
    local vehicleData = {}
    local model = GetEntityModel(vehicle)
    local numDoors = GetNumberOfVehicleDoors(vehicle)
    DebugPrint("Vehicle has " .. numDoors .. " doors (including hood/trunk)")
    local maxSeats = GetVehicleModelNumberOfSeats(model)
    DebugPrint("Vehicle has " .. maxSeats .. " seats")
    vehicleData.doors = {
        fl = DoesVehicleHaveDoor(vehicle, 0),
        fr = DoesVehicleHaveDoor(vehicle, 1),
        rl = DoesVehicleHaveDoor(vehicle, 2) and numDoors > 2,
        rr = DoesVehicleHaveDoor(vehicle, 3) and numDoors > 2,
        hood = DoesVehicleHaveDoor(vehicle, 4),
        trunk = DoesVehicleHaveDoor(vehicle, 5)
    }
    vehicleData.windows = {
        fl = true,
        fr = true,
        rl = maxSeats > 2,
        rr = maxSeats > 2
    }
    local neonCount = GetNumVehicleMods(vehicle, 48) or 0
    vehicleData.hasNeons = neonCount > 0
    DebugPrint("Has neon kit:", vehicleData.hasNeons)

    vehicleData.class = GetVehicleClass(vehicle)
    DebugPrint("Vehicle class:", vehicleData.class)

    return vehicleData
end

--- Finds accessible seats for the vehicle.
--- @param vehicle number The vehicle entity.
--- @return table List of seat descriptors.
local GetAvailableSeats = function(vehicle)
    local seats = {}
    local maxSeats = GetVehicleModelNumberOfSeats(GetEntityModel(vehicle))
    DebugPrint("Vehicle has " .. maxSeats .. " seats")
    table.insert(seats, { id = "driver", name = "Driver Seat", index = -1 })
    if maxSeats >= 2 then
        table.insert(seats, { id = "passenger", name = "Front Passenger", index = 0 })
    end
    if maxSeats >= 3 then
        table.insert(seats, { id = "rear_left", name = "Rear Left", index = 1 })
    end
    if maxSeats >= 4 then
        table.insert(seats, { id = "rear_right", name = "Rear Right", index = 2 })
    end
    for i = 3, maxSeats - 2 do
        if IsVehicleSeatAccessible(PlayerPedId(), vehicle, i, false, false) then
            table.insert(seats, { id = "seat_" .. i, name = "Seat " .. (i + 1), index = i })
        end
    end
    DebugPrint("Found " .. #seats .. " accessible seats")
    return seats
end

--- Opens the Vehicle Control UI and sends data to NUI.
--- @return nil
local OpenUI = function()
    if not isUIOpen then
        isUIOpen = true
        SetNuiFocus(true, true)
        local playerPed = PlayerPedId()
        local vehicle = GetVehiclePedIsIn(playerPed, false)
        if vehicle ~= 0 then
            local vehicleData = GetVehicleData(vehicle)
            SendNUIMessage({ type = "vehicleData", vehicleData = vehicleData })
            local seats = GetAvailableSeats(vehicle)
            SendNUIMessage({ type = "availableSeats", seats = seats })
        end
        SendNUIMessage({ type = "show" })
        DebugPrint("Vehicle Control UI opened")
    end
end

exports('OpenMenu', OpenUI)

RegisterNetEvent('sd-vehcontrol:client:openMenu', OpenUI)

--- Closes the Vehicle Control UI.
--- @return nil
local CloseUI = function()
    if isUIOpen then
        isUIOpen = false
        SetNuiFocus(false, false)
        SendNUIMessage({ type = "hide" })
        DebugPrint("Vehicle Control UI closed")
    end
end

--- Loads player settings from KVP.
--- @return table The loaded settings.
local LoadSettings = function()
    local settingsJson = GetResourceKvpString("vehcontrol_settings")
    if settingsJson then
        playerSettings = json.decode(settingsJson) or {}
    else
        playerSettings = {}
    end
    DebugPrint("Settings loaded:", json.encode(playerSettings))
    return playerSettings
end

--- Saves player settings to KVP.
--- @param settings table The settings to save.
--- @return nil
local SaveSettings = function(settings)
    playerSettings = settings
    SetResourceKvp("vehcontrol_settings", json.encode(settings))
    DebugPrint("Settings saved:", json.encode(settings))
end

--- Handles the 'vehcontrol' command; opens UI if in vehicle.
--- @return nil
RegisterCommand(Config.CommandName, function()
    local playerPed = PlayerPedId()
    if IsPedInAnyVehicle(playerPed, false) then
        OpenUI()
    else
        TriggerEvent("chat:addMessage", {
            color = {255, 0, 0},
            multiline = true,
            args = {"Vehicle Control", "You must be in a vehicle to use this command."}
        })
    end
end, false)

--- Registers the key mapping for opening the UI.
--- @return nil
RegisterKeyMapping(Config.CommandName, "Open Vehicle Control UI", "keyboard", Config.KeyBind)

--- Closes UI when NUI sends 'close'.
--- @param data table NUI data.
--- @param cb function Callback to invoke.
--- @return nil
RegisterNUICallback("close", function(data, cb)
    CloseUI()
    cb({})
end)

--- Sends available seats to NUI.
--- @param data table NUI data.
--- @param cb function Callback to invoke.
--- @return nil
RegisterNUICallback("getAvailableSeats", function(data, cb)
    local playerPed = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(playerPed, false)
    if vehicle ~= 0 then
        local seats = GetAvailableSeats(vehicle)
        SendNUIMessage({ type = "availableSeats", seats = seats })
    end
    cb({})
end)

--- Sends vehicle data to NUI.
--- @param data table NUI data.
--- @param cb function Callback to invoke.
--- @return nil
RegisterNUICallback("getVehicleData", function(data, cb)
    local playerPed = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(playerPed, false)
    if vehicle ~= 0 then
        local vehicleData = GetVehicleData(vehicle)
        SendNUIMessage({ type = "vehicleData", vehicleData = vehicleData })
    end
    cb({})
end)

--- Handles UI actions for engine, doors, windows, lights, etc.
--- @param data table Action data containing 'action', 'state', or 'seat'.
--- @param cb function Callback to invoke.
--- @return nil
RegisterNUICallback("action", function(data, cb)
    local playerPed = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(playerPed, false)
    if vehicle ~= 0 then
        if data.action == "engine" then
            local isEngineRunning = GetIsVehicleEngineRunning(vehicle)
            SetVehicleEngineOn(vehicle, not isEngineRunning, false, true)
            DebugPrint("Engine toggled:", not isEngineRunning)
        elseif data.action:find("door_") == 1 then
            local doorIndex = -1
            if data.action == "door_fl" then doorIndex = 0
            elseif data.action == "door_fr" then doorIndex = 1
            elseif data.action == "door_rl" then doorIndex = 2
            elseif data.action == "door_rr" then doorIndex = 3 end
            if doorIndex ~= -1 and DoesVehicleHaveDoor(vehicle, doorIndex) then
                if GetVehicleDoorAngleRatio(vehicle, doorIndex) > 0.0 then
                    SetVehicleDoorShut(vehicle, doorIndex, false)
                else
                    SetVehicleDoorOpen(vehicle, doorIndex, false, false)
                end
                DebugPrint("Door toggled:", doorIndex)
            end
        elseif data.action:find("window_") == 1 then
            local windowIndex = -1
            if data.action == "window_fl" then windowIndex = 0
            elseif data.action == "window_fr" then windowIndex = 1
            elseif data.action == "window_rl" then windowIndex = 2
            elseif data.action == "window_rr" then windowIndex = 3 end
            if windowIndex ~= -1 then
                if IsVehicleWindowIntact(vehicle, windowIndex) then
                    RollDownWindow(vehicle, windowIndex)
                else
                    RollUpWindow(vehicle, windowIndex)
                end
                DebugPrint("Window toggled:", windowIndex)
            end
        elseif data.action == "hood" then
            if DoesVehicleHaveDoor(vehicle, 4) then
                if GetVehicleDoorAngleRatio(vehicle, 4) > 0.0 then
                    SetVehicleDoorShut(vehicle, 4, false)
                else
                    SetVehicleDoorOpen(vehicle, 4, false, false)
                end
                DebugPrint("Hood toggled")
            end
        elseif data.action == "trunk" then
            if DoesVehicleHaveDoor(vehicle, 5) then
                if GetVehicleDoorAngleRatio(vehicle, 5) > 0.0 then
                    SetVehicleDoorShut(vehicle, 5, false)
                else
                    SetVehicleDoorOpen(vehicle, 5, false, false)
                end
                DebugPrint("Trunk toggled")
            end
        elseif data.action == "indicator_left" then
            SetVehicleIndicatorLights(vehicle, 1, data.state)
            DebugPrint("Left indicator toggled:", data.state)
        elseif data.action == "indicator_right" then
            SetVehicleIndicatorLights(vehicle, 0, data.state)
            DebugPrint("Right indicator toggled:", data.state)
        elseif data.action == "hazard" then
            SetVehicleIndicatorLights(vehicle, 0, data.state)
            SetVehicleIndicatorLights(vehicle, 1, data.state)
            DebugPrint("Hazard lights toggled:", data.state)
        elseif data.action == "lock" then
            local lockStatus = GetVehicleDoorLockStatus(vehicle)
            if lockStatus == 1 or lockStatus == 0 then
                SetVehicleDoorsLocked(vehicle, 2)
                PlayVehicleDoorCloseSound(vehicle, 1)
            else
                SetVehicleDoorsLocked(vehicle, 1)
                PlayVehicleDoorOpenSound(vehicle, 0)
            end
            DebugPrint("Lock toggled")
        elseif data.action:find("seat_") == 1 then
            if data.seat and IsVehicleSeatFree(vehicle, data.seat) then
                TaskWarpPedIntoVehicle(playerPed, vehicle, data.seat)
                DebugPrint("Changed to seat:", data.seat)
            else
                DebugPrint("Seat is occupied or invalid:", data.seat)
            end
        elseif data.action == "lights_interior" then
            SetVehicleInteriorlight(vehicle, not IsVehicleInteriorLightOn(vehicle))
            DebugPrint("Interior lights toggled")
        elseif data.action:find("neon_") == 1 then
            local idxMap = { neon_front = 2, neon_rear = 3, neon_left = 0, neon_right = 1 }
            if data.action ~= "neon_all" then
                local idx = idxMap[data.action]
                SetVehicleNeonLightEnabled(vehicle, idx, not IsVehicleNeonLightEnabled(vehicle, idx))
                DebugPrint(data.action .. " toggled")
            else
                local state = not IsVehicleNeonLightEnabled(vehicle, 0)
                for i = 0, 3 do SetVehicleNeonLightEnabled(vehicle, i, state) end
                DebugPrint("All neons toggled")
            end
        elseif data.action == "toggle_all" then
            local state, vd = data.state, GetVehicleData(vehicle)
            for i = 0, 5 do
                if DoesVehicleHaveDoor(vehicle, i) then
                    if state then SetVehicleDoorOpen(vehicle, i, false, false)
                    else SetVehicleDoorShut(vehicle, i, false) end
                end
            end
            for i = 0, 3 do
                if (i <= 1) or vd.windows.rl then
                    if state then RollDownWindow(vehicle, i) else RollUpWindow(vehicle, i) end
                end
            end
            DebugPrint("Toggled all doors and windows:", state)
        end
    end
    cb({})
end)

--- Saves settings received from NUI.
--- @param data table The settings data.
--- @param cb function Callback to invoke.
--- @return nil
RegisterNUICallback("saveSettings", function(data, cb)
    SaveSettings(data)
    cb({})
end)

--- Loads settings and sends them to NUI.
--- @param data table NUI data.
--- @param cb function Callback to invoke.
--- @return nil
RegisterNUICallback("loadSettings", function(data, cb)
    local settings = LoadSettings()
    SendNUIMessage({ type = "settings", settings = settings })
    cb({})
end)

--- Event handler for resource start; loads settings.
--- @param resourceName string The resource name.
--- @return nil
AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    DebugPrint('Vehicle Control UI started')
    LoadSettings()
end)

--- Event handler for resource stop; closes UI if open.
--- @param resourceName string The resource name.
--- @return nil
AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    if isUIOpen then CloseUI() end
    DebugPrint('Vehicle Control UI stopped')
end)

--- Monitors player exit and closes UI if open.
--- @return nil
CreateThread(function()
    while true do
        Wait(500)
        if isUIOpen and not IsPedInAnyVehicle(PlayerPedId(), false) then
            CloseUI()
        end
    end
end)