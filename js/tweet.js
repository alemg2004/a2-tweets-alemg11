"use strict";
class Tweet {
    text;
    time;
    constructor(tweet_text, tweet_time) {
        this.text = tweet_text;
        this.time = new Date(tweet_time);
    }

    get source() {
        if (/\b(watch\s+my|live)\b/i.test(this.text)) {
            return 'live_event';
        }
        if (/Just\s+completed/i.test(this.text)) {
            return 'completed_event';
        }
        if (/\b(achiev|PR|personal\s+record|milestone|goal)\b/i.test(this.text)) {
            return 'achievement';
        }
        return 'miscellaneous';
    }

    get written() {
        if (this.source === 'completed_event') {
            const i = this.text.indexOf(' - ');
            if (i >= 0) {
                const after = this.text.slice(i + 3)
                    .replace(/https?:\/\/\S+/g, '')
                    .replace(/#[A-Za-z0-9_]+/g, '')
                    .trim();
                return after.length > 0;
            }
            return false;
        }
        const cleaned = this.text
            .replace(/https?:\/\/\S+/g, '')
            .replace(/#[A-Za-z0-9_]+/g, '')
            .replace(/@[A-Za-z0-9_]+/g, '')
            .replace(/Just\s+completed.*?#RunKeeper/i, '')
            .replace(/Check\s+out\s+my\s+activity\s+on\s+RunKeeper/i, '')
            .trim();
        return cleaned.length > 0;
    }
    
    get writtenText() {
        if (!this.written) {
            return "";
        }
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
        return this.text
            .replace(/https?:\/\/\S+/g, '')
            .replace(/#[A-Za-z0-9_]+/g, '')
            .replace(/@[A-Za-z0-9_]+/g, '')
            .replace(/Just\s+completed.*?(?=\s-\s|$)/i, '')
            .replace(/Check\s+out\s+my\s+activity\s+on\s+RunKeeper/i, '')
            .trim();
    }
    
    get activityType() {
        if (this.source !== 'completed_event') {
            return "unknown";
        }
        if (/\brun(ning|)\b/i.test(this.text)) return "run";
        if (/\bwalk(ed|ing|)\b/i.test(this.text)) return "walk";
        if (/\b(bike|biked|cycling|ride)\b/i.test(this.text)) return "bike";
        if (/\bski(ing|ed|)\b/i.test(this.text)) return "ski";
        if (/\bswim(ming|)\b/i.test(this.text)) return "swim";
        if (/\bhik(e|ed|ing)\b/i.test(this.text)) return "hike";
        return "other";
    }
    
    get distance() {
        if (this.source !== 'completed_event') {
            return 0;
        }
        const m = this.text.match(/(\d+(?:\.\d+)?)\s*(mi|miles?|km|kilometers?)/i);
        if (!m) return 0;
        const val = parseFloat(m[1]);
        const unit = m[2].toLowerCase();
        const km = unit.startsWith('mi') ? val * 1.60934 : val;
        return Math.round(km * 100) / 100;
    }
    
    getHTMLTableRow(rowNumber) {
        const urlMatch = this.text.match(/https?:\/\/\S+/);
        const url = urlMatch ? urlMatch[0] : "";

        const type = (this.activityType === "unknown") ? "" : this.activityType;

        const escape = (s) => s.replace(/[&<>"']/g, c => ({ 
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' 
        }[c]));
        
        const safeText = escape(this.text);
        const link = url ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${safeText}</a>` : safeText;
        
        return `<tr>
  <th scope="row">${rowNumber}</th>
  <td>${escape(type)}</td>
  <td>${link}</td>
</tr>`;
    }
}
