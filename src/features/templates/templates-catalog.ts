import type { OutputTarget, VoltageDomain } from "../../types/domain";

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  highlight: string;
  controllerId: string;
  voltageDomain: VoltageDomain;
  outputTarget: OutputTarget;
  defaultProjectName: string;
  defaultDescription: string;
  componentCatalogIds: readonly string[];
  tags: readonly string[];
}

export const projectTemplates: readonly ProjectTemplate[] = [
  {
    id: "blank-project",
    name: "Blank project",
    description:
      "Start from a clean slate. Pick a controller and add devices as you go.",
    highlight: "No defaults",
    controllerId: "rp2040",
    voltageDomain: "3.3V",
    outputTarget: "Generate KiCad starter project",
    defaultProjectName: "New project",
    defaultDescription:
      "Describe the board you want to build before adding controllers and devices.",
    componentCatalogIds: [],
    tags: ["Flexible", "Starter"]
  },
  {
    id: "stm32-flight-controller",
    name: "STM32 flight controller",
    description:
      "High-rate sensing and logging board with a six-axis IMU and barometer.",
    highlight: "STM32F405 + IMU + barometer",
    controllerId: "stm32f405rg",
    voltageDomain: "3.3V",
    outputTarget: "Generate KiCad starter project",
    defaultProjectName: "Flight Controller Rev B",
    defaultDescription:
      "Drone flight controller with high-speed logging, IMU sensing, and barometric altitude.",
    componentCatalogIds: ["icm-42688-p", "bmp388"],
    tags: ["Drone", "Sensing"]
  },
  {
    id: "rp2040-utility-board",
    name: "RP2040 utility board",
    description:
      "USB-attached helper board with UART bridge and a debug header.",
    highlight: "RP2040 + USB bridge",
    controllerId: "rp2040",
    voltageDomain: "3.3V",
    outputTarget: "Generate KiCad starter project",
    defaultProjectName: "Utility Board",
    defaultDescription:
      "Tooling board for serial bridging, debug exposure, and GPIO breakout.",
    componentCatalogIds: ["ch340k", "tag-connect"],
    tags: ["Tooling", "Debug"]
  },
  {
    id: "stm32h7-data-logger",
    name: "STM32H7 data logger",
    description:
      "Storage-backed logger with onboard flash and an inertial sensor.",
    highlight: "STM32H7 + 16 MB flash",
    controllerId: "stm32h743zi",
    voltageDomain: "3.3V",
    outputTarget: "Generate KiCad starter project",
    defaultProjectName: "Data Logger Rev A",
    defaultDescription:
      "High-throughput data logger combining inertial sensing with onboard flash storage.",
    componentCatalogIds: ["w25q128jv", "icm-42688-p"],
    tags: ["Logging", "Storage"]
  }
];

export function findProjectTemplate(id: string | null | undefined) {
  if (!id) {
    return null;
  }

  return projectTemplates.find((template) => template.id === id) ?? null;
}
