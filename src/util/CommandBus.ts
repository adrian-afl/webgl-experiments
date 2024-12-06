// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

class CommandBusException extends Error {
  public constructor(
    public readonly commandName: string,
    message: string
  ) {
    super(message);
  }
}

export class CommandHandlerAlreadyRegisteredException extends CommandBusException {
  public constructor(commandName: string) {
    super(commandName, "Handler already registered");
  }
}

export class CommandHandlerNotRegisteredException extends CommandBusException {
  public constructor(commandName: string) {
    super(commandName, "Handler not registered");
  }
}

export abstract class AbstractBaseCommand<ResType> {
  public _result: ResType | null = null;
  public commandName = this.constructor.name;
}

// export type ExtractCommandReturnType<
//   CommandType extends AbstractBaseCommand<unknown>,
// > = NonNullable<CommandType["_result"]>;

export type CommandHandler<
  CommandType extends AbstractBaseCommand<unknown>,
  ResType = unknown,
> = (command: CommandType) => Promise<ResType> | ResType;

type AnyCommandHandler = CommandHandler<AbstractBaseCommand<unknown>>;

export class CommandBus {
  private handlers: Record<string, AnyCommandHandler | undefined> = {};

  public register<T extends AbstractBaseCommand<E>, E>(
    commandClass: Constructor<T>,
    handler: CommandHandler<T, E>
  ): void {
    const commandName = commandClass.name;
    if (this.handlers[commandName]) {
      throw new CommandHandlerAlreadyRegisteredException(commandName);
    }
    this.handlers[commandName] = handler as AnyCommandHandler;
  }

  public unregister<T extends AbstractBaseCommand<unknown>>(
    commandClass: Constructor<T>
  ): void {
    const commandName = commandClass.name;
    this.handlers = Object.fromEntries(
      Object.entries(this.handlers).filter((kv) => kv[0] !== commandName)
    );
  }

  public hasHandler<T extends AbstractBaseCommand<unknown>>(
    commandClass: Constructor<T>
  ): boolean {
    const commandName = commandClass.name;
    return !!this.handlers[commandName];
  }

  public async execute<T extends AbstractBaseCommand<unknown>>(
    command: T
  ): Promise<NonNullable<T["_result"]>> {
    const commandName = command.constructor.name;
    const handler = this.handlers[commandName];
    if (!handler) {
      throw new CommandHandlerNotRegisteredException(commandName);
    }
    return handler(command) as Promise<NonNullable<T["_result"]>>;
  }
}
