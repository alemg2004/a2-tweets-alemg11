function parseTweets(runkeeper_tweets) {
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}
	
	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

	const activityCountMap = new Map();
	tweet_array.forEach(t => {
		const type = (t.activityType || 'other');
		activityCountMap.set(type, (activityCountMap.get(type) || 0) + 1);
	});
	const activity_counts = Array.from(activityCountMap, ([activity, count]) => ({ activity, count }))
		.sort((a,b) => b.count - a.count);

	const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
	setText('numberActivities', String(activity_counts.length));
	setText('firstMost', activity_counts[0] ? activity_counts[0].activity : '—');
	setText('secondMost', activity_counts[1] ? activity_counts[1].activity : '—');
	setText('thirdMost', activity_counts[2] ? activity_counts[2].activity : '—');

	activity_vis_spec = {
		"$schema": "https://vega.github.io/schema/vega-lite/v5.json",
		"description": "A graph of the number of Tweets containing each type of activity.",
		"data": {
			"values": activity_counts
		},
		"mark": "bar",
		"encoding": {
			"x": { "field": "activity", "type": "nominal", "title": "Activity type", "sort": "-y" },
			"y": { "field": "count", "type": "quantitative", "title": "Tweets" },
			"tooltip": [{ "field": "activity" }, { "field": "count" }]
		}
	};
	vegaEmbed('#activityVis', activity_vis_spec, {actions:false});

	const top3 = activity_counts.slice(0,3).map(d => d.activity);

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

	const distanceVisSpec = {
		"$schema": "https://vega.github.io/schema/vega-lite/v5.json",
		"description": "Distances by day of week for the top three activities.",
		"data": { "values": rows },
		"mark": { "type": "circle", "opacity": 0.6 },
		"encoding": {
			"x": { 
				"field": "DayOfWeek", 
				"type": "ordinal", 
				"title": "Day of Week",
				"scale": {
					"domain": [0, 1, 2, 3, 4, 5, 6]
				},
				"axis": {
					"labelExpr": "datum.value == 0 ? 'Sun' : datum.value == 1 ? 'Mon' : datum.value == 2 ? 'Tue' : datum.value == 3 ? 'Wed' : datum.value == 4 ? 'Thu' : datum.value == 5 ? 'Fri' : 'Sat'"
				}
			},
			"y": { "field": "DistanceKm", "type": "quantitative", "title": "Distance (km)" },
			"color": { "field": "Activity", "type": "nominal" },
			"tooltip": [
				{ "field": "Activity" },
				{ "field": "DistanceKm", "format": ".2f", "title": "Distance (km)" },
				{ "field": "DayOfWeek", "title": "Day" }
			]
		}
	};
	vegaEmbed('#distanceVis', distanceVisSpec, {actions:false});

	const distanceVisAggregatedSpec = {
		"$schema": "https://vega.github.io/schema/vega-lite/v5.json",
		"description": "Mean distance by day of week for the top three activities.",
		"data": { "values": rows },
		"mark": "bar",
		"encoding": {
			"x": { 
				"field": "DayOfWeek", 
				"type": "ordinal", 
				"title": "Day of Week",
				"scale": {
					"domain": [0, 1, 2, 3, 4, 5, 6]
				},
				"axis": {
					"labelExpr": "datum.value == 0 ? 'Sun' : datum.value == 1 ? 'Mon' : datum.value == 2 ? 'Tue' : datum.value == 3 ? 'Wed' : datum.value == 4 ? 'Thu' : datum.value == 5 ? 'Fri' : 'Sat'"
				}
			},
			"y": { "aggregate": "mean", "field": "DistanceKm", "type": "quantitative", "title": "Mean distance (km)" },
			"color": { "field": "Activity", "type": "nominal" },
			"tooltip": [
				{ "field": "Activity" },
				{ "aggregate": "mean", "field": "DistanceKm", "format": ".2f", "title": "Mean Distance (km)" }
			]
		}
	};

	const aggregateBtn = document.getElementById('aggregate');
	if (aggregateBtn) {
		aggregateBtn.addEventListener('click', () => {
			vegaEmbed('#distanceVisAggregated', distanceVisAggregatedSpec, {actions:false});
		});
	}

	function mean(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }

	const byActivity = top3.map(a => {
		const dists = rows.filter(r => r.Activity === a).map(r => r.DistanceKm);
		return { activity: a, avg: mean(dists) };
	}).sort((a,b)=>b.avg-a.avg);

	const longest = byActivity[0]?.activity || '';
	const shortest = byActivity[byActivity.length-1]?.activity || '';

	setText('longestActivityType', longest || '—');
	setText('shortestActivityType', shortest || '—');

	if (longest) {
		const subset = rows.filter(r => r.Activity === longest);
		const wkendAvg = mean(subset.filter(r => r.Weekend === 'Weekend').map(r => r.DistanceKm));
		const wkdayAvg = mean(subset.filter(r => r.Weekend === 'Weekday').map(r => r.DistanceKm));
		setText('weekdayOrWeekendLonger', (wkendAvg >= wkdayAvg) ? 'weekends' : 'weekdays');
	}
}

//Wait for DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});
