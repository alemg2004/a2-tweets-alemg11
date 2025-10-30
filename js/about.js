function parseTweets(runkeeper_tweets) {
	//Dont proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});
	
	//This line modifies the DOM, searching for the tag with the numberTweets ID and updating the text.
	//It works correctly, your task is to update the text of the other tags in the HTML file!
	document.getElementById('numberTweets').innerText = tweet_array.length;	

	// classify by source
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

	// totals
	const total = tweet_array.length;
	const pct = (x) => ((100 * x) / total).toFixed(2) + '%';

	// update HTML fields
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

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});
