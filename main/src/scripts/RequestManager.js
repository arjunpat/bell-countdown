import Storage from './Storage';
import { serverHost } from './constants';

export default class RequestManager {

	static get(url) {
		let startTime = window.performance.now();

		if (!url.includes('http')) {
			url = serverHost + url;
		}

		return fetch(url, {
			credentials: 'include'
		}).then(async res => {
			res.json = await res.json();
			res.loadTime = window.performance.now() - startTime;

			return res;
		});
	}

	static post(url, json) {
		let startTime = window.performance.now();

		if (!url.includes('http')) {
			url = serverHost + url;
		}

		return window.fetch(url, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(json)
		}).then(async res => {
			res.json = await res.json();
			res.loadTime = window.performance.now() - startTime;

			return res;
		});
	}

	static init() {
		if (document.cookie.includes('periods_io')) {
			return this.post('/v4/init', {}).then(res => res.json);
		} else {
			Storage.clearAll(); // clear all old data

			let ua = window.navigator.userAgent;

			let temp = {
				chrome: !!window.chrome,
				int_exp: /*@cc_on!@*/false || !!document.documentMode,
				edge: !this.int_exp && !!window.StyleMedia,
				safari: (
					/constructor/i.test(window.HTMLElement)
					|| (function (p) { return p.toString() === "[object SafariRemoteNotification]" })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification)))
					|| ((!!ua.match(/iPad/i) || !!ua.match(/iPhone/i) && !window.chrome)
				),
				firefox: typeof InstallTrigger !== 'undefined',
				opera: (!!window.opr && !!opr.addons) || !!window.opera || ua.indexOf(' OPR/') >= 0
			}

			let browser = [];

			for (let val in temp)
				if (temp.hasOwnProperty(val) && temp[val] === true)
					browser.push(val);

			return this.post('/v4/init', {
				user_agent: ua,
				platform: window.navigator.platform,
				browser
			}).then(res => res.json);
		}
	}

	static login(google_token) {
		return this.post('/v4/login', {
			google_token
		}).then(res => res.json);
	}

	static logout() {
		return this.post('/v4/logout', {}).then(res => res.json);
	}

	static sendAnalytics(data) {
		return this.post('/v4/thanks', data).then(res => res.json);
	}

	static sendLeaveAnalytics() {
		if (navigator.sendBeacon) {

			let blob = new Blob(['{}'], {
				type: 'application/json; charset=UTF-8'
			});

			navigator.sendBeacon('/v4/thanks-again', blob);
		}
	}

	static getTime() {
		return this.get('/time').then(res => res.json.data + res.loadTime).catch(err => {
			return false;
		});
	}

	static getSchoolMeta(school) {
		return this.get(`/school/${school}`).then(res => res.json);
	}

	static getSchoolSchedule(school) {
		return this.get(`/schedule/${school}`).then(res => res.json);
	}

	static sendError(data) {
		return this.post('/v4/error', data);
	}
}