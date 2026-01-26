/**
 * Устройство, подключенное к роутеру Keenetic
 */
export interface Device {
  /** MAC-адрес устройства */
  mac: string;
  /** Имя устройства */
  name: string;
  /** Интерфейс (политика доступа) */
  interface: string;
  /** IP-адрес устройства */
  ip: string;
}

/**
 * Политика доступа на роутере Keenetic
 */
export interface Policy {
  /** Идентификатор политики */
  name: string;
  /** Описание политики */
  description: string;
}

/**
 * Опции команды изменения политики
 */
export interface ChangePolicyOptions {
  /** MAC-адрес устройства */
  mac: string;
  /** ID политики доступа */
  policy: string;
}

/**
 * Опции команды сброса политики
 */
export interface ResetPolicyOptions {
  /** MAC-адрес устройства */
  mac: string;
}
