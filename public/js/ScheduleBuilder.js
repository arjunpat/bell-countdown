import Logger from './Logger.js';

export default class ScheduleBuilder {
	constructor() {}

	init(presets, calendar) {

		// moves all inline calendar schedules to presets
		let cal = calendar.schedule;
		for (let i = 0; i < cal.length; i++) {
			if (cal[i].content.schedule) {
				let presetName = 'preset-' + Math.random();

				presets[presetName] = {
					n: cal[i].content.name,
					s: cal[i].content.schedule
				}

				delete cal[i].content.schedule;
				cal[i].content.type = presetName;
			}
		}

		this.presets = JSON.stringify(presets);
		this.calendar = JSON.stringify(calendar);
		this.initialized = true;
		this.passing_time = 5;
	}

	generatePresets() {

		if (!this.isInitialized())
			throw 'has not been initialized';

		let freePeriodsExist = (!this.free || Object.keys(this.free).length === 0) ? false : true;

		Logger.time('ScheduleBuilder', 'parse-time');

		let presets = JSON.parse(this.presets);

		for (let key in presets) {
			if (!presets.hasOwnProperty(key))
				continue;

			let schedule = presets[key].s;

			// removes free periods at the beginning of the day
			while (schedule.length > 0 && freePeriodsExist) {
				let event = schedule[0];
				if (typeof event.n === 'number' && !this.free[event.n])
					break;
				else
					schedule.splice(0, 1);
			}

			// add all passing periods
			for (let i = 0; i < schedule.length; i++) {
				if (typeof schedule[i].n === 'number') {
					schedule.splice(i, 0, {
						n: 'Passing',
						f: this.addToStandardTime(schedule[i].f, -this.passing_time)
					});
					i++;
				}
			}

			// removes free periods at end of day
			if (freePeriodsExist) {
				let lastTime;
				for (let i = schedule.length - 2; i >= 0; i--) { // subtract 2 because last is always free
					let event = schedule[i];
					if (typeof event.n === 'number')
						if (this.free[event.n]) {
							lastTime = event;
							schedule.splice(i, 1);
						} else {
							if (lastTime)
								schedule[schedule.length - 1].f = lastTime.f;
							break;
						}
					else {
						schedule.splice(i, 1);
						lastTime = event;
					}
				}
			}

		}

		Logger.timeEnd('ScheduleBuilder', 'parse-time');

		this.new = false;
		return presets;
	}

	setFreePeriods(obj) {
		let firstRun = false;

		if (!this.free) {
			firstRun = true;
			this.free = {};
		}

		for (let key in obj)
			if (obj.hasOwnProperty(key) && typeof obj[key] === 'boolean' && this.free[key] !== obj[key]) {
				this.free[key] = obj[key];
				this.new = true;
			}

		if (firstRun && !Object.keys(this.free).find(key => this.free[key] === true))
			this.new = false;

		// make sure not all periods are free
		if (!Object.keys(this.free).find(key => this.free[key] === false))
			delete this.free; // just treats it like a normal schedule
	}

	addToStandardTime(standardTime, minutes) {
		let [h, m] = standardTime.split(':');
		h = parseInt(h);
		m = parseInt(m);

		m += minutes;

		if (m >= 60) {
			h++;
			m -= 60;
		} else if (m < 0) {
			h--;
			m += 60;
		}

		if (m < 10)
			m = '0' + m;

		return `${h}:${m}`;
	}

	isNew() { return !!this.new && this.isInitialized(); }

	getCalendar() { return JSON.parse(this.calendar); }

	isInitialized() { return !!this.initialized; }
}