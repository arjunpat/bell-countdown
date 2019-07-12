import { logger } from './init';
import Storage from './Storage';

import Canvas from './components/Canvas';

export default class View {
	constructor() {

		logger.time('View', 'grabbed-elements');

		this.currentValues = {};
		this.preloader = document.getElementById('preloader');
		this.notification = document.getElementById('notification');

		this.index = {
			mainCanvas: document.getElementById('main-canvas'),
			mainCanvasOverlay: document.getElementById('main-canvas-overlay'),
			dayType: document.getElementById('day-type'),
			currentPeriodText: document.getElementById('current-period-text'),
			timeLeft: document.getElementById('time-left'),
			settingsButton: document.getElementById('settings-button'),
			googleSignin: document.getElementById('google-signin'),
			scheduleTable: document.getElementById('schedule-table'),
			isACrawler: /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent)
		}

		this.modal = {
			open: false,
			modal: document.getElementById('modal'),
			title: document.getElementById('modal-title'),
			body: document.getElementById('modal-body'),
			footer: document.getElementById('modal-footer')
		}

		this.canvas = new Canvas(this.index.mainCanvas);

		this.notification.querySelectorAll('span')[1].onclick = (() => this.hideNotification()).bind(this);
		this.modal.footer.querySelector('a').onclick = this.closeModal.bind(this);

		logger.timeEnd('View', 'grabbed-elements');

		document.getElementById('enable-notifications').onclick = () => {
			Notification.requestPermission();
		}
	}

	updateScreen(time, showVisuals) {
		let { percentCompleted, hours, minutes, seconds, periodName, dayType } = time;

		// make time human readable
		seconds = padNum(seconds);
		if (hours !== 0)
			minutes = padNum(minutes);

		let timeString = '';
		if (hours !== 0)
			timeString = `${hours}:`;

		timeString += `${minutes}:${seconds}`;

		// the cringier, the better
		let bodies = [
			'Did you turn in your homework?',
			'Give your teacher a hug',
			'Grab your things!',
			'Whew!',
			'Finally, right?',
			'Prepare for blast off',
			'Are you looking at me? Do your work!',
			'You better be going',
			'Gone so soon?',
			'It\'s hard to say goodbye',
			'Your partner will miss you',
			'Farewell',
			'See you later, alligator',
			'Bye Felicia',
			'Tootle-loo'
		]

		if (timeString === '5:00') {
			let body;

			if (Math.random() < .4) {
				body = bodies[Math.floor(Math.random() * bodies.length)]
			}

			new Notification(`5 min left of '${periodName}'`, {
				icon: '/img/1024.png',
				body
			});
		}

		let documentTitle = `${timeString} \u2022 ${periodName}`;
		if (this.currentValues.documentTitle !== documentTitle && !this.index.isACrawler) {
			document.title = documentTitle;
			this.currentValues.documentTitle = documentTitle;
		}

		if (showVisuals) {
			if (
				(percentCompleted < 1 && this.canvas.props.decimalCompleted <= .1 && !this.canvas.animationInterval)
				|| (percentCompleted > 99 && this.canvas.props.decimalCompleted >= .99)
			) {
				this.canvas.draw(percentCompleted / 100); // more specific at the beginning or end
			} else if (!this.canvas.animationInterval) {
				this.canvas.animate(Math.floor(percentCompleted) / 100, 2);
			}


			if (this.currentValues.dayTypeText !== dayType) {
				this.index.dayType.innerText = dayType;
				this.currentValues.dayTypeText = dayType;
			}

			if (this.currentValues.currentPeriodText !== periodName) {
				this.index.currentPeriodText.innerText = periodName;

				// animation
				this.index.currentPeriodText.style.animation = '.6s updatePeriod'
				setTimeout(() => this.index.currentPeriodText.style.animation = 'none', 1e3);
				this.currentValues.currentPeriodText = periodName;
			}

			if (this.currentValues.timeLeftText !== timeString) {
				this.index.timeLeft.innerText = timeString;
				this.currentValues.timeLeftText = timeString;
			}

		}
	}

	updateViewWithState(preferences) {
		// theme stuff
		this.canvas.updateColors(preferences.theme.b, preferences.theme.c);
		this.index.mainCanvasOverlay.style.color = preferences.theme.t;
		this.index.settingsButton.querySelector('div').style.background = preferences.theme.t;

		let b = preferences.theme.b;
		this.index.settingsButton.querySelector('div > i').style.color = b.substring(b.lastIndexOf('#'), b.lastIndexOf(')'));
		this.index.settingsButton.querySelector('div > i').style.color = b;

		if (preferences.googleAccount) {
			this.index.googleSignin.querySelector('button').style.display = 'none';

			let size = 70 * (window.devicePixelRatio || 1);
			this.index.googleSignin.querySelector('div > img').src = preferences.googleAccount.profile_pic + '?sz=' + size;
			this.index.googleSignin.querySelector('div > img').style.display = 'block';
		}
	}

	updateScheduleTable(periods, periodNames, currentTime) {
		let currentDate = (new Date(currentTime)).setHours(0, 0, 0, 0);

		let html = '';
		let added = 0;
		for (let i = 0; i < periods.length - 1 && added < 8; i++) {
			let p = periods[i];

			if (p.n !== 'Passing' && p.n !== 'Free') {

				if ((new Date(p.f)).setHours(0, 0, 0, 0) !== currentDate)
					continue;

				p.n = periodNames[p.n] || p.n;

				html += `
					<tr>
						<td>${p.n}</td>
						<td>${formatEpoch(p.f)} - ${formatEpoch(periods[i + 1].f)}</td>
					</tr>
				`;

				added++;
			}

		}

		if (added === 0)
			html = '<span style="color: black; font-style: italic;">No classes today</span>'

		this.index.scheduleTable.querySelector('table > tbody').innerHTML = html;
	}

	updateScreenDimensions() {
		let dimension = window.innerWidth;

		this.index.settingsButton.style.padding = Math.min(45, dimension / 18) + 'px';
		this.index.settingsButton.querySelector('div').style.padding = Math.min(18, dimension / 28) + 'px';
		this.index.dayType.parentElement.style.fontSize = Math.min(55, dimension / 16) + 'px';
		this.index.dayType.parentElement.parentElement.style.padding = Math.min(50, dimension / 22) + 'px';

		if (dimension > 450) {
			this.index.timeLeft.style.fontSize = Math.min(170, dimension / (this.index.timeLeft.innerText.length - 3)) + 'px';
		} else {
			// mobile sizing
			this.index.timeLeft.style.fontSize = Math.min(120, dimension / (this.index.timeLeft.innerText.length - 2)) + 'px';
		}
	}

	hidePreloader() {
		if (this.preloader.style.display !== 'none') {

			this.preloader.querySelector('div').style.opacity = '0';
			this.preloader.style.opacity = '0';
			this.preloader.style.pointerEvents = 'none';
			setTimeout(() => {
				this.preloader.style.display = 'none';
			}, 2000);

		}
	}

	notify(html) {
		this.notification.querySelector('span').innerHTML = html;
		this.notification.style.bottom = '15px';
	}

	hideNotification() {
		this.notification.style.bottom = '';
	}

	notifyAndHide(html, seconds) {
		this.notify(html);
		setTimeout(this.hideNotification, 5000);
	}

	showModal(screen) {
		let screens = this.modal.body.children;

		for (let i = 0; i < screens.length; i++) {
			if (screens[i].classList.contains(screen)) {
				screens[i].style.display = 'block';
			} else {
				screens[i].style.display = 'none';
			}
		}

		let titles = this.modal.title.children;

		for (let i = 0; i < titles.length; i++) {
			if (titles[i].classList.contains(screen)) {
				titles[i].style.display = 'block';
			} else {
				titles[i].style.display = 'none';
			}
		}

		let modalStyle = this.modal.modal.style;
		modalStyle.display = 'block';

		setTimeout(() => {
			modalStyle.opacity = '1';
			modalStyle.transform = 'translateY(0)';
		}, 20);

		this.modal.open = true;
	}

	closeModal() {
		this.modal.modal.style.opacity = '0';
		setTimeout(() => {
			this.modal.modal.style.display = 'none';
			this.modal.modal.style.transform = 'translateY(-500px)';
		}, 400);
		this.modal.open = false; // TODO pls no reference like this! fix
	}

	dimensionCanvas() { this.canvas.dimension(); }
}

// helper functions
function padNum(n) {
	if (n < 10)
		return '0' + n;
	return n;
}

function formatEpoch(t) {
	let d = new Date(t);
	let h = d.getHours();
	let m = d.getMinutes();

	if (h > 12)
		h -= 12;

	return `${h}:${padNum(m)}`;
}
