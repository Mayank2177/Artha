import feedparser

# Test all ET RSS URLs from the blueprint
urls = {
    'tax (config)':      'https://economictimes.indiatimes.com/wealth/tax/rssfeeds/55168307.cms',
    'tax (blueprint)':   'https://economictimes.indiatimes.com/wealth/tax/rssfeeds/837555174.cms',
    'wealth':            'https://economictimes.indiatimes.com/wealth/rssfeeds/837555174.cms',
    'markets':           'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
}

for name, url in urls.items():
    feed = feedparser.parse(url)
    print(f'{name}: status={feed.get("status", "?")} entries={len(feed.entries)}')
