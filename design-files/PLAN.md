Below is a UI-first product definition for the app, focused only on the interface and the user flow you asked for.

## Main objective of the app

The app exists to let the user define a hardware design at a **logical connection level** before opening KiCad.

The user should be able to say:

* “This project uses this microcontroller.”
* “I want to add these peripherals.”
* “This device should connect over SPI, this one over I2C, this one over UART.”
* “Show me which pins are possible.”
* “Let me choose or override the suggested mapping.”
* “Generate a starter schematic/project structure from that.”

So the UI is not a schematic editor. It is a **project-definition workspace**.

Its job is to help the user go from **idea** to **cleanly specified connectivity plan**.

The user should feel like they are building a **system architecture**, not dragging symbols around manually.

A good mental model is:

* KiCad = the place where the real schematic lives
* this app = the place where project structure and connectivity are planned

That means the UI should feel more like a mix of:

* project manager
* hardware configurator
* connection planner
* pin assignment assistant

and less like a CAD canvas.

---

# 1. General UI philosophy

## 1.1 What the interface should feel like

The interface should feel:

* structured
* technical
* calm
* dense enough for serious work
* but not visually noisy

It should feel closer to a professional engineering tool than a flashy startup app.

A good tone is:

* dark and light theme support
* left sidebar navigation
* central working area
* right-side contextual inspector
* top toolbar with project actions
* tables/cards/tree views rather than huge decorative panels

The user should always feel they are doing one of four things:

* managing projects
* defining parts
* defining connections
* resolving pin mappings

## 1.2 The core UI rule

Every major screen should answer one main question.

For example:

* Projects page: “What am I working on?”
* New project page: “What am I creating?”
* Component selection page: “What devices are in this design?”
* Connection page: “How do these devices talk?”
* Pin mapping page: “Which concrete pins are used?”

That keeps the app mentally clean.

---

# 2. First page: “My Projects”

This is the home screen when the user opens the app.

Its purpose is to make it easy to:

* resume a project
* create a new project
* duplicate a previous project
* browse templates
* quickly understand project status

## 2.1 Main layout

The page is divided into five main regions.

### A. Top bar

At the very top:

* app name/logo on the left
* global search in the center or slightly left
* settings/profile/app preferences on the right

The top bar should feel minimal.

Contents:

* app logo
* search box: “Search projects, MCUs, peripherals…”
* button: “New Project”
* small icon buttons for settings/help

The “New Project” button should be visually prominent.

### B. Left sidebar

A persistent left sidebar with navigation items:

* Projects
* Templates
* Component Library
* Recent Devices
* Settings

The active section is highlighted.

This makes the app feel like a desktop tool, not a wizard trapped in a single window.

### C. Main content header

At the top of the main content area:

* title: “My Projects”
* subtitle: “Create and manage hardware starter projects”
* quick filters or tabs below the title

Tabs could be:

* All Projects
* Recent
* Favorites
* Templates
* Archived

### D. Project list/grid area

This is the heart of the page.

The user should be able to switch between:

* grid card view
* compact table/list view

Grid is better visually for small numbers of projects.
List is better for serious users with many projects.

### E. Bottom status or recent activity strip

Optional but useful:

* last opened project
* recently generated files
* warnings from unresolved projects
* app version / library version / catalog status

---

## 2.2 Project card design

Each project card should show enough information to understand the project without opening it.

Each card contains:

* project name
* small status badge
* target MCU
* number of devices
* number of defined connections
* last modified date
* small summary line
* quick actions

Example content:

**Rocket FC Rev A**
STM32H743ZI · 8 devices · 5 interfaces
Last edited 2 hours ago
Status: Pin mapping incomplete

Quick actions on hover or in a small menu:

* Open
* Duplicate
* Rename
* Export
* Generate KiCad starter
* Delete

Status badge colors matter a lot here. They make the app feel alive.

Suggested states:

* Draft
* Components Selected
* Connections Defined
* Pin Mapping Incomplete
* Ready to Generate
* Generated
* Has Conflicts

This is important because the user should understand progress before opening the project.

---

## 2.3 Search and filtering on the projects page

The search bar should support:

* project name
* MCU name
* component names
* tags

The filter row can include:

* Status
* MCU family
* Last edited
* Favorites
* Ready to generate only

This gives the page a professional feel immediately.

---

## 2.4 Empty state

If there are no projects yet, the screen should not feel blank and sad.

Instead, show:

* a centered message
* a clear “Create New Project” button
* maybe 2 or 3 starter template cards underneath

Example empty state structure:

Title: **No projects yet**
Text: “Create your first hardware starter project by selecting a controller and connecting peripherals logically.”
Buttons:

* Create New Project
* Browse Templates

Below that:

* STM32 sensor node
* RP2040 utility board
* ESP32 data logger

This makes the first-run experience much stronger.

---

## 2.5 What happens when the user clicks a project

Clicking a project opens the project workspace.

This workspace should have its own left navigation inside the project, something like:

* Overview
* Components
* Connections
* Pin Mapping
* Output

That way the user always knows where they are in the process.

But since you asked only up to the selection/connection part, I’ll focus on the relevant pages below.

---

# 3. Page to create a new project

This page starts when the user clicks “New Project.”

This should not feel like a giant long form.
It should feel like a **guided project setup screen**.

The purpose is to define the high-level identity of the project before choosing devices.

## 3.1 Main layout

The page can be a centered form with supporting panels, or a two-column layout.

A very good layout would be:

* main form in the center-left
* explanation / template suggestions / recent choices on the right

The top of the page:

* title: “Create New Project”
* small description: “Set up the basic identity and target platform for your hardware project.”

At the bottom:

* Cancel
* Create Project

## 3.2 Fields on the new project page

The form should include:

### A. Project name

A normal text input.

Placeholder:

* “Flight Controller Rev A”
* “STM32 Sensor Board”
* “CAN Telemetry Node”

### B. Description

A multiline text area, optional.

This is useful for giving context later in the project overview.

### C. Target controller / main board device

This is the most important field.

This should be a searchable selector, not a plain dropdown.

The user should be able to search for:

* STM32F405RG
* RP2040
* ATSAMD21
* ESP32-S3

When selected, a side preview card appears showing:

* package
* available protocols
* pin count
* voltage domain
* short notes

This makes the app feel intelligent without doing magic.

### D. Project template

Optional field.

Choices like:

* Blank project
* Sensor board
* Data logger
* Communications node
* MCU + external flash starter
* MCU + IMU + barometer starter

This is optional, but nice.

### E. Default voltage domain

A selector such as:

* 3.3V
* 5V
* mixed
* undecided

### F. Naming convention

Optional but useful:

* Default net naming style
* Reference style
* Project output naming style

For MVP this can be hidden under “Advanced.”

### G. Output target

A small section saying:

* Generate KiCad project
* Generate components only
* Generate starter sheet structure

This should probably default to “Generate KiCad starter project.”

---

## 3.3 Right-side helper panel on the new project page

This side panel makes the page feel rich and useful.

It can show:

* recent controllers you used
* recommended devices for selected controller
* package preview
* project starter tips

Example:

When user picks STM32F405RG, the panel updates to say:

**Selected controller**

* STM32F405RG
* 64 pins
* SPI: 3
* I2C: 3
* UART: 6
* Voltage: 3.3V logic

And maybe:
“Good fit for sensor fusion, logging, and medium-complexity embedded boards.”

This adds trust.

---

## 3.4 Bottom action behavior

At the bottom:

* Back or Cancel on the left
* Continue on the right

Once clicked, the app creates the project and goes to the project workspace, landing either in:

* Overview
  or
* Components

I would recommend it opens directly in **Components**, because that is the natural next step.

---

# 4. Project workspace structure after creation

Once the project exists, the user should enter a project-specific interface.

Even before the user gets to component selection, there should be a stable frame around the process.

## 4.1 Project workspace layout

The layout should be:

### Top project bar

Shows:

* project name
* MCU name
* project status
* Save
* Generate
* Export

### Left project navigation

Inside the project:

* Overview
* Components
* Connections
* Pin Mapping
* Output

### Main working area

Changes depending on the selected section.

### Right inspector panel

Shows context-sensitive information:

* selected component info
* selected connection details
* valid protocols
* warnings

This right inspector is very important. It makes the app feel like a serious tool.

---

# 5. Components page: selecting what component I want to connect

This is the first major working page after project creation.

Its purpose is:

* choose what devices exist in the project
* define which one is the central controller
* build the hardware inventory before connecting anything

This is not yet the “how” page.
It is the “what exists” page.

## 5.1 Main layout

This page works best as a three-panel view.

### Left panel: categories/library browser

Categories like:

* Memories
* Sensors
* Communications
* Power
* Interfaces
* Debug
* Storage
* Displays
* Custom

### Center panel: component library results

Shows searchable cards or rows of devices in the selected category.

### Right panel: selected project components

Shows the list of components already added to the project.

This gives the user a clean flow:

browse on left, inspect in center, build system on right.

---

## 5.2 Top controls on the components page

At the top of the center panel:

* search bar: “Search components…”
* filters
* sort controls

Filters could include:

* protocol
* voltage
* manufacturer
* package
* popular/common
* verified library entry only

This matters because the experience must not feel like a dumb giant dump of parts.

---

## 5.3 Component cards in the library view

Each component card should show:

* device name
* category
* short purpose
* supported interfaces
* voltage
* package
* add button

Example:

**W25Q128JV**
SPI NOR Flash Memory
Interfaces: SPI / QSPI
Voltage: 2.7–3.6V
Package: SOIC-8 / WSON
[Add to Project]

Or:

**ICM-42688-P**
6-axis IMU
Interfaces: SPI / I2C
Voltage: 1.71–3.6V
Package: QFN
[Add to Project]

This gives enough information to choose quickly.

---

## 5.4 Project component list on the right

The right panel is the growing list of components in the project.

Each item should show:

* instance name
* part name
* current connection status
* quick edit button
* delete button

For example:

* U1 — STM32F405RG — Main Controller
* U2 — W25Q128JV — Not connected
* U3 — ICM-42688-P — Not connected
* U4 — BMP388 — Not connected

The user should also be able to rename logical instances:

* “Flash”
* “Primary IMU”
* “Backup IMU”
* “Radio”
* “USB Bridge”

This makes later connection screens much clearer than repeating raw manufacturer part numbers everywhere.

---

## 5.5 Adding a component

When the user clicks “Add to Project,” one of two things should happen.

### Simple case

The component is immediately added.

### Slightly richer case

A small dialog appears asking:

* instance name
* preferred package variant
* preferred interface variant, if relevant

This is useful for parts that support more than one protocol.

For example, if the user adds a sensor that supports SPI and I2C, the dialog could ask:

**Preferred default interface**

* SPI
* I2C
* Decide later

This is very strong UX, because it reduces future ambiguity.

---

## 5.6 Visual feedback after adding components

As components are added, the project status should update.

For example:

* “4 components selected”
* “3 components need connection definitions”

This motivates the next step.

The page should also have a clear button:

**Continue to Connections**

---

# 6. Connection selection screen: what component I want to connect with and how I can connect it

This is the main value page of the whole app.

This is where the user defines the logical communication structure.

This page should feel like the heart of the product.

Its purpose is to answer:

* which devices are connected
* by what protocol
* in what role
* to which available MCU peripheral
* and eventually to which physical pins

## 6.1 Main layout of the connections page

A very good layout would be a split workspace with four distinct regions.

### Left sidebar: project devices

Lists all current project components.

### Center top: connection graph or logical list

Shows connections already defined.

### Center bottom or main editor area: connection builder

Where the user creates or edits a connection.

### Right inspector: protocol/pin details

Shows compatible options, warnings, and pin candidates.

This page can be shown in either:

* list-based mode
  or
* graph-based mode

For MVP, list-based mode is safer.
A graph view can be an enhancement.

---

## 6.2 Left device list on the connections page

Each device entry shows:

* instance name
* part name
* supported protocols
* connection status

Example:

* Flash — W25Q128JV — SPI/QSPI — Unconnected
* IMU — ICM-42688-P — SPI/I2C — Unconnected
* Debug UART — CH340K — UART — Connected
* Barometer — BMP388 — SPI/I2C — Partially defined

Clicking a device should filter the editor to that device.

---

## 6.3 The “Create Connection” action

There should be a large obvious button:

**New Connection**

Clicking it opens a structured connection builder panel or modal.

This builder should follow a sequence.

---

# 7. Detailed UI flow for creating a connection

This is the most important flow in the whole app.

The user clicks **New Connection**.

A multi-step panel opens.

## Step 1: Choose source and target devices

The panel shows two selectors:

* Controller / host
* Peripheral / peer

Usually the MCU is already assumed as the host, but it is still useful to show it explicitly.

For example:

**Connect**
[ STM32F405RG ]
to
[ W25Q128JV ]

Below this, a compatibility hint appears.

Example:
“Compatible protocols found: SPI, QSPI”

If there is only one compatible protocol, the UI can preselect it.

---

## Step 2: Choose protocol

This section appears next.

If multiple valid protocol options exist, the user chooses one.

Example options:

* SPI
* I2C
* UART
* CAN
* USB
* GPIO
* SWD
* PWM
* ADC input

Each protocol option should be shown as a selectable card or segmented control, not a boring dropdown.

Each option card can show:

* protocol name
* device role compatibility
* required signals
* optional signals
* notes

Example for SPI:

**SPI**
Required: SCK, MOSI, MISO, CS
Optional: INT, RESET, WP, HOLD
Controller role: Master
Peripheral role: Slave

This makes the interface educational too.

---

## Step 3: Choose peripheral instance on the controller

If the controller has multiple SPI peripherals, the app asks:

**Which controller interface should be used?**

Options:

* SPI1
* SPI2
* SPI3

Each option should show current usage.

For example:

* SPI1 — Unused
* SPI2 — Already shared with IMU
* SPI3 — Unused

This is a huge part of the app’s usefulness.
The user can intentionally reuse or avoid reuse.

For I2C it might show:

* I2C1 — Already used by Barometer and Magnetometer
* I2C2 — Unused

This immediately gives architectural visibility.

---

## Step 4: Choose pin mapping

Now the app gets concrete.

The UI should show the available pin mapping options for the selected controller peripheral.

For example:

**SPI1 available mappings**

* SCK: PA5, MISO: PA6, MOSI: PA7
* SCK: PB3, MISO: PB4, MOSI: PB5

Then a separate field:
**Chip select**

* Auto-suggest GPIO
* Pick manually

This is where the user starts deciding what exact pins are used.

The UI for this should be very visual.

A good design is:

### A. Protocol signal table

A table with columns:

* Signal
* Selected pin
* Alternate options
* Status

Example:

| Signal | Selected pin | Alternate options | Status             |
| ------ | ------------ | ----------------- | ------------------ |
| SCK    | PA5          | PB3               | Valid              |
| MISO   | PA6          | PB4               | Valid              |
| MOSI   | PA7          | PB5               | Valid              |
| CS     | PB0          | Any free GPIO     | Needs confirmation |

### B. Controller pin map mini-view

On the right, show a package pinout preview or a logical pin list, highlighting currently chosen pins.

This makes the screen feel advanced and satisfying.

---

## Step 5: Choose shared bus behavior if relevant

If the protocol allows sharing, the app should ask clearly.

For SPI:

* Dedicated SPI bus
* Share SPI bus with existing devices

If shared is chosen:

* SCK/MISO/MOSI reuse the same bus pins
* device gets a unique CS pin

For I2C:

* likely reuse existing SDA/SCL pair
* show pull-up status note, but no deep electrical logic yet

This choice should be shown in plain language.

Example:

**Bus usage**

* Create new SPI bus
* Join existing SPI1 bus used by Flash

And below:
“This will reuse SCK/MISO/MOSI and allocate a new chip select line.”

Very clean. Very understandable.

---

## Step 6: Optional extra signals

Many peripherals need extra sideband signals.

The UI should have an expandable section:

**Optional and auxiliary signals**

Possible items:

* Interrupt pin
* Reset pin
* Data ready pin
* Enable pin
* Boot pin
* Wake pin

Each optional signal row should let the user choose:

* Do not connect
* Auto-assign
* Choose manually

This is much better than forcing everything into the main flow.

---

## Step 7: Review and confirm connection

Before saving, show a final summary card.

Example:

**Connection Summary**

* Flash ↔ STM32F405RG
* Protocol: SPI
* Controller interface: SPI1
* Pins:

  * SCK → PA5
  * MISO → PA6
  * MOSI → PA7
  * CS → PB0
* Shared bus: No
* Optional pins:

  * HOLD: not connected
  * WP: not connected

Buttons:

* Save Connection
* Back
* Cancel

This summary is important because it reduces silent mistakes.

---

# 8. What the main connection screen looks like after several devices are connected

Once the user has defined multiple connections, the main page should show a clear structured list.

Each connection appears as a card or row.

Example:

### Connection card

**Flash**
W25Q128JV ↔ STM32F405RG
Protocol: SPI
Interface: SPI1
Pins: PA5 / PA6 / PA7 / PB0
Status: Valid

Buttons:

* Edit
* Duplicate
* Remove

Another:

**IMU**
ICM-42688-P ↔ STM32F405RG
Protocol: SPI
Interface: SPI2
Pins: PB13 / PB14 / PB15 / PB12
INT: PC4
Status: Valid

This lets the user inspect the design at a glance.

---

# 9. How pin selection should feel in the interface

This matters a lot, because this is where the app can either feel powerful or annoying.

It should not feel like typing into forms.
It should feel like guided assignment.

## 9.1 Suggested pin selection widget

For each signal, the user should see:

* current chosen pin as a small chip/tag
* dropdown to change
* validation icon
* hover info

For example:

**SCK**
[ PA5 ▼ ] ✅

Clicking the dropdown reveals:

* PA5 — SPI1_SCK
* PB3 — SPI1_SCK
* PC10 — SPI3_SCK

Unavailable options should be shown but disabled when relevant.

This is important because the user learns from the UI.

---

## 9.2 Conflict visibility

If a pin is already used, the UI should make that very obvious.

Example:

**PB3**
Used by: Debug Header / SWO
Status: Conflict

Or:

**PA9**
Reserved by: USART1_TX

This should appear inline, not hidden in a later warning page.

---

## 9.3 Automatic suggestion behavior

The app should never silently decide everything without showing it.

Instead, use a button:

* Auto-assign recommended pins

Then show the results explicitly.

That is much better than “magic.”

The user sees:

* what was chosen
* why it was valid
* and can still override it

---

# 10. Detailed page structure for the connection/pin assignment screen

If you want this to feel like a serious app, the page should have a very stable structure.

## 10.1 Page header

At the top:

**Connections**
“Define how project devices communicate and assign controller interfaces.”

Small stats on the right:

* 4/6 devices connected
* 2 unresolved conflicts
* 1 unassigned optional signal

Buttons:

* New Connection
* Auto-assign Suggestions
* Validate

---

## 10.2 Left panel: device navigator

This panel contains the project devices in a vertical list.

Each device row includes:

* instance name
* protocol badges
* status dot

Clicking a device filters the main area.

This gives the user control when the project grows.

---

## 10.3 Center panel: connections list/editor

Main content shows either:

* list of current connections
  or
* detail editor for a selected connection

A very good pattern is:

* top half = current defined connections
* bottom half = editor for selected connection

That avoids too much navigation.

---

## 10.4 Right panel: contextual inspector

This is the most professional-looking part if done well.

When a connection is selected, the inspector shows:

* device summary
* compatible protocols
* valid peripheral instances
* available pin options
* conflicts/warnings
* notes

Example sections:

* Device Info
* Protocol Details
* Controller Availability
* Pin Candidates
* Warnings

This right-side inspector makes the app feel deep without cluttering the main workspace.

---

# 11. How the flow should feel from page to page

The full flow you asked for should feel like this:

## 11.1 Home

“I see my projects and continue where I left off.”

## 11.2 New project

“I define the project identity and choose my controller.”

## 11.3 Components

“I add the devices I want in the design.”

## 11.4 Connections

“I define how each device communicates with the controller.”

## 11.5 Pin selection

“I choose concrete peripheral instances and physical pins.”

That is the entire emotional journey of the MVP.

The app should feel like it is progressively making the design more concrete:

* project
* devices
* protocols
* interfaces
* pins

That is the right abstraction ladder.

---

# 12. A concrete example of the full UI flow

To make it more real, here is how a user session should look.

## 12.1 On the projects page

User sees:

* Flight Controller
* Telemetry Board
* Sensor Logger

Clicks: **New Project**

## 12.2 On create new project page

User fills:

* Project Name: “Rocket Flight Computer”
* Description: “Main MCU board with logging and sensors”
* Controller: STM32H743ZI
* Template: Blank Project
* Voltage: 3.3V

Clicks: **Create Project**

## 12.3 On components page

User adds:

* W25Q128JV
* ICM-42688-P
* BMP388
* USB-C connector
* Debug header

Right panel now shows 5 devices.

Clicks: **Continue to Connections**

## 12.4 On connections page

Clicks: **New Connection**

Chooses:

* STM32H743ZI ↔ W25Q128JV
* Protocol: SPI
* Interface: SPI1
* Mapping:

  * SCK → PA5
  * MISO → PA6
  * MOSI → PA7
  * CS → PB0

Saves.

Repeats for IMU:

* Protocol: SPI
* Interface: SPI2
* pins chosen
* optional INT line connected

Repeats for BMP388:

* Protocol: I2C
* Interface: I2C1
* SCL/SDA assigned
* maybe INT left disconnected

Now the connection page shows a clean defined architecture.

That is exactly the kind of UX the app should deliver.

---

# 13. What should not be in this UI

To keep the MVP strong, the interface should avoid trying to do too much.

Do not turn the first version into:

* a full schematic editor
* a PCB layout tool
* a simulator
* a rule-heavy ERC system
* a power design checker
* an auto-routing engine

The UI should stay focused on:

* selecting devices
* selecting protocols
* selecting interfaces
* selecting pins
* showing conflicts

That focus is what makes it good.

---

# 14. Final condensed UI structure

If I compress everything into a clean app map, it becomes:

## Main objective

Create a starter hardware project by defining devices, protocols, and pin mappings before generating a KiCad-ready structure.

## Page 1: My Projects

* project cards/list
* status badges
* search/filter
* create new project
* open/duplicate/export/delete

## Page 2: Create New Project

* project name
* description
* controller selection
* optional template
* voltage domain
* create button

## Page 3: Components

* library browser
* search/filter
* device cards
* add to project
* project component list on the right

## Page 4: Connections

* device list on the left
* current connection list in center
* connection builder/editor
* inspector on the right

## Connection flow

* choose devices
* choose protocol
* choose controller interface instance
* choose pins
* define shared bus behavior
* add optional extra signals
* review and save

## Pin selection UI

* per-signal mapping rows
* valid alternatives
* conflict warnings
* package/pin preview
* auto-suggest but never hidden magic
