document.addEventListener("DOMContentLoaded", () => {
  const keyHint = document.getElementById("key-hint")
  const seatToggle = document.getElementById("seat-toggle")
  const seatMode = document.getElementById("seat-mode")
  const backBtn = document.getElementById("back-btn")
  const engineBtn = document.getElementById("engine-btn")
  const vehicleControls = document.getElementById("vehicle-controls")
  const controlsTab = document.getElementById("controls-tab")
  const lightsTab = document.getElementById("lights-tab")
  const settingsTab = document.getElementById("settings-tab")
  const tabs = document.querySelectorAll(".tab")
  const themeOptions = document.querySelectorAll(".theme-option")
  const scaleSlider = document.getElementById("scale-slider")
  const scaleValue = document.getElementById("scale-value")
  const dragToggle = document.getElementById("drag-toggle")
  const resetPosition = document.getElementById("reset-position")
  const tooltipContainer = document.getElementById("tooltip-container")
  const tooltipContent = document.getElementById("tooltip-content")
  const tooltipArrow = document.getElementById("tooltip-arrow")
  const dragHandle = document.getElementById("drag-handle")
  const closeBtn = document.querySelector(".close-btn")
  const seatsGrid = document.getElementById("seats-grid")
  const scrollIndicator = document.getElementById("scroll-indicator")
  const resourceName = window.GetParentResourceName ? GetParentResourceName() : "sd-vehcontrol"
  let seatModeActive = false
  let isDragging = false
  let dragEnabled = false
  let startX, startY, startLeft, startTop
  let currentThemeColor = "#4ade80"
  let allToggled = false
  let allNeonsToggled = false
  let vehicleData = {}

  const eyeToggle = document.getElementById("eye-toggle")
  let freeCameraEnabled = false

  if (tooltipContainer.parentElement !== document.body) {
    document.body.appendChild(tooltipContainer)
  }

  hideTooltip()
  vehicleControls.style.display = "none"
  loadSettings()

  function showTooltip(el, text) {
    tooltipContent.textContent = text
    const rect = el.getBoundingClientRect()
    if (tooltipContainer.parentElement !== document.body) document.body.appendChild(tooltipContainer)
    tooltipContainer.style.visibility = "hidden"
    tooltipContainer.style.opacity = "0"
    tooltipContainer.style.display = "block"
    const tipRect = tooltipContainer.getBoundingClientRect()
    const spaceRight = window.innerWidth - rect.right
    const spaceLeft = rect.left
    let arrowClass, left, transform
    if (spaceRight < tipRect.width + 10 && spaceLeft >= tipRect.width + 10) {
      arrowClass = "tooltip-arrow-left"
      left = rect.left - tipRect.width - 10
      transform = "translate(0, -50%)"
    } else {
      arrowClass = "tooltip-arrow-right"
      left = rect.right + 10
      transform = "translate(0, -50%)"
    }
    const top = rect.top + rect.height / 2
    tooltipContainer.style.left = left + "px"
    tooltipContainer.style.top = top + "px"
    tooltipContainer.style.transform = transform
    tooltipArrow.className = "tooltip-arrow " + arrowClass
    tooltipContent.style.backgroundColor = currentThemeColor
    if (arrowClass === "tooltip-arrow-right") {
      tooltipArrow.style.borderColor = `transparent ${currentThemeColor} transparent transparent`
    } else {
      tooltipArrow.style.borderColor = `transparent transparent transparent ${currentThemeColor}`
    }
    tooltipContainer.style.visibility = "visible"
    tooltipContainer.style.opacity = "1"
  }

  function hideTooltip() {
    tooltipContainer.style.opacity = "0"
    tooltipContainer.style.visibility = "hidden"
  }

  function initTooltips() {
    document.querySelectorAll("[data-tooltip]").forEach((el) => {
      if (el.closest("#settings-tab")) return
      el.addEventListener("mouseenter", () => showTooltip(el, el.getAttribute("data-tooltip")))
      el.addEventListener("mouseleave", hideTooltip)
    })
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      tabs.forEach((t) => t.classList.remove("active"))
      this.classList.add("active")
      const name = this.getAttribute("data-tab")
      if (name === "controls") {
        controlsTab.style.transform = "translateX(0)"
        lightsTab.style.transform = "translateX(100%)"
        settingsTab.style.transform = "translateX(200%)"
      } else if (name === "lights") {
        controlsTab.style.transform = "translateX(-100%)"
        lightsTab.style.transform = "translateX(0)"
        settingsTab.style.transform = "translateX(100%)"
      } else {
        controlsTab.style.transform = "translateX(-200%)"
        lightsTab.style.transform = "translateX(-100%)"
        settingsTab.style.transform = "translateX(0)"
        if (seatModeActive) toggleSeatMode()
      }
    })
  })

  themeOptions.forEach((opt) => {
    opt.addEventListener("click", function () {
      this.classList.add("btn-press")
      setTimeout(() => this.classList.remove("btn-press"), 200)
      themeOptions.forEach((o) => o.classList.remove("active"))
      this.classList.add("active")
      applyTheme(this.getAttribute("data-theme"))
      saveSettings()
    })
  })

  scaleSlider.addEventListener("input", function () {
    scaleValue.textContent = `${this.value}%`
    vehicleControls.style.transform = `scale(${this.value / 100})`
    saveSettings()
  })

  dragToggle.addEventListener("click", function () {
    this.classList.add("btn-press")
    setTimeout(() => this.classList.remove("btn-press"), 200)
    dragEnabled = !dragEnabled
    this.classList.toggle("active", dragEnabled)
    vehicleControls.classList.toggle("draggable", dragEnabled)
    saveSettings()
  })

  resetPosition.addEventListener("click", function () {
    this.classList.add("btn-press")
    setTimeout(() => this.classList.remove("btn-press"), 200)
    vehicleControls.style.position = ""
    vehicleControls.style.left = ""
    vehicleControls.style.top = ""
    saveSettings()
  })

  dragHandle.addEventListener("mousedown", (e) => {
    if (!dragEnabled) return
    isDragging = true
    startX = e.clientX
    startY = e.clientY
    const rect = vehicleControls.getBoundingClientRect()
    startLeft = rect.left
    startTop = rect.top
    vehicleControls.style.position = "fixed"
    vehicleControls.style.left = startLeft + "px"
    vehicleControls.style.top = startTop + "px"
    e.preventDefault()
  })

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return
    vehicleControls.style.left = startLeft + (e.clientX - startX) + "px"
    vehicleControls.style.top = startTop + (e.clientY - startY) + "px"
  })

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      saveSettings()
      isDragging = false
    }
  })

  function updateButtonVisibility(action, vis) {
    document.querySelectorAll(`[data-action="${action}"]`).forEach((btn) => {
      btn.classList.toggle("disabled", !vis)
      btn.style.display = vis ? "flex" : "none"
    })
  }

  function setupButtonListeners() {
    document.querySelectorAll(".control-btn").forEach((btn) => {
      if (btn.id !== "seat-toggle") {
        const nb = btn.cloneNode(true)
        btn.parentNode.replaceChild(nb, btn)
        nb.addEventListener("click", function () {
          const action = this.getAttribute("data-action")
          if (action === "toggle_all") {
            allToggled = !allToggled
            this.classList.toggle("active", allToggled)
            document
              .querySelectorAll(
                '[data-action^="door_"]:not(.disabled), [data-action="hood"]:not(.disabled), [data-action="trunk"]:not(.disabled), [data-action^="window_"]:not(.disabled)',
              )
              .forEach((b) => b.classList.toggle("active", allToggled))
            sendToFiveM("action", { action, state: allToggled })
            return
          }
          if (action === "neon_all") {
            allNeonsToggled = !allNeonsToggled
            this.classList.toggle("active", allNeonsToggled)
            document
              .querySelectorAll(
                '[data-action="neon_front"], [data-action="neon_rear"], [data-action="neon_left"], [data-action="neon_right"]',
              )
              .forEach((b) => b.classList.toggle("active", allNeonsToggled))
            sendToFiveM("action", { action, state: allNeonsToggled })
            return
          }
          this.classList.toggle("active")
          if (action.startsWith("door_") || action.startsWith("window_") || action === "hood" || action === "trunk")
            updateToggleAllButtonState()
          sendToFiveM("action", { action, state: this.classList.contains("active") })
        })
      }
    })
    initTooltips()
  }

  setupButtonListeners()

  function updateToggleAllButtonState() {
    const tb = document.querySelector('[data-action="toggle_all"]')
    const allBtns = document.querySelectorAll(
      '[data-action^="door_"]:not(.disabled), [data-action="hood"]:not(.disabled), [data-action="trunk"]:not(.disabled), [data-action^="window_"]:not(.disabled)',
    )
    const allOn = Array.from(allBtns).every((b) => b.classList.contains("active"))
    tb.classList.toggle("active", allOn)
    allToggled = allOn
  }

  engineBtn.addEventListener("click", function () {
    this.classList.add("btn-press")
    setTimeout(() => this.classList.remove("btn-press"), 200)
    this.classList.toggle("active")
    sendToFiveM("action", { action: this.getAttribute("data-action"), state: this.classList.contains("active") })
  })

  seatToggle.addEventListener("click", function () {
    this.classList.add("btn-press")
    setTimeout(() => this.classList.remove("btn-press"), 200)
    toggleSeatMode()
    sendToFiveM("getAvailableSeats", {})
  })

  backBtn.addEventListener("click", function () {
    this.classList.add("btn-press")
    setTimeout(() => this.classList.remove("btn-press"), 200)
    toggleSeatMode()
  })

  function createSeatButtons(seats) {
    seatsGrid.innerHTML = ""
    seats.forEach((s) => {
      const b = document.createElement("div")
      b.className = "seat-btn"
      b.setAttribute("data-tooltip", s.name)
      b.setAttribute("data-action", `seat_${s.id}`)
      b.setAttribute("data-seat", s.index)
      const i = document.createElement("i")
      if (s.id === "driver") i.className = "fas fa-user-tie"
      else if (s.id === "passenger") i.className = "fas fa-user"
      else if (s.id.includes("left")) i.className = "fas fa-user-friends"
      else if (s.id.includes("right")) i.className = "fas fa-user-friends fa-flip-horizontal"
      else i.className = "fas fa-chair"
      b.appendChild(i)
      seatsGrid.appendChild(b)
      b.addEventListener("click", function () {
        this.classList.add("btn-press")
        setTimeout(() => this.classList.remove("btn-press"), 200)
        seatsGrid.querySelectorAll(".seat-btn").forEach((x) => x.classList.remove("active"))
        this.classList.add("active")
        sendToFiveM("action", {
          action: this.getAttribute("data-action"),
          seat: Number(this.getAttribute("data-seat")),
        })
      })
    })
    initTooltips()
    updateScrollIndicator()
  }

  function updateScrollIndicator() {
    scrollIndicator.classList.toggle("visible", seatsGrid.scrollHeight > seatsGrid.clientHeight)
  }

  seatsGrid.addEventListener("scroll", () => {
    scrollIndicator.classList.toggle(
      "visible",
      seatsGrid.scrollTop <= 10 && seatsGrid.scrollHeight > seatsGrid.clientHeight,
    )
  })

  closeBtn.addEventListener("click", function () {
    this.classList.add("btn-press")
    setTimeout(() => this.classList.remove("btn-press"), 200)
    hideTooltip()
    sendToFiveM("close", {})
  })

  eyeToggle.addEventListener("click", function () {
    this.classList.add("btn-press")
    setTimeout(() => this.classList.remove("btn-press"), 200)
    freeCameraEnabled = !freeCameraEnabled
    this.classList.toggle("active", freeCameraEnabled)

    const eyeIcon = this.querySelector("i")
    eyeIcon.classList.toggle("fa-eye", freeCameraEnabled)
    eyeIcon.classList.toggle("fa-eye-slash", !freeCameraEnabled)

    sendToFiveM("toggleFreeCamera", { enabled: freeCameraEnabled })

    this.setAttribute("data-tooltip", freeCameraEnabled ? "Disable Free Movement" : "Enable Free Movement")
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault()
      return
    }

    if (e.key === "e") engineBtn.click()
    else if (e.key === "c") eyeToggle.click()
    else if (e.key === "s" && !seatModeActive) {
      seatToggle.click()
    } else if (e.key === "t") {
      const at = document.querySelector(".tab.active")
      ;(at.nextElementSibling || tabs[0]).click()
    } else if (e.key === "l") tabs[1].click()
    else if (e.key === "Escape") closeBtn.click()
  })

  function toggleSeatMode() {
    seatModeActive = !seatModeActive
    seatMode.classList.toggle("active", seatModeActive)
    if (seatModeActive) updateScrollIndicator()
  }

  function applyTheme(theme) {
    document.documentElement.classList.remove("theme-green", "theme-blue", "theme-red", "theme-purple")
    document.querySelectorAll(".active:not(.tab):not(.theme-option)").forEach((el) => (el.style.backgroundColor = ""))
    switch (theme) {
      case "blue":
        currentThemeColor = "#3b82f6"
        break
      case "red":
        currentThemeColor = "#ef4444"
        break
      case "purple":
        currentThemeColor = "#8b5cf6"
        break
      default:
        currentThemeColor = "#4ade80"
    }
    document
      .querySelectorAll(".active:not(.tab):not(.theme-option)")
      .forEach((el) => (el.style.backgroundColor = currentThemeColor))
    document.querySelectorAll(".category-title").forEach((t) => (t.style.color = currentThemeColor))
    const style = document.createElement("style")
    style.id = "theme-style"
    style.textContent = `
      .tab.active{border-bottom-color:${currentThemeColor};color:${currentThemeColor}}
      .scale-slider::-webkit-slider-thumb{background:${currentThemeColor}}
      .scale-slider::-moz-range-thumb{background:${currentThemeColor}}
      .toggle-btn.active{background-color:${currentThemeColor}}
      .settings-title{color:${currentThemeColor}}
      .category-title{color:${currentThemeColor}}
    `
    document.documentElement.style.setProperty("--theme-color", currentThemeColor)
    document.head.appendChild(style)
  }

  function sendToFiveM(type, data) {
    if (window.invokeNative) {
      fetch(`https://${resourceName}/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify(data),
      })
    }
  }

  function saveSettings() {
    sendToFiveM("saveSettings", {
      theme: document.querySelector(".theme-option.active").getAttribute("data-theme"),
      scale: scaleSlider.value,
      dragEnabled,
      position: {
        left: vehicleControls.style.left,
        top: vehicleControls.style.top,
        position: vehicleControls.style.position,
      },
    })
  }

  function updateVehicleSpecificOptions(data) {
    vehicleData = data

    const bikeClasses = [8, 13]
    const isBike = bikeClasses.includes(data.class)
    ;["fl", "fr", "rl", "rr"].forEach((k) => updateButtonVisibility(`door_${k}`, !isBike && data.doors[k]))
    updateButtonVisibility("hood", !isBike && data.doors.hood)
    updateButtonVisibility("trunk", !isBike && data.doors.trunk)
    ;["fl", "fr", "rl", "rr"].forEach((k) => updateButtonVisibility(`window_${k}`, !isBike && data.windows[k]))

    updateButtonVisibility("lights_interior", !isBike)

    const neonCat = document.querySelector(".lights-category:nth-child(2)")
    if (neonCat) {
      neonCat.style.display = !isBike && data.hasNeons ? "block" : "none"
    }

    const anyDoors = !isBike && Object.values(data.doors).some((v) => v)
    const anyWindows = !isBike && Object.values(data.windows).some((v) => v)
    updateButtonVisibility("toggle_all", anyDoors || anyWindows)

    initTooltips()
  }

  function loadSettings() {
    sendToFiveM("loadSettings", {})
  }

  function initEyeToggle() {
    updateEyeToggleState()
  }

  window.addEventListener("message", (e) => {
    const d = e.data
    if (d.type === "settings") {
      if (d.settings.theme) {
        themeOptions.forEach((o) => o.classList.remove("active"))
        const opt = document.querySelector(`.theme-option[data-theme="${d.settings.theme}"]`)
        if (opt) {
          opt.classList.add("active")
          applyTheme(d.settings.theme)
        }
      }
      if (d.settings.scale) {
        scaleSlider.value = d.settings.scale
        scaleValue.textContent = `${d.settings.scale}%`
        vehicleControls.style.transform = `scale(${d.settings.scale / 100})`
      }
      if (typeof d.settings.dragEnabled === "boolean") {
        dragEnabled = d.settings.dragEnabled
        dragToggle.classList.toggle("active", dragEnabled)
        vehicleControls.classList.toggle("draggable", dragEnabled)
      }
      if (d.settings.position) {
        if (d.settings.position.position) vehicleControls.style.position = d.settings.position.position
        if (d.settings.position.left) vehicleControls.style.left = d.settings.position.left
        if (d.settings.position.top) vehicleControls.style.top = d.settings.position.top
      }
    } else if (d.type === "show") {
      vehicleControls.style.display = "block"
      sendToFiveM("getVehicleData", {})

      if (d.freeCameraState !== undefined) {
        freeCameraEnabled = d.freeCameraState
        updateEyeToggleState()
      } else {
        freeCameraEnabled = false
        updateEyeToggleState()
      }
    } else if (d.type === "hide") {
      vehicleControls.style.display = "none"
    } else if (d.type === "availableSeats") {
      createSeatButtons(d.seats)
    } else if (d.type === "vehicleData") {
      updateVehicleSpecificOptions(d.vehicleData)
      setupButtonListeners()
    }
  })

  function updateEyeToggleState() {
    eyeToggle.classList.toggle("active", freeCameraEnabled)
    const eyeIcon = eyeToggle.querySelector("i")
    eyeIcon.classList.toggle("fa-eye", freeCameraEnabled)
    eyeIcon.classList.toggle("fa-eye-slash", !freeCameraEnabled)
    eyeToggle.setAttribute("data-tooltip", freeCameraEnabled ? "Disable Free Move" : "Enable Free Move")
  }

  vehicleControls.style.display = "none"
})
