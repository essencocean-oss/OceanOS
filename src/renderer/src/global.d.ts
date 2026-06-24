export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OCEANOS_API_URL?: string;
      OCEANOS_HOME?: string;
      [key: string]: string | undefined;
    }
  }

  interface Window {
    oceanAPI?: {
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => () => void;
      [key: string]: (...args: any[]) => any;
    };
    hermesAPI?: Window["oceanAPI"]; // legacy alias
  }
}

