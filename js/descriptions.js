function parseTweets(runkeeper_tweets) {
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	const rows = Array.isArray(runkeeper_tweets) ? runkeeper_tweets : [];
	const tweets = rows.map(t => new Tweet(
		t.text || t.tweet || '',
		t.time || t.created_at || ''
	));
	const written = tweets.filter(t => t.written);

	window.writtenTweets = written;

	const tbody = document.getElementById('tweetTable');
	if (tbody) {
		tbody.innerHTML = written.map((tw, i) => tw.getHTMLTableRow(i + 1)).join('');
	}
	const countEl = document.getElementById('searchCount');
	if (countEl) countEl.textContent = String(written.length);
	const textEl = document.getElementById('searchText');
	if (textEl) textEl.textContent = '';
}

function addEventHandlerForSearch() {
	const input = document.getElementById('textFilter');
	const tbody = document.getElementById('tweetTable');
	const countEl = document.getElementById('searchCount');
	const textEl = document.getElementById('searchText');

	if (!input || !tbody) return;

	const render = (list, q) => {
		tbody.innerHTML = list.map((tw, i) => tw.getHTMLTableRow(i + 1)).join('');
		if (countEl) countEl.textContent = String(list.length);
		if (textEl)  textEl.textContent  = q || '';
	};

	input.addEventListener('input', (e) => {
		const q = (e.target.value || '').trim().toLowerCase();
		const base = Array.isArray(window.writtenTweets) ? window.writtenTweets : [];
		if (!q) { render(base, ''); return; }
		const filtered = base.filter(tw => tw.writtenText.toLowerCase().includes(q) || tw.text.toLowerCase().includes(q));
		render(filtered, q);
	});
}

document.addEventListener('DOMContentLoaded', function (event) {
	addEventHandlerForSearch();
	loadSavedRunkeeperTweets().then(parseTweets);
});
