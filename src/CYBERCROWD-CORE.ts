// CYBERCROWD CORE — Unified Runtime Organ
// ------------------------------------------------------------
// This file defines the foundational execution organs of the
// CyberCrowd Worker runtime. Each class has one job and one
// authority boundary.
//
// Components:
// - ProviderRouter: Selects and returns the active model provider.
// - ModelSession: Maintains conversation history across calls.
// - FileTool: Provides a sandboxed file-write operation.
// - ShellTool: Provides a sandboxed shell-execution operation.
// - IsolatorShield: Enforces tool boundaries and sanitizes args.
// - OSAR: A thin operational wrapper for tool execution.
// - Agent: The central runtime organ coordinating model routing,
//          session memory, tool execution, and shield enforcement.
//
// This file is pure Worker-side logic. It does NOT interact with
// Cloudflare Pages, does NOT export any Pages handlers, and cannot
// trigger a Pages Runtime redrop. Safe to deploy, safe to modify.

export class ProviderRouter {
  private active = "default";

  getActiveModel() {
    return {
      async generate({ prompt }) {
        return { text: `Model(${this.active}) → ${prompt}` };
      }
    };
  }
}

export class ModelSession {
  private history: Array<{ role: string; content: string }> = [];

  add(entry: { role: string; content: string }) {
    this.history.push(entry);
  }

  getHistory() {
    return [...this.history];
  }
}

export class FileTool {
  async run(args: any) {
    const { action, path, content } = args;

    if (action !== "write") {
      throw new Error("FileTool only supports single write operation.");
    }

    return {
      status: "ok",
      file: path,
      contentWritten: content
    };
  }
}

export class ShellTool {
  async run(args: any) {
    const { command, args: cmdArgs } = args;

    return {
      status: "ok",
      command,
      args: cmdArgs,
      output: "sandboxed-shell-output"
    };
  }
}

export class IsolatorShield {
  constructor(private tools: Record<string, any>) {}

  validateToolName(name: string) {
    if (!this.tools[name]) {
      throw new Error(`Unknown tool: ${name}`);
    }
  }

  validateArgs(args: any) {
    if (typeof args !== "object" || args === null) {
      throw new Error("Args must be an object.");
    }
  }

  sanitizeArgs(args: any) {
    return JSON.parse(JSON.stringify(args));
  }

  async execute(name: string, args: any) {
    this.validateToolName(name);
    this.validateArgs(args);

    const safeArgs = this.sanitizeArgs(args);
    return this.tools[name].run(safeArgs);
  }
}

export class OSAR {
  constructor(private agent: Agent) {}

  async exec(op: { tool: string; args: any }) {
    return this.agent.callTool(op.tool, op.args);
  }
}

export class Agent {
  private router: ProviderRouter;
  private session: ModelSession;
  private tools: Record<string, any>;
  private shield: IsolatorShield;
  private osar: OSAR;

  constructor() {
    this.router = new ProviderRouter();
    this.session = new ModelSession();

    this.tools = {
      file: new FileTool(),
      shell: new ShellTool()
    };

    this.shield = new IsolatorShield(this.tools);
    this.osar = new OSAR(this);
  }

  async callTool(name: string, args: any) {
    return this.shield.execute(name, args);
  }

  async run(prompt: string) {
    this.session.add({ role: "user", content: prompt });

    const model = this.router.getActiveModel();
    const response = await model.generate({
      prompt,
      session: this.session.getHistory()
    });

    const text = response.text ?? "";

    this.session.add({ role: "assistant", content: text });

    return text;
  }

  async osarExec(op: { tool: string; args: any }) {
    return this.osar.exec(op);
  }
}
