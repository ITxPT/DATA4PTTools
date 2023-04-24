import { ScriptError } from "errors";

declare module "types" {
  export type M = { [key: string]: any }

  /** */
  export type ResultErrorCallback<T> = (e: Error) => T;

  /** */
  export type ResultValueCallback<T, I> = (t: T) => I;

  /** */
  export interface Result<T> {
    /** */
    isErr(): boolean;

    /** */
    get(): T | null;

    /** */
    getOrElse<I>(op: ResultErrorCallback<T>): I | null;

    /** */
    map<I>(op: ResultValueCallback<T, I>): Result<I>;
  }

  /** */
  export interface Node {
    /**
     * @param {string} expr
     */
    attr(expr: string): Result<string>;

    /** */
    line(): number;

    /** */
    parent(): Result<Node>;

    /**
     * @param {string} expr
     */
    find(expr: string): Result<Node[]>;

    /**
     * @param {string} expr
     */
    first(expr: string): Result<Node>;

    /** */
    text(): string;

    /**
     * Try to find the value of the first node matching pattern
     * @param {string} expr
     */
    textAt(expr: string): Result<string>;
  }

  /** */
  export interface Collection {
    /** */
    find(pattern: string): Result<Node[]>;

    /** */
    first(pattern: string): Result<Node>;
  }

  export enum LogLevel {
    Trace = "trace",
    Debug = "debug",
    Info = "info",
    Warn = "warn",
    Error = "error",
  }

  export interface Logger {
    /** */
    log(level: LogLevel, v: any, extra?: M): void;

    /** */
    trace(v: any, extra?: M): void;

    /** */
    debug(v: any, extra?: M): void;

    /** */
    info(v: any, extra?: M): void;

    /** */
    warn(v: any, extra?: M): void;

    /** */
    error(v: any, extra?: M): void;
  }

  export interface Worker {
    /**
     * Queue task to be run in worker
     * @param {string} handler function handler name
     * @param {Node} node
     * @param {M} params 
     */
    queue(handler: string, node: Node, params?: M): void;

    /**
     * Run queued tasks
     */
    run(): Result<ScriptError[]?>;
  }

  export interface Xsd {
    /**
     * Validates context's current document against provided schema
     * @param {string} version 
     */
    validate(version: string): Result<ScriptError[]>;

    /**
     * Parse xsd as a document
     * @param {string} version
     */
    parse(version: string): Result<Node>;
  }

  export interface Context {
    config: M;
    params: M;
    document: Node;
    collection: Collection;
    log: Logger;
    node: Node;
    worker: Worker;
    xsd: Xsd;
  }
}

declare module "time" {
  import { M, Result } from "types";

  export function validLocation(name: string): Result<boolean>;
}

declare module "xpath" {
  export function join(...pattern: string[]): string;

  module path {
    export const BASE: string;
    export const DATA_OBJECTS: string;
    export const FRAMES: string;
    export const FRAME_DEFAULTS: string;
  }
}

declare module "errors" {
  export const NODE_NOT_FOUND: Error;
  export const SCHEMA_NOT_FOUND: Error;
  export const XSD_VALIDATION_INVALID: Error;

  export const TYPE_CONSISTENCY: Error;
  export const TYPE_GENERAL_ERROR: Error;
  export const TYPE_NOT_FOUND: Error;
  export const TYPE_QUALITY: Error;

  export type ScriptError = {
    type: Error;
    message: string;
    extra: M;
  }

  export function create(type: Error, message: string | Error, extra?: M): ScriptError;
  export function ConsistencyError(message: string | Error, extra?: M): ScriptError;
  export function GeneralError(message: string | Error, extra?: M): ScriptError;
  export function NotFoundError(message: string | Error, extra?: M): ScriptError;
  export function QualityError(message: string | Error, extra?: M): ScriptError;
}