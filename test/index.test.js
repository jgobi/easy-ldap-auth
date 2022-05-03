const assert = require('assert');
const ldapjs = require('ldapjs');
const { ConnectionError } = require('ldapjs/lib/errors');
const {
  singleAuthentication,
  singleSearch,
  InvalidUserCredentialsError,
} = require('../lib');

describe('Easy LDAP Auth', function () {
  describe('singleSearch', function () {
    it('should return the user if everything is right', async function () {
      const user = await singleSearch({
        url: 'ldap://ldap.forumsys.com:389',
        adminDn: 'cn=read-only-admin,dc=example,dc=com',
        adminPassword: 'password',
        userSearchBaseDn: 'dc=example,dc=com',
        userSearchAttribute: 'uid',
        username: 'gauss',
      });
      assert.equal(user.uid, 'gauss');
    });

    it('should return null if everything is right, but user is not found', async function () {
      const user = await singleSearch({
        url: 'ldap://ldap.forumsys.com:389',
        adminDn: 'cn=read-only-admin,dc=example,dc=com',
        adminPassword: 'password',
        userSearchBaseDn: 'dc=example,dc=com',
        userSearchAttribute: 'uid',
        username: 'not_gauss',
      });
      assert.equal(user, null);
    });

    it('should return null if everything is right, but user is not found (wrong attribute)', async function () {
      const user = await singleSearch({
        url: 'ldap://ldap.forumsys.com:389',
        adminDn: 'cn=read-only-admin,dc=example,dc=com',
        adminPassword: 'password',
        userSearchBaseDn: 'dc=example,dc=com',
        userSearchAttribute: 'wrong_attribute',
        username: 'gauss',
      });
      assert.equal(user, null);
    });

    it('should reject if invalid searchBaseDn', function () {
      return assert.rejects(
        () =>
          singleSearch({
            url: 'ldap://ldap.forumsys.com:389',
            adminDn: 'cn=read-only-admin,dc=example,dc=com',
            adminPassword: 'password',
            userSearchBaseDn: 'dc=non_existing_example,dc=com',
            userSearchAttribute: 'attribute',
            username: 'gauss',
          }),
        ldapjs.NoSuchObjectError
      );
    });

    it('should reject if adminDn is invalid', function () {
      return assert.rejects(
        () =>
          singleSearch({
            url: 'ldap://ldap.forumsys.com:389',
            adminDn: 'cn=read-write-admin,dc=example,dc=com',
            adminPassword: 'password',
            userSearchBaseDn: 'dc=example,dc=com',
            userSearchAttribute: 'uid',
            username: 'gauss',
          }),
        ldapjs.InvalidCredentialsError
      );
    });

    it('should reject if adminPassword is invalid', function () {
      return assert.rejects(
        () =>
          singleSearch({
            url: 'ldap://ldap.forumsys.com:389',
            adminDn: 'cn=read-only-admin,dc=example,dc=com',
            adminPassword: 'invalid_password',
            userSearchBaseDn: 'dc=example,dc=com',
            userSearchAttribute: 'uid',
            username: 'gauss',
          }),
        ldapjs.InvalidCredentialsError
      );
    });

    it('should reject if timeout (set to 50ms)', function () {
      return assert.rejects(
        () =>
          singleSearch({
            url: 'ldap://ldap.forumsys.com:389',
            adminDn: 'cn=read-only-admin,dc=example,dc=com',
            adminPassword: 'password',
            userSearchBaseDn: 'dc=example,dc=com',
            userSearchAttribute: 'attribute',
            username: 'gauss',
            timeout: 50,
          }),
        ConnectionError
      );
    });

    it('should reject (in 2 seconds) if url is invalid', function () {
      this.timeout(3000);
      return assert.rejects(
        () =>
          singleSearch({
            url: 'ldap://wrong_ldap.forumsys.com:389',
            adminDn: 'cn=read-only-admin,dc=example,dc=com',
            adminPassword: 'password',
            userSearchBaseDn: 'dc=example,dc=com',
            userSearchAttribute: 'uid',
            username: 'gauss',
            timeout: 2000,
          }),
        ConnectionError
      );
    });
  });
  describe('singleAuthentication', function () {
    it('should work if everything is right', async function () {
      const user = await singleAuthentication({
        url: 'ldap://ldap.forumsys.com:389',
        adminDn: 'cn=read-only-admin,dc=example,dc=com',
        adminPassword: 'password',
        userSearchBaseDn: 'dc=example,dc=com',
        userSearchAttribute: 'uid',
        username: 'gauss',
        password: 'password',
      });
      assert.equal(user.uid, 'gauss');
    });

    it('should reject if password is invalid', function () {
      return assert.rejects(
        () =>
          singleAuthentication({
            url: 'ldap://ldap.forumsys.com:389',
            adminDn: 'cn=read-only-admin,dc=example,dc=com',
            adminPassword: 'password',
            userSearchBaseDn: 'dc=example,dc=com',
            userSearchAttribute: 'uid',
            username: 'gauss',
            password: 'password_invalid',
          }),
        (error) =>
          error instanceof InvalidUserCredentialsError &&
          error.userFound === true &&
          error.username === 'gauss' &&
          error.message === 'Invalid password for user gauss.'
      );
    });

    it('should reject if username is invalid', function () {
      return assert.rejects(
        () =>
          singleAuthentication({
            url: 'ldap://ldap.forumsys.com:389',
            adminDn: 'cn=read-only-admin,dc=example,dc=com',
            adminPassword: 'password',
            userSearchBaseDn: 'dc=example,dc=com',
            userSearchAttribute: 'uid',
            username: 'not_gauss',
            password: 'password_invalid',
          }),
        (error) =>
          error instanceof InvalidUserCredentialsError &&
          error.userFound === false &&
          error.username === 'not_gauss' &&
          error.message === 'User not_gauss not found.'
      );
    });

    it('should reject if adminDn is invalid', function () {
      return assert.rejects(
        () =>
          singleAuthentication({
            url: 'ldap://ldap.forumsys.com:389',
            adminDn: 'cn=read-write-admin,dc=example,dc=com',
            adminPassword: 'password',
            userSearchBaseDn: 'dc=example,dc=com',
            userSearchAttribute: 'uid',
            username: 'gauss',
            password: 'password',
          }),
        ldapjs.InvalidCredentialsError
      );
    });

    it('should reject if adminPassword is invalid', function () {
      return assert.rejects(
        () =>
          singleAuthentication({
            url: 'ldap://ldap.forumsys.com:389',
            adminDn: 'cn=read-only-admin,dc=example,dc=com',
            adminPassword: 'invalid_password',
            userSearchBaseDn: 'dc=example,dc=com',
            userSearchAttribute: 'uid',
            username: 'gauss',
            password: 'password',
          }),
        ldapjs.InvalidCredentialsError
      );
    });

    it('should reject if user not found (wrong attribute)', function () {
      return assert.rejects(
        () =>
          singleAuthentication({
            url: 'ldap://ldap.forumsys.com:389',
            adminDn: 'cn=read-only-admin,dc=example,dc=com',
            adminPassword: 'password',
            userSearchBaseDn: 'dc=example,dc=com',
            userSearchAttribute: 'wrong_attribute',
            username: 'gauss',
            password: 'password',
          }),
        InvalidUserCredentialsError
      );
    });

    it('should reject if invalid searchBaseDn', function () {
      return assert.rejects(
        () =>
          singleAuthentication({
            url: 'ldap://ldap.forumsys.com:389',
            adminDn: 'cn=read-only-admin,dc=example,dc=com',
            adminPassword: 'password',
            userSearchBaseDn: 'dc=non_existing_example,dc=com',
            userSearchAttribute: 'attribute',
            username: 'gauss',
            password: 'password',
          }),
        ldapjs.NoSuchObjectError
      );
    });

    it('should reject if timeout (set to 50ms)', function () {
      return assert.rejects(
        () =>
          singleAuthentication({
            url: 'ldap://ldap.forumsys.com:389',
            adminDn: 'cn=read-only-admin,dc=example,dc=com',
            adminPassword: 'password',
            userSearchBaseDn: 'dc=example,dc=com',
            userSearchAttribute: 'attribute',
            username: 'gauss',
            password: 'password',
            timeout: 50,
          }),
        ConnectionError
      );
    });

    it('should reject (in 2 seconds) if url is invalid', function () {
      this.timeout(3000);
      return assert.rejects(
        () =>
          singleAuthentication({
            url: 'ldap://wrong_ldap.forumsys.com:389',
            adminDn: 'cn=read-only-admin,dc=example,dc=com',
            adminPassword: 'password',
            userSearchBaseDn: 'dc=example,dc=com',
            userSearchAttribute: 'uid',
            username: 'gauss',
            password: 'password',
            timeout: 2000,
          }),
        ConnectionError
      );
    });
  });
});
