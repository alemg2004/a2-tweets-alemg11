"use strict";
class Tweet {
    text;
    time;
    constructor(tweet_text, tweet_time) {
        this.text = tweet_text;
        this.time = new Date(tweet_time); //, "ddd MMM D HH:mm:ss Z YYYY"
    }
    //returns either 'live_event', 'achievement', 'completed_event', or 'miscellaneous'
    get source() {
        // Detect live 1st
        if (/\b(live|watch my run live)\b/i.test(this.text)) {
            return 'live_event';
        }
        // Completed activity temp
        if (/Just completed/i.test(this.text)) {
            return 'completed_event';
        }
        // Achievements / PRs / milestones
        if (/\b(achiev|PR|personal\s+record|milestone|goal)\b/i.test(this.text)) {
            return 'achievement';
        }
        return 'miscellaneous';
    }
    //returns boolean whether text includes any content written by the person tweeting
    get written() {
        // For completed events user comm follows " - "
        if (this.source === 'completed_event') {
            const i = this.text.indexOf(' - ');
            if (i >= 0) {
                const after = this.text.slice(i + 3).replace(/https?:\/\/\S+/g, '').replace(/#[A-Za-z0-9_]+/g, '').trim();
                return after.length > 0;
            }
        }
        // Otherwise treat any non-tem as written
        const cleaned = this.text
            .replace(/https?:\/\/\S+/g, '')
            .replace(/#[A-Za-z0-9_]+/g, '')
            .replace(/@[A-Za-z0-9_]+/g, '')
            .replace(/Just completed.*?#RunKeeper/i, '')
            .replace(/Check out my activity on RunKeeper/i, '')
            .trim();
        return cleaned.length > 0;
    }
    get writtenText() {
        if (!this.written) {
            return "";
        }
        // Prefer commentary after " - " for completed events
        if (this.source === 'completed_event') {
            const i = this.text.indexOf(' - ');
            if (i >= 0) {
                return this.text
                    .slice(i + 3)
                    .replace(/https?:\/\/\S+/g, '')
                    .replace(/#[A-Za-z0-9_]+/g, '')
                    .trim();
            }
        }
        // Fallback= remove obv template leadins and return rem
        return this.text
            .replace(/https?:\/\/\S+/g, '')
            .replace(/#[A-Za-z0-9_]+/g, '')
            .replace(/@[A-Za-z0-9_]+/g, '')
            .replace(/Just completed.*?#RunKeeper/i, '')
            .replace(/Check out my activity on RunKeeper/i, '')
            .trim();
    }
    get activityType() {
        if (this.source != 'completed_event') {
            return "unknown";
        }
        if (/\brun(ning|)\b/i.test(this.text))
            return "run";
        if (/\bwalk(ed|ing|)\b/i.test(this.text))
            return "walk";
        if (/\b(bike|biked|cycling|ride)\b/i.test(this.text))
            return "bike";
        return "other";
    }
    get distance() {
        if (this.source != 'completed_event') {
            return 0;
        }
        // Find first distance with unit to km
        const m = this.text.match(/(\d+(?:\.\d+)?)\s*(mi|miles|km|kilometers?)/i);
        if (!m)
            return 0;
        const val = parseFloat(m[1]);
        const unit = m[2].toLowerCase();
        const km = unit.startsWith('mi') ? val * 1.60934 : val;
        return Math.round(km * 100) / 100;
    }
    getHTMLTableRow(rowNumber) {
        // 1st URL if present is used as the clickable link
        const urlMatch = this.text.match(/https?:\/\/\S+/);
        const url = urlMatch ? urlMatch[0] : "";
        // Activity type cell mirrors table header
        const type = (this.activityType === "unknown") ? "" : this.activityType;
        // Basic HTML escape (safety)
        const escape = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const safeText = escape(this.text);
        const link = url ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${safeText}</a>` : safeText;
        return `<tr>
  <th scope="row">${rowNumber}</th>
  <td>${escape(type)}</td>
  <td>${link}</td>
</tr>`;
    }
}
