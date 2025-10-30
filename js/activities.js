function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}
	
	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

	//TODO: create a new array or manipulate tweet_array to create a graph of the number of tweets containing each type of activity.
	// Count tweets by activity type use Tweet.activityType and sort by frequency
	const activityCountMap = new Map();
	tweet_array.forEach(t => {
		const type = (t.activityType || 'other');
		activityCountMap.set(type, (activityCountMap.get(type) || 0) + 1);
	});
	const activity_counts = Array.from(activityCountMap, ([activity, count]) => ({ activity, count }))
		.sort((a,b) => b.count - a.count);

	// Fill summary spans number of unique activities, top3
	const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
	setText('numberActivities', String(activity_counts.length));
	setText('firstMost', activity_counts[0] ? activity_counts[0].activity : '—');
	setText('secondMost', activity_counts[1] ? activity_counts[1].activity : '—');
	setText('thirdMost', activity_counts[2] ? activity_counts[2].activity : '—');

	activity_vis_spec = {
	  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
	  "description": "A graph of the number of Tweets containing each type of activity.",
	  "data": {
	    "values": tweet_array
	  }
	  //TODO: Add mark and encoding
	  "mark": "bar",
	  "encoding": {
		"x": { "field": "activity", "type": "nominal", "title": "Activity type", "sort": "-y" },
		"y": { "field": "count", "type": "quantitative", "title": "Tweets" },
		"tooltip": [{ "field": "activity" }, { "field": "count" }]
	  }
	};
	vegaEmbed('#activityVis', activity_vis_spec, {actions:false});


	//TODO: create the visualizations which group the three most-tweeted activities by the day of the week.
	//Use those visualizations to answer the questions about which activities tended to be longest and when.

	// pick top3 activities
	const top3 = activity_counts.slice(0,3).map(d => d.activity);

	// build per tweet rows with distance in km, activity, and day of week/weekend flags
	const rows = tweet_array
		.filter(t => top3.includes(t.activityType) && t.distance > 0)
		.map(t => {
			const d = t.time instanceof Date ? t.time : new Date(t.time);
			const day = isNaN(d.getTime()) ? null : d.getUTCDay(); 
			const weekday = (day !== null) ? (day !== 0 && day !== 6) : true;
			return {
				Activity: t.activityType,
				DistanceKm: t.distance,
				DayOfWeek: day,
				Weekend: !weekday ? 'Weekend' : 'Weekday'
			};
		});

	// scatter of distances by activity colored by weekend orweekday
	const distanceVisSpec = {
		"$schema": "https://vega.github.io/schema/vega-lite/v5.json",
		"description": "Distances by activity for the top three activities (points).",
		"data": { "values": rows },
		"mark": { "type": "circle", "opacity": 0.6 },
		"encoding": {
			"x": { "field": "Activity", "type": "nominal", "title": "Activity" },
			"y": { "field": "DistanceKm", "type": "quantitative", "title": "Distance (km)" },
			"color": { "field": "Weekend", "type": "nominal" },
			"tooltip": [
				{ "field": "Activity" },
				{ "field": "DistanceKm", "format": ".2f", "title": "Distance (km)" },
				{ "field": "Weekend" }
			]
		}
	};
	vegaEmbed('#distanceVis', distanceVisSpec, {actions:false});

	// agg means per activity
	const distanceVisAggregatedSpec = {
		"$schema": "https://vega.github.io/schema/vega-lite/v5.json",
		"description": "Mean distance per activity (top three).",
		"data": { "values": rows },
		"mark": "bar",
		"encoding": {
			"x": { "field": "Activity", "type": "nominal", "title": "Activity" },
			"y": { "aggregate": "mean", "field": "DistanceKm", "type": "quantitative", "title": "Mean distance (km)" },
			"tooltip": [{ "aggregate": "mean", "field": "DistanceKm", "format": ".2f" }]
		}
	};

	const aggregateBtn = document.getElementById('aggregate');
	if (aggregateBtn) {
		aggregateBtn.addEventListener('click', () => {
			vegaEmbed('#distanceVisAggregated', distanceVisAggregatedSpec, {actions:false});
		});
	}

	// compute longest orshortest among top3 by avg dis
	function mean(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }

	const byActivity = top3.map(a => {
		const dists = rows.filter(r => r.Activity === a).map(r => r.DistanceKm);
		return { activity: a, avg: mean(dists) };
	}).sort((a,b)=>b.avg-a.avg);

	const longest = byActivity[0]?.activity || '';
	const shortest = byActivity[byActivity.length-1]?.activity || '';

	setText('longestActivityType', longest || '—');
	setText('shortestActivityType', shortest || '—');

	// for longest activity check whether weekend or weekday distances are longer on avg
	if (longest) {
		const subset = rows.filter(r => r.Activity === longest);
		const wkendAvg = mean(subset.filter(r => r.Weekend === 'Weekend').map(r => r.DistanceKm));
		const wkdayAvg = mean(subset.filter(r => r.Weekend === 'Weekday').map(r => r.DistanceKm));
		setText('weekdayOrWeekendLonger', (wkendAvg >= wkdayAvg) ? 'weekends' : 'weekdays');
	}
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});
