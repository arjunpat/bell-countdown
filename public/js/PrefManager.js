import Storage from './Storage';
import RequestManager from './RequestManager';
import { isFreePeriod } from './extras';

export default class PrefManager {

	constructor() {

		this.themeOptions = [
			// [background, completed, text]
			['#fccb0b', '#fee561', '#000000'], // Yellow
			['#000000', '#262626', '#fccb0b'], // Yellow on Black
			['#eaeaea', '#d0d0d0', '#000000'], // Grey
			[ // Blue-green gradient
				{
					type: 'linear_gradient',
					stops: ['#40e078', '#40c8e6']
				},
				'rgba(0, 0, 0, .18)',
				'#000'
			],
			[ // Pink-blue gradient
				{
					type: 'linear_gradient',
					stops: ['#FC5C7D', '#6A82FB']
				},
				'rgba(0, 0, 0, .18)',
				'#000'
			],
			['#bdffff', '#aae6e6', '#000000'], // Light Blue
			['#000000', '#262626', '#ff2a00'], // Red on Black
			[
				{
					type: 'linear_gradient',
					stops: ['#F3904F', '#3B4371']
				},
				'rgba(0, 0, 0, .18)',
				'#000'
			], // Sunrise Gradient
			['#90e69e', '#7bce89', '#000000'], // Green
		]

		this.schoolOptions = [
			[
				'mvhs',
				'Mountain View High School'
			],
			[
				'lahs',
				'Los Altos High School'
			],
			[
				'paly',
				'Palo Alto High School'
			]
		]

		if (Storage.prefsExist()) {
			this.setAllPreferences(Storage.getPrefs());
		}
		
		this.initVars();
	}

	initVars() {
		// set to default values (school and theme)

		this.themeNum = this.themeNum || 0;
		this.periodNames = this.periodNames || {};
		this.googleAccount = this.googleAccount || { signed_in: false }
		this.school = (this.isASchoolId(this.school) && this.school) || 'mvhs';
	}

	getAllPreferences() {
		let freePeriods = {};

		for (let key in this.periodNames) {
			freePeriods[key] = isFreePeriod(this.periodNames[key]);
		}

		return {
			theme: this.getThemeFromNum(this.themeNum),
			periodNames: this.periodNames,
			googleAccount: this.googleAccount,
			school: this.school,
			schoolOptions: this.schoolOptions,
			freePeriods
		}
	}

	setAllPreferences(values) {
		this.setTheme(values.theme);
		this.periodNames = values.periodNames;
		this.googleAccount = values.googleAccount;
		this.school = values.school;
	}

	save() {
		Storage.setPrefs({
			theme: this.themeNum,
			periodNames: this.periodNames,
			googleAccount: this.googleAccount,
			school: this.school
		});
	}
	
	// settage and gettage of settings

	setGoogleAccount(values) {
		this.googleAccount = {
			first_name: values.first_name,
			last_name: values.last_name,
			profile_pic: values.profile_pic,
			email: values.email,
			signed_in: true
		}

		if (values.settings) {
			if (values.settings.period_names)
				this.periodNames = values.settings.period_names;
			if (typeof values.settings.theme === 'number')
				this.setTheme(values.settings.theme);
			if (typeof values.school === 'string') {
				this.setSchoolId(values.school);
			}
			// do other loading stuff here
		}

		this.save();
	}

	setPreferences(periodNames, theme, school) {
		if (!this.isLoggedIn())
			return;

		if (!this.isValidThemeNum(theme))
			theme = 0;

		return RequestManager.updatePreferences(periodNames, theme, school).then(data => {
			if (data.success) {
				this.setTheme(theme);
				this.periodNames = periodNames;
				this.setSchoolId(school);
				return true;
			} else {
				return false;
			}
		});

	}

	setTheme(num) {
		if (!this.isValidThemeNum(num))
			return;

		this.themeNum = num;
		this.save();
	}

	setSchoolId(id) {
		if (!this.isASchoolId(id))
			return;

		this.school = id;
		this.save();
	}

	getThemeFromNum(num) {
		return {
			num,
			background: this.themeOptions[num][0],
			completed: this.themeOptions[num][1],
			text: this.themeOptions[num][2]
		}
	}

	isASchoolId(schoolId) {
		// TODO: optimize this
		// use the prefmanager school functionality
		return this.schoolOptions.some(a => a[0] === schoolId);
	}

	isValidThemeNum(num) {
		if (this.themeOptions[num])
			return true;
		return false;
	}

	getPeriodName(num) { return this.periodNames[num]; }

	getThemeNum() { return this.themeNum; }

	getSchoolId() { return this.school; }

	isLoggedIn() { return !!this.googleAccount.signed_in; }

}