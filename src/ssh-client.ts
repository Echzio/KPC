import { Client, ConnectConfig, ClientChannel } from "ssh2";
import { SSHConfig } from "./types";

export class KeeneticSSHClient {
  #config: ConnectConfig;
  #connection: Client | null;

  constructor(config: SSHConfig) {
    this.#config = {
      host: config.host,
      port: config.port || 22,
      username: config.username,
      password: config.password,
      readyTimeout: 10_000, // 10 секунд таймаут подключения
    };
    this.#connection = null;
  }

  connect(): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();

    this.#connection = new Client();

    this.#connection
      .on("ready", () => {
        console.log("SSH подключение установлено");
        resolve();
      })
      .on("error", (err: Error) => {
        this.#connection?.end();
        this.#connection = null;
        console.error("Ошибка SSH подключения:", err.message);
        reject(err);
      })
      .connect(this.#config);

    return promise;
  }

  executeCommand(command: string): Promise<string> {
    const { promise, resolve, reject } = Promise.withResolvers<string>();

    if (!this.#connection) {
      reject(new Error("SSH подключение не установлено"));
      return promise;
    }

    this.#connection.exec(
      command,
      (err: Error | undefined, stream: ClientChannel) => {
        if (err) {
          reject(err);
          return;
        }

        let stdout = "";
        let stderr = "";

        stream
          .on("close", (code: number) => {
            if (code !== 0) {
              reject(
                new Error(`Команда завершилась с кодом ${code}: ${stderr}`),
              );
            } else {
              resolve(stdout);
            }
          })
          .on("data", (data: Buffer) => {
            stdout += data.toString();
          })
          .stderr.on("data", (data: Buffer) => {
            stderr += data.toString();
          });
      },
    );

    return promise;
  }

  disconnect(): void {
    if (this.#connection) {
      this.#connection.end();
      console.log("SSH подключение закрыто");
    }
  }
}

export function createSSHClient(): KeeneticSSHClient {
  const config: SSHConfig = {
    host: process.env.ROUTER_HOST || "",
    port: parseInt(process.env.ROUTER_PORT || "22") || 22,
    username: process.env.ROUTER_USERNAME || "",
    password: process.env.ROUTER_PASSWORD || "",
  };

  if (!config.host || !config.username || !config.password) {
    console.error(
      "Ошибка: Не указаны необходимые параметры подключения в .env файле",
    );
    console.error(
      "Убедитесь, что заполнены: ROUTER_HOST, ROUTER_USERNAME, ROUTER_PASSWORD",
    );
    process.exit(1);
  }

  return new KeeneticSSHClient(config);
}
