function parseTweets(runkeeper_tweets) {
	if (runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	// Build Tweet objs
	tweet_array = runkeeper_tweets.map(function (tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

	//1st and latest date
	function parseToDateMs(s) {
		if (!s) return NaN;
		let d = new Date(s);
		if (!Number.isNaN(d.getTime())) return d.getTime();
		const isoish = String(s).replace(' ', 'T');
		d = new Date(isoish.endsWith('Z') ? isoish : isoish + 'Z');
		if (!Number.isNaN(d.getTime())) return d.getTime();
		const trimmed = String(s).replace(/\s\+\d{4}\b/, '');
		d = new Date(trimmed);
		return Number.isNaN(d.getTime()) ? NaN : d.getTime();
	}

	const times = runkeeper_tweets
		.map(t => parseToDateMs(t.created_at || t.time))
		.filter(n => Number.isFinite(n));

	if (times.length) {
		const first = new Date(Math.min(...times));
		const last = new Date(Math.max(...times));
		const fmt = d => d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
		const firstEl = document.getElementById('firstDate');
		const lastEl = document.getElementById('lastDate');
		if (firstEl) firstEl.innerText = fmt(first);
		if (lastEl) lastEl.innerText = fmt(last);
	}

	// Tot tweets
	document.getElementById('numberTweets').innerText = tweet_array.length;

	// Cat count
	let completed = 0, live = 0, achievements = 0, misc = 0, writtenCompleted = 0;
	tweet_array.forEach(t => {
		if (t.source === 'completed_event') {
			completed++;
			if (t.written) writtenCompleted++;
		} else if (t.source === 'live_event') {
			live++;
		} else if (t.source === 'achievement') {
			achievements++;
		} else {
			misc++;
		}
	});

	// Percent helper
	const total = tweet_array.length;
	const pct = (x) => ((100 * x) / total).toFixed(2) + '%';

	// DOM
	document.querySelectorAll('.completedEvents').forEach(el => el.innerText = completed);
	document.querySelectorAll('.completedEventsPct').forEach(el => el.innerText = pct(completed));

	document.querySelectorAll('.liveEvents').forEach(el => el.innerText = live);
	document.querySelectorAll('.liveEventsPct').forEach(el => el.innerText = pct(live));

	document.querySelectorAll('.achievements').forEach(el => el.innerText = achievements);
	document.querySelectorAll('.achievementsPct').forEach(el => el.innerText = pct(achievements));

	document.querySelectorAll('.miscellaneous').forEach(el => el.innerText = misc);
	document.querySelectorAll('.miscellaneousPct').forEach(el => el.innerText = pct(misc));

	document.querySelectorAll('.written').forEach(el => el.innerText = writtenCompleted);
	document.querySelectorAll('.writtenPct').forEach(el => el.innerText = completed > 0 ? ((100 * writtenCompleted) / completed).toFixed(2) + '%' : '0%');
}

document.addEventListener('DOMContentLoaded', function () {
	loadSavedRunkeeperTweets().then(parseTweets);
});

