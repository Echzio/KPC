/**
 * Конфигурация SSH подключения к роутеру
 */
export interface SSHConfig {
  /** Хост роутера (IP-адрес или доменное имя) */
  host: string;
  /** Порт SSH (по умолчанию 22) */
  port: number;
  /** Имя пользователя для подключения */
  username: string;
  /** Пароль для подключения */
  password: string;
}
