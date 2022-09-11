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
    /** */
    ref(): string;

    /** */
    line(): number;

    /** */
    value(): string;

    /** */
    parent(): Result<Node>;

    /** */
    find(pattern: string): Result<Node[]>;

    /** */
    first(pattern: string): Result<Node>;

    /**
     * Try to find the value of the first node matching pattern
     * @param {string} pattern
     */
    valueAt(pattern: string): Result<string>;
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

  /** */
  export interface Worker {
    /** */
    queue(handler: string, node: Node): void;

    /** */
    run(): Result<ScriptError[]?>;
  }

  export interface Xsd {
    /**
     * Validates context's current document against provided schema
     * @param {string} version 
     */
    validate(version: string): Result<boolean>;
  }

  export interface Context {
    config: M;
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