const {initializeApp, cert} = require('firebase-admin/app');
const firebaseConfig = require('../config/firebaseConfig');
const {getFirestore} = require('firebase-admin/firestore')
const { getStorage } = require('firebase-admin/storage');

initializeApp({
  credential: cert(firebaseConfig.serviceAccount),
  storageBucket: 'gs://astrologyapp-cfdde.appspot.com',
  databaseURL: "https://astrologyapp-cfdde-default-rtdb.firebaseio.com"
});

const db = getFirestore();
const bucket = getStorage().bucket();

module.exports = { db, bucket };
