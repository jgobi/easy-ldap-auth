# easy-ldap-auth

Makes LDAP authentication easy, with just enough options. Inspired by [ldap-authentication](https://github.com/shaozi/ldap-authentication).

## Why?

I wanted a package that was straightforward to use, with a clean and modern codebase. So I wrote this.

## Features

- :sparkles: Easy to use.
- :wrench: Full type definitions.
- :shield: Consistent errors.
- :bug: Easy debugging with logs provided by the `debug` package.


## Installation

```
npm install github:jgobi/easy-ldap-auth
```

## Usage

```javascript
let { singleAuthentication, singleSearch, InvalidUserCredentialsError } = require('easy-ldap-auth');

async function authenticate(username, password) {
    try {
        let user = await singleAuthentication({
            url: 'ldap://ldap.forumsys.com:389',
            adminDn: 'cn=read-only-admin,dc=example,dc=com',
            adminPassword: 'password',
            userSearchBaseDn: 'dc=example,dc=com',
            userSearchAttribute: 'uid',
            username,
            password,
        });
        // bind success, `user` is the user LDAP entry.
        return user;
    } catch (error) {
        if (error instanceof InvalidUserCredentialsError) {
            // invalid user credentials
            return null;
        } else {
            // ldapjs errors, like: admin bind error, connection error or timeout
            throw error;
        }
    }
}

async function searchUser(username) {
    try {
        let user = await singleAuthentication({
            url: 'ldap://ldap.forumsys.com:389',
            adminDn: 'cn=read-only-admin,dc=example,dc=com',
            adminPassword: 'password',
            userSearchBaseDn: 'dc=example,dc=com',
            userSearchAttribute: 'uid',
            username,
        });
        // `user` is the user LDAP entry or null if not found.
        return user;
    } catch (error) {
        // ldapjs errors, like: admin bind error, connection error or timeout
    }
}
```

## Running tests

Clone this repository, then run `npm install` and then `npm test`. An internet connection is required as the [forumsys' public LDAP server](https://www.forumsys.com/2014/02/22/online-ldap-test-server/) is used for testing.

## API

### singleSearch(options)

Perform a single search in a LDAP server. First, it binds as an admin user, then searchs for the given `username` in a given `baseDn`, and unbind the admin connection.

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| options | SingleSearchOptions | The options to use (see below). |

**Returns** a Promise that resolves to the user LDAP entry if it is found, or null if it wasn't.

### singleAuthentication(options)

Perform a single authentication agains a LDAP server. First, it binds as an admin user, then searchs for the given `username` in a given `baseDn`, and unbind the admin connection. If the user is found, the function tries to bind to that user, resolving to the previous info if success, and then unbinding the user. If anything goes wrong, it throws an error. If the credentials for **the user** are invalid, it throws an `InvalidUserCredentialsError`.

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| options | SingleAuthenticationOptions | The options to use (see below). |

**Returns** a Promise that resolves to the user LDAP entry if the credentials are valid, or rejects with an `InvalidUserCredentialsError` (see below) if the credentials are invalid.

## Objects

### SingleSearchOptions

| Property  | Type | Description |
| --------- | ---- | ----------- |
| url | string | The LDAP server URL. |
| adminDn | string | The admin user DN. |
| adminPassword | string | The admin user password. |
| userSearchBaseDn | string | The base DN to search for the user. |
| userSearchAttribute | string | The attribute to search for the user. |
| username | string | The username to search for. |
| timeout | number | (optional) The timeout to use for the connection, in milliseconds. Defaults to 5000. |
| tlsOptions | object | (optional) The TLS options to use for the connection. See [Node docs](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback) for more info. |


### SingleAuthenticationOptions (extends SingleSearchOptions)

| Property  | Type | Description |
| --------- | ---- | ----------- |
| password | string | The password to use for the user. |

### InvalidUserCredentialsError (extends Error)

| Property  | Type | Description |
| --------- | ---- | ----------- |
| username | string | The username searched. |
| userFound | boolean | Whether the user was found or not (if false, invalid user; if true, invalid password). |

----

## License

This sotftware is MIT licensed. Please check the [LICENSE](LICENSE) file for the full text.