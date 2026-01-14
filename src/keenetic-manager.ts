import { KeeneticSSHClient } from "./ssh-client";
import { Device, Policy } from "./types";

export class KeeneticManager {
  private ssh: KeeneticSSHClient;

  constructor(sshClient: KeeneticSSHClient) {
    this.ssh = sshClient;
  }

  async getDevices(): Promise<Device[]> {
    try {
      const output = await this.ssh.executeCommand("show ip hotspot");

      return this.parseDevices(output);
    } catch (error) {
      throw new Error(
        `Ошибка получения списка устройств: ${(error as Error).message}`
      );
    }
  }

  private parseDevices(output: string): Device[] {
    try {
      const devices: Device[] = [];
      const lines = output.split("\n");

      let currentDevice: Partial<Device> | null = null;
      let inInterfaceBlock = false;
      let interfaceId = "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Начало нового устройства
        if (trimmed === "host:") {
          // Сохраняем предыдущее устройство
          if (currentDevice && currentDevice.mac) {
            devices.push({
              mac: currentDevice.mac,
              name: currentDevice.name || "Unknown",
              interface: currentDevice.interface || "Unknown",
              ip: currentDevice.ip || "Unknown",
            });
          }

          // Начинаем новое устройство
          currentDevice = {};
          inInterfaceBlock = false;
          interfaceId = "";
          continue;
        }

        if (!currentDevice) continue;

        // Начало блока interface
        if (trimmed === "interface:") {
          inInterfaceBlock = true;
          continue;
        }

        // Конец блока interface (новый блок с малым отступом)
        if (
          inInterfaceBlock &&
          (trimmed === "" ||
            (line.match(/^\s{0,10}\w+:/) &&
              !trimmed.startsWith("id:") &&
              !trimmed.startsWith("name:") &&
              !trimmed.startsWith("description:")))
        ) {
          inInterfaceBlock = false;
          if (interfaceId) {
            currentDevice.interface = interfaceId;
          }
        }

        // Парсим поля
        const match = trimmed.match(/^(\w+):\s*(.*)$/);
        if (match) {
          const [, key, value] = match;

          if (inInterfaceBlock) {
            if (key === "id") {
              interfaceId = value;
              currentDevice.interface = value;
            }
          } else {
            switch (key) {
              case "mac":
                currentDevice.mac = value;
                break;
              case "ip":
                currentDevice.ip = value;
                break;
              case "hostname":
                if (!currentDevice.name && value) {
                  currentDevice.name = value;
                }
                break;
              case "name":
                currentDevice.name = value;
                break;
            }
          }
        }
      }

      // Добавляем последнее устройство
      if (currentDevice && currentDevice.mac) {
        devices.push({
          mac: currentDevice.mac,
          name: currentDevice.name || "Unknown",
          interface: currentDevice.interface || "Unknown",
          ip: currentDevice.ip || "Unknown",
        });
      }

      return devices;
    } catch (error) {
      throw new Error(
        `Ошибка парсинга данных устройств: ${(error as Error).message}`
      );
    }
  }

  async getPolicies(): Promise<Policy[]> {
    try {
      const output = await this.ssh.executeCommand("show ip policy");

      const formattedPolicies = output
        .split("policy")
        .slice(1)
        .map((item) => {
          const informString = item.split("\n")[0];
          const name = informString
            .match(/name = .+, /i)?.[0]
            ?.replace(/name = (.+), /, `$1`);
          const description = informString
            .match(/description = .+:/i)?.[0]
            ?.replace(/description = (.+):/, `$1`);

          return { name, description };
        });

      return formattedPolicies ?? [];
    } catch (error) {
      throw new Error(
        `Ошибка получения списка политик: ${(error as Error).message}`
      );
    }
  }

  async changeDevicePolicy(
    macAddress: string,
    policyId: string
  ): Promise<boolean> {
    try {
      const command = `ip hotspot host ${macAddress} policy ${policyId}`;
      await this.ssh.executeCommand(command);

      // Сохраняем конфигурацию
      await this.ssh.executeCommand("system configuration save");

      console.log(
        `Устройство ${macAddress} успешно перемещено в политику ${policyId}`
      );
      return true;
    } catch (error) {
      throw new Error(`Ошибка изменения политики: ${(error as Error).message}`);
    }
  }

  async resetDevicePolicy(macAddress: string): Promise<boolean> {
    try {
      const command = `ip hotspot host ${macAddress} no policy`;
      await this.ssh.executeCommand(command);

      // Сохраняем конфигурацию
      await this.ssh.executeCommand("system configuration save");

      console.log(`Устройство ${macAddress} возвращено в дефолтную политику`);
      return true;
    } catch (error) {
      throw new Error(`Ошибка сброса политики: ${(error as Error).message}`);
    }
  }
}

export default KeeneticManager;
