# SMS bot with typeform integration

## Status and workflow:
### 1st Stage: *Communication*
1. On specific time application scans ALL entries in the form
2. Takes phone number and some additional choices from each ROW
3. [MASS SEND] Each phone number gets template SMS message with their choices (if chosen this date)
4. Each user responds Yes/No
5. After Response they get template answer based on Yes/No

### 2nd Stage: *Leaderboard*
1. User phone number and response is being logged in the database
2. Scan leaderboard
3. Create realtime reporting
