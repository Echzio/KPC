import "dotenv/config";
import { Command } from "commander";

import { KeeneticManager } from "./keenetic-manager";
import { ChangePolicyOptions, ResetPolicyOptions } from "./types";
import { createSSHClient } from "./ssh-client";

const program = new Command();

program
  .name("keenetic-policy-changer")
  .description(
    "Инструмент для управления политиками доступа на Keenetic роутере",
  )
  .version("1.0.0");

program
  .command("list-devices")
  .description("Показать список всех устройств")
  .action(async () => {
    const ssh = createSSHClient();
    const manager = new KeeneticManager(ssh);

    try {
      await ssh.connect();
      const devices = await manager.getDevices();

      console.log("\nСписок устройств:");
      console.log("=".repeat(80));
      devices.forEach((device, index) => {
        console.log(`${index + 1}. ${device.name}`);
        console.log(`   MAC: ${device.mac}`);
        console.log(`   IP: ${device.ip}`);
        console.log("-".repeat(80));
      });
    } catch (error) {
      console.error("Ошибка:", (error as Error).message);
      process.exit(1);
    } finally {
      ssh.disconnect();
    }
  });

program
  .command("list-policies")
  .description("Показать список всех политик доступа")
  .action(async () => {
    const ssh = createSSHClient();
    const manager = new KeeneticManager(ssh);

    try {
      await ssh.connect();
      const policies = await manager.getPolicies();

      console.log("\nСписок политик доступа:");
      console.log("=".repeat(80));
      policies.forEach((policy, index) => {
        console.log(`${index + 1}. ${policy.name} - ${policy.description}`);
      });
      console.log("=".repeat(80));
    } catch (error) {
      console.error("Ошибка:", (error as Error).message);
      process.exit(1);
    } finally {
      ssh.disconnect();
    }
  });

program
  .command("change-policy")
  .description("Изменить политику доступа для устройства")
  .requiredOption("-m, --mac <mac>", "MAC-адрес устройства")
  .requiredOption("-p, --policy <policy>", "ID политики доступа")
  .action(async (options: ChangePolicyOptions) => {
    const ssh = createSSHClient();
    const manager = new KeeneticManager(ssh);

    try {
      await ssh.connect();
      await manager.changeDevicePolicy(options.mac, options.policy);
      console.log("\nПолитика успешно изменена!");
    } catch (error) {
      console.error("Ошибка:", (error as Error).message);
      process.exit(1);
    } finally {
      ssh.disconnect();
    }
  });

program
  .command("reset-policy")
  .description("Вернуть устройство в дефолтную политику")
  .requiredOption("-m, --mac <mac>", "MAC-адрес устройства")
  .action(async (options: ResetPolicyOptions) => {
    const ssh = createSSHClient();
    const manager = new KeeneticManager(ssh);

    try {
      await ssh.connect();
      await manager.resetDevicePolicy(options.mac);
      console.log("\nУстройство возвращено в дефолтную политику!");
    } catch (error) {
      console.error("Ошибка:", (error as Error).message);
      process.exit(1);
    } finally {
      ssh.disconnect();
    }
  });

program.parse();
