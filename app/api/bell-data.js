'use strict';
const mysql = require('mysql');
const utils = require('../utils.js');

// entire thing should be sync so that higher level abstractions can be async

class BellData {

	constructor() {
		this.conn = mysql.createConnection({
			host: '127.0.0.1',
			user: 'bell_user',
			password: 'ABEqUJHEAyPkdeV3sE8TBeDFL', // dev password
			database: 'bell_data'
		});

		this.query = (sql, vals) => new Promise((resolve, reject) => {
			this.conn.query(sql, vals, (err, res) => {
				if (err) reject(err);
				resolve(res);
			})
		});
	}

	// helper methods

	getUserByEmail(email) {
		if (!email) throw new TypeError('invalid arguments');

		return this.query('SELECT * FROM users WHERE email = ?', [email]).then(results => {
			if (results.length !== 1) return false;
			let user = results[0];
			user.stats = (user.stats.length > 0) ? JSON.parse(user.stats) : {};
			user.settings = (user.settings.length > 0) ? JSON.parse(user.settings) : {};
			user.devices = (user.devices.length > 0) ? JSON.parse(user.devices) : {};

			return user;
		});

	}

	getDeviceByDeviceId(device_id) {
		if (!device_id) throw new TypeError('invalid arguments');

		return this.query('SELECT * FROM devices WHERE device_id = ?', [device_id]).then(result => {
			if (result.length !== 1) return false;
			return result[0];
		});

	}

	setObjectToUser(what, email, object) {
		if (typeof what !== 'string' || typeof email !== 'string' || typeof object !== 'object') throw new TypeError('invalid arguments');

		return this.query(
			`UPDATE users SET ${what} = ? WHERE email = ?`,
			[JSON.stringify(object), email]
		)

	}

	async getUserByDeviceId(device_id) {

		let device = await this.getDeviceByDeviceId(device_id);

		if (device === false) return { error: 'no_user_exists' };

		if (device.registered_to)
			return await this.getUserByEmail(device.registered_to);

		return { error: 'not_registered' };

	}

	userExists(email) {
		return this.query('SELECT * FROM users WHERE email = ?', [email]).then(results => {
			if (results.length === 1) return true;
			return false;
		});
	}

	isThisMe(a, b) {

		for (let val of ['profile_pic', 'email', 'first_name', 'last_name'])
			if (a[val] !== b[val]) return false;
		return true;
	}

	// create user, devices, etc.
	// assumes that other code checks all params to make sure not undefined

	async createNewUser(params) {
		let {email, first_name, last_name, profile_pic} = params;

		let empty_obj = JSON.stringify({});

		await this.query(
			'INSERT INTO users (email, first_name, last_name, profile_pic, settings, devices, stats, created_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
			[email, first_name, last_name, profile_pic, empty_obj, empty_obj, empty_obj, Date.now()],
		).then(results => console.log(results)).catch(err => console.log(err));

	}

	async createNewDevice(params) {
		let {user_agent, browser, platform} = params;

		// creates id
		let device_id = utils.generateRandomID(10);

		await this.query(
			'INSERT INTO devices (device_id, user_agent, browser, platform, date_registered) VALUES (?, ?, ?, ?, ?)',
			[device_id, user_agent, browser, platform, Date.now()]
		).then(results => console.log(results)).catch(err => console.log(err));

		return device_id;
	}

	// edit/augment user, devices, etc.

	async registerDevice(device_id, email) {

		let user = await this.getUserByEmail(email);

		// register device in the devices table

		let a = this.query(
			'UPDATE devices SET registered_to = ? WHERE device_id = ?',
			[email, device_id]
		);

		// register in users

		user.devices[device_id] = Date.now();

		let b = this.setObjectToUser('devices', email, user.devices);

		await Promise.all([a, b]);

	}

	async unregister(device_id, email) {

		let user = await this.getUserByEmail(email);

		delete user.devices[device_id];

		let a = this.query('UPDATE devices SET registered_to = NULL WHERE device_id = ?', [device_id]);

		let b = this.setObjectToUser('devices', email, user.devices);

		await Promise.all([a, b]);

	}

	async updatePeriodNames(device_id, values) {

		let user = await this.getUserByDeviceId(device_id);

		if (user.error) return { error: user.error };

		user.settings.period_names = values;

		await this.setObjectToUser('settings', user.email, user.settings);

		return {};

	}

	updateUser(vals) {
		return this.query(
			'UPDATE users SET first_name = ?, last_name = ?, profile_pic = ? WHERE email = ?',
			[vals.first_name, vals.last_name, vals.profile_pic, vals.email]
		);
	}

	// analytics

	recordHit(params) {

	}
}

module.exports = new BellData();