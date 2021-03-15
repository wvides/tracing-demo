const mongoHost = process.env.MONGO_HOST || 'localhost';
const MongoClient = require('mongodb').MongoClient;
const url = `mongodb://${mongoHost}:27017`;
var dbclient;

function connect(callback) {
  const dbName = 'db';
  MongoClient.connect(url, function(err, client) {
    if (err) {
      // TODO replace with winston
      console.log(`An error ocurred while connecting to the database ${err}`);
      return callback(err);
    }
    console.log("Connected successfully to server");
    dbclient = client.db(dbName);
    client.close();
    return callback(null);
  });  
}

module.exports = connect;