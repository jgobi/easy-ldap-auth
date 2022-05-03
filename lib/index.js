const assert = require('assert');
const debug = require('debug')('easy-ldap-auth');
const ldap = require('ldapjs');

/**
 * Search for an user in a LDAP server. Resolves to the user if it was found
 * or to null if it wasn't.
 * @param {import('../types').SingleSearchOptions} options
 */
  async function singleSearch(options) {
  assert(options.url, 'url is required');
  assert(options.adminDn, 'adminDn is required');
  assert(options.adminPassword, 'adminPassword is required');
  assert(options.userSearchBaseDn, 'userSearchBaseDn is required');
  assert(options.userSearchAttribute, 'userSearchAttribute is required');
  assert(options.username, 'username is required');

  const adminClient = await _bindLdap(
    {
      url: options.url,
      dn: options.adminDn,
      password: options.adminPassword,
      tlsOptions: options.tlsOptions,
      timeout: options.timeout || 5000,
    },
    true
  );

  try {
    const user = await _searchUser(
      adminClient,
      options.userSearchBaseDn,
      options.userSearchAttribute,
      options.username
    );
    return user;
  } finally {
    adminClient.unbind();
  }
}

/**
 * Authenticates an user against a LDAP server. Resolves to the user if the
 * credentials are correct, otherwise rejects with `InvalidCreditentialsError`.
 * @param {import('../types').SingleAuthenticationOptions} options
 */
async function singleAuthentication(options) {
  assert(options.password, 'password is required');

  const user = await singleSearch(options);

  if (!user) throw new InvalidUserCredentialsError(options.username, false);

  try {
    const userClient = await _bindLdap(
      {
        url: options.url,
        dn: user.dn,
        password: options.password,
        tlsOptions: options.tlsOptions,
        timeout: options.timeout || 5000,
      },
      false
    );
    userClient.unbind();
    return user;
  } catch (err) {
    if (err instanceof ldap.InvalidCredentialsError) {
      throw new InvalidUserCredentialsError(options.username, true);
    } else {
      throw err;
    }
  }
}

/**
 * Connect to LDAP server and bind to given dn
 * @param {import('../types').BindOptions} options
 * @param {boolean} isAdmin only for logging purposes
 * @returns {Promise<import('ldapjs').Client>}
 */
function _bindLdap(options, isAdmin) {
  return new Promise((_resolveInternal, _rejectinternal) => {
    let done = false;
    function reject(reason) {
      if (!done) {
        done = true;
        client.unbind();
        debug((isAdmin ? 'Admin' : 'User') + ' bind failed:', reason);
        _rejectinternal(reason);
      } else {
        debug(
          `Caugh (but ignored) an error after ${
            isAdmin ? 'admin' : 'user'
          } bind promise fulfillment:`,
          reason
        );
      }
    }
    function resolve(value) {
      done = true;
      debug((isAdmin ? 'Admin' : 'User') + ' bind successful!');
      _resolveInternal(value);
    }

    /** @type {import('ldapjs').ClientOptions} */
    const clientOptions = {
      url: options.url,
      timeout: options.timeout,
      connectTimeout: options.timeout,
    };
    if (options.tlsOptions) clientOptions.tlsOptions = options.tlsOptions;

    // client
    // note: it is not necessary to listen for 'resultError' event as this will be handled by the search function
    const client = ldap.createClient(clientOptions);
    client.on('connectRefused', reject);
    client.on('connectTimeout', reject);
    client.on('connectError', reject);
    client.on('setupError', reject);
    client.on('socketTimeout', reject);
    client.on('timeout', reject);

    client.on('connect', () => {
      client.bind(options.dn, options.password, (err) => {
        if (err) return reject(err);
        return resolve(client);
      });
    });
  });
}

/**
 * Search for the first matching entry given a baseDn, an attribute and a value.
 * @param {import('ldapjs').Client} ldapClient
 * @param {string} baseDn
 * @param {string} attribute
 * @param {string} value
 * @returns {Promise<import('ldapjs').SearchEntryObject | null>}
 */
function _searchUser(ldapClient, baseDn, attribute, value) {
  return new Promise((_resolveInternal, _rejectInternal) => {
    let done = false;
    function reject(reason) {
      if (!done) {
        done = true;
        debug('Search failed:', reason);
        _rejectInternal(reason);
      } else {
        debug(
          'Caugh (but ignored) an error after search promise fulfillment:',
          reason
        );
      }
    }
    function resolve(value) {
      done = true;
      debug('Search successful,', value ? 'user found.' : 'but no user found.');
      _resolveInternal(value);
    }

    const filter = new ldap.filters.EqualityFilter({ attribute, value });

    ldapClient.search(
      baseDn,
      {
        filter,
        scope: 'sub',
        sizeLimit: 1,
      },
      (err, res) => {
        if (err) return _rejectInternal(err);
        let user = null;

        res.on('searchEntry', (entry) => {
          user = entry.object;
        });
        res.on('error', reject);
        res.on('end', (result) => {
          if (result.status != 0) {
            return reject(
              new Error('LDAP search status code not equals to 0.')
            );
          } else {
            return resolve(user);
          }
        });
      }
    );
  });
}

class InvalidUserCredentialsError extends Error {
  constructor(username, userFound) {
    super(
      !userFound
        ? `User ${username} not found.`
        : `Invalid password for user ${username}.`
    );
    this.username = username;
    this.userFound = userFound;
  }
}

module.exports = {
  singleSearch,
  singleAuthentication,
  InvalidUserCredentialsError,
};
