/// <reference types="node" />

import { SearchEntryObject } from 'ldapjs';

export interface SingleSearchOptions {
  url: string;
  adminDn: string;
  adminPassword: string;
  userSearchBaseDn: string;
  userSearchAttribute: string;
  username: string;

  timeout?: number;

  /** See TLS docs for node.js */
  tlsOptions?: Object;
}

export interface SingleAuthenticationOptions extends SingleSearchOptions {
  password: string;
}

export interface BindOptions {
  url: string;
  dn: string;
  password: string;

  timeout: number;

  /** See TLS docs for node.js */
  tlsOptions?: Object;
}

export function singleAuthentication(
  options: SingleAuthenticationOptions
): Promise<SearchEntryObject>;

export function singleSearch(
  options: SingleSearchOptions
): Promise<SearchEntryObject | null>;

export function bindSearch(
  options: BindOptions
): Promise<SearchEntryObject | null>;

export class InvalidUserCredentialsError extends Error {
  username: string;
  userFound: boolean;
  constructor(username: string, userFound: boolean);
}
