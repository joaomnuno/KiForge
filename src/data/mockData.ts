import type {
  ControllerOption,
  LibraryCategory,
  LibraryEntry,
  ProjectSummary,
  WorkspaceProject
} from "../types/domain";

export const appNavigation = [
  { key: "projects", label: "Projects", href: "/projects" },
  { key: "templates", label: "Templates", href: "/projects" },
  { key: "library", label: "Library", href: "/workspace/components" },
  { key: "devices", label: "Devices", href: "/workspace/components" },
  { key: "settings", label: "Settings", href: "/projects" }
] as const;

export const projectSummaries: ProjectSummary[] = [
  {
    id: "rocket-fc",
    name: "Rocket FC Rev A",
    controller: "STM32H743ZI",
    deviceCount: 8,
    interfaceCount: 5,
    lastEdited: "2 hours ago",
    summary: "Flight computer with sensor fusion, logging, and telemetry.",
    status: "Pin Mapping Incomplete"
  },
  {
    id: "telemetry-node",
    name: "CAN Telemetry Node",
    controller: "STM32F405RG",
    deviceCount: 5,
    interfaceCount: 3,
    lastEdited: "Yesterday",
    summary: "Compact communications board with CAN and debug access.",
    status: "Ready to Generate"
  },
  {
    id: "sensor-logger",
    name: "Sensor Logger",
    controller: "RP2040",
    deviceCount: 4,
    interfaceCount: 3,
    lastEdited: "3 days ago",
    summary: "USB logger with external flash and stacked sensors.",
    status: "Connections Defined"
  }
];

export const controllerOptions: ControllerOption[] = [
  {
    id: "stm32f405rg",
    name: "STM32F405RG",
    packageName: "LQFP-64",
    voltage: "3.3V logic",
    notes: "Good fit for medium-complexity sensor and logging boards.",
    protocols: ["SPI", "I2C", "UART", "USB", "SWD", "GPIO"],
    interfaces: ["SPI1", "SPI2", "SPI3", "I2C1", "I2C2", "USART1", "USART2"]
  },
  {
    id: "stm32h743zi",
    name: "STM32H743ZI",
    packageName: "LQFP-144",
    voltage: "3.3V logic",
    notes: "High-end controller for dense sensing, storage, and telemetry.",
    protocols: ["SPI", "I2C", "UART", "USB", "SWD", "GPIO"],
    interfaces: ["SPI1", "SPI2", "SPI3", "SPI4", "I2C1", "I2C2", "USART1"]
  },
  {
    id: "rp2040",
    name: "RP2040",
    packageName: "QFN-56",
    voltage: "3.3V logic",
    notes: "Simple dual-core option for tooling, debug, and utility boards.",
    protocols: ["SPI", "I2C", "UART", "USB", "GPIO"],
    interfaces: ["SPI0", "SPI1", "I2C0", "I2C1", "UART0", "UART1"]
  }
];

export const libraryCategories: LibraryCategory[] = [
  { id: "microcontrollers", label: "Microcontrollers" },
  { id: "memories", label: "Memories" },
  { id: "sensors", label: "Sensors" },
  { id: "communications", label: "Communications" },
  { id: "interfaces", label: "Interfaces" },
  { id: "debug", label: "Debug" }
];

export const libraryEntries: LibraryEntry[] = [
  {
    id: "w25q128jv",
    name: "W25Q128JV",
    categoryId: "memories",
    summary: "SPI NOR flash for high-rate logging and boot assets.",
    voltage: "2.7V - 3.6V",
    packageName: "SOIC-8 / WSON-8",
    supportedProtocols: ["SPI", "GPIO"]
  },
  {
    id: "icm-42688-p",
    name: "ICM-42688-P",
    categoryId: "sensors",
    summary: "6-axis IMU with low-noise accel and gyro readings.",
    voltage: "1.71V - 3.6V",
    packageName: "QFN-14",
    supportedProtocols: ["SPI", "I2C", "GPIO"]
  },
  {
    id: "bmp388",
    name: "BMP388",
    categoryId: "sensors",
    summary: "Precision barometric sensor with SPI and I2C support.",
    voltage: "1.65V - 3.6V",
    packageName: "LGA-10",
    supportedProtocols: ["SPI", "I2C", "GPIO"]
  },
  {
    id: "ch340k",
    name: "CH340K",
    categoryId: "communications",
    summary: "USB to UART bridge for bring-up, flashing, and diagnostics.",
    voltage: "3.3V / 5V",
    packageName: "MSOP-10",
    supportedProtocols: ["USB", "UART", "GPIO"]
  },
  {
    id: "tag-connect",
    name: "Tag-Connect SWD",
    categoryId: "debug",
    summary: "Compact SWD header footprint for debug and flashing.",
    voltage: "Board logic",
    packageName: "Connector footprint",
    supportedProtocols: ["SWD", "GPIO"]
  }
];

export const currentWorkspace: WorkspaceProject = {
  id: "rocket-flight-computer",
  name: "Rocket Flight Computer",
  controller: controllerOptions[0],
  status: "Pin Mapping Incomplete",
  voltageDomain: "3.3V",
  components: [
    {
      id: "flash",
      instanceName: "Flash",
      partName: "W25Q128JV",
      status: "Connected",
      preferredProtocol: "SPI"
    },
    {
      id: "imu-primary",
      instanceName: "Primary IMU",
      partName: "ICM-42688-P",
      status: "Partially defined",
      preferredProtocol: "SPI"
    },
    {
      id: "barometer",
      instanceName: "Barometer",
      partName: "BMP388",
      status: "Unconnected",
      preferredProtocol: "I2C"
    },
    {
      id: "usb-bridge",
      instanceName: "Debug UART",
      partName: "CH340K",
      status: "Connected",
      preferredProtocol: "UART"
    },
    {
      id: "debug-header",
      instanceName: "Debug Header",
      partName: "Tag-Connect SWD",
      status: "Connected",
      preferredProtocol: "SWD"
    }
  ],
  connections: [
    {
      id: "conn-flash",
      name: "Flash",
      peerPart: "W25Q128JV",
      protocol: "SPI",
      controllerInterface: "SPI1",
      pins: ["PA5", "PA6", "PA7", "PB0"],
      busMode: "Dedicated",
      optionalSignals: ["HOLD not connected", "WP not connected"],
      status: "Valid",
      assignments: [
        {
          signal: "SCK",
          selectedPin: "PA5",
          alternatePins: ["PB3"],
          status: "Valid"
        },
        {
          signal: "MISO",
          selectedPin: "PA6",
          alternatePins: ["PB4"],
          status: "Valid"
        },
        {
          signal: "MOSI",
          selectedPin: "PA7",
          alternatePins: ["PB5"],
          status: "Valid"
        },
        {
          signal: "CS",
          selectedPin: "PB0",
          alternatePins: ["Any free GPIO"],
          status: "Needs confirmation"
        }
      ]
    },
    {
      id: "conn-imu",
      name: "Primary IMU",
      peerPart: "ICM-42688-P",
      protocol: "SPI",
      controllerInterface: "SPI2",
      pins: ["PB13", "PB14", "PB15", "PB12"],
      busMode: "Dedicated",
      optionalSignals: ["INT -> PC4"],
      status: "Needs work",
      assignments: [
        {
          signal: "SCK",
          selectedPin: "PB13",
          alternatePins: ["PI1"],
          status: "Valid"
        },
        {
          signal: "MISO",
          selectedPin: "PB14",
          alternatePins: ["PC2"],
          status: "Valid"
        },
        {
          signal: "MOSI",
          selectedPin: "PB15",
          alternatePins: ["PC3"],
          status: "Valid"
        },
        {
          signal: "CS",
          selectedPin: "PB12",
          alternatePins: ["Any free GPIO"],
          status: "Conflict"
        }
      ]
    }
  ],
  issues: [
    {
      id: "issue-cs",
      severity: "warning",
      message: "PB12 is shared with a planned debug path and needs review."
    },
    {
      id: "issue-baro",
      severity: "info",
      message: "Barometer still needs a bus assignment."
    },
    {
      id: "issue-optional",
      severity: "error",
      message: "One optional interrupt line is still unassigned."
    }
  ]
};
