'use strict'

var should = require('should'),
    util = require('util'),
    chance = new require('chance').Chance(),
    urljoin = require('url-join'),
    config = require('../../helpers').config,
    UsergridClient = require('../../lib/client'),
    UsergridUser = require('../../lib/user'),
    UsergridQuery = require('../../lib/query'),
    _ = require('lodash')

_.mixin(require('lodash-uuid'))

var _slow = 1500,
    _timeout = 4000,
    _username1 = chance.word(),
    _user1 = new UsergridUser({
        username: _username1,
        password: config.test.password
    })

before(function(done) {

    this.slow(_slow)
    this.timeout(_timeout)

    _user1.create(function(err, usergridResponse, user) {
        done()
    })
})

describe('create()', function() {

    it(util.format("should create a new user with the username '%s'", _username1), function() {
        _user1.username.should.equal(_username1)
    })

    it('should have a valid uuid', function() {
        _user1.should.have.property('uuid').which.is.a.uuid()
    })

    it('should have a created date', function() {
        _user1.should.have.property('created')
    })

    it('should be activated (i.e. has a valid password)', function() {
        _user1.should.have.property('activated').true()
    })

    it('should not have a password property', function() {
        _user1.should.not.have.property('password')
    })

    it('should fail gracefully when a username already exists', function(done) {
        var user = new UsergridUser({
            username: _username1,
            password: config.test.password
        })
        user.create(function(err, usergridResponse) {
            err.should.not.be.null()
            err.should.containDeep({
                name: 'duplicate_unique_property_exists'
            })
            usergridResponse.statusCode.should.be.greaterThanOrEqual(400)
            done()
        })
    })

    it('should create a new user on the server by passing an instance of UsergridClient', function(done) {
        var client = new UsergridClient(config),
            username = chance.word()
        var user = new UsergridUser({
            username: username,
            password: config.test.password
        })
        user.create(client, function(err, usergridResponse, user) {
            user.username.should.equal(username)
            user.should.have.property('uuid').which.is.a.uuid()
            user.should.have.property('created')
            user.should.have.property('activated').true()
            user.should.not.have.property('password')
                // cleanup
            user.remove(function(err, response) {
                done()
            })
        })
    })
})

describe('login()', function() {

    this.slow(_slow)
    this.timeout(_timeout)

    it(util.format("it should log in the user '%s' and receive a token", _username1), function(done) {
        _user1.password = config.test.password
        _user1.login(function(err, response, token) {
            _user1.auth.should.have.property('token').equal(token)
            _user1.should.not.have.property('password')
            _user1.auth.should.not.have.property('password')
            done()
        })
    })
})

describe('logout()', function() {

    this.slow(_slow)
    this.timeout(_timeout)

    it(util.format("it should log out '%s' and destroy the saved UsergridUserAuth instance", _username1), function(done) {
        _user1.logout(function(err, response, success) {
            response.statusCode.should.equal(200)
            response.body.action.should.equal("revoked user token")
            _user1.auth.isValid.should.be.false()
            done()
        })
    })

    it(util.format("it should log out all tokens for the user '%s' destroy the saved UsergridUserAuth instance", _username1), function(done) {
        _user1.password = config.test.password
        _user1.login(function(err, response, token) {
            _user1.logoutAllSessions(function(err, response, success) {
                response.statusCode.should.equal(200)
                response.body.action.should.equal("revoked user tokens")
                _user1.auth.isValid.should.be.false()
                done()
            })
        })
    })

    it("it should return an error when attempting to log out a user that does not have a valid token", function(done) {
        _user1.logout(function(err, response, success) {
            err.should.containDeep({
                name: 'no_valid_token'
            })
            done()
        })
    })
})

describe('resetPassword()', function() {

    this.slow(_slow)
    this.timeout(_timeout)

    it(util.format("it should reset the password for '%s' by passing parameters", _username1), function(done) {
        _user1.resetPassword(config.test.password, '2cool4u', function(err, response, success) {
            response.statusCode.should.equal(200)
            response.body.action.should.equal("set user password")
            done()
        })
    })

    it(util.format("it should reset the password for '%s' by passing an object", _username1), function(done) {
        _user1.resetPassword({
            oldPassword: '2cool4u',
            newPassword: config.test.password
        }, function(err, response, success) {
            response.statusCode.should.equal(200)
            response.body.action.should.equal("set user password")
            done()
        })
    })

    it(util.format("it should not reset the password for '%s' when passing a bad old password", _username1), function(done) {
        _user1.resetPassword({
            oldPassword: 'BADOLDPASSWORD',
            newPassword: config.test.password
        }, function(err, response, success) {
            response.statusCode.should.be.greaterThanOrEqual(400)
            err.name.should.equal('auth_invalid_username_or_password')
             _user1.remove(function(err, response) {
                done()
            })
        })
    })

    it("it should return an error when attempting to reset a password with missing arguments", function() {
        should(function() {
            _user1.resetPassword('NEWPASSWORD', function() {})
        }).throw()
    })
})