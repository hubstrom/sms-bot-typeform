var config = {
  postgre_frank: {
    user: 'frank', //env var: PGUSER
    database: 'frankdb', //env var: PGDATABASE
    password: 'franky16', //env var: PGPASSWORD
    host: 'frank-db.cnclrohkwsvd.us-east-1.rds.amazonaws.com', // Server hosting the postgres database
    port: 5432, //env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    ssl: true},
  postgre_dropbyke: {
    user: 'report', //env var: PGUSER
    database: 'dropbyke', //env var: PGDATABASE
    password: 'enterprydropbyketree', //env var: PGPASSWORD
    host: 'api.dropbyke.com', // Server hosting the postgres database
    port: 5432, //env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    ssl: true},
  slack: {
    token: 'xoxb-97614335619-WZdnGWWwTYDJqTrka0ULMXRW',
    name: 'frank'
  },
  nodegeocoder: {
    provider: 'google'
  },
  twilio: {
    accountSid: 'AC8b68c7de5ec05ae3f9d93d0a097dab27',
    authToken: '44759edfafcb50d1072942c7daacb6a0'
  },
  postgreMotivated: {
    host: 'ec2-54-235-119-27.compute-1.amazonaws.com',
    database: 'dcvc7305m4ide3',
    user: 'gqrkknkpqyaxqd',
    port: '5432',
    password: '3ae175079a743ef3d8b850f1c098deed24a7a556e8208b6c56ed0b5473ee270c',
    ssl: true,
    max: 10,
    idleTimeoutMillis: 30000
  }
  };
module.exports = config;
