import Logger from './Logger';

export default new class Analytics {
	constructor() {
		this.sent = false;
	}

	async a() { // checks data values and sends if all are there

		if (this.sent) return;

		if (!this.pathname || !this.deviceId || typeof this.theme !== 'number' || !this.version || !this.school)
			return;

		if ((this.pathname === '/' || this.pathname === 'extn') && !this.period)
			return;

		this.sent = true;
		while (
			window.performance.timing.domInteractive - window.performance.timing.domLoading < 0
			|| window.performance.timing.loadEventEnd - window.performance.timing.navigationStart < 0
		) {
			await this.sleep(1);
		}

		let data = {};
		if (this.pathname === '/' || this.pathname === 'extn') { // index page or extn

			data.prefs = {
				theme: this.theme,
				period: this.period
			}
			if (this.period !== this.period_name)
				data.prefs.period_name = this.period_name;

		} else {
			data.prefs = {
				theme: this.theme
			}
		}

		let speedInfo = window.performance.timing;

		data.pathname = this.pathname;
		data.referrer = window.document.referrer;
		data.school = this.school;
		data.speed = {
			page_complete: speedInfo.loadEventEnd - speedInfo.navigationStart,
			response_time: speedInfo.responseEnd - speedInfo.requestStart,
			dom_complete: speedInfo.domComplete - speedInfo.domLoading,
			dns: speedInfo.domainLookupEnd - speedInfo.domainLookupStart,
			ttfb: speedInfo.responseStart - speedInfo.navigationStart,
			tti: speedInfo.domInteractive - speedInfo.domLoading
		}

		data.version = this.version;

		RequestManager.sendAnalytics(data).then(data => {
			if (data.success) {
				Logger.log('Analytics', 'analytics data sent!');
			}
		});

	}

	setDeviceId(x) {
		this.deviceId = x;
		this.a();
	}

	setTheme(x) {
		this.theme = x;
		this.a();
	}

	setPeriod(x) {
		this.period = x;
		this.a();
	}

	setPeriodName(x) {
		this.period_name = x;
		this.a();
	}

	setPathname(x) {
		this.pathname = x;
		this.a();
	}

	setVersion(x) {
		this.version = x;
		this.a();
	}

	setSchool(x) {
		this.school = x;
		this.a();
	}

	leaving() {
		if (this.sent)
			RequestManager.sendLeaveAnalytics();
	}

	sleep(seconds) {
		return new Promise((resolve, reject) => setTimeout(() => resolve(), seconds * 1e3));
	}
}