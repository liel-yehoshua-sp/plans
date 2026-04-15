export class PlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanError';
  }
}

export class WorkspaceNotFoundError extends PlanError {
  constructor(dir: string) {
    super(`No plan workspace found in "${dir}". Run \`plan init\` to create one.`);
    this.name = 'WorkspaceNotFoundError';
  }
}

export class EntityNotFoundError extends PlanError {
  constructor(type: string, id: string) {
    super(`${type} "${id}" not found.`);
    this.name = 'EntityNotFoundError';
  }
}

export class InvalidTransitionError extends PlanError {
  constructor(entity: string, from: string, to: string, valid: string[]) {
    super(
      `Cannot transition ${entity} from "${from}" to "${to}". ` +
      `Valid transitions: ${valid.length ? valid.join(', ') : 'none (terminal state)'}.`
    );
    this.name = 'InvalidTransitionError';
  }
}

export class DuplicateEntityError extends PlanError {
  constructor(type: string, id: string) {
    super(`${type} "${id}" already exists.`);
    this.name = 'DuplicateEntityError';
  }
}
